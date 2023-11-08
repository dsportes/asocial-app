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

  static reset() { SyncQueue.queue.length = 0 }

  static push(row) {
    SyncQueue.queue.push(row)
    SyncQueue.traiterQueue()
  }

  static traiterQueue() {
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
      else if (row._nom === 'espaces') op = new OnchangeEspace()
      if (op) await op.run(row)
      if (session.synchro) session.sessionSync.setDhSync(Date.now())
      session.syncEncours = false
      SyncQueue.traiterQueue()
    }, 50)
  }
}

/* OperatioWS *********************************************************************/
export class OperationWS extends Operation {
  constructor(nomop) { super(nomop) }

  async finKO(e) {
    const exc = appexc(e)
    exc.sync = true
    await stores.ui.afficherExc(exc)
  }

  async gestionAb() {
    // (dés)abonnements
    if (this.session.fsSync && this.abPlus.size) for (const id of this.abPlus) {
      if (ID.estAvatar(id)) await this.session.fsSync.setAvatar(id)
      if (ID.estGroupe(id)) await this.session.fsSync.setGroupe(id)
      if (ID.estTribu(id)) await this.session.fsSync.setTribu(id)
    }
    if (this.session.fsSync && this.abMoins.size) for (const id of this.abMoins) {
      if (ID.estAvatar(id)) await this.session.fsSync.unsetAvatar(id)
      if (ID.estGroupe(id)) await this.session.fsSync.unsetGroupe(id)
      if (ID.estTribu(id)) await this.session.fsSync.unsetTribu(id)
    }
    if (!this.session.fsSync && (this.abPlus.size || this.abMoins.size)) {
      const args = { token: this.session.authToken, abMoins: this.abMoins, abPlus: this.abPlus }
      this.tr(await post(this, 'GestionAb', args))
    }
  }

}

export class OnchangeVersion extends OperationWS {
  constructor() { super($t('OPsync')) }

  version(id) { return this.veCache.get(id) || Versions.get(id) }

  eavMaj(id) {
    let e = this.avMaj.get(id)
    if (!e) {
      e = { id, av: null, lno: [], lch: [], lsp: [], ltk: [] }
      this.avMaj.set(id, e)
    }
    return e
  }

  egrMaj(id) {
    let e = this.grMaj.get(id)
    if (!e) {
      const e = { id: id, gr: null, lmb: [], lsc: [], objv: null }
      this.grMaj.set(id, e)
    }
    return e
  }

  // Traite les mises à jour à synchroniser présentes dans this.ret
  async process() {
    this.veCache = new Map() // cache des versions
    this.grCache = new Map() // cache des groupes changés

    // lotMaj ({id, av, lch, lsp, lno, ltk})
    this.avMaj = new Map()

    // lotMaj ({id, gr, lmb, lno, objv}) 
    this.grMaj = new Map() // cache des groupes changés

    if (this.rowAvatar) {
      this.buf.putIDB(this.rowAvatar)
      const e = this.eavMaj(this.avatar.id)
      e.av = this.avatar
    }

    if (this.ret.rowVersions) for (const row of this.ret.rowVersions) {
      const version = Versions.compile(row)
      this.veCache.set(version.id, version)
      if (ID.estGroupe(version.id)) {
        const e = this.egrMaj(version.id)
        e.objv = version
      }
    }

    if (this.ret.rowAvatars) for (const row of this.ret.rowAvatars) {
      if (this.rowAvatar && this.rowAvatar.id === row.id) continue // Fait ci-dessus
      this.buf.putIDB(row)
      const av = await compile(row)
      const e = this.eavMaj(av.id)
      e.av = av
    }

    if (this.ret.rowGroupes) for (const row of this.ret.rowGroupes) {
      this.buf.putIDB(row)
      const gr = await compile(row)
      this.grCache.set(row.id, gr)
      const e = this.egrMaj(gr.id)
      e.gr = gr
    }

    if (this.ret.rowNotes) for (const row of this.ret.rowNotes) {
      this.buf.putIDB(row)
      const note = await compile(row)
      const e = ID.estGroupe(note.id) ? this.egrMaj(note.id) : this.eavMaj(note.id)
      e.lno.push[note]
      if (session.accesIdb) this.buf.mapSec[note.pk] = note // Pour gestion des fichiers
    }

    if (this.ret.rowChats) for (const row of this.ret.rowChats) {
      const chat = await compile(row)
      this.buf.putIDB(row)
      const e = this.eavMaj(chat.id)
      e.lch.push(chat)
    }

    if (this.ret.rowTickets) for (const row of this.ret.rowTickets) {
      const tk = await compile(row)
      if (tk._zombi) this.buf.supprIDB(row); else this.buf.putIDB(row)
      const e = this.eavMaj(tk.id)
      e.ltk.push(tk)
    }

    if (this.ret.rowSponsorings) for (const row of this.ret.rowSponsorings) {
      const sp = await compile(row)
      if (sp._zombi) this.buf.supprIDB(row); else this.buf.putIDB(row)
      const e = this.eavMaj(sp.id)
      e.lsp.push(sp)
    }

    if (this.ret.rowMembers) for (const row of this.ret.rowMembers) {
      const mb = await compile(row)
      if (mb._zombi) this.buf.supprIDB(row); else this.buf.putIDB(row)
      const e = this.egrMaj(mb.id)
      e.lmb.push(mb)
    }
  }

  diffsAvGr() {
    // Comparaison entre avatar avant (this.avAvatar) et nouveau (this.avatar)
    this.grIdsAp = this.avatar.idGroupes()
    this.grMoins = difference(this.grIdsAv, this.grIdsAp)
    this.grPlus = difference(this.grIdsAp, this.grIdsAv)
    this.avIdsAp = this.avatar.avatarIds
    this.avMoins = difference(this.avIdsAv, this.avIdsAp)
    this.avPlus = difference(this.avIdsAp, this.avIdsAv)
  }

  // Charge les mises à jour à synchroniser
  async retry() {
    /* map du / des avatars à récupérer:
      - clé:id, 
      - valeur: version actuelle */
    this.avmap = {}

    /* map du / des groupes à récupérer:
      - clé: idg
      - valeur: { mbs, v } */
    this.grmap = {}

    // la seule version changée est celle qui a déclenché le sync
    if (!this.estGr) {
      this.avmap[this.objv.id] = this.vact
    } else {
      const x = this.aSt.compte.mbsOfGroupe(this.objv.id)
      if (x) // groupe déjà connu
        this.grmap[this.objv.id] = { mbs: x.mbs, v: this.vact }
      else // groupe venant d'être créé
        this.grmap[this.objv.id] = { mbs: [1], v: 0 }
    }

    while (true) {
      const args = {
        token: this.session.authToken,
        avv: this.avv, avmap: this.avmap, grmap: this.grmap
      }
      this.ret = this.tr(await post(this, 'Synchroniser', args))
      if (!this.ret.KO) break

      // la version de avatar a (encore) changé
      this.rowAvatar = this.ret.rowAvatar
      this.avatar = await compile(this.rowAvatar)
      this.avv = this.avatar.v
      this.nbRetry++
      this.diffsAvGr()
      this.avmap = {}
      this.grmap = {}
      for (const avid of this.avIdsAp)
        this.avmap[avid] = Versions.get(avid).v
      for (const grid of this.grIdsAp) {
        const x = this.aSt.compte.mbsOfGroupe(grid)
        this.grmap[grid] = { mbs: x.mbs, v: Versions.get(grid) }
      }
    }
    await this.process()
  }

  async run(row) {
    try {
      this.buf = new IDBbuffer()
      this.session = stores.session
      this.aSt = stores.avatar
      this.gSt = stores.groupe
      this.avatar = this.aSt.compte
      this.avAvatar = this.aSt.compte
      this.avv = this.avatar.v
      this.nbRetry = 0

      this.objv = Versions.compile(row)
      this.estGr = ID.estGroupe(row.id)
      this.vact = Versions.get(this.objv.id).v

      this.grIdsAv = this.avAvatar.idGroupes()
      this.grIdsAp = this.avAvatar.idGroupes()
      this.avIdsAv = this.avAvatar.avatarIds
      this.avIdsAp = this.avatar.avatarIds

      this.grMoins = new Set()
      this.grPlus = new Set()
      this.avMoins = new Set()
      this.avPlus = new Set()

      await this.retry()

      // commit IDB ***************************************
      // Maj des versions en IDB
      let x = false
      if (this.veCache.size) {
        x = true
        for (const [id, objv] of this.veCache) Versions.set(id, objv)
      }
      if (this.grMoins.size) {
        x = true
        for (const id of this.grMoins) Versions.del(id)
      }
      if (this.avMoins.size) {
        x = true
        for (const id of this.avMoins) Versions.del(id)
      }

      /* Nettoyage des membres / notes perdues sur les groupes
      qui existaient avant et existent après
      */
      this.delMb = new Set()
      this.delNo = new Set()
      this.grIdsAp.forEach(idg => {
        const grav = gSt.getGroupe(idg)
        if (grav) {
          const grap = this.grCache.get(idg)
          if (grap) {
            const [ambav, anoav] = this.avAvatar.ammbamo(grav)
            const [ambap, anoap] = this.avatar.ammbamo(grap)
            if (ambav && !ambap) {
              this.delMb.add(idg)
              this.buf.purgeGroupeMbIDB(idg)
            }
            if (anoav && !anoap) {
              this.delNo.add(idg)
              this.buf.purgeGroupeNoIDB(idg)
            }
          }
        }
      })
      this.buf.commitIDB(false, x)

      // Maj des stores *********************************
      if (this.avMoins.size) this.avMoins.forEach(id => { aSt.del(id) })
      if (this.grMoins.size) this.grMoins.forEach(id => { gSt.del(id) })

      if (this.delMb.size) this.delMb.forEach(idg => { this.gSt.delMembre(idg) })
      if (this.delNo.size) this.delNo.forEach(idg => { this.gSt.delNote(idg) })

      this.avMaj.forEach(e => { this.aSt.lotMaj(e) })
      this.grMaj.forEach(e => { this.gSt.lotMaj(e) })

      // Maj des abonnements ******************************
      this.abPlus = new Set() // abonnements de synchronisation ajoutés
      this.abMoins = new Set() // abonnements de synchronisation supprimés
      if (this.avMoins.size) this.avMoins.forEach(id => { this.abMoins.add(id) })
      if (this.grMoins.size) this.grMoins.forEach(id => { this.abMoins.add(id) })
      if (this.avPlus.size) this.avPlus.forEach(id => { this.abPlus.add(id) })
      if (this.grPlus.size) this.grPlus.forEach(id => { this.abPlus.add(id) })
      await this.gestionAb()

      if (this.session.accesIdb) await gestionFichierSync(this.buf.mapSec)

      this.session.setDh(this.dh)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

export class OnchangeCompta extends OperationWS {
  constructor() { super($t('OPsync')) }

  async run(row) {
    try {
      this.buf = new IDBbuffer() // Maj iDB en attente de commit
      this.abPlus = new Set() // abonnements de synchronisation ajoutés
      this.abMoins = new Set() // abonnements de synchronisation supprimés

      const session = stores.session
      const aSt = stores.avatar
      this.tribu = null

      this.avCompta = aSt.compta
      if (row.v <= this.avCompta.v) return // sync retardée déjà traitée

      this.compta = await compile(row)
      /* Dans compta, cletK a peut-être été recryptée */
      if (!session.estFige && this.compta.cletK) {
        const args = { token: session.authToken, cletK: this.compta.cletK }
        this.tr(await post(this, 'MajCletKCompta', args))
        delete this.compta.cletK
      }
      this.buf.putIDB(row)

      /* on traite le changement de tribu, pas sa mise à jour
      qui vient par la mise à jour de la tribu */
      if (this.compta.idt !== this.avCompta.idt) {
        if (this.compta.idt) { // Changement de tribu
          const args = {
            token: session.authToken,
            id: this.compta.idt, setC: true
          }
          const ret = this.tr(await post(this, 'GetTribu', args))
          this.abPlus.add(this.compta.idt)
          this.abMoins.add(this.avCompta.idt)
          this.buf.putIDB(ret.rowTribu)
          this.tribu = await compile(rowTribu)
          await this.gestionAb()
        } else { // plus de tribu (devient A)
          this.abMoins.add(this.avCompta.idt)
          this.buf.supprIDB({ _row: 'tribus', id: this.avCompta.idt })
          this.delTribu = true
        }
      }

      this.buf.commitIDB()

      // Maj des stores
      aSt.setCompta(this.compta)
      if (this.tribu) aSt.setTribu(this.tribu)
      if (this.delTribu) aSt.setTribu(null)

      session.setDh(this.dh)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

export class OnchangeTribu extends OperationWS {
  constructor() { super($t('OPsync')) }

  async run(row) {
    try {
      this.buf = new IDBbuffer() // Maj iDB en attente de commit

      const aSt = stores.avatar
      const session = stores.session
      this.tribu = null

      if (session.estComptable) {
        const avTr = aSt.getTribu(row.id)
        if ((!avTr || avTr.v < row.v) || (aSt.tribu.v < row.v)) {
          // tribu du compte ou de la collection à rafraîchir
          this.tribu = await compile(row)
        }
      } else {
        if (aSt.tribu && (row.v > aSt.tribu.v)) {
          this.tribu = await compile(row)
          if (!this.tribu.aCompte) {
            deconnexion()
            return
          }
          this.buf.putIDB(row)
        }
      }

      this.buf.commitIDB()

      // Maj des stores
      if (this.tribu) aSt.setTribu(this.tribu)
      session.setDh(this.dh)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

export class OnchangeEspace extends OperationWS {
  constructor() { super($t('OPsync')) }

  async run(row) {
    try {
      const session = stores.session
      const esp = await compile(row)
      session.setEspace(esp)
      if (session.estClos) {
        const ui = stores.ui
        ui.setPage('clos')
      }
    } catch (e) {
      await this.finKO(e)
    }
  }
}
