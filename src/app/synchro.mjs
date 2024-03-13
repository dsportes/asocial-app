/* TODO: synchro
- gérer fichiers des notes AvNote / Fetat - Changer Fetat id av /gr, ids note - idf en index (plus en id)
*/
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { afficherDiag, $t, random } from './util.mjs'
import { idb, IDBbuffer } from './db.mjs'
import { DataSync, appexc, ID, Rds, Cles, d14 } from './api.mjs'
import { post } from './net.mjs'
import { CV, compile, RegCles } from './modele.mjs'
import { crypter } from './webcrypto.mjs'

/* classe Queue ***********************************************************/
class Queue {
  constructor () {
    this.reset()
  }

  reset () {
    this.dataSync = null // dataSync courant de la session. Maj au retour de Sync
    this.job = null // traitement en cours

    /* Evénnements à traiter: row OU rowv
      Les rds sont longs
      - mv : max v, plus haute version traitée ou à traiter
      - row : row reçu sur un POST
      - rowv : { rds, v) } tiré d'une notification de changement d'un row versions
        Remarque: la propriété suppr ne sert qu'au GC. La suppression effective
        parvient sur un row comptes.
    */
    this.compte = { rowv: null, mv: 0, row: null }
    this.compta = { rowv: null, mv: 0, row: null }
    this.espace = { rowv: null, mv: 0, row: null }
    this.partition = { rds: 0, rowv: null, mv: 0, row: null }
    /* cle: rds, 
      valeur pour un avatar: v
      valeur pour un groupe: { v, vg, vm, vn }
        - v: version générale, incrémentée quelque soit la maj de versuions
        - vg: version de groupe / chatgr
        - vm: version des membres
        - vn: version des notres
    */
    this.avgrs = new Map()
  }

  /* Au retour de n'importe quelle opération un ou plusieurs rows CCEP
  peuvent être retournés. Ils vont être enregistrés dans le flow normal de synchro
  resp.compte || resp.compta || resp.espace || resp.partition
  */
  async postResp (resp) { // Au retour d'un POST PAS Sync
    if (resp.rowCompte) {
      if (resp.rowCompte.v > this.compte.mv) {
        this.compte.row = resp.rowCompte
        this.compte.rowv = null
        this.compte.mv = resp.rowCompte.v  
        this.reveil()
      }
      return
    }

    if (resp.rowCompta) {
      if (resp.rowCompta.v > this.compta.mv) {
        this.compta.row = resp.rowCompta
        this.compta.rowv = null
        this.compta.mv = resp.rowCompta.v
        this.reveil()
      }
      return
    }

    if (resp.rowEspace) {
      if (resp.rowEspace.v > this.espace.mv) {
        this.espace.row = resp.rowEspace
        this.espace.rowv = null
        this.espace.mv = resp.rowEspace.v
        this.reveil()
      }
      return 
    }
    
    if (resp.rowPartition) {
      if (resp.rowPartition.v > this.partition.mv) {
        this.partition.row = resp.rowPartition
        this.partition.rowv = null
        this.partition.mv = resp.rowPartition.v
        this.reveil()
      }
    }
  }

  /* Enregistrement à l'arrivée d'un ou plusieurs row versions sur écoute / WS */
  setRows (rows) { 
    const ns = stores.session.ns
    if (rows) rows.forEach(r => {
      const nom = Rds.typeS(r.rds)
      const rds = Rds.long(r.rds, ns)
      const v = r.v

      switch (nom) {
      case 'comptes' : {
        if (this.compte.mv < v) { this.compte.mv = v; this.compte.rowv = row; this.compte.row = null }
        break
      }
      case 'comptas' : {
        if (this.compta.v < v) { this.compta.mv = v; this.compta.rowv = row; this.compta.row = null }
        break
      }
      case 'espaces' : {
        if (this.espace.v < v) { this.espace.mv = v; this.espace.rowv = row; this.espace.row = null }
        break
      }
      case 'partitions' : {
        /* le "rds" de partition a été fixé avant par le compte et c'est lui qui prévaut */
        if (this.partition.rds === rds && this.partition.v < v) 
          { this.partition.mv = v; this.partition.rowv = row; this.partition.row = null }
        break
      }
      case 'groupes' : {
        const vx = decode(r._data) // vx: { v, vg, vm, vn  }
        const x = this.avgrs.get(rds)
        if (!x || x.v < vx.v) this.avgrs.set(rds, vx)
        break
      }
      case 'avatars' : {
        const x = this.avgrs.get(rds)
        if (!x || x.v < v) this.avgrs.set(rds, v)
        break
      }
      }
      this.reveil()
    })
  }

  get VersionCCEPtodo () {
    return this.compte.rowv || this.compta.rowv || this.espace.rowv || this.partition.rowv
  }

  get RowCCEPtodo () {
    return this.compte.row || this.compta.row || this.espace.row || this.partition.row
  }

  reveil () {
    if (this.job || !stores.session.ok) return

    /* PRIORITE 1 : Traitement des rows directement reçus en retour d'un POST */
    if (this.RowCCEPtodo) {
      const arg = { }
      if (this.compte.row) { arg.rowCompte = this.compte.row; this.compte.row = null }
      if (this.compta.row) { arg.rowCompta = this.compta.row; this.compta.row = null }
      if (this.espace.row) { arg.rowEspace = this.espace.row; this.espace.row = null }
      if (this.partition.row) { arg.rowPartition = this.partition.row; this.partition.row = null }
      this.job = new Job()
      const ds = new DataSync(syncQueue.dataSync.serial)
      setTimeout(() => { this.job.doRowCcep(ds, arg) }, 5)
      return
    }

    /* PRIORITE 2 : Traitement des notifications de changement des versions des CCEP
    reçues sur écoute / WS. Possible impact de synchro (avatars / groupes nouveaux ou disparus) */
    if (this.VersionCCEPtodo) {
      if (this.compte.rowv) { this.compte.rowv = null }
      if (this.compta.rowv) { this.compta.rowv = null }
      if (this.espace.rowv) { this.espace.rowv = null }
      if (this.partition.rowv) { this.partition.rowv = null }
      this.job = new Job()
      const ds = new DataSync(syncQueue.dataSync.serial)
      setTimeout(() => { this.job.doVersionCcep(ds) }, 5)
      return
    }

    /* PRIORITE 3 : Traitement des notifications de changement des versions des avatars / groupes
    reçues sur écoute / WS. */
    if (this.avgrs.size) {
      const lida = []
      for (const [, x] of this.avgrs) {
        this.avgrs.delete(x.rds)
        lida.push(Reg.Rds(x.rds))
      }
      const ds = new DataSync(syncQueue.dataSync.serial)
      this.job = new Job()
      setTimeout(() => { this.job.doAvGr(ds, lida) }, 5)
      return
    }
  }

  finJob (ds) {
    /* Maj de queue en fonction du nouveau DataSync
    this.compte = { rowv: null, mv: 0, row: null }
    ...
    this.avgrs = new Map() Recalculé depuis ds ET les valeurs restées pertinentes de l'actuel
    */
    if (ds.compte.vs >= this.compte.mv) { 
      this.compte.rowv = null; this.compte.row = null; this.compte.mv = ds.compte.vs
    }
    if (ds.compta.vs >= this.compta.mv) { 
      this.compta.rowv = null; this.compta.row = null; this.compta.mv = ds.compta.vs
    }
    if (ds.espace.vs >= this.espace.mv) { 
      this.espace.rowv = null; this.espace.row = null; this.espace.mv = ds.espace.vs
    }
    if (ds.partition && (ds.partition.rds === this.partition.rds)) {
      this.partition.rowv = null; this.partition.row = null; this.partition.mv = ds.partition.vs
    } else this.partition = { 
      rds: ds.partition ? ds.partition.rds : 0, 
      rowv: null, 
      mv: 0, 
      row: null
    }
    const nvavgrs = new Map()
    for(const e of ds.avatars) {
      const v = this.avgrs.get(e.rds) // version en queue en attente de traitement
      if (v && v > e.vs) nvavgrs.set(e.rds, v) // conservation en queue
    }
    for(const e of ds.groupes) {
      const vx = this.avgrs.get(e.rds) // version en queue en attente de traitement
      if (vx && vx.v > e.vs[0]) nvavgrs.set(e.rds, vx) // conservation en queue
    }
    this.avgrs = nvavgrs
    syncQueue.dataSync = ds
    this.job = null
    this.reveil()
  }
}
export const syncQueue = new Queue()

/* classe Job ***********************************************************/
class Job {
  /* Traitement du changement des "rows" compte ... obtenus,
  - soit en retour de POST 
  - soit par doVersionCcep() ci-après
  */
  async doRowCcep (ds, { rowCompte, rowCompta, rowEspace, rowPartition }) {
    const buf = new IDBbuffer()
    const sb = new SB()
    if (rowCompte) {
      /* rowCompte peut avoir :
      - un changement de partition: 
        finJob(ds) inscrira en queue l'acquisition du nouveau partition
      - des sous-arbre en plus:
        finJob(ds) inscrira en queue l'acquisition des nouveaux sous-arbres
      - des sous-arbres complets en moins: traité ici
      */
      sb.compte = await compile(rowCompte)
      { // avatars perdus: présents dans DataSync mais plus dans compte
        const sd = new Set()
        ds.avatars.forEach((x,id) => { if (!sb.compte.mav.has(id)) sd.add(id)})
        sd.forEach(id => { 
          buf.purgeAvatarIDB(id)
          sb.delA(id)
        })
      }
      { // groupes perdus: présents dans DataSync mais plus dans compte
        const sd = new Set()
        ds.groupes.forEach((x,id) => { if (!sb.compte.mpg.has(id)) sd.add(id)})
        sd.forEach(id => { 
          buf.purgeGroupeIDB(id)
          sb.delG(id)
        })
      }
      { // partition perdue / changée: présente dans DataSync mais plus (ou plus la même) dans compte
        if ((sb.compte.idp && ds.partition.id !== sb.compte.idp ) // partition changée
          || (!sb.compte.idp && ds.partition.id)) { // plus de partition
          buf.putIDB({ _nom: 'partitions' }) // purge, pas de data
          sb.delP()
        }
      }
      buf.putIDB(rowCompte)
      ds.compte.vs = sb.compte.v
    }

    if (rowCompta) {
      sb.compta = await compile(rowCompta)
      buf.putIDB(rowCompta)
      ds.compta.vs = sb.compta.v
    }

    if (rowEspace) {
      sb.espace = await compile(rowEspace)
      buf.putIDB(rowEspace)
      ds.espace.vs = sb.espace.v
    }

    if (rowPartition) {
      sb.partition = await compile(rowPartition)
      buf.putIDB(rowPartition)
      ds.partition.vs = sb.partition.v
    }

    sb.store(buf)
    buf.commit(ds)
    syncQueue.finJob(ds)
  }

  /* Traitement de notifications de changement de versions par OnSnapShot ou WS 
  relatif à un compte, compta ...*/
  async doVersionCcep(ds1) {
    const args = { authData: session.authToken, dataSync: ds1.serial }
    const ret = await post(this, 'Sync2', args)
    const ds = new DataSync(ret.dataSync) // Mis à jour par le serveur
    const arg = { 
      rowCompte: ret.rowCompte, 
      rowCompta: ret.rowCompta, 
      rowEspace: ret.rowEspace, 
      rowPartition: ret.rowPartition
    }
    await this.doRowCcep (ds, arg) // ci-dessus
  }

  /* Traitement de notifications de changement de versions par OnSnapShot ou WS 
  relatif à des sous-arbres avatar / groupe */
  async doAvGr(ds1, lida) {
    const ds = await new SyncStd().run(ds1, lida)
    syncQueue.finJob(ds)
  }
}

/* Store Buffer ******************************************************
Liste des maj accumulées à effectuer en une fois au "commit"
*/
class SB {
  constructor () {
    this.s = stores.session
    this.a = stores.avatar
    this.g = stores.groupe
    this.n = stores.notes
    this.p = stores.people
    this.avSt = stores.avnote

    this.compte = null
    this.compta = null
    this.espace = null
    this.partition = null
    this.supprPa = false

    this.avatar = null
    this.groupe = null 
    this.chatgr = null
    this.notes = new Map()
    this.chats = new Map()
    this.sponsorings = new Map() // si dlv < auj à supprimer
    this.tickets = new Map() // si dlv < auj à supprimer
    this.membres = new Map() // si _zombi, à supprimer

    this.supprAv = new Set() // avatars à supprimer
    this.supprGr = new Set() // groupes à supprimer
    this.supprMb = new Set() // groupes dont les membres sont à supprimer
    this.supprNo = new Set() // groupes dont les notes sont à supprimer
  }

  setA (d) { this.avatar = d }

  setG (d) { this.groupe = d }

  setN (d) { this.notes.set(d.ids, d) }

  setC (d) { this.chats.set(d.ids, d) }

  setS (d) { this.sponsorings.set(d.ids, d) }

  setT (d) { this.tickets.set(d.ids, d) }

  setH (d) { this.chatgr = d }

  setM (d) { this.membres.set(d.ids, d) }

  delA (ida) { this.supprAv.add(ida) }

  delG (idg) { this.supprGr.add(idg) }

  delM (idg) { this.supprMb.add(idg) }

  delN (idg) { this.supprNo.add(idg) }

  delP () { this.supprPa = true}

  /* IDBbuffer passé en paramètres:
  La suppression d'un avatar et la maj / suppression des notes 
  conduit à mettre à jour / supprimer des Avnote et des Fetat. 
  */
  store (buf) {
    if (this.compte) this.s.setCompte(this.compte)
    if (this.compta) this.s.setCompta(this.compta)
    if (this.espace) this.s.setEspace(this.espace)
    if (this.partition) this.s.setPartition(this.partition)
    if (this.supprPa) this.s.delPartition()

    if (this.avatar) {
      this.a.setAvatar(this.avatar)
    }

    if (this.supprAv.size) for (const ida of this.supprAv) {
      this.a.delAvatar(ida)
      this.avSt.delNotes(ida, buf)
    }

    if (this.groupe) {
      this.g.setGroupe(this.groupe)
    }

    if (this.supprGr.size) for (const idg of this.supprGr) {
      this.g.delGroupe(idg)
      this.avSt.delNotes(idg, buf)
    }

    if (this.chatgr) {
      this.g.setChatgr(this.chatgr)
    }

    if (this.notes.size) 
      for(const [,n] of this.notes) { 
        const st = ID.estGroupe(n.id) ? this.g : this.a
        if (n._zombi) {
          this.n.delNote(n.id, n.ids)
          st.delNote(n.id, n.ids)
          this.avSt.delNote(n.id, n.ids, buf)
        } else {
          this.n.setNote(x)
          st.setNote(x, buf)
          this.avSt.setNote(n, buf)
        }
      }
    
    if (this.chats.size) 
      for(const [,ch] of this.chats) {
        if (ch._zombi) {
          const chav = this.a.getChat(x.id, x.ids) // chat AVANT suppression
          if (chav) {
            this.p.delPCh(chav.idE, ch.id)
            this.a.delChat(ch.id, ch.ids)
          }
        } else {
          this.a.setChat(ch)
          this.p.setPCh(ch.idE, ch.id)
        }
      }
    
    if (this.sponsorings.size) 
      for(const [,x] of this.sponsorings) {
        if (x._zombi) this.a.delSponsoring(x.id, x.ids)
        else this.a.setSponsoring(x)
      }
    
    if (this.tickets.size)
      for(const [,x] of this.tickets) {
        if (x._zombi) this.a.delTicket(x.id, x.ids)
        else this.a.setTicket(x)
      }

    if (this.membres.size) 
      for(const [,mb] of this.membres) {
        if (mb._zombi) { 
          const mbav = this.g.getMembre(mb.id, mb.ids) // membre AVANT suppression
          this.g.delMembre(mb.id, mb.ids)
          this.p.delPGr(mbav.idm, mb.id) 
        }
        else { 
          this.g.setMembre(mb); 
          this.p.setPGr(mb.idm, mb.id) }
      }

    if (this.supprMb.size) for(const idg of this.supprMb) {
      for (const ids of this.g.map(idg)) {
        const mbav = this.g.getMembre(idg, ids) // membre AVANT suppression
        this.p.delPGr(mbav.idm, idg) 
      }
      this.g.delMembres(idg)
    }

  }
}

/* Déconnexion, reconnexion, commexion *************************************************/
/* garderMode : si true, garder le mode */
export function deconnexion(garderMode) {
  const ui = stores.ui
  // ui.setPage('null')
  const session = stores.session
  const mode = session.mode
  const org = session.org

  if (session.accesIdb) idb.close()
  if (session.websocket) session.websocket.close()
  if (session.fsSync) session.fsSync.close()
  stores.reset() // Y compris session
  if (garderMode) session.setMode(mode)
  session.org = org
  syncQueue.reset()
  ui.setPage('login')
}

export async function reconnexion() {
  const session = stores.session
  const phrase = session.phrase
  deconnexion(true)
  await connexion(phrase)
}

/* Connexion depuis PageLogin ou reconnexion (ci-dessus) **********************/
export async function connexion(phrase, razdb) {
  if (!phrase) return
  const session = stores.session
  await session.initSession(phrase)

  if (session.org === 'admin') {
    session.setMode(2)
    try { await new ConnexionAdmin().run() } catch (e) { /* */ }
    return
  }

  if (session.avion) {
    if (!this.nombase) { // nom base pas trouvé en localStorage de clé lsk
      await afficherDiag($t('OPmsg1'))
      deconnexion(true)
      return
    }
    try {
      await idb.open()
    } catch (e) {
      await afficherDiag($t('OPmsg2', [e.message]))
      deconnexion()
      return
    }
    // initialisation de compteId et clek depuis boot de IDB
    if (!await idb.getBoot()) { // false si KO 
      await afficherDiag($t('OPmsg3'))
      deconnexion()
      return
    }
    try { await new ConnexionAvion().run() } catch (e) { /* */ }
    return
  }
  
  if (razdb && session.synchro && session.nombase)
    await idb.delete(session.nombase)
  try { 
    const op = await new ConnexionSynchroIncognito()
    op.run() 
  } catch (e) { 
    throw e
  }

}

/* Opération générique ******************************************/
export class Operation {
  constructor (nomop) { 
    this.nom = nomop 
    this.modeSync = this.nom.startsWith('Sync')
    if (!this.modeSync) {
      stores.session.startOp(this)
      this.cancelToken = null
      this.break = false
      // this.nbretry = 0
    }
  }

  get label () { 
    // console.log('label', 'OP_' + this.nom)
    return $t('OP_' + this.nom) 
  }

  /* A SUPPRIMER ??? */
  async retry () {
    if (this.modeSync) return
    if (this.nbretry++ > 5) 
      throw new AppExc(E_BRO, 21, [this.label])
    if (this.retry > 1) await sleep((this.retry * 300))
    return true
  }

  BRK () { 
    if (this.modeSync) return
    if (this.break) throw new AppExc(E_BRK, 0)
  }

  stop () {
    if (this.modeSync) return
    if (this.cancelToken) {
      this.cancelToken.cancel('break')
      this.cancelToken = null
    }
    this.break = true
  }

  finOK (res, silence) {
    if (!this.modeSync) {
      const session = stores.session
      session.finOp()
      if (!silence) stores.ui.afficherMessage($t('OPok', [this.label]), false)
    }
    return res
  }

  async finKO (e) {
    const session = stores.session
    const ui = stores.ui
    const exc = appexc(e)
    if (!this.modeSync) {
      session.finOp()
      if (exc.code === 9999) {
        session.setExcKO(exc)
        throw(exc)
      }
      ui.afficherMessage($t('OPko', [this.label]), true)
      await ui.afficherExc(exc)
      throw(exc)
    }
    // En synchro toutes les exceptions sont tueuses
    session.setExcKO(exc)
    throw(exc)
  }
}

/* classe OperationS *******************************************************/
export class OperationS extends Operation {
  constructor(nomop) { super(nomop) }

  /* Chargment en Store des avatars / groupes connus en IDB (avion et synchro).
  Remarque en mode synchro,
  - les avatars et groupes absents de ds ne sont pas chargés (ont été supprimés avant)
  - les membres ou notes absents de ds ne sont pas chargés (ont été supprimés avant)
  */
  async loadAvatarsGroupes (ds) {
    { // Phase itérative pour chaque avatar EXISTANT en ds
      for(const eds of ds.avatars) {
        const sb = new SB()
        const buf = new IDBbuffer()
        const m = await idb.getSA(eds.id)
        if (m.avatars) for(const row of m.avatars) { // En fait il n'y en a toujours qu'un
          sb.setA(await compile(row))
        }
        if (m.notes) for(const row of m.notes) {
          sb.setN(await compile(row))
        }
        if (m.chats) for(const row of m.chats) {
          sb.setC(await compile(row))
        }
        if (m.sponsorings) for(const row of m.sponsorings) {
          sb.setS(await compile(row))
        }
        if (m.tickets) for(const row of m.tickets) {
          sb.setT(await compile(row))
        }
        sb.store(buf)
        await buf.commit(ds)
      }
    }
    
    { // Phase itérative pour chaque groupe EXISTANT en ds
      for(const eds of ds.groupes) {
        const buf = new IDBbuffer()
        const sb = new SB()
        const m = await idb.getSA(eds.id)
        if (m.groupes) for(const row of m.groupes) { // En fait il n'y en a toujours qu'un
          sb.setG(await compile(row))
        }
        if (m.chatgrs) for(const row of m.chatgrs) { // En fait il n'y en a toujours qu'un
          sb.setC(await compile(row))
        }
        if (eds.n && m.notes) for(const row of m.notes) {
          sb.setN(await compile(row))
        }
        if (eds.m && m.membres) for(const row of m.membres) {
          sb.setM(await compile(row))
        }
        sb.store(buf)
        await buf.commit(ds)
      }
    }
  }

  /* Phase 1 : sync des rows CCEP */
  async phase1 (cnx, ds1, ida) {
    const session = stores.session
    const args =  { 
      token: session.authToken, 
      dataSync: ds1.serial, optionC: cnx, ida: ida || 0
    }
    const ret = await post(this, 'Sync', args)
    const ds = new DataSync(ret.dataSync) // Mis à jour par le serveur

    const sb = new SB()
    const buf = new IDBbuffer()

    if (ret.rowCompte) {
      sb.compte = await compile(ret.rowCompte)
      ds.compte.vs = ds.compte.vb
      buf.putIDB(ret.rowCompte)
    }
    if (ret.rowCompta) {
      sb.compta = await compile(ret.rowCompta)
      ds.compta.vs = ds.compta.vb
      buf.putIDB(ret.rowCompta)
    }
    if (ret.rowEspace) {
      sb.espace = await compile(ret.rowEspace)
      ds.espace.vs = ds.espace.vb
      buf.putIDB(ret.rowEspace)
    }
    if (ret.rowPartition) {
      sb.partition = await compile(ret.rowPartition)
      ds.partition.vs = ds.partition.vb
      buf.putIDB(ret.rowPartition)
    }

    if (cnx) {
      // Premier retour de Sync a rempli session. compteId, clek, nomBase
      let blOK = false // la base locale est vide, aucune données utilisables
      if (session.synchro) {
        await idb.open()
        blOK = idb.checkAge()
        await idb.storeBoot()
        if (!blOK)
          setTrigramme(session.nombase, await getTrigramme())
      }
      // la base locale est utilisable en mode synchro, mais peut être VIDE si !this.blOK

      if (session.synchro) {
        const dav = await idb.getDataSync()
        // partition / avatars / groupes c / m / n disparus
        this.supprdsdav(true, ds, dav, sb, buf)
        // Enrichit le ds courant par celui de IDB 
        this.fusionDS(ds)

        // Chargement des groupes et avatars depuis IDB
        await this.loadAvatarsGroupes (ds)
        /* Etat rétabli à celui de IDB, MAIS
        - CCEP sont rafraîchis par ceux du serveur
        - les avatars et groupes disparus (complètement ou partiellement) de compte ont été purgés
        */
      }
    }

    return [ds, sb, buf, ret]
  }

  /* Gestion des suppressions entre ds (actuel) et dav (avant):
  - en "connexion", la maj du store est inutile (il n'a pas été rempli)
  - partition disparue
  - sous-arbres avatars
  - sous-arbres groupes: complet / notes / membres
  */
  supprdsdav (cnx, ds, dav, sb, buf) {
    if (dav.partition && !ds.partition) {
      buf.putIDB({ _nom: 'partitions', id: dav.partition.id })
      if (!cnx) sb.delP()
    }
    dav.avatars.forEach((e, id) => { 
      if (!ds.avatars.has(id)) {
        buf.purgeAvatarIDB(id)
        if (!cnx) sb.delA(id)
      }
    })
    dav.groupes.forEach((eav, id) => {
      const e = ds.groupes.has(id)
      if (!e) {
        buf.purgeGroupeIDB(id)
        if (!cnx) sb.delG(id)
      } else {
        if (eav.m && !e.m) {
          buf.purgeGroupeMbIDB(id)
          if (!cnx) sb.delM(id)
        }
        if (eav.n && !e.n) {
          buf.purgeGroupeNoIDB(id)
          if (!cnx) sb.delN(id)
        }
      }
    })
  }

  /* Fusion initiale des dataSync: 
  - ds: rempli par le serveur depuis rien, 
  - dav: ds "avant", celui connu de IDB en mode synchro 
  ds est MIS A JOUR
  */
  fusionDS (ds, dav) {  
    if (ds.partition) {
      if (dav.partition && (dav.partition.id === ds.partition.id)) ds.partition.vs = dav.partition.vs
      else ds.partition.vs = 0
    }
    for(const e of ds.avatars) {
      const eav = dav.avatars(e.id)
      if (eav) e.vs = eav.vs
    }
    for(const e of ds.groupes) {
      const eav = dav.groupes(e.id)
      if (eav) e.vs = eav.vs
    }
  }

  /* Depuis un dataSync courant, charge du serveur toutes les mises à jour
  des avatars et des groupes.
  - Itère tant qu'il y a des avatars / groupes à mettre à jour
  - Toutefois chaque appel Sync PEUT ramener des CCEP
    - ils sont traités
    - ceci PEUT conduire à avoir des groupes / avatars en plus ou moins
    - ce qui peut provoquer une itération
  - le DataStync courant est retourné
  lida : liste des ida A PRIORI à rechercher: des notifications ayant été reçue
  */
  async majAvatarsGroupes (ds1, lida) {
    const fs = stores.session.fssync
    const setIda = new Set(lida || [])
    let ds = ds1
    /* Phase itérative pour chaque avatar / groupe
    A chaque itération il y a un commit IDB / store résultant 
    mais DataSync n'est retourné qu'à la fin
    */
    while (true) {
      for(const [,e] of ds.avatars) 
        if (e.vs !== e.vb) setIda.add(e.id)
      for(const [,e] of ds.groupes) {
        if ((e.vs[1] !== e.vb[1]) || (e.vs[2] !== e.vb[2]) || (e.vs[3] !== e.vb[3]))
          setIda.add(e.id)
      }

      /* LA SORTIE DE LA BOUCLE 'et de la fonction) EST ICI */
      if (!setIda.size) return ds // YES !!! tous traités

      // Traitement du PREMIER ida du set des ida à traiter
      let ida
      for(const x of setIda) { ida = x; break }
      setIda.delete(ida)
      const g = ID.estGroupe(ida)

      const [dsx, sb, buf, ret] = await this.phase1(false, ds, ida)
      // suppressions de IDB des disparus
      this.supprdsdav(false, dsx, ds, sb, buf)
      ds = dsx // ds mis à jour 

      const item = (g ? ds.groupes : ds.avatars).get(ida)
      
      /* MAIS ida lui-même PEUT ne plus être cité dans compte: 
      il est désormais absent de ds.avatars / groupes 
      La maj est terminée pour ce cycle */
      if (!item) { 
        sb.store(buf)
        buf.commit(ds)
        if (fs) fs.setDS(syncQueue.dataSync)
        continue 
      }

      // Cas "normal" : chargement incrémental du sous-arbre avatar / groupe
      if (ret.rowAvatar) {
        sb.setA(await compile(ret.rowAvatar))
        buf.putIDB(ret.rowAvatars)
        item.vs = item.vb
      }

      if (g) {
        if (ret.rowGroupe || ret.rowChatgr) item.vs[1] = item.vb[1]
        if (ret.rowMembres) item.vs[2] = item.vb[2]
        if (ret.rowNotes) item.vs[3] = item.vb[3]

        if (ret.rowGroupe) {
          sb.setG(await compile(ret.rowGroupe))
          buf.putIDB(ret.rowGroupe)
        }
        if (ret.rowChatgr) {
          sb.setH(await compile(rowChatgr))
          buf.putIDB(ret.rowGroupe)
        }
        if (ret.rowMembres) 
        for(const row of ret.rowMembres) {
          sb.setM(await compile(row))
          buf.putIDB(row)
        }
      } else {
        if (ret.rowChats) 
          for(const row of ret.rowChats) {
            sb.setC(await compile(row))
            buf.putIDB(row)
          }
        if (ret.rowSponsorings) 
          for(const row of ret.rowSponsorings) {
            sb.setS(await compile(row))
            buf.putIDB(row)
          }
        if (ret.rowTickets) 
          for(const row of ret.rowTickets) {
            sb.setT(await compile(row))
            buf.putIDB(row)
          }
      }

      if (ret.rowNotes) 
        for(const row of ret.rowNotes) {
          sb.setN(await compile(row))
          buf.putIDB(row)
        }

      sb.store(buf)
      buf.commit(ds)
      if (fs) fs.setDS(syncQueue.dataSync)
    }
  }
}

/* Synchronisation standard *********************************/
export class SyncStd extends OperationS {
  constructor() { super('SyncStd') }

  /* Chargement des sous-arbres groupes et avatars de la liste
  lida. Mais si compte évolue, il peut s'ajouter des sous-arbres (ou en enlever)
  */
  async run(ds1, lida) {
    try { 
      return await this.majAvatarsGroupes(ds1, lida)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Connexion à un compte en mode avion *********************************/
export class ConnexionAdmin extends Operation {
  constructor() { super('ConnexionAdmin') }

  async run() {
    try {
      const session = stores.session
      const args = { token: session.authToken }
      const ret = await post(this, 'GetEspaces', args)
      session.setCompte(null)
      session.setOrg('admin')
      // const cv = ne sert à rien, mais bug si on l'enlève !!!
      const cv = (await CV.set(null, 0)).store()
      if (ret.espaces) for (const e of ret.espaces)
        session.setEspace(await compile(e), true)
  
      console.log('Connexion admin')
      session.setStatus(2)
      stores.ui.setPage('admin')
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Connexion à un compte en mode avion *********************************/
export class ConnexionAvion extends Operation {
  constructor() { super('ConnexionCompte') }

  async run() {
    try {
      // idb: ouverte - session.clek compteId définis
      this.auj = AMJ.amjUtc()
      this.dh = 0

      const session = stores.session

      // Chargement des "avnotes" des notes ayant des fichiers locaux
      await idb.loadAvNotes()  
      await idb.loadFetats()  

      const ds = await idb.getDataSync()

      { // Phase 1 : chargement depuis IDB des CCEP
        const sb = new SB()
        const m = await idb.getCcep()
        sb.compte = await compile(m.comptes)
        sb.compta = await compile(m.comptas)
        sb.espace = await compile(m.espaces)
        if (m.partitions) sb.partition = await compile(m.partitions)
        sb.store()
      }
      
      // Chargement des groupes et avatars depuis IDB
      await this.loadAvatarsGroupes(ds)

      // Chargement des descriptifs des fichiers du presse-papier
      await idb.FLfromIDB()

      console.log('Connexion compte : ' + session.compteId)
      session.setStatus(2)
      stores.ui.setPage('accueil')
      this.finOK()
    } catch (e) {
      stores.ui.setPage('login')
      await this.finKO(e)
    }
  }
}

/* Connexion à un compte en mode synchro ou incognito *********************************/
export class ConnexionSynchroIncognito extends OperationS {
  constructor() { 
    super('ConnexionCompte') 
  }

  async run() {
    try {
      const session = stores.session

      if (session.synchro) {
        // Chargement des "avnotes" des notes ayant des fichiers locaux 
        await idb.loadAvNotes()
        await idb.loadFetats()
      } 

      const ds1 = DataSync.nouveau()
      const [ds, sb, buf] = await this.phase1(true, ds1)
      if (session.fssync) session.fssync.setDS(ds)
      sb.store(buf)
      buf.commit(ds)

      // Phase 2 : chargement des sous-arbres groupes et avatars
      syncQueue.dataSync = await this.majAvatarsGroupes(ds, [])
      if (session.fssync) session.fssync.setDS(syncQueue.dataSync)

      if (session.synchro) // Chargement des descriptifs des fichiers du presse-papier
        await idb.FLfromIDB()

      session.setStatus(2)
      syncQueue.reveil()

      console.log('Connexion compte : ' + session.compteId)
      stores.ui.setPage('accueil')
      this.finOK()
    } catch (e) {
      // stores.ui.setPage('login')
      await this.finKO(e)
    }
  }
}

/* OP_CreerEspace: 'Création d\'un nouvel espace et de son comptable'
- token : jeton d'authentification du compte de **l'administrateur**
- ns : numéro de l'espace
- org : code de l'organisation
- cleE : clé de l'espace
- clePK: clé P de la partition 1 cryptée par la clé K du Comptable
- cleAP: clé A du Comptable cryptée par la clé de la partition
- cleKXC: clé K du Comptable cryptée par XC du Comptable (PBKFD de la phrase secrète complète).
- clePA: cle P de la partition cryptée par la clé A du Comptable
- ck: `{ cleP, code }` crypté par la clé K du comptable

*/
export class CreerEspace extends Operation {
  constructor() { super('CreerEspace') }

  async run(org, phrase, ns) {
    try {
      const session = stores.session
      const config = stores.config

      const cleP = Cles.partition(1) // clé de la partition 1
      const cleK = random(32) // clé K du Comptable
      const cleE = Cles.espace() // clé de l'espace
      const cleA = Cles.comptable() // clé A de l'avatar Comptable

      const args = {
        token: session.authToken,
        ns: ns,
        org: org,
        hXR: phrase.hps1,
        hXC: phrase.hpsc,
        cleE: Cles.espace(), // clé de l'espace
        cleEK: await crypter(cleK, cleE),
        clePK: await crypter(cleK, cleP),
        cleAP: await crypter(cleP, cleA, 1),
        cleAK: await crypter(cleK, cleA),
        cleKXC: await crypter(phrase.pcb, cleK),
        clePA: await crypter(Cles.comptable(), cleP),
        // `{ cleP, code }` crypté par la clé K du comptable
        ck: await crypter(cleK, 
          new Uint8Array(encode({ cleP, code: config.nomPartitionPrimitive })))
      }
      await post(this, 'CreerEspace', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/** Ajout d\'un sponsoring ****************************************************
- `token` : éléments d'authentification du comptable / compte sponsor de sa tribu.
- id : id du sponsor
- hYR : hash du PNKFD de la phrase de sponsoring réduite
- `psK` : texte de la phrase de sponsoring cryptée par la clé K du sponsor.
- `YCK` : PBKFD de la phrase de sponsoring cryptée par la clé K du sponsor.
- `cleAYC` : clé A du sponsor crypté par le PBKFD de la phrase complète de sponsoring.
- `partitionId`: id de la partition si compte 0    
- `cleAP` : clé A du COMPTE sponsor crypté par la clé P de la partition.
  Permet au serveur de vérifier que le compte est vraiement de cette partition
  et est délégué.
- `clePYC` : clé P de sa partition (si c'est un compte "O") cryptée par le PBKFD 
  de la phrase complète de sponsoring (donne l'id de la partition).
- `nomYC` : nom du sponsorisé, crypté par le PBKFD de la phrase complète de sponsoring.
- `cvA` : `{ v, photo, info }` du sponsor, textes cryptés par sa cle A.
- `ardYC` : ardoise de bienvenue du sponsor / réponse du sponsorisé cryptée par le PBKFD de la phrase de sponsoring.

- `quotas` : `[qc, q1, q2]` pour un compte O, quotas attribués par le sponsor.
  - pour un compte "A" `[0, 1, 1]`. Un tel compte n'a pas de `qc` et peut changer à loisir
   `[qn, qv]` qui sont des protections pour lui-même (et fixe le coût de l'abonnement).
- don: montant du don pour un compte autonome sponsorisé par un compte autonome
- dconf: true, si le sponsor demande la confidentialité (pas de chat à l'avcceptation)
- del: true si le compte est délégué de la partition
Retour:
*/
export class AjoutSponsoring extends Operation {
  constructor () { super('AjoutSponsoring') }

  async run (arg) {
    /*
    - pc: phrase de contact,
    - nom: nom du compte,
    - `quotas` : `[qc, q1, q2]` quotas attribués par le sponsor.
      - pour un compte "A" `[0, 1, 1]`. Un tel compte n'a pas de `qc` et peut changer à loisir `[q1, q2]` qui sont des protections pour lui-même (et fixe le coût de l'abonnement).
    - mot: mot de bienvenue,
    - don: montant du don pour un compte autonome sponsorisé par un compte autonome
    - dconf: true, si le sponsor demande la confidentialité (pas de chat à l'avcceptation)
    - partitionId: id de la partition pour un compte O, sinon c'est un compte A
    - del: true si le compte est délégué de la partition
    */
    try {
      const session = stores.session
      const cleA = RegCles.get(session.avatarId)
      const cleAC = RegCles.get(session.compteId)
      const cv = stores.people.getCV(session.avatarId)
      const args = { 
        token: session.authToken, 
        id: session.avatarId,
        hYR: arg.pc.hps1,
        psK: await crypter(session.clek, arg.pc.phrase),
        YCK: await crypter(session.clek, arg.pc.pcb),
        cleAYC : await crypter(arg.pc.pcb, cleA),
        nomYC: await crypter(arg.pc.pcb, arg.nom),
        cvA: await cv.crypter(cleA),
        ardYC: await crypter(arg.pc.pcb, arg.mot),
        dconf: arg.dconf
      }
      if (arg.partitionId) { // compte O
        const cleP = RegCles.get(arg.partitionId)
        args.quotas = arg.quotas
        args.partitionId = arg.partitionId
        args.del = arg.del
        args.clePYC = await crypter(arg.pc.pcb, cleP)
        args.cleAP = await crypter(cleP, cleAC, 1)
      } else {
        args.don = arg.don
      }
      await post(this, 'AjoutSponsoring', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*   OP_AcceptationSponsoring: 'Acceptation d\'un sponsoring et création d\'un nouveau compte'
POST:
- `token` : éléments d'authentification du compte à créer
- `rowCompta` : row du compte à créer.
- `rowAvatar` : row de son avatar principal.
- `rowVersion` : row de avatar en création.
- `idt` : id de sa tribu. 0 SI compte A
- `ids` : ids du sponsoring, hash de sa phrase de reconnaissance qui permet de retrouver le sponsoring.
- `rowChatI` : row chat _interne_ pour le compte en création donnant le message de remerciement au sponsor.
- `rowChatE` : row chat _externe_ pour le sponsor avec le même message. La version est obtenue par le serveur.
- `ardx` : texte de l'ardoise du sponsoring à mettre à jour (avec statut 2 accepté), copie du texte du chat échangé.
- `act`: élément de la map act de sa tribu. null SI compte A

Retour: rows permettant d'initialiser la session avec le nouveau compte qui se trouvera ainsi connecté.
- `rowTribu`
- `rowChat` : le chat _interne_, celui concernant le compte.
- `credentials` : données d'authentification permettant à la session d'accéder au serveur de données Firestore.
- `rowEspace` : row de l'espace, informations générales / statistiques de l'espace et présence de la notification générale éventuelle.

Exceptions:
- `F_SRV, 8` : il n'y a pas de sponsoring ayant ids comme hash de phrase de connexion.
- `F_SRV, 9` : le sponsoring a déjà été accepté ou refusé ou est hors limite.

Assertions:
- existence du row `Tribus`,
- existence du row `Versions` du compte sponsor.
- existence du row `Avatars` du sponsorisé.
- existence du row `Espaces`.
*/
export class AcceptationSponsoring extends Operation {
  constructor() { super('AcceptationSponsoring') }

  async run(org, sp, texte, ps, dconf) {
    /* 
    texte: réponse du sponsorisé
    ps: sa phrase secrète
    dconf: refuse le chat
    sp: sponsoring
      pc : objet Phrase
      sp : objet Sponsoring décodé
      this.vsh = row.vsh || 0
      this.st = row.st
      this.dh = row.dh
      this.partitionId = row.partitionId || 0
      this.estA = !this.partitionId
      this.nom = await decrypterStr(this.YC, row.nomYC)
      this.del = row.del || false
      this.quotas = row.quotas
      this.don = row.don || 0
      this.dconf = row.dconf || false
      this.ard = await decrypterStr(this.YC, row.ardYC)
      if (this.estA) this.cleP = await decrypter(this.YP, row.clePYC)
      this.id = row.id
      this.ids = row.ids
      this.v = row.v
      this.dlv = row.dlv
      this.YC = psp.pcb
      await this.comp(row)
      this.cleA = await decrypter(this.YC, row.cleAYC)
      this.cv = await CV.set(row.cvA, 0, cleA)
    */
    try {
      /* LE COMPTE EST CELUI DU FILLEUL
      Info pour création:
      - calculé sur serveur: it rdsav
      - depuis sp sur serveur: 
        - idp del quotas don csp (id compte sponsor)
      - d'un compte (et son versions) avec ou sans don
        - id, hXR, hXC, cleKXC, rdsav, cleAK, o, quotas
        - o : clePA rdsp idp del it
      - de son compta (quotas)
      - son inscription éventuelle dans sa partition
        - cleAP del q (`qc qn qv c n v`)
      - son avatar (et son versions)
      - un double chat
      - la mise à jour du sponsoring
        - st ard
      */
      const ns = ID.ns(sp.id)
      const clek = random(32) // du compte
      const cleA = Cles.avatar()
      const id = Cles.id(cleA, ns)
  
      const session = stores.session
      session.setOrg(org)
      await session.initSession(ps)
      // Reset après ça, dont RegCles (mais pas session)
      await session.setIdCleK(id, clek)
      RegCles.set(cleA)
      
      const args = {
        // token: session.authToken,
        id,
        hXR: ps.hps1,
        hXC: ps.hpsc,
        cleKXC: await crypter(ps.pcb, clek),
        cleAK: await crypter(clek, cleA)
      }
      if (!sp.estA) {
        RegCles.set(sp.cleP)
        args.clePA = await crypter(cleA, sp.cleP)
        args.cleAP = await crypter(sp.cleP, cleA)
      }

      // double chat 
      // await crypter(ps.pcb, session.clek)
      /*
      const aSt = stores.avatar

      const rowEspace = await new GetEspace().run()
      let espace = await compile(rowEspace)
      session.setEspace(espace)

      // Réenregistrement dans repertoire des na créé en PageLogin 
      NomGenerique.from(sp.na.anr)
      NomGenerique.from(sp.naf.anr)
      const idt = sp.clet ? setClet(sp.clet) : 0

      session.setCompteId(sp.naf.id)
      session.setTribuId(idt)
      session.setAvatarId(session.compteId)

      const aChat = sp.clet || (!sp.clet && !sp.dconf && !dconf)

      const { publicKey, privateKey } = await genKeyPair()

      // !!! dans rowCompta: it (indice du compte dans sa tribu) N'EST PAS inscrit
      // (na, clet, cletX, q1, q2, estDelegue, phrase, nc) - le filleul a 1 chat en ligne
      let { dlv, rowCompta } = await Compta.row(sp.naf, sp.clet, sp.cletX, sp.quotas, sp.sp, session.ns, ps, 1, don)
      // session.clek est fixée

      if (dlv < session.auj) throw new AppException(F_BRO, 13)

      const rowAvatar = await Avatar.primaireRow(sp.naf, publicKey, privateKey)
      const rowVersion = { id: sp.naf.id, v: 1, dlv: dlv }
      const _data_ = new Uint8Array(encode(rowVersion))
      rowVersion._data_ = _data_
      rowVersion._nom = 'versions'
      */

      /* Element de act de tribu du nouveau compte
      - `idT` : id court du compte crypté par la clé de la tribu.
      - `sp` : est sponsor ou non.
      - `stn` : statut de la notification _du compte_: _aucune simple bloquante_
      - `qc q1 q2` : quotas attribués.
      - `ca v1 v2` : volumes **approximatifs** effectivement utilisés
      */

      /*
      let act = null
      if (sp.clet) act = {
        idT: await crypter(sp.clet, '' + ID.court(sp.naf.id)),
        nasp: sp.sp ? await crypter(sp.clet, new Uint8Array(encode(sp.naf.anr))) : null,
        notif: null,
        stn: 0,
        qc: sp.quotas[0],
        q1: sp.quotas[1],
        q2: sp.quotas[2],
        ca: 0,
        v1: 0,
        v2: 0
      }

      // chatI : chat pour le compte, chatE : chat pour son sponsor
      const naI = sp.naf
      const naE = sp.na
      const cc = random(32)
      const pubE = await aSt.getPub(sp.na.id)
      if (!pubE) throw new AppExc(F_BRO, 7)

      const args = !aChat ? {
        token: session.authToken, 
        rowCompta, rowAvatar, rowVersion,
        ids: sp.ids,
        ardx, idt, act,
        abPlus: [idt, sp.naf.id],
        idI: 0
      } : { 
        token: session.authToken, 
        rowCompta, rowAvatar, rowVersion,
        ids: sp.ids,
        ardx, idt, act,
        abPlus: [idt, sp.naf.id],

        idI : naI.id,
        idsI : await Chat.getIds(naI, naE),
        idE : naE.id, 
        idsE : await Chat.getIds(naE, naI), 
        ccKI : await crypter(session.clek, cc), 
        ccPE : await crypterRSA(pubE, cc),
        naccI : await crypter(cc, encode([naI.nom, naI.rnd])),
        naccE : await crypter(cc, encode([naE.nom, naE.rnd])),
        txt1 : await Chat.getTxtCC(cc, txt1),
        lgtxt1 : txt1.length,
        txt2 : await Chat.getTxtCC(cc, txt2),
        lgtxt2 : txt2.length
      }

      const ret = this.tr(await post(this, 'AcceptationSponsoring', args))
      // Retourne: credentials, rowTribu

      espace = await compile(ret.rowEspace)
      session.setEspace(espace)
      session.setOrg(espace.org)
      if (session.estClos) {
        this.ui.setPage('clos')
        this.finOK()
      }

      if (session.fsSync && ret.credentials) {
        await session.fsSync.open(ret.credentials, ret.fsEmulator || 0)
      }

      const rowTribu = ret.rowTribu
      const rowChat = ret.rowChat
      rowCompta = ret.rowCompta
      
      // Le compte vient d'être créé, clek est enregistrée par la création de rowCompta
      const compta = await compile(rowCompta)
      const avatar = await compile(rowAvatar)
      const tribu = rowTribu ? await compile(rowTribu) : null

      aSt.setCompte(avatar, compta, tribu)

      if (rowChat) {
        const chat = await compile(rowChat)
        aSt.setChat(chat)
      }

      Versions.reset()
      Versions.set(session.compteId, { v: 1 })

      if (session.synchro) {
        try {
          await session.setNombase()
          await openIDB()
          // setTrigramme(session.nombase, avatar.na.nomc)
          setTrigramme(session.nombase, await getTrigramme())
          lectureSessionSyncIdb()
          // Finalisation en une seule fois de l'écriture du nouvel état en IDB
          this.buf.putIDB(rowCompta)
          this.buf.putIDB(rowAvatar)
          this.buf.putIDB(rowChatI)
          if (rowTribu) this.buf.putIDB(rowTribu)
          await this.buf.commitIDB(true, true) // MAJ compte.id / cle K et versions
          await session.sessionSync.setConnexion(this.dh)
        } catch (e) {
          session.mode = 2
          await afficherDiag(this.$t('LOGnoidb'))
        }
      }

      if (session.fsSync) {
        await session.fsSync.setCompte(session.compteId)
        if (rowTribu) await session.fsSync.setTribu(session.tribuId)
      }

      console.log('Connexion compte : ' + session.compteId)
      session.setStatus(2)
      stores.ui.setPage('accueil')
      idb.reveil()
      */
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetSynthese: 'Obtention de la synthèse de l\'espace' *********
args.token donne les éléments d'authentification du compte.
args.ns
Retour:
- rowSynthse
*/
export class GetSynthese extends Operation {
  constructor () { super('GetSynthese') }

  async run (ns) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ns }
      const ret = await post(this, 'GetSynthese', args)
      const s = await compile(ret.rowSynthese)
      session.setSynthese(s)
      return this.finOK(s)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/** Opérations de type "ping" non authentifiées du tout */

/** OP_EchoTexte: 'Lancement d\'un test d\'écho' ***********
args.token donne les éléments d'authentification du compte.
args.to : délai en secondes avant retour de la réponse
args.texte : texte à renvoyer en écho
Retour:
- echo : texte d'entrée retourné
*/
export class EchoTexte extends Operation {
  constructor() { super('EchoTexte') }

  async run(texte, to) {
    try {
      // while (await this.retry()) {
        const ret = this.tr(await post(this, 'EchoTexte', { to: to, texte }))
        console.log('Echo : ' + ret.echo)
      // }
      return this.finOK(ret.echo)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* ErreurFonc *******************************************/
export class ErreurFonc extends Operation {
  constructor() { super('ErreurFonc') }

  async run(texte, to) {
    try {
      this.tr(await post(this, 'ErreurFonc', { to, texte }))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_PingDB: '"Ping" de la base distante' *********
*/
export class PingDB extends Operation {
  constructor() { super('PingDB') }

  async run() {
    try {
      const ret = this.tr(await post(this, 'PingDB', {}))
      this.finOK()
      return ret
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_RefusSponsoring: 'Rejet d\'une proposition de sponsoring'**
args.id ids : identifiant du sponsoring
args.arx : réponse du filleul
*/
export class RefusSponsoring extends Operation {
  constructor() { super('RefusSponsoring') }

  async run(sp, ardx) { // ids du sponsoring
    try {
      const session = stores.session
      await initSession()
      const args = { token: session.authToken, ids: sp.ids, ardx }
      await post(this, 'RefusSponsoring', args)
      deconnexion(true)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_ProlongerSponsoring: 'Prolongation / annulation d\'un sponsoring'
args.id ids : identifiant du sponsoring
args.dlv : nouvelle dlv (0 == annulation)
*/
export class ProlongerSponsoring extends Operation {
  constructor() { super('ProlongerSponsoring') }

  async run(sp, dlv) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id: sp.id, ids: sp.ids, dlv }
      await post(this, 'ProlongerSponsoring', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Test d\'existence d\'une phrase de connexion / contact / sponsoring ******
args.ids : hash de la phrase de contact / de connexion
args.t :
  - 1 : phrase de connexion(hps1 de compta)
  - 2 : phrase de sponsoring (ids)
  - 3 : phrase de contact (hpc d'avatar)
Retour:
- existe : true si le hash de la phrase existe
*/
export class ExistePhrase extends Operation {
  constructor () { super('ExistePhrase') }

  async run (hps1, t) {
    try {
      const session = stores.session
      const args = { token: session.authToken, hps1: hps1, t }
      const ret = await post(this, 'ExistePhrase' + (t === 1 ? '1' : ''), args)
      const ex = ret.existe || false
      return this.finOK(ex)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/** Chercher Sponsoring ****************************************************
args.token: éléments d'authentification du compte.
args.org : organisation
args.hps1 : hash du PBKFD de la phrase de contact réduite
Retour:
- rowSponsoring s'il existe
*/
export class ChercherSponsoring extends Operation {
  constructor () { super('ChercherSponsoring') }

  async run (org, hps1) {
    try {
      const ret = await post(this, 'ChercherSponsoring', { org, hps1 })
      return this.finOK(ret)
    } catch (e) {
      await this.finKO(e)
    }
  }
}
