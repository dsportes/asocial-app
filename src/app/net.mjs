import axios from 'axios'
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { isAppExc, AppExc, version, E_BRO, E_SRV, E_BRK } from './api.mjs'

const headers = { 'x-api-version': version }

const decoder = new TextDecoder('utf-8')

export async function ping () {
  const config = stores.config
  const ui = stores.ui
  const u = config.opsrv + 'yoyo'
  ui.afficherMessage('ping - ' + u)
  try {
    const r = await axios({
      method: 'get',
      url: u,
      responseType: 'text',
      timeout: config.debug ? 50000000 : 5000
    })
    ui.afficherMessage(r.data)
    return r.data
  } catch (e) {
    return '$KO : ' + e.message()
  }
}

export async function getEstFs () {
  const config = stores.config
  const u = 'https://' + config.srv + '/fs'
  try {
    const r = await axios({
      method: 'get',
      url: u,
      responseType: 'text',
      timeout: config.debug ? 50000000 : 5000
    })
    return r.data === 'true' ? true : false
  } catch (e) {
    procEx(e)
  }
}

/*
Envoi une requête GET :
- fonction : code de la fonction
- args : objet avec les arguments qui seront transmis en query string
Retour :
- OK : les bytes demandés
- KO : null
*/
export async function get (fonction, args) {
  const cfg = stores.config
  try {
    const u = cfg.opsrv + fonction
    const r = await axios({
      method: 'get',
      url: u,
      params: args,
      headers: headers,
      responseType: 'arraybuffer',
      timeout: cfg.debug ? 50000000 : 5000
    })
    if (r.status === 200) {
      return new Uint8Array(r.data)
    } else {
      throw new AppExc(E_SRV, 0, [r.statusText])
    }
  } catch (e) {
    procEx(e)
  }
}

/*
Envoi une requête POST :
- op : opération émettrice. Requise si interruptible, sinon facultative
- fonction : classe de l'opération invoquée
- args : objet avec les arguments qui seront transmis dans le body de la requête. Encodé par avro ou JSONStringify
Retour :
- OK : l'objet retourné par la fonction demandée - HTTP 400 : le résultat est un AppExc
Exception : un AppExc avec les propriétés code, message, stack
*/
export async function post (op, fonction, args) {
  let buf
  const config = stores.config
  try {
    if (op) op.BRK()
    //const data = new Uint8Array(encode(args))
    const data = new Uint8Array(encode([args, process.env.APITK]))
    const u = config.opsrv + fonction
    if (op) op.cancelToken = axios.CancelToken.source()
    const par = { method: 'post', url: u, data: data, headers: headers, responseType: 'arraybuffer' }
    if (op) par.cancelToken = op.cancelToken.token
    const r = await axios(par)
    if (op) op.cancelToken = null
    if (op) op.BRK()
    // buf = new Uint8Array(r.data)
    buf = r.data
  } catch (e) {
    procEx(e, op)
  }
  // les status HTTP non 2xx sont tombés en exception
  try {
    return decode(buf)
  } catch (e) { // Résultat mal formé
    throw new AppExc(E_BRO, 2, [op ? op.nom : '', e.message])
  }
}

function procEx (e, op) {
  // Exceptions jetées par le this.BRK au-dessus)
  if (isAppExc(e) && e.majeur * 1000 === E_BRK) throw e
  if (axios.isCancel(e)) throw new AppExc(E_BRK)

  const status = (e.response && e.response.status) || 0
  if (status >= 400 && status <= 403) {
    /*
    400 : F_SRV fonctionnelles
    401 : A_SRV assertions
    402 : E_SRV exception inattendue trappée dans le traitement
    403 : E_SRV exception inattendue NON trappée dans le traitement
    */
    let ex
    try {
      const x = JSON.parse(decoder.decode(e.response.data))
      ex = new AppExc(Math.floor(x.code / 1000) * 1000, x.code % 1000, x.args, x.stack)
    } catch (e2) {
      throw new AppExc(E_BRO, 1, [op ? op.nom : '', e2.message])
    }
    throw ex
  } else { 
    // inattendue, pas mise en forme (500 et autres)
    const code = !status ? 100 : (status >= 500 && status <= 599 ? 101 : 0)
    throw new AppExc(E_SRV, code, [status, e.message])
  }
}

// Utilisé pour obtenir le texte depuis une URL sur le stockage de fichier
export async function getData (url) {
  try {
    const r = await axios({ method: 'get', url, responseType: 'arraybuffer' })
    return new Uint8Array(r.data)
  } catch (e) {
    if (e.response && e.response.status === 404) {
      const txt = decoder.decode(e.response.data)
      throw new AppExc(E_SRV, 0, [txt])
    }
    throw new AppExc(E_SRV, 0, [e.message])
  }
}

export async function putData (url, data) {
  try {
    const r = await axios({ method: 'put', url, data: data })
    return r.status === 200 ? null : 'Status:' + r.statusText
  } catch (e) {
    return e.toString()
  }
}