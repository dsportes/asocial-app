import stores from '../stores/stores.mjs'
import { Operation } from './operations.mjs'
import { deconnexion } from './connexion.mjs'
// import { decode } from '@msgpack/msgpack'
import { compile, Versions, Compta } from './modele.mjs'
import { IDBbuffer, gestionFichierSync } from './db.mjs'
import { $t, difference } from './util.mjs'
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
    const session = stores.session
    if (session.groupeId === id) session.setGroupeId(0)
  }

  /* Mise à jour / ajout d'un groupe, détectée par,
  - chgt de sa version,
  - changement de lgr d'un ou plusieurs avatars
  Retourne false si le groupe a été détecté zombi
  Gère les abonnements et purge globale de IDB si zombi
  */
  async majGr (id) { // Maj ou ajout du groupe id
    // ret.rowGroupe peut être absent
    // ret.vgroupe est TOUJOURS présent un row dont la data donne v1 v2 q1 q2
    const vcour = Versions.get(id)
    const session = stores.session
    const gSt = stores.groupe
    const args = { token: session.authToken, id, v: vcour.v }
    const ret = this.tr(await post(this, 'ChargerGMS', args))

    const objv = Versions.compile(ret.vgroupe)
    if (objv._zombi) {
      this.supprGr(id)
      return false
    }

    this.versions.set(id, objv)

    const groupe = await compile(ret.rowGroupe)
    if (groupe) this.buf.putIDB(ret.rowGroupe) // il a changé
    const avgr = gSt.getGroupe(id)
    const gr = groupe || avgr // groupe mis à jour OU actuel

    const e = { id: id, gr: gr, lmb: [], lsc: [], objv: objv }
    this.grMaj.set(id, e)
    if (ret.rowNotes) for (const x of ret.rowNotes) {
      this.buf.putIDB(x)
      const note = await compile(x)
      e.lsc.push(note)
      if (session.accesIdb) this.buf.mapSec[note.pk] = note // Pour gestion des fichiers
    }

    if (ret.rowMembres) for (const x of ret.rowMembres) {
      const st = gr.ast[x.ids] // statut du membre
      if (x.dlv < this.auj) {
        /* membre disparu par sa dlv */
        this.buf.supprIDB({ _nom: 'membres', id: gr.id, ids })
        e.lmb.push({ id: gr.id, ids, _zombi: true }) 
        if (st) { // il faut répercuter la disparition par dlv dans le statut du groupe
          const args = { token: session.authToken, id: gr.id, ids }
          await this.tr(await post(this, 'DisparitionMembre', args))
        }
      } else {
        if (st) {
          // membre "normal" pas disparu
          this.buf.putIDB(x)
          e.lmb.push(await compile(x))
        }
      }
    }

    // Détection des membres nouvellement disparus d'après leur statut
    if (groupe && avgr) for(let ids = 1; ids < groupe.ast.length; ids++) {
      if (avgr.ast[ids] && !groupe.ast[ids]) {
        // existait et n'existe plus : on vient de détecter sa disparition par ast
        this.buf.supprIDB({ _nom: 'membres', id: gr.id, ids })
        e.lmb.push({ id: gr.id, ids, _zombi: true })
      }
    }
    // On gère ici les ajouts de groupes pour abonnement
    if (vcour.v === 0) this.abPlus.add(id) // c'était un ajout
    return true
  }

  supprAv (id) { // suppression de l'avatar id
    this.buf.purgeAvatarIDB(id)
    this.abMoins.add(id)
    this.avSuppr.add(id)
  }

  /* Mise à jour / ajout d'un avatar, détecté par,
  - maj de compta
  - chgt de version de l'avatar
  Remarque: ne traite pas les maj des groupes, seulement l'ajour de nouveaux
  et la suppression de ceux non référencés suite à la maj de l'avatar
  Avatar _zombi:
  - par résiliation explicite : compta a certes été mis à jour avant
    MAIS la synchro peut ne pas respecter cet ordre.
    DONC on peut détecter sur ChargerASCS qu'un avatar a été résilié
    avant qu'on l'ait su par compta
  - PAS par résiliation pat le GC : celle-ci intervient bien après
    la résiliation du compte, donc la perte du login par perte de compta.
  */
  async majAv (id) {
    const vcour = Versions.get(id)    
    const session = stores.session
    const args = { token: session.authToken, id, v: vcour.v }
    const ret = this.tr(await post(this, 'ChargerASCS', args))

    const objv = Versions.compile(ret.vavatar)
    if (objv._zombi) return [false, null]

    this.versions.set(id, objv)

    let avatar = null
    if (ret.rowAvatar) {
      avatar = await compile(ret.rowAvatar)
      this.buf.putIDB(ret.rowAvatar)
    }
    const e = { id, av: avatar, lch: [], lsp: [], lsc: [] }
    this.avMaj.set(id, e)
    for (const x of ret.rowNotes) {
      this.buf.putIDB(x)
      const note = await compile(x)
      e.lsc.push(note)
      if (session.accesIdb) this.buf.mapSec[note.pk] = note // Pour gestion des fichiers
    }
    for (const x of ret.rowChats) {
      this.buf.putIDB(x)
      e.lch.push(await compile(x))
    }
    for (const x of ret.rowSponsorings) {
      const sp = await compile(x)
      if (sp._zombi) this.buf.supprIDB(x); else this.buf.putIDB(x)
      e.lsp.push(e)
    }
    return [true, avatar]
  }

  grEnMoins(id, mapav, groupesAv) {
    this.supprAv(id)
    mapav.delete(id)
    const groupesAp = new Set()
    mapav.forEach(av => { av.idGroupes(groupesAp) })
    this.grSuppr = difference(groupesAv, groupesAp)
    for(const idg of this.grSuppr) this.supprGr(idg)
  }

  /* Chgt d'un avatar détecté par sa version
  - implique un changement possible de la liste des groupes
  */
  async chgAvatar (objv) {
    const session = stores.session
    const id = objv.id
    const aSt = stores.avatar

    const mapav = aSt.avatars // état "courant" des avatars dans la fonction
    const groupesAv = new Set()
    mapav.forEach(av => { 
      av.idGroupes(groupesAv) 
    })

    function avDisparu (self) {
      if (objv.id === session.compteId) {
        self.resiliation = true
      } else {
        if (objv.id === session.avatarId) {
          // c'était l'avatar "courant" -> avatar principal
          session.setAvatarId(session.compteId)
        }
        // Il n'y a pas de groupes en plus, mais peut-être en moins
        self.grEnMoins(id, mapav, groupesAv)
      }
    }

    if (objv._zombi) { avDisparu(this); return } // avatar disparu

    const [vivant, avatar] = await this.majAv(id)

    if (!vivant) { avDisparu(this); return } // avatar finalement disparu

    if (avatar) mapav.set(avatar.id, avatar)
    const groupesAp = new Set()
    mapav.forEach(av => { av.idGroupes(groupesAp) })

    const grPlus = difference(groupesAp, groupesAv)
    for(const idg of grPlus) {
      // On peut récupérer des _zombis dans grPlus, détectés par majGr
      if (!await this.majGr(idg)) groupesAp.delete(idg)
    }
    // la liste des groupesAp est définitive
    this.grSuppr = difference(groupesAv, groupesAp)
    for(const idg of this.grSuppr) this.supprGr(idg)
  }

  init () {
    this.resiliation = false
    this.versions = new Map() // versions des sous-collections d'avatars / groupes modifiées
    this.buf = new IDBbuffer() // Maj iDB en attente de commit

    /* Sous-collections avatars ajoutés ou mis à jour à mettre à jour en store
    { id, av: avatar, lch: [], lsp: [], lsc: [] }
    */
    this.avMaj = new Map()
    /* Sous-collections avatars ajoutés ou mis à jour à mettre à jour en store
    { id, gr: groupe, lmb: [], lsc: [] }
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
  }

  async final () {
    if (this.resiliation) {
      deconnexion()
      return
    }
    const session = stores.session
    const aSt = stores.avatar
    const gSt = stores.groupe

    // désabonnements
    if (session.fsSync && this.abPlus.size) for (const id of this.abPlus) {
      if (ID.estAvatar(id)) await session.fsSync.setAvatar(id)
      if (ID.estGroupe(id)) await session.fsSync.setGroupe(id)
      if (ID.estTribu(id)) await session.fsSync.setTribu(id)
    }
    if (session.fsSync && this.abMoins.size) for (const id of this.abMoins) {
      if (ID.estAvatar(id)) await session.fsSync.unsetAvatar(id)
      if (ID.estGroupe(id)) await session.fsSync.unsetGroupe(id)
      if (ID.estTribu(id)) await session.fsSync.unsetTribu(id)
    }
    if (!session.fsSync && (this.abPlus.size || this.abMoins.size)) {
      const args = { token: session.authToken, abMoins: this.abMoins, abPlus: this.abPlus }
      this.tr(await post(this, 'GestionAb', args))    
    }

    /* Maj de compta si suppression d'avatars PAS ENCORE intégrées à mavk
    Il y a eu détection d'avatar zombi encore non connu de compta
    - Maj du store par anticipation
    - Maj du document sur serveur
    */
    if (this.avSuppr.size) {
      const compta = this.compta || aSt.compta.clone()
      const ok = compta.updAvatarMavk (this.avSuppr)
      if (ok) {
        if (!this.compta) this.compta = compta
        const lm = await compta.lmAvatarMavk(this.avSuppr)
        const args = { token: session.authToken, lm }
        this.tr(await post(this, 'MajMavkAvatar', args))
      }
    }

    // commit IDB
    let x = false
    if (this.versions.size) {
      x = true
      for(const [id, objv] of this.versions) Versions.set(id, objv)
    }
    if (this.grSuppr.size) {
      x = true
      for(const id of this.grSuppr) Versions.del(id)
    }
    if (this.avSuppr.size) {
      x = true
      for(const id of this.avSuppr) Versions.del(id)
    }
    this.buf.commitIDB(false, x)

    // Maj des stores
    if (this.compta) aSt.setCompta(this.compta)
    if (this.tribu) aSt.setTribu(this.tribu)
    if (this.tribu2) aSt.setTribu2(this.tribu2)

    this.avSuppr.forEach(id => { aSt.del(id) })
    this.avMaj.forEach(e => { aSt.lotMaj(e) })

    // Retire en store les groupes supprimés dans les lgr des avatars qui les référencent encore
    const mapIdNi = this.grSuppr.size ? aSt.avatarsDeGroupes(this.grSuppr) : null
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
    if (session.niv > 2 && !session.estComptable) deconnexion()
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
      const objv = Versions.compile(row)
      if (ID.estGroupe(row.id)) {
        if (objv._zombi) {
          this.supprGr(row.id)
        } else {
          await this.majGr(row.id)
        }
      } else {
        await this.chgAvatar(objv)
      }
      await this.final()
    } catch (e) { 
      await this.finKO(e)
    }
  }
}

export class OnchangeCompta extends OperationWS {
  constructor () { super($t('OPsync')) }

  async chgTribu () {
    const args = { token: session.authToken, 
      id: this.compta.idt, tribu2: true, setC: true }
    const ret = this.tr(await post(this, 'GetTribu', args))
    this.abPlus.add(this.compta.idt)
    this.abMoins.add(this.avCompta.idt)
    this.buf.putIDB(ret.rowTribu)
    this.tribu = await compile(rowTribu)
    this.buf.putIDB(ret.rowTribu2)
    this.tribu2 = await compile(rowTribu2)
  }

  async run (row) {
    try {
      this.init()
      const session = stores.session
      const aSt = stores.avatar
      const gSt = stores.groupe

      this.avCompta = aSt.compta  
      if (row.v <= this.avCompta.v) return // sync retardée déjà traitée

      this.compta = await compile(row)
      /* Dans compta, nctk a peut-être été recrypté */
      if (this.compta.nctk) {
        const args = { token: session.authToken, nctk: this.compta.nctk }
        this.tr(await post(this, 'MajNctkCompta', args))
        delete this.compta.nctk
      }
      this.buf.putIDB(this.compta)

      /* on traite le changement de tribu, pas sa mise à jour
      qui vient par la mise à jour de la tribu */
      if (this.compta.idt !== this.avCompta.idt) await this.chgTribu()

      const avlav = this.avCompta.avatarIds
      const groupesAv = new Set() // ids des groupes AVANT
      avlav.forEach(id => { 
        const a = aSt.getAvatar(id)
        if (a) a.idGroupes(groupesAv)
      })

      const aplav1 = this.compta.avatarIds // Nouvelle liste d'avatars depuis compta
      const aplav = new Set(aplav1) // Liste depuis compta MOINS ceux disparus
      const avPlus = new Set()
      const avMoinsCompta = new Set() // avatars disparus à enlever de compta
      for (const id of difference(aplav1, avlav)) { // Avatars en plus, a priori
        const [vivant, avatar] = await this.majAv(id)
        if (!vivant) { 
          aplav.delete(id)
          avMoinsCompta.add(id) 
        } else {
          avPlus.add(id)
          // this.avMaj a été rempli par la maj de l'avatar id
        }
      }
      if (avMoinsCompta.size) { // Il y avait des avatars disparus dans compta
        // Maj de compta sur le serveur
        const lm = await Compta.lmAvatarMavk(avMoins, session.clek)
        const args = { token: session.authToken, lm }
        this.tr(await post(this, 'MajMavkAvatar', args))
        // Maj par anticipation sur this.compta
        for(const id of avMoins) this.compta.mav.delete(id)
      }

      const avMoins = difference(avlav, aplav)
      if (avMoins.size) for (const id of avMoins) this.supprAv(id)

      const groupesAp = new Set() // ids des groupes APRES
      aplav.forEach(id => {
        /* on prend les groupes,
        - soit dans l'avatar mis à jour
        - soit dans l'avatar actuel inchangé
        */
        const e = this.avMaj.get(id)
        const a = e && e.av ? e.av : aSt.getAvatar(id)
        if (a) a.idGroupes(groupesAp)
      })

      const grPlus = difference(groupesAp, groupesAv)
      // Ajout MAIS destruction quand c'est un _zombi
      if (grPlus.size) for(const id of grPlus) await this.majGr(id)
      
      const grMoins = difference(groupesAv, groupesAp)
      // destruction des inutiles
      if (grMoins.size) for (const id of grMoins) this.supprGr(id)

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
          this.tribu2 = await compile(row)
          if (!this.tribu2.acompte) {
            this.resiliation = true
            deconnexion()
            return
          }
          this.buf.putIDB(row)
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
