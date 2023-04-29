import stores from '../stores/stores.mjs'
import { Operation } from './operations.mjs'
import { deconnexion } from './connexion.mjs'
import { decode } from '@msgpack/msgpack'
import { compile, Versions } from './modele.mjs'
import { IDBbuffer, gestionFichierSync } from './db.mjs'
import { $t, difference, intersection } from './util.mjs'
import { appexc, ID } from './api.mjs'
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
      else if (row._nom === 'tribu2s') op = new OnchangeTribu2()
      else if (row._nom === 'espaces') op = new OnchangeEspace()
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

  supprGr (id) { // suppression du groupe id
    this.buf.purgeGroupeIDB(id)
    this.abMoins.add(id)
    this.grSuppr.add(id)
  }

  async destectMbDisp (id, ids) {
    const args = { token: session.authToken, id, ids }
    this.tr(await post(this, 'DisparitionMembre', args))
  }

  async majGr (id) { // Maj ou ajout du groupe id
    // ret.rowGroupe peut être absent
    // ret.vgroupe est TOUJOURS présent un row dont la data donne v1 v2 q1 q2
    const vcour = Versions.get(id)
    const session = stores.session
    const gSt = stores.groupe
    const args = { token: session.authToken, id, v: vcour.v }
    const ret = this.tr(await post(this, 'ChargerGMS', args))

    const objv = Versions.compile(ret.vgroupe)
    this.versions.set(id, objv)

    const groupe = await compile(ret.rowGroupe)
    const avgr = gSt.getGroupe(id) // groupe actuel

    if (avgr && groupe && groupe._zombi) {
      // le groupe existait et on vient de le découvrir _zombi
      this.supprGr(id)
      return
    }
  
    if (!avgr && !groupe) return // le groupe n'existait pas et n'existe toujours pas

    // le groupe existait ou existe désormais
    if (groupe) this.buf.putIDB(ret.rowGroupe) // il a changé

    const gr = groupe || avgr // groupe actuel, mis à jour ou non
    const e = { id: id, gr: gr, lmb: [], lsc: [], objv: objv }
    this.grMaj.set(id, e)
    if (ret.rowSecrets) for (const x of ret.rowSecrets) {
      this.buf.putIDB(x)
      e.lsc.push(await compile(x))
      if (session.accesIdb) this.buf.mapSec[secret.pk] = secret // Pour gestion des fichiers
    }

    if (ret.rowMembres) for (const x of ret.rowMembres) {
      const st = gr.ast[x.ids] // statut du membre
      if (x.dlv < this.auj) {
        /* membre disparu par sa dlv */
        this.buf.supprIDB({ _nom: 'membres', id: gr.id, ids })
        e.lmb.push({ id: gr.id, ids, _zombi: true }) 
        if (st) await this.destectMbDisp (gr.id, ids)
      } else {
        if (!st) {
          // membre détecté disparu par son statut dans son groupe
          this.buf.supprIDB({ _nom: 'membres', id: gr.id, ids })
          e.lmb.push({ id: gr.id, ids, _zombi: true })   
        } else {
          // membre vraiment pas disparu
          this.buf.putIDB(x)
          e.lmb.push(await compile(x))
        }
      }
    }

    // Détection des membres disparus d'après leur statut
    for(let ids = 1; ids < gr.ast.length; ids++) {
      if (gr.ast[ids] || !avgr.ast[ids]) continue // pas disparu ou l'était déjà
      // on vient de détecter sa disparition par ast
      this.buf.supprIDB({ _nom: 'membres', id: gr.id, ids })
      e.lmb.push({ id: gr.id, ids, _zombi: true })
    }
    if (vcour === 0) this.abPlus.add(id) // c'était un ajout
  }

  supprAv (id) { // suppression de l'avatar id
    this.buf.purgeAvatarIDB(id)
    this.abMoins.add(id)
    this.avSuppr.add(id)
  }

  async majAv (id) { // Maj ou ajout de l'avatar id
    const vcour = Versions.get(id)    
    const session = stores.session
    const aSt = stores.avatar
    const args = { token: session.authToken, id, v: vcour.v }
    const ret = this.tr(await post(this, 'ChargerASCS', args))

    const objv = Versions.compile(ret.vavatar)
    this.versions.set(id, objv)

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
    const a = avatar ? avatar : aSt.getAvatar(id)
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
    this.tribu2 = null

    this.abPlus = new Set() // abonnements de synchronisation ajoutés
    this.abMoins = new Set() // abonnements de synchronisation supprimés

    this.grRequis = new Set() // groupes appraissant dans un des avatars du compte
  }

  async final () {
    const session = stores.session
    const aSt = stores.avatar
    const gSt = stores.groupe

    // désabonnements
    if (session.fsSync && this.abPlus.size) for (const id of this.abPlus) {
      if (ID.estAvatarS(id)) await session.fsSync.setAvatar(id)
      if (ID.estGroupe(id)) await session.fsSync.setGroupe(id)
      if (ID.estTribu(id)) await session.fsSync.setTribu(id)
    }
    if (session.fsSync && this.abMoins.size) for (const id of this.abMoins) {
      if (ID.estAvatarS(id)) await session.fsSync.unsetAvatar(id)
      if (ID.estGroupe(id)) await session.fsSync.unsetGroupe(id)
      if (ID.estTribu(id)) await session.fsSync.unsetTribu(id)
    }
    if (!session.fsSync && (this.abPlus.size || this.abMoins.size)) {
      const args = { token: session.authToken, abMoins: this.abMoins, abPlus: this.abPlus }
      this.tr(await post(this, 'GestionAb', args))    
    }

    // commit IDB
    const x = this.versions.size === 0
    if (x) for(const [id, objv] of this.versions) Versions.set(id, objv)
    this.buf.commitIDB(false, x)

    // Maj des stores
    if (this.compta) aSt.setCompta(this.compta)
    if (this.tribu) aSt.setTribu(this.tribu)
    if (this.tribu2) aSt.setTribu2(this.tribu2)

    this.avSuppr.forEach(id => { aSt.del(id) })
    this.avMaj.forEach(e => { aSt.lotMaj(e) })
    // Retire en store les groupes supprimés / zombis des avatars qui les référencent
    const mapIdNi = aSt.avatarsDeGroupes(this.grSuppr)

    this.grSuppr.forEach(id => { gSt.del(id) })
    this.grMaj.forEach(e => { gSt.lotMaj(e) })

    if (mapIdNi) {
      /* On effectue la maj de tous les avatars concernés 
      par la suppression des groupes (entrées ni de lgr) */
      const args = { token: session.authToken, mapIdNi }
      this.tr(await post(this, 'EnleverGroupesAvatars', args))  
    }

    if (session.accesIdb) await gestionFichierSync(this.buf.mapSec)

    session.setBlocage()
    if (session.nivbl > 2 && !session.estComptable) deconnexion()
    session.setDh(this.dh)
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
      if (ID.estGroupe(row.id)) {
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
      const aSt = stores.avatar
      const gSt = stores.groupe
      this.compta = await compile(row)
      /* Dans compta, nctk a peut-être été recrypté */
      if (this.compta.nctk) {
        const args = { token: session.authToken, nctk: this.compta.nctk }
        this.tr(await post(this, 'MajNctkCompta', args))
        delete this.compta.nctk
      }
      this.avCompta = aSt.compta  
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
          const a = aSt.getAvatar(id)
          if (a) a.idGroupes(this.grRequis)
        })
      }
      if (avMoins.size) for (const id of avMoins) this.supprAv(id)
      if (avPlus.size) for (const id of avPlus) await this.majAv(id)

      if (avMoins.size || avPlus.size) {
        const avlgr = new Set(gSt.ids) // groupes utiles avant
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
      const aSt = stores.avatar
      
      if (stores.session.estComptable) {
        const avTr = aSt.getTribu(row.id)
        if ((!avTr || avTr.v < row.v) || (aSt.tribu.v < row.v)) {
          // tribu du compte ou de la collection à rafraîchir
          this.tribu = await compile(row)
        }
      } else {
        if (row.v > aSt.tribu.v) {
          this.buf.putIDB(row)
          this.tribu = await compile(row)
        }
      }

      if (this.tribu) await this.final()
    } catch (e) { 
      await this.finKO(e)
    }
  }
}

export class OnchangeTribu2 extends OperationWS {
  constructor () { super($t('OPsync')) }

  async run (row) {
    try {
      const session = stores.session
      const aSt = stores.avatar
      this.init()

      if (row.id === session.tribuId) {
        const avTr = aSt.tribu2
        if (row.v > avTr.v) {
          this.buf.putIDB(row)
          this.tribu2 = await compile(row)
        }
      }

      if (row.id === session.tribuCId) {
        const avTr = aSt.tribu2C
        if (row.v > avTr.v && !this.tribu2) this.tribu2 = await compile(row)
      }

      if (this.tribu2) await this.final()
    } catch (e) { 
      await this.finKO(e)
    }
  }
}

export class OnchangeEspace extends OperationWS {
  constructor () { super($t('OPsync')) }

  async run (row) {
    try {
      const session = stores.session
      const esp = await compile(row)
      session.setEspace(esp)
    } catch (e) { 
      await this.finKO(e)
    }
  }
}
