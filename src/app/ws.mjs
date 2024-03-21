/* gestion WebSocket */
import stores from '../stores/stores.mjs'
import { decode } from '@msgpack/msgpack'

import { AppExc, E_WS } from './api.mjs'
import { syncQueue } from './synchro.mjs'
import { dhstring } from './util.mjs'

export class WS {
  constructor () {
    this.ws = null
    this.exc = null
  }

  // // 'Erreur à l\'ouverture de la connexion avec le serveur ( {0} ).\nDétail: {1}',
  EX0 (e) { return new AppExc(E_WS, 0, [stores.config.wssrv, e.message]) }

  // 'Ouverture de la connexion avec le serveur impossible ( {0} ).',
  EX1 () { return new AppExc(E_WS, 1, [stores.config.wssrv]) }

  // 'Envoi d\'un message au serveur impossible ( {0} ).\nDétail: {1}',
  EX2 (e) { return new AppExc(E_WS, 2, [stores.config.wssrv, e.message]) }

  // 'Rupture de la liaison avec le serveur par le serveur ou URL mal configurée ( {0} ).',
  EX3 () { return new AppExc(E_WS, 3, [stores.config.wssrv])}

  close () {
    if (this.ws) { try { this.ws.close(); this.ws = null} catch (e) { this.ws = null } }
  }

  setExc (e) {
    this.exc = e
    console.error('Exception ws : ' + e.code + ' wss: ' + stores.config.wssrv)
    this.close()
    if (stores.session.status > 0) stores.ui.afficherExc(e) // pas de await !
  }

  async open () {
    const session = stores.session
    const config = stores.config
    const sessionId = session.sessionId
    return new Promise((resolve, reject) => {
      try {
        this.exc = null
        this.ws = new WebSocket(config.wssrv)
        this.ws.onerror = (e) => {
          this.setExc(this.EX1())
          reject()
        }
        this.ws.onclose = () => { /* fermeture du webSocket par le serveur alors que la session est encore vivante */
          if (session.sessionId === sessionId) this.setExc(this.exc || this.EX3())
        }
        this.ws.onmessage = this.onmessage
        this.ws.onopen = (event) => {
          try { // enregistrement de sessionId sur ce socket
            this.ws.send(session.sessionId)
            resolve()
          } catch (e) {
            reject(this.EX2(e))
          }
        }
      } catch (e) { // Sur erreur d'URL (mauvais schéma)
        const ex = this.EX0(e)
        this.setExc(ex)
        reject(ex)
      }
    })
  }

  async onmessage (m) {
    const session = stores.session
    if (!session.status) return

    const ab = await m.data.arrayBuffer()
    const msg = new Uint8Array(ab)
    const sl = decode(msg) // syncList : { sessionId, rows[] }
    if (sl.pong) {
      console.log('pong ' + sl.sessionId + ' ' + dhstring(sl.dh, true))
    } else {
      if (sl.sessionId === session.sessionId && sl.rows && sl.rows.length)
        await syncQueue.setRows(sl.rows)
    }
  }

}