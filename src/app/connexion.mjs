import stores from '../stores/stores.mjs'

import { OperationUI } from './operations.mjs'
import { SyncQueue } from './sync.mjs'
import { $t, tru8, u8ToHex, getTrigramme, setTrigramme, afficherDiag, getBlocage, hash } from './util.mjs'
import { post } from './net.mjs'
import { DateJour } from './api.mjs'
import { NomAvatar } from './modele.mjs'
import { resetRepertoire, deconnexion, compile, delCv, setNg, Compte, Compta, Prefs, Avatar, NomTribu } from './modele.mjs'
import { openIDB, closeIDB, deleteIDB, getCompte, getColl, getCvs, commitRows,
  getVIdCvs, lectureSessionSyncIdb, saveListeCvIds, gestionFichierCnx, TLfromIDB, FLfromIDB, putCv, getAvatarPrimaire, putCompte } from './db.mjs'
import { genKeyPair, crypter } from './webcrypto.mjs'
import { FsSyncSession } from './fssync.mjs'
import { openWS } from './ws.mjs'

export async function reconnexionCompte () {
  const session = stores.session
  const phrase = session.phrase
  deconnexion(true)
  connecterCompte (phrase) 
}

async function initSession (phrase) {
  const session = stores.session
  session.init(phrase)
  if (session.accesNet) {
    if (!stores.config.fsSync) {
      await openWS()
      session.fsSync = null
    } else {
      session.fsSync = new FsSyncSession()
    }
  }
  resetRepertoire()
  stores.reset()
}

export async function connecterCompte (phrase, razdb) {
  if (!phrase) return
  const session = stores.session
  await initSession(phrase)
  if (session.synchro && session.nombase && razdb) {
    localStorage.removeItem(session.lsk)
    await deleteIDB()
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
    session.compteId = x.id
    session.clek = x.k
  }

  await new ConnexionCompte().run()
}

/** OpBufC : utilisé seulment en connexion ************/
class OpBufC {
  constructor () {
    this.lmaj = [] // objets à modifier / insérer en IDB
    this.lsuppr = [] // objets (du moins {table id (id2))} à supprimer de IDB

    this.lav = new Set() // set des ids des avatars à purger
    this.lcc = new Set() // set des ids des couples à purger
    this.lcc2 = new Set() // set des Ids des couples n'accédant plus aux secrets à purger
    this.lgr = new Set() // set des ids des groupes à purger
    this.mapSec = {} // pour traitement final des fichiers locaux
    this.lsecsup = [] // liste des secrets temporaires à faire supprimer sur le serveur en fin de connexion
  }

  putIDB (row) { this.lmaj.push(row); return row }
  supprIDB (row) { this.lsuppr.push(row); return row } // obj : { _nom, id, ids }
  async commitIDB () { await commitRows(this) }

  async gestionFichierCnx () {
    await gestionFichierCnx(this.mapSec)
  }
}

/**********************************************************************************
Opération de connexion à un compte par sa phrase secrète (synchronisé, incognito, avion)
**********************************************************************************/

export class ConnexionCompte extends OperationUI {
  constructor () { super($t('OPcnx')) }

  /** tousAvatars *******************************************************/
  async tousAvatars (avatar, rowAvatar) {
    const session = stores.session
    const avReq = new Map() // versions des avatars requis à demander au serveur
    const avRows = {} // rows de ceux-ci déjà détenus
    const idbVersions = {} // pour chaque avatar requis, la version détenue en IDB
    
    this.avatarsToStore.set(avatar.id, avatar)

    avatar.avatarIds().forEach(id => {
      idbVersions[id] = 0
      if (id === avatar.id) { 
        avReq.set(id, avatar.v)
        avRows[id] = rowAvatar
      } else avReq.set(id, 0)
    })

    if (session.accesIdb) {
      getColl('avatars').forEach(row => {
        if (!avReq.has(row.id)) {
          this.buf.supprIDB({ _nom: 'avatars', id })
        } else {
          idbVersions[id] = row.id
          const v = avReq.get(row.id)
          if (row.v > v) { avReq.set(row.id, row.v); avRows[row.id] = row }
        }
      })
    }

    let rowAvatars = {}
    if (session.accesNet) {
      const args = { token: session.authToken, mapv: avReq }
      const ret = this.tr(await post(this, 'GetAvatars', args))
      rowAvatars = ret.rowAvatars
    }

    for (const id of this.avatarsToStore.keys()) {
      const rowAvatar = rowAvatars[id]
      if (rowAvatar) { // On a trouvé plus récent que celui détenu en IDB ou acquis à la connexion
        if (id === avatar.id) return false // l'avatar principal a changé depuis connexion
        this.avatarsToStore.set(id, await compile(this.buf.putIDB(rowAvatar))) // mettre à jour IDB
      } else {
        // ne PAS mettre à jour IDB qui a déjà le dernier
        this.avatarsToStore.set(id, await compile(avRows[id]))
      }
    }
  }

  /** tousGroupes *******************************************************/
  async tousGroupes (avatarsToStore) {
    const session = stores.session

    const jourJ = stores.config.limitesjour.dlv + new DateJour().nbj
    const dlv1 = (Math.floor(jourJ / 10) + 1) * 10
    const dlv2 = dlv1 + 10

    /* map des membres des groupes des avatars
     - clé: id du groupe  - valeur: { idg, mbs: [ids], v , dlv } */
    const mbsMap = { } 

    /* map des avatars du compte - clé: id de l'avatar  - valeur: dlv } */
    const avsMap = {}  
      
    avatarsToStore.values().forEach(avatar => {
      avsMap[avatar.id] = avatar.id % 10 === 0 ? dlv1 : dlv2
      avatar.membres(mbsMap) // v, dlv, de mbsMap ne sont pas renseignées pour l'instant
    })
  
    // Récupération des ids des groupes pour abonnement
    const abPlus = [] // ids des groupes auxquels s'abonner
    for (const id of mbsMap) {
      const idg = parseInt(idg)
      if (session.fsSync) {
        await session.fsSync(idg)
      } else {
        abPlus.push(parseInt(idg))
      }
    }

    const grRows = {}
    if (session.accesIdb) {
      getColl('groupes').forEach(row => {
        const e = mbsMap[row.id]
        if (!e) {
          this.buf.supprIDB( { _nom: 'groupes', id: row.id})
        } else {
          grRows[row.id] = row
          e.v = row.v // v et dlv de mbsMap sont renseignées
          e.dlv = dlv2
          abPlus.push(row.id)    
        }
      })
    }

    if (session.fsSync) session.fsSync.abo(abPlus)

    let rowGroupes = {}

    if (session.accesNet) {
      // mbsMap, avsLst, abPlus sont les arguments de l'opération SignaturesEtGroupes
      const args = { token: session.authToken, mbsMap, avsMap, abPlus }
      const ret = this.tr(await post(this, 'SignaturesEtGroupes', args))
      rowGroupes = ret.rowGroupes
    }

    /* Tous les avatars, groupes et membres sont signés avec les dlv demandées
    rowGroupes : array des rows des groupes de mbsMap ayant une version postérieure à celle détenue */
    rowGroupes.forEach(row => {
      this.buf.putIDB(row)
      mbsMap[row.id].row = row
    })

    for(const id of mbsMap) {
      const e = mbsMap[id]
      const r = e.row ? e.row : grRows[id]
      this.groupesToStore.set(id, await compile(r))
    }
  }

  /** Chargement pour un avatar de ses secrets postérieurs au plus récent ************/
  async chargerSecrets (id, estGr) {
    const session = stores.session
    let v = 0
    let n1 = 0, n2 = 0
    let rows = {}
    this.cSecrets.forEach(row => { 
      if (row.id === id) {
        if (row.v > v) v = row.v
        rows[row.ids] = row
        n1++
      } 
    })

    let rowSecrets

    if (session.accesNet) {
      const args = { token: session.authToken, id, v }
      const ret = this.tr(await post(this, 'ChargerSecrets', args))
      rowSecrets = ret.rowSecrets
    }
    if (rowSecrets && rowSecrets.length) {
      for (const row of rowSecrets) {
        this.buf.putIDB(row)
        rows[row.ids] = row
        n2++
      }
    }
    const avgrStore = estGr ? stores.groupes : stores.avatars
    const auj = new DateJour().nbj
    for (const ids of rows) {
      const secret = await compile(rows[ids])
      if (session.accesNet && secret.st < auj) { // secret temporaire à supprimer
        this.buf.lsecsup.push(secret)
      } else {
        avgrStore.setSecret(secret)
        if (session.accesIdb) this.buf.mapSec[secret.pk] = secret // Pour gestion des fichiers
      }
    }
    return [n1, n2]
  }

  /** Chargement pour un avatar de ses chats postérieurs au plus récent ************/
  async chargerChats (id) {
    const session = stores.session
    let v = 0
    let n1 = 0, n2 = 0
    let rows = {}
    this.cChats.forEach(row => { 
      if (row.id === id) {
        if (row.v > v) v = row.v
        rows[row.ids] = row
        n1++
      }
    })

    let rowChats

    if (session.accesNet) {
      const args = { token: session.authToken, id, v }
      const ret = this.tr(await post(this, 'ChargerChats', args))
      rowChats = ret.rowChats
    }

    if (rowChats  && rowChats.length) {
      for (const row of rowChats) {
        this.buf.putIDB(row)
        rows[row.ids] = row
        n2++
      }
    }
    const avStore = stores.avatars
    for (const ids of rows) {
      const chat = await compile(rows[ids])
      avStore.setChat(chat)
    }
    return [n1, n2]
  }
  
  /** Chargement pour un avatar de ses sponsorings postérieurs au plus récent ************/
  async chargerSponsorings (id) {
    const session = stores.session
    let v = 0
    let n1 = 0, n2 = 0
    let rows = {}
    this.cSponsorings.forEach(row => { 
      if (row.id === id) {
        if (row.v > v) v = row.v
        rows[row.ids] = row
        n1++
      }
    })

    let rowSponsorings

    if (session.accesNet) {
      const args = { token: session.authToken, id, v }
      const ret = this.tr(await post(this, 'ChargerSponsorings', args))
      rowSponsorings = ret.rowSponsorings
    }
    if (rowSponsorings  && rowSponsorings.length) {
      for (const row of rowSponsorings) {
        this.buf.putIDB(row)
        rows[row.ids] = row
        n2++
      }
    }
    const avStore = stores.avatars
    for (const ids of rows) {
      const sponsoring = await compile(rows[ids])
      avStore.setSponsoring(sponsoring)
    }
    return [n1, n2]
  }

  /** Chargement pour un groupe de ses membres postérieurs au plus récent ************/
  async chargerMembres (id) {
    const session = stores.session
    let v = 0
    let n1 = 0, n2 = 0
    let rows = {}
    this.cMembres.forEach(row => { 
      if (row.id === id) {
        if (row.v > v) v = row.v
        rows[row.ids] = row
        n1++
      }
    })

    let rowMembres

    if (session.accesNet) {
      const args = { token: session.authToken, id, v }
      const ret = this.tr(await post(this, 'ChargerMembres', args))
      rowMembres = ret.rowMembres
    }
    if (rowMembres  && rowMembres.length) {
      for (const row of rowMembres) {
        this.buf.putIDB(row)
        rows[row.ids] = row
        n2++
      }
    }
    const grStore = stores.groupes
    for (const ids of rows) {
      const membre = await compile(rows[ids])
      grStore.setMembre(membre)
    }
    return [n1, n2]
  }
  
  async majCvChat() {
    const session = stores.session
    const idb = session.accesIdb
    let n2 = 0
    const peStore = stores.people
    // Remise à niveau des Cartes de visite des people "chat seulement"
    // set des ids des people n'ayant ni entrée groupe ni sponsor tribu.
    const idChats = peStore.getPeopleChat // set des people n'étant "que" chat
    const n1 = idChats.size
    const mcv = {}
    idChats.forEach(id => { mcv[id] = 0 })
    const mcvIdb = idb ? await getCvs() : {}
    for(const id of mcvIdb) {
      const cvIdb = mcvIdb[id]
      if (idChats.has(cvIdb.id)) { // CV utile, rechercher une version plus récente
        const cv = { v: cvIdb.v, photo: cvIdb.photo, info:cvIdb.info }
        peStore.setCv(cvIdb.id, cv)
        mcv[id] = cvIdb.id
      } else { // CV inutile, purge de IDB
        await delCv(id)
      }
    }

    let rowCvs

    if (session.accesNet) {
      const args = { token: session.authToken, mcv }
      const ret = this.tr(await post(this, 'ChargeCvs', args))
      rowCvs = ret.rowCvs
    }
    if (rowCvs && rowCvs.length) {
      for (const row of ret.rowCvs) {
        n2++
        const cv = await compile(row).cv
        peStore.setCv(id, cv)
        cv.id = row.id
        await putCv(cv)
      }
    }
    return [n1, n2]
  }

  async phase0Net () {
    const session = stores.session
    /* Authentification et get de avatar / compta / tribu
    ET abonnement à compta sur le serveur
    */
    const args = { token: session.authToken }

    { // Coonexion : récupération de l'id du compte, clepubc, fscredentials
      const ret = this.tr(await post(this, 'ConnexionCompte', args))
      session.clepubc = ret.clepubc
      session.compteId = ret.compteId
      session.tribuId = ret.tribuId
      session.estComptable = session.compteId === IDCOMPTABLE
      if (ret.credentials) session.fscredentials = ret.credentials
      if (session.fsSync) {
        await session.fsSync.setCompte()
        await session.fsSync.setTribu()
      }
    }

    const ret = this.tr(await post(this, 'GetComptaTribuAvatar', args))
    const rowAvatar = ret.rowAvatar
    this.avatar = await compile(this.buf.putIDB(rowAvatar))
    // session.clek, session.compteId OK. Répertoire des avatars OK
    this.compta = await compile(this.buf.putIDB(ret.rowCompta))
    this.tribu = await compile(this.buf.putIDB(ret.rowTribu))

    if (!session.nombase) await session.setNombase() // maintenant que la cle K est connue

    if (session.synchro) {
      let dbok = false
      try {
        await openIDB()
        const x = await getCompte()
        if (x) dbok = true
        /* Login OK avec le serveur, MAIS phrase secrète changée depuis la session précédente */
      } catch (e) { }
      if (!dbok) {
        closeIDB()
        await deleteIDB()
        await openIDB()
        setTrigramme(session.nombase, await getTrigramme())
      }
    }
  }

  async phase0Avion () {
    // session.compteId et session.clek OK
    const rowAvatar = await getAvatarPrimaire()
    this.avatar = await compile(rowAvatar) 
    const rowCompta = await getCompta()
    this.compta = await compile(rowCompta) 
    const rowTribu = await getTribu(this.compta.idt)
    this.tribu = await compile(rowTribu)
  }

  /** run **********************************************************/
  async run () {
    try {
      // session synchronisée ou incognito
      const session = stores.session
      this.buf = new OpBufC()
      this.dh = 0

      if (session.avion) {
        await this.phase0Avion()
      } else {
        await this.phase0Net()
      }

      // session.blocage
      if (session.estComptable || session.avion) {
        session.blocage = 0
      } else {
        session.blocage = this.tribu.stn < this.compta.stn ? this.compta.stn : this.tribu.stn
      }
      // Une session synchronisée d'un compte "bloqué" est en "incognito" (plus de maj locale)
      if (session.synchro && session.blocage === 4) session.mode = 2

      this.avatarsToStore = new Map() // objets avatar à ranger en store
      this.groupesToStore = new Map() // complilation des rows des groupes venant de IDB ou du serveur

      await this.tousAvatars(avatar, rowAvatars)
      await this.tousGroupes(this.avatarsToStore)

      /*
      MAJ (éventuelle) de nctk par cryptage en clé K au lieu du RSA trouvé
      NE PAS EFFECTUER AVANT dans la boucle: ça change la version du compte et sortirait
      en erreur de la boucle précédente (où avatar ne doit pas changer)
      */
      if (session.accesNet && this.avatar.nctkCleK) {
        const args = { token: session.authToken, id: this.avatar.id, nctk: this.avatar.nctkCleK }
        this.tr(await post(this, 'm1', 'nctkCompte', args))
      }
  
      this.BRK()
      /* YES ! on a tous les objets maîtres : tribu / compta / avatars / groupes abonnés PAS signés */

      // MAJ intermédiaire de IDB : évite d'avoir des avatars / groupes obsolètes pour la suite
      if (session.accesIdb) {
        await this.buf.commitIDB()
        this.buf = new OpBufC()
      }
    
      // Rangement en store
      const avStore = stores.avatar
      avStore.setCompte(this.avatar, this.compta, this.tribu)
      const grStore = stores.groupe
      const syncitem = stores.syncitem 
      this.avatarsToStore.forEach(av => { 
        avStore.setAvatar(obj)
        syncitem.push('05' + av.id, 0, 'SYava', [av.na.nom])
      })
      this.groupesToStore.forEach(gr => { 
        grStore.setGroupe(gr) 
        syncitem.push('10' + gr.id, 0, 'SYgro', [gr.na.nom])
      })
      // inscription des sponsors de la tribu (pas avatar du compte) en tant que people
      const peStore = stores.people
      const t = this.tribu.mncpt
      for (const idsp in t) {
        if (!this.avatar.estAc(idsp)) {
          const e = t[idsp]
          peStore.setPeopleSponsor(e.na, e.cv)
        }
      }

      // Chargement depuis IDB des Maps
      this.cSecrets = session.accesIdb ? (await getColl('secrets')).values() : []
      this.cChats = session.accesIdb ? (await getColl('chats')).values() : []
      this.cSponsorings = session.accesIdb ? (await getColl('sponsorings')).values() : []
      this.cMembres = session.accesIdb ? (await getColl('membres')).values() : []

      // Itération sur chaque avatar: secrets, chats, sponsorings
      for (const id of avStore.ids) {
        const na = getNg(id)
        let n1 = 0, n2 = 0, n3 = 0, n4 = 0, n5 = 0, n6 = 0
        const [x1, x2] = await chargerSecrets(id)
        n1 = x1
        n2 = x2
        syncitem.push('05' + id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6])
        const [x3, x4] = await chargerChats(id)
        n3 = x3
        n4 = x4
        syncitem.push('05' + id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6])
        const [x5, x6] = await chargerSponsorings(id)
        n5 = x5
        n6 = x6
        syncitem.push('05' + id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6])
      }

      // Itération sur chaque groupe: secrets, membres
      for (const id of grStore.ids) {
        const na = getNg(id)
        let n1 = 0, n2 = 0, n3 = 0, n4 = 0
        const [x1, x2] = await chargerSecrets(id, true)
        n1 = x1
        n2 = x2
        syncitem.push('10' + id, 1, 'SYgro2', [na.nom, n1, n2, n3, n4])
        const [x3, x4] = await chargerMembres(id)
        n3 = x3
        n4 = x4
        syncitem.push('10' + id, 1, 'SYgro2', [na.nom, n1, n2, n3, n4])
      }

      // Remise à niveau des Cartes de visite des people "chat seulement"
      {
        const [n1, n2] = await this.majCvChat()
        syncitem.push('15' + id, 1, 'SYcvs', [n1, n2])
      }

      /* Suppression des secrets temporaires ayant dépassé leur date limite */
      if (session.accesNet && this.buf.lsecsup.length) {
        for (const s of this.buf.lsecsup) {
          try {
            const args = { token: session.authToken, id: s.id, ids: s.ids, idc: s.idCompta, idg: s.idGroupe }
            const ret = this.tr(await post(this, 'SupprSecret', args))
          } catch (e) {
            console.log(e.message)
          }
        }
      }
      
      // Finalisation en une seule fois, commit en IDB
      if (session.synchro) {
        await putCompte()
        await this.buf.commitIDB()
      }

      if (session.accesIdb) { 
        await gestionFichierCnx(this.buf.mapSec)
        // Gestion des fichiers locaux et textes locaux
        await TLfromIDB()
        await FLfromIDB()
      }

      // enregistre l'heure du début effectif de la session
      await session.sessionSync.setConnexion(this.dh)
      console.log('Connexion compte : ' + this.compte.id)
      session.statut = 2
      SyncQueue.traiterQueue()
      this.finOK()
      stores.ui.goto11()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/******************************************************************
Acceptation d'un parrainage
X_SRV, '03-Phrase secrète probablement déjà utilisée. Vérifier que le compte n\'existe pas déjà en essayant de s\'y connecter avec la phrase secrète'
X_SRV, '04-Une phrase secrète semblable est déjà utilisée. Changer a minima la première ligne de la phrase secrète pour ce nouveau compte'
X_SRV, '18-Réserves de volume insuffisantes du parrain pour les forfaits attribués compte'
A_SRV, '17-Avatar parrain : données de comptabilité absentes'
A_SRV, '24-Couple non trouvé'
*/

export class AcceptationParrainage extends OperationUI {
  constructor () { super($t('OPapa')) }

  /* arg :
  - ps : phrase secrète
  - ard : réponse du filleul
  - max : [v1, v2] volumes max pour les secrets du couple
  - estpar : si le compte à créer est parrain aussi
  - phch : hash phrase de contact
  - clepubc
  - npi

  datactc :
  - `cc` : clé du couple (donne son id).
  - `naf` : [nom, rnd] nom complet de A1 pour première vérification immédiate en session que la phrase est a priori bien destinée à cet avatar. Le nom de A1 figure dans le nom du couple après celui de A0.
  - Pour un parrainage seulement
    - `nct` : `[nom, rnd]` nom complet de la tribu.
    - `parrain` : true si parrain
    - `forfaits` : `[f1, f2]` forfaits attribués par le parrain.
  - Pour une rencontre seulement
    - `idt` : id de la tribu de A0 SEULEMENT SI A0 en est parrain.
  */
  async run (couple, datactc, arg) {
    try {
      // LE COMPTE EST CELUI DU FILLEUL
      this.session = stores.session
      await initSession(args.ps)

      const [nom, rnd] = datactc.nct
      const nat = new NomTribu(nom, rnd)

      this.BRK()
      const kpav = await genKeyPair()
      const compte = new Compte().nouveau(couple.naI, kpav.privateKey)
      if (arg.estpar) compte.stp = 1
      // nouveau() génère et enregistre la clé K dans la session
      await compte.setTribu(nat)
      const rowCompte = await compte.toRow()
      this.session.setCompte(compte) // prématuré mais nécessaire pour compta.toRow() ci-dessous
      this.session.nombase = await compte.getNombase()
      const prefs = new Prefs().nouveau(compte.id)
      const rowPrefs = await prefs.toRow()

      const ni = hash(u8ToHex(couple.cc) + '1')
      const avatar = new Avatar().nouveau(compte.id, ni, couple.naTemp)
      const rowAvatar = await avatar.toRow()

      const compta = new Compta()
      compta.nouveau(compte.id, nat.id)
      compta.compteurs.setF1(datactc.forfaits[0])
      compta.compteurs.setF2(datactc.forfaits[1])
      const rowCompta = await compta.toRow()

      /* si le compte est parrain, il va être enregistré
      dans sa tribu dans la liste des parrains */
      const chkt = arg.estpar ? hash(compte.sid + '@' + nat.sid) : 0
      const ncpart = arg.estpar ? await crypter(rnd, encode([compte.naprim.nom, compte.naprim.rnd])) : 0

      const args = {
        sessionId: this.session.sessionId,
        clePubAv: kpav.publicKey, // clé publique de l'avatar créé
        rowCompte, // compte créé
        rowCompta, // compta du compte créé
        rowAvatar, // premier avatar du compte créé
        rowPrefs, // préférences du compte créé
        idCouple: couple.id, // id du couple
        phch: arg.phch, // hash de la phrase de contact
        idavp: couple.idE, // id de l'avatar parrain
        idt: nat.id, // id de la tribu de A1
        f1: datactc.forfaits[0],
        f2: datactc.forfaits[1],
        chkt, // clé d'accès à mncpt dans la table des parrains de la tribu, si le compte est parrain
        ncpart, // nom complet du compte s'il est parrain, crypté par la clé de la tribu
        ardc: await couple.toArdc(arg.ard, couple.cc),
        estPar: arg.estpar,
        sec: arg.max[0] !== 0, // le filleul accède aux secrets du couple
        npi: arg.npi
      }
      const ret = this.tr(await post(this, 'm1', 'acceptParrainage', args))

      // Le compte vient d'être créé et clek enregistrée
      await this.postCreation(ret) // fin commune avec la création de compte comptable
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Refus de parrainage *************************************************
Refus d'une rencontre / parrainage
args :
  - sessionid
  - idc: id du couple
  - phch: id de phrase de contact
  - ardc : du contact
*/
export class RefusParrainage extends OperationUI {
  constructor () { super($t('OPdpa')) }

  /* arg :
  - ard : réponse du filleul
  - phch : hash phrase de parrainage
  */
  async run (couple, phch, ard) {
    try {
      this.session = stores.session
      await initSession() // SANS phrase
      if (stores.config.fsSync) await openWS()
      resetRepertoire()
      stores.reset()

      const args = {
        sessionId: this.session.sessionId,
        idc: couple.id,
        phch: phch,
        ardc: await couple.toArdc(ard, couple.cc)
      }
      await post(this, 'm1', 'refusRencontre', args)
      deconnexion(true)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Création du compte Comptable******************************************
On poste :
- les rows Compte, Compta, Prefs, v et dds à 0
- les clés publiques du compte et de l'avatar pour la table avrsa
- le row Avatar, v à 0
Retour:
- dh, sessionId
- rowItems retournés : compte compta prefs avatar
X_SRV, '02-Cette phrase secrète n\'est pas reconnue comme étant l\'une des comptables de l\'organisation')
X_SRV, '03-Phrase secrète probablement déjà utilisée. Vérifier que le compte n\'existe pas déjà en essayant de s\'y connecter avec la phrase secrète'
X_SRV, '04-Une phrase secrète semblable est déjà utilisée. Changer a minima la première ligne de la phrase secrète pour ce nouveau compte'
*/
export class CreationCompteComptable extends OperationUI {
  constructor () { super($t('OPccc')) }

  async run (phrase) {
    try {
      const session = stores.session
      session.mode = 2
      await initSession(phrase)

      const kpav = await genKeyPair()
      tru8('Priv Comptable', kpav.privateKey)
      tru8('Pub Comptable', kpav.publicKey)

      const nomAvatar = new NomAvatar('Comptable') // nouveau

      const compte = new Compte().nouveau(nomAvatar, kpav.privateKey)
      // nouveau() enregistre la clé K dans session.clek
      const rowCompte = await compte.toRow()

      const prefs = new Prefs().nouveau(compte.id)
      const rowPrefs = await prefs.toRow()

      const compta = new Compta().nouveau(compte.id, 1) // 1: avatar primaire
      compta.compteurs.setF1(255)
      compta.compteurs.setF2(255)
      const rowCompta = await compta.toRow()

      const avatar = new Avatar().nouveau(compte.id)
      const rowAvatar = await avatar.toRow()

      const args = { sessionId: session.sessionId, clePubAv: kpav.publicKey, rowCompte, rowCompta, rowAvatar, rowPrefs }
      const ret = this.tr(await post(this, 'm1', 'creationCompteComptable', args))

      // Le compte vient d'être créé, clek est enregistrée
      await this.postCreation(ret)
    } catch (e) {
      this.finKO(e)
    }
  }
}
