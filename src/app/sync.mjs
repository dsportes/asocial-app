import stores from '../stores/stores.mjs'
import { OperationWS } from './operations.mjs'
import { reconnexionCompte } from './connexion.mjs'
import { compile } from './modele.mjs'
import { IDBbuffer } from './db.mjs'

export class SyncQueue {
  static queue = []

  static reset () { SyncQueue.length = 0 }

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

/*
La maj de la tribu peut affecter :
- le statut de blocage
- la liste des parrains: en plus, en moins, CV changée - maj de people
*/
export class OnchangeTribu extends OperationWS {
  constructor () { super($t('OPsync')) }

  async run (row) {
    try {
      const session = stores.session
      this.buf = new IDBbuffer()
      const tribu = await compile(row)
      this.buf.putIDB(row)
      const av = session.tribu // état avant
      // TODO

      /* commits */
      this.buf.commitIDB()

      const avStore = stores.avatar
      avStore.setTribu(tribu)
      const chg = session.setBlocage()
      if (chg > 1) await alerteBlocage (chg)
    } catch (e) { await this.finKO(e) }
  }
}

export class OnchangeGroupe extends OperationWS {
  
  async run (row) {
    try {

    } catch (e) { await this.finKO(e) }
  }
}

/* On vient de positionner le blocage : const chg = session.setBlocage()
En retour :
- 0: pas de changement
- 1: le changement n'affecte pas le blocage / déblocage
- 2: le compte VIENT d'être bloqué
- 3: le compte VIENT d'être débloqué
Dans les cas 2 et 3, ouverture d'un dialogue pour déconnexion
*/
async function alerteBlocage (chg) {
  const $q = stores.config.$q
  return new Promise((resolve) => {
    if (chg < 2) { resolve(); return }
    /*
    OPmsg4: 'Votre compte vient d\'être débloqué',
    OPmsg5: 'Votre compte vient d\'être complètement bloqué',
    OPmsg6: 'Vous allez être déconnecté et reconnecté afin de bénéficier de cette nouvelle situation.',
    */
    let t = '', m = ''
    if (chg === 3) {
      t = $t('OPmsg4')
      m = $t('OPmsg6')
    } else {
      t = $t('OPmsg5')
      m = $t('OPmsg6')
    }
  
    $q.dialog({
      dark: true,
      title: t,
      message: m,
      ok: { color: 'warning', label: $t('jailu') },
      persistent: true
    }).onOk(async () => {
      await reconnexionCompte()
      resolve()
    }).onDismiss(async () => {
      await reconnexionCompte()
      resolve()
    })
  })
}
