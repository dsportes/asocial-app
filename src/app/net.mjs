import axios from 'axios'
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { isAppExc, AppExc, E_BRO, E_SRV, E_BRK } from './api.mjs'
import { syncQueue } from './synchro.mjs'

const decoder = new TextDecoder('utf-8')

export async function ping () {
  const config = stores.config
  const ui = stores.ui
  const u = config.OPURL + 'yoyo'
  ui.afficherMessage('ping - ' + u)
  try {
    const r = await axios({
      method: 'get',
      url: u,
      responseType: 'text',
      timeout: 5000
    })
    ui.afficherMessage(r.data)
    return r.data
  } catch (e) {
    return '$KO : ' + e.message()
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
    const u = cfg.OPURL + fonction
    const r = await axios({
      method: 'get',
      url: u,
      params: args,
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
Envoi une requête POST au service PUBSUB :
- args : arguments qui seront transmis dans le body de la requête.
Retour :
- n : le code retour (nhb)
- 0 : erreur
*/
export async function pubsub (fonction, args) {
  let buf
  const config = stores.config
  const u = config.PUBSUBURL + fonction
  try {
    const data = new Uint8Array(encode(args))
    const par = { method: 'post', url: u, data: data, responseType: 'text' }
    const r = await axios(par)
    try {
      return JSON.parse(r.data)
    } catch (e) {
      console.log('PUBSUB ' + fonction + ' exc: ', e.toString())
      return 0  
    }  
  } catch (e) {
    const status = (e.response && e.response.status) || 0
    if (status === 400 || status === 403) {
      console.log('PUBSUB ' + fonction + ' exc: ', e.response.data)
    } else { 
      // inattendue, pas mise en forme (500 et autres)
      const code = !status ? 100 : (status >= 500 && status <= 599 ? 101 : 0)
      const ex = new AppExc(E_SRV, code, [status, (u || '?'), e.message])
      console.log('PUBSUB ' + fonction + ' exc: ', e.toString())
    }
    return 0
  }
}

/*
Envoi une requête POST :
- op : opération émettrice. Requise si interruptible, sinon facultative
- fonction : classe de l'opération invoquée
- args : objet avec les arguments qui seront transmis encodé dans le body de la requête.
Retour :
- OK : l'objet retourné par la fonction demandée 
HTTP 400 : le résultat est un AppExc
Exception : un AppExc avec les propriétés code, message, stack
*/
export async function post (op, fonction, args) {
  let buf
  const config = stores.config
  const session = stores.session
  let u
  try {
    if (op) op.BRK()
    const data = new Uint8Array(encode(args))
    u = config.OPURL + fonction
    if (op) op.cancelToken = axios.CancelToken.source()
    const par = { method: 'post', url: u, data: data, responseType: 'arraybuffer' }
    if (op) par.cancelToken = op.cancelToken.token
    const r = await axios(par)
    if (op) op.cancelToken = null
    if (op) op.BRK()
    // buf = new Uint8Array(r.data)
    buf = r.data
  } catch (e) {
    procEx(e, op, u)
  }
  // les status HTTP non 2xx sont tombés en exception
  try {
    const resp = decode(buf)
    if (resp) {
      if (resp.dh) session.setDh(resp.dh)
      if (resp.conso) session.setConso(resp.conso)
      if (resp.trlog) 
        syncQueue.synchro(resp.trlog)
      if (resp.nhb !== undefined) session.setNhb(resp.nhb)
    }
    return resp
  } catch (e) { // Résultat mal formé
    throw new AppExc(E_BRO, 2, [op ? op.label: '', e.message])
  }
}

function procEx (e, op, u) {
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
      ex = new AppExc(E_BRO, 1, [op ? op.nom : '', e2.message])
    }
    throw ex
  } else { 
    // inattendue, pas mise en forme (500 et autres)
    console.log('URL de POST: ', u || '?')
    const code = !status ? 100 : (status >= 500 && status <= 599 ? 101 : 0)
    throw new AppExc(E_SRV, code, [status, (u || '?'), e.message])
  }
}

// Utilisé pour obtenir le texte depuis une URL sur le stockage de fichier
export async function getData (url, nf) {
  const r = await axios({ 
    method: 'get', 
    url, 
    responseType: 'arraybuffer' 
  })
  return new Uint8Array(r.data)
  // Exception : e.message
}

export async function putData (url, data) {
  try {
    const r = await axios({ 
      method: 'put', 
      url, 
      data: data,
      headers: { // OBLIGATOIRE pour putUrl
        'Content-Type': 'application/octet-stream'
      }
    })
    return r.status === 200 ? null : 'Status:' + r.statusText
  } catch (e) {
    return e.message
  }
}
