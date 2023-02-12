import stores from '../stores/stores.mjs'
import { Operation } from './operations.mjs'
import { reconnexionCompte } from './connexion.mjs'
import { compile } from './modele.mjs'
import { IDBbuffer, gestionFichierSync } from './db.mjs'
import { $t } from './util.mjs'
import { appexc } from './api.mjs'
import { post } from './net.mjs'

export class SyncQueue {
  static queue = []

  static reset () { SyncQueue.queue.length = 0 }

  static push (row) {
    SyncQueue.queue.push(row)
    SyncQueue.traiterQueue()
  }

  static traiterQueue () {
    const session = stores.session
    if (session.syncEncours || session.status < 2 || !SyncQueue.queue.length) return
    session.syncEncours = true
    const [row] = SyncQueue.queue.splice(0, 1)
    setTimeout(async () => {
      session.syncEncours = true
      let op
      if (row._nom === 'comptas') op = new OnchangeCompta()
      else if (row._nom === 'groupes') op = new OnchangeGroupe()
      else if (row._nom === 'tribus') op = new OnchangeTribu()
      if (op) await op.run(row)
      if (session.synchro) session.sessionSync.setDhSync(new Date().getTime())
      session.syncEncours = false
      SyncQueue.traiterQueue()
    }, 50)
  }
}

/* OperatioWS *********************************************************************/
export class OperationWS extends Operation {
  constructor (nomop) { super(nomop) }

  async nvGroupe (id) { // groupe le plus récent
    const args = { token: session.authToken, id, abPlus: [id] }
    const ret = this.tr(await post(this, 'GetGroupe', args))
    const rowg = ret.rowGroupe
    if (!rowg || rowg._zombi) return null
    const session = stores.session
    if (session.fsSync) session.fsSync.setGroupe(id)
    this.buf.putIDB(rowg)
    return await compile(rowg)
  }

  async setGroupe (idg, v) { // Id du groupe, version détenue
    const args = { token: session.authToken, id: idg, v: v }
    const ret = this.tr(await post(this, 'ChargerMS', args))
    for (const rowm of ret.rowMembres) {
      this.nvMbs.push(await compile(rowm)) // membre ajouté / modifié
      this.buf.putIDB(rowm)
    }
    for (const rows of ret.rowSecrets) {
      const s = await compile(rows)
      if (session.synchro) this.buf.mapSec[s.pk] = s
      this.nvSecs.push(s) // secret ajouté / modifié
      this.buf.putIDB(rows)
    }
  }

  async finKO (e) {
    const exc = appexc(e)
    exc.sync = true
    await stores.ui.afficherExc(exc)
  }
}

export class OnchangeCompta extends OperationWS {
  constructor () { super($t('OPsync')) }

  async chgTribu (idt) { // Changement de tribu, chargement de la nouvelle
    const args = { token: session.authToken, id: idt }
    const ret = this.tr(await post(this, 'GetTribu', args))
    const row = ret.rowTribu
    const avTribu = stores.avatar.tribu
    if (row.v <= avTribu.v) return
    this.buf.putIDB(row)
    this.tribu = compile(row)
  }

  /* Changement d'un avatar qui existait
  - id : de l'avatar
  - v : version détenue dans la session
  */
  async chargtAvatar (id, v) {
    const session = stores.session
    const args = { token: session.authToken, id }
    const ret = this.tr(await post(this, 'GetAvatar', args))
    const row = ret.rowAvatar
    const avatar = await compile(row)
    this.buf.putIDB(row)
    const e = { av: avatar, lch: [], lsp: [], lsc: [] }
    this.avChange.set(id, e)
    if (id % 10 === 0) this.avatarP = avatar
    // (re) chargement des secrets, chats, sponsorings
    args.v = v || 0
    const ret2 = this.tr(await post(this, 'ChargerSCS', args))
    for (const x of ret2.rowSecrets) e.lsc.push(await compile(x))
    for (const x of ret2.rowChats) e.lch.push(await compile(x))
    for (const x of ret2.rowSponsorings) e.lsp.push(await compile(x))
    avatar.idGroupes(this.grUtiles)
  }

  async run (row) {
    try {
      const session = stores.session
      const avStore = stores.avatar
      const grStore = stores.groupe
      this.grExistants = new Set(grStore.ids)
      this.grUtiles = new Set()
      this.buf = new IDBbuffer()

      this.nvMbs = [] // Array des membres à ranger en store
      this.nvSecs = [] // Array des secrets à ranger en store
      this.nvGrps = [] // Array des groupes à mettre en store

      this.compta = await compile(row)
      this.avCompta = avStore.compta
      if (this.compta.v <= this.avCompta.v) return

      if (this.compta.idt !== this.avCompta.idt) await this.chgTribu(this.compta.idt)

      // gestion des avatars ayant changé (s'il y en a)
      this.avatarP = avStore.compte
      this.avAvatarP = this.avatarP
      this.avChange = new Map()
      this.avSuppr = new Set()
      /* D'abord l'avatar principal : 
      il peut changer this.avatarP qui contient la liste des avatars secondaires
      */
      if (this.compta.lavv[0] > this.avatarP.v) {
        await this.chargtAvatar(this.compta.id)
      }
      this.avatarP.idGroupes(this.grUtiles)

      // les avatars secondaires
      for (let i = 1; i < 8; i++) {
        const apv = this.compta.lavv[i]
        const avv = this.avCompta.lavv[i]
        const avid = this.avatarP.idAvIdx(i)
        if (avv >= apv) { // rien de nouveau sur l'avatar i
          const av = avStore.getAvatar(avid)
          if (av) av.idGroupes(this.grUtiles)
          continue 
        }
        const avavid = this.avAvatarP.idAvIdx(i)
        if (avid !== avavid && avavid) {
          // il y avait un ancien différent du nouveau, il faut le supprimer
          this.buf.purgeAvatarIDB(avavid)
          this.avSuppr.add(avavid)
        }
        if (avid) {
          // il y a un avatar (nouveau ou non mais changé)
          this.chargtAvatar(avid, avv)
        }
      }
      this.grToDel = new Set()
      this.grToAdd = new Set()
      this.grExistants.forEach(id => { 
        if (!this.grUtiles.has(id)) {
          this.grToDel.add(id)
          this.buf.purgeGroupeIDB(groupe.id)
        }  
      })
      this.grUtiles.forEach(id => { 
        if (!this.grExistants.has(id)) this.grToAdd.add(id)
      })
      if (this.grToAdd.size) {
        for (const id of Array.from(this.grToAdd.values())) {
          const g = await this.nvGroupe(id)
          if (g) {
            this.nvGrps.push(g)
            await setGroupe(id, 0)
          }
        }
      }
      this.buf.putIDB(row)

      if (this.grToDel.size && !session.fsSync) {
        // désabonnements des groupes détruits
        const args = { token: session.authToken, id, abMoins: Array.from(this.grToDel) }
        const ret = this.tr(await post(this, 'GestionAb', args))    
      }

      /* commits IDB */
      this.buf.commitIDB()

      /* Maj des stores */
      if (this.tribu) avStore.setTribu(tribu)
      avStore.setCompta(this.compta)
      const chg = session.setBlocage()
      this.avSuppr.forEach(id => { avStore.del(id) })
      this.avChange.forEach(e => { avStore.lotMaj(e) })

      // Insertion / suppression des groupes nouveaux / inutiles
      this.grToDel.forEach(id => { 
        if (session.fsSync) session.fsSync.unsetGroupe(id)
        grStore.del(id)
      })
      if (this.nvGrps.length) this.nvGrps.forEach(g => { grStore.setGroupe(g) })
      if (this.nvMbs.length) this.nvMbs.forEach(m => { grStore.setMembre(m) })
      if (this.nvSecs.length) this.nvSecs.forEach(s => { grStore.setSecret(s) })

      if (chg > 1) await alerteBlocage (chg)
      
    } catch (e) { 
      await this.finKO(e)
    }
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

      if (groupe._zombi) {
        this.buf.purgeGroupeIDB(groupe.id)
        grStore.del(groupe.id)
        // On l'enlève par anticipation des groupes référencés par les avatars qui le référence
        const mapIdNi = avStore.avatarsDeGroupe(groupe.id, true)

        if (mapIdNi) {
          /* On fait effectuer la maj des avatars concernés 
          pour le retirer de lgr. /désabonnement du groupe */
          const args = { token: session.authToken, mapIdNi, abMoins: [groupe.id] }
          this.tr(await post(this, 'EnleverGroupesAvatars', args))  
        }
      } else {
        this.nvMbs = [] // Array des membres à ranger en store
        this.nvSecs = [] // Array des secrets à ranger en store  
        await this.setGroupe(groupe.id, avGr.v)
        /* Maj des stores */
        grStore.setGroupe(groupe)
        if (this.nvMbs.length) nvMbs.forEach(m => { grStore.setMembre(m) })
        if (this.nvSecs.length) nvSecs.forEach(s => { grStore.setSecret(s) })
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
