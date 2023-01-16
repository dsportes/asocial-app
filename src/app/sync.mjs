import stores from '../stores/stores.mjs'
import { Operation } from './operations.mjs'
import { reconnexionCompte } from './connexion.mjs'
import { compile } from './modele.mjs'
import { IDBbuffer, gestionFichierSync } from './db.mjs'

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
      if (session.synchro) session.sessionSync.setDhSync(new Date().getTime())
      session.syncEncours = false
      SyncQueue.traiterQueue()
    }, 50)
  }
}

export class OperationWS extends Operation {
  constructor (nomop) { super(nomop) }

  async nvSM (id, v) { // nouveaux secrets et membres
    const args = { token: session.authToken, id, v }
    const ret = this.tr(await post(this, 'ChargerMS', args))
    this.rowSecrets = ret.rowSecrets
    this.rowMembres = ret.rowMembres
  }

  async nvSCS (id, v) { // nouveaux secrets, chats, sponsorings
    const args = { token: session.authToken, id, v }
    const ret = this.tr(await post(this, 'ChargerSCS', args))
    this.rowSecrets = ret.rowSecrets
    this.rowChats = ret.rowChats
    this.rowSponsorings = ret.rowSponsorings
  }

  async nvTribu (id) { // tribu la plus récente
    const args = { token: session.authToken, id }
    const ret = this.tr(await post(this, 'GetTribu', args))
    this.nvTribu = ret.rowTribu
  }

  async nvAvatar (id) { // avatar le plus récent
    const args = { token: session.authToken, id }
    const ret = this.tr(await post(this, 'GetAvatar', args))
    this.nvAvatar = ret.rowAvatar
  }

  async nvGroupe (id) { // groupe le plus récent
    const args = { token: session.authToken, id }
    const ret = this.tr(await post(this, 'GetGroupe', args))
    this.nvGroupe = ret.rowGroupe
  }

  async finKO (e) {
    const exc = appexc(e)
    exc.sync = true
    await stores.ui.afficherExc(exc)
  }
}

export class OnchangeCompta extends OperationWS {
  constructor () { super($t('OPsync')) }

  async chgTribu (idt) {
    await this.nvTribu(idt)
    const avTribu = stores.avatar.tribu
    if (this.nvTribu.v <= avTribu.v) { this.nvTribu = null; return }
    // TODO
  }

  async run (row) {
    try {
      const session = stores.session
      const avStore = stores.avatar
      this.buf = new IDBbuffer()
      this.compta = await compile(row)
      this.avCompta = avStore.compta
      if (this.compta.v <= this.avCompta.v) return

      if (this.compta.idt !== this.avCompta.idt) await chtTribu(this.compta.idt)

      this.buf.putIDB(row)

      /* commits IDB */
      this.buf.commitIDB()

      /* Maj des stores */
      avStore.setCompta(this.compta)
      const chg = session.setBlocage()
      if (chg > 1) await alerteBlocage (chg)
      
    } catch (e) { await this.finKO(e) }
  }
}

/*
La maj de la tribu peut affecter :
- le statut de blocage
- la liste des parrains: maj de people
*/
export class OnchangeTribu extends OperationWS {
  constructor () { super($t('OPsync')) }

  async run (row) {
    try {
      const session = stores.session
      const avStore = stores.avatar
      this.buf = new IDBbuffer()
      const tribu = await compile(row)
      if (tribu.v <= avStore.tribu.v) return

      this.buf.putIDB(row)

      /* commits IDB */
      this.buf.commitIDB()

      /* Maj des stores */
      stores.avatar.setTribu(tribu) // Remplace les sponsors dans people
      const chg = session.setBlocage()
      if (chg > 1) await alerteBlocage (chg)
      
    } catch (e) { await this.finKO(e) }
  }
}

/* Changement du groupe
Passage en _zombi : plus de membres ni de secrets
La maj d'un groupe peut affecter :
- la liste des secrets
- la liste des membres et le changement de leur carte de visite
*/
export class OnchangeGroupe extends OperationWS {

  async run (row) {
    try {
      const session = stores.session
      const grStore = stores.groupe
      this.buf = new IDBbuffer()
      const groupe = await compile(row)
      const avGr = grStore.get(groupe.id)
      const nvMbs = [] // Array des membres à ranger en store
      const nvSecs = [] // Array des secrets à ranger en store

      if (groupe._zombi) {
        this.buf.purgeGroupeIDB(groupe.id) 
      } else {
        await this.nvSM(groupe.id, avGr.v)
        for (const rowm of this.rowMembres) {
          nvMbs.push(await compile(rowm)) // membre ajouté / modifié
          this.buf.putIDB(rowm)
        }
        for (const rows of this.rowSecrets) {
          const s = await compile(rows)
          if (session.synchro) this.buf.mapSec[s.pk] = s
          nvSecs.push(s) // secret ajouté / modifié
          this.buf.putIDB(rows)
        }
      }
      this.buf.putIDB(row) // groupe modifié

      /* commits IDB */
      this.buf.commitIDB()

      /* Maj des stores */
      grStore.setGroupe(groupe)
      nvMbs.forEach(m => { grStore.setMembre(m) })
      nvSecs.forEach(s => { grStore.setSecret(s) })

      if (session.synchro) await gestionFichierSync(this.buf.mapSec)

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
