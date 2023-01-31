import stores from '../stores/stores.mjs'
import { SyncQueue } from './sync.mjs'

export class FsSyncSession {
  constructor () { 
    this.session = stores.session
  }

  close () { } // PAS ASYNC !!! Déconnexion n'est async

  /*
  Mettre un row reçu à triter : SyncQueue.push(row)
  */
  async setCompte (id) {
    // TODO - s'abonner à la compta
  }
  async setTribu (id) {
    // TODO - s'abonner à la tribu
  }
  async setGroupe (id) {
    // TODO - s'abonner au groupe
  }
  async unsetTribu (id) {
    // TODO - s'abonner à la tribu
  }
  async unsetGroupe (id) {
    // TODO - s'abonner au groupe
  }
}