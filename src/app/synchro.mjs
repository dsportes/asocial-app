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
    this.EnCours = false // traitement en cours

    /* Evénnements à traiter */
    this.vcpt = 0
    /* cle: rds, 
      valeur pour un avatar: v
      valeur pour un groupe: { v, vg, vm, vn }
        - v: version générale, incrémentée quelque soit la maj de versions
        - vg: version de groupe / chatgr
        - vm: version des membres
        - vn: version des notres
    */
    this.avgrs = new Map()
  }

  /* Enregistrement de l'arrivée d'un ou plusieurs row versions sur écoute / WS */
  setRows (rows) { 
    if (rows) rows.forEach(row => {
      const rds = Rds.deId(row.id)

      switch (Rds.type(row.id)) {
      case Rds.COMPTE : { 
        if (this.vcpt.v < row.v) this.vcpt.v = row.v
        break
      }
      case Rds.GROUPE : {
        const vx = decode(r._data) // vx: { v, vg, vm, vn  } ???
        const x = this.avgrs.get(rds)
        if (!x || x.v < vx.v) this.avgrs.set(rds, vx)
        break
      }
      case Rds.AVATAR : {
        const x = this.avgrs.get(rds)
        if (!x || x.v < row.v) this.avgrs.set(rds, row.v)
        break
      }
      }

      this.reveil()
    })
  }

  reveil () {
    const ok = stores.session.ok
    if (this.EnCours || !ok) return
    console.log('réveil')

    const ds = syncQueue.dataSync

    if (this.vcpt.v) {
      const vx = this.vcpt.v 
      this.vcpt.v = 0 // retrait de la tâche en attente
      if (vx > ds.compte.vs) {
        // Lancement de l'opération de Sync
        this.EnCours = true
        setTimeout(async () => { 
          await new SyncStd().run([])
          this.EnCours = false
          this.reveil()
        })
        return // Une opération a été lancée
      }
    }

    if (this.avgrs.size) {
      const lida = []
      for (const [rds, v] of this.avgrs) {
        const ida = RegRds.id(rds)
        if (ID.estGroupe(ida)) {
          const item = ds.avatars.get(ida)
          if (this.avgrs[rds] <= item.vs) continue // ida déjà traité
        } else {
          const item = ds.groupes.get(ida)
          const e = this.avgrs[rds] // { v, vg, vm, vn }
          if (e.vg <= item.vs[0]) continue // ida déjà traité
        }
        lida.push(ida)
      }
      this.avgrs.clear() // retrait des tâches en attente
      if (lida.length) {
        this.EnCours = true
        setTimeout(async () => { 
          await new SyncStd().run(lida)
          this.EnCours = false
          this.reveil()
        })
        return // un job a été lancé
      }
    }
    // il n'y avait pas de job à lancer, tout avait déjà été traité
  }
}
export const syncQueue = new Queue()

/* Store Buffer ******************************************************
Liste des maj accumulées à effectuer en une fois au "commit"
*/
class SB {
  constructor () {
    this.s = stores.session
    this.a = stores.avatar
    this.g = stores.groupe
    this.n = stores.note
    this.p = stores.people
    this.avSt = stores.avnote

    this.compte = null
    this.compti = null
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

  setCe (d) { this.compte = d}

  setCi (d) { this.compti = d}

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
    if (this.compti) this.s.setCompti(this.compti)
    if (this.supprPa) this.s.delPartition()

    if (this.avatar) { this.a.setAvatar(this.avatar) }

    if (this.supprAv.size) for (const ida of this.supprAv) {
      this.a.delAvatar(ida)
      this.avSt.delNotes(ida, buf)
    }

    if (this.groupe) { this.g.setGroupe(this.groupe)}

    if (this.supprGr.size) for (const idg of this.supprGr) {
      this.g.delGroupe(idg)
      this.avSt.delNotes(idg, buf)
    }

    if (this.chatgr) { this.g.setChatgr(this.chatgr) }

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
  - Chaque appel Sync PEUT ramener une évolution de compte:
    - elle est traitée
    - ceci PEUT conduire à avoir des groupes / avatars en plus ou moins
    - ce qui peut provoquer une itération
    - le DataStync courant est mis à jour à chaque itération
  lida : liste des ida A PRIORI à rechercher: des notifications ayant été reçue
  */
  async majAvatarsGroupes (ds1, lida) {
    const fs = stores.session.fssync
    const session = stores.session
    const setIda = new Set(lida || [])
    let ds = ds1
    /* Phase itérative pour chaque avatar / groupe
    A chaque itération il y a un commit IDB / store résultant (y compris le DataSync)
    DataSync n'est retourné qu'à la fin
    */
    while (true) {
      for(const [,e] of ds.avatars) 
        if (e.vs !== e.vb) setIda.add(e.id)
      for(const [,e] of ds.groupes) {
        if ((e.vs[1] !== e.vb[1]) || (e.vs[2] !== e.vb[2]) || (e.vs[3] !== e.vb[3]))
          setIda.add(e.id)
      }

      /* LA SORTIE DE LA BOUCLE (et de la fonction) EST ICI */
      if (!setIda.size) return ds // YES !!! tous traités

      // Extraction pour traitement d'un ida du set des ida à traiter
      let ida; for(const x of setIda) { ida = x; break }; setIda.delete(ida)
      
      const args =  { token: session.authToken, dataSync: ds.serial, ida }
      const ret = await post(this, 'Sync', args)
      const nvds = new DataSync(ret.dataSync)
      const [sb, buf] = await this.traitCompte(ret, nvds)
  
      // suppressions de IDB des disparus
      this.supprdsdav(false, nvds, ds, sb, buf) 
      ds = nvds // // le nouveau ds devient le ds courant
      const item = (ID.estGroupe(ida) ? ds.groupes : ds.avatars).get(ida)
      
      if (!item) {
        /* ida lui-même PEUT ne plus être cité dans compte: il n'y a plus d'item
        il est désormais absent de ds.avatars / groupes . Dans ce cas la maj est terminée pour ce cycle
        Cas "normal" : chargement incrémental du sous-arbre avatar / groupe
        */
        if (ID.estGroupe(ida)) {
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
          if (ret.rowAvatar) {
            sb.setA(await compile(ret.rowAvatar))
            buf.putIDB(ret.rowAvatar)
            item.vs = item.vb
          }  
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
      }

      // Commit Store et IDB d'un cycle, un sous-arbre de plus est enegistré
      sb.store(buf)
      await buf.commit(ds)
      syncQueue.dataSync = ds
      if (fs) fs.setDS(ds)
    }
  }
}

/* Synchronisation standard *********************************/
export class SyncStd extends OperationS {
  constructor() { super('SyncStd') }

  /* Chargement des sous-arbres groupes et avatars de la liste
  lida. Mais si compte évolue, il peut s'ajouter des sous-arbres (ou en enlever)
  */
  async run(lida) {
    try { 
      await this.majAvatarsGroupes(syncQueue.dataSync, lida)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Synchronisation standard *********************************
export class Sync2 extends OperationS {
  constructor() { super('Sync2') }

  // Chargement des sous-arbres groupes et avatars de la liste lida
  // Mais si compte évolue, il peut s'ajouter des sous-arbres (ou en enlever)
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
*/

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
        const [rce, rci] = await idb.getRceRci()
        sb.setCe(await compile(rce))
        sb.setCi(await compile(rci))
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
      const args =  { 
        token: session.authToken, 
        dataSync: DataSync.nouveau().serial, 
        optionC: true, 
        ida: 0
      }
      const ret = await post(this, 'Sync', args)
      const ds = new DataSync(ret.dataSync)
      const [sb, buf] = await this.traitCompte(ret, ds) // met à jour ds

      { // Premier retour de Sync a rempli: session. compteId, clek, nomBase
        if (session.fssync) session.fssync.open(ret.credentials, ret.emulator)
        
        if (session.synchro) {
          await idb.open()
          const blOK = await idb.checkAge()
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
  
      if (session.fssync) session.fssync.setDS(ds)
      sb.store(buf)
      await buf.commit(ds)

      // Phase 2 : chargement des sous-arbres groupes et avatars
      await this.majAvatarsGroupes(ds, [])
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

      const ret = await post(this, 'SyncSp', args)
      const ds = DataSync.nouveau()
      // const [sb, buf] = await this.loadCompte(ret, ds)
  
      const sb = new SB()
      const buf = new IDBbuffer()
    
      const compte = await compile(ret.rowCompte)
      sb.setCe(compte)
      ds.compte = { id: compte.id, rds: compte.rds, vs: 1, vb: 1 }
      buf.putIDB(ret.rowCompte)
      sb.setCi(await compile(ret.rowCompti))
      buf.putIDB(ret.rowCompti)

      const avatar = await compile(ret.rowAvatar)
      sb.setA(avatar)
      buf.putIDB(ret.rowAvatar)
      const item = { id: avatar.id, rds: avatar.rds, vs: 1, vb: 1 }
      ds.avatars.set(id, item)

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

