import stores from '../stores/stores.mjs'
import { SyncQueue } from './sync.mjs'

export class FsSyncSession {
  constructor () { 
    this.session = stores.session
  }

  close () { } // PAS ASYNC !!! Déconnexion n'est async

  // TODO
  /*
  Mettre un row reçu à traiter : SyncQueue.push(row)
  */
  async setCompte (id) {
  }
  async setTribu (id) {
  }
  async setGroupe (id) {
  }
  async setAvatar (id) {
  }
  async unsetTribu (id) {
  }
  async unsetGroupe (id) {
  }
  async unsetAvatar (id) {
  }
}