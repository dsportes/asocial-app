/* gestion WebSocket */
import stores from '../stores/stores.mjs'
import { decode } from '@msgpack/msgpack'

import { AppExc, E_WS, PINGTO } from './api.mjs'
import { SyncQueue } from './sync.mjs'

/* Pour être plus élégant, les function suivantes auraient dû être mises
en static d'une classe WS avec une instance créée à chaque openWS.
Bon mais ça marche.
*/

let url, pongrecu, debug, heartBeatTo, ws, exc, job = false

function reset () {
  url = ''
  pongrecu = false
  debug = false
  heartBeatTo = null
  ws = null
  exc = null
}

// // 'Erreur à l\'ouverture de la connexion avec le serveur ( {0} ).\nDétail: {1}',
function EX0 (e) { return new AppExc(E_WS, 0, [url, e.message]) }

// 'Ouverture de la connexion avec le serveur impossible ( {0} ).',
function EX1 () { return new AppExc(E_WS, 1, [url]) }

// 'Envoi d\'un message au serveur impossible ( {0} ).\nDétail: {1}',
function EX2 (e) { return new AppExc(E_WS, 2, [url, e.message]) }

// 'Rupture de la liaison avec le serveur par le serveur ou URL mal configurée ( {0} ).',
function EX3 () { return new AppExc(E_WS, 3, [url])}

// 'ping / pong : pong non reçu ( {0} ).',
function EX4 () { return new AppExc(E_WS, 4, [url]) }

export function closeWS () {
  if (heartBeatTo) { clearTimeout(heartBeatTo); heartBeatTo = null }
  if (ws) { try { ws.close(); } catch (e) { } }
}

function setExc (e) {
  console.log('Exception ws : ' + e.code + ' wss: ' + url)
  if (heartBeatTo) { clearTimeout(heartBeatTo); heartBeatTo = null }
  if (ws) { try { ws.close(); } catch (e) { } }
  if (stores.session.status > 0) stores.ui.afficherExc(e) // pas de await !
}

export async function openWS () {
  reset()
  const config = stores.config
  debug = config.DEBUG
  const session = stores.session
  const sessionId = session.sessionId
  return new Promise((resolve, reject) => {
    try {
      url = config.wssrv
      exc = null
      if (heartBeatTo) { clearTimeout(heartBeatTo); heartBeatTo = null }
      ws = new WebSocket(url)
      ws.onerror = (e) => {
        setExc(EX1())
        reject()
      }
      ws.onclose = () => {
        if (session.sessionId === sessionId) {
          /* fermeture du webSocket par le serveur ou par défaut de pong (exc non null)
          alors que la session est encore vivante */
          if (heartBeatTo) { clearTimeout(heartBeatTo); heartBeatTo = null }
          if (stores.session.status > 0) stores.ui.afficherExc(exc || EX3()) // pas de await !
        }
      }
      ws.onmessage = onmessage
      ws.onopen = (event) => {
        try {
          job = false
          ws.send(session.sessionId)
          heartBeat(session.sessionId)
          resolve()
        } catch (e) {
          reject(EX2(e))
        }
      }
    } catch (e) {
      // Sur erreur d'URL (mauvais schéma)
      const ex = EX0(e)
      setExc(ex)
      reject(ex)
    }
  })
}

async function onmessage (m) {
  const session = stores.session
  if (!session.status) return

  const sessionId = session.sessionId
  const ab = await m.data.arrayBuffer()
  const msg = new Uint8Array(ab)
  const syncList = decode(msg) // syncList : { sessionId, rows[] }
  if (syncList.sessionId !== sessionId) return

  const pong = !syncList.rows
  if (debug) console.log('Liste sync reçue - sessionId:' + syncList.sessionId + 
    (!pong ? 
      ' nb rows:' + syncList.rows.length :
      ' - pong: ' + new Date(syncList.dh).toISOString()))

  if (pong) {
    pongrecu = true
    if (session.status > 1 && session.sessionSync) {
      await session.sessionSync.setDhPong(syncList.dh)
    }
  } else {
    syncList.rows.forEach(row => { SyncQueue.push(row) })
  }
}

function heartBeat (sid) {
  const session = stores.session
  heartBeatTo = setTimeout(async () => {
    if (ws && session.sessionId === sid) {
      if (!pongrecu) {
        exc = EX4()
        ws.close()
        return
      }
      pongrecu = false
      ws.send(sid) // ping
      heartBeat(sid)
    }
  }, PINGTO * 1000 * (debug ? 1000 : 1))
}
