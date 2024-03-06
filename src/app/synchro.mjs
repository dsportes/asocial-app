import { afficherDiag } from './util.mjs'
import { idb, openIDB, IDBbuffer } from './db.mjs'
import { OperationUI } from './operations.mjs'
import { DataSync, ID, Rds } from './api.mjs'
import { post } from './net.mjs'

class Queue {
  constructor () {
    this.dataSync = null // dataSync courant de la session. Maj au retour de Sync

    this.job = null // traitement en cours

    /* Evénnements à traiter
      v : si true version des événnement arrivés et pas encore traités
      mv : plus haute version traitée
      rowv : tiré d'un row version { rds, v, (suppr) }
    */
    this.compte = { rowv: null, mv: 0, row: null }
    this.compta = { rowv: null, mv: 0, row: null }
    this.espace = { rowv: null, mv: 0, row: null }
    this.partition = { rowv: null, mv: 0, row: null }
    this.avgrs = new Map() // cle: rds, valeur: {v
  }

  /* Au retour de n'importe quelle opération un ou plusieurs rows CCEP
  peuvent être retournés. Ils vont être enregistrés dans le flow normal de synchro
  resp.compte || resp.compta || resp.espace || resp.partition
  */
  async postResp (resp) { // Au retour d'un POST PAS Sync
    if (resp.rowCompte) {
      if (resp.rowCompte.v > this.compte.mv) {
        this.compte.mv = resp.rowCompte.v
        const c = await compile(resp.rowCompte)
        if (c.okDataSync(this.dataSync)) {
          /* Le nouveau compte n'a pas d'avatar / groupe / partition inconnus du DataSync
          Il peut être traité en mode "simple", sinon il doit l'être en mode "Sync"
          comme si un 'versions' avait été reçu */
          this.compte.row = resp.rowCompte
          this.compte.rowv = null   
        } else {
          this.compte.rowv = { rds: c.rds, v: c.v }
          this.compte.row = null
        }
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

  /* A l'arrivée d'un ou plusuieurs row versions sur écoute / WS */
  setRows (rows) { 
    if (rows) rows.forEach(r => {
      const nom = Rds.typeS(r.rds)
      const row = { v: r.v, rds: r.rds }
      if (r.suppr) row.suppr = true
      switch (nom) {
      case 'comptes' : {
        if (this.compte.mv < row.v) { this.compte.mv = row.v; this.compte.rowv = row; this.compte.row = null }
        break
      }
      case 'comptas' : {
        if (this.compta.v < row.v) { this.compta.mv = row.v; this.compta.rowv = row; this.compta.row = null }
        break
      }
      case 'espaces' : {
        if (this.espace.v < row.v) { this.espace.mv = row.v; this.espace.rowv = row; this.espace.row = null }
        break
      }
      case 'partitions' : {
        if (this.partition.v < row.v) { this.partition.mv = row.v; this.partition.rowv = row; this.partition.row = null }
        break
      }
      case 'groupes' :
      case 'avatars' : {
        const x = this.avgrs.get(row.rds)
        if (!x || x.v < row.v) this.avgrs.set(rds, row.v, row.suppr)
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
    /* PRIORITE 1 : Traitement SIMPLE des rows directement reçus en retour d'un POST
    Aucun impact sur la synchro, seulement stockage en Store et IDB */
    if (this.RowCCEPtodo) {
      this.job = new Job()
      const arg = { }
      if (this.compte.row) { arg.rowCompte = this.compte.row; this.compte.row = null }
      if (this.compta.row) { arg.rowCompta = this.compta.row; this.compta.row = null }
      if (this.espace.row) { arg.rowEspace = this.espace.row; this.espace.row = null }
      if (this.partition.row) { arg.rowPartition = this.partition.row; this.partition.row = null }
      setTimeout(() => this.job.doRowCcep(arg), 5)
      return
    }
    /* PRIORITE 2 : Traitement des versions des CCEP reçus sur écoute / WS
    Possible impact de synchro (avatars / groupes nouveaux ou disparus) */
    if (this.VersionCCEPtodo) {
      this.job = new Job()
      const arg = { }
      if (this.compte.rowv) { arg.compte = this.compte.rowv; this.compte.rowv = null }
      if (this.compta.rowv) { arg.compta = this.compta.rowv; this.compta.rowv = null }
      if (this.espace.rowv) { arg.espace = this.espace.rowv; this.espace.rowv = null }
      if (this.partition.rowv) { arg.partition = this.partition.rowv; this.partition.rowv = null }
      setTimeout(() => this.job.doVersionCcep(arg), 5)
      return
    }
    if (this.avgrs.size) { // Traitement d'UN versions d'un sous-arbre reçu sur écoute / WS
      this.job = new Job()
      for (const [, row] of this.avgrs) {
        setTimeout(() => this.job.doAvGr(row), 5)
        return
      }
    }
  }

  finJob (ds) {
    /* Le ds contient les dernières versions pour les CCEP, avatars et groupes
    Maj de queue
    */
    // TODO
    this.dataSync = ds
    this.job = null
    this.reveil()
  }
}
export const syncQueue = new Queue()

class Job {
  /* Traitement "SIMPLE" SANS IMPACT SYNC de chagement des row compte ... 
  obtenus en retour de POST */
  async doRowCcep ({ rowCompte, rowCompta, rowEspace, rowPartition }) {
    // TODO
    syncQueue.finJob(ds)
  }

  /* Traitement "SYNC" d'une arrivée de versions par OnSnapShot ou WS 
  relatif à un compte, compta ...*/
  async doVersionCcep({ compte, compta, espace, partition }) {
    // compte ... : { rds, v, suppr }
    // TODO - tient compte qu'il peut y avoir déjà des "rows" à ne pas aller chercher au serveur
    let ds = syncQueue.dataSync
    const sb = new SBccep()
    const buf = new IDBbuffer()
    const args =  { authData: session.authToken, dataSync: ds }
    const ret = await post(this, 'Sync', args)
    ds = new DataSync(ret.dataSync) // Remplacé au retour par celui calculé par le serveur
    await this.retCcep(ret, ds, sb)
    buf.commit

    syncQueue.finJob(ds)
  }

  /* Traitement "SYNC" d'une arrivée de versions par OnSnapShot ou WS 
  relatif à un sous-arbre avatar / groupe */
  async doAvGr({rds, v, suppr}) {
    const ida = RegRds.id(rds)
    let ds = syncQueue.dataSync
    // TODO
    syncQueue.finJob(ds)
  }
}

/* Déconnexion, reconexion, commexion *************************************************/
/* garderMode : si true, garder le mode */
export function deconnexion(garderMode) {
  const ui = stores.ui
  // ui.setPage('null')
  const session = stores.session
  const mode = session.mode
  const org = session.org

  if (session.accesIdb) idb.close()
  if (session.accesNet) {
    if (session.fsSync) session.fsSync.close(); else closeWS()
  }
  stores.reset() // Y compris session
  if (garderMode) session.setMode(mode)
  session.org = org
  SyncQueue.reset()
  ui.setPage('login')
}

export async function reconnexion() {
  const session = stores.session
  const phrase = session.phrase
  deconnexion(true)
  await connexion(phrase)
}

/* Connexion depuis PageLogin ou reconnexion *****************************/
export async function connexion(phrase, razdb) {
  if (!phrase) return
  const session = stores.session
  await session.initSession(phrase)

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
  }
  else {
    if (razdb && session.synchro && session.nombase)
      await idb.delete(session.nombase)
    try { await new ConnexionSynchroIncognito().run() } catch (e) { /* */ }
  }
}

/* Store Buffers *******************************************************/
class SBccep {
  constructor () {
    this.s = stores.session
    this.compte = null
    this.compta = null
    this.espace = null
    this.partition = null
  }

  store (ds) {
    this.s.setDataSync(ds)
    if (this.compte) this.s.setCompte(this.compte)
    if (this.compta) this.s.setCompta(this.compta)
    if (this.espace) this.s.setEspace(this.espace)
    if (this.partition) this.s.setPartition(this.partition)
  }
}

class SBav {
  constructor () {
    this.s = stores.session
    this.a = stores.avatar
    this.n = stores.notes
    this.p = stores.people
    this.avatar = null
    this.notes = new Map()
    this.chats = new Map()
    this.sponsorings = new Map()
    this.tickets = new Map()
  }

  setA (d) { this.avatar = d }

  setN (d) { this.notes.set(d.ids, d) }

  setC (d) { this.chats.set(d.ids, d) }

  setS (d) { this.sponsorings.set(d.ids, d) }

  setT (d) { this.tickets.set(d.ids, d) }

  store (ds) {
    if (ds) this.s.setDataSync(ds)
    if (this.avatar) this.a.setAvatar(this.avatar)
    if (this.notes.size) for(const x of this.notes) 
      this.n.setNote(x)
    if (this.chats.size) for(const x of this.chats) {
      this.a.setChat(x); this.p.setPCh(x.idE, x.id)
    }
    if (this.sponsorings.size) for(const x of this.sponsorings) 
      this.a.setSponsoring(x)
    if (this.tickets.size) for(const x of this.tickets) 
      this.a.setTicket(x)
  }
}

class SBgr {
  constructor () {
    this.s = stores.session
    this.g = stores.groupe
    this.n = stores.notes
    this.p = stores.people
    this.groupe = null
    this.chatgr = null
    this.notes = new Map()
    this.membres = new Map()
  }

  setG (d) { this.groupe = d }

  setC (d) { this.chatgr = d }

  setN (d) { this.notes.set(d.ids, d) }

  setM (d) { this.membres.set(d.ids, d) }

  store (ds) {
    if (ds) this.s.setDataSync(ds)
    if (this.groupe) this.g.setGrouper(this.groupe)
    if (this.chatgr) this.g.setChatgr(this.chatgr)
    if (this.notes.size) for(const x of this.notes) 
      this.n.setNote(x)
    if (this.membres.size) for(const x of this.membres) {
      this.g.setMembre(x); this.p.setPGr(x.idm, x.id)
    }
  }
}

export class OperationS extends Operation {
  constructor(nomop) { super(nomop, true) }

  /* Chargment en Store des avatars / groupes connus en IDB
  SAUF en mode synchro,
  - les avatars et groupes marqués en suppression dans dataSync (vb = -1)
    qui sont purhés de IDB
  - les membres ou notes marqués à supprimer de dataSync
    qui sont purgés de IDB
  */
  async loadAvatarsGroupes (ds) {
    { // Phase itérative pour chaque avatar
      for(const eds of ds.avatars) {
        const buf = new IDBbuffer()
        if (eds.vb === -1) { // Avatars à supprimer de IDB / store - NON chargés
          buf.purgeAvatarIDB(eds.id)
          ds.delAv(eds.id)
          continue
        }
        const sb = new SBav()
        const m = await idb.getSA (eds.id)
        if (m.avatars) for(const row of m.avatars) sb.setA(await compile(row))
        if (m.notes) for(const row of m.notes) sb.setN(await compile(row))
        if (m.chats) for(const row of m.chats) sb.setC(await compile(row))
        if (m.sponsorings) for(const row of m.sponsorings) sb.setS(await compile(row))
        if (m.tickets) for(const row of m.tickets) sb.setT(await compile(row))
        buf.commit(ds)
        sb.store()
      }
    }
    
    { // Phase itérative pour chaque groupe
      for(const eds of ds.groupes) {
        const buf = new IDBbuffer()
        if (eds.vb === -1) { // Groupes à supprimer de IDB / store - NON chargés
          buf.purgeGroupeIDB(eds.id)
          ds.delGr(eds.id)
          continue
        }
        const sb = new SBgr()
        const m = await idb.getSA (eds.id)
        if (m.groupes) for(const row of m.groupes) sb.setG(await compile(row))
        if (m.chatgrs) for(const row of m.chatgrs) sb.setC(await compile(row))
        if (eds.n === -1) { // Membres à supprimer
          eds.n = 0
          buf.purgeGroupeNoIDB(eds.id)
        } else if (m.notes) for(const row of m.notes) sb.setN(await compile(row))
        if (eds.m === -1) { // Membres à supprimer
          eds.m = 0
          buf.purgeGroupeMbIDB(eds.id)
        } else if (m.membres) for(const row of m.membres) sb.setM(await compile(row))
        buf.commit(ds)
        sb.store()
      }
    }
  }

  /* Traitement du retour d'un Sync pour les rows CCEP
  */
  async retCCep (ret, ds, sb) { // ret du post Sync, dataSync courant (mis à jour ici), IDBbuffer
    if (ret.rowCompte) {
      this.compte = await compile(ret.rowCompte)
      ds.compte.vs = ds.compte.vb
      // Maj du dataStore - Gestion des avatars et des groupes en plus et en moins
      // TODO
      sb.compte = this.compte
    }
    if (ret.rowCompta) {
      this.compta = await compile(ret.rowCompta)
      ds.compta.vs = ds.compta.vb
      sb.compta = this.compta
    }
    if (ret.rowEspace) {
      this.espace = await compile(ret.rowEspace)
      ds.espace.vs = ds.espace.vb
      sb.espace = this.espace
    }
    if (ret.rowPartition) {
      this.partition = await compile(ret.rowPartition)
      ds.partition.vs = ds.partition.vb
      sb.partition = this.partition
    }
  }

  /* Fusion des dataSync: 1) rempli par le serveur depuis rien, 2) celui connu de IDB en mode synchro 
  Le ds "courant" transmis en argument est MIS A JOUR
  */
  async fusionDS (ds) {
    const d2 = await idb.getDataSync()
    // TODO
  }

  /* Depuis un dataSync courant, charge u serveur toutes les mises à jour
  des avatars et des groupes.
  - Itère tant qu'il y a des avatars / groupes à mettre à jour
  - Toutefois chaque appel Syn PEUT ramener des CCEP
    - ils sont traités
    - ceci PEUT conduire à avoir des groupes / avatars en plus ou moins
    - ce qui peut provoquer une itération
  - le DataStync courant est retourné
  */
  async majAvatarsGroupes (ds) {
    while (true) { // Phase 2 : itérative pour chaque avatar / groupe
      let item = null
      for(const e of ds.avatars) { 
        if (e.vs === e.vb) continue // déjà traité
        item = e
        break
      }
      if (!item) for(const e of ds.groupes) { 
        if (e.vs === e.vb) continue // déjà traité
        item = e
        break
      }
      if (!item) break // YES !!! tous traités

      // Traitement d'un item ds ds avatar ou groupe
      const ida = item.id
      const g = ID.estGroupe(ida)
      const sb = g ? new SBgr() : new SBav() // StoreBuffer
      const buf = new IDBbuffer()

      const args =  { authData: session.authToken, dataSync: ds, ida }
      const ret = await post(this, 'Sync', args)
      ds = new DataSync(ret.dataSync) // Mis à jour par le serveur
      const sbccep = new SBccep()
      await this.retCCep(ret, ds, sbccep) // Prise en compte, IDB / store et maj de ds

      const eds = (g ? ds.groupes : ds.avatars).get(ida)
      if (!eds) { // ida a été supprimé depuis- On enregistre les maj de CCEP
        buf.commit(ds)
        sb.store(ds)
        continue 
      }

      // Cas "normal" : chargement incrémental d'un sous-arbre avatar / groupe
      if (ret.rowAvatars) {
        sb.setA(await compile(ret.rowAvatars))
        item.vs = item.vb
        ds.setAv(item)
      }
      if (ret.rowGroupes) {
        sb.setG(await compile(ret.rowGroupes))
        item.vs = item.vb
        ds.setGr(item)
      }
      if (ret.rowNotes) 
        for(const row of ret.rowNotes) sb.setN(await compile(row))
      if (ret.rowChats) 
        for(const row of ret.rowChats) sb.setC(await compile(row))
      if (ret.rowSponsorings) 
        for(const row of ret.rowSponsorings) sb.setS(await compile(row))
      if (ret.rowTickets) 
        for(const row of ret.rowTickets) sb.setT(await compile(row))
      if (ret.rowMembres) 
        for(const row of ret.rowMembres) sb.setM(await compile(row))
      if (ret.rowChatgrs) 
        for(const row of ret.rowChatgrs) sb.setC(await compile(row))

      buf.commit(ds)
      sb.store(ds)
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

      { // Phase 1 : CCEP
        const sb = new SBccep()
        const m = await idb.getCcep()
        sb.compte = await compile(m.comptes)
        sb.compta = await compile(m.comptas)
        sb.espace = await compile(m.espaces)
        if (m.partitions) sb.partition = await compile(m.partitions)
        sb.store(ds)
      }
      
      // Chargement des groupes et avatars depuis IDB
      await this.loadAvatarsGroupes (ds)

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
export class ConnexionSynchroIncognito extends OperationUI {
  constructor() { super('ConnexionCompte') }

  async run() {
    /* TODO: synchro
    - fusion ds serveur et ds IDB
    - chargement des rows depuis IDB
    - gérer les suppressions groupes / avatars
    - gérer fichiers des notes AvNote / Fetat
    */
    try {
      const session = stores.session

      if (session.synchro) {
        // Chargement des "avnotes" des notes ayant des fichiers locaux 
        await idb.loadAvNotes()
        await idb.loadFetats()
      } 

      let ds = DataSync.nouveau()
      { // Phase 1 : CCEP - Le dataSync initial est VIDE: rempli par Sync
        const sb = new SBccep()
        const buf = new IDBbuffer()
        const args =  { authData: session.authToken, optionC: true, dataSync: ds }
        const ret = await post(this, 'Sync', args)
        ds = new DataSync(ret.dataSync) // Remplacé au retour par celui calculé par le serveur
        await this.retCcep(ret, ds, sb)

        // Premier retour de Sync a rempli session. compteId, clek, nomBase
        this.blOK = false // la base locale est vide, aucune données utilisables
        if (session.synchro) {
          await idb.open()
          this.blOK = idb.checkAge()
          await idb.storeBoot()
          if (!this.blOK)
            setTrigramme(session.nombase, await getTrigramme())
        }
        // la base locale est utilisable en mode synchro, mais peut être VIDE si !this.blOK

        if (session.synchro) {
          await this.fusionDS(ds) // Enrichit le ds courant par celui de IDB
          // Chargement des groupes et avatars depuis IDB
          await this.loadAvatarsGroupes (ds)
          /* Etat rétabli à celui de IDB, MAIS
          - CCEP sont rafraîchis par ceux du serveur
          - les avatars et groupes disparus de compte ont été purgés
          */
        }
        
        await buf.commit(ds)
        sb.store(ds)
      }

      // Phase 2 : chargement des sous-arbres groupes et avatars
      await this.majAvatarsGroupes (ds)

      if (session.synchro) // Chargement des descriptifs des fichiers du presse-papier
        await idb.FLfromIDB()

      syncQueue.dataSync = ds //ds courant pour synchronisation au fil de l'eau
      session.setStatus(2)
      syncQueue.reveil()

      console.log('Connexion compte : ' + session.compteId)
      stores.ui.setPage('accueil')
      this.finOK()
    } catch (e) {
      stores.ui.setPage('login')
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
export class AcceptationSponsoring extends OperationUI {
  constructor() { super('AcceptationSponsoring') }

  async run(sp, ardx, txt1, txt2, ps, don, dconf) {
    /* sp : objet Sponsoring
    - id ids : identifiant
    - `ard`: ardoise.
    - 'dlv': 
    - 'sp': est sponsor
    - `na` : du sponsor P.
    - `cv` : du sponsor P.
    - `naf` : na attribué au filleul.
    - 'cletX' : cle de sa tribu cryptée par clé K du comptable
    - `clet` : cle de sa tribu. 0 pour compte A
    - 'don' : don du sponsor
    - 'dconf' : confidentialité requise par le sponsor
    ardx : texte du sponsorisé crypté par la cleX du sponsoring
    txt1 : texte du sponsor
    txt2 : texte du sponsorisé
    ps : phrase secrète du nouveau compte
    don : montant du don
    dconf: si true le sponsorisé refuse le chat
    */
    try {
      // LE COMPTE EST CELUI DU FILLEUL
      const session = stores.session
      session.setOrg(sp.org)
      await session.initSession(ps)
      await session.setIdCleK(sp.id, random(32)) 

      this.auj = AMJ.amjUtc()
      this.buf = new IDBbuffer()
      this.dh = 0

      // TODO
      // await crypter(ps.pcb, session.clek)
      const aSt = stores.avatar

      const rowEspace = await new GetEspace().run()
      let espace = await compile(rowEspace)
      session.setEspace(espace)

      /* Réenregistrement dans repertoire des na créé en PageLogin */
      NomGenerique.from(sp.na.anr)
      NomGenerique.from(sp.naf.anr)
      const idt = sp.clet ? setClet(sp.clet) : 0

      session.setCompteId(sp.naf.id)
      session.setTribuId(idt)
      session.setAvatarId(session.compteId)

      const aChat = sp.clet || (!sp.clet && !sp.dconf && !dconf)

      const { publicKey, privateKey } = await genKeyPair()

      // !!! dans rowCompta: it (indice du compte dans sa tribu) N'EST PAS inscrit
      // (na, clet, cletX, q1, q2, estSponsor, phrase, nc) - le filleul a 1 chat en ligne
      let { dlv, rowCompta } = await Compta.row(sp.naf, sp.clet, sp.cletX, sp.quotas, sp.sp, session.ns, ps, 1, don)
      // session.clek est fixée

      if (dlv < session.auj) throw new AppException(F_BRO, 13)

      const rowAvatar = await Avatar.primaireRow(sp.naf, publicKey, privateKey)
      const rowVersion = { id: sp.naf.id, v: 1, dlv: dlv }
      const _data_ = new Uint8Array(encode(rowVersion))
      rowVersion._data_ = _data_
      rowVersion._nom = 'versions'

      /* Element de act de tribu du nouveau compte
      - `idT` : id court du compte crypté par la clé de la tribu.
      - `sp` : est sponsor ou non.
      - `stn` : statut de la notification _du compte_: _aucune simple bloquante_
      - `qc q1 q2` : quotas attribués.
      - `ca v1 v2` : volumes **approximatifs** effectivement utilisés
      */
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
        /* sql, le serveur a enregistré d'office à la connexion l'abonnement 
        au compte et à sa tribu
        mais en fs c'est à faire explicitement en session */
        await session.fsSync.setCompte(session.compteId)
        if (rowTribu) await session.fsSync.setTribu(session.tribuId)
      }

      console.log('Connexion compte : ' + session.compteId)
      session.setStatus(2)
      stores.ui.setPage('accueil')
      idb.reveil()
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}
