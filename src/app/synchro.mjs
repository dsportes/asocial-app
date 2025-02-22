import stores from '../stores/stores.mjs'
import { Operation } from './operation.mjs'
import { afficherDiag, $t, random, gzipB, setTrigramme, getTrigramme, sleep } from './util.mjs'
import { idb, IDBbuffer } from './db.mjs'
import { DataSync, appexc, ID, Cles, AMJ, HBINSECONDS, Tarif } from './api.mjs'
import { post } from './net.mjs'
import { CV, compile, RegCles } from './modele.mjs'
import { crypter, genKeyPair, crypterRSA } from './webcrypto.mjs'

/* classe Queue ***********************************************************/
class Queue {
  constructor () {
    this.reset()
  }

  reset () {
    this.dataSync = null // dataSync courant de la session. Maj au retour de Sync
    this.EnCours = false // traitement en cours

    /* Evénnements à traiter. [version en attente, version traitée] */
    this.vcpt = [0, 0]
    this.vesp = [0, 0]
    this.vadq = [0, 0]
    this.avgrs = new Map() /* clé: id, valeur: [vn, vt] */
  }

  /* Enregistrement de l'arrivée d'un ou plusieurs row versions sur écoute / WS */
  synchro (trLog) { // trlog : { vcpt, vesp, vadq, lag }
    const session = stores.session
    if (session.estAdmin) return
    let rev = false

    if (trLog.vesp && (trLog.vesp > this.vesp[0])) { 
      this.vesp[0] = trLog.vesp
      rev = true
    }

    if (trLog.vadq && (trLog.vadq > this.vadq[0])) { 
      this.vadq[0] = trLog.vadq
      rev = true
    }

    if (trLog.vcpt && (trLog.vcpt > this.vcpt[0])) { 
      this.vcpt[0] = trLog.vcpt
      rev = true
    }

    if (trLog.lag && trLog.lag.length) for (const [id, v] of trLog.lag) {
      const x = this.avgrs.get(id)
      if (!x) { this.avgrs.set(id, [v, 0]); rev = true }
      else if (x[0] < v) { 
        this.avgrs.set(id, [v, x[1]])
        rev = true 
      }
    }
    if (rev) this.reveil()
  }

  reveil () {
    const session = stores.session
    const config = stores.config
    const ok = session.ok
    if (this.EnCours || !ok) return

    const ds = syncQueue.dataSync
    let doCpt = false, doEsp = false, doAdq = false

    if (this.vcpt[0] > this.vcpt[1]) {
      const vx = this.vcpt[0]
      this.vcpt = [vx, vx] // retrait de la tâche en attente
      if (vx > ds.compte.vs) doCpt = true
    }

    if (this.vesp[0] > this.vesp[1]) {
      const vx = this.vesp[0]
      this.vesp = [vx, vx] // retrait de la tâche en attente
      if (!session.espace || (vx > session.espace.v)) doEsp = true
    }

    if (this.vadq[0] > this.vadq[1]) {
      const vx = this.vadq[0]
      this.vadq = [vx, vx] // retrait de la tâche en attente
      if (!session.adq || (vx > session.acqv)) doAdq = true
    }

    const lids = []
    const nvm = new Map() // future liste d'attente des rds notifiés
    for(const [id, [vn, vt]] of this.avgrs) {
      if (vn > vt) {
        lids.push(id)
        nvm.set(id, [vn, vn]) // version notifiée -> version traitée
      } else nvm.set(id, [vn, vt]) // pas de changement
    }
    this.avgrs = nvm // liste d'attente mise à jour

    if (config.mondebug) 
      console.log('Réveil: ', session.sessionId + ' cpt:' + doCpt + ' esp:' + doEsp + ' lids:' + lids.length)

    if (doCpt || doEsp || doAdq || lids.length) {
      // Lancement de l'opération de Sync
      this.EnCours = true
      setTimeout(async () => { 
        if (doEsp)
          await new GetEspace().run()
        if (doAdq)
          await new Adq().run()
        if (doCpt|| lids.length)
          await new SyncStd().run(lids)
        this.EnCours = false
        this.reveil()
      })
      return // Une opération a été lancée
    }
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
    this.faSt = stores.ficav

    this.espace = null
    this.compte = null
    this.compti = null
    this.invit = null

    this.avatars = new Map()
    this.groupes = new Map() 
    this.chatgrs = new Map()
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

  setEs (d) { this.espace = d}

  setCe (d) { this.compte = d}

  setCi (d) { this.compti = d}

  setIn (d) { this.invit = d}

  setA (d) { this.avatars.set(d.id, d) }

  setG (d) { this.groupes.set(d.id, d) }

  setN (d) { this.notes.set(d.ids, d) }

  setC (d) { this.chats.set(d.ids, d) }

  setS (d) { this.sponsorings.set(d.ids, d) }

  setT (d) { this.tickets.set(d.ids, d) }

  setH (d) { this.chatgrs.set(d.id, d) }

  setM (d) { this.membres.set(d.id + '/' + d.ids, d) }

  delA (ida) { this.supprAv.add(ida) }

  delG (idg) { this.supprGr.add(idg) }

  delM (idg) { this.supprMb.add(idg) }

  delN (idg) { this.supprNo.add(idg) }

  /* IDBbuffer passé en paramètres:
  La suppression des notes d'un avatar ou d'un groupe 
  conduit à mettre à jour / supprimer des Avnote.
  */
  store (buf) {
    if (this.espace) this.s.setEspace(this.espace)
    if (this.compte) this.s.setCompte(this.compte)
    if (this.compti) this.s.setCompti(this.compti)
    if (this.invit) this.g.setInvit(this.invit)
    
    if (this.avatars.size) for(const [,a] of this.avatars) this.a.setAvatar(a)
    
    if (this.supprAv.size) for (const ida of this.supprAv) {
      this.a.delAvatar(ida)
      this.faSt.delNotes(ida, buf)
    }

    if (this.groupes.size) for(const [,g] of this.groupes) this.g.setGroupe(g) 
    
    if (this.supprGr.size) for (const idg of this.supprGr) {
      this.g.delGroupe(idg)
      this.faSt.delNotes(idg, buf)
    }

    if (this.chatgrs.size) for(const [,ch] of this.chatgrs) this.g.setChatgr(ch) 

    if (this.notes.size) {
      for(const [,n] of this.notes) { 
        const st = ID.estGroupe(n.id) ? this.g : this.a
        if (n._zombi) {
          st.delNote(n.id, n.ids)
          this.faSt.delNote(n.id, n.ids, buf)
        } else {
          st.setNote(n)
          this.faSt.setNote(n, buf)
        }
      }
      this.n.majNotes(this.notes)
    }
    
    if (this.chats.size) for(const [,ch] of this.chats) {
      if (ch._zombi) {
        const chav = this.a.getChat(ch.id, ch.ids) // chat AVANT suppression
        if (chav) {
          this.p.delPCh(chav.idE, ch.id)
          this.a.delChat(ch.id, ch.ids)
        }
      } else {
        this.a.setChat(ch)
        this.p.setPCh(ch.idE, ch.id)
      }
    }
    
    if (this.sponsorings.size) for(const [,x] of this.sponsorings) {
      if (x._zombi) this.a.delSponsoring(x.id, x.ids)
      else this.a.setSponsoring(x)
    }
    
    if (this.tickets.size) for(const [,x] of this.tickets) {
      if (x._zombi) this.a.delTicket(x.id, x.ids)
      else this.a.setTicket(x)
    }

    if (this.membres.size) for(const [,mb] of this.membres) {
      if (mb._zombi) { 
        const mbav = this.g.getMembre(mb.id, mb.ids) // membre AVANT suppression
        if (mbav) {
          this.g.delMembre(mb.id, mb.ids)
          this.p.delPGr(mbav.ida, mb.id) 
        }
      }
      else { 
        this.g.setMembre(mb)
        this.p.setPGr(mb.ida, mb.id) 
      }
    }

    if (this.supprMb.size) for(const idg of this.supprMb) {
      const e = this.g.map.get(idg)
      if (e) for (const mbav of e.membres) {
        this.p.delPGr(mbav.idm, idg) 
      }
      this.g.delMembres(idg)
    }

    if (this.supprNo.size) for(const idg of this.supprNo) {
      this.g.delNotes(idg, buf)
      this.faSt.delNotes(idg, buf)
    }
  }
}

/* Déconnexion, reconnexion, commexion *************************************************/
/* garderMode : si true, garder le mode */
export async function deconnexion(recon) {
  const ui = stores.ui
  // ui.setPage('null')
  const session = stores.session
  const hb = stores.hb
  await hb.stopHB()
  const mode = session.mode
  const org = session.org
  const phrase = session.phrase

  if (session.accesIdb) idb.close()
  if (session.websocket) session.websocket.close()
  if (session.fsSync) session.fsSync.close()
  stores.reset() // Y compris session
  syncQueue.reset()
  session.setMode(mode)
  session.org = org
  if (recon) {
    ui.setPage('session')
    session.phrase = phrase
    await connexion(phrase)
  } else {
    ui.reLogin = true
    ui.setPage('login')
  }
}

/* Connexion depuis PageLogin ou reconnexion (ci-dessus) **********************/
export async function connexion(phrase, razdb) {
  if (!phrase) return
  const session = stores.session
  const hb = stores.hb
  await session.initSession(phrase)

  if (session.org === 'admin') {
    session.setMode(2)
    try { await new ConnexionAdmin().run() } catch (e) { /* */ }
    return
  }

  if (session.avion) {
    if (!session.nombase) { // nom base pas trouvé en localStorage de clé lsk
      await afficherDiag($t('OPmsg1'))
      await deconnexion(true)
      return
    }
    try {
      await idb.open()
    } catch (e) {
      await afficherDiag($t('OPmsg2', [e.message]))
      await deconnexion()
      return
    }
    // initialisation de compteId et clek depuis boot de IDB
    if (!await idb.getBoot()) { // false si KO 
      await afficherDiag($t('OPmsg3'))
      await deconnexion()
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

    // const ui = stores.ui; for(let i = 0; i < 5; i++) ui.afficherMessage('message #' + i, i % 2)

  } catch (e) { 
    throw e
  }

}

/* classe OperationS *******************************************************/
export class OperationS extends Operation {
  constructor(nomop) { 
    super(nomop, true) 
  }

  /* Chargment en Store des avatars / groupes connus en IDB (avion et synchro).
  Remarque en mode synchro,
  - les avatars et groupes absents de ds ne sont pas chargés (ont été supprimés avant)
  - les membres ou notes absents de ds ne sont pas chargés (ont été supprimés avant)
  */
  async loadAvatarsGroupes (sb, ds) {
    { // Pour chaque avatar EXISTANT en ds
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
    
    { // Pour chaque groupe EXISTANT en ds
      for(const [,eds] of ds.groupes) {
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
      }
    }
  }

  /* Gestion des suppressions entre ds (actuel) et dav (avant):
  - en "connexion", la maj du store est inutile (il n'a pas été rempli)
  - ds est INCHANGE
  */
  supprdsdav (cnx, ds, dav, sb, buf) {
    dav.avatars.forEach((e, id) => { 
      if (!ds.avatars.has(id)) {
        buf.purgeAvatarIDB(id)
        if (!cnx) sb.delA(id)
      }
    })
    dav.groupes.forEach((eav, id) => {
      const e = ds.groupes.get(id)
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

  async setCeCiIn (ds, ret, sb, buf) {
    if (ret.rowCompte) {
      const x = await compile(ret.rowCompte)
      sb.setCe(x)
      buf.putIDB(x, ret.rowCompte)
      ds.compte.vs = ds.compte.vb
    }
    if (ret.rowCompti) {
      const x = await compile(ret.rowCompti)
      sb.setCi(x)
      buf.putIDB(x, ret.rowCompti)
      ds.compte.vs = ds.compte.vb
    }
    if (ret.rowInvit) {
      const x = await compile(ret.rowInvit)
      sb.setIn(x)
      buf.putIDB(x, ret.rowInvit)
      ds.compte.vs = ds.compte.vb
    }
  }

  /* Depuis un dataSync courant, charge du serveur toutes les mises à jour
  des avatars et des groupes.
  - Itère tant que le serveur dit qu'il n'a pas fini
  - Chaque itération PEUT ramener une évolution de compte:
    - elle est traitée
    - ceci PEUT conduire à avoir des groupes / avatars en plus ou moins
    - le DataStync courant est mis à jour à chaque itération
  - lids : liste des IDs des av / gr reçus en notifications
  - full: si true, cherche TOUTES les évolutions (pas seulement celles de lids)
  */
  async syncStd (ds1, lids, full) {
    const session = stores.session
    const config = stores.config
    let ds = ds1

    /* A chaque itération il y a un commit IDB / store résultant (y compris le DataSync)*/
    for (let nbIter = 0; nbIter < 50; nbIter++) {
      const hb = stores.hb
      const args =  { 
        token: session.authToken, 
        dataSync: ds ? ds.serial() : null, 
        nhb: hb.nhb,
        nbIter
      }
      if ((!ds1 || full) && nbIter === 0) // Cas de login / relogin
        args.subJSON = config.subJSON
      if (nbIter === 0) {
        if (full) args.full = true
        else args.lids = lids || []
      }
      const ret = await post(this, 'Sync', args)
      if (ret.tarifs) Tarif.init(ret.tarifs)
      const nvds = DataSync.deserial(ret.dataSync)
      const sb = new SB()
      const buf = new IDBbuffer()
      await this.setCeCiIn(nvds, ret, sb, buf)

      if (nbIter === 0 && ret.rowEspace) {
        const x = await compile(ret.rowEspace)
        sb.setEs(x)
        buf.putIDB(x, ret.rowEspace)
      }

      if (!ds1 && session.synchro && nbIter === 0) { 
        // Premier retour de Sync a rempli: session. compteId, clek, nomBase
        await idb.open()
        const blOK = await idb.checkAge()
        await idb.storeBoot()
        if (!blOK)
          setTrigramme(session.nombase, await getTrigramme())
        // la base locale est utilisable en mode synchro, mais peut être VIDE si !this.blOK 

        const dav = await idb.getDataSync()
        if (dav) {
          this.supprdsdav(true, nvds, dav, sb, buf)
          // Enrichit le nvds par celui de IDB 
          for(const [,e] of nvds.avatars) {
            const eav = dav.avatars.get(e.id)
            if (eav) e.vs = eav.vs
          }
          for(const [,e] of nvds.groupes) {
            const eav = dav.groupes.get(e.id)
            if (eav) {
              e.vs = eav.vs
              e.ms = eav.ms // la session AVAIT l'option m
              e.ns = eav.ns // la session AVAIT l'option n
            }
          }
        }

        /* Chargement dans sb des groupes et avatars depuis IDB
        Pour les groupes ne charge (s'il y en avait) les membres et notes
        que si elles sont requises */
        await this.loadAvatarsGroupes (sb, nvds)
        
        /* Etat rétabli à celui de IDB, MAIS
        - espace / compte / compti rafraîchis par ceux du serveur
        - les avatars et groupes disparus (complètement ou partiellement) de compte ont été purgés
        */
        ds = nvds
      } else {
        // suppressions de IDB des disparus
        if (ds) this.supprdsdav(false, nvds, ds, sb, buf) 

        ds = nvds // le nouveau ds devient le ds courant

        if (ret.rowAvatars) for(const row of ret.rowAvatars) {
          const x = await compile(row)
          sb.setA(x)
          buf.putIDB(x, row)
        }
        if (ret.rowChats) for(const row of ret.rowChats) {
          const x = await compile(row)
          sb.setC(x)
          buf.putIDB(x, row)
        }
        if (ret.rowSponsorings) for(const row of ret.rowSponsorings) {
          const x = await compile(row)
          sb.setS(x)
          buf.putIDB(x, row)
        }
        if (ret.rowTickets) for(const row of ret.rowTickets) {
          const x = await compile(row)
          sb.setT(x)
          buf.putIDB(x, row)
        }
        if (ret.rowNotes) for(const row of ret.rowNotes) {
          const x = await compile(row)
          sb.setN(x)
          buf.putIDB(x, row)
        }
        if (ret.rowGroupes) for(const row of ret.rowGroupes) {
          const x = await compile(row)
          sb.setG(x)
          buf.putIDB(x, row)
        }
        if (ret.rowChatgrs) for(const row of ret.rowChatgrs) {
          const x = await compile(row)
          sb.setH(x)
          buf.putIDB(x, row)
        }
        if (ret.rowMembres) for(const row of ret.rowMembres) {
          const x = await compile(row)
          sb.setM(x)
          buf.putIDB(x, row)
        }
        for (const [,x] of ds.avatars) {
          if (x.chg) { x.chg = false; x.vs = x.vb }
        }
        for (const [,x] of ds.groupes) {
          if (x.chg) { x.chg = false; x.vs = x.vb; x.ms = x.m; x.ns = x.n }
        }
      }

      // Commit Store et IDB d'un cycle
      // 0 à N sous-arbres de plus enegistrés
      sb.store(buf)
      await buf.commit(ds)
      syncQueue.dataSync = ds
      if (ds.estAJour) break
    }
  }
}

/* Synchronisation standard *********************************/
export class SyncStd extends OperationS {
  constructor() { super('SyncStd') }

  /* Chargement des sous-arbres groupes et avatars de la liste lrds.
  Mais si compte évolue, il peut s'ajouter des sous-arbres (ou en enlever de cette liste)
  */
  async run(lids) {
    try { 
      await this.syncStd(syncQueue.dataSync, lids)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Synchronisation standard *********************************/
export class SyncFull extends OperationS {
  constructor() { super('SyncStd') }

  /* Chargement des sous-arbres groupes et avatars de la liste lrds.
  Mais si compte évolue, il peut s'ajouter des sous-arbres (ou en enlever de cette liste)
  */
  async run() {
    try { 
      await this.syncStd(syncQueue.dataSync, null, true)
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
      session.setCompte(null)
      session.setOrg('admin')
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
  constructor() { 
    super('ConnexionCompte') 
  }

  async run() {
    try {
      stores.ui.setPage('session')

      // idb: ouverte - session.clek compteId définis
      this.auj = AMJ.amjUtc()
      this.dh = 0

      const session = stores.session

      const ds = await idb.getDataSync()

      { // Phase 1 : chargement depuis IDB des espaces / comptes / comptis
        const sb = new SB()
        const [res, rce, rci, rin] = await idb.getECCI()
        sb.setCe(await compile(rce))
        sb.setCi(await compile(rci))
        sb.setEs(await compile(res))
        sb.setIn(await compile(rin))
        sb.store()
      }
      
      { // Chargement des groupes et avatars depuis IDB
        const sb = new SB()
        await this.loadAvatarsGroupes(sb, ds)
        sb.store()
      }

      // Chargement des descriptifs des fichiers du presse-papier
      await idb.FLfromIDB()

      // Chargement des ficav
      const mf = await idb.loadFicav()
      stores.ficav.loadFicav(mf)
      await idb.NLfromIDB()

      console.log('Connexion compte : ' + session.compteId)
      await sleep(300)
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
      const ui = stores.ui
      ui.setPage('session')
      const session = stores.session
      await this.syncStd(null, [])

      // Chargement des descriptifs des fichiers du presse-papier
      if (session.synchro) await idb.FLfromIDB()

      // Chargement des ficav
      if (session.synchro) {
        const mf = await idb.loadFicav()
        stores.ficav.loadFicav(mf)
        await idb.NLfromIDB()
      }

      console.log('Connexion compte : ' + session.compteId)
      session.setStatus(2)
      syncQueue.reveil()
      await sleep(300)
      if (session.nivAlerte) stores.ui.setPage('compta', 'alertes')
      else stores.ui.setPage('accueil')
      // await stores.config.getPerm()
      this.finOK()
    } catch (e) {
      // stores.ui.setPage('login')
      await this.finKO(e)
    }
  }
}

/* OP_GetEspace: 'Obtention de l\'espace' *********
args.token donne les éléments d'authentification du compte.
args.ns : pour l'administrateur seulement
Retour:
- rowSynthse
*/
export class GetEspace extends Operation {
  constructor () { super('GetEspace') }

  async run () { 
    try {
      const session = stores.session
      const args = { token: session.authToken }
      const ret = await post(this, 'GetEspace', args)
      const s = await compile(ret.rowEspace)
      session.setEspace(s)
      idb.storeEspace(ret.rowEspace)
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_Adq: 'Récupération des compteurs majeurs de comptabilité' *********
*/
export class Adq extends Operation {
  constructor() { super('Adq') }

  async run() {
    try {
      const session = stores.session
      const args = { token: session.authToken }
      await post(this, 'Adq', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}
