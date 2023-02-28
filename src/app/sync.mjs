import stores from '../stores/stores.mjs'
import { Operation } from './operations.mjs'
import { reconnexionCompte } from './connexion.mjs'
import { compile, Versions } from './modele.mjs'
import { IDBbuffer, gestionFichierSync } from './db.mjs'
import { $t, difference, intersection } from './util.mjs'
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
      else if (row._nom === 'versions') op = new OnchangeVersion()
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

  /* Maj de la tribu */
  async majTribu (row, avId) {
    const avTribu = stores.avatar.tribu
    if (row.v <= avTribu.v) return
    this.buf.putIDB(row)
    this.tribu = await compile(row)
  }

  supprGr (id) { // suppression du groupe id
    this.buf.purgeGroupeIDB(id)
    this.abMoins.add(id)
    this.grSuppr.add(id)
  }

  async majGr (id) { // Maj ou ajout du groupe id
    const vcour = Versions.get(id)
    const session = stores.session
    const args = { token: session.authToken, id, v: vcour }
    const ret = this.tr(await post(this, 'ChargerGMS', args))
    this.versions(id, ret.vgroupe.v)
    const groupe = ret.rowGroupe ? await compile(ret.rowGroupe) : null

    if (groupe && groupe._zombi) {
      this.supprGr(id)
    } else {
      this.buf.putIDB(ret.rowGroupe)
      const e = { gr: groupe, lmb: [], lsc: [] }
      this.grMaj.set(id, e)
      if (ret.rowSecrets) for (const x of ret.rowSecrets) {
        this.buf.putIDB(x)
        e.lsc.push(await compile(x))
        if (session.accesIdb) this.buf.mapSec[secret.pk] = secret // Pour gestion des fichiers
      }
      if (ret.rowMembres) for (const x of ret.rowMembres) {
        this.buf.putIDB(x)
        e.lmb.push(await compile(x))
      }
      if (vcour === 0) this.abPlus.add(id) // c'était un ajout
    }
  }

  supprAv (id) { // suppression de l'avatar id
    this.buf.purgeAvatarIDB(id)
    this.abMoins.add(id)
    this.avSuppr.add(id)
  }

  async majAv (id) { // Maj ou ajout de l'avatar id
    const vcour = Versions.get(id)    
    const session = stores.session
    const args = { token: session.authToken, id, v: vcour }
    const ret = this.tr(await post(this, 'ChargerASCS', args))
    this.versions.set(id, ret.vavatar.v)
    let avatar = null
    if (ret.rowAvatar) {
      avatar = await compile(ret.rowAvatar)
      this.buf.putIDB(ret.rowAvatar)
    }
    const e = { av: avatar, lch: [], lsp: [], lsc: [] }
    this.avMaj.set(id, e)
    for (const x of ret.rowSecrets) {
      this.buf.putIDB(x)
      e.lsc.push(await compile(x))
      if (session.accesIdb) this.buf.mapSec[secret.pk] = secret // Pour gestion des fichiers
    }
    for (const x of ret.rowChats) {
      this.buf.putIDB(x)
      e.lch.push(await compile(x))
    }
    for (const x of ret.rowSponsorings) {
      this.buf.putIDB(x)
      e.lsp.push(await compile(x))
    }
    if (vcour === 0) this.abPlus.add(id) // c'était un ajout
    const a = avatar ? avatar : stores.avatar.getAvatar(id)
    a.idGroupes(this.grRequis) // ajout des groupes requis
  }

  init () {
    this.versions = new Map() // versions des sous-collections d'avatars / groupes modifiées
    this.buf = new IDBbuffer() // Maj iDB en attente de commit

    /* Sous-collections avatars ajoutés ou mis à jour à mettre à jour en store
    { av: avatar, lch: [], lsp: [], lsc: [] }
    */
    this.avMaj = new Map()
    /* Sous-collections avatars ajoutés ou mis à jour à mettre à jour en store
    { gr: groupe, lmb: [], lsc: [] }
    */
    this.grMaj = new Map()

    // avatars et groupes supprimés
    this.avSuppr = new Set() 
    this.grSuppr = new Set()

    this.compta = null // compta mise à jour
    this.tribu = null  // tribu mise à jour ou ajoutée. L'id de celle supprimée est dans abMoins.

    this.abPlus = new Set() // abonnements de synchronisation ajoutés
    this.abMoins = new Set() // abonnements de synchronisation supprimés

    this.grRequis = new Set() // groupes appraissant dans un des avatars du compte
  }

  async final () {
    const session = stores.session
    const avStore = stores.avatar
    const grStore = stores.groupe

    // désabonnements
    if (session.fsSync && this.abPlus.size) for (const id of this.abPlus) {
      if (id % 10 === 1) await session.fsSync.setAvatar(id)
      if (id % 10 === 2) await session.fsSync.setGroupe(id)
      if (id % 10 === 3) await session.fsSync.setTribu(id)
    }
    if (session.fsSync && this.abMoins.size) for (const id of this.abMoins) {
      if (id % 10 === 1) await session.fsSync.unsetAvatar(id)
      if (id % 10 === 2) await session.fsSync.unsetGroupe(id)
      if (id % 10 === 3) await session.fsSync.unsetTribu(id)
    }
    if (!session.fsSync && (this.abPlus.size || this.abMoins.size)) {
      const args = { token: session.authToken, abMoins: this.abMoins, abPlus: this.abPlus }
      this.tr(await post(this, 'GestionAb', args))    
    }

    // commit IDB
    const x = this.versions.size === 0
    if (x) for(const id in this.versions.keys()) Versions.set(id, this.versions.get(id))
    this.buf.commitIDB(false, x)

    // Maj des stores
    if (this.compta) avStore.setCompta(this.compta)
    if (this.tribu) avStore.setTribu(this.tribu)

    this.avSuppr.forEach(id => { avStore.del(id) })
    this.avMaj.forEach(e => { avStore.lotMaj(e) })
    // Retire en store les groupes supprimés / zombis des avatars qui les référencent
    const mapIdNi = avStore.avatarsDeGroupes(this.grSuppr)

    this.grSuppr.forEach(id => { grStore.del(id) })
    this.grMaj.forEach(e => { grStore.lotMaj(e) })

    if (mapIdNi) {
      /* On effectue la maj de tous les avatars concernés 
      par la suppression des groupes (entrées ni de lgr) */
      const args = { token: session.authToken, mapIdNi }
      this.tr(await post(this, 'EnleverGroupesAvatars', args))  
    }

    if (session.accesIdb) await gestionFichierSync(this.buf.mapSec)

    const chg = session.setBlocage()
    if (chg > 1) await this.alerteBlocage (chg)
    session.setDh(this.dh)
  }

  /* On vient de positionner le blocage : const chg = session.setBlocage()
  En retour :
  - 0: pas de changement
  - 1: le changement n'affecte pas le blocage / déblocage
  - 2: le compte VIENT d'être bloqué
  - 3: le compte VIENT d'être débloqué
  Dans les cas 2 et 3, ouverture d'un dialogue pour déconnexion
  */
  async alerteBlocage (chg) {
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

  async finKO (e) {
    const exc = appexc(e)
    exc.sync = true
    await stores.ui.afficherExc(exc)
  }
}

export class OnchangeVersion extends OperationWS {
  constructor () { super($t('OPsync')) }

  async run (row) {
    try {
      this.init()
      if (row.id % 10 === 2) {
        await this.majGr(row.id)
      } else {
        await this.majAv(row.id)
      }
      await this.final()
    } catch (e) { 
      await this.finKO(e)
    }
  }
}

export class OnchangeCompta extends OperationWS {
  constructor () { super($t('OPsync')) }

  async run (row) {
    try {
      this.init()
      const session = stores.session
      const avStore = stores.avatar
      const grStore = stores.groupe
      this.compta = await compile(row)
      this.avCompta = avStore.compta  
      if (this.compta.v <= this.avCompta.v) return

      this.buf.putIDB(this.compta)
      if (this.compta.idt !== this.avCompta.idt) {
        const args = { token: session.authToken, id: this.compta.idt }
        const ret = this.tr(await post(this, 'GetTribu', args))
        await this.majTribu(ret.rowTribu)
        this.abPlus.add(this.compta.idt)
        this.abMoins.add(this.avCompta.idt)
      }

      const avlav = this.avCompta.avatarIds
      const aplav = this.compta.avatarIds
      const avMoins = difference(avlav, aplav)
      const avPlus = difference(aplav, avlav)

      if (avMoins.size || avPlus.size) {
        intersection(avlav, aplav).forEach(id => { 
          const a = avStore.getAvatar(id)
          if (a) a.idGroupes(this.grRequis)
        })
      }
      if (avMoins.size) for (const id of avMoins) this.supprAv(id)
      if (avPlus.size) for (const id of avPlus) await this.majAv(id)

      if (avMoins.size || avPlus.size) {
        const avlgr = new Set(grStore.ids) // groupes utiles avant
        const grMoins = difference(avlgr, this.grRequis)
        const grPlus = difference(this.grRequis, avlgr)
        if (grMoins.size) for (const id of grMoins) this.supprGr(id)
        if (grPlus.size) for (const id of grPlus) await this.majGr(id)
      }

      await this.final()
    } catch (e) { 
      await this.finKO(e)
    }
  }
}

export class OnchangeTribu extends OperationWS {
  constructor () { super($t('OPsync')) }

  async run (row) {
    try {
      this.init()
      const avStore = stores.avatar
      const tribu = await compile(row)
      if (tribu.v <= avStore.tribu.v) return

      await this.majTribu(row)

      await this.final()
    } catch (e) { 
      await this.finKO(e)
    }
  }
}
