import stores from '../stores/stores.mjs'
import { encode } from '@msgpack/msgpack'

import { OperationUI } from './operations.mjs'
import { SyncQueue } from './sync.mjs'
import { $t, setTrigramme, getTrigramme, afficherDiag, sleep } from './util.mjs'
import { post, getEstFs } from './net.mjs'
import { AMJ, ID, PINGTO, limitesjour } from './api.mjs'
import { resetRepertoire, compile, Espace, Compta, Avatar, Tribu, Synthese, Chat, NomGenerique, GenDoc, getNg, Versions } from './modele.mjs'
import { openIDB, closeIDB, deleteIDB, getCompte, getCompta, getTribu, loadVersions, getAvatarPrimaire, getColl,
  IDBbuffer, gestionFichierCnx, NLfromIDB, FLfromIDB, lectureSessionSyncIdb  } from './db.mjs'
import { crypter, random, genKeyPair } from './webcrypto.mjs'
import { FsSyncSession } from './fssync.mjs'
import { openWS, closeWS } from './ws.mjs'
import { MD, setClet } from './modele.mjs'

/* garderMode : si true, garder le mode */
export function deconnexion (garderMode) {
  const ui = stores.ui
  const session = stores.session
  const mode = session.mode
  const memoOrg = session.memoOrg
  Demon.stop()

  // fermeture de tous les dialogues et du menu de filtre
  MD.fTD()
  ui.menu = false
  ui.menug = false
  ui.aunmessage = false

  if (session.accesIdb) closeIDB()
  if (session.accesNet) {
    if (session.fsSync) session.fsSync.close(); else closeWS()
  }
  stores.reset()
  if (garderMode) session.setMode(mode)
  session.memoOrg = memoOrg
  SyncQueue.reset()
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
    if (!session.estFs) {
      await openWS()
      session.fsSync = null
    } else {
      session.fsSync = new FsSyncSession()
    }
  }
  resetRepertoire()
  stores.reset(true)
}

export class Demon {
  static courant = null
  static to = null
  
  constructor () {
    Demon.courant = this
    this.majConso = true
    if (Demon.to) { 
      clearTimeout(Demon.to)
      Demon.to = null
    }
  }

  async run () {
    const clos = await this.doTheJob()
    Demon.courant = null
    if (!clos) {
      Demon.to = setTimeout(async () => {
        await Demon.start()
      }, PINGTO * 40000)
    }
  }

  static async start () {
    const session = stores.session
    if (!session.accesNet) return
    // Lancement immédiat, sauf si déjà en exécution
    if (!Demon.courant) await new Demon().run()
  }

  static stop () {
    // L'empêche de se relancer sans interrompre son exécution en cours
    if (Demon.to)  { 
      clearTimeout(Demon.to)
      Demon.to = null
    }
  }

  // Retourne true si l'espace est clos, pour arrêter le cycle
  async doTheJob () {
    const session = stores.session
    const ntf = session.notifAdmin
    if (ntf && ntf.nr === 2) return true
    if (ntf && ntf.nr === 1) this.majConso = false

    try {
      let conso = null
      if (this.majConso) {
        const ca = session.razConsoAtt
        if (ca.nl || ca.ne || ca.vd || ca.vm)
          conso = { ...ca }
      }
      const args = { token: session.authToken, conso }
      const ret = await post(null, 'EnregConso', args)
      session.setDh(ret.dh)
      if (ret.ok) session.razConsoAtt()
    } catch (e) {
      console.log('Démon KO: ' + e.toString())
    }
    return false
  }
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
    session.setCompteId(x.id) // Important, requis pour lire ensuite compta ...
    session.setNs(ID.ns(x.id))
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
      }
      // obtention de la liste des groupes requis et signatures
      const ok = await this.groupesRequisSignatures()
      if (!ok) {
        await this.getCTA()
        continue
      }
      break
    }

    return [avRowsModifies, avToSuppr]
  }

  /** tousGroupes *******************************************************/
  async groupesRequisSignatures () { // TODO
    let procbl = false // le compte est-il en procédure de blocage
    if (this.espace.notif && this.espace.notif.niv > 2) {
      procbl = true
    } else if (this.tribu) {
      if (this.tribu.notif && this.tribu.notif.niv > 2) {
        procbl = true
      } else {
        const act = this.tribu.act[this.compta.it]
        if (act.notif && act.notif.niv > 2) {
          procbl = true
        }
      }
    } else if (this.compta.soldeC && this.compta.soldeC.solde < 0) {
      procbl = true
    }

    const session = stores.session
    // En UTC la division d'une date est multiple de 86400000
    const tjourJ = (AMJ.tDeAmjUtc(this.auj) / 86400000) + limitesjour.dlv
    const tdlv1 = (Math.floor(tjourJ / 10) + 1) * 10
    const tdlv2 = tdlv1 + 10
    // pas de signatures quand une procédure de blocage est en cours
    const dlv1 = procbl ? 0 : AMJ.amjUtcDeT(tdlv1 * 86400000)
    const dlv2 = procbl ? 0 : AMJ.amjUtcDeT(tdlv2 * 86400000)

    this.grRequis = new Set()
    this.grDisparus = new Set()

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
      avsMap[avatar.id] = { v: avatar.v, dlv: this.compta.id === avatar.id ? dlv1 : dlv2 }
      avatar.membres(mbsMap, dlv2)
    }
  
    /* Abonnements aux groupes requis
    et tant pis pour ceux finalement détectés zombi juste après
    (au pire ça fera des synchronisations qui seront ignorées)
    */
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
        { v, _zombi:true } pour un GROUPE _zombi (pas pour un avatar)
      */
      const args = { token: session.authToken, vcompta: this.compta.v, mbsMap, avsMap, abPlus }
      if (session.estFige) args.estFige = true
      const ret = this.tr(await post(this, 'SignaturesEtVersions', args))
      if (ret.OK === false) return false
      /* Traitement des _zombi
      Un avatar "disparu" est détecté largement APRES la disparition de son compta
      Un avatar "résilié par une autre session" s'est D'ABORD manifesté
      par retrait de sa map de compta. Or celle-ci n'a pas changé.
      DONC on ne peut pas retrouver d'avatars disparus ici.
      MAIS un groupe peut DISPARAITRE par l'effet du GC (sa "versions" est _zombi), 
      BIEN AVANT que la lgr de ses membres n'aient pu être mises à jour.
      On retourne un avis de DISPARITION pour les groupes détectés disparus
      */
      this.versions = {}
      for(const idx in ret.versions) {
        const x = ret.versions[idx]
        if (x._zombi) {
          const id = parseInt(idx)
          this.grRequis.delete(id)
          this.grDisparus.add(id)
          this.buf.purgeGroupeIDB(id)
        } else {
          this.versions[idx] = x
        }
      }
    } 
    
    if (session.accesIdb) await loadVersions() // chargement des versions depuis IDB
    else return Versions.reset() // Versions déjà connues en IDB, vide

    return true
  }

  async chargerGroupes () {
    const session = stores.session
    const grRows = {} // Map des rows des groupes par id du groupe
    if (session.accesIdb) {
      this.cGroupes.forEach(row => {
        if (!this.grRequis.has(row.id)) 
          this.buf.purgeGroupeIDB(row.id)
          else grRows[row.id] = row
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
          this.buf.putIDB(row)
        })
      }
    }

    /* Tous les avatars et membres sont signés avec les dlv demandées */
    for(const id in grRows) this.groupesToStore.set(parseInt(id), await compile(grRows[id]))
  }

  /** Chargement pour un avatar de ses notes postérieures à la plus récente ************/
  async chargerNotes (id, vidb, vsrv, estGr) {
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

    if (session.accesNet && vsrv > vidb) {
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
    const auj = AMJ.amjUtc()
    for (const ids in rows) {
      const note = await compile(rows[ids])
      
      if (session.accesNet && note.st < auj) { // note temporaire à supprimer
        this.buf.lsecsup.push(note)
      } else {
        if (!note._zombi) (estGr ? gSt : aSt).setNote(note)
        if (session.accesIdb) this.buf.mapSec[note.pk] = note // Pour gestion des fichiers
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
    const aSt = stores.avatar
    for (const ids in rows) {
      const chat = await compile(rows[ids])
      aSt.setChat(chat)
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
    const aSt = stores.avatar
    for (const ids in rows) {
      const sponsoring = await compile(rows[ids])
      aSt.setSponsoring(sponsoring)
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
        if (row.dlv && (row.dlv < this.auj || !groupe.ast[row.ids])) {
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
        if (row.dlv && (row.dlv < this.auj || !groupe.ast[row.ids])) {
          this.buf.supprIDB(row)
          this.mbsDisparus.add(row.ids)
        } else {
          this.buf.putIDB(row)
          rows[row.ids] = row
          n2++
        }
      }
    }
    
    const gSt = stores.groupe
    for (const ids in rows) {
      const membre = await compile(rows[ids])
      gSt.setMembre(membre)
    }
    return [n1, n2]
  }

  // MAJ dans tribu de v1 v2 de compta (si +- 10%)
  async MajTribuVols () { // this.compta this.tribu
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

  async getCTA () {
    const session = stores.session
    const aSt = stores.avatar
    /* Authentification et get de avatar / compta / tribu
    ET abonnement à compta sur le serveur
    */
    const args = { token: session.authToken }
    // Connexion : récupération de rowCompta rowAvatar fscredentials
    const ret = this.tr(await post(this, 'ConnexionCompte', args))

    if (session.fsSync && ret.credentials) {
      await session.fsSync.open(ret.credentials, ret.emulator || 0)
    }

    if (ret.admin) {           
      session.setCompteId(0)
      session.estAdmin = true
      if (ret.espaces) for (const e of ret.espaces) {
        session.setEspace(await compile(e), true)
      }
      return
    }

    this.espace = await compile(ret.rowEspace)
    if (session.estClos) return
    session.setOrg(this.espace.org)
    session.setNs(this.espace.id)

    this.rowCompta = ret.rowCompta
    session.setCompteId(this.rowCompta.id)
    this.rowAvatar = ret.rowAvatar

    if (session.fsSync) {
      /* en sql, le serveur a enregistré d'office à la connexion l'abonnement 
      au compte et à sa tribu
      mais en fs c'est à faire explicitement en session */
      await session.fsSync.setCompte(session.compteId)
    }

    session.setAvatarId(session.compteId)
    this.compta = await compile(this.rowCompta)
    this.avatar = await compile(this.rowAvatar)
    if (this.compta.rowCletK) await this.compta.compile2(this.avatar.priv)

    if (this.compta.idt) {
      const args = { token: session.authToken, id: this.compta.idt, abPlus: [this.compta.idt] }
      const ret = this.tr(await post(this, 'GetTribu', args))
      this.rowTribu = ret.rowTribu
      this.tribu = await compile(this.rowTribu)
      await this.MajTribuVols() // MAJ tribu de v1 v2 (si +- 10%)
      session.setTribuId(this.tribu.id)
      if (session.fsSync) {
        /* en sql, le serveur a enregistré d'office à la connexion l'abonnement 
        au compte et à sa tribu
        mais en fs c'est à faire explicitement en session */
        await session.fsSync.setTribu(session.tribuId)
      }
    }
  }

  async phase0Net () {
    const session = stores.session

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
        // setTrigramme(session.nombase, this.avatar.na.nomc)
      }
      lectureSessionSyncIdb()
    }
  }

  async phase0Avion () {
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
    if (this.compta.rowCletK) await this.compta.compile2(this.avatar.priv)
    session.setAvatarId(session.compteId)
  }

  /** run **********************************************************/
  async run () {
    try {
      const session = stores.session
      const aSt = stores.avatar
      const gSt = stores.groupe

      this.auj = AMJ.amjUtc()
      this.buf = new IDBbuffer()
      this.dh = 0

      if (session.avion) {
        await stores.ui.setPage('session')
        await this.phase0Avion()
      } else {
        /* Authentification et get de avatar / compta / tribu
        ET abonnement à compta sur le serveur
        */
        await this.getCTA()
        if (session.estAdmin) { // C'est une session ADMIN
          session.setMode(2)
          session.status = 3
          stores.ui.setPage('admin')
          return this.finOK()
        }
        if (session.estClos) {
          stores.ui.setPage('clos')
          return this.finOK()
        }
        await stores.ui.setPage('session')
        if (session.estComptable) session.setMode(2)
        await this.phase0Net()
      }

      this.cAvatars = session.accesIdb ? await getColl('avatars') : []
      this.avatarsToStore = new Map() // objets avatar à ranger en store
      const [avRowsModifies, avToSuppr] = await this.tousAvatars()
      /* 
      this.versions :  map pour chaque avatar / groupe de :
        { v }: pour un avatar
        { v, vols: {v1, v2, q1, q2} } : pour un groupe
      this.grDisparus : set des ids des groupes détectés disparus par leur versions zombi
        et pas encore répercutés dans la lgr de leurs avatars membres
      */
      
      /* Dans compta, cletK a peut-être été recrypté */
      if (session.accesNetNf && this.compta.cletK) {
        const args = { token: session.authToken, cletK: this.compta.cletK }
        this.tr(await post(this, 'MajCletKCompta', args))
        delete this.compta.cletK
      }

      if (session.accesIdb) {
        this.buf.putIDB(this.rowCompta)
        if (this.rowTribu) this.buf.putIDB(this.rowTribu)
        this.buf.putIDB(this.rowAvatar)
        avRowsModifies.forEach(row => { this.buf.putIDB(row) })
        avToSuppr.forEach(id => { this.buf.purgeAvatarIDB(id) })
      }

      // Rangement en store
      aSt.setCompte(this.avatar, this.compta, this.tribu)
      if (this.espace) session.setEspace(this.espace)
      
      // En cas de blocage grave, plus de synchronisation
      if (session.niv > 2 && session.mode === 1) { // TODO
        session.setMode(2)
        await afficherDiag($t('CNXdeg'))
      }

      this.avatarsToStore.forEach(av => {
        if (av.id !== this.avatar.id) aSt.setAvatar(av)
      })

      this.cGroupes = session.accesIdb ? await getColl('groupes') : []
      this.groupesToStore = new Map() 
      // compilation des rows des groupes venant de IDB ou du serveur
      await this.chargerGroupes()
  
      this.BRK()

      // MAJ intermédiaire de IDB : évite d'avoir des avatars / groupes obsolètes pour la suite
      if (session.synchro) {
        await this.buf.commitIDB(true)
        this.buf = new IDBbuffer()
      }

      if (session.accesNetNf && this.grDisparus.size) {
        /* Traitement des groupes zombis 
        Les retirer (par anticipation) des avatars qui les référencent 
        mapIdNi : Map
          - clé : id d'un avatar
          - valeur : array des ni des groupes ciblés
        */
        const mapIdNi = {}
        this.avatarsToStore.forEach(av => { 
          const ani = av.niDeGroupes(this.grDisparus)
          if (ani.length) mapIdNi[av.id] = ani
        })
        const args = { token: session.authToken, mapIdNi }
        this.tr(await post(this, 'EnleverGroupesAvatars', args))
      }

      const syncitem = stores.syncitem 
      this.avatarsToStore.forEach(av => { 
        aSt.setAvatar(av)
        syncitem.push('05' + av.id, 0, 'SYava', [av.na.nom])
      })
      this.groupesToStore.forEach(gr => { 
        gSt.setGroupe(gr) 
        syncitem.push('10' + gr.id, 0, 'SYgro', [gr.na.nom])
      })
      /* Chargement en store des versions des groupes
      this.versions N'A PAS les zombis
      */
      for(const idx in this.versions) {
        const id = parseInt(idx)
        const objv = this.versions[idx]
        if (ID.estGroupe(id)) gSt.setVols(id, objv)
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
          if (ret.rowTribus.length) for(const row of ret.rowTribus) {
            const tribu = await compile(row)
            ltr.delete(tribu.id)
            aSt.setTribu(tribu)
            this.buf.putIDB(row)
          }
          delids.forEach(id => { this.buf.supprIDB({ _nom: 'tribus', id: id })})
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
      notes, chats, sponsorings, membres trouvés en IDB
      */
      this.cNotes = session.accesIdb ? await getColl('notes') : []
      this.cChats = session.accesIdb ? await getColl('chats') : []
      this.cSponsorings = session.accesIdb ? await getColl('sponsorings') : []
      this.cMembres = session.accesIdb ? await getColl('membres') : []

      // Itération sur chaque avatar: notes, chats, sponsorings
      for (const [,e] of aSt.map) {
        const avatar = e.avatar
        const vidb = Versions.get(avatar.id).v
        const objv = this.versions && this.versions[avatar.id] ? this.versions[avatar.id] : { v: 0 }
        const vsrv = objv.v
        if (vidb < vsrv) Versions.set(avatar.id, objv)

        const na = getNg(avatar.id)
        let n1 = 0, n2 = 0, n3 = 0, n4 = 0, n5 = 0, n6 = 0
        const [x1, x2] = await this.chargerNotes(avatar.id, vidb, vsrv, false)
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
      }

      // Itération sur chaque groupe: notes, membres
      for (const [,eg] of gSt.map) {
        const groupe = eg.groupe
        const objidb = Versions.get(groupe.id)
        const vidb = objidb.v
        const objv = this.versions && this.versions[groupe.id] ? this.versions[groupe.id] : 
          { v: 0, vols: { v1: 0, v2: 0, q1: 0, q2: 0 } }
        const vsrv = objv.v
        if (vidb < vsrv) {
          Versions.set(groupe.id, objv)
        } else {
          gSt.setVols(groupe.id, objidb)
        }

        this.mbsDisparus = new Set()
        let n1 = 0, n2 = 0, n3 = 0, n4 = 0
        const na = getNg(groupe.id)

        const [x3, x4] = await this.chargerMembres(groupe, vidb, vsrv)
        n3 = x3
        n4 = x4
        syncitem.push('10' + na.id, 1, 'SYgro2', [na.nom, n1, n2, n3, n4])

        const [x1, x2] = await this.chargerNotes(groupe.id, vidb, vsrv, true)
        n1 = x1
        n2 = x2
        syncitem.push('10' + na.id, 1, 'SYgro2', [na.nom, n1, n2, n3, n4])

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
      if (session.accesNetNf) {
        /* Suppression des notes temporaires ayant dépassé leur date limite */
        if (this.buf.lsecsup.length) {
          for (const s of this.buf.lsecsup) {
            try {
              const args = { token: session.authToken, id: s.id, ids: s.ids, idc: s.idCompta }
              this.tr(await post(this, 'SupprNote', args))
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
        // Gestion du presse-papier, notes et fichiers locaux
        await NLfromIDB()
        await FLfromIDB()
      }

      if (session.estComptable) {
        await new TraitGcvols().run()
      }

      // enregistre l'heure du début effectif de la session
      if (session.synchro) await session.sessionSync.setConnexion(this.dh)
      console.log('Connexion compte : ' + this.compta.id)
      session.status = 2
      SyncQueue.traiterQueue()
      await Demon.start()
      await sleep(500)
      if (session.niv || session.alirentf) {
        stores.ui.setPage('compta', 'notif')
      } else {
        stores.ui.setPage('accueil')
      }
      this.finOK()
    } catch (e) {
      stores.ui.setPage('login')
      return await this.finKO(e)
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
act: élément de la map act de sa tribu
SI quotas à prélever sur le COMPTE du sponsor
  args.it : index de ce compte dans la tribu
  args.q1 q2 : quotas attribués par le sponsor.

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
    - 'cletX' : cle de sa tribu cryptée par clé K du comptable
    - `clet` : cle de sa tribu.
    - `it` : it du sonsor dans sa tribu s'il faut lui réduire ses quotas
    ardx : reponse cryptée par la cleX du sponsoring
    reponse : texte du sponsorisé
    ps: phrase secrète du nouveau compte
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

      /* Réenregistrement dans repertoire des na créé en PageLogin */
      NomGenerique.from(sp.na.anr)
      NomGenerique.from(sp.naf.anr)
      const idt = setClet(sp.clet)

      session.setCompteId(sp.naf.id)
      session.setTribuId(idt)
      session.setAvatarId(session.compteId)

      const { publicKey, privateKey } = await genKeyPair()

      // !!! dans rowCompta: it (indice du compte dans sa tribu) N'EST PAS inscrit
      // (na, clet, cletX, q1, q2, estSponsor, phrase)
      let rowCompta = await Compta.row(sp.naf, sp.clet, sp.cletX, sp.quotas, sp.sp) 
      // set de session.clek
      const rowAvatar = await Avatar.primaireRow(sp.naf, publicKey, privateKey)
      const rowVersion = {
        id: sp.naf.id,
        v: 1,
        dlv: AMJ.amjUtcPlusNbj(this.auj, limitesjour.dlv)
      }
      const _data_ = new Uint8Array(encode(rowVersion))
      rowVersion._data_ = _data_
      rowVersion._nom = 'versions'

      /* Element de act de tribu du nouveau compte
      - `idT` : id court du compte crypté par la clé de la tribu.
      - `sp` : est sponsor ou non.
      - `stn` : statut de la notification _du compte_: _aucune simple bloquante_
      - `q1 q2` : quotas attribués.
      - `v1 v2` : volumes **approximatifs** effectivement utilisés
      */
      const act = {
        idT: await crypter(sp.clet, '' + ID.court(sp.naf.id)),
        nasp: sp.sp ? await crypter(sp.clet, new Uint8Array(encode(sp.naf.anr))) : null,
        notif: null,
        stn: 0,
        q1: sp.quotas[0],
        q2: sp.quotas[1],
        v1: 0,
        v2: 0
      }

      // chatI : chat pour le compte, chatE : chat pour son sponsor
      const cc = random(32)
      const dh = Date.now()
      const contcI = await Chat.getContc(sp.na, dh, txt, cc)
      const contcE = await Chat.getContc(sp.naf, dh, txt, cc)

      const pubE = await aSt.getPub(sp.na.id)
      if (!pubE) throw new AppExc(F_BRO, 7)

      // (naI, naE, contc, cc, pubE, mc)
      const rowChatI = await Chat.nouveauRow(sp.naf, sp.na, contcI, cc, null, new Uint8Array([252])) 
      const rowChatE = await Chat.nouveauRow(sp.na, sp.naf, contcE, cc, pubE, new Uint8Array([253])) 

      const args = { token: stores.session.authToken, rowCompta, rowAvatar, rowVersion, ids: sp.ids,
        rowChatI, rowChatE, ardx, idt, act, 
        it: sp.it || 0, 
        q1: sp.it ? sp.quotas[0] : 0,
        q2: sp.it ? sp.quotas[1] : 0,
        abPlus: [idt, sp.naf.id] }
      const ret = this.tr(await post(this, 'AcceptationSponsoring', args))
      // Retourne: credentials, rowTribu

      const espace = await compile(ret.rowEspace)
      session.setEspace(espace)
      if (session.estClos) {
        this.ui.setPage('clos')
        this.finOK()
      }

      if (session.fsSync && ret.credentials) {
        await session.fsSync.open(ret.credentials, ret.fsEmulator || 0)
      }
  
      const rowTribu = ret.rowTribu
      const rowChat = ret.rowChat
      const rowEspace = ret.rowEspace
      rowCompta = ret.rowCompta
      session.setOrg(rowEspace.org)

      // Le compte vient d'être créé, clek est enregistrée par la création de rowCompta
      const compta = await compile(rowCompta)
      const avatar = await compile(rowAvatar)
      const tribu = await compile(rowTribu)

      aSt.setCompte(avatar, compta, tribu)

      const chat = await compile(rowChat)
      aSt.setChat(chat)

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
          this.buf.putIDB(rowTribu)
          await this.buf.commitIDB(true, true) // MAJ compte.id / cle K et versions
          await session.sessionSync.setConnexion(this.dh)
        } catch(e) {
          session.mode = 2
          await afficherDiag(this.$t('LOGnoidb'))
        }
      }
  
      if (session.fsSync) {
        /* sql, le serveur a enregistré d'office à la connexion l'abonnement 
        au compte et à sa tribu
        mais en fs c'est à faire explicitement en session */
        await session.fsSync.setCompte(session.compteId)
        await session.fsSync.setTribu(session.tribuId)
      }

      console.log('Connexion compte : ' + session.compteId)
      session.status = 2
      SyncQueue.traiterQueue()
      await Demon.start()
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
      return await this.finKO(e)
    }
  }
}

/* Prologer un sponsoring
args.id ids : identifiant du sponsoring
args.dlv : nouvelle dlv (0 == annulation)
*/
export class ProlongerSponsoring extends OperationUI {
  constructor () { super($t('OPprosp')) }

  async run (sp, dlv) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id: sp.id, ids: sp.ids, dlv }
      await post(this, 'ProlongerSponsoring', args)
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Création d'un nouvel espace et du comptable associé
args.token donne les éléments d'authentification du compte.
args.rowEspace : espace créé
args.rowAvatar, rowTribu, rowCompta du compte du comptable
args.rowVersion: version de l'avatar (avec sa dlv) 
args.rowTribu
Retour: rien. Si OK le rowEspace est celui créé en session
*/
export class CreerEspace extends OperationUI {
  constructor () { super($t('OPcre')) }

  async run (org, phrase) {
    try {
      const hps1 = phrase.hps1
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
      const rowCompta = await Compta.row(na, clet, null, aco, true, phrase)
      // set de session.clek
      const rowTribu = await Tribu.nouvelle(idt, apr, true, aco)

      const { publicKey, privateKey } = await genKeyPair()
      const rowAvatar = await Avatar.primaireRow(na, publicKey, privateKey)

      const r = {
        id: na.id,
        v: 1,
        dlv: AMJ.amjUtcPlusNbj(AMJ.amjUtc(), limitesjour.dlv)
      }
      const _data_ = new Uint8Array(encode(r))
      r._data_ = _data_
      r._nom = 'versions'

      const args = { token: stores.session.authToken, rowEspace, rowSynthese, rowTribu,
        rowCompta, rowAvatar, rowVersion: r, hps1 }
      this.tr(await post(this, 'CreerEspace', args))
      
      const espace = await compile(rowEspace)
      session.setEspace(espace) // Maj de la map espaces

      this.finOK()
    } catch (e) {
      stores.ui.setPage('login')
      return await this.finKO(e)
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

/* Get de l'espace du compte de la session *****************************************************
args.token donne les éléments d'authentification du compte.
args.ns
Retour:
- rowEspace
*/
export class GetEspace extends OperationUI {
  constructor () { super($t('OPsetesp')) }

  async run (ns) {
    try {
      const session = stores.session
      const args = { token: session.authToken, ns: ns || session.ns }
      const ret = this.tr(await post(this, 'GetEspace', args ))
      const espace = await compile(ret.rowEspace)
      if (espace) session.setEspace(espace)
      return this.finOK(espace)
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Traitement des gcvols **********************************************
*/
export class TraitGcvols extends OperationUI {
  constructor () { super('OPgcvols') }

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
      return await this.finKO(e)
    }
  }
}

export class GetEstFs extends OperationUI {
  constructor () { super($t('OPestFs')) }

  async run () {
    try {
      const session = stores.session
      if (session.accesNet) {
        const estFs = await getEstFs()
        session.setEstFs(estFs)
      } else {
        session.setEstFs(false)
      }
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}
