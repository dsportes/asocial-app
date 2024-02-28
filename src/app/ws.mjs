/* gestion WebSocket */
import stores from '../stores/stores.mjs'
import { decode } from '@msgpack/msgpack'

import { AppExc, E_WS } from './api.mjs'
import { SyncQueue } from './sync.mjs'

let ws, exc

function reset () {
  ws = null
  exc = null
}

// // 'Erreur à l\'ouverture de la connexion avec le serveur ( {0} ).\nDétail: {1}',
function EX0 (e) { return new AppExc(E_WS, 0, [config.wssrv, e.message]) }

// 'Ouverture de la connexion avec le serveur impossible ( {0} ).',
function EX1 () { return new AppExc(E_WS, 1, [config.wssrv]) }

// 'Envoi d\'un message au serveur impossible ( {0} ).\nDétail: {1}',
function EX2 (e) { return new AppExc(E_WS, 2, [config.wssrv, e.message]) }

// 'Rupture de la liaison avec le serveur par le serveur ou URL mal configurée ( {0} ).',
function EX3 () { return new AppExc(E_WS, 3, [config.wssrv])}

export function closeWS () {
  if (ws) { try { ws.close(); } catch (e) { } }
}

function setExc (e) {
  exc = e
  config.logger.error('Exception ws : ' + e.code + ' wss: ' + config.wss)
  if (ws) { try { ws.close(); } catch (e) { } }
  if (stores.session.status > 0) stores.ui.afficherExc(e) // pas de await !
}

export async function openWS () {
  reset()
  const session = stores.session
  const sessionId = session.sessionId
  return new Promise((resolve, reject) => {
    try {
      exc = null
      ws = new WebSocket(config.wssrv)
      ws.onerror = (e) => {
        setExc(EX1())
        reject()
      }
      ws.onclose = () => { /* fermeture du webSocket par le serveur alors que la session est encore vivante */
        if (session.sessionId === sessionId) setExc(exc || EX3())
      }
      ws.onmessage = onmessage
      ws.onopen = (event) => {
        try { // enregistrement de sessionId sur ce socket
          ws.send(session.sessionId)
          resolve()
        } catch (e) {
          reject(EX2(e))
        }
      }
    } catch (e) { // Sur erreur d'URL (mauvais schéma)
      const ex = EX0(e)
      setExc(ex)
      reject(ex)
    }
  })
}

async function onmessage (m) {
  const session = stores.session
  if (!session.status) return

  const ab = await m.data.arrayBuffer()
  const msg = new Uint8Array(ab)
  const sl = decode(msg) // syncList : { sessionId, rows[] }
  if (sl.sessionId === session.sessionId && sl.rows && sl.rows.length)
    SyncQueue.push(sl.rows)
}
