import stores from '../stores/stores.mjs'
import { encode } from '@msgpack/msgpack'

import { OperationUI } from './operations.mjs'
import { SyncQueue } from './sync.mjs'
import { $t, getTrigramme, setTrigramme, afficherDiag, sleep } from './util.mjs'
import { post } from './net.mjs'
import { AMJ } from './api.mjs'
import { resetRepertoire, compile, Compta, Avatar, Tribu, Tribu2, Chat, NomAvatar, NomTribu, naComptable, GenDoc, setNg, getNg, Versions } from './modele.mjs'
import { openIDB, closeIDB, deleteIDB, getCompte, getCompta, getTribu, getTribu2, loadVersions, getAvatarPrimaire, getColl,
  IDBbuffer, gestionFichierCnx, TLfromIDB, FLfromIDB, lectureSessionSyncIdb  } from './db.mjs'
import { crypter, random, crypterRSA, decrypterRSA } from './webcrypto.mjs'
import { FsSyncSession } from './fssync.mjs'
import { openWS, closeWS } from './ws.mjs'

/* garderMode : si true, garder le mode */
export function deconnexion (garderMode) {
  const session = stores.session
  const config = stores.config
  const mode = session.mode
  if (session.accesIdb) closeIDB()
  if (session.accesNet && !config.fsSync) closeWS()
  stores.reset()
  session.$reset()
  if (garderMode) session.mode = mode
  SyncQueue.reset()
  if (session.fsSync) session.fsSync.close()
  stores.ui.setPage('login')
}

export async function reconnexionCompte () {
  const session = stores.session
  const phrase = session.phrase
  deconnexion(true)
  await connecterCompte (phrase) 
}

async function initSession (phrase) {
  const session = stores.session
  const config = stores.config
  session.init(phrase)
  if (session.accesNet) {
    if (!config.fsSync) {
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
    session.setCompteId(x.id)
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

    while (true) { // boucle si la version de compta a changé
      avRowsModifies.length = 0
      avToSuppr.clear()
      this.avatarsToStore.clear()

      const mapv = {} // versions des avatars requis à demander au serveur

      const avRequis = this.compta.avatarIds
      avRequis.forEach(id => {
        if (id === this.avatar.id) {
          mapv[id] = this.avatar.v
          this.avatarsToStore.set(id, this.avatar)
        } else mapv[id] = 0 
      })

      for (const row of this.cAvatars) {
        if (row.id !== this.avatar.id) {
          if (avRequis.has(row.id)) {
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
            avRowsModifies.push(row)
          }
        }

        // obtention de la liste des groupes requis et signatures
        const ok = await this.groupesRequisSignatures()
        if (!ok) {
          await this.getCTA()
          continue
        }
      }
      break
    }

    return [avRowsModifies, avToSuppr]
  }

  /** tousGroupes *******************************************************/
  async groupesRequisSignatures () {
    const session = stores.session
    // En UTC la division d'une date est multiple de 86400000
    const tjourJ = (AMJ.tDeAmjUtc(this.auj) / 86400000) + stores.config.limitesjour.dlv
    const tdlv1 = (Math.floor(tjourJ / 10) + 1) * 10
    const tdlv2 = tdlv1 + 10
    const dlv1 = AMJ.amjUtcDeT(tdlv1 * 86400000)
    const dlv2 = AMJ.amjUtcDeT(tdlv2 * 86400000)

    this.grRequis = new Set()

    /* map des membres des groupes auxquels participent au moins un des avatars
     - clé: id du groupe  - valeur: { idg, mbs: [ids], dlv } */
    const mbsMap = {} 

    /* map des avatars du compte - clé: id de l'avatar  - valeur: {v, dlv} } */
    const avsMap = {} 

    // ids des avatars et des groupes auxquels s'abonner
    const abPlus = []

    for(const avatar of this.avatarsToStore.values()) {
      if (session.fsSync) await session.fsSync.setAvatar(avatar.id); else abPlus.push(avatar.id)
      avatar.idGroupes(this.grRequis)
      avsMap[avatar.id] = { v: avatar.v, dlv: avatar.id % 10 === 0 ? dlv1 : dlv2 }
      avatar.membres(mbsMap, dlv2)
    }
  
    // Abonnements aux groupes requis
    for (const id of this.grRequis) {
      if (session.fsSync) await session.fsSync.setGroupe(id); else abPlus.push(id)
    }

    if (session.accesNet) {
      /*
      Retour:
      - OK: true / false (un avatar a changé de version)
      - versions: map pour chaque avatar / groupe de:
        { v }: pour un avatar
        { v, vols: {v1, v2, q1, q2} } : pour un groupe
      */
      const args = { token: session.authToken, vcompta: this.compta.v, mbsMap, avsMap, abPlus }
      const ret = this.tr(await post(this, 'SignaturesEtVersions', args))
      if (ret.OK === false) return false
      this.versions = ret.versions
    }
    return true
  }

  async chargerGroupes () {
    const session = stores.session
    const grRows = {} // Map des rows des groupes par id du groupe
    if (session.accesIdb) {
      this.cGroupes.forEach(row => {
        if (!this.grRequis.has(row.id)) this.buf.purgeGroupeIDB(row.id); else grRows[row.id] = row
      })
    }

    if (session.accesNet) {
      if (this.grRequis.size) {
        const mapv = {} // version détenue en session pour chaque groupe requis
        this.grRequis.forEach(id => { const r = grRows[id] ; mapv[id] = r ? r.v : 0 })
        const args = { token: session.authToken, mapv }
        const ret = this.tr(await post(this, 'GetGroupes', args))
        if (ret.rowGroupes) ret.rowGroupes.forEach(row => {
          grRows[row.id] = row
        })
      }
    }

    /* Certains groupes peuvent être des groupes supprimés
    mais que les avatars qui les référencent n'ont pas encore enlevés de leur
    liste des groupes.
    */
    const zombis = new Set()

    /* Tous les avatars et membres sont signés avec les dlv demandées */
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
  async chargerSecrets (id, vidb, vsrv, estGr) {
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

    if (session.accesNet && vsrv > vidb) {
      const args = { token: session.authToken, id, v: vidb }
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
    const avgrStore = estGr ? stores.groupe : stores.avatar
    const auj = AMJ.amjUtc()
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
  async chargerChats (id, vidb, vsrv) {
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

    if (session.accesNet && vsrv > vidb) {
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
    const avStore = stores.avatar
    for (const ids in rows) {
      const chat = await compile(rows[ids])
      avStore.setChat(chat)
    }
    return [n1, n2]
  }
  
  /** Chargement pour un avatar de ses sponsorings postérieurs au plus récent ************/
  async chargerSponsorings (id, vidb, vsrv) {
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

    if (session.accesNet && vsrv > vidb) {
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
    const avStore = stores.avatar
    for (const ids in rows) {
      const sponsoring = await compile(rows[ids])
      avStore.setSponsoring(sponsoring)
    }
    return [n1, n2]
  }

  /** Chargement pour un groupe de ses membres postérieurs au plus récent ************/
  async chargerMembres (groupe, vidb, vsrv) {
    const id = groupe.id
    const session = stores.session
    let n1 = 0, n2 = 0
    const rows = {}
    for (const row of this.cMembres) { 
      if (row.id === id) {
        if (row.dlv < this.auj || !groupe.ast[row.ids]) {
          this.buf.supprIDB(row)
          this.mbsDisparus.add(row.ids)
        } else {
          rows[row.ids] = row
          n1++
        }
      }
    }

    let rowMembres

    if (session.accesNet && vidb < vsrv) {
      const args = { token: session.authToken, id, v: vidb }
      const ret = this.tr(await post(this, 'ChargerMembres', args))
      rowMembres = ret.rowMembres
    }
    if (rowMembres  && rowMembres.length) {
      for (const row of rowMembres) {
        if (row.dlv < this.auj || !groupe.ast[row.ids]) {
          this.buf.supprIDB(row)
          this.mbsDisparus.add(row.ids)
        } else {
          this.buf.putIDB(row)
          rows[row.ids] = row
          n2++
        }
      }
    }
    
    const grStore = stores.groupe
    for (const ids in rows) {
      const membre = await compile(rows[ids])
      grStore.setMembre(membre)
    }
    return [n1, n2]
  }

  async getCTA () {
    const session = stores.session
    /* Authentification et get de avatar / compta / tribu
    ET abonnement à compta sur le serveur
    */
    const args = { token: session.authToken }
    // Connexion : récupération de rowCompta rowAvatar rowTribu fscredentials
    const ret = this.tr(await post(this, 'ConnexionCompte', args))
    if (ret.credentials) session.fscredentials = ret.credentials
    this.notifG = ret.notifG
    this.rowAvatar = ret.rowAvatar
    this.rowCompta = ret.rowCompta
    session.compteId = this.rowAvatar.id
    if (session.estComptable) session.mode = 2
    session.setAvatarId(session.compteId)
    this.compta = await compile(this.rowCompta)
    this.avatar = await compile(this.rowAvatar)

    {
      const args = { token: session.authToken, id: this.compta.idt, tribu2: true, abPlus: [this.compta.idt] }
      const ret = this.tr(await post(this, 'GetTribu', args))
      this.rowTribu = ret.rowTribu
      this.rowTribu2 = ret.rowTribu2
    }
    this.tribu = await compile(this.rowTribu)
    this.tribu2 = await compile(this.rowTribu2)
    session.setTribuId(this.tribu.id)
    if (session.fsSync) await session.fsSync.setTribu(session.tribuId)
  }

  async phase0Net () {
    const session = stores.session
    /* Authentification et get de avatar / compta / tribu
    ET abonnement à compta sur le serveur
    */
    await this.getCTA()

    if (session.fsSync) await session.fsSync.setCompte(session.compteId)

    if (session.accesIdb && !session.nombase) await session.setNombase() // maintenant que la cle K est connue

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
        await deleteIDB(session.nombase)
        await openIDB()
        setTrigramme(session.nombase, await getTrigramme())
      }
      lectureSessionSyncIdb()
    }
  }

  async phase0Avion () {
    // session.compteId et session.clek OK
    const session = stores.session
    this.rowCompta = await getCompta()
    this.compta = await compile(this.rowCompta) 
    this.rowTribu = await getTribu(this.compta.idt)
    this.tribu = await compile(this.rowTribu)
    this.rowTribu2 = await getTribu2(this.compta.idt)
    this.tribu2 = await compile(this.rowTribu2)
    session.setTribuId(this.tribu.id)
    this.rowAvatar = await getAvatarPrimaire()
    this.avatar = await compile(this.rowAvatar)
    session.setAvatarId(session.compteId)
  }

  /** run **********************************************************/
  async run () {
    try {
      await stores.ui.setPage('session')

      // session synchronisée ou incognito
      const session = stores.session
      const avStore = stores.avatar

      this.auj = AMJ.amjUtc()
      this.buf = new IDBbuffer()
      this.dh = 0
      const naComptable = new NomAvatar('', -1)
      setNg(naComptable)

      if (session.avion) {
        await this.phase0Avion()
      } else {
        await this.phase0Net()
      }

      this.cAvatars = session.accesIdb ? await getColl('avatars') : []
      this.avatarsToStore = new Map() // objets avatar à ranger en store
      const [avRowsModifies, avToSuppr] = await this.tousAvatars()
      /* this.versions :  map pour chaque avatar / groupe de :
        { v }: pour un avatar
        { v, vols: {v1, v2, q1, q2} } : pour un groupe
      */
      
      /* Dans compta, nctk a peut-être été recrypté */
      if (session.accesNet && this.compta.nctk) {
        const args = { token: session.authToken, nctk: this.compta.nctk }
        this.tr(await post(this, 'MajNctkCompta', args))
        delete this.compta.nctk
      }

      if (session.accesIdb) {
        this.buf.putIDB(this.rowCompta)
        this.buf.putIDB(this.rowTribu)
        this.buf.putIDB(this.rowTribu2)
        this.buf.putIDB(this.rowAvatar)
        avRowsModifies.forEach(row => { this.buf.putIDB(row) })
        avToSuppr.forEach(id => { this.buf.purgeAvatarIDB(id) })
      }

      // Rangement en store
      avStore.setCompte(this.avatar, this.compta, this.tribu, this.tribu2)
      session.setNotifGlobale(this.notifG)

      // En cas de blocage grave, plus de synchronisation
      if (session.nivbl === 3 && session.mode === 1) {
        session.mode = 2
        await afficherDiag($t('CNXdeg'))
      }

      this.avatarsToStore.forEach(av => {
        if (av.id !== this.avatar.id) avStore.setAvatar(av)
      })

      this.cGroupes = session.accesIdb ? await getColl('groupes') : []
      this.groupesToStore = new Map() // compilation des rows des groupes venant de IDB ou du serveur
      const grZombis = await this.chargerGroupes()
  
      this.BRK()

      // MAJ intermédiaire de IDB : évite d'avoir des avatars / groupes obsolètes pour la suite
      if (session.synchro) {
        await this.buf.commitIDB(true)
        this.buf = new IDBbuffer()
      }

      if (session.accesNet && grZombis.size) {
        /* Traitement des groupes zombis 
        Les retirer (par anticipation) des avatars qui les référencent 
        mapIdNi : Map
          - clé : id d'un avatar
          - valeur : array des ni des groupes ciblés
        */
        const mapIdNi = {}
        this.avatarsToStore.forEach(av => { 
          const ani = av.niDeGroupes(grZombis)
          if (ani.length) mapIdNi[av.id] = ani
        })
        const args = { token: session.authToken, mapIdNi }
        this.tr(await post(this, 'EnleverGroupesAvatars', args))
      }

      const grStore = stores.groupe
      const syncitem = stores.syncitem 
      this.avatarsToStore.forEach(av => { 
        avStore.setAvatar(av)
        syncitem.push('05' + av.id, 0, 'SYava', [av.na.nom])
      })
      this.groupesToStore.forEach(gr => { 
        grStore.setGroupe(gr) 
        syncitem.push('10' + gr.id, 0, 'SYgro', [gr.na.nom])
      })

      // Versions des sous-collections par avatar / groupe
      if (session.accesIdb) await loadVersions(); else Versions.reset()
      /* this.versions :  map pour chaque avatar / groupe de :
        { v }: pour un avatar
        { v, vols: {v1, v2, q1, q2} } : pour un groupe
      */

      // Comptable seulement : chargement des tribus
      if (session.estComptable) {
        const args = { token: session.authToken }
        const ret = this.tr(await post(this, 'ChargerTribus', args))
        if (ret.rowTribus && ret.rowTribus.length) for(const row of ret.rowTribus) {
          const tribu = await compile(row)
          avStore.setTribu(tribu)
        }
      }

      // Chargement depuis IDB des Maps des secrets, chats, sponsorings, membres trouvés en IDB
      this.cSecrets = session.accesIdb ? await getColl('secrets') : []
      this.cChats = session.accesIdb ? await getColl('chats') : []
      this.cSponsorings = session.accesIdb ? await getColl('sponsorings') : []
      this.cMembres = session.accesIdb ? await getColl('membres') : []

      // Itération sur chaque avatar: secrets, chats, sponsorings
      for (const [,avatar] of avStore.avatars) {
        const vidb = Versions.get(avatar.id)
        const vx = this.versions && this.versions[avatar.id] ? this.versions[avatar.id] : { v: 0 }
        const vsrv = vx.v
        const na = getNg(avatar.id)
        let n1 = 0, n2 = 0, n3 = 0, n4 = 0, n5 = 0, n6 = 0
        const [x1, x2] = await this.chargerSecrets(avatar.id, vidb, vsrv, false)
        n1 = x1
        n2 = x2
        syncitem.push('05' + na.id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6])
        const [x3, x4] = await this.chargerChats(avatar.id, vidb, vsrv)
        n3 = x3
        n4 = x4
        syncitem.push('05' + na.id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6])
        const [x5, x6] = await this.chargerSponsorings(avatar.id, vidb, vsrv)
        n5 = x5
        n6 = x6
        syncitem.push('05' + na.id, 1, 'SYava2', [na.nom, n1, n2, n3, n4, n5, n6])
        if (vidb < vsrv) Versions.set(avatar.id, vsrv)
      }

      // Itération sur chaque groupe: secrets, membres
      for (const [,groupe] of grStore.groupes) {
        const vidb = Versions.get(groupe.id)
        const vx = this.versions && this.versions[groupe.id] ? this.versions[groupe.id] : { v: 0 }
        const vsrv = vx.v
        if (vx.vols) groupe.vols = vx.vols
        const na = getNg(groupe.id)
        let n1 = 0, n2 = 0, n3 = 0, n4 = 0
        const [x1, x2] = await this.chargerSecrets(groupe.id, vidb, vsrv, true)
        n1 = x1
        n2 = x2
        syncitem.push('10' + na.id, 1, 'SYgro2', [na.nom, n1, n2, n3, n4])

        this.mbsDisparus = new Set()
        const [x3, x4] = await this.chargerMembres(groupe, vidb, vsrv)
        n3 = x3
        n4 = x4
        syncitem.push('10' + na.id, 1, 'SYgro2', [na.nom, n1, n2, n3, n4])
        if (vidb < vsrv) Versions.set(groupe.id, vsrv)

        if (this.mbsDisparus.size) {
          /* Sur le serveur, le GC quotidien est censé avoir mis les statuts ast[ids] à 0
          dans le groupe du membre. 
          Retard possible : dlv détectée sur un membre, 
          - vérifier que son ast est à 0 (l'y forcer)
          - le faire inscrire dans le serveur
          */
          groupe.setDisparus(this.mbsDisparus)
        }
      }

      /* Mises à jour éventuelles du serveur **********************************************/
      if (session.accesNet ) {
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
      if (session.synchro) await this.buf.commitIDB(true, true) // MAJ compte.id / cle K et versions

      if (session.accesIdb) { 
        await gestionFichierCnx(this.buf.mapSec)
        // Gestion des fichiers locaux et textes locaux
        await TLfromIDB()
        await FLfromIDB()
      }

      // enregistre l'heure du début effectif de la session
      if (session.synchro) await session.sessionSync.setConnexion(this.dh)
      console.log('Connexion compte : ' + this.compta.id)
      session.status = 2
      SyncQueue.traiterQueue()
      await sleep(500)
      if (session.nivbl || session.alirentf) {
        stores.ui.setPage('compta', 'notif')
      } else {
        stores.ui.setPage('accueil')
      }
      this.finOK()
    } catch (e) {
      await this.finKO(e)
      stores.ui.setPage('login')
    }
  }
}

/******************************************************************
Acceptation d'un sponsoring
args...
token: authToken,
rowCompta, rowAvatar, rowVersion: du compte / avatar en création
idt: id de sa tribu
ids: ids du sponsoring
rowChatI: chatI (interne) pour le compte en création
rowChatE: chatE (externe) pour le sponsor - version à fixer
ardx: ardoise du sponsoring à mettre à jour (avec statut 2 accepté)
mbtrid : id de son élément mbtr (hash de la clé `rnd` du membre)
mbtre: élément de la map mbtr de sa tribu
quotas : `[v1, v2]` quotas attribués par le parrain.
*/

export class AcceptationSponsoring extends OperationUI {
  constructor () { super($t('OPapa')) }

  async run (sp, ardx, txt, ps) {
    /* sp : objet Sponsoring
    - id ids : identifiant
    - `ard`: ardoise.
    - 'dlv': 
    - `na` : du sponsor P.
    - `cv` : du sponsor P.
    - `naf` : na attribué au filleul.
    - 'nctkc' : nc tribu par clé K du comptable
    - `nct` : de sa tribu.
    - `sp` : vrai si le filleul est lui-même sponsor (créé par le Comptable, le seul qui peut le faire).
    - `quotas` : `[q1, q2]` quotas attribués par le parrain.
    ardx : reponse cryptée par la cleX du sponsoring
    reponse : texte du sponsorisé
    ps: phrase secrète du nouveau compte
    */
    try {
      // LE COMPTE EST CELUI DU FILLEUL
      const session = stores.session
      const config = stores.config
      await initSession(ps)
      this.auj = AMJ.amjUtc()
      this.buf = new IDBbuffer()
      this.dh = 0

      setNg(sp.nct)
      setNg(sp.naf)

      session.setCompteId(sp.naf.id)
      session.setTribuId(sp.nct.id)
      session.setAvatarId(session.compteId)

      const { publicKey, privateKey } = await genKeyPair()

      const rowCompta = await Compta.row(sp.naf, sp.nct, sp.nctkc, sp.quotas[0], sp.quotas[1], sp.sp) // set de session.clek
      const rowAvatar = await Avatar.primaireRow(sp.naf, publicKey, privateKey)
      const rowVersion = {
        id: sp.naf.id,
        v: 1,
        iv: GenDoc._iv(sp.naf.id, 1),
        dlv: AMJ.amjUtcPlusNbj(this.auj, config.limitesjour.dlv)
      }
      const _data_ = new Uint8Array(encode(rowVersion))
      rowVersion._data_ = _data_
      rowVersion._nom = 'versions'

      /* Element de mbtr de tribu2 du nouveau compte
      - _clé_ : (hash de la clé `rnd` du membre)
      - _valeur_ :
    - _valeur_ :
      - `na` : `[nom, rnd]` du membre crypté par la clé de la tribu.
      - `sp` : si `true` / présent, c'est un sponsor.
      - `q1 q2` : quotas du compte (redondance dans l'attribut `compteurs` de `compta`)
      - `blocage` : blocage de niveau compte, crypté par la clé de la tribu.
      - 'gco gsp' : gravités des notifco et notifsp.
      - `notifco` : notification du comptable au compte (cryptée par la clé de la tribu).
      - `notifsp` : notification d'un sponsor au compte (cryptée par la clé de la tribu).
      - `cv` : `{v, photo, info}`, carte de visite du compte cryptée par _sa_ clé (le `rnd` ci-dessus).
      */
      const mbtrid = sp.naf.hrnd
      const na = await crypter(sp.nct.rnd, new Uint8Array(encode([sp.naf.nom, sp.naf.rnd])))
      const x = { na, q1: sp.quotas[0], q2: sp.quotas[1] }
      if (sp.sp) x.sp = true
      const mbtre = new Uint8Array(encode(x))

      // chatI : chat pour le compte, chatE : chat pour son sponsor
      const cc = random(32)
      const dh = new Date().getTime()
      const contcI = await Chat.getContc(sp.na, dh, txt, cc)
      const contcE = await Chat.getContc(sp.naf, dh, txt, cc)

      const pubE = await stores.avatar.getPub(naE.id)
      if (!pubE) throw new AppExc(F_BRO, 7)

      // (naI, naE, contc, cc, pubE, mc)
      const rowChatI = await Chat.nouveauRow(sp.naf, sp.na, contcI, cc, null, new Uint8Array([252])) 
      const rowChatE = await Chat.nouveauRow(sp.na, sp.naf, contcE, cc, pubE, new Uint8Array([253])) 

      const args = { token: stores.session.authToken, rowCompta, rowAvatar, rowVersion, ids: sp.ids,
        rowChatI, rowChatE, ardx, idt: session.tribuId, mbtrid, mbtre, quotas: sp.quotas, abPlus: [sp.nct.id, sp.naf.id] }
      const ret = this.tr(await post(this, 'AcceptationSponsoring', args))
      // Retourne: credentials, rowTribu
      if (ret.credentials) session.fscredentials = ret.credentials
      const notifG = ret.notifG
      const rowTribu = ret.rowTribu
      const rowTribu2 = ret.rowTribu2
      const rowChat = ret.rowChat

      // Le compte vient d'être créé, clek est enregistrée par la création de rowCompta
      const avatar = await compile(rowAvatar)
      const tribu = await compile(rowTribu)
      const tribu2 = await compile(rowTribu2)
      const compta = await compile(rowCompta)
      stores.avatar.setCompte(avatar, compta, tribu, tribu2)
      session.setNotifGlobale(notifG)
      const chat = await compile(rowChat)
      stores.avatar.setChat(chat)
      Versions.reset()
      Versions.set(session.compteId, 1)

      if (session.fsSync) await session.fsSync.setCompte(session.compteId)

      if (session.synchro) {
        try {
          await session.setNombase()
          await openIDB()
          setTrigramme(session.nombase, await getTrigramme())
          lectureSessionSyncIdb()
          // Finalisation en une seule fois de l'écriture du nouvel état en IDB
          this.buf.putIDB(rowCompta)
          this.buf.putIDB(rowAvatar)
          this.buf.putIDB(rowChatI)
          this.buf.putIDB(rowTribu)
          this.buf.putIDB(rowTribu2)
          await this.buf.commitIDB(true, true) // MAJ compte.id / cle K et versions
          await session.sessionSync.setConnexion(this.dh)
        } catch(e) {
          this.session.mode = 2
          await afficherDiag(this.$t('LOGnoidb'))
        }
      }
  
      if (session.fsSync) {
        await session.fsSync.setCompte(session.compteId)
        await session.fsSync.setAvatar(session.compteId)
        await session.fsSync.setTribu(session.tribuId)
      }

      console.log('Connexion compte : ' + session.compteId)
      session.status = 2
      SyncQueue.traiterQueue()
      stores.ui.setPage('accueil')
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Refus d'un sponsoring *************************************************
args.id ids : identifiant du sponsoring
args.arx : réponse du filleul
*/
export class RefusSponsoring extends OperationUI {
  constructor () { super($t('OPdpa')) }

  async run (sp, ardx) { // ids du sponsoring
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

/* Création du compte Comptable******************************************
args.token donne les éléments d'authentification du compte.
args.pcbh : hash de la cle X (hash du PBKFD de la phrase complète)
args.rowAvatar, rowTribu, rowCompta du compte du comptable
args.rowVersion: version de l'avatar (avec sa dlv) 
args.rowTribu
args.rowTribu2
*/
export class CreationCompteComptable extends OperationUI {
  constructor () { super($t('OPccc')) }

  async run (phrase) {
    try {
      await stores.ui.setPage('session')
      const session = stores.session
      const config = stores.config
      const ac = config.allocComptable
      session.mode = 2
      await initSession(phrase)

      const nt = new NomTribu(config.nomTribuPrimitive)
      setNg(nt)
      const na = new NomAvatar('', -1)
      setNg(na)

      session.setCompteId(na.id)
      session.setTribuId(nt.id)
      session.setAvatarId(session.compteId)

      const rowCompta = await Compta.row(na, nt, null, ac[0], ac[1], true) // set de session.clek
      const rowTribu = await Tribu.primitiveRow(nt, ac[0], ac[1], ac[2], ac[3])
      const rowTribu2 = await Tribu2.primitiveRow(nt, ac[0], ac[1])

      const { publicKey, privateKey } = await genKeyPair()

      const rowAvatar = await Avatar.primaireRow(na, publicKey, privateKey)
      const r = {
        id: na.id,
        v: 1,
        iv: GenDoc._iv(na.id, 1),
        dlv: AMJ.amjUtcPlusNbj(AMJ.amjUtc(), config.limitesjour.dlv)
      }
      const _data_ = new Uint8Array(encode(r))
      r._data_ = _data_
      r._nom = 'versions'

      const args = { token: stores.session.authToken, rowTribu, rowTribu2, 
        rowCompta, rowAvatar, rowVersion: r, pcbh: phrase.pcbh, abPlus: [nt.id] }
      const ret = this.tr(await post(this, 'CreationCompteComptable', args))
      // Le compte vient d'être créé, clek est enregistrée
      const avatar = await compile(rowAvatar)
      const tribu = await compile(rowTribu)
      const tribu2 = await compile(rowTribu2)
      const compta = await compile(rowCompta)
      stores.avatar.setCompte(avatar, compta, tribu, tribu2)
      session.setNotifGlobale({ txt: '', dh: 0, g: 0 })

      if (ret.credentials) session.fscredentials = ret.credentials
      if (session.fsSync) {
        await session.fsSync.setCompte(session.compteId)
        await session.fsSync.setAvatar(session.compteId)
        await session.fsSync.setTribu(session.tribuId)
      }

      console.log('Connexion compte : ' + na.id)
      session.status = 2
      SyncQueue.traiterQueue()
      stores.ui.setPage('accueil')
      this.finOK()
    } catch (e) {
      await this.finKO(e)
      stores.ui.setPage('login')
    }
  }
}

/** Opérations de type "ping" non authentifiées du tout */

/** Echo du texte envoyé ***************************************
args.token donne les éléments d'authentification du compte.
args.to : délai en secondes avant retour de la réponse
args.texte : texte à renvoyer en écho
Retour:
- echo : texte d'entrée retourné
*/
export class EchoTexte extends OperationUI {
  constructor () { super($t('OPecho')) }

  async run (texte, to) {
    try {
      const ret = this.tr(await post(this, 'EchoTexte', { to, texte }))
      console.log('Echo : ' + ret.echo)
      return this.finOK(ret.echo)
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* ErreurFonc *******************************************/
export class ErreurFonc extends OperationUI {
  constructor () { super($t('OPerreurFonc')) }

  async run (texte, to) {
    try {
      this.tr(await post(this, 'ErreurFonc', { to, texte }))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* PingDB *******************************************/
export class PingDB extends OperationUI {
  constructor () { super($t('OPpingdb')) }

  async run () {
    try {
      const ret = this.tr(await post(this, 'PingDB', { }))
      this.finOK()
      return ret
    } catch (e) {
      return await this.finKO(e)
    }
  }
}
