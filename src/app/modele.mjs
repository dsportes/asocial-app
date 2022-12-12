import stores from '../stores/stores.mjs'

import { forSchema, serialize, deserialize, clone, serial, deserial } from './schemas.mjs'
import { $t, hash, rnd6, intToB64, b64ToInt, u8ToB64, idToSid, dlvDepassee, titre, normpath, gzip, ungzip, ungzipT, egaliteU8, tru8 } from './util.mjs'
import { random, pbkfd, sha256, decrypterRSA, crypterRSA, crypter, decrypter, decrypterStr } from './webcrypto.mjs'

import { IDCOMPTABLE, DateJour, Compteurs, UNITEV1, UNITEV2, chiffres } from './api.mjs'

import { closeIDB, getFichierIDB, saveSessionSync } from './db.mjs'
import { openWS, closeWS } from './ws.mjs'

/* Gestion en stores des secrets et des cv *************/
export function setSecret (s) {
  if (!s) return
  stores.secret.setSecret(s) // référence des secrets et de leurs voisinage
  switch (s.id % 4) { // listage dans leur "maître" (avatar, couple ou groupe)
    case 0 : { stores.avatar.setSecret(s); return }
    case 1 : { stores.couple.setSecret(s); return }
    case 2 : { stores.groupe.setSecret(s); return }
  }
}

export function getSecret (id, ns) {
  return stores.secret.getSecret(id, ns)
}

export function delSecret (id, ns) {
  stores.secret.delSecret(id, ns)
  switch (id % 4) {
    case 0 : { return stores.avatar.delSecret(id, ns) }
    case 1 : { return stores.couple.delSecret(id, ns) }
    case 2 : { return stores.groupe.delSecret(id, ns) }
  }
}

export function setCv (cv) {
  if (!cv) return
  switch (cv.id % 4) {
    case 0 : {
      const compte = stores.session.compte
      if (compte.estAc(cv.id)) {
        stores.avatar.setCv(cv)
      } else {
        stores.people.setCv(cv)
      }
      return
    }
    case 2 : { 
      stores.groupe.setCv(cv)
      return
    }
  }
}

export function getCv (id) {
  switch (id % 4) {
    case 0 : {
      const compte = stores.session.compte
      if (compte.estAc(id)) {
        return stores.avatar.getCv(id)
      } else {
        return stores.people.getCv(id)
      }
    }
    case 2 : { 
      return stores.groupe.getCv(id)
    }
  }
}

export function delCv (id) {
  switch (id % 4) {
    case 0 : {
      const compte = stores.session.compte
      if (compte.estAc(id)) {
        return stores.avatar.delCv(id)
      } else {
        return stores.people.delCv(id)
      }
    }
    case 2 : { 
      return stores.groupe.delCv(id)
    }
  }
}

/* Répertoire (statique) *********************************
- `resetRepertoire ()` : réinitialisation
- `setNg (ng)` : enregistrement d'un nom générique
- `getCle (id)` : retourne le rnd du nom générique enregistré avec cette id
- `getNg (id)` : retourne le nom générique enregistré avec cette id
- `getDisparu (id)` : retourne `true` si cette id a été déclarée _disparue_
- `setDisparu (id)` : déclare cette id comme _disparue_
*/
const repertoire = { rep: {} }

export function resetRepertoire () { repertoire.rep = {} }
export function setNg (ng) {
  const id = ng.id
  let obj = repertoire.rep[id]; if (!obj) { obj = { }; repertoire.rep[id] = obj }
  obj.ng = ng
  return id
}
export function getCle (id) { const e = repertoire.rep[id]; return e ? e.ng.rnd : null }
export function getNg (id) { const e = repertoire.rep[id]; return e ? e.ng : null }
export function getDisparu (id) { const e = repertoire.rep[id]; return e && e.x ? true : false }
export function setDisparu (id) { const e = repertoire.rep[id]; if (e) e.x = true }

/***********************************************************
Gestion de la session
************************************************************/

export async function initConnexion () {
  const session = stores.session
  session.status = 1
  session.sessionId = intToB64(rnd6())
  session.dateJourConnx = new DateJour()
  if (session.accesNet) {
    await openWS()
  }
}

/* option : garder de session
- 0 : rien
- 1 : reseau
- 2 : reseau mode
- 3 : reseau mode phrase
*/
export function deconnexion (option) {
  const session = stores.session
  let reseau, mode, phrase
  if (option) {
    if (option >= 1) reseau = session.reseau
    if (option >= 2) mode = session.mode
    if (option >= 3) phrase = session.phrase
  }
  if (session.statutIdb) {
    closeIDB()
  }
  if (session.statutnet) {
    closeWS()
  }
  session.$reset()
  if (option) {
    if (option >= 1) session.reseau = reseau
    if (option >= 2) session.mode = mode
    if (option >= 3) session.phrase = phrase
  }
  stores.reset()
}

/***********************************************************
NomGenerique : NomAvatar / NomContact / NomGroupe / NomTribu
************************************************************/
export class NomGenerique {
  constructor (nom, rnd) {
    this.nom = nom
    this.rnd = rnd || random(32)
  }

  get t () { return this.id % 4 }
  get nomc () { return this.nom + '#' + ('' + this.id).substring(0, 4) }
  // get nomf () { return normpath(this.nomc) }
  get sid () { return intToB64(this.id) } // dans la table mac d'un compte, la clé est le sid des avatars
  get disparu () { return getDisparu(this.id) }
  get cv () { return getCv(this.id) }

  egal (ng) {
    return this.nom === ng.nom && this.id === ng.id && egaliteU8(this.rnd, ng.rnd)
  }

  get photo () {
    if (this.disparu) return ''
    const cv = this.cv
    return cv && cv.cv ? (cv.cv[0] || '') : ''
  }

  get info () {
    if (this.disparu) return $t('MOdis')
    const cv = this.cv
    return cv && cv.cv ? (cv.cv[1] || '') : ''
  }

}

export class NomAvatar extends NomGenerique {
  constructor (nom, rnd) {
    super(nom, rnd)
    this.id = nom !== 'Comptable' ? hash(this.rnd) : IDCOMPTABLE
  }

  get titre () {
    const info = this.info
    return info ? titre(info) : ''
  }

  get photoDef () {
    const cfg = stores.config
    if (this.id === IDCOMPTABLE) return cfg.iconSuperman
    if (this.disparu) return cfg.disparu
    return this.photo || cfg.iconAvatar
  }

  clone () {
    return new NomAvatar(this.nom, this.rnd)
  }
}

export class NomContact extends NomGenerique {
  constructor (nom, rnd) {
    super(nom, rnd)
    this.id = hash(this.rnd) + 1
  }

  get photoDef () {
    const cfg = stores.config
    if (this.disparu) return cfg.disparu
    const cv = this.cv
    return this.photo || cfg.iconContact
  }

  clone () {
    return new NomContact(this.nom, this.rnd)
  }
}

export class NomGroupe extends NomGenerique {
  constructor (nom, rnd) {
    super(nom, rnd)
    this.id = hash(this.rnd) + 2
  }

  get photoDef () {
    const cfg = stores.config
    if (this.disparu) return cfg.disparu
    const cv = this.cv
    return this.photo || cfg.iconGroupe
  }

  clone () {
    return new NomContact(this.nom, this.rnd)
  }
}

export class NomTribu extends NomGenerique {
  constructor (nom, rnd) {
    super(nom, rnd)
    this.id = hash(this.rnd) + 3
  }

  clone () {
    return new NomTribu(this.nom, this.rnd)
  }
}

/******************************************************
 * classe MotsCles
******************************************************/
export class Motscles {
  /*
  Mode 1 : chargement des mots clés du compte et l'organisation en vue d'éditer ceux du compte
  Mode 2 : chargement des mots clés du groupe idg et l'organisation en vue d'éditer ceux du groupe
  Mode 3 : chargement des mots clés du compte OU du groupe idg et de l'organisation pour SELECTION
  */
  constructor (mc, mode, idg) {
    this.mode = mode
    this.idg = idg
    this.mc = mc
    this.mapAll = new Map()
  }

  aMC (idx) {
    return this.mapAll.has(idx) || false
  }

  getMC (idx) {
    return this.mapAll.get(idx)
  }

  edit (u8, court, groupeId) {
    if (!u8 || !u8.length) return ''
    const gr = groupeId ? data.getGroupe(groupeId) : null
    const l = []
    for (let i = 0; i < u8.length; i++) {
      const n = u8[i]
      const x = n >= 100 && n < 200 && gr ? gr.motcle(n) : this.mapAll.get(n)
      if (x && x.n && x.n.length) {
        if (court && x.n.charCodeAt(0) > 1000) {
          // commence par un emoji
          l.push(String.fromCodePoint(x.n.codePointAt(0)))
        } else {
          l.push(x.n)
        }
      }
    }
    return l.join(court ? ' ' : ' / ')
  }

  debutEdition () {
    if (this.mode === 3 || !this.src) return
    this.premier = this.mode === 1 ? 1 : 100
    this.dernier = this.mode === 1 ? 99 : 199
    this.mc.st.enedition = true
    this.localIdx = {}
    this.localNom = {}
    for (const y in this.src) {
      const idx = parseInt(y)
      const nc = this.src[idx]
      const [categ, nom] = this.split(nc)
      this.localIdx[idx] = nc
      this.localNom[nom] = [idx, categ]
    }
    this.avant = this.flatMap(this.src)
    this.apres = this.avant
  }

  flatMap (map) {
    const a = []
    for (const idx in map) a.push(parseInt(idx))
    a.sort()
    const b = []
    for (let i = 0; i < a.length; i++) {
      const idx = a[i]
      b.push(idx + '/' + map[idx])
    }
    return b.join('&')
  }

  finEdition () {
    if (this.mode === 3) return
    this.mc.st.enedition = false
    this.mc.st.modifie = false
    const r = this.localIdx
    this.recharger()
    return r
  }

  recharger () {
    if (this.mc.st.enedition) return
    this.mapAll.clear()
    delete this.localIdx
    delete this.localNom
    delete this.apres
    delete this.avant
    this.mc.categs.clear()
    this.mc.lcategs.length = 0
    this.fusion(stores.config.motscles)
    if (this.mode === 1 || (this.mode === 3 && !this.idg)) {
      const cpt = stores.session.getPrefs
      this.mapc = cpt ? cpt.mc : {}
      this.fusion(this.mapc)
      if (this.mode === 1) this.src = this.mapc
    }
    if (this.mode === 2 || (this.mode === 3 && this.idg)) {
      const gr = stores.groupe.getGroupe(this.idg)
      this.mapg = gr ? gr.mc : {}
      if (this.mode === 2) this.src = this.mapg
      this.fusion(this.mapg)
    }
    this.tri()
    return this
  }

  split (nc) {
    const j = nc.indexOf('/')
    const categ = j === -1 ? $t('obsolete') : nc.substring(0, j)
    const nom = j === -1 ? nc : nc.substring(j + 1)
    return [categ, nom]
  }

  setCateg (categ, idx, nom) {
    let x = this.mc.categs.get(categ)
    if (!x) {
      x = []
      this.mc.categs.set(categ, x)
    }
    let trouve = false
    for (let i = 0; i < x.length; i++) {
      if (x[i][1] === idx) {
        x[i][0] = nom
        trouve = true
        break
      }
    }
    if (!trouve) x.push([nom, idx])
  }

  delCateg (categ, idx) {
    const x = this.mc.categs.get(categ)
    if (!x) return
    let j = -1
    for (let i = 0; i < x.length; i++) {
      if (x[i][1] === idx) {
        j = i
        break
      }
    }
    if (j !== -1) {
      x.splice(j, 1)
      if (!x.length) {
        this.mc.categs.delete(categ)
      }
    }
  }

  fusion (map) {
    for (const i in map) {
      const idx = parseInt(i)
      const nc = map[i]
      const [categ, nom] = this.split(nc)
      this.setCateg(categ, idx, nom)
      this.mapAll.set(idx, { n: nom, c: categ })
    }
  }

  tri () {
    this.mc.lcategs.length = 0
    const s = new Set()
    this.mc.categs.forEach((v, k) => {
      if (!s.has(k)) {
        this.mc.lcategs.push(k)
        s.add(k)
      }
      if (v.length > 1) v.sort((a, b) => { return a[0] < b[0] ? -1 : a[0] === b[0] ? 0 : 1 })
    })
    if (this.mc.lcategs.length > 1) this.mc.lcategs.sort()
  }

  supprMC (idx) {
    if (!this.mc.enedition || idx < this.premier || idx > this.dernier) return $t('UTIer1')
    const ancnc = this.localIdx[idx]
    if (!ancnc) return
    const [anccateg, ancnom] = this.split(ancnc)
    delete this.localNom[ancnom]
    delete this.localIdx[idx]
    this.delCateg(anccateg, idx)
    this.apres = this.flatMap(this.localIdx)
    this.mc.st.modifie = this.apres !== this.avant
    this.mapAll.delete(idx)
  }

  changerMC (idx, nc) {
    if (!this.mc.st.enedition || (idx !== 0 && (idx < this.premier || idx > this.dernier))) return $t('UTIer1')
    if (idx && !nc) return this.supprMC(idx)
    const [categ, nom] = this.split(nc)
    const x = this.localNom[nom]
    if (x && x[0] !== idx) return $t('UTIer2', [x[0], x[1]])
    if (idx) {
      const ancnc = this.localIdx[idx]
      const [anccateg, ancnom] = this.split(ancnc)
      delete this.localNom[ancnom]
      this.delCateg(anccateg, idx)
    } else {
      for (let i = this.premier; i < this.dernier; i++) {
        if (!this.localIdx[i]) { idx = i; break }
      }
      if (!idx) return $t('UTIer3')
    }
    this.localIdx[idx] = nc
    this.localNom[nom] = [idx, categ]
    this.setCateg(categ, idx, nom)
    this.tri()
    this.apres = this.flatMap(this.localIdx)
    this.mc.st.modifie = this.apres !== this.avant
    this.mapAll.set(idx, { n: nom, c: categ })
  }
}

/******************************************************
 * classes Phrase, MdpAdmin, PhraseContact
******************************************************/
export class Phrase {
  async init (debut, fin) {
    this.pcb = await pbkfd(debut + '\n' + fin)
    this.pcb64 = u8ToB64(this.pcb)
    this.pcbh = hash(this.pcb)
    this.dpbh = hash(await pbkfd(debut))
    // this.debut = debut
    // this.fin = fin
  }
  /*
  razDebutFin () {
    this.debut = ''
    this.fin = ''
  }
  */
}

export class PhraseContact {
  async init (texte) {
    // this.phrase = texte
    this.clex = await pbkfd(texte)
    let hx = ''
    for (let i = 0; i < texte.length; i = i + 2) hx += texte.charAt(i)
    this.phch = hash(hx)
    return this
  }
}

export class MdpAdmin {
  async init (mdp) {
    this.mdp = mdp
    this.mdpb = await pbkfd(mdp)
    this.mdp64 = u8ToB64(this.mdpb, true)
    this.mdph = hash(this.mdpb)
  }
}

/****************************************************
 * Compilation des objets depuis des items
****************************************************/

// Création des objets selon leur table
export function newObjet (table) {
  switch (table) {
    case 'tribu' : return new Tribu()
    case 'compte' : return new Compte()
    case 'compta' : return new Compta()
    case 'prefs' : return new Prefs()
    case 'avatar' : return new Avatar()
    case 'cv' : return new Cv()
    case 'couple' : return new Couple()
    case 'contact' : return new Contact()
    case 'invitgr' : return new Invitgr()
    case 'invitcp' : return new Invitcp()
    case 'groupe' : return new Groupe()
    case 'membre' : return new Membre()
    case 'secret' : return new Secret()
  }
}

// compile un objet depuis un item { table, serial }
export async function compile (item) {
  if (!item) return null
  const obj = newObjet(item.table)
  // ça enregistre dans le répertoire les na / clés des avatars
  await obj.fromRow(deserialize('row' + item.table, item.serial))
  return obj
}

/* CompileToMap (items) ****************************
- items : array de item { table, serial }
- Map retournée : une map par table
  - une entrée par pk de chaque objet
  - valeur : objet le plus récent ayant cette pk
***************************************************/
export async function compileToMap (items) {
  const res = {}
  if (!items || !items.length) return res
  for (let i = 0; i < items.length; i++) {
    const obj = await compile(items[i])
    let m = res[obj.table]
    if (!m) m = {}; res[obj.table] = m
    const av = m[obj.pk]
    if (!av || av.v < obj.v) m[obj.pk] = obj
  }
  return res
}

/*
Compile tous les items dans CacheSync
- d'abord les items compte (afin que les clés des avatars soient enregistrées au répertoire)
- ouis les avatars (afin que les clés des comptes et groupes soient enregistrées au répertoire)
- puis tous les autres
Pour chaque objet il n'est enregistré en cache que si sa version est postérieure à 
celle actuellement en store ET à celle actuellement en cache
*/
export async function compileToCache (items, cache) {
  if (!items || !items.length) return

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.table !== 'compte') continue
    const obj = await compile(item)
    cache.setCompte(obj)
  }
    
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.table !== 'avatar') continue
    const obj = await compile(item)
    cache.setAvatar(obj)
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.table === 'avatar' || item.table === 'compte') continue
    const obj = await compile(item)
    switch (obj.table) {
      case 'prefs' : { cache.setPrefs(obj); break }
      case 'tribu' : { cache.setTribu(obj); break }
      case 'compta' : { cache.setCompta(obj); break }
      case 'groupe' : { cache.setGroupe(obj); break }
      case 'couple' : { cache.setCouple(obj); break }
      case 'secret' : { cache.setSecret(obj); break }
      case 'cv' : { cache.setCv(obj); break }
      case 'invitgr' : { cache.setInvitgr(obj); break }
      case 'invitcp' : { cache.setInvitcp(obj); break }
    }
  }
}

/* CacheSync ***************************************************/
export class CacheSync {
  constructor () {
    this.compte = null
    this.prefs = null
    this.chat = null
    this.avatars = new Map()
    this.tribus = new Map()
    this.comptas = new Map()
    this.groupes = new Map()
    this.couples = new Map()
    this.membres = new Map()
    this.secrets = new Map()
    this.cvs = new Map()
    this.invitgrs = new Map()
    this.invitcps = new Map()
  }

  setCompte (obj) {
    const x = this.getCompte()
    if (!x || x.v < obj.v) this.compte = obj
  }
  getCompte (actuel) {
    const ac = stores.session.compte
    return actuel ? ac : this.compte || ac
  }

  setPrefs (obj) {
    const x = this.getPrefs()
    if (!x || x.v < obj.v) this.prefs = obj
  }
  getPrefs (actuel) {
    const ac = stores.session.prefs
    return actuel ? ac : this.prefs || ac
  }

  setTribu (obj) { 
    const x = this.getTribu(obj.id)
    if (!x || x.v < obj.v) this.tribus.set(obj.id, obj)
  }
  getTribu (id, actuel) { 
    const x = stores.tribu.getTribu(id)
    return actuel ? x : this.tribus.get(id) || x
  }

  setAvatar (obj) {
    const x = this.getAvatar(obj.id)
    if (!x || x.v < obj.v) this.avatars.set(obj.id, obj)
  }
  getAvatar (id, actuel) {
    const x = stores.avatar.getAvatar(id)
    return actuel ? x : this.avatars.get(id) || x
  }

  setCompta (obj) {
    const x = this.getCompta(obj.id)
    if (!x || x.v < obj.v) this.comptas.set(obj.id, obj)
  }
  getCompta (id, actuel) {
    const x = stores.avatar.getCompta(id)
    return actuel ? x : this.comptas.get(id) || x
  }

  setGroupe (obj) {
    const x = this.getGroupe(obj.id)
    if (!x || x.v < obj.v) this.groupes.set(obj.id, obj)
  }
  getGroupe (id, actuel) {
    const x = stores.groupe.getGroupe(id)
    return actuel ? x : this.groupes.get(id) || x
  }

  setCouple (obj) {
    const x = this.getCouple(obj.id)
    if (!x || x.v < obj.v) this.couples.set(obj.id, obj)
  }
  getCouple (id) {
    const x = stores.couple.getCouple(id)
    return actuel ? x : this.couples.get(id) || x
  }

  setMembre (obj) {
    const x = this.getMembre(obj.id)
    if (!x || x.v < obj.v) this.membres.set(obj.id, obj)
  }
  getMembre (id) {
    const x = stores.groupe.getMembre(id)
    return actuel ? x : this.membres.get(id) || x
  }

  setSecret (obj) {
    const x = this.getSecret(obj.id, obj.ns)
    if (!x || x.v < obj.v) this.secrets.set(obj.pk, obj)
  }
  getSecret (id, ns, actuel) {
    const ac = getSecret(id, ns)
    return actuel ? x : this.secrets.get(id + '/' + ns) || x
  }

  setCv (obj) {
    const x = this.getCv(obj.id)
    if (!x || x.v < obj.v) this.cvs.set(obj.id, obj)
  }
  getCv (id, actuel) {
    const x = getCv(id)
    return actuel ? x : this.cvs.get(id) || x
  }

  setInvitgr (obj) {
    const x = this.getInvitgr(pk)
    if (!x || x.v < obj.v) this.invitgrs.set(obj.pk, obj)
  }
  getInvitgr (pk) { return this.invitgrs.get(pk) }

  setInvitcp (obj) {
    const x = this.getInvitcp(pk)
    if (!x || x.v < obj.v) this.invitcps.set(obj.pk, obj)
  }
  getInvitcp (pk) { return this.invitcps.get(pk) } 
}

/* Calcul du niveau d'un blocage
ljc : [[j, n] ...] : à partir de j inclus, c'est le niveau n
stn : niveau au jour de connexion
*/
export function compilNiv (jib, lj) {
  if (!jib) return [0, []]
  const ljc = []
  let niv = 0, d = jib
  for (let n = 0; n <= 2; n++) {
    const x = lj[n]
    if (x) { ljc.push([d, n + 1]); d += x }
  }
  ljc.push([d, 4])
  const nj = stores.session.dateJourConnx.nbj
  for (let n = ljc.length - 1; n >= 0; n--) { if (nj >= ljc[n][0]) { niv = ljc[n][1]; break } }
  return [niv, ljc]
}


/****************************************************
 * Tous les objets
****************************************************/

/** Tribu *********************************
- `id` : id de la tribu.
- 'v'
- `nbc` : nombre de comptes actifs dans la tribu.
- `f1 f2` : sommes des volumes V1 et V2 déjà attribués comme forfaits aux comptes de la tribu.
- `r1 r2` : volumes V1 et V2 en réserve pour attribution aux comptes actuels et futurs de la tribu.
- `datak` : cryptée par la clé K du comptable :
  - `[nom, rnd]`: nom immuable et clé de la tribu.
  - `info` : commentaire privé du comptable.
- `mncpt` : map des noms complets des parrains:
  - _valeur_ : `[nom, rnd]` crypté par la clé de la tribu
  - _clé_ : (`chkt`), hash (integer) de (id du parrain base64 + id tribu base64)
  - l'ajout d'un parrain ne se fait que par le comptable mais un retrait peut s'effectuer aussi par un traitement de GC
- `datat` : cryptée par la clé de la tribu :
  - `st` : raison majeure du blocage : 0 à 9 repris dans la configuration de l'organisation.
  - `c`: 1 si positionné par le comptable (dans une tribu toujours 1)
  - `txt` : libellé explicatif du blocage.
  - `jib` : jour initial de la procédure de blocage
  - `lj` : `[j12 j23 j34]` : nb de jours de passage des niveaux de 1 à 2, 2 à 3, 3 à 4.
  - `dh` : date-heure de dernier changement du statut de blocage.
- `vsh`
*/

forSchema({
  name: 'idbTribu',
  cols: ['id', 'v', 'nbc', 'f1', 'f2', 'r1', 'r2', 'na', 'mncp', 'info', 'blocage', 'vsh']
})

export class Tribu {
  get table () { return 'tribu' }
  get pk () { return '' + this.id }

  get nom () { return this.na.nom }
  get stn () { return this.blocage ? this.blocage.stn : 0 }
  get str () { return this.blocage ? this.blocage.st : 0 }
  get txt () { return this.str ? this.blocage.txt : '' }
  get ist () { return !this.nbc ? 4 : this.stn }
  get clet () { return this.na.rnd }

  async fromRow (row) {
    const session = stores.session
    this.vsh = row.vsh || 0
    this.id = row.id
    this.v = row.v
    if (session.estComptable) {
      // Le comptable peut décrypter le na de TOUTE tribu (il a été crypté par sa clé K)
      const [x, info] = deserial(await decrypter(session.clek, row.datak))
      this.na = new NomTribu(x[0], x[1])
      this.info = info || ''
      setNg(this.na)
    } else {
      /* Un compte normal n'a le droit d'accèder qu'à SA tribu.
      Son na est disponible dans le compte et a forcément été décrypté avant.
      */
      this.na = session.compte.nat
      this.info = ''
    }
    this.nbc = row.nbc
    this.f1 = row.f1
    this.f2 = row.f2
    this.r1 = row.r1
    this.r2 = row.r2

    const mx = (row.mncpt ? deserial(row.mncpt) : null) || {}
    this.mncp = {}
    for (const chkt in mx) {
      const nr = await decrypter(this.clet, mx[chkt])
      this.mncp[chkt] = deserial(nr)
    }
    this.blocage = !row.datat ? null : deserial(await decrypter(this.clet, row.datat))
    if (this.blocage) {
      const [niv, ljc] = compilNiv(this.blocage.jib, this.blocage.lj)
      this.blocage.stn = niv
      this.blocage.ljc = ljc
    }
    this.regParrains()
    return this
  }

  regParrains () {
    for (const chkt in this.mncp) {
      const nr = this.mncp[chkt]
      const na = new NomAvatar(nr[0], nr[1])
      setNg(na)
    }
  }

  get naParrains () { // array des na des parrains
    const r = []
    for (const chkt in this.mncp) {
      const nr = this.mncp[chkt]
      const na = new NomAvatar(nr[0], nr[1])
      r.push(na)
    }
    return r
  }

  idParrains (s) { // set des ids des parrains accumulés dans s
    const r = s || new Set()
    for (const chkt in this.mncp) {
      const nr = this.mncp[chkt]
      const na = new NomAvatar(nr[0], nr[1])
      r.add(na.id)
    }
    return r
  }

  fromIdb (idb) {
    deserialize('idbTribu', idb, this)
    if (this.blocage) {
      const [niv, ljc] = compilNiv(this.blocage.jib, this.blocage.lj)
      this.blocage.stn = niv
      this.blocage.ljc = ljc
    }
    this.regParrains()
    return this
  }

  get toIdb () {
    const r = { ...this }
    return serialize('idbTribu', r)
  }

  nouvelle (nom, info, r1, r2) {
    this.vsh = 0
    this.na = new NomTribu(nom)
    this.id = this.na.id
    this.v = 0
    this.info = info
    this.nbc = 0
    this.f1 = 0
    this.f2 = 0
    this.r1 = r1
    this.r2 = r2
    this.mncp = {}
    this.blocage = null
    return this
  }

  async toRow () {
    const r = { ...this }
    r.datak = await this.getDatak(this.info)
    r.mncpt = null
    r.datat = !this.blocage ? null : await crypter(this.clet, serial(this.blocage))
    return serialize('rowtribu', r)
  }

  async getDatak (info) {
    const x = [[this.na.nom, this.na.rnd], info || '']
    return await crypter(stores.session.clek, serial(x))
  }

  async getmncpt () {
    const mncpt = {}
    for (const chkt of this.mncp) {
      mncpt[chkt] = await crypter(this.clet, this.mncp[chkt])
    }
    return mncpt
  }

  static getChktDeId (idc, nat) {
    return hash(idToSid(idc) + '@' + nat.sid)
  }

  getChktDeId (id) {
    return hash(idToSid(id) + '@' + this.na.sid)
  }
}

/** Compte *********************************************************
- `id` : id de l'avatar primaire du compte.
- `v` :
- `dpbh` : hashBin (53 bits) du PBKFD du début de la phrase secrète (32 bytes). Pour la connexion, l'id du compte n'étant pas connu de l'utilisateur.
- `pcbh` : hashBin (53 bits) du PBKFD de la phrase complète pour quasi-authentifier une connexion avant un éventuel échec de décryptage de `kx`.
- `kx` : clé K du compte, cryptée par la X (phrase secrète courante).
- `stp` : statut parrain (0: non, 1:oui).
- `nctk` : nom complet `[nom, rnd]` de la tribu crypté,
  - soit par la clé K du compte,
  - soit par la clé publique de son avatar primaire après changement de tribu par le comptable.
- `mack` {} : map des avatars du compte cryptée par la clé K.
  - _Clé_: id,
  - _valeur_: `[nom, rnd, cpriv]`
    - `nom rnd` : nom et clé de l'avatar.
    - `cpriv` : clé privée asymétrique.
- `vsh`
*/

forSchema({
  name: 'idbCompte',
  cols: ['id', 'v', 'dpbh', 'pcbh', 'k', 'stp', 'nctk', 'nctpc', 'chkt', 'nat', 'mac', 'nomdb', 'vsh']
})

export class Compte {
  get table () { return 'compte' }
  get sid () { return intToB64(this.id) } // La map this.mac a histiquement pour clé le sid des avatars
  get pk () { return '1' }

  get estParrain () { return this.stp === 1 } // retourne true si le compte est parrain
  get estComptable () { return this.id === IDCOMPTABLE } // retourne true si le compte est celui du comptable

  get primaire () { return stores.avatar.get(this.id) } // retourne l'objet avatar primaire du compte

  get naprim () { return this.mac[this.sid].na } // na de l'avatar primaire du compte

  get apropos () {
    return this.nat ? ($t('tribus', 0) + ':' + this.nat.nom) : $t('comptable')
  }

  /* calcul le nom de la base locale du compte
    $$reseau-xxxx
    xxxx : pbkfd de la clé k en base64
  */
  async getNombase () {
    if (!this.nomdb) {
      const x = await pbkfd(this.k)
      this.nomdb = '$$' + stores.session.reseau + '-' + u8ToB64(x, true)
    }
    return this.nomdb
  }

  estAc (id) { // retourne true si id est l'id d'un avatar du compte
    return this.mac[intToB64(id)] ? true : false
  }

  avatarNas (s) { // retourne (ou accumule dans s), le set des na des avatars du compte
    const s1 = new Set()
    for (const sid in this.mac) if (s) s.add(this.mac[sid].na); else s1.add(this.mac[sid].na)
    return s || s1
  }

  avatarIds (s) { // retourne (ou accumule dans s), le set des ids des avatars du compte
    const s1 = new Set()
    for (const sid in this.mac) if (s) s.add(this.mac[sid].na.id); else s1.add(this.mac[sid].na.id)
    return s || s1
  }

  avatarDeNom (n) { // retourne l'id de l'avatar de nom n (ou 0)
    for (const sid in this.mac) if (this.mac[sid].na.nom === n) return b64ToInt(sid)
    return 0
  }

  avatars () { // retourne la liste des noms des avatars du compte
    const l = []
    for (const sid in this.mac) l.push(this.mac[sid].na.nom)
    return l
  }

  cpriv (avid) {
    const e = this.mac[intToB64(avid || this.id)]
    return e ? e.cpriv : null
  }

  nouveau (nomAvatar, cprivav) {
    const session = stores.session
    this.id = nomAvatar.id
    this.v = 0
    this.dpbh = session.phrase.dpbh
    this.pcbh = session.phrase.pcbh
    this.k = random(32)
    session.clek = this.k
    this.stp = 0
    this.nat = null
    this.mac = { }
    this.mac[nomAvatar.sid] = { na: nomAvatar, cpriv: cprivav }
    setNg(nomAvatar)
    this.vsh = 0
    return this
  }

  // INTERNE : est effectué dans fromRow et fromIdb - à la construction de l'objet
  repAvatars () { this.avatarNas().forEach(na => { setNg(na) }) }

  async fromRow (row) {
    const session = stores.session
    this.vsh = row.vsh || 0
    this.id = row.id
    this.v = row.v
    this.stp = row.stp
    this.dpbh = row.dpbh
    this.k = await decrypter(session.phrase.pcb, row.kx)
    this.pcbh = row.pcbh
    session.clek = this.k
    this.mac = {}
    const m = deserial(await decrypter(this.k, row.mack))
    for (const sid in m) {
      const [nom, rnd, cpriv] = m[sid]
      this.mac[sid] = { na: new NomAvatar(nom, rnd), cpriv: cpriv }
    }
    if (row.nctk) {
      let nr
      if (row.nctk.length === 256) {
        const kp = this.cpriv(this.id)
        tru8('Priv compte.fromRow nctk ' + this.id, kp)
        nr = await decrypterRSA(kp, row.nctk)
        this.nctkCleK = await crypter(this.k, nr)
      } else {
        nr = await decrypter(this.k, row.nctk)
        this.nctkCleK = null
      }
      const [nom, rnd] = deserial(nr)
      this.nat = new NomTribu(nom, rnd)
    } else {
      this.nat = null
      this.nctk = null
    }
    this.repAvatars()
    return this
  }

  async toRow () {
    const session = stores.session
    const r = { ...this }
    const m = {}
    for (const sid in this.mac) {
      const x = this.mac[sid]
      m[sid] = [x.na.nom, x.na.rnd, x.cpriv]
    }
    r.mack = await crypter(session.clek, serial(m))
    r.kx = await crypter(session.phrase.pcb, this.k)
    const nr = !this.nat ? null : serial([this.nat.nom, this.nat.rnd])
    r.nctk = !this.nat ? null : (this.nctk ? this.nctk : await crypter(this.k, nr))
    return serialize('rowcompte', r)
  }

  async nouvKx (phrase) {
    return await crypter(phrase.pcb, this.k)
  }

  async ajoutAvatar (na, kpav) {
    const m = {}
    for (const sid in this.mac) {
      const x = this.mac[sid]
      m[sid] = [x.na.nom, x.na.rnd, x.cpriv]
    }
    m[na.sid] = [na.nom, na.rnd, kpav.privateKey]
    setNg(na)
    return await crypter(stores.session.clek, serial(m))
  }

  get toIdb () {
    const r = { ...this }
    r.mac = {}
    for (const sid in this.mac) {
      const x = this.mac[sid]
      r.mac[sid] = [x.na.nom, x.na.rnd, x.cpriv]
    }
    return serialize('idbCompte', r)
  }

  fromIdb (idb) {
    deserialize('idbCompte', idb, this)
    stores.session.clek = this.k
    const m = {}
    for (const sid in this.mac) {
      const [nom, rnd, cpriv] = this.mac[sid]
      m[sid] = { na: new NomAvatar(nom, rnd), cpriv: cpriv }
    }
    this.mac = m
    this.repAvatars()
    return this
  }

  getChkt (nat) {
    return hash(this.sid + '@' + nat.sid)
  }

  getChktDeId (id) {
    return hash(intToB64(id) + '@' + this.nat.sid)
  }

  async setTribu (nat) {
    const session = stores.session
    this.nat = nat
    const nc = serial([nat.nom, nat.rnd])
    this.nctk = nat ? await crypter(session.clek, nc) : null
  }

  get clone () {
    return clone('idbCompte', this, new Compte())
  }

  av (id) { // retourne { na: , cpriv: }
    return this.mac[intToB64(id)]
  }
}

/** Prefs ***************************************************************
- `id` : id du compte.
- `v` :
- `mapk` {} : map des préférences.
  - _clé_ : code court (`mp, mc ...`)
  - _valeur_ : sérialisation cryptée par la clé K du compte de l'objet JSON correspondant.
- `vsh`
*/

forSchema({
  name: 'idbPrefs',
  cols: ['id', 'v', 'map', 'vsh']
})

export class Prefs {
  get table () { return 'prefs' }
  get pk () { return '1' }

  get memo () { return this.map.mp }

  get mc () { return this.map.mc }

  get titre () { return this.memo ? titre(this.memo) : '' }

  nouveau (id) {
    this.id = id
    this.v = 0
    this.vsh = 0
    this.map = { mp: '', mc: {} }
    return this
  }

  async fromRow (row) {
    const session = stores.session
    this.vsh = row.vsh || 0
    this.id = row.id
    this.v = row.v
    const m = deserial(row.mapk)
    this.map = {}
    this.map.mp = deserial(await decrypter(session.clek, m.mp))
    this.map.mc = deserial(await decrypter(session.clek, m.mc))
    return this
  }

  async sectionToRow (code) {
    const x = this.map[code] || null
    return await crypter(stores.session.clek, serial(x))
  }

  async toRow () {
    const m = { }
    m.mp = await this.sectionToRow('mp')
    m.mc = await this.sectionToRow('mc')
    const r = { id: this.id, v: this.v, vsh: this.vsh, mapk: serial(m) }
    return serialize('rowprefs', r)
  }

  get toIdb () {
    return serialize('idbPrefs', this)
  }

  fromIdb (idb) {
    deserialize('idbPrefs', idb, this)
    return this
  }

  get clone () {
    return clone('idbPrefs', this, new Prefs())
  }
}

/** Compta **********************************************************************
- `id` : de l'avatar.
- `t` : id de la tribu pour un avatar primaire (0 pour un seconadaire). Par convention l'avatar principal du comptable (qui n'a pas de tribu) à `1` dans `t`.
- `v` :
- `datat` : seulement pour un avatar primaire, cryptée par la clé de la tribu :
  - `st` : raison majeure du blocage : 0 à 9 repris dans la configuration de l'organisation.
  - `c`: 1 si positionné par le comptable (dans une tribu toujours 1)
  - `txt` : libellé explicatif du blocage.
  - `jib` : jour initial de la procédure de blocage
  - `lj` : `[j01 j12 j23 j34]` : nb de jours de passage des niveaux 0 à 1, 1 à 2, 2 à 3, 3 à 4.
  - `dh` : date-heure de dernier changement du statut de blocage.
- `data`: compteurs sérialisés (non cryptés)
- `sta` : statut de l'ardose `(c i1 i2 i3)`
- `ard1 ard2 ard3` : textes cryptés par la clé de la tribu :
  - `t dh na`
- `vsh` :

sta: c i1 i2 i3
- c : ardoise intéressant le comptable
- Trois indicateurs `i1` (pour le compte), `i2` (pour un parrain de la tribu), `i3` (pour le comptable) traduisent la position de chaque interlocuteur vis à vis de l'ardoise :
  - `0` : l'ardoise **n'a pas été lue**, du moins dans sa dernière mise à jour.
  - `1` : l'ardoise **a été lue** mais le sujet reste à traiter du point de l'interlocuteur.
  - `2` : l'ardoise **a été lue et le sujet est clos** du point de vue de l'interlocuteur
*/

forSchema({
  name: 'idbCompta',
  cols: ['id', 't', 'v', 'blocage', 'data', 'sta', 'ard1', 'ard2', 'ard3', 'vsh']
})


export class Compta {
  get table () { return 'compta' }
  get pk () { return '' + this.id }

  get estPrimaire () { return this.t !== 0 }
  get stn () { return this.blocage ? this.blocage.stn : 0 }
  get str () { return this.blocage ? this.blocage.st : 0 }
  get staa () { return chiffres(this.staa, 4) }
  get clet () { return this.t > 1 ? data.repertoire.cle(this.t) : null }

  nouveau (id, t) {
    this.id = id
    this.t = t
    this.v = 0
    this.vsh = 0
    this.compteurs = new Compteurs()
    this.blocage = null
    this.sta = 0
    this.ard1 = null
    this.ard2 = null
    this.ard3 = null
    return this
  }

  async fromRow (row) {
    this.vsh = row.vsh || 0
    this.id = row.id
    this.t = row.t
    this.v = row.v
    this.st = row.st
    this.compteurs = new Compteurs(row.data).calculauj()
    if (this.t && this.id !== IDCOMPTABLE) {
      const compte = stores.session.compte
      this.blocage = !row.datat ? null : deserial(await decrypter(compte.nat.rnd, row.datat))
      if (this.blocage) {
        const [niv, ljc] = compilNiv(this.blocage.jib, this.blocage.lj)
        this.blocage.stn = niv
        this.blocage.ljc = ljc
      }
    }
    this.dh = row.dh
    this.txtt = row.txtt
    this.sta = row.sta
    if (this.sta && this.t > 1) {
      this.ard1 = row.ard1 ? deserial(await crypt.decrypter(this.clet, row.ard1)) : null
      this.ard2 = row.ard1 ? deserial(await crypt.decrypter(this.clet, row.ard2)) : null
      this.ard3 = row.ard1 ? deserial(await crypt.decrypter(this.clet, row.ard3)) : null
    }
    return this
  }

  async toRow () {
    const r = { ...this }
    r.data = this.compteurs.calculauj().serial
    if (this.t && this.id !== IDCOMPTABLE) {
      const compte = stores.session.compte
      r.datat = await crypter(compte.nat.rnd, serial(this.blocage))
    }
    return serialize('rowcompta', r)
  }

  get toIdb () {
    this.data = serial(this.compteurs.calculauj())
    const x = serialize('idbCompta', this)
    delete this.data
    return x
  }

  fromIdb (idb) {
    deserialize('idbCompta', idb, this)
    this.compteurs = new Compteurs(this.data).calculauj()
    if (this.blocage) {
      const [niv, ljc] = compilNiv(this.blocage.jib, this.blocage.lj)
      this.blocage.stn = niv
      this.blocage.ljc = ljc
    }
    delete this.data
    return this
  }

  get clone () {
    this.compteurs.calculauj()
    return clone('idbCompta', this, new Compta())
  }
}

/** Avatar ****************************************************************************
- `id` : id de l'avatar
- `v` :
- `lgrk` : map :
  - _clé_ : `ni`, numéro d'invitation (aléatoire 4 bytes) obtenue sur `invitgr`.
  - _valeur_ : cryptée par la clé K du compte de `[nom, rnd, im]` reçu sur `invitgr`.
  - une entrée est effacée par la résiliation du membre au groupe ou sur refus de l'invitation (ce qui lui empêche de continuer à utiliser la clé du groupe).
- `lcck` : map :
  - _clé_ : `ni`, numéro pseudo aléatoire. Hash de (`cc` en hexa suivi de `0` ou `1`).
  - _valeur_ : clé `cc` cryptée par la clé K de l'avatar cible. Le hash d'une clé d'un couple donne son id.
- `vsh`
*/

forSchema({
  name: 'idbAvatar',
  cols: ['id', 'v', 'lgr', 'lcc', 'vsh']
})

export class Avatar {
  get table () { return 'avatar' }
  get sid () { return idToSid(this.id) }
  get pk () { return '' + this.id }

  get na () { return getNg(this.id) }
  get cle () { return getCle(this.id) }
  get nomc () { return this.na.nomc }
  get disparu () { return getDisparu(this.id) }
  get estPrimaire () { return stores.session.compte.id === this.id }
  get estParrain () { return stores.session.compte.estParrain }

  constructor () {
    this.m1gr = new Map() // clé:ni val: { na du groupe, im de l'avatar dans le groupe }
    this.m2gr = new Map() // clé:idg (id du groupe), val:[im, ni]
    this.mcc = new Map() // clé: ni, val: clé cc
  }

  /* Retourne LE membre de l'avatar du compte pour un groupe d'id donné */
  membre (idg) {
    const x = this.m2gr.get(idg)
    if (!x) return null
    const im = typeof x[0] === 'string' ? parseInt(x[0]) : x[0]
    return stores.membre.get(idg, im)
  }

  im (idg) {
    const x = this.m2gr.get(idg)
    if (!x) return 0
    const im = typeof x[0] === 'string' ? parseInt(x[0]) : x[0]
    return im
  }

  ni (idg) {
    const x = this.m2gr.get(idg)
    if (!x) return 0
    const ni = typeof x[1] === 'string' ? parseInt(x[1]) : x[1]
    return ni
  }

  groupeIds (s) {
    const s1 = new Set()
    this.m1gr.forEach(e => { if (s) s.add(e.na.id); else s1.add(e.na.id) })
    return s || s1
  }

  groupeNas (s) {
    const s1 = new Set()
    this.m1gr.forEach(e => { if (s) s.add(e.na); else s1.add(e.na) })
    return s || s1
  }

  coupleIds (s) {
    const s1 = new Set()
    this.mcc.forEach(na => { if (s) s.add(na.id); else s1.add(na.id) })
    return s || s1
  }

  coupleNas (s) {
    const s1 = new Set()
    this.mcc.forEach(na => { if (s) s.add(na); else s1.add(na) })
    return s || s1
  }

  // INTERNE dans fromRow fromIDB
  repGroupes () { this.m1gr.forEach(e => { setNg(e.na) }) }
  repCouples () { this.mcc.forEach(na => { setNg(na) }) }

  nouveau (id, niCouple, naCouple) { // naCouple : création lors d'une acceptation de parrainage
    this.id = id
    this.v = 0
    this.vsh = 0
    if (naCouple) this.mcc.set(niCouple, naCouple)
    return this
  }

  async compileLists (lgr, lcc, brut) {
    const clek = stores.session.clek
    this.mcc.clear()
    if (lcc) {
      for (const ni in lcc) {
        const y = lcc[ni]
        const cc = brut ? y : await decrypter(clek, y)
        const na = new NomContact('x', cc)
        this.mcc.set(ni, na)
      }
    }
    this.m1gr.clear()
    if (lgr) {
      for (const nis in lgr) {
        const ni = parseInt(nis)
        const y = lgr[ni]
        const x = deserial(brut ? y : await decrypter(clek, y))
        const na = new NomGroupe(x[0], x[1])
        const id = na.id
        this.m1gr.set(ni, { na: na, im: x[2] })
        this.m2gr.set(id, [x[2], ni])
      }
    }
  }

  decompileListsBrut () {
    const lgr = this.m1gr.size ? {} : null
    if (this.m1gr.size) for (const [ni, x] of this.m1gr) lgr[ni] = serial([x.na.nom, x.na.rnd, x.im])
    const lcc = this.mcc.size ? {} : null
    if (this.mcc.size) for (const [ni, na] of this.mcc) lcc[ni] = na.rnd
    return [lgr, lcc]
  }

  async decompileLists () {
    const clek = stores.session.clek
    const lgr = this.m1gr.size ? {} : null
    if (this.m1gr.size) {
      for (const [ni, x] of this.m1gr) {
        lgr[ni] = await crypter(clek, serial([x.na.nom, x.na.rnd, x.im]))
      }
    }
    const lcc = this.mcc.size ? {} : null
    if (this.mcc.size) {
      for (const [ni, na] of this.mcc) {
        lcc[ni] = await crypter(clek, na.rnd)
      }
    }
    return [lgr, lcc]
  }

  async fromRow (row) { // ['id', 'v', 'lgr', 'lcc', 'vsh']
    this.vsh = row.vsh || 0
    this.id = row.id
    this.v = row.v
    await this.compileLists(row.lgrk ? deserial(row.lgrk) : null, row.lcck ? deserial(row.lcck) : null)
    this.repGroupes()
    this.repCouples()
    return this
  }

  async toRow () { // pour un nouvel avatar seulement
    const [lgr, lcc] = await this.decompileLists()
    const r = { id: this.id, v: this.v, lgrk: serial(lgr), lcck: serial(lcc), vsh: 0 }
    return serialize('rowavatar', r)
  }

  get toIdb () {
    const r = { ...this }
    const [lgr, lcc] = this.decompileListsBrut()
    r.lgr = lgr
    r.lcc = lcc
    return serialize('idbAvatar', r)
  }

  fromIdb (idb) {
    deserialize('idbAvatar', idb, this)
    this.compileLists(this.lgr, this.lcc, true)
    this.repGroupes()
    this.repCouples()
    delete this.lgr
    delete this.lcc
    return this
  }

  get clone () {
    return clone('idbAvatar', this, new Avatar())
  }
}

/** Cv **************************************************************
cols: ['id', 'v', 'x', 'dds', 'cv', 'vsh']
forSchema({ // dans api.mjs
  name: 'idbCv',
  cols: ['id', 'v', 'x', 'dds', 'cv', 'vsh']
})
*/
export class Cv {
  get table () { return 'cv' }
  get cle () { return getCle(this.id) }
  get pk () { return '' + this.id }

  constructor () {
    this.id = 0
    this.v = 0
    this.x = 0
    this.dds = 0
    this.cv = null
    this.vsh = 0
  }

  init (id, photo, info) {
    this.id = id
    this.cv = [photo, info]
    return this
  }

  async fromRow (row) { // row : rowCv - item retour de sync
    this.id = row.id
    this.v = row.v
    this.x = row.x
    this.dds = row.dds
    this.cv = row.cv ? deserial(await decrypter(this.cle, row.cv)) : null
    return this
  }

  async toRow (_photo, _info) { // seulement la cv (photo, info)
    return await crypter(this.cle, serial(this.cv))
  }

  get toIdb () {
    return serialize('idbCv', this)
  }

  fromIdb (idb) {
    deserialize('idbCv', idb, this)
    return this
  }
}

/** couple *****************************************************************
- `id` : id du contact
- `v` :
- `st` : quatre chiffres `p o 0 1` : phase / état
  - `p` : phase - (1) en attente, (2) hors délai, (3) refusé, (4) actif, (5) orphelin.
  - `o` : origine du contact: (0) direct, (1) parrainage, (2) rencontre.
  - `0` : pour A0 - (0) pas de partage de secrets, (1) partage de secrets, (2) disparu.
  - `1` : pour A1 -
- 'npi' :xx : ne pas communiquer (pour 0 et 1)
- `v1 v2` : volumes actuels des secrets.
- `mx10 mx20` : maximum des volumes autorisés pour A0
- `mx11 mx21` : maximum des volumes autorisés pour A1
- `dlv` : date limite de validité éventuelle de prise de contact.
- `datac` : données cryptées par la clé `cc` du couple :
  - `x` : `[nom, rnd], [nom, rnd]` : nom et clé d'accès à la carte de visite respectivement de A0 et A1.
- `phk0` : phrase de parrainage / rencontre cryptée par la clé K du parrain (sera détruite après acceptation / refus hors délai).
- `infok0 infok1` : commentaires personnels cryptés par leur clé K, respectivement de A0 et A1.
- `mc0 mc1` : mots clé définis respectivement par A0 et A1.
- `ardc` : ardoise commune cryptée par la clé cc. [dh, texte]
- `vsh` :
*/

forSchema({
  name: 'idbCouple',
  cols: ['id', 'v', 'st', 'npi', 'tp', 'autp', 'v1', 'v2', 'mx10', 'mx20', 'mx11', 'mx21', 'dlv', 'data', 'phrase', 'idI', 'idE', 'info', 'mc', 'dh', 'ard', 'vsh']
})

export class Couple {
  get table () { return 'couple' }
  // get sid () { return idToSid(this.id) }
  get pk () { return '' + this.id }
  // get pkv () { return this.sid + '/' + this.v } // TODO : vérifier l'utilité

  get stp () { return Math.floor(this.st / 1000) }
  get orig () { return Math.floor(this.st / 100) % 10 }
  get st01 () { return [Math.floor(this.st / 10) % 10, this.st % 10] }
  get stI () { return this.st01[this.avc] }
  get stE () { return this.st01[this.ava] }

  get cle () { return getCle(this.id) }
  get na () { return getNg(this.id) }
  get cv () { return stores.cv.get(this.id) }
  get nomC () { return this.data[0][0] + '_' + this.data[1][0] }
  get nomf () { return normpath(this.nomC) }
  get nomE () { return this.naE && this.stE !== 2 ? this.naE.nomc : this.data[this.ava][0] }
  get nomEs () { return this.data[this.ava][0] }
  get nomI () { return this.naI.nomc }
  get nomIs () { return this.data[this.avc][0] }
  get max1E () { return this.avc === 1 ? this.mx10 : this.mx11 }
  get max2E () { return this.avc === 1 ? this.mx20 : this.mx21 }
  get max1I () { return this.avc === 1 ? this.mx11 : this.mx10 }
  get max2I () { return this.avc === 1 ? this.mx21 : this.mx20 }

  get nomc () { return this.nomE }
  get dhed () { return dhcool(this.dh) }

  naDeIm (im) { return im === this.avc + 1 ? this.naI : this.naE }

  async phraseContact () {
    if (!this.data.phrase) return null
    const pc = new PhraseContact()
    await pc.init(this.data.phrase)
    return pc
  }

  setIdIE (x, cle) { // cle : non null pour réception d'un couple HORS session (accepatation / refus parrainage)
    const na0 = x[0][1] ? new NomAvatar(x[0][0], x[0][1]) : null
    const na1 = x[1][1] ? new NomAvatar(x[1][0], x[1][1]) : null
    const id0 = na0 ? na0.id : 0
    const id1 = na1 ? na1.id : 0
    this.avc = !cle && stores.session.compte.estAc(id0) ? 0 : 1 // position 0 / 1 de l'avatar du compte
    this.ava = this.avc ? 0 : 1 // position 0 / 1 de l'autre avatar
    this.idI = this.avc ? id1 : id0
    this.naI = this.avc ? na1 : na0
    this.idE = this.ava ? id1 : id0
    this.naE = this.ava ? na1 : na0
    const npi0 = this.npi ? Math.floor(this.npi / 10) : 0
    const npi1 = this.npi ? this.npi % 10 : 0
    this.npiI = this.avc ? npi1 : npi0
    this.npiE = this.ava ? npi1 : npi0
    const na = new NomContact(this.nomC, cle || this.cle)
    if (!cle) setNg(na); else this.naTemp = na
  }

  // INTERNE fromRow fromIDB
  setRepE () { if (this.naE) setNg(this.naE) }

  nouveauR (naI, nomf, cc, mot, pp, max, dlv, npi) {
    this.v = 0
    this.vsh = 0
    this.st = 1200 + (max[0] ? 10 : 0) // en attente, rencontre, partage secrets ou non
    this.npi = npi ? 10 : 0
    this.naI = naI
    this.idI = naI.id
    this.naE = null
    this.idE = 0
    this.avc = 0
    const na = new NomContact(naI.nom + '_' + nomf, cc)
    this.id = na.id
    setNg(na)
    this.v1 = 0
    this.v2 = 0
    this.mx10 = max[0]
    this.mx20 = max[1]
    this.mx11 = 0
    this.mx21 = 0
    this.dlv = dlv
    this.mc0 = null
    this.mc1 = null
    this.info = null
    this.ard = mot
    this.dh = new Date().getTime()
    this.data = [[naI.nom, naI.rnd], [nomf, null]]
    this.phrase = pp
    return this
  }

  nouveauP (naI, naE, cc, mot, pp, max, dlv, npi) {
    this.v = 0
    this.vsh = 0
    this.st = 1100 + (max[0] ? 10 : 0) // en attente, parrainage, partage secrets ou non
    this.npi = npi ? 10 : 0
    this.naI = naI
    this.idI = naI.id
    this.naE = naE
    this.idE = naE.id
    this.avc = 0
    setNg(naE)
    const na = new NomContact(naI.nom + '_' + naE.nom, cc)
    this.id = na.id
    setNg(na)
    this.v1 = 0
    this.v2 = 0
    this.mx10 = max[0]
    this.mx20 = max[1]
    this.mx11 = 0
    this.mx21 = 0
    this.dlv = dlv
    this.mc0 = null
    this.mc1 = null
    this.info = null
    this.ard = mot
    this.dh = new Date().getTime()
    this.data = [[naI.nom, naI.rnd], [naE.nom, naE.rnd]]
    this.phrase = pp
    return this
  }

  nouveauC (naI, naE, cc, mot, max, npi) {
    this.v = 0
    this.vsh = 0
    this.st = 1000 + (max[0] ? 10 : 0) // en attente, direct, partage secrets ou non
    this.npi = npi ? 10 : 0
    this.naI = naI
    this.idI = naI.id
    this.naE = naE
    this.idE = naE.id
    this.avc = 0
    const na = new NomContact(naI.nom + '_' + naE.nom, cc)
    this.id = na.id
    setNg(na)
    this.v1 = 0
    this.v2 = 0
    this.mx10 = max[0]
    this.mx20 = max[1]
    this.mx11 = 0
    this.mx21 = 0
    this.dlv = 0
    this.mc0 = null
    this.mc1 = null
    this.info = null
    this.ard = mot
    this.dh = new Date().getTime()
    this.data = [[naI.nom, naI.rnd], [naE.nom, naE.rnd]]
    this.phrase = null
    return this
  }

  dlvEtat () { if (this.dlv && this.stp === 1 && dlvDepassee(this.dlv)) this.st += 1000 }

  // cols: ['id', 'v', 'st', 'dds', 'v1', 'v2', 'mx10', 'mx20', 'mx11', 'mx21', 'dlv', 'data', 'info0', 'info1', 'mc0', 'mc1', 'dh', 'ard', 'vsh']
  async fromRow (row, cle) { // cle : non null pour réception d'un couple HORS session (acceptation / refus parrainage)
    if (cle) this.cc = cle // NON persistante, utile pour acceptation de parrainage
    this.vsh = row.vsh || 0
    this.id = row.id
    this.v = row.v
    this.tp = row.tp
    this.autp = row.autp
    this.st = row.st
    this.npi = row.npi || 0
    this.v1 = row.v1
    this.v2 = row.v2
    this.mx10 = row.mx10
    this.mx20 = row.mx20
    this.mx11 = row.mx11
    this.mx21 = row.mx21
    this.dlv = row.dlv
    const clec = getCle(this.id)
    this.data = deserial(await decrypter(this.cc || clec, row.datac))
    this.setIdIE(this.data, cle)
    const x = row.ardc ? deserial(await decrypter(this.cc || clec, row.ardc)) : [0, '']
    this.dh = x[0]
    this.ard = x[1]
    const clek = stores.session.clek // pas de clek dans Accepttation / refus de parrainage (HORS CONNEXION)
    if (this.avc === 0) {
      this.mc = row.mc0 || new Uint8Array([])
      this.info = row.infok0 && clek ? await decrypterStr(clek, row.infok0) : ''
      this.phrase = row.phk0 && clek ? await decrypterStr(clek, row.phk0) : ''
    } else {
      this.mc = row.mc1 || new Uint8Array([])
      this.info = row.infok1 && clek ? await decrypterStr(clek, row.infok1) : ''
      this.phrase = ''
    }
    this.dlvEtat()
    this.setRepE()
    return this
  }

  async toRow () { // pour création de couple seulement
    const clek = stores.session.clek
    const r = { ...this }
    r.datac = await crypter(this.cle, serial(r.data))
    r.ardc = await crypter(this.cle, serial([r.dh, r.ard]))
    r.phk0 = this.phrase ? await crypt.crypter(clek, this.phrase) : null
    r.infok0 = null
    r.infok1 = null
    return serialize('rowcouple', r)
  }

  async datacRenc (avatar) { // TODO : à vérifier, BUG probable
    const data = this.data
    data[1][1] = avatar.na.rnd
    return await crypter(this.cc || this.cle, serial(data))
  }

  async toArdc (ard, cc) {
    return await crypter(this.cc || cc || this.cle, serial([new Date().getTime(), ard]))
  }

  get toIdb () {
    return serialize('idbCouple', this)
  }

  fromIdb (idb) {
    deserialize('idbCouple', idb, this)
    this.dlvEtat()
    this.setIdIE(this.data)
    this.setRepE()
    return this
  }

  async phch () {
    const pc = new PhraseContact()
    await pc.init(this.phrase)
    return pc.phch
  }
}

/** Contact ************************************************************
- `phch` : hash de la phrase de contact convenue entre le parrain A0 et son filleul A1 (s'il accepte)
- `dlv`
- `datax` : cryptée par le PBKFD de la phrase de contact:
  - `cc` : clé du couple (donne son id).
  - `naf` : nom de A1 pour première vérification immédiate en session que la phrase est a priori bien destinée à cet avatar. Le nom de A1 figure dans le nom du couple après celui de A0.
  - Pour un parrainage seulement
    - `nct` : `[nom, rnd]` nom complet de la tribu.
    - `parrain` : vrai si le compte parrainé est parrain (créé par le Comptable, le seul qui peut le faire)
    - `forfaits` : `[f1, f2]` forfaits attribués par le parrain.
  - Pour une rencontre seulement
    - `idt` : id de la tribu de A0 SEULEMENT SI A0 en est parrain.
- `vsh` :
*/

forSchema({
  name: 'idbContact',
  cols: ['phch', 'dlv', 'ccx', 'vsh']
})

export class Contact {
  get table () { return 'contact' }
  // get sid () { return idToSid(this.phch) }
  get pk () { return '' + this.id }

  get horsLimite () { return dlvDepassee(this.dlv) }

  async nouveau (phch, clex, dlv, cc, naf, idt, nct, parrain, forfaits) { // clex : PBKFD de la phrase de contact
    this.vsh = 0
    this.phch = phch
    if (!cc) cc = random(32)
    this.dlv = dlv
    const d = { cc: cc, naf: naf } // naf : [nom, rnd] du compte
    if (idt) {
      d.idt = idt
    } else {
      d.nct = nct
      d.parrain = parrain
      d.forfaits = forfaits
    }
    this.datax = await crypter(clex, serial(d))
    return this
  }

  async fromRow (row) {
    this.vsh = row.vsh || 0
    this.phch = row.phch
    this.datax = row.datax
    this.dlv = row.dlv
    return this
  }

  async getData (clex) {
    return deserial(await decrypter(clex, this.datax))
  }

  async getCcIdNom (clex) {
    const d = await this.getData(clex)
    const na = new NomContact(d.naf, d.cc)
    return [d.cc, na.id, d.naf]
  }

  toRow () {
    return serialize('rowcontact', this)
  }
}

/** Invitgr **********************************/
/*
- `id` : id du membre invité.
- `ni` : numéro d'invitation.
- `datap` : crypté par la clé publique du membre invité (recrypté en datak par la clé k)
  - `nom rnd im` : nom complet du groupe (donne sa clé).
Jamais stocké en IDB : dès réception, le row avatar correspondant est "régularisé"
*/

export class Invitgr {
  get table () { return 'invitgr' }
  get pk () { return this.id + '/' + this.ni }

  async fromRow (row) {
    const session = stores.session
    this.id = row.id
    this.ni = row.ni
    const cpriv = session.compte.cpriv(row.id)
    tru8('Invitgr.fromRow dec datap ' + this.id, cpriv)
    const x = deserial(await decrypterRSA(cpriv, row.datap))
    this.idg = hash(x[1]) + 2 // pour le traitement de régularisation (abonnement au groupe)
    this.datak = await crypter(session.clek, serial(x))
    return this
  }

  async toRow (clepub) {
    tru8('Invitgr.toRow cr data ' + this.id, clepub)
    const datap = await crypterRSA(clepub, serial(this.data))
    const r = { id: this.id, ni: this.ni, datap }
    return serialize('rowinvitgr', r)
  }
}

/** Invitcp *************************************************************
- `id` : id du membre invité.
- `ni` : numéro d'invitation.
- `datap` : clé cc du couple cryptée par la clé publique du membre invité (recrypté en datak par la clé k)
Jamais stocké en IDB : dès réception, le row avatar correspondant est "régularisé"
*/

export class Invitcp {
  get table () { return 'invitcp' }
  get pk () { return '' + this.id + '/' + this.ni }

  async fromRow (row) {
    const session = stores.session
    this.id = row.id
    this.ni = row.ni
    const cpriv = session.compte.av(row.id).cpriv
    tru8('Invitcp.fromRow dec datap ' + this.id, cpriv)
    const x = await decrypterRSA(cpriv, row.datap)
    this.idc = hash(x) + 1 // pour le traitement de régularisation (abonnement au groupe)
    this.datak = await crypter(session.clek, x)
    return this
  }

  async toRow (id, ni, cc, clepub) {
    tru8('Invitcp.toRow cr data ' + id, clepub)
    const datap = await crypterRSA(clepub, cc)
    const r = { id, ni, datap }
    return serialize('rowinvitcp', r)
  }
}

/** Groupe ***********************************************************************
- `id` : id du groupe.
- `v` :
- `dds` :
- `dfh` : date (jour) de fin d'hébergement du groupe par son hébergeur
- `st` : `x y`
    - `x` : 1-ouvert (accepte de nouveaux membres), 2-fermé (ré-ouverture en vote)
    - `y` : 0-en écriture, 1-protégé contre la mise à jour, création, suppression de secrets.
- `mxim` : dernier `im` de membre attribué.
- `imh` : indice `im` du membre dont le compte est hébergeur.
- `v1 v2` : volumes courants des secrets du groupe.
- `f1 f2` : forfaits attribués par le compte hébergeur.
- `mcg` : liste des mots clés définis pour le groupe cryptée par la clé du groupe cryptée par la clé G du groupe.
- `vsh`
*/

forSchema({
  name: 'idbGroupe',
  cols: ['id', 'v', 'dfh', 'st', 'mxim', 'imh', 'v1', 'v2', 'f1', 'f2', 'mc', 'vsh']
})

export class Groupe {
  get table () { return 'groupe' }
  // get sid () { return idToSid(this.id) }
  get pk () { return '' + this.id }
  get estZombi () { return this.dfh === 99999 }

  get cv () { return stores.cv.get(this.id) }
  get photo () { const cv = this.cv; return cv ? cv[0] : '' }
  get info () { const cv = this.cv; return cv ? cv[1] : '' }

  get cle () { return getCle(this.id) }
  get na () { return getNg(this.id) }
  get nom () { return this.na.nom }
  get nomc () { return this.na.nomc }
  // nomEdMb (m) { const t = m.titre; return t ? (t + ' [' + this.nomEd + ']') : this.nomEd }

  get nomf () { return normpath(this.na.nom) }

  get stx () { return Math.floor(this.st / 10) }
  get sty () { return this.st % 10 }

  get pc1 () { return Math.round(this.v1 / UNITEV1 / this.f1) }
  get pc2 () { return Math.round(this.v2 / UNITEV2 / this.f2) }

  // retourla liste (array) des im des membres du groupe
  get lstIm () { return stores.membre.listeImDeGr(this.id) }

  estHeb (avid) { const na = this.naHeb; return na && !this.dfh && na.id === avid }

  get naHeb () {
    if (this.dfh) return null
    const m = stores.membre.get(this.id, this.imh)
    return m ? m.namb : null
  }

  imDeId (id) {
    const membre = stores.membre
    for (const im in this.lstIm) {
      const m = membre.get(this.id, im)
      if (m.namb.id === id) return im
    }
    return 0
  }

  auteurs () { // TODO : uitilité à vérifier
    const membre = stores.membre
    const l = []
    for (const im in this.lstIm) {
      const m = membre.get(this.id, im)
      if (m.stp) l.push(im + '-' + m.nomc)
    }
    return l
  }

  nbActifsInvites () { // actif et invité
    const membre = stores.membre
    let n = 0
    for (const im in this.lstIm) {
      const m = membre.get(this.id, im)
      if (m.stx === 1 || m.stx === 2) n++
    }
    return n
  }

  membreParId (id) {
    const membre = stores.membre
    for (const im in this.lstIm) {
      const m = membre.get(this.id, im)
      if (m.namb.id === id) return m
    }
    return null
  }

  maxStp () {
    const membre = stores.membre
    let mx = 0
    for (const im in this.lstIm) {
      const m = membre.get(this.id, im)
      if (m.estAc && m.stp > mx) mx = m.stp
    }
    return mx
  }

  motcle (n) { // utilisé par util / Motscles
    const s = this.mc[n]
    if (!s) return ''
    const i = s.indexOf('/')
    return i === -1 ? { c: '', n: s } : { c: s.substring(0, i), n: s.substring(i + 1) }
  }

  nouveau (id, forfaits) {
    this.id = id
    this.v = 0
    this.dfh = 0
    this.st = 10
    this.mxim = 1
    this.imh = 1
    this.v1 = 0
    this.v2 = 0
    this.f1 = forfaits[0]
    this.f2 = forfaits[1]
    this.mc = {}
    this.vsh = 0
    return this
  }

  async fromRow (row) {
    this.vsh = row.vsh || 0
    this.id = row.id
    this.v = row.v
    this.dfh = row.dfh
    if (!this.estZombi) {
      this.st = row.st
      this.mxim = row.mxim
      this.mc = row.mcg ? deserial(await decrypter(this.cle, row.mcg)) : {}
      this.imh = row.imh
      this.v1 = row.v1
      this.v2 = row.v2
      this.f1 = row.f1
      this.f2 = row.f2
    } else { // utilité ? a du être fait par le GC
      this.st = 0
      this.mxim = 0
      this.mc = null
      this.imh = 0
      this.v1 = 0
      this.v2 = 0
      this.f1 = 0
      this.f2 = 0
    }
    return this
  }

  async toRow () {
    const r = { ...this }
    r.mcg = Object.keys(r.mc).length ? await crypter(this.cle, serial(this.mc)) : null
    return serialize('rowgroupe', r)
  }

  async toIdhg (idc) {
    return await crypter(this.cle, '' + idc)
  }

  async toCvg (cv) {
    return await crypter(this.cle, serial([cv.ph, cv.info]))
  }

  async toMcg (mc) {
    return Object.keys(mc).length ? await crypter(this.cle, serial(mc)) : null
  }

  get toIdb () {
    return serialize('idbGroupe', this)
  }

  fromIdb (idb) {
    deserialize('idbGroupe', idb, this)
    return this
  }
}

/** Membre ***********************************************************
- `id` : id du **groupe**.
- `im` : indice du membre dans le groupe.
- `v` :
- `st` : `x p`
  - `x` : 0:envisagé, 1:invité, 2:actif (invitation acceptée), 3: inactif (invitation refusée), 4: inactif (résilié), 5: inactif (disparu).
  - `p` : 0:lecteur, 1:auteur, 2:animateur.
- 'npi' : 1 si ne pas communiquer aux autres membres
- `vote` : vote de réouverture.
- `mc` : mots clés du membre à propos du groupe.
- `infok` : commentaire du membre à propos du groupe crypté par la clé K du membre.
- `datag` : données cryptées par la clé du groupe. (immuable)
  - `nom, rnd` : nom complet de l'avatar.
  - `ni` : numéro d'invitation du membre dans `invitgr`. Permet de supprimer l'invitation et d'effacer le groupe dans son avatar (clé de `lgrk`).
  - `idi` : id du membre qui l'a _envisagé_.
- `ardg` : ardoise du membre vis à vis du groupe. Couple `[dh, texte]` crypté par la clé du groupe. Contient le texte d'invitation puis la réponse de l'invité cryptée par la clé du groupe. Ensuite l'ardoise peut être écrite par le membre (actif) et les animateurs.
- `vsh`
*/

forSchema({
  name: 'idbMembre',
  cols: ['id', 'im', 'v', 'st', 'npi', 'vote', 'mc', 'info', 'data', 'ard', 'dh', 'vsh']
})

export class Membre {
  get table () { return 'membre' }
  // get sid () { return idToSid(this.id) }
  get id2 () { return this.im }
  get pk () { return this.id + '/' + this.id2 }
  // get pkv () { return this.sid + '/' + this.id2 + '/' + this.v } // TODO : utilité à vérifier

  get stx () { return this.st < 0 ? -1 : Math.floor(this.st / 10) }
  get stp () { return this.st < 0 ? -1 : this.st % 10 }

  // De l'avatar membre
  get estAc () { return stores.session.compte.estAc(this.namb.id) }
  get cvm () { return stores.cv.get(this.namb.id) }
  get photom () { const cv = this.cvm; return cv ? cv[0] : '' }
  get infom () { const cv = this.cvm; return cv ? cv[1] : '' }
  get clem () { return getCle(this.namb.id) }
  get nomc () { return this.namb.nomc }

  /*
  get titre () { // TODO : utilité à vérifier
    if (!this.info) return ''
    const i = this.info.indexOf('\n')
    const t1 = i === -1 ? this.info : this.info.substring(0, i)
    return t1.length <= 20 ? t1 : t1.substring(0, 20) + '...'
  }
  */

  // Du groupe
  get cleg () { return getCle(this.id) }
  get na () { return getNg(this.id) }

  get dhed () { return dhcool(this.dh) }

  // INTERNE
  setRepE () { if (!this.estAc) setNg(this.namb) }

  nouveau (id, st, im, na, idi) {
    /* id du groupe, statut, indice membre,
    NomAvatar du membre, id de l'invitant (fac, sinon c'est le membre lui-même */
    this.id = id
    this.im = im
    this.v = 0
    this.st = st
    this.npi = 0
    this.vote = 0
    this.mc = new Uint8Array([])
    this.info = ''
    this.ard = ''
    this.dh = 0
    this.data = {
      nom: na.nom,
      rnd: na.rnd,
      ni: rnd6(),
      idi: idi || na.id
    }
    this.namb = na
    this.vsh = 0
    return this
  }

  async fromRow (row) {
    this.vsh = row.vsh || 0
    this.id = row.id
    this.im = row.im
    this.v = row.v
    this.st = row.st
    this.npi = row.npi || 0
    this.vote = row.vote
    this.data = deserial(await decrypter(this.cleg, row.datag))
    this.namb = new NomAvatar(this.data.nom, this.data.rnd)
    const [d, t] = row.ardg ? deserial(await decrypter(this.cleg, row.ardg)) : [0, '']
    this.ard = t
    this.dh = d
    this.info = row.infok && this.estAc ? await decrypterStr(stores.session.clek, row.infok) : ''
    this.mc = row.mc
    this.setRepE()
    return this
  }

  async toArdg (ard) {
    return ard ? await crypter(this.cleg, serial([new Date().getTime(), ard])) : null
  }

  async toRow () {
    const r = { ...this }
    r.datag = await crypter(this.cleg, serial(this.data))
    r.ardg = this.ard ? await crypter(this.cleg, serial([this.dh, this.ard])) : null
    r.infok = this.estAc && this.info ? await crypter(stores.session.clek, this.info) : null
    return serialize('rowmembre', r)
  }

  get toIdb () {
    return serialize('idbMembre', this)
  }

  fromIdb (idb) {
    deserialize('idbMembre', idb, this)
    this.namb = new NomAvatar(this.data.nom, this.data.rnd)
    this.setRepE()
    return this
  }
}

/** Secret ****************************************************
- `id` : id du groupe ou de l'avatar.
- `ns` : numéro du secret.
- `x` : jour de suppression (0 si existant).
- `v` :
- `st` :
  - `99999` pour un *permanent*.
  - `dlv` pour un _temporaire_.
- `xp` : _xxxp_ (`p` reste de la division par 10)
   - `xxx` : exclusivité : l'écriture et la gestion de la protection d'écriture sont restreintes au membre du groupe dont `im` est `x` (un animateur a toujours le droit de gestion de protection et de changement du `x`). Pour un secret de couple : 1 ou 2.
    - `p` : 0: pas protégé, 1: protégé en écriture.
- `v1` : volume du texte
- `v2` : volume total des fichiers attachés
- `mc` :
  - secret personnel ou de couple : vecteur des index de mots clés.
  - secret de groupe : map sérialisée,
    - _clé_ : `im` de l'auteur (0 pour les mots clés du groupe),
    - _valeur_ : vecteur des index des mots clés attribués par le membre.
- `txts` : crypté par la clé du secret.
  - `d` : date-heure de dernière modification du texte
  - `l` : liste des auteurs (pour un secret de couple ou de groupe).
  - `t` : texte gzippé ou non
- `mfas` : sérialisation de la map des fichiers attachés.
- `refs` : couple `[id, ns]` crypté par la clé du secret référençant un autre secret
(référence de voisinage qui par principe, lui, n'aura pas de `refs`).
- `vsh`

**Map `mfas` des fichiers attachés dans un secret:**
- _clé_ `idf`: identifiant du fichier en base64.
- _valeur_ : couple `[lg, data]`
  - `lg` : taille du fichier, en clair afin que le serveur puisse toujours recalculer la taille totale v2 d'un secret.
  - `data` : sérialisation cryptée par la clé S du secret de : `{ nom, info, dh, type, gz, lg, sha }`.
*/

forSchema({
  name: 'idbSecret',
  cols: ['id', 'ns', 'v', 'x', 'st', 'xp', 'v1', 'v2', 'mc', 'txt', 'mfa', 'ref', 'vsh']
})

export class Secret {
  get table () { return 'secret' }
  // get sid () { return idToSid(this.id) }
  get id2 () { return this.ns }
  // get sid2 () { return idToSid(this.ns) }
  get pk () { return this.id + '/' + this.ns }

  // TODO : gestion des voisins d'un secret
  get pkref () { return !this.ref ? '' : (idToSid(this.ref[0]) + '/' + this.ref[1]) }

  // get vk () { return this.pk + '@' + this.v } // TODO : utilité à vérifier

  get suppr () { return this.x > 0 }

  get horsLimite () { return this.st < 0 || this.st >= 99999 ? false : dlvDepassee(this.st) }
  get ts () { return this.id % 4 } // 0:personnel 1:couple 2:groupe
  get exclu () { return Math.floor(this.xp / 10) }
  get protect () { return this.xp % 10 }
  // get titre () { return this.suppr ? 'SUPPRIMÉ' : titreSecret(this.txt && this.txt.t ? this.txt.t : '???') }
  get nbj () { return this.st <= 0 || this.st === 99999 ? 0 : (this.st - getJourJ()) }
  get dh () { return this.suppr ? '?' : dhcool(this.txt.d * 1000) }

  get cle () { return this.ts ? getCle(this.id) : stores.session.clek }

  get nomf () {
    if (this.suppr) return 'SUPPRIMÉ@' + this.sid2
    const i = this.txt.t.indexOf('\n')
    const t = this.txt.t.substring(0, (i === -1 ? 16 : (i < 16 ? i : 16)))
    return normpath(t) + '@' + this.sid2
  }

  get avatar () { return this.ts !== 0 ? null : stores.avatar.get(this.id) }
  get couple () { return this.ts !== 1 ? null : stores.couple.get(this.id) }
  get groupe () { return this.ts !== 2 ? null : stores.groupe.get(this.id) }

  get nomEdACG () {
    return this.ts === 0 ? this.avatar.nomc : (this.ts === 1 ? this.couple.nomc : this.groupe.nomc)
  }

  get mcg () { return this.ts === 2 && this.mc ? this.mc[0] || new Uint8Array([]) : new Uint8Array([]) }

  /*
  Si id est celui d'un avatar accédant au secret, retourne id
  Sinon retourne l'un des avatars du compte accédant au secret
  */
  avatarAcc (id) {
    if (this.ts === 0) {
      return this.id === id ? id : this.id
    }
    if (this.ts === 1) {
      const c = this.couple
      return c.idI === id ? id : c.idI
    }
    const g = this.groupe
    if (g.membreParId(id)) return id
    let idr = id
    stores.session.compte.avatarIds().forEach(idm => {
      if (g.membreParId(idm)) idr = idm
    })
    return idr
  }

  im (avid) { return this.ts === 0 ? 0 : (this.ts === 1 ? this.couple.avc + 1 : this.groupe.imDeId(avid)) }
  membre (avid) { return this.ts === 2 ? stores.membre.get(this.groupe.id, this.im(avid)) : null }
  mcl (avid) {
    if (this.ts >= 1) return (this.mc ? this.mc[this.im(avid)] : new Uint8Array([])) || new Uint8Array([])
    return this.mc || new Uint8Array([])
  }

  auteurs () {
    const l = []
    if (this.txt && this.txt.l) {
      if (this.ts === 1) this.txt.l.forEach(im => { l.push(this.couple.naDeIm(im).nomc) })
      if (this.ts === 2) this.txt.l.forEach(im => { const m = stores.membre.get(this.id, im); if (m) l.push(m.namb.nomc) })
    }
    return l
  }

  cloneSuppr () {
    const s = new Secret()
    s.id = this.id
    s.ns = this.ns
    s.x = 1
    s.v = -1
    s.ref = this.ref
    return s
  }

  nouveau (id, ref) {
    this.id = id
    this.ns = rnd6()
    this.v = 0
    this.x = 0
    this.st = 99999 // getJourJ() + cfg().limitesjour.secrettemp
    this.xp = 0
    this.txt = { t: '', d: Math.floor(new Date().getTime() / 1000) }
    this.ref = ref || null
  }

  nouveauP (id, ref) {
    this.nouveau(id, ref)
    this.mc = new Uint8Array([])
    return this
  }

  nouveauC (id, ref) { // im : 0 ou 1 (couple.avc)
    this.nouveau(id, ref)
    this.mc = { 1: new Uint8Array([]), 2: new Uint8Array([]) }
    return this
  }

  nouveauG (id, ref, im) {
    this.nouveau(id, ref)
    this.mc = { 0: new Uint8Array([]), im: new Uint8Array([]) }
    return this
  }

  async toRowTxt (txt, im) {
    const x = { d: Math.floor(new Date().getTime() / 1000), t: gzip(txt) }
    if (this.ts) {
      const nl = [im]
      if (this.txt.l) this.txt.l.forEach(t => { if (t !== im) nl.push(t) })
      x.l = new Uint8Array(nl)
    }
    return await crypter(this.cle, serial(x))
  }

  async toRowRef () {
    return this.ref ? await crypter(this.cle, serial(this.ref)) : null
  }

  async toRowMfa (fic) {
    const x = await crypter(this.cle, serial(fic))
    return [fic.lg, x]
  }

  async fromRow (row) {
    this.vsh = row.vsh || 0
    this.id = row.id
    this.ns = row.ns
    this.x = row.x || 0
    this.v = row.v
    const cle = this.cle
    this.ref = row.refs ? deserial(await decrypter(cle, row.refs)) : null
    if (!this.suppr) {
      this.st = row.st
      this.xp = row.xp
      this.v1 = row.v1
      this.v2 = row.v2
      try {
        this.txt = deserial(await decrypter(cle, row.txts))
        this.txt.t = ungzip(this.txt.t)
      } catch (e) {
        console.log(e.toString())
        this.txt = { t: $t('illisible'), d: Math.floor(new Date().getTime() / 1000) }
      }
      if (this.ts === 0) {
        this.mc = row.mc || new Uint8Array([])
      } else {
        this.mc = row.mc ? deserial(row.mc) : {}
      }
      this.mfa = {}
      this.nbfa = 0
      if (this.v2) {
        const map = row.mfas ? deserial(row.mfas) : {}
        for (const idf in map) {
          this.mfa[idf] = deserial(await decrypter(cle, map[idf][1]))
          this.mfa[idf].idf = parseInt(idf)
          this.nbfa++
        }
      }
    }
    return this
  }

  get toIdb () {
    let t
    if (!this.x) {
      t = this.txt.t
      this.txt.t = gzip(this.txt.t)
    }
    const idb = serialize('idbSecret', this)
    if (!this.x) this.txt.t = t
    return idb
  }

  fromIdb (idb) {
    deserialize('idbSecret', idb, this)
    this.txt.t = ungzip(this.txt.t)
    this.nbfa = 0
    // eslint-disable-next-line no-unused-vars
    if (this.v2) for (const idf in this.mfa) this.nbfa++
    return this
  }

  async nouvFic (nom, info, lg, type, u8) {
    // Deux propriétés ajoutées : idf, u8 (contenu du fichier gzippé crypté)
    const fic = { nom, info, lg, type, u8 }
    fic.idf = rnd6()
    fic.sha = sha256(u8)
    fic.dh = new Date().getTime()
    fic.gz = fic.type.startsWith('text/')
    fic.u8 = await crypter(this.cle, fic.gz ? gzipT(u8) : u8)
    return fic
  }

  volLidf (lidf) {
    let v = 0
    lidf.forEach(idf => { v += this.mfa[idf].lg })
    return v
  }

  // fichier le plus récent portant le nom donné
  dfDeNom (nom) {
    let f = null
    for (const idf in this.mfa) {
      const x = this.mfa[idf]
      if (x.nom !== nom) continue
      if (!f || f.dh < x.dh) f = x
    }
    return f
  }

  nomDeIdf (idf) {
    const x = this.mfa[idf]
    return x ? x.nom : null
  }

  /* argument arg pour la gestion des volumes v1 et v2 lors de la création
  et maj des secrets (texte et fichier attaché):
  - id : du couple ou du groupe pour respect des volumes max, en pratique id du secret
  - idc : identifiant de l'avatar, compta à qui imputer (hébergeur pour un groupe)
  - idc2 : identifiant du second avatar pour un secret de couple. Est null si le couple est solo.
  - dv1 : delta de volume v1. Si > 0 c'est une augmentation de volume
  - dv2 : delta de volume v2.
  */
  volarg () {
    const a = { id: this.id, dv1: 0, dv2: 0, vt: 0, idc: 0, idc2: 0 }
    if (this.ts === 0) {
      a.idc = this.id
    } else if (this.ts === 1) {
      const c = this.couple
      if (c.stI === 1 && c.stE === 1) {
        a.idc = c.idI
        a.idc2 = c.idE
      } else if (c.stI === 1) {
        a.idc = c.idI
      } else if (c.stE === 1) {
        a.idc = c.idE
      }
    } else {
      const na = this.groupe.naHeb
      a.idc = na ? na.id : 0 // 0 : groupe non hébergé
    }
    return a
  }

  async getFichier (idf, ida) {
    // Obtenu localement ou par download. Fichier décrypté ET dézippé
    // idf: id du fichier, ida : id de l'avatar demandeur (pour décompte du transfert)
    const fetat = stores.fetat.get(idf)
    let buf = null
    if (fetat && fetat.estCharge) {
      const b = await getFichierIDB(idf)
      buf = await decrypter(this.cle, b)
    } else if (ida && await aut(3, true)) {
      const b = await new DownloadFichier().run(this, idf, ida)
      if (b) buf = await decrypter(this.cle, b)
    }
    if (!buf) return null
    const f = this.mfa[idf]
    const buf2 = f.gz ? ungzipT(buf) : buf
    return buf2
  }

  nomFichier (idf) {
    const f = this.mfa[idf]
    if (!f) return idf
    const i = f.nom.lastIndexOf('.')
    const ext = i === -1 ? '' : f.nom.substring(i)
    return f.nom + '#' + f.info + '@' + idToSid(idf) + ext
  }
}

/* Liste des ids des CV chargées en IDB ****************************
avec LA version correspondant à cet état chargé
*/
forSchema({
  name: 'idbListeCvIds',
  cols: ['v', 'lids']
})

export class ListeCvIds {
  constructor () {
    this.v = 0
    this.ids = []
  }

  init (v, setIds) {
    this.v = v
    this.lids = Array.from(setIds)
    return this
  }

  fromIdb (idb) {
    if (!idb) {
      this.v = 0
      this.ids = new Set()
    } else {
      deserialize('idbListeCvIds', idb, this)
      this.ids = new Set(this.lids)
      delete this.lids
    }
    return this
  }

  toIdb () {
    return serialize('idbListeCvIds', this)
  }
}

/**SessionSync : Dernier état de session synchronisé***************************
Uniquement sur IDB - pas de fromRow - compilé par fromIdb
- dhdebutp : dh de début de la dernière session sync terminée
- dhfinp : dh de fin de la dernière session sync terminée
- dhdebut: dh de début de la session sync en cours
- dhsync: dh du dernier traitement de synchronisation
- dhpong: dh du dernier pong reçu
*/

forSchema({
  name: 'idbSessionSync',
  cols: ['dhdebutp', 'dhfinp', 'dhdebut', 'dhsync', 'dhpong']
})

function max (a) { let m = 0; a.forEach(x => { if (x > m) m = x }); return m }

export class SessionSync {
  constructor () {
    this.dhdebutp = 0
    this.dhfinp = 0
    this.dhdebut = 0
    this.dhsync = 0
    this.dhpong = 0 // pong ou fin de connexion ou fin de sync
  }

  fromIdb (idb) {
    deserialize('idbSessionSync', idb, this)
    this.dhdebutp = this.dhdebut
    this.dhfinp = max([this.dhdebut, this.dhsync, this.dhpong])
    return this
  }

  async setConnexion (dh) { // appel quand la session est ouverte (fin de l'opération de connexion)
    this.dhdebut = dh
    this.dhpong = dh
    await this.save()
  }

  async setDhSync (dh) { // appel à la fin de chaque synchro (processQueue)
    if (stores.session.status < 2) return
    this.dhsync = dh
    this.dhpong = dh
    await this.save()
  }

  async setDhPong (dh) { // appel par WebSocket sur réception de pong
    this.dhpong = dh
    await this.save()
  }

  clone () {
    const c = new SessionSync()
    c.dhdebutp = this.dhdebutp
    c.dhfinp = this.dhfinp
    c.dhdebut = this.dhdebut
    c.dhsync = this.dhsync
    c.dhpong = this.dhpong
    return c
  }

  async save () {
    await saveSessionSync(serialize('idbSessionSync', this))
  }
}
