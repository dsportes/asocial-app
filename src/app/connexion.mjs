import stores from '../stores/stores.mjs'

import { OperationUI } from './operations.mjs'
import { $t, difference, tru8, u8ToHex, getTrigramme, setTrigramme, afficherDiag, getBlocage, hash } from './util.mjs'
import { post } from './net.mjs'
import { DateJour } from './api.mjs'
import { serial } from './schemas.mjs'
import { NomAvatar } from './modele.mjs'
import { resetRepertoire, initConnexion, deconnexion, compileToMap, compile, setSecret, setCv, getCv, delCv, setNg, Compte, Compta, Prefs, Avatar, NomTribu } from './modele.mjs'
import { openIDB, closeIDB, deleteIDB, getCompte, getCvs, commitRows,
  getVIdCvs, lectureSessionSyncIdb, saveListeCvIds, gestionFichierCnx, TLfromIDB, FLfromIDB } from './db.mjs'
import { genKeyPair, crypter } from './webcrypto.mjs'

export async function reconnexion () {
  deconnexion(3)
  connecterCompte (stores.session.phrase, false) 
}

export async function connecterCompte (phrase, razdb) {
  if (!phrase) return
  const session = stores.session
  session.phrase = phrase
  session.setAuthToken()

  const lsk = '$asocial$-' + phrase.dpbh
  if (stores.config.debug) console.log(lsk)
  const nb = localStorage.getItem(lsk)
  session.nombase = nb || ''
  session.statutIdb = false
  resetRepertoire()
  stores.reset()

  if (session.avion) {

    // session avion
    if (!session.nombase) {
      await afficherDiag($t('OPmsg1'))
      return
    }
    try {
      await openIDB()
    } catch (e) {
      await afficherDiag($t('OPmsg2', [e.message]))
      return
    }
    try {
      const x = await getCompte() // x:false ou { id, k }
      if (!x) throw new AppExc(F_BRO, 2)
      session.compteId = x.id
      session.clek = x.k
      await new ConnexionCompte().run()
    } catch (e) {
      afficherDiag($t('OPmsg3', [e.message]))
      await deleteIDB()
    }

  } else {

    // session synchronisée ou incognito
    if (session.synchro && session.nombase && razdb) await deleteIDB()
    let dbok = false
    if (session.synchro && session.nombase) {
      try {
        await openIDB()
        const x = await getCompte()
        if (x) {
          // Entête compte lu et décrypté par la phrase secrète
          session.compteId = x.id
          session.clek = x.k
        } else {
          session.compteId = 0
          session.clek = null
          session.nombase = ''
        }
      } catch (e) { }
      if (!session.nombase) {
        closeIDB()
        await deleteIDB()
      }
    }
    await new ConnexionCompte().run()

  }
}

/**********************************************************************************
Opération de connexion à un compte par sa phrase secrète (synchronisé et incognito)
**********************************************************************************/

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
    this.lsecsup = [] // liste des fichiers temporaires à faire supprimer sur le serveur en fin de connexion
  }

  putIDB (obj) { this.lmaj.push(obj) }
  supprIDB (obj) { this.lsuppr.push(obj) } // obj : {table, id, (sid2)}
  async commitIDB () { await commitRows(this) }

  async gestionFichierCnx () {
    await gestionFichierCnx(this.mapSec)
  }
}

export class ConnexionCompte extends OperationUI {
  constructor () { super($t('OPcnx')) }

  async membresDisparus (disp) {
    /* ce n'est pas le membre qui disparaît mais son statut qui indique 5 (disparu) */
    const session = stores.session
    const lst = []
    for (let i = 0; i < disp.length; i++) {
      const args = { sessionId: session.sessionId, id: disp[i][0], im: disp[i][1] }
      const ret = this.tr(await post(this, 'm1', 'membreDisparu', args))
      const r = await compileToMap(ret.rowItems)
      if (r.membre) for (const pk of r.membre) lst.push(r.membre[pk])
    }
    return lst
  }

  async couplesDisparus (disp) {
    /* ce n'est pas le couple qui disparaît mais son statut qui indique 5000 (disparu) */
    const session = stores.session
    const couple = stores.couple
    const lst = []
    for (let i = 0; i < disp.length; i++) {
      const id = disp[i]
      const c = couple.getCouple(id)
      const args = { sessionId: session.sessionId, id, idx: c.avc ? 1 : 0 }
      const ret = this.tr(await post(this, 'm1', 'coupleDisparu', args))
      const r = await compileToMap(ret.rowItems)
      if (r.couple) for (const pk of r.couple) lst.push(r.couple[pk])
    }
    return lst
  }

  /* 
  Obtention de compte / prefs / tribu depuis le serveur
  RAZ des abonnements et abonnement au compte
  */
  async chargerCP () {
    const sessionId = this.session.sessionId
  
    const args = { sessionId, pcbh: this.session.phrase.pcbh, dpbh: this.session.phrase.dpbh }
    const ret = this.tr(await post(this, 'm1', 'connexionCompte', args))
    this.session.clepubc = ret.clepubc
    tru8('Pub Comptable session.clepubc', this.session.clepubc)
    const compte = await compile(ret.rowCompte)
    this.session.setCompte(compte) // nécessaire pour complier les autres objets
    const prefs = await compile(ret.rowPrefs)
    const compta = await compile(ret.rowCompta)
    
    let tribu = null
    if (compte.nat) {
      const args = { sessionId, id: compte.nat.id }
      const ret = this.tr(await post(this, 'm1', 'chargerTribus', args))
      if (ret.rowItems.length) {
        const m = await compileToMap(ret.rowItems)
        tribu = m.tribu ? m.tribu[compte.nat.id] : null
      }
    }
    return [compte, prefs, tribu, compta]
  }

  /* Recharge depuis le serveur les avatars du compte, abonnement aux avatars */
  async chargerAvatars (idsVers, cptidsVers, idc, vc) {
    const args = { sessionId: this.session.sessionId, idsVers, cptidsVers, idc, vc }
    const ret = this.tr(await post(this, 'm1', 'chargerAvatars', args))
    if (!ret.ok) return [false, false]
    if (!ret.rowItems.length) return [{}, {}]
    const r = await compileToMap(ret.rowItems)
    return [r.avatar || {}, r.compta || {}]
  }

  /* Maj de v1c et v2c dans la compta du compte s'il a plusieurs avatars
  */
  async majComptaP (comptas) {
    const ids = this.compte.avatarIds()
    if (ids.size === 1) return
    let v1c = 0, v2c = 0, v1ca = 0, v2ca = 0
    ids.forEach(id => {
      const compta = comptas[id]
      const c = compta.compteurs
      if (id === this.compte.id) { v1ca = c.v1c; v2ca = c.v2c }
      v1c += c.v1
      v2c += c.v2
    })
    if (v1c !== v1ca || v2c !== v2ca) {
      const args = { sessionId: this.session.sessionId, idc: this.compte.id, v1c, v2c }
      const ret = this.tr(await post(this, 'm1', 'majComptaP', args))
      if (ret.rowItems.length) {
        const r = await compileToMap(ret.rowItems)
        const cn = r.compta[this.compte.id]
        if (cn) comptas[this.compte.id] = cn
      }
    }
  }

  /* 
  Récupération des avatars cités dans le compte
  Depuis IDB : il peut y en avoir trop et certains peuvent manquer et d'autres avoir une version dépassée
  Abonnement aux avatars
  Retourne false si la version du compte a changé depuis la phase 0
  */
  async phase1 () {
    const idb = this.session.accesIdb
    const net = this.session.accesNet
    this.avatars = idb ? await getAvatars() : {}
    this.comptas = idb ? await getComptas() : {}
    const setidbav = new Set(); for (const id in this.avatars) setidbav.add(parseInt(id))
    const avrequis = this.compte.avatarIds()
    this.nbAvatars = avrequis.size
    this.buf.lav = difference(setidbav, avrequis) // avatars en IDB NON requis (à supprimer de IDB)
    this.buf.lav.forEach(id => {
      delete this.avatars[id]
      delete this.comptas[id]
    })
    const avidsVers = {}
    avrequis.forEach(id => { const av = this.avatars[id]; avidsVers[id] = av ? av.v : 0 })
    const cptidsVers = {}
    avrequis.forEach(id => { const cpt = this.comptas[id]; cptidsVers[id] = cpt ? cpt.v : 0 })
    const [avnouveaux, cptnouveaux] = !net ? [{}, {}] : await this.chargerAvatars(avidsVers, cptidsVers, this.compte.id, this.compte.v)
    if (avnouveaux === false) return false// le compte a changé de version, reboucler
    // avnouveaux contient tous les avatars ayant une version plus récente que celle (éventuellement) obtenue de IDB
    for (const pk in avnouveaux) { const av = avnouveaux[pk]; this.buf.putIDB(av); this.avatars[av.id] = av }
    for (const pk in cptnouveaux) { const cpt = cptnouveaux[pk]; this.buf.putIDB(cpt); this.comptas[cpt.id] = cpt }

    if (this.session.accesNet) await this.majComptaP(this.comptas)

    const avatarStore = stores.avatar
    const syncitem = stores.syncitem

    // avatars contient la version au top des objets avatars du compte requis et seulement eux
    Object.values(this.avatars).forEach(av => {
      avatarStore.setAvatar(av)
      syncitem.push('05' + av.id, 0, 'SYava', [av.na.nom]) 
    })
    
    for(const id in this.comptas)  avatarStore.setCompta(this.comptas[id])

    return true
  }

  /* Recharge depuis le serveur les groupes et couples des avatars du compte, abonnements et signatures */
  async chargerGroupesCouples (gridsVers, cpidsVers, avidsVers, idc, vc, sign) {
    const args = { sessionId: stores.session.sessionId, gridsVers, cpidsVers, avidsVers, idc, vc, sign }
    const ret = this.tr(await post(this, 'm1', 'chargerGrCp', args))
    if (!ret.ok) return false
    const r = await compileToMap(ret.rowItems)
    return [r.groupe || {}, r.couple || {}]
  }

  /* abonnements 2 des couples accédant aux secrets */
  async aboCpSec (lids) {
    const args = { sessionId: stores.session.sessionId, lids }
    await post(this, 'm1', 'aboCpSec', args)
  }

  /* 
  Récupération de tous les couples et les groupes cités dans les avatars du compte
  Depuis IDB : il peut y en avoir trop et certains peuvent manquer et d'autres avoir une version dépassée
  Abonnement aux couples et groupes
  Retourne false si une des versions des avatars a changé depuis la phase 1, ou si la version du compte a changé
  */
  async phase2 (sign) {
    const idb = this.session.accesIdb
    const net = this.session.accesNet

    const avidsVers = {}
    const grrequis = new Set()
    const cprequis = new Set()
    for (const id in this.avatars) {
      const av = this.avatars[id]
      avidsVers[av.id] = av.v
      av.groupeIds(grrequis)
      av.coupleIds(cprequis)
    }

    this.nbGroupes = grrequis.size
    this.nbCouples = cprequis.size

    this.groupes = idb ? await getGroupes() : {}
    const setidbgr = new Set(); for (const id in this.groupes) setidbgr.add(parseInt(id))

    this.couples = idb ? await getCouples() : {}
    for (const id in this.couples) { this.couples[id].setRepE() }
    const setidbcp = new Set(); for (const id in this.couples) setidbcp.add(parseInt(id))

    this.buf.lgr = difference(setidbgr, grrequis) // groupes en IDB NON requis (à supprimer de IDB)
    this.buf.lgr.forEach(id => {
      delete this.groupes[id]
    })

    this.buf.lcc = difference(setidbcp, cprequis) // couples en IDB NON requis (à supprimer de IDB)
    this.buf.lcc.forEach(id => {
      delete this.couples[id]
    })

    const gridsVers = {}
    grrequis.forEach(id => { const obj = this.groupes[id]; gridsVers[id] = obj ? obj.v : 0 })
    const cpidsVers = {}
    cprequis.forEach(id => { const obj = this.couples[id]; cpidsVers[id] = obj ? obj.v : 0 })

    const x = !net ? [{}, {}] : await this.chargerGroupesCouples(gridsVers, cpidsVers, avidsVers, this.compte.id, this.compte.v, sign)
    if (x === false) return false // le compte ou les avatars ont changé de version

    const [grnouveaux, cpnouveaux] = x
    // grnouveaux contient tous les groupes ayant une version plus récente que celle (éventuellement) obtenue de IDB
    const zombis = new Set()
    for (const pk in grnouveaux) {
      const gr = grnouveaux[pk]
      if (!gr.estZombi) {
        this.buf.putIDB(gr)
        this.groupes[gr.id] = gr
      } else {
        zombis.add(gr.id)
        this.buf.lgr.add(gr.id)
      }
    }
    if (zombis.size) await this.groupesZombis(zombis)

    // groupes contient la version au top des objets groupes du compte requis par ses avatars et seulement eux
    const groupeStore = stores.groupe
    const syncitemStore = stores.syncitem
    Object.values(this.groupes).forEach(obj => {
      syncitemStore.push('10' + obj.id, 0, 'SYgro', [obj.na.nom])
      groupeStore.setGroupe(obj)
    })

    // cpnouveaux contient tous les couples ayant une version plus récente que celle (éventuellement) obtenue de IDB
    for (const pk in cpnouveaux) {
      const cp = cpnouveaux[pk]
      this.buf.putIDB(cp)
      this.couples[cp.id] = cp
    }

    // couples contient la version au top des objets couples du compte requis par ses avatars et seulement eux
    const coupleStore = stores.couple
    const idCpSecs = [] // id des couples accédant aux secret
    Object.values(this.couples).forEach(cp => { 
      if (net && cp.stI === 1) idCpSecs.push(cp.id)
      syncitemStore.push('15' + cp.id, 0, 'SYcou', [cp.na.nom])
      coupleStore.setCouple(cp)
    })

    if (net && idCpSecs.length) await this.aboCpSec(idCpSecs)
    return true
  }

  /* 
  Recharge depuis le serveur tous les secrets d'id (avatar / couple / groupe) donnée et de version postérieure à v
  Remplit aussi la liste des secrets à mettre à jour et à supprimer de IDB
  Un secret peut être supprimé : s'il figurait dans la source, il y est enlevé
  */
  async chargerSc (id, v, src, cpl) {
    const session = stores.session
    const ret = this.tr(await post(this, 'm1', 'chargerSc', { sessionId: session.sessionId, id, v, cpl }))
    if (ret.rowItems.length) {
      const r = await compileToMap(ret.rowItems)
      if (r.secret) {
        for (const pk in r.secret) {
          const s = r.secret[pk]
          if (s.suppr) {
            if (src[id] && src[id][s.ns]) delete src[id][s.ns]
            this.buf.supprIDB({ table: 'secret', id: id, id2: s.ns })
          } else {
            let e = src[id]; if (!e) { e = {}; src[id] = e }
            e[s.ns] = s
            this.buf.putIDB(s)
          }
        }
      }
    }
  }

  /* 
  Recharge depuis le serveur tous les membres d'id de groupe donnée et de version postérieure à v
  Remplit aussi la liste des membres à mettre à jour en IDB
  */
  async chargerMb (id, v, src) {
    const session = stores.session
    const ret = this.tr(await post(this, 'm1', 'chargerMb', { sessionId: session.sessionId, id, v }))
    if (ret.rowItems.length) {
      const r = await compileToMap(ret.rowItems)
      if (r.membre) {
        for (const pk in r.membre) {
          const m = r.membre[pk]
          let e = src[id]; if (!e) { e = {}; src[id] = e }
          e[m.im] = m
          this.buf.putIDB(m)
        }
      }
    }
  }

  /* 
  Récupération des membres et secrets requis par les avatars / couples / groupes
  Récupération depuis IDB (éventuellement) des membres et secrets stockés
  - groupés par id de l'objet maître
  - avec la version la plus récente par objet maître
  - sidms : set des id *maître* des secrets récupérés de IDB (avatar, couple, groupe)
  */
  async phase3 () {
    const session = stores.session
    const idb = session.accesIdb
    const net = session.accesNet
    const syncitemStore = stores.syncitem

    const groupeStore = stores.groupe

    const [membres, vmbIdb] = idb ? await getMembres() : [{}, {}]
    const [secrets, vscIdb, sidms] = idb ? await getSecrets() : [{}, {}, new Set()]

    /* 
    Récupération depuis le serveur des versions plus récentes des secrets et membres
    pour chaque objet maître et qu'il y en ait eu ou non trouvée en IDB
    */
    for (const idx in this.avatars) {
      const id = parseInt(idx)
      const av = this.avatars[id]
      if (net) await this.chargerSc(id, vscIdb[id] || 0, secrets)
      const nbs = secrets[id] ? Object.keys(secrets[id]).length : 0
      syncitemStore.push('05' + av.id, 1, 'SYas', [av.na.nom, nbs])
    }

    for (const idx in this.groupes) {
      const id = parseInt(idx)
      const gr = this.groupes[id]
      if (net) await this.chargerSc(id, vscIdb[id] || 0, secrets)
      const nbs = secrets[id] ? Object.keys(secrets[id]).length : 0
      syncitemStore.push('10' + gr.id, 0, 'SYgr', [gr.na.nom, nbs])
      if (net) await this.chargerMb(id, vmbIdb[id] || 0, membres)
      const nbm = membres[id] ? Object.keys(membres[id]).length : 0
      syncitemStore.push('10' + gr.id, 1, 'SYgrm', [gr.na.nom, nbs, nbm])
    }

    for (const idx in this.couples) {
      const id = parseInt(idx)
      const cp = this.couples[id]
      if (cp.stI === 1) { // l'avatar du compte du couple accède aux secrets
        if (net) await this.chargerSc(id, vscIdb[id] || 0, secrets, true)
      } else { // secrets inutiles, ne sont pas / plus accédés
        delete secrets[id]
        if (sidms.has(id)) this.buf.lcc2.add(id)
      }
      const nbs = secrets[id] ? Object.keys(secrets[id]).length : 0
      syncitemStore.push('15' + cp.id, 1, 'SYcs', [cp.nomc, nbs])
    }

    /* Mise à jour du modèle */
    for (const id in membres) {
      const mx = membres[id]
      for (const im in mx) {
        const m = mx[im]
        groupeStore.setMembre(m)
      }
    }

    const auj = new DateJour().nbj
    for (const id in secrets) {
      const sx = secrets[id]
      for (const ns in sx) {
        const s = sx[ns]
        if (net && s.st < auj) { // secret temporaire à supprimer
          this.buf.lsecsup.push(s)
        } else {
          setSecret(s)
          if (idb) this.buf.mapSec[s.pk] = s // Pour gestion des fichiers
        }
      }
    }
  }

  /* Récupérer les "people", synchroniser leurss CVs et s'y abonner:
  - élément externe d'un couple
  - membre d'un groupe
  - parrain de la tribu (pas si comptable)
  */
  async syncCVs () {
    const people = stores.people
    const idb = stores.session.accesIdb
    const net = stores.session.accesNet
    const syncitemStore = stores.syncitem

    /*
    liste des avatars externes collectés :
    - depuis les membres des groupes (en excluant les avatars internes)
    - depuis les couples, leurs avatars externes
    */

    // ids des avatars people (membres, contacts, parrains "people" de la tribu)
    const cvIds = new Set(people.getIds)

    // avatars du compte
    stores.session.compte.avatarIds(cvIds)

    // groupes du compte (ils ont une CV)
    const groupe = stores.groupe
    for (const id of groupe.getIds) {
      const gr = groupe.getGroupe(id)
      if (!gr.estZombi) cvIds.add(id)
    }

    const nb = cvIds.size
    syncitemStore.push('20', 0, 'SYcv', [nb])

    const n1 = this.buf.lsuppr.length
    /* Récupère de IDB dans cvs les CV trouvées. 
    A ajouter dans buf supprIDB celles trouvées et inutiles */
    const cvs = idb ? await getCvs(cvIds, this.buf) : {}
    const nbsuppr = n1 - this.buf.lsuppr.length
    syncitemStore.push('20', 0, 'SYcv2', [nb, nbsuppr])

    const [vcv, ids] = idb ? await getVIdCvs() : [0, new Set()]
    let nv = 0
    let n = 0

    if (net) { // Récupération des CVs mises à jour et disparues
      // séparation des ids en l1 (celles après vcv) et celles sans filtre de version
      const l1 = [], // ids des CV détenues à date v (chargement si plus récente)
      l2 = [], // ids des CV non détenues (chargement forçé)
      axdisparus = new Set(),  // avatars externes disparus
      cpdisp = [],  // couples disparus
      mbdisp = []   // membres disparus

      cvIds.forEach(id => { if (ids.has(id)) l1.push(id); else l2.push(id) })
      const chg = await this.chargerCv(l1, l2, vcv)
      // traitement des CVs changées / disparues
      for (const id in chg) {
        const cv = chg[id]
        n++
        if (cv.x) { // disparu
          if (!getDisparu(cv.id)) { setDisparu(cv.id); axdisparus.add(cv.id) }
          cvs[cv.id] = { id: cv.id, cv: null }
          this.buf.supprIDB({ table: 'cv', id: cv.id })
        } else { // à stocker en IDB, rafraîchie
          if (cv.v > nv) nv = cv.v
          cvs[cv.id] = cv
          this.buf.putIDB(cv)
        }
      }
      if (axdisparus.size) {
        // Traitement des Ax disparus
        const people = stores.people
        axdisparus.forEach(id => {
          people.getCpIds(id).forEach(idc => { cpdisp.push(idc) })
          people.getMbIds(id).forEach(idgim => { mbdisp.push(idgim) })
          people.del(id)
        })
      }

      // Traitement des chgt de statut dans membres et couples
      if (mbdisp.length) {
        const groupe = stores.groupe
        const lst = await this.membresDisparus(mbdisp)
        lst.forEach(obj => {
          groupe.setMembre(obj)
          this.buf.putIDB(obj)
        })
      }
      if (cpdisp.length) {
        const couple = stores.couple
        const lst = await this.couplesDisparus(cpdisp)
        lst.forEach(obj => {
          couple.setCouple(obj)
          this.buf.putIDB(obj)
        })
      }

      for(const id in cvs) setCv(cvs[id]) // stockage en store
    }

    let nmaj = 0
    let nsup = 0
    const lst = []
    for(const id in cvs) {
      const cv = cvs[id]
      const cvx = getCv(id)
      if (cv.cv) {
        const eq = cvx && cvx.cv && (cv.cv[0] === cvx.cv[0]) && (cv.cv[1] === cvx.cv[1])
        if (!eq) { nmaj++; setCv(cv) }
      } else {
        if (cvx && cvx.cv) { nsup++; delCv(cv.id) }
      }
      if (idb && cv.v > 0) lst.push(cv.id)
    }

    if (idb) await saveListeCvIds(nv > vcv ? nv : vcv, lst)

    syncitemStore.push('20', 1, 'SYcv3', [nb, nmaj, nsup])
  }

  async phase0 (compte, dbok) { // compte / prefs / tribu / compta du compte: abonnement à compte
    let prefs = null
    let tribu = null

    if (this.session.avion) {

      // avion
      this.compte = compte
      this.session.setCompte(this.compte)
      this.session.estComptable = false
      prefs = await getPrefs()
      if (compte.nat) { // le Comptable n'étant jamais en mode avion, compte.nat est de fait toujours défini ici
        const tribus = await getTribus()
        tribu = tribus[compte.nat.id]
      }

    } else {
      
      // synchronisé ou incognito
      const [compteSrv, prefsSrv, tribuSrv, comptaSrv] = await this.chargerCP()
      /* 
      chargerCP est sorti en exception si non authentifié
      comptaSrv ne va servir qu'à établir le statut de blocage
      */
      if (this.session.phrase.pcbh !== compteSrv.pcbh) throw new AppExc(F_BRO, 1) // Changement de phrase secrète
      this.compte = compteSrv
      this.session.setCompte(this.compte)
      this.session.estComptable = this.compte.estComptable
      if (this.compte.estComptable) {
        this.session.mode = 2
        this.session.statutIdb = false
      }
      this.session.nombase = this.compte.estComptable ? null : await this.compte.getNombase()
      prefs = prefsSrv
      tribu = tribuSrv

      await getBlocage(tribu, comptaSrv)

      if (this.session.synchro) {
        if (this.session.blocage === 4) this.session.mode = 2
        if (!dbok) await openIDB()
        this.buf.putIDB(this.compte)
        this.buf.putIDB(prefs)
        if (tribu) this.buf.putIDB(tribu)
      }

    }

    // Tous modes
    this.session.setPrefs(prefs)

    const avids = this.compte.avatarIds()
    const storeTribu = stores.tribu
    const peopleSt = stores.people

    function storeTrPa (t) {  // enregistrement d'une tribu et de ses parrains "people"
      storeTribu.setTribu(t)
      t.naParrains.forEach(na => {
        if (!avids.has(na.id)) { // c'est un "people" pas un avatar du compte
          setNg(na)
          peopleSt.setNa(na)
          peopleSt.setParrain(na.id, true)
        }
      })
    }

    if (this.session.estComptable) { // chargement de toutes les tribus
      const ret = this.tr(await post(this, 'm1', 'chargerTribus', { sessionId: this.session.sessionId }))
      if (ret.rowItems.length) {
        const m = await compileToMap(ret.rowItems)
        if (m.tribu) for(const t in m.tribu) storeTrPa(m.tribu[t])
      }
    } else {
      if (tribu) storeTrPa(tribu)
    }


    await lectureSessionSyncIdb() // dans session.sessionSync (vide en incognito)
    this.session.status = 1
    stores.syncitem.push('01', 1, 'SYcpt')
  }

  /*
  compte : n'est connu qu'en mode avion et dans ce cas la base a déjà été ouverte
  En mode synchronisé la base sera ouverte en phase 0 quand le compte sera connu
  dbok : la base a déjà été ouverte
  - en mode avion
  - en mode synchro si la base existait (sinon elle sera créée à la fin)
  */
  reset () {
    this.buf = new OpBufC()
    this.dh = 0
    this.session.blocage = 0
  }

  async run (compte, dbok) {
    try {
      this.session = stores.session
      let idb = this.session.accesIdb
      const net = this.session.accesNet

      await initConnexion()
      this.reset()

      if (this.session.avion) {
        // compte est défini et dbok est true
        // obtention du compte / prefs / tribu / compta du compte
        await this.phase0(compte, dbok)
        // obtention des avatars du compte
        await this.phase1()
        // obtention des groupes et contacts des avatars du compte, signature si non bloqué
        await this.phase2()
      } else {
        /*
        compte est null et dbok true ou false selon que la base locale existait ou non
        on boucle si la version du compte a changé entre la phase 0 et les phases 1 et 2
        */
        let nb = 0
        while (true) {
          if (nb++ > 5) throw new AppExc(E_BRO, 5)

          // obtention du compte / prefs / tribu / compta du compte
          await this.phase0(compte, dbok)
          idb = this.session.accesIdb // peut avoir changé si comptable détecté
          // à partir d'ici la base est ouverte (si synchro)

          // obtention des avatars du compte
          if (await this.phase1()) {
            // obtention des groupes et contacts des avatars du compte
            // signature si non bloqué
            if (await this.phase2(this.session.blocage === 0)) break
          }
          this.reset()
          stores.reset()
          resetRepertoire()
        }
      }

      /*
      MAJ (éventuelle) de nctk par cryptage en clé K au lieu du RSA trouvé
      NE PAS EFFECTUER AVANT : ça change la version du compte et sortirait
      en erreur de la boucle précédente (où compte ne doit pas changer)
      */
      if (net && this.compte.nctkCleK) {
        const args = { sessionId, id: compte.id, nctk: compte.nctkCleK }
        this.tr(await post(this, 'm1', 'nctkCompte', args))
      }
  
      this.BRK()
      /* YES ! on a tous les objets maîtres :
      compte / avatar / groupe / couple / tribu à jour, abonnés et signés
      */

      /* Récupération des membres et secrets */
      if (this.blocage !== 4) await this.phase3()

      /* Phase 4 : récupération des CVs et s'y abonner
      Recalcul de people en tenant compte des disparus
      */
      await this.syncCVs()

      /* Phase 5 : récupération des invitations aux groupes / couples
      Elles seront de facto traitées en synchronisation quand un avatar reviendra avec un lgrk / lcck étendu
      */
      if (this.blocage !== 4 && this.session.accesIdb) {
        await this.getInvitGrs(this.compte)
        await this.getInvitCps(this.compte)
      }

      // Finalisation en une seule fois, commit en IDB
      if (this.session.synchro) {
        const lsk = this.session.reseau + '-' + this.compte.dpbh
        let nb = this.session.nombase
        if (!nb) {
          this.session.nombase = await this.compte.getNombase()
          nb = this.session.nombase
        }
        localStorage.setItem(lsk, nb)
        if (!dbok) {
          await openIDB()
          // SYNC, pas de db détectée au login => première connexion ici
          const trig = await getTrigramme()
          setTrigramme(nb, this.session.reseau, trig)
        }
        await this.buf.commitIDB()
      }

      if (idb) await gestionFichierCnx(this.buf.mapSec)

      // arg = ts, id, ns, varg
      if (net && this.buf.lsecsup.length) {
        for (const s of this.buf.lsecsup) {
          try {
            const arg = { ts: s.ts, id: s.id, ns: s.ns, varg: s.volarg() }
            await new SupprSecret().run(arg)
          } catch (e) {
            console.log(e.message)
          }
        }
      }

      if (idb) {
        await TLfromIDB()
        await FLfromIDB()
      }

      // enregistre (sauf incognito) l'heure du début effectif de la session
      await this.session.sessionSync.setConnexion(this.dh)
      console.log('Connexion compte : ' + this.compte.id)
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
      this.session.phrase = arg.ps
      await initConnexion()

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
      const ncpart = arg.estpar ? await crypter(rnd, serial([compte.naprim.nom, compte.naprim.rnd])) : 0

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
  - pph : hash phrase de parrainage
  */
  async run (couple, phch, ard) {
    try {
      this.session = stores.session
      this.session.accesIdb = false
      this.session.accesNet = true
      await initConnexion()
      const args = {
        sessionId: this.session.sessionId,
        idc: couple.id,
        phch: arg.phch,
        ardc: await couple.toArdc(ard, couple.cc)
      }
      await post(this, 'm1', 'refusRencontre', args)
      await deconnexion(1)
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
      session.phrase = phrase
      session.statutIdb = false
      session.statutNet = true
      await initConnexion()

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
