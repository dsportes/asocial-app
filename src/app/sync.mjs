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

/* OperatioWS *********************************************************************/
export class OperationWS extends Operation {
  constructor (nomop) { super(nomop) }

  async nvTribu (id) { // tribu la plus récente
    const args = { token: session.authToken, id }
    const ret = this.tr(await post(this, 'GetTribu', args))
    this.nvTribu = ret.rowTribu
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
    const args = { token: session.authToken, id: idt }
    const ret = this.tr(await post(this, 'EnleverGroupesAvatars', args))  
    const row = ret.rowTribu
    this.buf.putIDB(row)
    const tribu = compile(row)
    stores.avatar.setTribu(tribu)
  }

  /* Changement d'un avatar qui existait
  - id : de l'avatar
  - v : version détenue dans la session
  */
  async chargtAvatar (id, v) {
    const args = { token: session.authToken, id }
    const ret = this.tr(await post(this, 'GetAvatar', args))
    const row = ret.rowAvatar
    const avatar = await compile(row)
    this.buf.putIDB(row)
    const e = { av: avatar, lch: [], lsp: [], lsc: [] }
    this.avChange.set(id, e)
    if (id % 10 === 0) this.avatarP = avatar
    // (re) chargement des secrets, chats, sponsorings
    args.v = v
    const ret2 = this.tr(await post(this, 'ChargerSCS', args))
    e.lsc = ret2.rowSecrets
    e.lch = ret2.rowChats
    e.lsp = ret2.rowSponsorings
    
    // TODO : changement dans la liste des groupes (en plus ou en moins)

  }

  async run (row) {
    try {
      const session = stores.session
      const avStore = stores.avatar
      this.buf = new IDBbuffer()
      this.compta = await compile(row)
      this.avCompta = avStore.compta
      if (this.compta.v <= this.avCompta.v) return

      if (this.compta.idt !== this.avCompta.idt) await this.chgTribu(this.compta.idt)

      // gestion des avatars ayant changé (s'il y en a)
      this.avatarP = avStore.compte
      this.avChange = new Map()
      this.avSuppr = new Set()
      // D'abord l'avatar principal
      if (this.compta.lavv[0] > this.avatarP.v) {
        await this.chargtAvatar(this.compta.id)
      }

      for (let i = 0; i < 8; i++) {
        // commence par l'avatar principal qui peut recharger this.avatarP
        const apv = this.compta.lavv[i]
        const avv = this.avCompta.lavv[i]
        const avid = i ? this.avatarP.idAvIdx(i) : this.compta.id
        if (avv) {
          if (apv > avv) {
            this.chargtAvatar(avid, avv)
          } else if (!apv && avv) {
            this.buf.purgeAvatarIDB(avid)
            this.avSuppr.add(avid)
          }
        }
      }

      this.buf.putIDB(row)

      /* commits IDB */
      this.buf.commitIDB()

      /* Maj des stores */
      avStore.setCompta(this.compta)
      const chg = session.setBlocage()
      this.avSuppr.forEach(id => { avStore.del(id) })
      this.avChange.values().forEach(e => { avStore.lotMaj(e) })

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
      const avStore = stores.avatar
      this.buf = new IDBbuffer()
      const groupe = await compile(row)
      const avGr = grStore.get(groupe.id)
      const nvMbs = [] // Array des membres à ranger en store
      const nvSecs = [] // Array des secrets à ranger en store

      if (groupe._zombi) {
        this.buf.purgeGroupeIDB(groupe.id)
        grStore.del(groupe.id)
        avGr._zombi = true // gestion en affichage si le groupe est référencé en UI
        // On l'enlève par anticipation des groupes référencés par les avatars qui le référence
        const mapIdNi = avStore.avatarsDeGroupe(groupe.id, true)

        if (mapIdNi) {
          // On fait effectuer la maj des avatars concernés pour le retirer de lgr
          const args = { token: session.authToken, mapIdNi }
          this.tr(await post(this, 'EnleverGroupesAvatars', args))  
        }
      } else {
        const args = { token: session.authToken, id: groupe.id, v: avGr.v }
        const ret = this.tr(await post(this, 'ChargerMS', args))
        this.rowSecrets = ret.rowSecrets
        this.rowMembres = ret.rowMembres
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
        this.buf.putIDB(row) // groupe modifié
        /* Maj des stores */
        grStore.setGroupe(groupe)
        if (nvMbs.length) nvMbs.forEach(m => { grStore.setMembre(m) })
        if (nvSecs.length) nvSecs.forEach(s => { grStore.setSecret(s) })
      }

      /* commits IDB */
      this.buf.commitIDB()

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
