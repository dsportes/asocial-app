import stores from '../stores/stores.mjs'
import { SyncQueue } from './sync.mjs'

export class FsSyncSession {
  constructor () { 
    this.session = stores.session
  }

  /*
  Mettre un row reçu à triter : SyncQueue.push(row)
  */
  async setCompte () {
    // TODO - s'abonner à la compta : id this.session.compteId
  }
  async setTribu () {
    // TODO - s'abonner à la tribu : id this.session.tribuId
  }
  async setGroupe (id) {
    // TODO - s'abonner au groupe
  }
}