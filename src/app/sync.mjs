import stores from '../stores/stores.mjs'
import { RafraichirDons } from './operations.mjs'
import { deconnexion } from './synchro.mjs'
// import { decode } from '@msgpack/msgpack'
import { compile, Versions, estZombi } from './modele.mjs'
import { IDBbuffer, gestionFichierSync } from './db.mjs'
import { difference } from './util.mjs'
import { appexc, ID } from './api.mjs'
import { post } from './net.mjs'
import { Operation } from './synchro.mjs'

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

/* OP_OnchangeVersion: 'Opération de synchronisation (changement de version)'
Paradoxalement on se fiche complètement de savoir quelle version de quel groupe
ou avatar a décleché ce trigger : quelque chose a changé, on va chercher quoi.
La liste des groupes et avatars se trouven dans aSt.compte (la version actuelle du compte).
Les versions actuellement détenues en session sont dans Versions.
Pour chaque groupe détenu, s'il détient ou non les membres et notes
figure dans le store dans gSt.egr(grid)
Premier appel optimiste:
- on demande tout ce qui a changé sur les avatars et groupes détenus
- mais on donne la version du cimpte sur laquelle cette liste a été obtenue.
Retour OK: la liste n'a pas changé, on traite les mises à jout.
Retour KO:
- le compte a changé, ses listes d'avatars et de groupes ont pu changé
- le retour ne donne pas la liste des mises à jour.
- on recalcule la nouvelle liste des avatars et groupes depuis le nouveau compte
reçu et les versions détenues.
- on refait l'appel des mises à jour en fonction de ces nouvelles listes.
- et on espère que cette fois-ci, la version du compte n'a pas changé,
sinon on reboucle.

Enfin on traite les mises à jour reçues, les groupes et avatars supprimés
et les groupes dont les membres / notes ne sont plus utiles.
*/
export class OnchangeVersion extends OperationWS {
  constructor() { super('OnchangeVersion') }

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
      e = { id: id, gr: null, lmb: [], lno: [], lch: [], objv: null }
      this.grMaj.set(id, e)
    }
    return e
  }

  // Traite les mises à jour à synchroniser présentes dans this.ret
  async process() {
    if (this.rowCompte) {
      // enregistrement de la nouvelle version du compte (si elle a changé)
      this.buf.putIDB(this.rowCompte)
      const e = this.eavMaj(this.compte.id)
      e.av = this.compte
    }

    if (this.ret.rowVersions) for (const row of this.ret.rowVersions) {
      const version = Versions.compile(row)
      if (ID.estGroupe(version.id)) {
        if (version._zombi) {
          // normalement il devrait déjà être dans les grMoins
          // ça doit avoir été détecté dans le compte
          this.grMoins.add(version.id)
        } else {
          if (this.grIdsAp.has(version.id)) {
            this.veCache.set(version.id, version)
            const e = this.egrMaj(version.id)
            e.objv = version // pour les volumes
          }
        }
      } else {
        this.veCache.set(version.id, version)
      }
    }

    if (this.ret.rowAvatars) for (const row of this.ret.rowAvatars) {
      // on ignore l'avatar principal qui est passé précédemment dans "compte"
      if (this.rowCompte && this.rowCompte.id === row.id) continue
      this.buf.putIDB(row)
      const av = await compile(row)
      const e = this.eavMaj(av.id)
      e.av = av
    }

    if (this.ret.rowGroupes) for (const row of this.ret.rowGroupes) {
      if (!this.grIdsAp.has(row.id)) continue
      this.buf.putIDB(row)
      const gr = await compile(row)
      this.grCache.set(row.id, gr)
      const e = this.egrMaj(gr.id)
      e.gr = gr
    }

    if (this.ret.rowNotes) for (const row of this.ret.rowNotes) {
      if (ID.estGroupe(row.id)) {
        if (!this.grIdsAp.has(row.id)) continue
      } else {
        if (!this.avIdsAp.has(row.id)) continue
      }
      const note = await compile(row)
      if (note._zombi) this.buf.supprIDB(row); else this.buf.putIDB(row)
      const e = ID.estGroupe(note.id) ? this.egrMaj(note.id) : this.eavMaj(note.id)
      e.lno.push(note)
      // if (this.session.accesIdb) this.buf.mapSec[note.pk] = note // Pour gestion des fichiers
    }

    if (this.ret.rowChats) for (const row of this.ret.rowChats) {
      if (!this.avIdsAp.has(row.id)) continue
      const chat = await compile(row)
      this.buf.putIDB(row)
      const e = this.eavMaj(chat.id)
      e.lch.push(chat)
    }

    if (this.ret.rowTickets) for (const row of this.ret.rowTickets) {
      if (!this.avIdsAp.has(row.id)) continue
      const tk = await compile(row)
      if (tk._zombi) this.buf.supprIDB(row); else this.buf.putIDB(row)
      const e = this.eavMaj(tk.id)
      e.ltk.push(tk)
    }

    if (this.ret.rowSponsorings) for (const row of this.ret.rowSponsorings) {
      if (!this.avIdsAp.has(row.id)) continue
      const sp = await compile(row)
      if (sp._zombi) this.buf.supprIDB(row); else this.buf.putIDB(row)
      const e = this.eavMaj(sp.id)
      e.lsp.push(sp)
    }

    if (this.ret.rowMembres) for (const row of this.ret.rowMembres) {
      if (!this.grIdsAp.has(row.id)) continue
      const mb = await compile(row)
      if (mb._zombi) this.buf.supprIDB(row); else this.buf.putIDB(row)
      const e = this.egrMaj(mb.id)
      e.lmb.push(mb)
    }

    if (this.ret.rowChatgrs) for (const row of this.ret.rowChatgrs) {
      if (!this.grIdsAp.has(row.id)) continue
      const ch = await compile(row)
      this.buf.putIDB(row)
      const e = this.egrMaj(ch.id)
      e.lch.push(ch)
    }
  }

  buildGrMap (compte) {
    const grIds = new Set()
    const grmap = {}
    compte.mpg.forEach(e => { grIds.add(e.ng.id) })
    for(const grid of grIds) {
      const e = this.gSt.egr(grid)
      const s = new Set()
      compte.mpg.forEach(x => { if (x.ng.id === grid) s.add(x.im) })
      const vg = Versions.get(grid)
      grmap[grid] = { 
        mbs: Array.from(s), 
        v: vg ? vg. v : 0,
        mb: e ? e.groupe.aUnAccesMembre(s) : false,
        no: e ? e.groupe.aUnAccesNote(s) : false
      }
    }
    return [grIds, grmap]
  }

  buildAvMap (compte) {
    const avIds = compte.avatarIds
    const avmap = {}
    for (const avid of avIds) {
      const va = Versions.get(avid)
      avmap[avid] = va ? va.v : 0
    }
    return [avIds, avmap]
  }

  async retry() {
    // Charge les mises à jour à synchroniser
    this.compte = this.aSt.compte
    this.rowAvatar = null

    /* map du / des avatars à récupérer:
      - clé: id de l'avatar, 
      - valeur: version actuelle */
    const [avIds, avmap] = this.buildAvMap(this.compte)
    this.avmap = avmap
    this.avIdsAv = avIds
    this.avIdsAp = avIds
  
    /* map du / des groupes à récupérer:
      - clé: id du groupe
      - valeur: { 
        - mbs: liste des ids des avatars du compte accédant, 
        - v : version actuelle du groupe
        - mb: au moins un avatar a un accès aux membres (les membres sont chargés)
        - no: au moins un avatar a un accès aux notes (les notes sont chargées)
      } 
    */
    const [grIds, grmap] = this.buildGrMap(this.compte)
    this.grmap = grmap
    this.grIdsAv = grIds
    this.grIdsAp = grIds

    this.nbretry = 0
    while (true) {
      const args = {
        token: this.session.authToken,
        avv: this.compte.v, 
        avmap: this.avmap, 
        grmap: this.grmap
      }
      this.ret = this.tr(await post(this, 'Synchroniser', args))
      if (this.ret.KO) {
        /* la version du compte avatar a (encore ?) changé
        il faut recommencer mais avec de nouvelles listes
        d'avatars et de groupes à aller chercher
        */
        this.rowCompte = this.ret.rowAvatar
        this.compte = await compile(this.rowCompte)
        const [avIds, avmap] = this.buildAvMap(this.compte)
        this.avmap = avmap
        this.avIdsAp = avIds
        const [grIds, grmap] = this.buildGrMap(this.compte)
        this.grmap = grmap
        this.grIdsAp = grIds
        this.nbRetry++
      } else {
        break
      }
    }
  }

  async run(row) {
    try {
      /* Le row versions reçu a-t-il de facto déjà été pris en 
      compte lors d'un traitement antérieur d'un autre row versions 
      déclenché par la même transaction ?
      */
      const v = Versions.get(row.id)
      if (v && v.v >= row.v) 
        return

      this.buf = new IDBbuffer()
      this.session = stores.session
      this.aSt = stores.avatar
      this.gSt = stores.groupe

      await this.retry()

      if (this.ret.rowVersions) for (const row of this.ret.rowVersions) {
        if (row.id === this.session.compteId && estZombi(row)) {
          stores.session.setKO()
          stores.ui.setPage('clos')
          return
        }
      }

      // Comparaison entre avatar avant (this.avAvatar) et nouveau (this.avatar)
      this.grMoins = difference(this.grIdsAv, this.grIdsAp)
      this.grPlus = difference(this.grIdsAp, this.grIdsAv)
      this.avMoins = difference(this.avIdsAv, this.avIdsAp)
      this.avPlus = difference(this.avIdsAp, this.avIdsAv)
      // cache des versions changées pour mise à jour finale
      this.veCache = new Map()
      // cache des groupes changés : pour purge des membres / notes inutiles
      this.grCache = new Map() 
      // lotMaj ({id, av, lch, lsp, lno, ltk})
      this.avMaj = new Map()
      // lotMaj ({id, gr, lmb, lno, objv}) 
      this.grMaj = new Map() // cache des groupes changés

      await this.process()

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
        const grav = this.gSt.getGroupe(idg)
        if (grav) {
          const grap = this.grCache.get(idg)
          if (grap) {
            const [ambav, anoav] = this.aSt.compte.ambano(grav)
            const [ambap, anoap] = this.compte.ambano(grap)
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
      if (this.avMoins.size) this.avMoins.forEach(id => { this.aSt.del(id) })
      if (this.grMoins.size) this.grMoins.forEach(id => { this.gSt.del(id) })

      if (this.delMb.size) this.delMb.forEach(idg => { this.gSt.delMembre(idg) })
      if (this.delNo.size) this.delNo.forEach(idg => { this.gSt.delNote(idg) })

      this.avMaj.forEach(e => { this.aSt.lotMaj(e) })
      this.grMaj.forEach(e => { this.gSt.lotMaj(e) })

      // gestion des "courants"
      if (this.avMoins.has(this.session.avatarId))
        this.session.setAvatarId(0)
      if (this.grMoins.has(this.session.groupeId)) {
        this.session.setGroupeId(0)
        this.session.setMembreId(0)
      }

      // Maj des abonnements ******************************
      this.abPlus = new Set() // abonnements de synchronisation ajoutés
      this.abMoins = new Set() // abonnements de synchronisation supprimés
      if (this.avMoins.size) this.avMoins.forEach(id => { this.abMoins.add(id) })
      if (this.grMoins.size) this.grMoins.forEach(id => { this.abMoins.add(id) })
      if (this.avPlus.size) this.avPlus.forEach(id => { this.abPlus.add(id) })
      if (this.grPlus.size) this.grPlus.forEach(id => { this.abPlus.add(id) })
      if (this.abPlus.size || this.abMoins.size)
        await this.gestionAb()

      // if (this.session.accesIdb) await gestionFichierSync(this.buf.mapSec)

      this.session.setDh(this.dh)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_OnchangeCompta: 'Opération de synchronisation (changement de compta)'
*/
export class OnchangeCompta extends OperationWS {
  constructor() { super('OnchangeCompta') }

  async run(row) {
    try {
      this.buf = new IDBbuffer() // Maj iDB en attente de commit
      this.abPlus = new Set() // abonnements de synchronisation ajoutés
      this.abMoins = new Set() // abonnements de synchronisation supprimés

      const session = stores.session
      const aSt = stores.avatar
      this.tribu = null

      this.avCompta = aSt.compta
      // console.log('OnChangeCompta', row.v, row._data_.length)
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

      // MAJ des dons éventuellement en attente
      if (this.compta.dons) await new RafraichirDons().run()

      session.setDh(this.dh)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_OnchangeTribu: 'Opération de synchronisation (changement de tranche)'
*/
export class OnchangeTribu extends OperationWS {
  constructor() { super('OnchangeTribu') }

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
  constructor() { super('OPsOnchangeEspaceync') }

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
