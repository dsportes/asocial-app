import stores from '../stores/stores.mjs'
import { encode } from '@msgpack/msgpack'

import { OperationUI, RafraichirTickets } from './operations.mjs'
import { SyncQueue } from './sync.mjs'
import { $t, setTrigramme, getTrigramme, afficherDiag, sleep } from './util.mjs'
import { post } from './net.mjs'
import { AMJ, ID, PINGTO2, IDBOBS, FLAGS, d14 } from './api.mjs'
import { RegCles, compile, Espace, Compta, Avatar, Tribu, Synthese, Chat, NomGenerique, SessionSync, getNg, Versions } from './modele.mjs'
import {
  openIDB, closeIDB, deleteIDB, getCompte, getCompta, getTribu, loadVersions, getAvatarPrimaire, getColl,
  IDBbuffer, gestionFichierCnx, NLfromIDB, FLfromIDB, lectureSessionSyncIdb
} from './db.mjs'
import { crypter, random, genKeyPair, crypterRSA } from './webcrypto.mjs'
import { FsSyncSession } from './fssync.mjs'
import { openWS, closeWS } from './ws.mjs'
import { setClet } from './modele.mjs'

/* garderMode : si true, garder le mode */
export function deconnexion(garderMode) {
  const ui = stores.ui
  // ui.setPage('null')
  const session = stores.session
  const mode = session.mode
  const org = session.org
  Demon.stop()

  if (session.accesIdb) closeIDB()
  if (session.accesNet) {
    if (session.fsSync) session.fsSync.close(); else closeWS()
  }
  stores.reset()
  if (garderMode) session.setMode(mode)
  session.org = org
  SyncQueue.reset()
  ui.setPage('login')
}

export async function reconnexionCompte() {
  const session = stores.session
  const phrase = session.phrase
  deconnexion(true)
  await connecterCompte(phrase)
}

async function initSession(phrase) {
  const session = stores.session
  const config = stores.config
  session.init(phrase)
  if (session.accesNet) {
    if (config.hasWS) {
      await openWS()
      session.fsSync = null
    } else {
      session.fsSync = new FsSyncSession()
    }
  }
  RegCles.reset()
  stores.reset(true)
}

export class Demon {
  static courant = null
  static to = null

  constructor() {
    Demon.courant = this
    this.majConso = true
    if (Demon.to) {
      clearTimeout(Demon.to)
      Demon.to = null
    }
  }

  async run() {
    const clos = await this.doTheJob()
    Demon.courant = null
    if (!clos) {
      Demon.to = setTimeout(async () => {
        await Demon.start()
      }, PINGTO2 * 60000)
    }
  }

  static async start() {
    const session = stores.session
    if (!session.accesNet) return
    // Lancement immédiat, sauf si déjà en exécution
    if (!Demon.courant) await new Demon().run()
  }

  static stop() {
    // L'empêche de se relancer sans interrompre son exécution en cours
    if (Demon.to) {
      clearTimeout(Demon.to)
      Demon.to = null
    }
  }

  // Retourne true si l'espace est clos, pour arrêter le cycle
  async doTheJob() {
    const session = stores.session
    const ntf = session.notifAdmin
    if (ntf && ntf.nr === 2) return true
    if (ntf && ntf.nr === 1) this.majConso = false

    try {
      let conso = null
      if (this.majConso) {
        const ca = session.consoatt
        if (ca.nl || ca.ne || ca.vd || ca.vm) conso = { ...ca }
      }
      if (!conso && (Date.now() - session.dhConso < 1800000)) return false
      const args = { token: session.authToken, conso }
      const ret = await post(null, 'EnregConso', args)
      session.setDhConso(ret.dh)
      if (ret.fait) session.razConsoatt()
    } catch (e) {
      console.log('Démon KO: ' + e.toString())
      if (e.code === 1002) return true // espace clos par l'administrateur
    }
    return false
  }
}

export async function connecterCompte(phrase, razdb) {
  if (!phrase) return
  const session = stores.session
  await initSession(phrase)
  if (session.synchro && session.nombase && razdb) {
    await deleteIDB(session.nombase)
  }

  if (session.avion) {
    if (!session.nombase) { // nom base pas trouvé en localStorage de clé lsk
      await afficherDiag($t('OPmsg1'))
      deconnexion(true)
      return
    }
    try {
      await openIDB()
    } catch (e) {
      await afficherDiag($t('OPmsg2', [e.message]))
      deconnexion()
      return
    }
    const x = await getCompte() // x:false ou { id, k }
    if (!x) {
      await afficherDiag($t('OPmsg3'))
      deconnexion()
      return
    }
    session.setCompteId(x.id) // Important, requis pour lire ensuite compta ...
    session.setOrg(phrase.org)
    session.clek = x.k
  }
  try {
    await new ConnexionCompte().run()
  } catch (e) {
    console.log(e)
  }
}

/**********************************************************************************
Opération de connexion à un compte par sa phrase secrète (synchronisé, incognito, avion)
**********************************************************************************/

/* OP_ConnexionCompte: 'Connexion à un compte'
*/
export class ConnexionCompte extends OperationUI {
  constructor() { super('ConnexionCompte') }

  /* Signe les avatars et groupes. Remplit: 
  - this.avatarsToStore, .avToSuppr, .avRowsModifies, .avRequis
  - this.groupesToStore, .grToSuppr, .grRowsModifies, .grRequis
  - this.versions :  map pour chaque avatar / groupe (SANS les zombis):
    { v }: pour un avatar
    { v, vols: {v1, v2, q1, q2} } : pour un groupe
  - this.mbsMap : map des membres des groupes auxquels participent au moins un des avatars
      - clé: id du groupe  
      - valeur: { idg, v, npgk, mbs: [ids], dlv }
        - mbs: array des im des avatars du compte participant.
  */
  async avGrSignatures () {
    const session = stores.session

    while (true) {
      const abPlus = []
      this.versions = {}

      // Traitement des avatars
      /* map des avatars du compte 
      - clé: id de l'avatar  - valeur: {v, dlv} } */
      const avsMap = {}
      this.avatarsToStore = new Map()
      this.avToSuppr = new Set()
      this.avRowsModifies = []

      this.avRequis = this.avatar.avatarIds
      // avatars connus en IDB
      if (session.accesIdb) for (const row of this.cAvatars) {
        if (this.avRequis.has(row.id)) {
          this.avatarsToStore.set(row.id, await compile(row))
          avsMap[row.id] = this.avatar.v
        } else this.avToSuppr.add(row.id)
      }
      // avatars non stockés en IDB
      for (const id of this.avRequis) {
        if (session.fsSync) await session.fsSync.setGroupe(id); else abPlus.push(id)
        if (!this.avatarsToStore.has(id))
          avsMap[id] = 0
      }

      // Traitement des groupes
      /* map des membres des groupes auxquels participent au moins un des avatars
      - clé: id du groupe  
      - valeur: { idg, v, npgk, mbs: [ids], dlv }
      */
      this.mbsMap = {}
      this.groupesToStore = new Map()
      this.grToSuppr = new Set()
      this.grRowsModifies = []
      const mgx = this.avatar.mgkParIdg

      if (session.accesIdb) for (const row of this.cGroupes) {
        const empg = mgx.get(row.id)
        if (empg) {
          this.groupesToStore.set(row.id, await compile(row))
          const x = { 
            v: row.v,
            npgk: Array.from(empg.npgks.values()), 
            mbs: Array.from(empg.ims.values())
          }
          this.mbsMap[row.id] = x
        } else this.grToSuppr.add(row.id)
      }

      for(const [idg, empg] of mgx) {
        if (session.fsSync) 
          await session.fsSync.setGroupe(idg)
        else abPlus.push(idg)
        if (!this.groupesToStore.has(idg)) {
          let x = this.mbsMap[idg]
          if (!x) {
            x = { 
              v: 0,
              npgk: Array.from(empg.npgks.values()), 
              mbs: Array.from(empg.ims.values())
            }
          }
          this.mbsMap[idg] = x
        }
      }

      if (!session.accesNet) return

      const args = { 
        token: session.authToken, 
        vcompta: this.compta.v,
        vavatar: this.avatar.v, 
        estFige: session.estFige,
        mbsMap: this.mbsMap, 
        dlv: this.dlvApres,
        avsMap, 
        abPlus 
      }
      const ret = this.tr(await post(this, 'avGrSignatures', args))
      /*Retour:
      - `KO` : true si le compta ou l'avatar principal a changé de version.
      - `versions` : map pour chaque avatar / groupe :
        - _clé_ : id du groupe ou de l'avatar.
        - _valeur_ :
          - `{ v }`: pour un avatar.
          - `{ v, vols: {v1, v2, q1, q2} }` : pour un groupe.
      - `rowAvatars` : rows avatars ayant une nouvelle version sauf principal.
      - `rowGroupes`: rows groupes ayant une nouvelle version
      - `rowAvatar` : avatar principal.
        - Si KO.
        - Si OK seule mpgk a pu avoir des items en moins (groupes disparus)
      - `rowCompta` : compta si KO.
      */
      if (!ret.KO) {
        if (ret.npgkDisp) {
          /* Traitement des groupes détectés disparus, 
          - les purges GC de groupes NE SONT PAS répercutées dans mpgk
          - supprime l'élément de mpg (anticipe les effets d'une future synchro)
          - ajoute l'id du groupe dans le set des groupes disparus
          */
          ret.npgkDisp.forEach(npgk => {
            const e = this.avatar.mpg.get(npgk)
            if (e) {
              this.grToSuppr.add(e.ng.id)
              this.avatar.mpg.delete(npgk)
            }
          })
        }
        
        if (ret.rowAvatars && ret.rowAvatars.length) for (const row of ret.rowAvatars){
          this.avRowsModifies.push(row)
          this.avatarsToStore.set(row.id, await compile(row))
        }
        
        if (ret.rowGroupes && ret.rowGroupes.length) for (const row of ret.rowGroupes) {
          this.grRowsModifies.push(row)
          this.groupesToStore.set(row.id, await compile(row))
        }

        for (const idx in ret.versions)
          this.versions[idx] = ret.versions[idx]

        return
      }

      // KO: rows Compta ou Avatar modifiés, on boucle
      this.rowCompta = ret.rowCompta
      this.rowAvatar = ret.rowAvatar
      if (!await this.connex2()) 
        throw new AppExc(F_BRO, this.compta.estA ? 11 : 12) // DLV dépassée
    }
  }

  /** Chargement pour un avatar de ses notes postérieures à la plus récente ************/
  async chargerNotes(id, vidb, vsrv, estGr) {
    const session = stores.session
    const aSt = stores.avatar
    const gSt = stores.groupe
    let n1 = 0, n2 = 0
    const rows = {}
    for (const row of this.cNotes) {
      if (row.id === id) {
        rows[row.ids] = row
        n1++
      }
    }

    let rowNotes // array

    if (session.accesNet && (!vidb || vsrv > vidb)) {
      const args = { token: session.authToken, id, v: vidb }
      const ret = this.tr(await post(this, 'ChargerNotes', args))
      rowNotes = ret.rowNotes
    }
    if (rowNotes && rowNotes.length) {
      for (const row of rowNotes) {
        this.buf.putIDB(row)
        rows[row.ids] = row
        n2++
      }
    }
    for (const ids in rows) {
      const note = await compile(rows[ids])
      if (!note._zombi) {
        (estGr ? gSt : aSt).setNote(note)
        if (session.accesIdb) this.buf.mapSec[note.pk] = note // Pour gestion des fichiers
      }
    }
    return [n1, n2]
  }

  /** Chargement pour un avatar de ses chats postérieurs au plus récent ************/
  async chargerChats(id, vidb, vsrv) {
    const session = stores.session
    let n1 = 0, n2 = 0
    const rows = {}
    for (const row of this.cChats) {
      if (row.id === id) {
        rows[row.ids] = row
        n1++
      }
    }

    let rowChats // array

    if (session.accesNet && (!vidb || vsrv > vidb)) {
      const args = { token: session.authToken, id, v: vidb }
      const ret = this.tr(await post(this, 'ChargerChats', args))
      rowChats = ret.rowChats
    }
    if (rowChats && rowChats.length) {
      for (const row of rowChats) {
        if (row.dlv) { // les chats ayant une dlv sont à supprimer
          this.buf.supprIDB(row)
          delete rows[row.ids]
        } else {
          this.buf.putIDB(row)
          rows[row.ids] = row
          n2++
        }
      }
    }
    const aSt = stores.avatar
    for (const ids in rows) {
      const chat = await compile(rows[ids])
      aSt.setChat(chat)
    }
    return [n1, n2]
  }

  /** Chargement pour le Comptable de ses tickets postérieurs au plus récent ************/
  async chargerTickets(id, vidb, vsrv) {
    const session = stores.session
    let n1 = 0, n2 = 0
    const rows = {}
    for (const row of this.cTickets) {
      if (row.id === id) {
        rows[row.ids] = row
        n1++
      }
    }

    let rowTickets // array

    if (session.accesNet && (!vidb || vsrv > vidb)) {
      const args = { token: session.authToken, id, v: vidb }
      const ret = this.tr(await post(this, 'ChargerTickets', args))
      rowTickets = ret.rowTickets
    }
    if (rowTickets && rowTickets.length) {
      for (const row of rowTickets) {
        if (!row._data_) {
          this.buf.supprIDB(row)
          delete rows[row.ids]
        } else {
          this.buf.putIDB(row)
          rows[row.ids] = row
          n2++
        }
      }
    }
    const aSt = stores.avatar
    for (const ids in rows) {
      const ticket = await compile(rows[ids])
      aSt.setTicket(ticket)
    }
    return [n1, n2]
  }

  /** Chargement pour un avatar de ses sponsorings postérieurs au plus récent ************/
  async chargerSponsorings(id, vidb, vsrv) {
    const session = stores.session
    let n1 = 0, n2 = 0
    const rows = {}
    for (const row of this.cSponsorings) {
      if (row.id === id) {
        if (row.dlv <= this.auj) {
          rows[row.ids] = row
          n1++
        }
      }
    }

    let rowSponsorings

    if (session.accesNet && (!vidb || vsrv > vidb)) {
      const args = { token: session.authToken, id, v: vidb }
      const ret = this.tr(await post(this, 'ChargerSponsorings', args))
      rowSponsorings = ret.rowSponsorings
    }
    if (rowSponsorings && rowSponsorings.length) {
      for (const row of rowSponsorings) {
        if (row.dlv >= this.auj) { // ignore les sponsorings de dlv dépassée
          this.buf.putIDB(row)
          rows[row.ids] = row
          n2++
        } else {
          this.buf.supprIDB(row)
          delete rows[row.ids]
        }
      }
    }
    const aSt = stores.avatar
    for (const ids in rows) {
      const sponsoring = await compile(rows[ids])
      aSt.setSponsoring(sponsoring)
    }
    return [n1, n2]
  }

  /** Chargement pour un groupe de ses membres postérieurs au plus récent ************/
  async chargerMembresChatgrs(groupe, vidb, vsrv) {
    const id = groupe.id
    const session = stores.session
    let n1 = 0, n2 = 0
    const rows = new Map()

    let rowCh = null
    for (const row of this.cMembres) {
      n1++
      if (row.id === id) {
        if (groupe.estDisparu(row.ids)) {
          this.buf.supprIDB(row)
        } else {
          rows.set(row.ids, row)
        }
      }
    }
    for (const row of this.cChatgrs) {
      if (row.id === id) rowCh = row
    }


    let rowMembres

    if (session.accesNet && (!vidb || vidb < vsrv)) {
      const args = { token: session.authToken, id, v: vidb }
      const ret = this.tr(await post(this, 'ChargerMembresChatgrs', args))
      rowMembres = ret.rowMembres
      if (ret.rowChatgr) {
        rowCh = ret.rowChatgr
        this.buf.putIDB(rowCh)
      }
    }
    if (rowMembres && rowMembres.length) {
      for (const row of rowMembres) {
        n2++
        if (groupe.estDisparu(row.ids)) {
          // était disparu dans son groupe
          this.buf.supprIDB(row)
          rows.delete(row.ids)
        } else {
          if (row.dlv && (row.dlv < this.auj)) {
            /* row membres est un peu plus récent que le row groupe
            Il est disparu dans membre => on le force disparu 
            dans son groupe pour la cohérence du store.
            Une synchro viendra plus tard vraiment mettre à jour le groupe */
            groupe.setDisparu(row.ids)
            this.buf.supprIDB(row)
            rows.delete(row.ids) // s'il était dans IDB, il ne l'est plus
          } else {
            this.buf.putIDB(row)
            rows.set(row.ids, row)
          }
        }
      }
    }

    const gSt = stores.groupe
    // Dans rows on a peut-être des rows disparus chargés de IDB et pas mis à jour depuis
    for (const [ids, row] of rows) {
      n1++
      if (row.dlv && (row.dlv < this.auj)) {
        // row chargé de IDB et disparu
        groupe.setDisparu(row.ids) // Pour cohérence interne groupe / membre
        this.buf.supprIDB(row)
      } else {
        const membre = await compile(row)
        gSt.setMembre(membre)
      }
    }
    
    if (rowCh) {
      const chatgr = await compile(rowCh)
      gSt.setChatgr(chatgr)
    }
    
    return [n1, n2]
  }

  // MAJ dans tribu de v1 v2 de compta (si +- 10%)
  async MajTribuVols() { // this.compta this.tribu
    const act = this.tribu.act[this.compta.it]
    const cpt = this.compta.compteurs
    let b = false
    const dv1 = act.v1 > cpt.v1 ? act.v1 - cpt.v1 : cpt.v1 - act.v1
    if (dv1 > (cpt.v1 / 10)) {
      b = true
    } else {
      const dv2 = act.v2 > cpt.v2 ? act.v2 - cpt.v2 : cpt.v2 - act.v2
      if (dv2 > (cpt.v2 / 10)) b = true
    }
    if (!b) return
    const session = stores.session
    const args = {
      token: session.authToken,
      idt: this.tribu.id,
      it: this.compta.it,
      v1: cpt.v1,
      v2: cpt.v2
    }
    this.tr(await post(this, 'MajTribuVols', args))
  }

  /* Authentification initiale. Définit:
  - session.compteId : 0 si admin
  - session.avatarId == compteId
  Si pas admin:
  - session.org ns
  - session.estClos : si l'espace est clos
  - this.espace
  */
  async connex1 () {
    const session = stores.session
    /* Authentification et get de avatar / compta / tribu (si compte O) */
    const args = { token: session.authToken }
    // Connexion : récupération de rowCompta rowAvatar fscredentials
    const ret = this.tr(await post(this, 'ConnexionCompte', args))

    if (ret.admin) {
      session.setCompteId(0)
      session.setOrg('admin')
      if (ret.espaces) for (const e of ret.espaces)
        session.setEspace(await compile(e), true)
      return
    }

    session.setCompteId(ret.rowCompta.id)
    session.setAvatarId(session.compteId)
    if (session.estComptable) session.setMode(2)

    if (session.fsSync && ret.credentials) {
      await session.fsSync.open(ret.credentials, ret.emulator || 0)
      await session.fsSync.setCompte(session.compteId)
    }
    
    this.espace = await compile(ret.rowEspace)
    session.setEspace(this.espace)
    session.setOrg(this.espace.org)
    /* La compilation a enregistré les notifications de l'AT
    dans session. estClos indique donc si l'espace est clos
    */
    if (session.estClos) return

    this.rowCompta = ret.rowCompta
    this.rowAvatar = ret.rowAvatar
  }

  /* Compile rowCompta et rowAvatar, obtient la tribu (si compte O). Définit:
  this.compta
  this.avatar (l'avatar principal)
  this.tribu : remet à niveau la stat de volume de tribu
  */
  async connex2 () {
    const session = stores.session
    this.compta = await compile(this.rowCompta)
    // Gestion de la DLV
    this.dlvApres = this.compta.calculDlv(this.compta.estA ? this.compta.credits.total : 0)
    if (this.dlvApres < session.auj) return false
    this.compta.dlv = this.dlvApres

    this.avatar = await compile(this.rowAvatar)
    if (this.compta.rowCletK || this.compta.donsX) {
      await this.compta.compile2(this.avatar.priv)
      /* Si dans compta, cletK a été recrypté */
      if (session.accesNetNf && this.compta.cletK) {
        const args = { token: session.authToken, cletK: this.compta.cletK }
        this.tr(await post(this, 'MajCletKCompta', args))
        delete this.compta.cletK
      }
    }

    if (this.compta.idt) {
      const args = { token: session.authToken, id: this.compta.idt, abPlus: [this.compta.idt] }
      const ret = this.tr(await post(this, 'GetTribu', args))
      this.rowTribu = ret.rowTribu
      this.tribu = await compile(this.rowTribu)
      await this.MajTribuVols() // MAJ tribu de v1 v2 (si +- 10%)
      session.setTribuId(this.tribu.id)
      if (session.fsSync)
        await session.fsSync.setTribu(session.tribuId)
    }
    return true
  }

  async phase0Net() {
    const session = stores.session
    const config = stores.config

    // maintenant que la cle K est connue
    if (session.accesIdb && !session.nombase) await session.setNombase()

    if (session.synchro) {
      let dbok = false
      try {
        await openIDB()
        const idk = await getCompte()
        /* Remarque si idk !== false
        le login est OK avec le serveur, MAIS la phrase secrète a changé
        depuis la session précédente. 
        Le row 'compte' {id, k} sera dans tous les cas réécrit en fin de synchronisation.
        */
        const s = await lectureSessionSyncIdb()
        /* Nombre de jours depuis la dernière synchronisation.
        Si 0, JAMAIS synchronisé, sinon au moins 1 
        */
        const nbjds = s.dhsync ? Math.ceil((Date.now() - s.dhsync) / 86400000) : 0
        dbok = nbjds > IDBOBS
        // si dbok est false, la base est obsolète : elle va être réinitialisée
      } catch (e) {
        // Incident sur l'ouverture ou création de la base
        dbok = false
      }

      if (!dbok) {
        closeIDB()
        await deleteIDB(session.nombase)
        await openIDB()
        setTrigramme(session.nombase, await getTrigramme())
        session.setSessionSync(new SessionSync())
      }
    }
  }

  async phase0Avion() {
    // session.compteId et session.clek OK
    const session = stores.session
    this.rowCompta = await getCompta()
    this.compta = await compile(this.rowCompta)
    if (this.compta.idt) {
      this.rowTribu = await getTribu(this.compta.idt)
      this.tribu = await compile(this.rowTribu)
      session.setTribuId(this.tribu.id)
    }
    this.rowAvatar = await getAvatarPrimaire()
    this.avatar = await compile(this.rowAvatar)
    // ligne ci-dessous : ne devrait jamais être exécutée, superstition
    if (this.compta.rowCletK || this.compta.donX)
      await this.compta.compile2(this.avatar.priv)
    session.setAvatarId(session.compteId)
  }

  /** run **********************************************************/
  async run() {
    try {
      const session = stores.session
      const aSt = stores.avatar
      const gSt = stores.groupe

      this.auj = AMJ.amjUtc()
      this.buf = new IDBbuffer()
      this.dh = 0

      if (session.avion) {
        stores.ui.setPage('session')
        await this.phase0Avion()
      } else {
        await this.connex1()
        if (session.estAdmin) {
          session.setMode(2)
          session.setStatus(3)
          stores.ui.setPage('admin')
          return this.finOK()
        }
        if (session.estClos) {
          stores.ui.setPage('clos')
          return this.finOK()
        }
        stores.ui.setPage('session')
        if (!await this.connex2()) 
          throw new AppExc(F_BRO, this.compta.estA ? 11 : 12) // DLV dépassée

        await this.phase0Net() // maintenant que la cle K est connue
      }

      this.cAvatars = session.accesIdb ? await getColl('avatars') : []
      this.avatarsToStore = new Map() // objets avatar à ranger en store
      this.cGroupes = session.accesIdb ? await getColl('groupes') : []
      this.groupesToStore = new Map()
      if (session.accesIdb) 
        await loadVersions() // chargement des versions depuis IDB
      else 
        Versions.reset() // Versions déjà connues en IDB, vide

      /* Signe les avatars et groupes. Remplit: 
      - this.avatarsToStore, .avToSuppr, .avRowsModifies, .avRequis
      - this.groupesToStore, .grToSuppr, .grRowsModifies, .grRequis
      - this.versions :  map pour chaque avatar / groupe (SANS les zombis):
        { v }: pour un avatar
        { v, vols: {v1, v2, q1, q2} } : pour un groupe
      - this.mbsMap : map des membres des groupes auxquels participent au moins un des avatars
          - clé: id du groupe  
          - valeur: { idg, v, npgk, mbs: [ids], dlv }
            - mbs: array des im des avatars du compte participant.
      */
      await this.avGrSignatures()
      
      /* Mise à jour intermédiaire de IDB
      Sans impact sur la cohérence.
      Ne concerne que compta, tribu, les avatars et les comptes
      */ 
      if (session.accesIdb) {
        this.buf.putIDB(this.rowCompta)
        if (this.rowTribu) this.buf.putIDB(this.rowTribu)
        this.buf.putIDB(this.rowAvatar)
        this.avRowsModifies.forEach(row => { this.buf.putIDB(row) })
        this.avToSuppr.forEach(id => { this.buf.purgeAvatarIDB(id) })
        this.grRowsModifies.forEach(row => { this.buf.putIDB(row) })
        this.grToSuppr.forEach(id => { this.buf.purgeGroupeIDB(id) })
        await this.buf.commitIDB(true)
        this.buf = new IDBbuffer()
      }

      this.BRK()

      // Rangement en store
      const syncitem = stores.syncitem
      aSt.setCompte(this.avatar, this.compta, this.tribu)
      if (this.espace) session.setEspace(this.espace)

      for (const [,av] of this.avatarsToStore) {
        if (av.id !== this.avatar.id) aSt.setAvatar(av)
        syncitem.push('05' + av.id, 0, 'SYava', [av.na.nom])
      }

      for (const [,gr] of this.groupesToStore) {
        gSt.setGroupe(gr)
        syncitem.push('10' + gr.id, 0, 'SYgro', [gr.na.nom])
      }

      // Chargement en store des versions des groupes (this.versions n'a PAS les zombis)
      for (const idx in this.versions) {
        const id = parseInt(idx)
        const objv = this.versions[idx]
        if (ID.estGroupe(id)) gSt.setVols(id, {v: objv.v, vols: objv.vols})
      }

      // En cas de blocage grave, plus de synchronisation (APRES mise en store compta / tribu)
      if (session.synchro) {
        if (session.estFige) {
          session.setMode(2)
          await afficherDiag($t('CNXdeg1'))
        } else if (session.estMinimal) {
          session.setMode(2)
          await afficherDiag($t('CNXdeg2'))
        }
      }

      // Comptable seulement : chargement des tribus
      if (session.estComptable) {
        this.cTribus = session.accesIdb ? await getColl('tribus') : []
        const ltr = new Map()
        const mvtr = {}
        this.cTribus.forEach(r => {
          ltr.set(r.id, r)
          mvtr[r.id] = r.v
        })

        {
          const args = { token: session.authToken, mvtr: mvtr }
          const ret = this.tr(await post(this, 'ChargerTribus', args))
          const delids = new Set(ret.delids)
          if (ret.rowTribus.length) for (const row of ret.rowTribus) {
            const tribu = await compile(row)
            ltr.delete(tribu.id)
            aSt.setTribu(tribu)
            this.buf.putIDB(row)
          }
          delids.forEach(id => { this.buf.supprIDB({ _nom: 'tribus', id: id }) })
        }

        for (const [id, row] of ltr) {
          const tribu = await compile(row)
          aSt.setTribu(tribu)
          this.buf.putIDB(row)
        }

        const args = { token: session.authToken, ns: session.ns }
        const ret = this.tr(await post(this, 'GetSynthese', args))
        aSt.setSynthese(await compile(ret.rowSynthese))

      }

      /* Chargement depuis IDB des Maps des 
      notes, chats, tickets, sponsorings, membres trouvés en IDB */
      this.cNotes = session.accesIdb ? await getColl('notes') : []
      this.cChats = session.accesIdb ? await getColl('chats') : []
      this.cTickets = session.estComptable && session.accesIdb ? await getColl('tickets') : []
      this.cSponsorings = session.accesIdb ? await getColl('sponsorings') : []
      this.cMembres = session.accesIdb ? await getColl('membres') : []
      this.cChatgrs = session.accesIdb ? await getColl('chatgrs') : []

      // Itération sur chaque avatar: notes, chats, sponsorings, tickets
      for (const [, e] of aSt.map) {
        const avatar = e.avatar
        const vidb = Versions.get(avatar.id).v
        const objv = this.versions && this.versions[avatar.id] ? this.versions[avatar.id] : { v: 0 }
        const vsrv = objv.v
        if (vidb < vsrv) Versions.set(avatar.id, { v: objv.v })

        const na = getNg(avatar.id)
        let n1 = 0, n2 = 0, n3 = 0, n4 = 0, n5 = 0, n6 = 0, n7 = 0, n8 = 0
        const [x1, x2] = await this.chargerNotes(avatar.id, vidb, vsrv, false)
        n1 = x1
        n2 = x2
        syncitem.push('05' + na.id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6, n7, n8])
        const [x3, x4] = await this.chargerChats(avatar.id, vidb, vsrv)
        n3 = x3
        n4 = x4
        syncitem.push('05' + na.id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6, n7, n8])
        const [x5, x6] = await this.chargerSponsorings(avatar.id, vidb, vsrv)
        n5 = x5
        n6 = x6
        syncitem.push('05' + na.id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6, n7, n8])
        const [x7, x8] = session.estComptable ? await this.chargerTickets(avatar.id, vidb, vsrv) : [0, 0]
        n7 = x7
        n8 = x8
        syncitem.push('05' + na.id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6, n7, n8])
      }

      // Itération sur chaque groupe: notes, membres
      // TODO ??? : gérer les groupes inactifs (sans membres et sans notes, les purger de IDB)
      for (const [, eg] of gSt.map) {
        const groupe = eg.groupe
        const objidb = Versions.get(groupe.id)
        const vidb = objidb.v
        const objv = this.versions && this.versions[groupe.id] ? this.versions[groupe.id] :
          { v: 0, vols: { v1: 0, v2: 0, q1: 0, q2: 0 } }
        const vsrv = objv.v
        if (!vidb || vidb < vsrv) {
          const vx = { v: objv.v, vols: objv.vols }
          Versions.set(groupe.id, vx)
          gSt.setVols(groupe.id, vx)
        } else {
          gSt.setVols(groupe.id, objidb)
        }

        const emg = this.mbsMap[groupe.id] // { idg, v, npgk, mbs: [ids], dlv }
        let n1 = 0, n2 = 0, n3 = 0, n4 = 0
        const na = getNg(groupe.id)

        let amb = false // Un avatar membre au moins a-t-il accès aux membres ?
        for (const im of emg.mbs)
          if ((groupe.flags[im] & FLAGS.AM) && (groupe.flags[im] & FLAGS.DM)) amb = true
        if (amb) { // Oui on recharge les membres et Chatgrs
          const [x3, x4] = await this.chargerMembresChatgrs(groupe, vidb, vsrv)
          n3 = x3
          n4 = x4
        } else // Non, on purge la base locales des membres
          this.buf.purgeGroupeMbIDB(groupe.id)
        syncitem.push('10' + na.id, 1, 'SYgro2', [na.nom, n1, n2, n3, n4])

        // Ci-avant on a pu détecter des membres disparus qui ne l'était pas encore dans groupe
        let ano = false // Un avatar au moins a-t-il accès aux notes ?
        for (const im of emg.mbs)
          if ((groupe.flags[im] & FLAGS.AN) && (groupe.flags[im] & FLAGS.DN)) ano = true
        if (ano) { // Oui on charge les notes
          const [x1, x2] = await this.chargerNotes(groupe.id, vidb, vsrv, true)
          n1 = x1
          n2 = x2
        } else // Non on purge les notes
          this.buf.purgeGroupeNoIDB(groupe.id)
        syncitem.push('10' + na.id, 1, 'SYgro2', [na.nom, n1, n2, n3, n4])
      }

      // Finalisation en une seule fois de l'écriture du nouvel état en IDB
      // MAJ compte {id, k} et versions
      if (session.synchro) await this.buf.commitIDB(true, true) 
      

      if (session.accesIdb) {
        await gestionFichierCnx(this.buf.mapSec)
        // Gestion du presse-papier, notes et fichiers locaux
        await NLfromIDB()
        await FLfromIDB()
      }

      if (session.estComptable)
        await new TraitGcvols().run()

      if (aSt.compta.estA)
        await new RafraichirTickets().run()

      // enregistre l'heure du début effectif de la session
      if (session.synchro) await session.sessionSync.setConnexion(this.dh)
      console.log('Connexion compte : ' + this.compta.id)
      session.setStatus(2)
      await sleep(500)
      if (session.alire) {
        stores.ui.setPage('compta', 'notif')
      } else {
        stores.ui.setPage('accueil')
      }
      if (session.nbj < stores.config.alertedlv)  // stores.config.alertedlv
        setTimeout(() => {
          stores.ui.oD('estzombi')
        }, 50)
      setTimeout(() => {
        SyncQueue.traiterQueue()
        Demon.start()
      }, 50)
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
      const aSt = stores.avatar

      await initSession(ps)
      session.setNs(ID.ns(sp.id))
      session.setOrg(sp.org)
      this.auj = AMJ.amjUtc()
      this.buf = new IDBbuffer()
      this.dh = 0

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
      setTimeout(() => {
        SyncQueue.traiterQueue()
        Demon.start()
      }, 50)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_RefusSponsoring: 'Rejet d\'une proposition de sponsoring'**
args.id ids : identifiant du sponsoring
args.arx : réponse du filleul
*/
export class RefusSponsoring extends OperationUI {
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
export class ProlongerSponsoring extends OperationUI {
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

/* OP_CreerEspace: 'Création d\'un nouvel espace et de son comptable'
args.token donne les éléments d'authentification du compte.
args.rowEspace : espace créé
args.rowAvatar, rowTribu, rowCompta du compte du comptable
args.rowVersion: version de l'avatar (avec sa dlv) 
args.rowTribu
Retour: rien. Si OK le rowEspace est celui créé en session
*/
export class CreerEspace extends OperationUI {
  constructor() { super('CreerEspace') }

  async run(org, phrase, ns) {
    try {
      const hps1 = (ns * d14) + phrase.hps1
      const session = stores.session
      const config = stores.config
      const aco = config.allocComptable
      const apr = config.allocPrimitive

      const rowEspace = await Espace.nouveau(org)
      const rowSynthese = await Synthese.nouveau(aco, apr)

      const clet = Tribu.genCle(1)
      const idt = Tribu.id(clet)
      setClet(clet, idt)

      const na = NomGenerique.comptable()
      // static async row (na, clet, cletX, q, estSponsor, phrase, nc)
      const { dlv, rowCompta } = await Compta.row(na, clet, null, aco, true, ns, phrase)
      // session.clek est fixée
      const rowTribu = await Tribu.nouvelle(idt, apr, true, aco)

      const { publicKey, privateKey } = await genKeyPair()
      const rowAvatar = await Avatar.primaireRow(na, publicKey, privateKey)

      const r = { id: na.id, v: 1, dlv: dlv }
      const _data_ = new Uint8Array(encode(r))
      r._data_ = _data_
      r._nom = 'versions'

      const args = {
        token: stores.session.authToken, rowEspace, rowSynthese, rowTribu,
        rowCompta, rowAvatar, rowVersion: r, hps1
      }
      this.tr(await post(this, 'CreerEspace', args))

      const espace = await compile(rowEspace)
      session.setEspace(espace) // Maj de la map espaces

      this.finOK()
    } catch (e) {
      stores.ui.setPage('login')
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
export class EchoTexte extends OperationUI {
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
export class ErreurFonc extends OperationUI {
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
export class PingDB extends OperationUI {
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

/* OP_TraitGcvols: 'Récupération des quotas libérés par les comptes disparus' *******
*/
export class TraitGcvols extends OperationUI {
  constructor () { super('TraitGcvols') }

  async run (ns) { 
    try {
      const session = stores.session
      const args = { token: session.authToken }
      const ret = this.tr(await post(this, 'ListeGcvols', args))
      const m = {}, lidc = []
      if (ret.gcvols.length) {
        for (const x of ret.gcvols) {
          const y = await compile(x)
          let e = m[y.idt]; if (!e) { e = []; m[y.idt] = e }
          e.push(y.it)
          lidc.push(y.id)
        }
        const args = { token: session.authToken, m, lidc }
        this.tr(await post(this, 'SupprComptesTribu', args))
      }
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetEspace : 'Obtention de l\'espace du compte'
POST:
- `token` : éléments d'authentification du compte.
- `ns` : id de l'espace.
Retour:
- `rowEspace`
*/
export class GetEspace extends OperationUI {
  constructor() { super('GetEspace') }

  async run() {
    try {
      const session = stores.session
      const args = { token: session.authToken, ns: session.ns }
      const ret = this.tr(await post(this, 'GetEspace', args))
      return this.finOK(ret.rowEspace)
    } catch (e) {
      await this.finKO(e)
    }
  }
}
