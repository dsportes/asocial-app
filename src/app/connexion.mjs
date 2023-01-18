import stores from '../stores/stores.mjs'

import { OperationUI } from './operations.mjs'
import { SyncQueue } from './sync.mjs'
import { $t, tru8, u8ToHex, getTrigramme, setTrigramme, afficherDiag, hash } from './util.mjs'
import { post } from './net.mjs'
import { DateJour } from './api.mjs'
import { NomAvatar } from './modele.mjs'
import { resetRepertoire, compile, Compta, Avatar, NomTribu } from './modele.mjs'
import { openIDB, closeIDB, deleteIDB, getCompte, getAvatarPrimaire, getColl, getCvs, putCv,
  IDBbuffer, gestionFichierCnx, TLfromIDB, FLfromIDB  } from './db.mjs'
import { genKeyPair, crypter } from './webcrypto.mjs'
import { FsSyncSession } from './fssync.mjs'
import { openWS } from './ws.mjs'

/* garderMode : si true, garder le mode */
export function deconnexion (garderMode) {
  const session = stores.session
  const mode = session.mode
  if (session.accesIdb) closeIDB()
  if (session.accesNet) closeWS()
  stores.reset()
  session.$reset()
  if (garderMode) session.mode = mode
  SyncQueue.reset()
  if (session.fsSync) session.fsSync.close()
}

export async function reconnexionCompte () {
  const session = stores.session
  const phrase = session.phrase
  deconnexion(true)
  await connecterCompte (phrase) 
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

/**********************************************************************************
Opération de connexion à un compte par sa phrase secrète (synchronisé, incognito, avion)
**********************************************************************************/

export class ConnexionCompte extends OperationUI {
  constructor () { super($t('OPcnx')) }

  /** tousAvatars *******************************************************/
  async tousAvatars () {
    const session = stores.session
    const avRowsModifies = []
    const avToSuppr = new Set()
    const avRequis = new Set()

    while (true) { // boucle si la version de compta a changé
      avRowsModifies.length = 0
      avToSuppr.clear()
      avRequis.clear()
      this.avatarsToStore.clear()

      const mapv = {} // versions des avatars requis à demander au serveur

      this.avatar.avatarIds(this.avRequis)
      avRequis.forEach(id => {
        if (id === this.avatar.id) {
          mapv[id] = this.avatar.v
          this.avatarsToStore.set(id, this.avatar)
        } else mapv[id] = 0 
      })

      for (const row of this.cAvatars) {
        if (row.id !== this.avatar.id) {
          if (this.avRequis.has(row.id)) {
            const av = await compile(row)
            this.avatarsToStore.set(row.id, av)
            mapv[row.id] = row.v
          } else {
            // avatars trouvés en IDB mais plus référencés dans l'avatar principal
            avToSuppr.add(row.id)
          }
        }
      }

      if (session.accesNet) {
        const args = { token: session.authToken, vcompta: this.compta.v, mapv }
        const ret = this.tr(await post(this, 'GetAvatars', args))
        if (!ret.OK) { 
          // compta a changé : on recharge compta, tribu, avatar et on boucle
          await this.getCTA()
          continue
        }
        if (ret.rowAvatars && ret.rowAvatars.length) {
          for (const row of ret.rowAvatars) {
            const av = await compile(row)
            this.avatarsToStore.set(row.id, av)
          }
        }
      }
      break
    }

    return [avRowsModifies, avToSuppr]
  }

  /** tousGroupes *******************************************************/
  async tousGroupes () {
    const session = stores.session

    const jourJ = stores.config.limitesjour.dlv + this.auj
    const dlv1 = (Math.floor(jourJ / 10) + 1) * 10
    const dlv2 = dlv1 + 10

    const grRequis = new Set()

    /* map des membres des groupes auxquels participent au moins un des avatars
     - clé: id du groupe  - valeur: { idg, mbs: [ids], v , dlv } */
    const mbsMap = {} 

    /* map des avatars du compte - clé: id de l'avatar  - valeur: dlv } */
    const avsMap = {}  
      
    this.avatarsToStore.values().forEach(avatar => {
      avatar.idGroupes(grRequis)
      avsMap[avatar.id] = avatar.id % 10 === 0 ? dlv1 : dlv2
      avatar.membres(mbsMap) // v, dlv, de mbsMap ne sont pas renseignées pour l'instant
    })
  
    // Récupération des ids des groupes pour abonnement
    const abPlus = [] // ids des groupes auxquels s'abonner
    for (const id of grRequis) {
      const e = mbsMap[id]
      if (e) { e.dlv = dlv2; e.v = 0 }
      if (session.fsSync) {
        await session.fsSync.setGroupe(id)
      } else {
        abPlus.push(id)
      }
    }

    const grRows = {} // Map des rows des groupes par id du groupe
    if (session.accesIdb) {
      this.cGroupes.forEach(row => {
        if (!grRequis.has(row.id)) {
          this.buf.purgeGroupeIDB(row.id)
        } else {
          grRows[row.id] = row
          const e = mbsMap[row.id]
          if (e) e.v = row.v
        }
      })
    }

    if (session.accesNet) {
      // mbsMap, avsMap, abPlus sont les arguments de l'opération SignaturesEtGroupes
      const args = { token: session.authToken, mbsMap, avsMap, abPlus }
      const ret = this.tr(await post(this, 'SignaturesEtGroupes', args))
      if (ret.rowGroupes && ret.rowGroupes.length) {
        ret.rowGroupes.forEach(row => {
          this.buf.putIDB(row)
          grRows[row.id] = row
        })
      }
    }

    /* Certains groupes peuvent être des groupes supprimés
    mais que les avatars qui les référencent n'ont pas encore enlevés de leur
    liste des groupes.
    */
    const zombis = new Set()

    /* Tous les avatars, groupes et membres sont signés avec les dlv demandées */
    for(const id in grRows) {
      const r = grRows[id]
      const gr = await compile(r)
      if (gr._zombi) {
        zombis.add(gr.id)
        this.buf.purgeGroupeIDB(gr.id)
      } else {
        this.groupesToStore.set(gr.id, gr)
      }
    }
    return zombis
  }

  /** Chargement pour un avatar de ses secrets postérieurs au plus récent ************/
  async chargerSecrets (id, v, estGr) {
    const session = stores.session
    let n1 = 0, n2 = 0
    const rows = {}
    for (const row of this.cSecrets) { 
      if (row.id === id) {
        rows[row.ids] = row
        n1++
      } 
    }

    let rowSecrets // array

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
    for (const ids in rows) {
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
  async chargerChats (id, v) {
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

    if (session.accesNet) {
      const args = { token: session.authToken, id, v }
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
    const avStore = stores.avatars
    for (const ids in rows) {
      const chat = await compile(rows[ids])
      avStore.setChat(chat)
    }
    return [n1, n2]
  }
  
  /** Chargement pour un avatar de ses sponsorings postérieurs au plus récent ************/
  async chargerSponsorings (id, v) {
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

    if (session.accesNet) {
      const args = { token: session.authToken, id, v }
      const ret = this.tr(await post(this, 'ChargerSponsorings', args))
      rowSponsorings = ret.rowSponsorings
    }
    if (rowSponsorings  && rowSponsorings.length) {
      for (const row of rowSponsorings) {
        if (row.dlv <= this.auj) { // ignore les sponsorings de dlv dépassée
          this.buf.putIDB(row)
          rows[row.ids] = row
          n2++
        } else {
          this.buf.supprIDB(row)
          delete rows[row.ids]
        }
      }
    }
    const avStore = stores.avatars
    for (const ids in rows) {
      const sponsoring = await compile(rows[ids])
      avStore.setSponsoring(sponsoring)
    }
    return [n1, n2]
  }

  /** Chargement pour un groupe de ses membres postérieurs au plus récent ************/
  async chargerMembres (groupe) {
    const session = stores.session
    let n1 = 0, n2 = 0
    const rows = {}
    for (const row of this.cMembres) { 
      if (row.id === groupe.id) {
        if (row.dlv > this.auj) {
          this.buf.supprIDB(row)
          this.mbsDisparus.add(row.ids)
        } else {
          rows[row.ids] = row
          n1++
        }
      }
    }

    let rowMembres

    if (session.accesNet) {
      const args = { token: session.authToken, id: groupe.id, v: groupe.v }
      const ret = this.tr(await post(this, 'ChargerMembres', args))
      rowMembres = ret.rowMembres
    }
    if (rowMembres  && rowMembres.length) {
      for (const row of rowMembres) {
        if (row.dlv > this.auj) {
          this.buf.supprIDB(row)
          this.mbsDisparus.add(row.ids)
        } else {
          this.buf.putIDB(row)
          rows[row.ids] = row
          n2++
        }
      }
    }
    const grStore = stores.groupes
    for (const ids in rows) {
      const membre = await compile(rows[ids])
      grStore.setMembre(membre)
    }
    return [n1, n2]
  }

  async getCTA () {
    const args = { token: stores.session.authToken }
    const ret = this.tr(await post(this, 'GetComptaTribuAvatar', args))
    this.rowAvatar = ret.rowAvatar
    this.rowCompta = ret.rowCompta
    this.rowTribu = ret.rowTribu
    this.avatar = await compile(this.rowAvatar)
    this.compta = await compile(this.rowCompta)
    this.tribu = await compile(this.rowTribu)
  }

  async phase0Net () {
    const session = stores.session
    /* Authentification et get de avatar / compta / tribu
    ET abonnement à compta sur le serveur
    */
    const args = { token: session.authToken }
    // Connexion : récupération de l'id du compte, clepubc, fscredentials
    const ret = this.tr(await post(this, 'ConnexionCompte', args))
    session.clepubc = ret.clepubc
    session.compteId = ret.compteId
    session.tribuId = ret.tribuId
    session.estComptable = session.compteId === IDCOMPTABLE
    if (ret.credentials) session.fscredentials = ret.credentials
    if (session.fsSync) {
      await session.fsSync.setCompte(session.compteId)
      await session.fsSync.setTribu(session.tribuId)
    }

    this.getCTA()

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
    this.rowAvatar = await getAvatarPrimaire()
    this.avatar = await compile(this.rowAvatar) 
    this.rowCompta = await getCompta()
    this.compta = await compile(this.rowCompta) 
    this.rowTribu = await getTribu(this.compta.idt)
    this.tribu = await compile(this.rowTribu)
  }

  /** run **********************************************************/
  async run () {
    try {
      // session synchronisée ou incognito
      const session = stores.session
      const avStore = stores.avatar

      this.auj = DateJour.nj()
      this.buf = new IDBbuffer()
      this.dh = 0

      if (session.avion) {
        await this.phase0Avion()
      } else {
        await this.phase0Net()
      }

      this.cAvatars = session.accesIdb ? await getColl('avatars') : []
      this.avatarsToStore = new Map() // objets avatar à ranger en store
      const [avRowsModifies, avToSuppr] = await this.tousAvatars()

      if (session.accesIdb) {
        this.buf.putIDB(this.rowCompta)
        this.buf.putIDB(this.rowTribu)
        avRowsModifies.forEach(row => { this.buf.putIDB(row) })
        avToSuppr.forEach(id => { this.buf.purgeAvatarIDB(id) })
      }

      // Rangement en store
      avStore.setCompte(this.avatar, this.compta, this.tribu)
      session.setBlocage()
      this.avatarsToStore.values().forEach(av => { 
        if (av.id !== this.avatar.id) avStore.setAvatar(av)
      })

      this.cGroupes = session.accesIdb ? await getColl('groupes') : []
      this.groupesToStore = new Map() // complilation des rows des groupes venant de IDB ou du serveur
      const grZombis = await this.tousGroupes() // Avatars et Groupes signés
  
      this.BRK()

      // MAJ intermédiaire de IDB : évite d'avoir des avatars / groupes obsolètes pour la suite
      if (session.accesIdb) {
        await this.buf.commitIDB()
        this.buf = new IDBbuffer()
      }

      this.BRK()

      if (session.accesNet && grZombis.size) {
        /* Traitement des groupes zombis 
        Les retirer (par anticipation) des avatars qui les référencent 
        mapIdNi : map
          - clé : id d'un avatar
          - valeur : array des ni des groupes ciblés
        */
        const mapIdNi = {}
        this.avatarsToStore.forEach(av => { 
          const ani = av.niDeGroupes(grZombis, true)
          if (ani.length) mapIdNi[av.id] = ani
        })
        const args = { token: session.authToken, mapIdNi }
        this.tr(await post(this, 'EnleverGroupesAvatars', args))
      }

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

      // Chargement depuis IDB des Maps des secrets, chats, sponsorings, membres trouvés en IDB
      this.cSecrets = session.accesIdb ? await getColl('secrets') : []
      this.cChats = session.accesIdb ? await getColl('chats') : []
      this.cSponsorings = session.accesIdb ? await getColl('sponsorings') : []
      this.cMembres = session.accesIdb ? await getColl('membres') : []

      // Itération sur chaque avatar: secrets, chats, sponsorings
      for (const avatar of avStore.avatars.values()) {
        const na = getNg(avatar.id)
        let n1 = 0, n2 = 0, n3 = 0, n4 = 0, n5 = 0, n6 = 0
        const [x1, x2] = await this.chargerSecrets(avatar.id, avatar.v)
        n1 = x1
        n2 = x2
        syncitem.push('05' + id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6])
        const [x3, x4] = await this.chargerChats(avatar.id, avatar.v)
        n3 = x3
        n4 = x4
        syncitem.push('05' + id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6])
        const [x5, x6] = await this.chargerSponsorings(avatar.id, avatar.v)
        n5 = x5
        n6 = x6
        syncitem.push('05' + id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6])
      }

      // Itération sur chaque groupe: secrets, membres
      for (const groupe of grStore.groupes.values) {
        const na = getNg(id)
        let n1 = 0, n2 = 0, n3 = 0, n4 = 0
        const [x1, x2] = await this.chargerSecrets(groupe.id, groupe.v, true)
        n1 = x1
        n2 = x2
        syncitem.push('10' + id, 1, 'SYgro2', [na.nom, n1, n2, n3, n4])

        this.mbsDisparus = new Set()
        const [x3, x4] = await this.chargerMembres(groupe)
        n3 = x3
        n4 = x4
        syncitem.push('10' + id, 1, 'SYgro2', [na.nom, n1, n2, n3, n4])

        if (this.mbsDisparus.size) {
          /* Sur le serveur, le GC quotidien est censé avoir mis les statuts ast[ids] à 0
          dans le groupe du membre. Retard possible, la session le met en local */
          groupe.setDisparus(this.mbsDisparus)
        }
  
      }

      /* Mises à jour éventuelles du serveur **********************************************/
      if (session.accesNet ) {
        /*MAJ (éventuelle) de nctk par cryptage en clé K au lieu du RSA trouvé */
        if (this.avatar.nctkCleK) {
          const args = { token: session.authToken, id: this.avatar.id, nctk: this.avatar.nctkCleK }
          this.tr(await post(this, 'm1', 'nctkCompte', args))
        }
        /* Suppression des secrets temporaires ayant dépassé leur date limite */
        if (this.buf.lsecsup.length) {
          for (const s of this.buf.lsecsup) {
            try {
              const args = { token: session.authToken, id: s.id, ids: s.ids, idc: s.idCompta, idg: s.idGroupe }
              const ret = this.tr(await post(this, 'SupprSecret', args))
            } catch (e) {
              console.log(e.message)
            }
          }
        }
      }
      
      // Finalisation en une seule fois de l'écriture du nouvel état en IDB
      if (session.synchro) await this.buf.commitIDB(true) // MAJ compte.id / cle K

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
