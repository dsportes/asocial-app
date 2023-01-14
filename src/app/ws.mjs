/* gestion WebSocket */
import stores from '../stores/stores.mjs'
import { decode } from '@msgpack/msgpack'

import { AppExc, E_WS, PINGTO } from './api.mjs'
import { SyncQueue } from './sync.mjs'

function dhtToString (dht) {
  return new Date(Math.floor(dht / 1000)).toISOString() + ' (' + (dht % 1000) + ')'
}


let url, pongrecu, debug, heartBeatTo, ws, exc, closeparsession = false, job = false

function reset () {
  url = ''
  pongrecu = false
  debug = false
  heartBeatTo = null
  ws = null
  exc = null
  closeparsession = false
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

export function closeWS (e) {
  closeparsession = true
  if (e) {
    setExc(e)
  } else {
    if (ws) { try { ws.close() } catch (e) {} }
  }
}

function setExc (e) {
  console.log('Exception ws : ' + e.code + ' wss: ' + url)
  exc = e
  if (ws) { try { ws.close() } catch (e) {} }
}

export async function openWS () {
  reset()
  const config = stores.config
  debug = config.debug
  const session = stores.session
  return new Promise((resolve, reject) => {
    try {
      url = config.urlwss
      if (debug) console.log('wss: ' + url)
      if (heartBeatTo) { clearTimeout(heartBeatTo); heartBeatTo = null }
      ws = new WebSocket(url)
      ws.onerror = (e) => {
        setExc(EX1())
        reject()
      }
      ws.onclose = () => {
        if (!closeparsession) {
          // fermeture du webSocket par le serveur
          exc = EX3()
        }
        ws = null
        if (heartBeatTo) { clearTimeout(heartBeatTo); heartBeatTo = null }
        if (exc && session.status > 0) stores.ui.afficherExc(exc) // pas de await !
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
    (!pong ? ' nb rows:' + syncList.rows.length : ' - pong: ' + dhtToString(syncList.dh)))

  if (pong) {
    pongrecu = true
    if (session.status > 1 && session.sessionSync) {
      await session.sessionSync.setDhPong(Math.floor(syncList.dh / 1000))
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
  }, PINGTO * 1000)
}
