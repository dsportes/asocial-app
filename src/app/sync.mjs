import { OperationWS } from './operations.mjs'

export class SyncQueue {
  static queue = []

  static push (row) {
    SyncQueue.queue.push(row)
    SyncQueue.traiterQueue()
  }

  static traiterQueue () {
    if (session.syncEncours || session.status < 2 || !SyncQueue.queue.length) return
    session.syncEncours = true
    const row = SyncQueue.queue.splice(0, 1)
    setTimeout(async () => {
      session.syncEncours = true
      const op = row._nom === 'comptas' ? new OnchangeCompta() :
       (row._nom === 'groupes'  ? new OnchangeGroupe() : new Onchangetribu())
      await op.run(row)
      session.syncEncours = false
      SyncQueue.traiterQueue()
    }, 50)
  }
}

export class OnchangeCompta extends OperationWS {
  constructor () { super($t('OPsync')) }

  async run (row) {
    try {

    } catch (e) { await this.finKO(e) }
  }
}

export class OnchangeTribu extends OperationWS {
  constructor () { super($t('OPsync')) }

  async run (row) {
    try {

    } catch (e) { await this.finKO(e) }
  }
}

export class OnchangeGroupe extends OperationWS {
  
  async run (row) {
    try {

    } catch (e) { await this.finKO(e) }
  }
}