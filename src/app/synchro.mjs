import { decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { afficherDiag, $t, random, gzipB, setTrigramme, getTrigramme } from './util.mjs'
import { idb, IDBbuffer } from './db.mjs'
import { DataSync, appexc, ID, Rds, Cles, AMJ } from './api.mjs'
import { post } from './net.mjs'
import { CV, compile, RegCles, RegRds } from './modele.mjs'
import { crypter, genKeyPair, crypterRSA } from './webcrypto.mjs'

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
    const session =  stores.session
    const ns = session.ns
    const rdsp = session.compte ? session.compte.rdsp : 0
    if (rows) rows.forEach(row => {
      const rds = Rds.deId(row.id)
      const v = row.v

      switch (Rds.type(row.id)) {
      case Rds.COMPTE : {
        if (this.compte.mv < v) { this.compte.mv = v; this.compte.rowv = row; this.compte.row = null }
        break
      }
      case Rds.COMPTA : {
        if (this.compta.mv < v) { this.compta.mv = v; this.compta.rowv = row; this.compta.row = null }
        break
      }
      case Rds.ESPACE : {
        if (this.espace.mv < v) { this.espace.mv = v; this.espace.rowv = row; this.espace.row = null }
        break
      }
      case Rds.PARTITION : {
        /* le "rds" de SA partition a été fixé avant par le compte 
        On ignore les notifications de changements des autres (antérieurs) */
        if (this.partition.mv < v && (!rdsp || rdsp === rds)) 
          { this.partition.mv = v; this.partition.rowv = row; this.partition.row = null }
        break
      }
      case Rds.GROUPE : {
        const vx = decode(r._data) // vx: { v, vg, vm, vn  }
        const x = this.avgrs.get(rds)
        if (!x || x.v < vx.v) this.avgrs.set(rds, vx)
        break
      }
      case Rds.AVATAR : {
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
    const ok = stores.session.ok
    if (this.job || !ok) return
    console.log('réveil')

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
      for (const [rds, v] of this.avgrs) {
        this.avgrs.delete(rds)
        const ida = RegRds.id(rds)
        lida.push(ida)
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
    console.log('doRowCcep')
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
    await buf.commit(ds)
    syncQueue.finJob(ds)
  }

  /* Traitement de notifications de changement de versions par OnSnapShot ou WS 
  relatif à un compte, compta ...*/
  async doVersionCcep(ds1) {
    console.log('doVersionCcep')
    const [ds, ret] = await new Sync2().run(ds1)
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
    console.log('doAvGr', lida)
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
    if (!session.nombase) { // nom base pas trouvé en localStorage de clé lsk
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
    const op = new ConnexionSynchroIncognito()
    await op.run() 
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
    const exc = appexc(e)

    if (this.modeSync || exc.code === 9999) {
      // en mode Sync toutes les exceptions sont "tueuses"
      session.setExcKO(exc)
      throw exc
    }

    session.finOp()
    const ui = stores.ui
    ui.afficherMessage($t('OPko', [this.label]), true)
    await ui.afficherExc(exc)
    throw exc
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
  async loadAvatarsGroupes (sb, ds) {
    { // Phase itérative pour chaque avatar EXISTANT en ds
      for(const [,eds] of ds.avatars) {
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

  async doCCEP (ret) {
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
    return [ds, sb, buf, ret]
  }
 
  /* Phase 1 : sync des rows CCEP */
  async phase1 (cnx, ds1, ida) {
    const session = stores.session
    const args =  { 
      token: session.authToken, 
      dataSync: ds1.serial, optionC: cnx, ida: ida || 0
    }
    const ret1 = await post(this, 'Sync', args)
    const [ds, sb, buf, ret] = await this.doCCEP(ret1)

    if (cnx) {
      if (session.fssync) session.fssync.open(ret.credentials, ret.emulator)

      // Premier retour de Sync a rempli session. compteId, clek, nomBase
      let blOK = false // la base locale est vide, aucune données utilisables
      if (session.synchro) {
        await idb.open()
        blOK = await idb.checkAge()
        await idb.storeBoot()
        if (!blOK)
          setTrigramme(session.nombase, await getTrigramme())
        // la base locale est utilisable en mode synchro, mais peut être VIDE si !this.blOK 

        await idb.loadAvNotes()
        await idb.loadFetats()

        const dav = await idb.getDataSync()
        // partition / avatars / groupes c / m / n disparus
        this.supprdsdav(true, ds, dav, sb, buf)
        // Enrichit le ds courant par celui de IDB 
        this.fusionDS(ds, dav)

        // Chargement dans sb des groupes et avatars depuis IDB
        await this.loadAvatarsGroupes (sb, ds)
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
    if (!dav) return
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
    if (!dav) return 
    if (ds.partition) {
      if (dav.partition && (dav.partition.id === ds.partition.id)) ds.partition.vs = dav.partition.vs
      else ds.partition.vs = 0
    }
    for(const [,e] of ds.avatars) {
      const eav = dav.avatars.get(e.id)
      if (eav) e.vs = eav.vs
    }
    for(const [,e] of ds.groupes) {
      const eav = dav.groupes.get(e.id)
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
        await buf.commit(ds)
        if (fs) fs.setDS(syncQueue.dataSync)
        continue 
      }

      // Cas "normal" : chargement incrémental du sous-arbre avatar / groupe
      if (ret.rowAvatar) {
        sb.setA(await compile(ret.rowAvatar))
        buf.putIDB(ret.rowAvatar)
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
      await buf.commit(ds)
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

/* Synchronisation standard *********************************/
export class Sync2 extends OperationS {
  constructor() { super('Sync2') }

  /* Chargement des sous-arbres groupes et avatars de la liste
  lida. Mais si compte évolue, il peut s'ajouter des sous-arbres (ou en enlever)
  */
  async run(ds1) {
    try { 
      const session = stores.session
      const args = { token: session.authToken, dataSync: ds1.serial }
      const ret = await post(this, 'Sync2', args)
      const ds = new DataSync(ret.dataSync) // Mis à jour par le serveur
      return this.finOK([ds, ret])
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
export class ConnexionAvion extends OperationS {
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
      
      { // Chargement des groupes et avatars depuis IDB
        const sb = new SB()
        await this.loadAvatarsGroupes(sb, ds)
        sb.store()
      }

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

      const ds1 = DataSync.nouveau()
      const [ds, sb, buf] = await this.phase1(true, ds1)
      if (session.fssync) session.fssync.setDS(ds)
      sb.store(buf)
      await buf.commit(ds)

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

/*   OP_SyncSp: 'Acceptation d\'un sponsoring et création d\'un nouveau compte'
- `token` : éléments d'authentification du compte à créer
- idsp idssp : identifinat du sponosing
- id : id du compte sponsorisé à créer
- hXR: hash du PBKD de sa phrase secrète réduite
- hXC: hash du PBKD de sa phrase secrète complète
- cleKXC: clé K du nouveau compte cryptée par le PBKFD de sa phrase secrète complète
- cleAK: clé A de son avatar principal cryptée par la clé K du compte
- ardYC: ardoise du sponsoring
- dconf: du sponsorisé
- pub: clé RSA publique de l'avatar
- privK: clé privée RSA de l(avatar cryptée par la clé K du compte
- cvA: CV de l'avatar cryptée par sa clé A

- clePA: clé P de sa partition cryptée par la clé A de son avatar principal
- cleAP: clé A de son avatar principâl cryptée par la clé P de sa partition

- ch: { cck, ccP, t1c, t2c }
  - ccK: clé C du chat cryptée par la clé K du compte
  - ccP: clé C du chat cryptée par la clé publique de l'avatar sponsor
  - cleE1C: clé A de l'avatar E (sponsor) cryptée par la clé du chat.
  - cleE2C: clé A de l'avatar E (sponsorisé) cryptée par la clé du chat.
  - t1c: mot du sponsor crypté par la clé C
  - t2c: mot du sponsorisé crypté par la clé C

Retour: 
- rowEspace
- rowPartition si compte O
- rowCompte 
- rowAvater 
- rowChat si la confidentialité n'a pas été requise
- notifs
- conso

Exceptions:
- `A_SRV, 13` : sponsorings non trouvé
- `F_SRV, 9` : le sponsoring a déjà été accepté ou refusé ou est hors limite.
- F_SRV, 212: solde du sonsor ne couvre pas son don
- A_SRV, 999: application close
- F_SRV, 101: application figée
- F_SRV, 211: quotas restants de la partition insuffisants pour couvrir les quotas proposés au compte
- A_SRV, 16: syntheses non trouvée
- A_SRV, 1: espace non trouvé
- A_SRV, 8: partition non trouvée
*/
export class SyncSp extends OperationS {
  constructor() { super('SyncSp') }

  async run(org, sp, texte, ps, dconf) {
    try {
      const ns = ID.ns(sp.id)
      const clek = random(32) // du compte
      const cleKXC = await crypter(ps.pcb, clek) // clé K du nouveau compte cryptée par le PBKFD de sa phrase secrète complète
      const cleA = Cles.avatar()
      const id = Cles.id(cleA, ns)
      const kp = await genKeyPair()
      const cv = new CV(id, 0, null, sp.nom)
      
      const args = {
        idsp: sp.id,
        idssp: sp.ids,
        id, // id du compte sponsorisé à créer
        hXR: ps.hps1, // hash du PBKD de sa phrase secrète réduite
        hXC: ps.hpsc, // hash du PBKD de sa phrase secrète complète
        cleKXC: cleKXC, // clé K du nouveau compte cryptée par le PBKFD de sa phrase secrète complète
        cleAK: await crypter(clek, cleA), // clé A de son avatar principal cryptée par la clé K du compte
        ardYC: await crypter(sp.YC, texte + '\n' + sp.ard), // ardoise du sponsoring
        dconf: dconf,
        pub: kp.publicKey,
        privK: await crypter(clek, kp.privateKey),
        cvA: await cv.crypter(cleA)
      }
      if (!sp.estA) {
        RegCles.set(sp.cleP)
        args.clePA = await crypter(cleA, sp.cleP) // clé P de sa partition cryptée par la clé A de son avatar principal
        args.cleAP = await crypter(sp.cleP, cleA) // clé A de son avatar principâl cryptée par la clé P de sa partition
      }
      if (!sp.dconf && !dconf) {
        const cc = random(32)
        const pub = await getPub(sp.id)
        args.ch = {
          ccK: await crypter(clek, cc), // clé C du chat cryptée par la clé K du compte
          ccP: await crypterRSA(pub, cc), // clé C du chat cryptée par la clé publique de l'avatar sponsor
          cleE1C:  await crypter(cc, sp.cleA), // clé A de l'avatar E (sponsor) cryptée par la clé du chat.
          cleE2C:  await crypter(cc, cleA), // clé A de l'avatar E (sponsorisé) cryptée par la clé du chat.
          t1c: await crypter(cc, gzipB(sp.ard)), // mot du sponsor crypté par la clé C
          t2c: await crypter(cc, gzipB(texte)) // mot du sponsorisé crypté par la clé C
        }
      }

      const session = stores.session
      session.setOrg(org)
      await session.initSession(ps)
      // Reset après ça, dont RegCles (mais pas session)
      // set compteId, avatarId, ns, clek, nomBase
      await session.setIdClek(id, null, clek) 
      RegCles.set(cleA)

      const ret1 = await post(this, 'SyncSp', args)
      const [ds, sb, buf, ret] = await this.doCCEP(ret1)
  
      const item = ds.avatars.get(id)
      sb.setA(await compile(ret.rowAvatar))
      buf.putIDB(ret.rowAvatar)
      item.vs = item.vb

      if (ret.rowChat) {
        sb.setC(await compile(ret.rowChat))
        buf.putIDB(ret.rowChat)
      }

      if (session.synchro) {
        await idb.delete(session.nombase)
        await idb.open()
        await idb.storeBoot()
        setTrigramme(session.nombase, await getTrigramme())
      }

      sb.store(buf)
      await buf.commit(ds)

      syncQueue.dataSync = ds

      if (session.fssync) {
        session.fssync.open(ret.credentials, ret.emulator)
        session.fssync.setDS(ds)
      }

      session.setStatus(2)
      syncQueue.reveil()

      console.log('Connexion compte : ' + session.compteId)
      stores.ui.setPage('accueil')
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

/* OP_GetPartitionC: 'Obtention d\'une partition' *********
args.token donne les éléments d'authentification du compte Comptable.
args.id
Retour:
- rowPartition
*/
export class GetPartitionC extends Operation {
  constructor () { super('GetPartitionC') }

  async run (id) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, id }
      const ret = await post(this, 'GetPartitionC', args)
      const p = await compile(ret.rowPartition)
      if (p) session.setPartitionC(p)
      return this.finOK(p)
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
        const ret = await post(this, 'EchoTexte', { to: to, texte })
        console.log('Echo : ' + ret.echo)
      // }
      return this.finOK(ret.echo)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Pseudo opération : cyncPub **************************************/
export async function getPub (id) {
  try {
    const ret = await post(null, 'GetPub', { id })
    return ret.pub
  } catch (e) {
    throw new AppExc(E_WS, 3)
  }
}

/* ErreurFonc *******************************************/
export class ErreurFonc extends Operation {
  constructor() { super('ErreurFonc') }

  async run(texte, to) {
    try {
      await post(this, 'ErreurFonc', { to, texte })
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
      const ret = await post(this, 'PingDB', {})
      return this.finOK(ret)
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

/** Get Sponsoring ****************************************************
args.token: éléments d'authentification du compte.
args.org : organisation
args.hps1 : hash du PBKFD de la phrase de contact réduite
Retour:
- rowSponsoring s'il existe
*/
export class GetSponsoring extends Operation {
  constructor () { super('GetSponsoring') }

  async run (org, hps1) {
    try {
      const ret = await post(this, 'GetSponsoring', { org, hps1 })
      return this.finOK(ret)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

