import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import mime2ext from 'mime2ext'
import { $t, hash, rnd6, inverse, u8ToB64, b64ToU8, gzipB, ungzipB, gzipT, ungzipT, titre, suffixe, dhstring } from './util.mjs'
import { random, pbkfd, sha256, crypter, decrypter, decrypterStr, crypterRSA, decrypterRSA, abToPem } from './webcrypto.mjs'
import { Rds, ID, isAppExc, d13, d14, Compteurs, AMJ, nomFichier, lcSynt, FLAGS, limitesjour, djMoisN } from './api.mjs'
import { DownloadFichier } from './operations.mjs'

import { getFichierIDB, saveSessionSync, FLget } from './db.mjs'

const decoder = new TextDecoder('utf-8')
const encoder = new TextEncoder('utf-8')

/* Versions (statique) ***********************************
Versions des sous-collections d'avatars et groupes
- chaque sous collection identifiée par un id d'avatar ou de groupe a une version courante
- au chargement depuis IDB elle donne la version stockée en base:
  - pour un avatar : l'avatar, ses notes, chats, sponsorings sont tous disponibles
    et consistents jusqu'à cette version v. 
  - pour un groupe : le groupe, ses notes, ses membres.
- au chargement, pour chaque sous-collection, LA version de la sous-collection peut progresser
  suite au chargement de tous les documents de la sous-collection estampillée à une version postérieure.
- en synchronisation, les sous-collections évoluent de même globalement.
- pour une entrée donnée, la version v d'une sous-collection évolue en fonction des synchronisations.
- même en l'absence de IDB, la map donne l'état courant des stores
- en mode avion, la map n'évolue pas depuis le chargement initial, les stores non plus.
La map globale Versions est sauvegardée sur IDB :
- en fin de chargement,
- en fin de chaque synchronisation.
*/
export class Versions {
  static map = {}
  static toSave = false

  static reset () { Versions.map = {}; Versions.toSave = false; return Versions.map }
  static get (id) { return Versions.map[id] || { v: 0 } }
  static v (id) { return (Versions.map[id] || { v: 0 }).v }
  static set (id, objv) { // objv: { v, vols: {v1, v2, q1, q2} }
    const e = Versions.map[id]
    if (!e || e.v < objv.v) {
      Versions.map[id] = objv
      Versions.toSave = true
    }
  } 
  static del (id) { delete Versions.map[id]; Versions.toSave = true }
  static load (idb) { 
    Versions.map = idb ? decode(idb) : {}
    Versions.toSave = false
    return Versions.map
  }
  static toIdb () { Versions.toSave = false; return new Uint8Array(encode(Versions.map))}

  static compile (row) { // objv: { v, vols: {v1, v2, q1, q2} }
    if (!row) return null
    const session = stores.session
    const z = row.dlv && row.dlv <= session.auj
    if (!z && row._data_) return decode(row._data_)
    return { id: row.id, v: row.v, _zombi: true }
  }
}

/* Répertoire (statique) *********************************
- `resetRepertoire ()` : réinitialisation
- `getCle (id)` : retourne le rnd du nom générique enregistré avec cette id
- `getNg (id)` : retourne le nom générique enregistré avec cette id
*/
const repertoire = { rep: {}, clet: {} }

export function resetRepertoire () { 
  repertoire.rep = {}
  repertoire.clet = {} 
}

export function getCle (id) { 
  if (ID.estTribu(id)) return repertoire.clet[id]
  const e = repertoire.rep[id]
  return e ? e.rnd : null
}

export function getNg (id) { return repertoire.rep[id] }

export function setClet (clet, id) { 
  const x = ID.long(id || Tribu.id(clet), NomGenerique.ns)
  if (!repertoire.clet[x]) repertoire.clet[x] = clet
  return x
}

/***********************************************************
NomGenerique : NomAvatar, NomGroupe
************************************************************/
export class NomGenerique {
  static ns = 0

  static cleComptable = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

  static idOf (rnd) {
    let z = true; for (let i = 1; i < 32; i++) if(rnd[i]) { z = false; break }
    const n = z ? 0 : (hash(rnd) % d13)
    return (((NomGenerique.ns * 10) + rnd[0]) * d13) + n
  }

  constructor (id, nom, rnd) {
    this.id = id
    this.nomx = id % d13 === 0 || !nom ? '' : nom
    this.rnd = rnd
    repertoire.rep[id] = this
  }

  get ns () { return ID.ns(this.id) }
  get nom () { return this.nomx || stores.config.nomDuComptable }
  get nomc () { return !this.nomx ? stores.config.nomDuComptable : 
    (this.nomx + '#' + ('' + (this.id % 10000)).padStart(4, '0')) }
  get hrnd () { return hash(u8ToB64(this.rnd)) }
  get anr () { return [this.nomx, this.rnd] } 

  get defIcon () {
    const cfg = stores.config
    if (this.id % d13 === 0) return cfg.iconSuperman
    if (this.rnd[0] === 3) return cfg.iconGroupe
    return cfg.iconAvatar
  }

  egal (ng) { return this.nom === ng.nom && this.id === ng.id }

  // Factories

  static from([nom, rnd]) {
    const id = NomGenerique.idOf(rnd)
    const e = repertoire.rep[id]
    if (e) return e
    if (rnd[0] <= 2) return new NomAvatar(id, nom, rnd)
    if (rnd[0] === 3) return new NomGroupe(id, nom, rnd)
    return new NomTribu(id, nom, rnd)
  }

  // Nouveaux ...
  static comptable() {
    const rnd = new Uint8Array(32)
    rnd[0] = 1
    const id = NomGenerique.idOf(rnd)
    return new NomAvatar(id, stores.config.nomDuComptable, rnd)
  }

  static avatar(nom) {
    const rnd = random(32)
    rnd[0] = 2
    const id = NomGenerique.idOf(rnd)
    const e = repertoire.rep[id]
    if (e) return e
    return new NomAvatar(id, nom, rnd)
  }

  static groupe(nom) {
    const rnd = random(32)
    rnd[0] = 3
    const id = NomGenerique.idOf(rnd)
    const e = repertoire.rep[id]
    if (e) return e
    return new NomGroupe(id, nom, rnd)
  }
}

// NE PAS UTILISER les constructeurs ci-dessous MAIS les factories de NomGenerique
export class NomAvatar extends NomGenerique { constructor (n, nom, rnd) { super(n, nom, rnd) } }
export class NomGroupe extends NomGenerique { constructor (n, nom, rnd) { super(n, nom, rnd) } }

/******************************************************
 * classe MotsCles
******************************************************/
export class Motscles {

  /* Retourne un couple {c, n} (categorie, nom) depuis un string "c/n" */
  static cn (s) { 
    const j = s.indexOf('/')
    const c = j === -1 ? $t('obsolete') : s.substring(0, j)
    const n = j === -1 ? s : s.substring(j + 1)
    return {c, n}
  }

  /* Retourne le couple {c, n} du motclé d'indice n dans la map mc */
  static motcle (mc, n) {
    const s = mc[n]
    if (!s) return s ? Motscles.cn(s) : { c: '', n: '' }
  }

  static nom (idx, mapMC) {
    const e = mapMC.get('' + idx)
    return e && e.n ? e.n : ''
  }

  static editU8 (u8, mapMC, sep) {
    if (!u8 || !u8.length || !mapMC) return ''
    const l = []
    for (let j = 0; j < u8.length; j++) { l.push(Motscles.nom(u8[j], mapMC))}
    return !sep ? l : l.join(sep)
  }

  /* Objet Motscles
  - mc : objet UI réactif associé
  - edit: true mode édition, false mode sélection
  - duCompte: true, mots clés du compte
  - duGroupe: id mots clés du groupe id
  Si edit: ceux de cpt OU ceux de gr
  Si pas edit: les génériques, ceux de cpt ET ceux gr OU NON (selon duGroupe)
  Les mots clés de la configuration sont chargés mais NON modifiables

  En sélection, l'objet est immutable.
  En édition il ne peut subir qu'un seul cycle d'édition: 
  - debutEdition
  - changerMC supprMc
  - finEdition : retourne la map "source" modifiée
  */
  constructor (mc, edit, duCompte, duGroupe) { // mc : objet editeur / selecteur de UI
    const aSt = stores.avatar
    this.edit = edit
    this.mc = mc
    this.localIdx = {} // map de clé idx. valeur: nom/categ
    this.localNom = {} // map de clé nom. valeur: [idx, categ]
    this.premier = edit ? (duCompte ? 1 : 100) : 1
    this.dernier = edit ? (duCompte ? 99 : 199) : 255
    this.mc.categs.clear() // Map: clé: nom catégorie, valeur: [[nom, idx] ...] (mots clés ayant cette catégorie)
    this.mc.lcategs.length = 0 // Liste des catégories existantes
    let mapAll
    if (edit) {
      this.gr = duGroupe
      mapAll = duGroupe ? aSt.mapMCG : aSt.mapMCC
    } else {
      mapAll = duGroupe ? aSt.mapMCGr : aSt.mapMC
    }
    const obs = $t('obs')
    this.mapAll = new Map()
    mapAll.forEach((value, key) => {
      const cx = value.c === '$' ? obs : value.c
      this.mapAll.set(key, { c: cx, n: value.n })
      this.setCateg(cx, key, value.n) 
    })
    this.tri()
  }

  aMC (idx) {
    return this.mapAll.has(""+idx) || false
  }

  getMC (idx) {
    return this.mapAll.get(""+idx)
  }

  debutEdition () {
    if (!this.edit) return
    this.mc.st.enedition = true
    this.src = {}
    this.mapAll.forEach((value, key) => {
      if (key >= this.premier && key <= this.dernier) {
        const nc = value.c + '/' + value.n
        this.localIdx[key] = nc
        this.localNom[value.n] = [key, value.c]
        this.src[key] = nc
      }
    })
    this.avant = this.flatMap(this.src)
    this.apres = this.avant
  }

  flatMap (map) { // pour détection des changements
    const a = [], b = []
    for (const idx in map) a.push(parseInt(idx))
    a.sort((x, y) => { x < y ? -1 : (x === y ? 0 : 1)})
    a.forEach(t => { b.push(t + '/' + map[t]) })
    return b.join('&')
  }

  finEdition () {
    if (!this.edit) return
    this.mc.st.enedition = false
    this.mc.st.modifie = false
    // map de clé idx. valeur: nom/categ
    const m = {}
    const obs = $t('obs') + '/'
    for (const idx in this.localIdx) {
      const nc = this.localIdx[idx]
      const nx = nc.startsWith(obs) ? '$/' + nc.substring(obs.length) : nc
      m[idx] = nx
    }
    return m
  }

  split (nc) {
    const j = nc.indexOf('/')
    const categ = j === -1 ? $t('obsolete') : nc.substring(0, j)
    const nom = j === -1 ? nc : nc.substring(j + 1)
    return [categ, nom]
  }

  /* Ajoute le couple [nom, idx] à la catégorie s'il n'existait pas déjà : idx est clé */
  setCateg (categ, idx, nom) {
    let x = this.mc.categs.get(categ)
    if (!x) { x = []; this.mc.categs.set(categ, x); this.tri() }
    let trouve = false
    x.forEach(y => { if (y[1] === idx) { y[0] = nom; trouve = true }})
    if (!trouve) x.push([nom, idx])
  }

  /* Supprime le terme idx de la catégorie, supprime la catégorie si elle est vide */
  delCateg (categ, idx) {
    const x = this.mc.categs.get(categ)
    if (!x) return
    let j = -1
    for (let i = 0; i < x.length; i++) if (x[i][1] === ''+idx) { j = i; break }
    if (j !== -1) x.splice(j, 1)
    if (!x.length) { this.mc.categs.delete(categ); this.tri()  }
  }

  tri () {
    this.mc.lcategs.length = 0
    const s = new Set()
    this.mc.categs.forEach((v, k) => {
      if (!s.has(k)) { this.mc.lcategs.push(k); s.add(k) }
      if (v.length > 1) v.sort((a, b) => { return a[0] < b[0] ? -1 : a[0] === b[0] ? 0 : 1 })
    })
    if (this.mc.lcategs.length > 1) this.mc.lcategs.sort()
  }

  supprMC (idx) { // méthode locale : la suppression d'un mot clé est son affectation à nom/catg vide
    const ancnc = this.localIdx[idx]
    if (!ancnc) return
    const [anccateg, ancnom] = this.split(ancnc)
    delete this.localNom[ancnom]
    delete this.localIdx[idx]
    this.delCateg(anccateg, ''+idx)
    this.apres = this.flatMap(this.localIdx)
    this.mc.st.modifie = this.apres !== this.avant
    this.mapAll.delete(''+idx)
  }

  // si nc nom/categ est vide, suppression de idx. Retourne un texte d'erreur, si échec
  changerMC (idx, nc) {
    if (idx !== 0 && (idx < this.premier || idx > this.dernier)) 
      return $t(idx > 199 ? 'MCer2b' : 'MCer2')
    if (idx && !nc) { this.supprMC(idx); return false }
    const [categ, nom] = this.split(nc)
    const x = this.localNom[nom]
    if (x && x[0] !== '' + idx) return $t('MCer3', [x[0], x[1]])
    if (idx) {
      const ancnc = this.localIdx[idx]
      const [anccateg, ancnom] = this.split(ancnc)
      delete this.localNom[ancnom]
      this.delCateg(anccateg, ''+idx)
    } else {
      // Nouveau mot clé: recherche un index
      for (let i = this.premier; i < this.dernier; i++) if (!this.localIdx[i]) { idx = i; break }
      if (!idx) return $t('MCer4')
    }
    this.localIdx[idx] = nc
    this.localNom[nom] = [idx, categ]
    this.setCateg(categ, ''+idx, nom)
    this.tri()
    this.apres = this.flatMap(this.localIdx)
    this.mc.st.modifie = this.apres !== this.avant
    this.mapAll.set(''+idx, { n: nom, c: categ })
  }
}

/******************************************************
 * classe Phrase
******************************************************/
export class Phrase {
  static idxch = [0, 1, 4, 7, 10, 13, 16, 19, 22, 24]

  async init (texte) {
    this.phrase = texte
    const u8 = encoder.encode(texte)
    this.pcb = await pbkfd(u8)
    this.hpsc = (hash(this.pcb) % d14)
    const u8b = Uint8Array.from(u8)
    Phrase.idxch.forEach(i => { u8b[i + 12] = 0 })
    const pr = await pbkfd(u8b)
    this.hps1 = (hash(pr) % d14)
    return this
  }

  // Pour affichage dans OutilsTests
  get shax () { return sha256(this.pcb) } 
  get shax64 () { return u8ToB64(this.shax) }

}

/* Qui ***************************************************
Un objet Qui est immuable et est transient: ne pas le conserver,
ses données t cv sp peuvent évoluer dans le temps
- t : type: 
  - 0 inconnu, 
  - 1 avatar principal du compte,
  - 2 avatar du compte,
  - 3 contact
- id : id
- na : NomAvatar
- cv : carte de visite
- sp : true - sponsor de la tribu 
*/
export class Qui {
  static de (id) {
    const qui = new Qui(id)
    const aSt = stores.avatar
    const pSt = stores.people
    const session = stores.session
    const av = aSt.getAvatar(id)
    if (av) {
      qui.t = id === session.compteId ? 1 : 2
      qui.na = av.na
      qui.cv = av.cv
    } else {
    const pe = pSt.getPeople(id)
      if (pe) {
        qui.t = 3
        qui.na = pe.na
        qui.cv = pe.cv
        if (pe.sp) qui.sp = true
      }
    }
    return qui
  }

  constructor (id) {
    this.id = id
    this.t = 0
  }

  get estComptable () { return ID.estComptable(this.id) }

  get estSponsor () { return this.sp || false }

  get photo () { 
    return this.cv && this.cv.photo ? this.cv.photo : stores.config.iconAvatar
  }

  get nom () {
    const me = t === 1 || t === 2 ? '[' + $t('moi') + ']' : ''
    return this.na ? this.na.nom + me : '#' + id
  }

  get info () {
    return this.cv && this.cv.info ? this.cv.info : this.nom
  }
}

/* Notification *******************************************
Type des notifications:
- E : de l'espace
- P : d'une partition (comptes O)
- C : d'un compte (comptes O)
- Q : de dépassement de quotas
- X : d'excès de consommation (dépassement du solde pour un compte "A"). 

Une notification a les propriétés suivantes:
- `nr`: restriction d'accès: 
  - 0 : **aucune restriction**. La notification est informative mais peut annoncer une restriction imminente.
  - 1 : **restriction réduite**
    - E : espace figé
    - P : accès en lecture seule
    - C : accès en lecture seule
    - Q : actions accroissant le volume interdites
  - 2 : **restriction forte**
    - E : espace clos
    - P : accès minimal
    - C : accès minimal
    - X : accès minimal
- `dh` : date-heure de création.
- `texte`: il est crypté par: 
  - type E: la clé A du Comptable (que tous les comptes de l'espace ont).
  - types P et C par la clé P de la partition.
  - types Q et X: pas de texte, juste un code.
- `idSource`: id du délégué ayant créé cette notification pour un type P ou C quand ce n'est pas le Comptable. !!!Discutable!!!

**Remarque:** une notification `{ dh: ... }` correspond à la suppression de la notification antérieure (ni restriction, ni texte).
*/
export class Notification {
  // Factory construisant une objet Notification depuis sa sérialisation
  static deSerial (serial) {
    return new Notification(decode(serial))
  }

  constructor ({nr, dh, texte, idSource}) {
    if (idSource) this.idSource = ID.long(idSource, NomGenerique.ns)
    this.nr = nr || 0
    this.texte = texte || ''
    this.dh = dh || Date.now()
  }

  clone () { return Notification.deSerial(this.serial) }

  /* pour les notif T et C seulement (pour G le concept n'existe pas)
  0:simple 1:lecture 2:accès minimal, 9:aucune */
  get stn () {
    if (!this.texte) return 9
    return this.nr === 0 ? 0 : (this.nr === 3 ? 1 : 2)
  }

  get serial() {
    const x = { nr: this.nr || 0, dh: this.dh }
    if (this.texte) x.texte = this.texte
    if (this.idSource) x.idSource = ID.court(this.idSource)
    return new Uint8Array(encode(x))
  }
}

/****************************************************
 * Tous les objets Documents
****************************************************/
export class GenDoc {
  get pk () { return this.id + (this.ids ? '/' + this.ids : '')}
  static _iv (id, v) { return (Math.floor(id / 1000000 ) * 1000000) + v}
  async compile (row) { }
}

/* Retourne un objet depuis un 'row'
Si le row a une dlv inférieure à la date du jour, retourne un objet avec _zombi = true
Les objets ont au moins les proriétés _nom, id, (ids), (dlv) même _zombi
*/
export async function compile (row) {
  if (!row) return null
  const session = stores.session
  const cl = classes[row._nom]
  if (!cl) return null
  const obj = new cl()
  obj._nom = row._nom
  obj.id = row.id || 0
  if (row.ids) obj.ids = row.ids
  if (row.dlv) obj.dlv = row.dlv
  if (row.dfh) obj.dfh = row.dfh
  obj.v = row.v || 0
  const z = row.dlv && row.dlv < session.auj
  // _zombi : objet dont la dlv est dépassée OU n'ayant pas de _data_
  if (z || !row._data_) {
    obj._zombi = true
  } else {
    const x = decode(row._data_)
    await obj.compile(x)
  }
  return obj
}

export function estZombi (row) {
  const z = row.dlv && row.dlv < stores.session.auj
  // _zombi : objet dont la dlv est dépassée OU n'ayant pas de _data_
  return z || !row._data_
}

/** Espaces **************************************
_data_ :
- `id` : de l'espace de 10 à 89.
- `v`
- `org` : code de l'organisation propriétaire
- `opt`:
  - 0: 'Pas de comptes "autonomes"',
  - 1: 'Le Comptable peut rendre un compte "autonome" sans son accord',
  - 2: 'Le Comptable NE peut PAS rendre un compte "autonome" sans son accord',
- `notif` : notification de l'administrateur, cryptée par la clé du Comptable.
- `t` : numéro de _profil_ de quotas dans la table des profils définis dans la configuration 
  (chaque profil donne un triplet qc q1 q2).
*/
export class Espace extends GenDoc {

  async compile (row) {
    const session = stores.session
    this.org = row.org
    this.opt = row.opt || 0
    this.dcreation = row.dcreation || 20240101
    this.moisStat = row.moisStat || 0
    this.moisStatT = row.moisStatT || 0
    this.dlvat = row.dlvat >= AMJ.min && row.dlvat <= AMJ.max ? row.dlvat : AMJ.max
    this.nbmi = row.nbmi || 6
    this.t = row.t || 0
    // la clé est la clé du Comptable de l'espace
    if (row.notif) {
      const ser = await decrypter(NomGenerique.cleComptable, row.notif)
      this.notif = Notification.deSerial(ser)
    } else this.notif = null
    session.setNotifE(this.notif)
  }

  static async nouveau (org) {
    const session = stores.session
    const r = { 
      id: session.ns, 
      org, 
      v: 1, 
      t: 1, 
      notif: null, 
      dcreation: AMJ.amjUtc(),
      moisStat: 0,
      moisStatT: 0
    }
    return { _nom: 'espaces', id: r.id, org: r.org, v: r.v, _data_: new Uint8Array(encode(r))}
  }
}

/** Synthese *********************************************
_data_:
- `id` : id de l'espace
- `v` : date-heure d'écriture
- `atr` : sérialisation de la table des synthèses des tribus de l'espace. 
  L'indice dans cette table est l'id très court de la tribu (sans le 4 en tête). 
  Chaque élément est la sérialisation de:
  - `qc q1 q2` : quotas de la tribu.
  - `ac a1 a2` : sommes des quotas attribués aux comptes de la tribu.
  - `ca v1 v2` : somme des volumes (approximatifs) effectivement utilisés.
  - `ntr0` : nombre de notifications tribu sans restriction d'accès.
  - `ntr1` : nombre de notifications tribu avec restriction d'accès _lecture seule_.
  - `ntr2` : nombre de notifications tribu avec restriction d'accès _minimal_.
  - `nbc` : nombre de comptes.
  - `nbsp` : nombre de sponsors.
  - `nco0` : nombres de comptes ayant une notification sans restriction d'accès.
  - `nco1` : nombres de comptes ayant une notification avec restriction d'accès _lecture seule_.
  - `nco2` : nombres de comptes ayant une notification avec restriction d'accès _minimal_.
atr[0] est la somme des atr[1..N] : calculé sur compile (pas stocké)
*/
export class Synthese extends GenDoc {

  // lcSynt = ['qc', 'q1', 'q2', 'ac', 'a1', 'a2', 'cj', 'v1', 'v2', 
  // 'ntr0', 'ntr1', 'ntr2', 'nbc', 'nbsp', 'nco0', 'nco1', 'nco2']

  async compile (row) {
    const session = stores.session
    this.atr = new Array(row.atr.length)

    const a0 = { id: 0 }
    lcSynt.forEach(f => { a0[f] = 0 })

    for (let i = 1; i < row.atr.length; i++) {
      const x = decode(row.atr[i])
      if (x && !x.vide) {
        x.id = ID.long(i, session.ns)
        x.pcac = !x.qc ? 0 : Math.round(x.ac * 100 / x.qc) 
        x.pca1 = !x.q1 ? 0 : Math.round(x.a1 * 100 / x.q1) 
        x.pca2 = !x.q2 ? 0 : Math.round(x.a2 * 100 / x.q2) 
        x.pcca = !x.qc ? 0 : Math.round(x.ca * 100 / x.qc) 
        x.pcv1 = !x.q1 ? 0 : Math.round(x.v1 * 100 / x.q1) 
        x.pcv2 = !x.q2 ? 0 : Math.round(x.v2 * 100 / x.q2)   
        lcSynt.forEach(f => { a0[f] +=  x[f] })
      }
      this.atr[i] = x
    }
    a0.pcac = !a0.qc ? 0 : Math.round(a0.ac * 100 / a0.qc) 
    a0.pca1 = !a0.q1 ? 0 : Math.round(a0.a1 * 100 / a0.q1) 
    a0.pca2 = !a0.q2 ? 0 : Math.round(a0.a2 * 100 / a0.q2) 
    a0.pcca = !a0.qc ? 0 : Math.round(a0.ca * 100 / a0.qc) 
    a0.pcv1 = !a0.q1 ? 0 : Math.round(a0.v1 * 100 / a0.q1) 
    a0.pcv2 = !a0.q2 ? 0 : Math.round(a0.v2 * 100 / a0.q2) 
    this.atr[0] = a0 
  }

  static async nouveau (aco, apr) { 
    const session = stores.session
    const r = { id: session.ns, v: Date.now(), atr: [null, null] }

    const e = {}
    lcSynt.forEach(f => { e[f] = 0 })
    e.qc = apr[0]
    e.q1 = apr[1]
    e.q2 = apr[2]
    e.ac = aco[0]
    e.a1 = aco[1]
    e.a2 = aco[2]
    e.nbc = 1
    e.nbsp = 1

    r.atr[1] = new Uint8Array(encode(e))
    return { _nom: 'syntheses', id: r.id, v: r.v, _data_: new Uint8Array(encode(r))}
  }
}

/** Tribu *********************************
_data_:
- `id` : numéro d'ordre de création de la tribu.
- `v`

- `cletX` : clé de la tribu cryptée par la clé K du comptable.
- `qc q1 q2` : quotas totaux de la tribu.
- `stn` : restriction d'accès de la notification _tribu_:
   _0:aucune 1:lecture seule 2:minimal_
- `notif`: notification de niveau tribu cryptée par la clé de la tribu.
- `act` : table des comptes de la tribu. L'index `it` dans cette liste figure dans la propriété `it` du `comptas` correspondant :
  - `idT` : id court du compte crypté par la clé de la tribu.
  - `nasp` : si sponsor `[nom, cle]` crypté par la cle de la tribu.
  - `notif`: notification de niveau compte cryptée par la clé de la tribu.
  - `stn` : restriction d'accès de la notification _compte_: 
    _0:aucune 1:lecture seule 2:minimal_  
  - `qc q1 q2` : quotas attribués.
  - `ca v1 v2` : volumes **approximatifs** effectivement utilisés.
Calculés localement :
- pccj : pourcentage d'utilisation de la consommation journalière / qc
- pcv1 : pourcentage d'utilisation effective de q1 : v1 / q1
- pcv2 : pourcentage d'utilisation effective de qc : v2 / q2

Calcul des compteurs de Synthese dans .synth : 
- cet objet est exactement similaire à une ligne de Synthese.
- plus, calculés localement :
  - pcac : pourcentage d'affectation des quotas : ac / qc
  - pca1 : pourcentage d'affectation des quotas : a1 / q1
  - pca2
  - pccj : pourcentage d'utilisation de la consommation journalière / qc
  - pcv1 : pourcentage d'utilisation effective des quotas : v1 / q1
  - pcv2

*/
export class Tribu extends GenDoc {
  /* Génère la clé de la tribu de numéro d'ordre idx (index de Compta.atr du comptable)*/
  static genCle (idx) { 
    const rnd = random(32)
    rnd[0] = 0
    rnd[1] = Math.floor(idx / 256)
    rnd[2] = idx % 256
    return rnd
  }

  /* Retourne l'id longue d'une tribu depuis sa clé et le ns courant de la session */
  static id (cle) {
    if (!cle) return 0
    const x = (cle[1] * 256) + cle[2] // son numéro d'ordre dans Compta.atr du comptable
    return (NomGenerique.ns * d14) + x
  }

  get nom () { 
    return '#' + ID.court(this.id)
  }

  get info () {
    const aSt = stores.avatar
    const session = stores.session
    return !session.estComptable ? '' : (aSt.compta ? aSt.compta.atr[ID.court(this.id)].info : '')
  }

  get clet () { return getCle(this.id) }

  async compile (row) {
    const session = stores.session
    this.vsh = row.vsh || 0
    this.id = row.id
    this.v = row.v

    /* la clé de la Tribu du COMPTE est décryptée et enregistrée par Compta.compile
    Le comptable est le seul qui peut avoir à accéder à d'autres tribus que la sienne.
    C'est ici que se fait, pour le comptable seulement, l'enregistrement de la clé de
    n'importe quelle tribu */
    this.cletX = row.cletX
    if (session.estComptable) {
      const c = await decrypter(session.clek, row.cletX)
      setClet(c, this.id)
      // désormais la clé de la tribu est accessible par getCle(id)
    }
    const c = this.clet

    this.notif = row.notif ? Notification.deSerial(await decrypter(c, row.notif)) : null

    this.qc = row.qc || 0
    this.q1 = row.q1 || 0
    this.q2 = row.q2 || 0
    this.stn = row.stn || 9

    this.act = []
    if (row.act) for (let it = 0; it < row.act.length; it++) {
      const item = row.act[it]
      if (!item || item.vide) { this.act.push({ vide: true }); continue }
      const r = { }
      r.id = ID.long(await decrypterStr(c, item.idT), NomGenerique.ns)
      r.it = it
      r.notif = item.notif ? Notification.deSerial(await decrypter(c, item.notif)) : null
      r.stn = item.stn || 0
      r.nasp = item.nasp ? NomGenerique.from(decode(await decrypter(c, item.nasp))) : null
      r.qc = item.qc || 0
      r.q1 = item.q1 || 0
      r.q2 = item.q2 || 0
      r.ca = item.ca || 0
      r.v1 = item.v1 || 0
      r.v2 = item.v2 || 0

      r.pcca = !r.qc ? 0 : Math.round(r.ca * 100 / r.qc) 
      r.pcv1 = !r.q1 ? 0 : Math.round(r.v1 * 100 / r.q1) 
      r.pcv2 = !r.q2 ? 0 : Math.round(r.v2 * 100 / r.q2) 
      this.act.push(r)
    }

    const r = { notif: this.notif, id: this.id }
    lcSynt.forEach(f => { r[f] = 0 })
    r.qc = this.qc
    r.q1 = this.q1
    r.q2 = this.q2
    r.ntr0 = row.stn === 0 ? 1 : 0
    r.ntr1 = row.stn === 1 ? 1 : 0
    r.ntr2 = row.stn === 2 ? 1 : 0
    this.act.forEach(x => {
      if (!x.vide) {
        r.ac += x.qc
        r.a1 += x.q1
        r.a2 += x.q2
        r.ca += x.ca
        r.v1 += x.v1
        r.v2 += x.v2
        r.nbc++
        if (x.nasp) r.nbsp++
        if (x.stn === 0) r.nco0++
        else if (x.stn === 1) r.nco1++
        else if (x.stn === 2) r.nco2++
      }
    })
    r.pcac = !r.qc ? 0 : Math.round(r.ac * 100 / r.qc) 
    r.pca1 = !r.q1 ? 0 : Math.round(r.a1 * 100 / r.q1) 
    r.pca2 = !r.q2 ? 0 : Math.round(r.a2 * 100 / r.q2) 
    r.pcca = !r.qc ? 0 : Math.round(r.ca * 100 / r.qc) 
    r.pcv1 = !r.q1 ? 0 : Math.round(r.v1 * 100 / r.q1) 
    r.pcv2 = !r.q2 ? 0 : Math.round(r.v2 * 100 / r.q2) 
    this.synth = r
  }

  get idSponsors () {
    const s = new Set()
    this.act.forEach(x => { if (!x.vide && x.nasp) s.add(x.nasp.id) })
    return s
  }

  get aCompte () {
    for (const x of this.act) if (!x.vide) return true
    return false
  }

  static async getIdT (clet, id) {
    return await crypter(clet, '' + ID.court(id))
  }

  // id de la tribu, q1 , q2 
  static async nouvelle (idt, qt, primitive, qc) {
    const session = stores.session
    const c = getCle(idt)
    const r = {}
    r.vsh = 0
    r.id = idt
    r.v = 1
    r.act = [null]
    r.qc = qt[0]
    r.q1 = qt[1]
    r.q2 = qt[2]
    r.stn = 0
    r.cletX = await crypter(session.clek, c)
    if (primitive) { // inscription du comptable comme premier compte
      const nac = NomGenerique.comptable()
      const item = {
        idT: await Tribu.getIdT(c, nac.id),
        qc: qc[0], q1: qc[1], q2: qc[2],
        ac: 0, a1: 0, a2: 0, stn: 0, ca: 0, v1: 0, v2: 0,
        nasp: await crypter(c, new Uint8Array(encode(nac.anr)))
      }
      r.act.push(item)
    }
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'tribus', id: r.id, v: r.v, _data_ }
  }
}

/** Compta **********************************************************************
_data_ :
- `id` : numéro du compte = id de son avatar principal.
- `v` : 1..N.
- `hXR` : `ns` + `hXR`, hash du PBKFD d'un extrait de la phrase secrète.
- `dlv` : dernier jour de validité du compte.

- `rds`
- `hXC`: hash du PBKFD de la phrase secrète complète (sans son `ns`).
- `cleKXR` : clé K cryptée par XR.

_Comptes "O" seulement:_
- `clePA` : clé P de la partition cryptée par la clé A de l'avatar principal du compte.
- `del` : `true` si le compte est délégué de la partition.
- `it` : index du compte dans `tcpt` de son document `partitions`.

- `mav` : map des avatars du compte. 
  - _clé_ : id court de l'avatar.
  - _valeur_ : `{ rds, claAK }`
    - `rds`: de l'avatar (clé d'accès à son `versions`).
    - `cleAK`: clé A de l'avatar crypté par la clé K du compte.

- `mpg` : map des participations aux groupes:
  - _clé_ : id du groupe
  - _valeur_: `{ cleGK, rds, lp }`
    - `cleGK` : clé G du groupe cryptée par la clé K du compte.
    - rds: du groupe (clé d'accès à son `versions`)
    - `lp`: map des participations: 
      - _clé_: id court de l'avatar.
      - _valeur_: indice `im` du membre dans la table `tid` du groupe (`ids` du membre).

**Comptable seulement:**
- `cleEK` : Clé E de l'espace cryptée par la clé K.
- `tp` : table des partitions : `{c, qc, q1, q2}`. => compilé { cleP, code, qc, q1, q2 }
  - `c` : `{ cleP, code }` crypté par la clé K du comptable
    - `cleP` : clé P de la partition.
    - `code` : texte très court pour le seul usage du comptable.
  - `qc, q1, q2` : quotas globaux de la partition.
*/
export class Compte extends GenDoc {

  async compile (row) {
    this.vsh = row.vsh || 0
    const session = stores.session
    const ns = session.ns
    this.rds = Rds.long(row.rds, ns)
    this.it = row.it || 0
    this.estA = this.it === 0
    this.estDelegue = this.it && row.del
    this.estComptable = ID.estComptable(this.id)

    this.mav = new Map()
    for(const idx in row.mav) {
      const ida = ID.long(parsInt(idx), ns)
      const e = row.mav[idx]
      const rds = Rds.long(e.rds, ns)
      const cleA = await decrypter(session.clek, e.cleAK)
      this.mav.set(ida, { rds, cleA })
      if (ida === this.id) this.cleA = cleA // cleA de l'avatar principal du compte
    }

    if (!this.estA) this.cleP = await decrypter(this.cleA, row.clePA)

    this.mpg = new Map()
    for(const idx in row.mpg) {
      const idg = ID.long(parsInt(idx), ns)
      const e = row.mpg[idx]
      const rds = Rds.long(e.rds, ns)
      const cleG = await decrypter(session.clek, e.cleGK)
      const lp = new Map()
      for(const idx2 in e.lp) {
        const ida = ID.long(parseInt(idx2), ns)
        lp.set(ida, e.lp[idx2])
      }
      this.mpg.set(ida, { rds, cleG, lp })
    }

    if (this.estComptable) {
      this.cleE = await decrypter(session.clek, row.cleEK)
      this.tp = []
      for(const e of row.tp) {
        const c = decode(await decrypter(session.clek, e.c))
        this.tp.push({cleP: c.cleP, code: c.code, qc: e.qc, q1: e.q1, q2: e.q2})
      }
    }
  }

  // retourne le nom / info de la partition id
  infoP (id) { 
    if (!this.tp) return ''
    const a = this.tp[ID.court(id)]
    return a && a.code ? a.code : ''
  }
  
}

/** Compta **********************************************************************
_data_ :
- `id` : numéro du compte = id de son avatar principal.
- `v` : 1..N.

- `rds`
- `dhvuK` : date-heure de dernière vue des notifications par le titulaire du compte, cryptée par la clé K.
- `qv` : `{qc, q1, q2, nn, nc, ng, v2}`: quotas et nombre de groupes, chats, notes, volume fichiers. Valeurs courantes.
- `compteurs` sérialisation des quotas, volumes et coûts.

_Comptes "A" seulement_
- `solde`: résultat, 
  - du cumul des crédits reçus depuis le début de la vie du compte (ou de son dernier passage en compte A), 
  - plus les dons reçus des autres,
  - moins les dons faits aux autres.
- `ticketsK`: liste des tickets cryptée par la clé K du compte `{ids, v, dg, dr, ma, mc, refa, refc, di}`.

- `apropos` : map à propos des contacts (des avatars) et des groupes _connus_ du compte
  - _cle_: `id` court de l'avatar ou du groupe,
  - _valeur_ : `{ hashtags, texte }` cryptée par la clé K du compte.
    - `hashtags` : liste des hashtags attribués par le compte.
    - `texte` : commentaire écrit par le compte.

Juste après une conversion de compte "O" en "A", `ticketsK` est vide et le `solde` est de 2c.
*/
export class Compta extends GenDoc {

  async compile (row) {
    this.vsh = row.vsh || 0
    const session = stores.session
    const ns = session.ns
    this.rds = Rds.long(row.rds, ns)
    this.dhvu = row.dhvuK ? parseInt(await decrypterStr(session.clek, row.dhvuK)) : 0
    this.qv = row.qv
    this.compteurs = new Compteurs(row.compteurs, this.qv)
    this.pc = this.compteurs.pourcents.max
    this.solde = row.solde || 0
    if (row.ticketsK) this.tickets = decode(await decrypter(session.clek, row.ticketsK))
    this.estA = this.tickets !== undefined
    this.apropos = new Map()
    if (row.apropos) for(const idx in row.apropos) {
      const id = ID.long(parseInt(idx, session.ns))
      const ht = decode(await decrypter(session.clek, row.apropos[idx]))
      this.apropos.set(id, ht)
    }
  }

  /* 
  Pour un compte A c'est la date à laquelle le crédit tombe à 0 
  prolongée au dernier jour du mois.
  Pour un compte O, c'est la plus proche des deux dlv,
  - a) celle donnée par l'administrateur technique dans espace,
  - b) celle correspondant à (nbmi * 30 jours) + auj, prolongée au dernier jour du mois.
  a) est le premier jour du mois qui suit la dlv, b) est le dernier jour du mois de dlv
  Dans les deux cas c'est 0 si elle est déjà dépassée.
  Pour un compteO, total est donné à 0
  */
  calculDlv (total) {
    if (ID.estComptable(this.id)) return AMJ.max
    return this.estA ? Compta.dlvA(this.compteurs, total) : Compta.dlvO()
  }

  static dlvA (compteurs, total) {
    const session = stores.session
    const dlvmax = AMJ.djMois(AMJ.amjUtcPlusNbj(session.auj, session.espace.nbmi * 30))
    const nbj = compteurs.nbj(total)
    const d = AMJ.djMois(AMJ.amjUtcPlusNbj(session.auj, nbj))
    return dlvmax > d ? d : dlvmax
  }

  // dlv estimée d'un compte A muté depuis son compteurs actuel avec un solde minimal
  static dlvAinit (compteurs) {
    const dlvmax = AMJ.djMois(AMJ.amjUtcPlusNbj(session.auj, session.espace.nbmi * 30))
    const nbj = compteurs.nbj(Compta.creditMinimal, true)
    const d = AMJ.djMois(AMJ.amjUtcPlusNbj(session.auj, nbj))
    return dlvmax > d ? d : dlvmax
  }

  static dlvO () {
    const session = stores.session
    const dlvmax = AMJ.djMois(AMJ.amjUtcPlusNbj(session.auj, session.espace.nbmi * 30))
    return dlvmax > session.espace.dlvat ? session.espace.dlvat : dlvmax
  }

  async debitDon (don) {
    const session = stores.session
    const credits = { ...this.credits }
    // credits.bla = '*******************************************************************'
    credits.total -= don
    const r = await crypter(session.clek, new Uint8Array(encode(credits)))
    // const x = decode(await decrypter(session.clek, r))
    const dlv = this.calculDlv(credits.total)
    return { dlv, creditsK: r}
  }

  /* Depuis la liste actuelle des tickets de compta,
  - enlève les obsolètes,
  - ajoute tk s'il n'y était pas, le remplace sinon
  - retourne credits crypté par la clé K
  */
  async creditsSetTk (tk) {
    const credits = { total: this.credits.total, tickets: [] }
    let repl = false
    this.credits.tickets.forEach(t => {
      if (!Ticket.estObsolete(t)) {
        if (t.ids === tk.ids) {
          credits.tickets.push(tk)
          repl = true
        } else {
          credits.tickets.push(t)
        }
      }
    })
    if (!repl && !Ticket.estObsolete(tk)) credits.tickets.push(tk)
    const session = stores.session
    return await crypter(session.clek, new Uint8Array(encode(credits)))
  }

  /* Depuis la liste actuelle des tickets de compta,
  - enlève les obsolètes,
  - ajoute tk s'il n'y était pas, le remplace sinon
  - retourne credits crypté par la clé K
  */
  async creditsUnsetTk (ids) {
    const credits = { total: this.credits.total, tickets: [] }
    this.credits.tickets.forEach(t => {
      if (!Ticket.estObsolete(t)) {
        if (t.ids !== ids) credits.tickets.push(t)
      }
    })
    const session = stores.session
    return await crypter(session.clek, new Uint8Array(encode(credits)))
  }

  /* Incorporation des tickets et des dons en attente au credits,
  - des tickets mis à jour reçus dans m (s'il y en a)
  - des montants des dons en attente (s'il y en a)
  Retourne credits crypté par la clé K, ou null si inchangé

  Ticket:
  - `id`: id du Comptable.
  - `ids` : numéro du ticket
  - `v` : version du ticket.

  - `dg` : date de génération.
  - `dr`: date de réception. Si 0 le ticket est _en attente_.
  - `ma`: montant déclaré émis par le compte A.
  - `mc` : montant déclaré reçu par le Comptable.
  - `refa` : texte court (32c) facultatif du compte A à l'émission.
  - `refc` : texte court (32c) facultatif du Comptable à la réception.
  - `di`: date d'incorporation du crédit par le compte A dans son solde.
  */
  async majCredits (m) {
    const credits = { total: this.credits.total, tickets: [] }
    let maj = this.toSave || false

    function incorp (tk) {
      if (m) m.delete(tk.ids)
      if (!Ticket.estObsolete(tk)) {
        maj = true
        if (tk.dr && !tk.di) {
          tk.di = AMJ.amjUtc()
          credits.total += tk.ma > tk.mc ? tk.mc : tk.ma
        }
        credits.tickets.push(tk)
      }
    }

    this.credits.tickets.forEach(t => {
      /* report des tickets actuels:
      - éventeullemnt mis à jor
      - si pas obsolète
      - en incorporant éventuellement leur montant dans le solde
      */
      const tk = m ? m.get(t.ids) : null
      if (tk) { // rafraichi par m
        incorp(tk)
      } else {
        if (Ticket.estObsolete(t)) maj = true
        else credits.tickets.push(t)
      }
    })
    if (m && m.size) m.forEach((ids, tk) => { 
      incorp(tk)
    })

    if (this.dons) {
      this.dons.forEach(mc => { 
        credits.total += mc 
      })
      maj = true
    }

    const session = stores.session
    if (maj) {
      const creditsK = await crypter(session.clek, new Uint8Array(encode(credits)))
      const dlv = this.calculDlv(credits.total)
      return { dlv, creditsK }
    } else 
      return { dlv: 0, creditsK: null }
  }

  static async atrItem (clet, info, q) {
    const session = stores.session
    const item = {clet, info, q}
    return await crypter(session.clek, new Uint8Array(encode(item)))
  }

  static async row (na, clet, cletX, q, estSponsor, ns, phrase, nc, don) { 
    /* création d'une compta
    Pour le comptable le paramètre cletX est null (il est calculé). 
    Pour les autres, c'est le nctkc pris dans la tribu
    nc : nombre de chats
    don: montant du don
    */
    const session = stores.session
    const cfg = stores.config
    const r = {}
    r.id = na.id
    r.v = 1
    r.vcv = 0
    r.vsh = 0

    /*
    const k = random(32)
    r.kx = await crypter(phrase.pcb, k)
    session.clek = k
    */

    r.sp = estSponsor ? 1 : 0
    r.hps1 = (ns * d14) + phrase.hps1
    r.hpsc = phrase.hpsc
    
    r.qv = { qc: q[0], q1: q[1], q2: q[2], nn: 0, nc: nc || 0, ng: 0, v2: 0}
    const compteurs = new Compteurs(null, r.qv)
    r.compteurs = compteurs.serial

    const estC = ID.estComptable(na.id) 
    let dlv
    if (clet) {
      // compte O
      r.it = 1 // 1 pour une création d'espace, sera surchargé sur le serveur en AcceptationSponsoring
      r.cletK = await crypter(k, clet)
      r.cletX = estC ? r.cletK : cletX
      dlv = estC ? AMJ.max : Compta.dlvO()
    } else {
      // compte A
      const donx = don || cfg.donorg
      r.it = 0
      r.cletK = null
      r.cletX = null
      const cr = { total: donx, tickets: [] }
      r.credits = await crypter(k, new Uint8Array(encode(cr)))
      dlv = Compta.dlvA(compteurs, donx)
    }
    r.dlv = dlv

    if (estC) {
      const x = { clet, info: '', q }
      r.atr = [ null, await crypter(k, new Uint8Array(encode(x)))]
      r.astn = [0, 0]
    }

    const _data_ = new Uint8Array(encode(r))
    return { dlv: dlv, rowCompta: { _nom: 'comptas', id: r.id, v: r.v, hps1: r.hps1, _data_ }}
  }

}

/** Avatar *********************************************************
_data_:
- `id` : id de l'avatar.
- `v` : 1..N.
- `vcv` : version de la carte de visite afin qu'une opération puisse détecter (sans lire le document) si la carte de visite est plus récente que celle qu'il connaît.
- `hpc` : hash de la phrase de contact.

**Données n'existant que pour un avatar principal**
- `mck` : map des mots-clés du compte cryptée par la clé K -la clé est leur code 1-99- ("code": nom@catégorie).
- `mavk` : map des avatars du compte. 
  - _clé_ : id court de l'avatar cryptée par la clé K du compte.
  - _valeur_ : couple `[nom clé]` de l'avatar crypté par la clé K du compte.
- `mpgk` : map des participations aux groupes des avatars du compte.
  - _clé_: `npgk`. hash du cryptage par la clé K du compte de `idg / idav`. Cette identification permet au serveur de supprimer une entrée de la map sans disposer de la clé K. `idg`: id courte du groupe, `idav`: id courte de l'avatar.
  - _valeur_: `{nomg, cleg, im, idav}` cryptée par la clé K.
    - `nomg`: nom du groupe,
    - `cleg`: clé du groupe,
    - `im`: indice du membre dans la table `flags/anag` du groupe.
    - `idav` : id (court) de l'avatar.
- `mcmemos` : map des couples `{mc, memo}` à propos des contacts (avatars) et groupes connus du compte:
  - _cle_: `id` crypté par la clé K du compte,
  - _valeur_ : `{ mc, memo }` crypté par la clé K du compte.
    - `mc` : mots clés du compte à propos du groupe.
    - `memo` : commentaire du compte à propos du groupe.

**Données disponibles pour tous les avatars**
- `pub` : clé publique RSA.
- `privk`: clé privée RSA cryptée par la clé K.
- `cva` : carte de visite cryptée par la clé _CV_ de l'avatar `{v, photo, info}`.
- `invits`: maps des invitations en cours de l'avatar:
  - _clé_: `ni`, numéro d'invitation. hash du cryptage par la clé du groupe de la clé _inversée_ de l'avatar. Ceci permet à un animateur du groupe de détruire l'entrée.
  - _valeur_: `{nomg, cleg, im, ivpar, dh}` cryptée par la clé publique RSA de l'avatar.
    - `nomg`: nom du groupe,
    - `cleg`: clé du groupe,
    - `im`: indice du membre dans la table `flags / anag` du groupe.
    - `ivpar`: indice im de l'invitant
    - `dh`: date-heure d'invitation
- `pck` : PBKFD de la phrase de contact cryptée par la clé K.
- `napc` : `[nom, cle]` de l'avatar cryptée par le PBKFD de la phrase de contact.
*/
export class Avatar extends GenDoc {
  get na () { return getNg(this.id) }
  // get nbGroupes () { return this.lgr.size }
  get photo () { return this.cv && this.cv.photo ? this.cv.photo : stores.config.iconAvatar }

  // retourne l'array des na des avatars du compte (trié ordre alpha, PRIMAIRE EN TETE)
  get lstAvatarNas () {
    const t = []; for(const na of this.mav.values()) { t.push(na) }
    const idc = this.naprim.id
    t.sort((a,b) => { return a.id === idc ? -1 : (b.id === idc ? 1 : (a.nom < b.nom ? -1 : (a.nom === b.nom ? 0 : 1)))})
    return t
  }

  estAvDuCompte (id) { return this.mav.has(id) }

  avatarDeNom (n) { // retourne l'id de l'avatar de nom n (ou 0)
    for(const na of this.mav.values()) { if (na.nom === n) return na.id }
    return 0
  }
  
  /* mpg : Map
  - _clé_: `npgk`. hash du cryptage par la clé K du compte de `idg / idav`. Cette identification permet au serveur de supprimer une entrée de la map sans disposer de la clé K. `idg`: id courte du groupe, `idav`: id courte de l'avatar.
  - _valeur_: `{ng, im, idav}`
    - `ng`: nom complet du groupe,
    - `im`: indice du membre dans la table `ast` du groupe.
    - `id` : id de l'avatar.
  */
  naDeIdgIm (idg, im) {
    for (const [npgk, e] of this.mpg) {
      if (e.ng.id === idg && e.im === im) return getNg(e.id)
    }
    return null
  }

  // Retourne [amb, amo] - un avatar au moins accède aux membres / notes du groupe
  ambano (groupe) {
    let ano = false, amb = false
    for (const [c, e] of this.mpg) {
      if (groupe.anag[e.im] > 1) {
        const f = groupe.flags[e.im]
        if ((f & FLAGS.AM) && (f & FLAGS.DM)) amb = true
        if ((f & FLAGS.AN) && (f & FLAGS.DN)) ano = true
      }
    }
    return [amb, ano]
  }

  /* Ids des groupes de l'avatar ida (tous si absent), accumulés dans le set s */
  idGroupes (ida) {
    const x = new Set()
    this.mpg.forEach(e => { if (!ida || e.id === ida) x.add(e.ng.id) })
    return x
  }

  /* im de l'avatar ida dans le groupe idg */
  imGA (idg, ida) {
    for (const [ ,e]  of this.mpg){
      if (e.ng.id === idg && e.id === ida) return e.im
    }
    return 0
  }

  /* Map(ida, im) des avatars du compte dans mpg ou les invits des avatars (sauf noinv)*/
  imIdGroupe (idg) { // map (cle:id val:im) pour le groupe idg
    const m = new Map()
    this.mpg.forEach(e => { if (e.ng.id === idg) m.set(e.id, e.im) })
    const aSt = stores.avatar
    aSt.map.forEach(e => {
      if (e.avatar.invits) e.avatar.invits.forEach(x => { // { ng, im, id }
        if (x.ng.id === idg) m.set(x.id, x.im)
      })
    })
    return m
  }

  /* Map (cle:im val:na) des avc participants au groupe idg, 
  et sur option invits ayant une invitation dans le groupe */
  imNaGroupe (idg, invits) { 
    const m = new Map()
    this.mpg.forEach(e => { if (e.ng.id === idg) m.set(e.im, this.mav.get(e.id)) })
    if (invits) {
      const aSt = stores.avatar
      aSt.map.forEach(e => {
        if (e.avatar.invits) e.avatar.invits.forEach(x => { // { ng, im, id }
          if (x.ng.id === idg) m.set(x.im, e.avatar.na)
        })
      })
    }
    return m
  }

  /* Map(im, na) des avatars du compte participant à idg d'après membres*/
  imNaGroupeMB (idg) {
    const m = new Map()
    const gSt = stores.groupe
    const mm = gSt.getMembres(idg)
    if (mm) mm.forEach(e => {
      if (this.avatarIds.has(e.na.id)) m.set(e.ids, e.na)
    })
    return m
  }

  imGroupe (idg) {
    const s = new Set()
    this.mpg.forEach(e => { if (e.ng.id === idg) s.add(e.im) })
    return s
  }
  
  // Retourne {mc, memo} à propos d'une id donnée
  mcmemo (id) { return this.mcmemos.get(id) }

  get lavLmb () {
    const lav = Array.from(this.mav.keys())
    const lmb = []
    for (const [, empg] of this.mpg) lmb.push([empg.ng.id, empg.im])
    return [lav, lmb]
  }

  /** compile *********************************************************/
  async compile (row) {
    const session = stores.session
    const gSt = stores.groupe
    this.vsh = row.vsh || 0
    this.vcv = row.vcv || 0
    this.hpc = row.hpc
    this.napc = row.napc

    // Avatar principal
    if (session.compteId === this.id) {
      if (row.mck) {
        this.mc = decode(await decrypter(session.clek, row.mck))
      } else this.mc = {}
      if (row.memok) {
        this.memo = await decrypterStr(session.clek, row.memok)
      } else this.memo = ''

      this.mav = new Map()
      for(const i in row.mavk) {
        const [nom, cle] = decode(await decrypter(session.clek, row.mavk[i]))
        const na = NomGenerique.from([nom, cle])
        this.mav.set(na.id, na)
        if (na.id === this.id) this.naprim = na
      }
      this.avatarIds = new Set(this.mav.keys())
  
      this.mcmemos = new Map()
      if (row.mcmemos) { for (const x in row.mcmemos) {
          const id = parseInt(await decrypterStr(session.clek, b64ToU8(x)))
          const e = decode(await decrypter(session.clek, row.mcmemos[x]))
          this.mcmemos.set(id, e)
        }  
      }

      this.mpg = new Map()
      for(const i in row.mpgk) {
        const npgk = parseInt(i)
        const { nomg, cleg, im, idav } = decode(await decrypter(session.clek, row.mpgk[i]))
        const ng = NomGenerique.from([nomg, cleg])
        const id = ID.long(idav, session.ns)
        this.mpg.set(npgk, { ng, im, id })
      }
    }

    const kcv = getCle(this.id)
    this.priv = await decrypter(session.clek, row.privk)
    this.pub = row.pub
    // const pem = abToPem(this.pub, 'PUBLIC')
    // console.log(pem)

    if (row.pck) { // phrase de contact cryptée par la clé K.
      this.pc = await decrypterStr(session.clek, row.pck)
    } else this.pc = null

    if (row.cva) { // carte de visite cryptée par la clé de la CV de l'avatar, `{v, photo, info}`.
      this.cv = decode(await decrypter(kcv, row.cva))
    } else this.cv = null

    this.invits = new Map()
    gSt.clearInvits(this.na.id)
    if (row.invits) {
      for (const nx in row.invits) {
        const ni = parseInt(nx)
        const {nomg, cleg, im, ivpar, dh} = decode(await decrypterRSA(this.priv, row.invits[nx]))
        const ng = NomGenerique.from([nomg, cleg])
        gSt.setInvit(ng, this.na, im, ivpar, dh)
        this.invits.set(ni, { ng, im, id: this.id, ivpar, dh })
      }
    }
  }

  get mgkParIdg () {
    const m = new Map()
    for (const [npgk, empg] of this.mpg) {
      const idg = empg.ng.id
      let x = m.get(idg)
      if (!x) { x = { npgks: new Set(), ims: new Set() }; m.set(idg, x) }
      x.npgks.add(npgk)
      x.ims.add(empg.im)
    }
    return m
  }

  async getEpgk (ni) { // {nomg, cleg, im, idav (court)} cryptée par la clé K.
    const e = this.invits.get(ni)
    const x = { nomg: e.ng.nom, cleg: e.ng.rnd, im: e.im, idav: ID.court(e.id)}
    return await crypter(stores.session.clek, new Uint8Array(encode(x)))
  }

  static async genMcMemo (id, mc, memo) {
    const session = stores.session
    const idk = u8ToB64(await crypter(session.clek, '' + id, 1))
    const mmk = (!mc || !mc.length) && !memo ? null : 
      await crypter(session.clek, new Uint8Array(encode({mc, memo})))
    return [idk, mmk]
  }

  static async primaireRow (na, publicKey, privateKey, second) {
    const session = stores.session
    const r = {}
    r.id = na.id
    r.v = 1
    r.vcv = 0
    r.privk = await crypter(session.clek, privateKey)
    r.pub = publicKey
    if (!second) {
      r.mavk = {}
      const c = await Avatar.mavkK(na.id)
      const v = await Avatar.mavkKV(na)
      r.mavk[c] = v
    }
    const _data_ = new Uint8Array(encode(r))
    const row = { _nom: 'avatars', id: r.id, v: r.v, vcv: r.vcv, _data_ }
    return row
  }

  static async mavkKV (na) {
    return await crypter(stores.session.clek, new Uint8Array(encode([na.nomx, na.rnd])))
  }

  static async mavkK (id) {
    return hash(await crypter(stores.session.clek, '' + ID.court(id), 1))
  }

}

/* Cv : n'a qu'un seul champ cva - id: de l'avatar
cva : { v, photo, info } - crypté par la clé de l'avatar
*/
export class Cv extends GenDoc {
  async compile (row) {
    const k = getCle(this.id)
    const b = await decrypter(k, row.cva)
    this.cv = decode(b)
  }
}

/** Sponsoring ************************************************************
P est le parrain-sponsor, F est le filleul.

_data_
- `id` : id de l'avatar sponsor.
- `ids` : hash de la phrase de parrainage, 
- `v`
- `dlv` : date limite de validité

- `st` : statut. 0: en attente réponse, 1: refusé, 2: accepté, 3: détruit
- `pspk` : phrase de sponsoring cryptée par la clé K du sponsor.
- `bpspk` : PBKFD de la phrase de sponsoring cryptée par la clé K du sponsor.
- `dh`: date-heure du dernier changement d'état
- `descr` : crypté par le PBKFD de la phrase de sponsoring
  - `na` : `[nom, cle]` de P.
  - `cv` : `{ v, photo, info }` de P.
  - `naf` : `[nom, cle]` attribué au filleul.
  - `sp` : vrai si le filleul est lui-même sponsor.
  - `clet` : clé de sa tribu, si c'est un compte O
  - `quotas` : `[qc, q1, q2]` quotas attribués par le sponsor.
    - pour un compte A `[0, 1, 1]`. Un compte A n'a pas de qc et peut changer à loisir `[q1, q2]` qui sont des protections pour lui-même (et fixe le coût de l'abonnement).
  - `don` : pour un compte autonome, montant du don
  - `dconf` : le sponsor a demandé à rester confidentiel
- `ardx` : ardoise de bienvenue du sponsor / réponse du filleul cryptée par le PBKFD de la phrase de sponsoring
*/
export class Sponsoring extends GenDoc {

  /* Par l'avatar sponsor */
  async compile (row) {
    this.st = row.st
    this.vsh = row.vsh || 0
    this.dh = row.dh
    const clek = stores.session.clek
    this.psp = await decrypterStr(clek, row.pspk)
    const clex = await decrypter(clek, row.bpspk)
    this.ard = await decrypterStr(clex, row.ardx)
    this.org = row.org
    this.descr = {}
    await Sponsoring.decrypterDescr(this.descr, clex, row.descrx)
  }

  /* Par le candidat sponsorisé qui connaît la clé X
    du fait qu'il connaît la phrase de sponsoring
  */
  static async fromRow (row, clex) {
    const x = decode(row._data_)
    const obj = {}
    obj.org = x.org
    obj.dlv = x.dlv
    obj.id = x.id
    obj.ids = x.ids
    obj.dh = x.dh
    obj.st = x.st
    obj.ard = await decrypterStr(clex, x.ardx)
    await Sponsoring.decrypterDescr(obj, clex, x.descrx)
    return obj
  }

  static async decrypterDescr (obj, clex, descrx) {
    const x = decode(await decrypter(clex, descrx))
    obj.cv = x.cv
    obj.sp = x.sp || false
    obj.it = x.it || 0
    obj.quotas = x.quotas
    obj.cletX = x.cletX || null
    obj.na = NomGenerique.from(x.na)
    obj.naf = NomGenerique.from(x.naf)
    obj.clet =  x.clet || null
    obj.don = x.don || 0
    obj.dconf = x.dconf || false
  }

  static async nouveauRow (phrase, dlv, nom, cletX, clet, sp, quotas, ard, don, dconf) {
    /* 
      - 'phrase: objet phrase
      - 'dlv'
      - 'nom': nom de l'avatar du compte à créer
      - 'cletX' : clé de la tribu crypté par la clé K du comptable
      - `clet` : cle de la tribu.
      - `sp` : 1 si le filleul est lui-même sponsor 
      - `quotas` : `[qc, q1, q2]` quotas attribués par le parrain
      - `ard`: mot de bienvenue
      - `don`: montant du don
      - `dconf`: don confidentiel
    */
    const session = stores.session
    const aSt = stores.avatar
    const av = aSt.avC
    const n = NomGenerique.avatar(nom)
    const d = { 
      na: [av.na.nom, av.na.rnd],
      cv: av.cv,
      naf: [n.nom, n.rnd],
      sp, quotas,
      cletX: cletX || null, 
      clet: clet || null, 
      it : 0,
      don,
      dconf
    }
    if (!aSt.estSponsor && !session.estComptable) {
      const c = aSt.compta
      d.it = c.it || 0
    }
    const descrx = await crypter(phrase.pcb, new Uint8Array(encode(d)))
    const ardx = await crypter(phrase.pcb, ard || '')
    const pspk = await crypter(session.clek, phrase.phrase)
    const bpspk = await crypter(session.clek, phrase.pcb)
    const org = session.org
    const ids = (session.ns * d14) + phrase.hps1
    const _data_ = new Uint8Array(encode({ 
      id: av.id,
      org,
      ids,
      dlv,
      st: 0,
      dh: Date.now(),
      pspk,
      bpspk,
      descrx,
      ardx,
      vsh: 0
    }))
    const row = { _nom: 'sponsorings', id: av.id, ids, dlv, _data_ }
    return row
  }
}

/** Ticket ***********************************************
Il y a un document `tickets` par ticket de paiement généré.
_data_:
- `id`: id du Comptable.
- `ids` : numéro du ticket
- `v` : version du ticket.

- `dg` : date de génération.
- `dr`: date de réception. Si 0 le ticket est _en attente_.
- `ma`: montant déclaré émis par le compte A.
- `mc` : montant déclaré reçu par le Comptable.
- `refa` : texte court (32c) facultatif du compte A à l'émission.
- `refc` : texte court (32c) facultatif du Comptable à la réception.
- `di`: date d'incorporation du crédit par le compte A dans son solde.
*/
export class Ticket extends GenDoc {
  async compile (row) {
    this.dg = row.dg
    this.ma = row.ma || 0
    this.mc = row.mc || 0
    this.di = row.di || 0
    this.dr = row.dr || 0
    this.refa = row.refa || ''
    this.refc = row.refc || ''
  }

  /* Un ticket est obsolète SSI,
  a) il est encore en attente (n'a pas été reçu)
  b) ET que sa génération a plus de 2 mois
  */
  static estObsolete (tk) {
    return tk.dr === 0 && AMJ.amjUtc() > AMJ.djMoisN(tk.dg, 2)
  }

  clone () {
    const t = new Ticket()
    t.id = this.id; t.ids = this.ids; t.ma = this.ma; t.mc = this.mc;
    t.refa = this.refa; t.refc = this.refc; t.di = this.di
    return t
  }

  static nouveauRow (ids, ma, refa) {
    const session = stores.session
    const r = { 
      id: ID.duComptable(session.ns),
      ids, ma, refa: refa || 0, 
      mc: 0, refc: 0, di: 0, dr: 0, dg: AMJ.amjUtc()
    }
    const rowTicket = { _nom: 'tickets', id: r.id, ids, _data_: new Uint8Array(encode(r)) }
    return { rowTicket, ticket: r }
  }

  async recepRow (mc, refc) {
    const t = { }
    t.id = this.id; t.ids = this.ids; t.ma = this.ma; t.mc = mc;
    t.refa = this.refa; t.refc = refc; t.di = 0
    t.dr = Date.now()
    return { _row: 'tickets', id, ids, _data_: new Uint8Array(encode(r)) }
  }

  async incorpRow () {
    const t = { }
    t.id = this.id; t.ids = this.ids; t.ma = this.ma; t.mc = this.mc;
    t.refa = this.refa; t.refc = this.refc;
    t.di = Date.now()
    return { _row: 'tickets', id, ids, _data_: new Uint8Array(encode(r)) }
  }

}

/** Chat ************************************************************
_data_ (de l'exemplaire I):
- `id`: id de A,
- `ids`: hash du cryptage de `idI_court/idE_court` par la clé de I.
- `v`: 1..N.
- `vcv` : version de la carte de visite de E.

- `st` : deux chiffres `I E`
  - I : 0:passif, 1:actif
  - E : 0:passif, 1:actif, 2:disparu
- `cva` : `{v, photo, info}` carte de visite de E au moment de la création / dernière mise à jour du chat, cryptée par la clé de E.
- `cc` : clé `cc` du chat cryptée par la clé K du compte de I ou par la clé publique de I (quand le chat vient d'être créé par E).
- `nacc` : `[nom, cle]` de E crypté par la clé du chat.
- `items` : liste des items `[{a, dh, l t}]`
  - `a` : 0:écrit par I, 1: écrit par E
  - `dh` : date-heure d'écriture.
  - `dhx` : date-heure d'effacement (txt est vide).
  - `l` : taille du texte.
  - `txt` : texte crypté par la clé du chat (vide s'il a été supprimé).

  Compilé:
  - seq
  - dh
  - naE
  - txt
  - cv
  - cc (décryptée)
*/
export class Chat extends GenDoc {
  get naI () { return getNg(this.id) }

  get stI () { return Math.floor(this.st / 10) }
  get stE () { return this.st % 10 }

  async compile (row) {
    const aSt = stores.avatar
    const session = stores.session
    this.vsh = row.vsh || 0
    this.st = row.st || 0
    if (row.cc.length === 256) {
      const av = aSt.getAvatar(this.id)
      this.cc = await decrypterRSA(av.priv, row.cc)
      this.ccK = await crypter(session.clek, this.cc)
    } else {
      this.cc = await decrypter(session.clek, row.cc)
      this.ccK = null
    }
    this.naE = NomGenerique.from(decode(await decrypter(this.cc, row.nacc)))
    this.cv = row.cva ? decode(await decrypter(this.naE.rnd, row.cva)) : null
    this.idsE = await Chat.getIds(this.naE, this.naI)
    this.items = []
    const a = []
    const supp = $t('supprime')
    this.tit = ''
    this.dh = 0
    let t1r = false
    this.yo = false
    if (row.items) for (const it of row.items) {
      const t = it.txt ? ungzipB(await decrypter(this.cc, it.txt)) : null
      if (!t1r && it.a === 1) {
        if (t === '**YO**') this.yo = true
        t1r = true
      }
      if (this.dh === 0) this.dh = it.dhx ? it.dhx : it.dh
      this.items.push({ a: it.a, txt: t, dh: it.dh, dhx: it.dhx || 0})
      a.push('_**' + $t('dedh', [it.a ? this.naI.nom : this.naE.nom, dhstring(it.dh)]) + '**_')
      if (it.dhx) a.push('\n' + $t('supprime', [dhstring(it.dhx)]) + '\n')
      else a.push('\n' + t + '\n')
      a.push('\n')
      if (!this.tit && t) this.tit = titre(t)
    }
    this.txt = a.join('\n')
    if (!this.tit) this.tit = '???'
  }

  static async getIds (naI, naE) {{
    return hash(await crypter(naI.rnd, ID.court(naI.id) + '/' + ID.court(naE.id), 1))
  }}

  /*
  st: 10 pour le chat I, 1 pour le chat E
  naI, naE : na des avatars I et E
  dh : date-heure d'écriture
  txt: texte du chat
  seq: numéro de séquence du "source" d'où txt a été modifié
  cc: clé du chat : si null créé random
  publicKey: clé publique de I. Si null récupérée depuis son avatar
  mc: mot clés attribués
  */
  static async newRows (naI, naE, txt, cc, pubE) {
    const [itI, itE] = Chat.newItems(txt, cc)
    const rI = { 
      id: naI.id, 
      ids: await Chat.getIds(naI, naE), 
      st: 10,
      cc: await crypter(stores.session.clek, cc),
      nacc: await crypter(cc, encode([naE.nom, naE.rnd])),
      items: [itI]
    } // v vcv cva sont mis par le serveur
    const rE = { 
      id: naE.id, 
      ids: await Chat.getIds(naE, naI), 
      st: 1,
      cc: await crypter(await crypterRSA(pubE, cc)),
      nacc: await crypter(cc, encode([naI.nom, naI.rnd])),
      items: [itE]
    } // v vcv cva sont mis par le serveur
    const I = new Uint8Array(encode(rI))
    const E = new Uint8Array(encode(rE))
    return [{ _nom: 'chats', id: rI.id, ids: rI.ids, _data_: I}, 
      { _nom: 'chats', id: rE.id, ids: rE.ids, _data_: E}]
  }

  static async newItems (txt, cc) {
    const dh = Date.now()
    const t = txt ? await crypter(cc, gzipB(txt)) : null
    const l = txt ? txt.length : 0
    return [{dh, a:0, txt: t, l}, {dh, a:1, t, l}]
  }

  static async getTxtCC (cc, txt) {
    return txt ? await crypter(cc, gzipB(txt)) : null
  }
}

/** Groupe ***********************************************************************
_data_:
- `id` : id du groupe.
- `v` :  1..N, version du groupe de ses notes et membres.
- `dfh` : date de fin d'hébergement.

- `idhg` : id du compte hébergeur crypté par la clé du groupe.
- `imh` : indice `im` du membre dont le compte est hébergeur.
- `msu` : mode _simple_ ou _unanime_.
  - `null` : mode simple.
  - `[ids]` : mode unanime : liste des indices des animateurs ayant voté pour le retour au mode simple. La liste peut être vide mais existe.
- `flags` : table des flags des membres (12 bits sur un entier).
- `anag` : table des nag des membres.
- `lna` : liste noire _animateurs_ des `nag` des avatars à ne pas inviter / ré-inviter.
- `lnc` : liste noire _comptes_ des `nag` des avatars à ne pas inviter / ré-inviter.
- `mcg` : liste des mots clés définis pour le groupe cryptée par la clé du groupe.
- `cvg` : carte de visite du groupe cryptée par la clé du groupe `{v, photo, info}`.
*/

export class Groupe extends GenDoc {
  get cle () { return getCle(this.id) }
  get na () { return getNg(this.id) }
  get nom () { return this.na.nom }
  get nomc () { return this.na.nomc }
  get photo () { return this.cv && this.cv.photo ? this.cv.photo : stores.config.iconGroupe }
  
  get nbInvits () { let n = 0
    for (let im = 1; im < this.flags.length; im++) { 
      const f = this.flags[im]
      if (f & FLAGS.IN) n++ 
    }
    return n
  }

  get nbAnims () { let n = 0
    for (let im = 1; im < this.flags.length; im++) { 
      const f = this.flags[im]
      if ((f & FLAGS.PA) && (f & FLAGS.AC)) n++ 
    }
    return n
  }

  estContact (im) { return this.anag[im] && this.anag[im] > 1 && !(this.flags[im] & FLAGS.AC) }
  estDisparu (im)  { return !this.anag[im] || this.anag[im] === 1 }
  estInvite (im) { return this.flags[im] & FLAGS.IN }
  estActif (im) { return this.flags[im] & FLAGS.AC }
  estAnim (im) { const f = this.flags[im] || 0; return (f & FLAGS.AC) && (f & FLAGS.PA) }
  estAuteur (im) { const f = this.flags[im] || 0; 
    return (f & FLAGS.AC) && (f & FLAGS.AN) && (f & FLAGS.DN) && (f & FLAGS.DE) 
  }
  estInvitable (im) { const f = this.flags[im] || 0; 
    return !(f & FLAGS.AC) && !(f & FLAGS.IN) && !this.enLNA(im) && !this.enLNC(im)
  }
  estOubliable (im) { const f = this.flags[im] || 0; 
    return !(f & FLAGS.AC) && !(f & FLAGS.IN) && !(f & FLAGS.HA)
  }

  estHeb (im) { return this.estActif(im) && im === this.imh }
  accesMembre (im) {
    const f = this.flags[im] || 0;
    return (f & FLAGS.AC) && (f & FLAGS.AM) && (f & FLAGS.DM) 
  }
  aUnAccesMembre (s) { // Set des im
    let b = false
    s.forEach(im => { if (this.accesMembre(im)) b = true})
    return b
  }
  aUnAccesNote (s) { // Set des im
    let b = false
    s.forEach(im => { if (this.accesNote(im)) b = true})
    return b
  }
  actifH (im) { // 0:jamais, 1:oui, 2:l'a été, ne l'est plus
    const f = this.flags[im] || 0;
    if (f & FLAGS.AC) return 1
    return f & FLAGS.HA ? 2 : 0
  }
  accesMembreH (im) { // 0:jamais, 1:oui, 2:l'a eu, ne l'a plus
    const f = this.flags[im] || 0;
    if ((f & FLAGS.AC) && (f & FLAGS.AM) && (f & FLAGS.DM)) return 1
    return f & FLAGS.HM ? 2 : 0
  }
  accesLecNoteH (im) { // 0:jamais, 1:oui, 2:l'a eu, ne l'a plus
    const f = this.flags[im] || 0;
    if ((f & FLAGS.AC) && (f & FLAGS.AN) && (f & FLAGS.DN)) return 1
    return f & FLAGS.HN ? 2 : 0
  }
  accesEcrNoteH (im) { // 0:jamais, 1:oui, 2:l'a eu, ne l'a plus
    const f = this.flags[im] || 0;
    if ((f & FLAGS.AC) && (f & FLAGS.AN) && (f & FLAGS.DE)) return 1
    return f & FLAGS.HE ? 2 : 0
  }
  accesMembreNA (im) { // accès aux membres NON activé
    const f = this.flags[im] || 0;
    return (f & FLAGS.AC) && !(f & FLAGS.AM) && (f & FLAGS.DM) ? 1 : 0
  }
  accesNote (im) {
    const f = this.flags[im] || 0;
    if ((f & FLAGS.AC) && (f & FLAGS.AN) && (f & FLAGS.DN)) return f & FLAGS.DE ? 2 : 1
    return 0
  }
  accesNoteNA (im) { // acces aux notes NON activé
    const f = this.flags[im] || 0;
    if ((f & FLAGS.AC) && !(f & FLAGS.AN) && (f & FLAGS.DN)) return f & FLAGS.DE ? 2 : 1
    return 0
  }
  estLibre (im) { return !this.anag[im] || this.anag[im] === 1 } 

  statutMajeur (im) { 
    /* 
      AMm0: 'Contact',
      AMm1: 'Contact invité',
      AMm2: 'Membre actif',
      AMm3: 'Membre animateur',
      AMm4: 'DISPARU',
    */
    if (this.estDisparu(im)) return 4
    if (this.estAnim(im)) return 3
    if (this.estActif(im)) return 2
    if (this.estInvite(im)) return 1
    return 0
  }

  // mis dans la liste noire par un animateur
  enLNA (im, nag) { const x = im ? this.anag[im] : nag; return (this.lna.indexOf(x) !== -1)}
  // mis dans la liste noire par le compte lui-même
  enLNC (im, nag) { const x = im ? this.anag[im] : nag; return (this.lnc.indexOf(x) !== -1)}

  setDisparu (im) {
    if (!this.estDisparu(im)) {
      this.anag[im] = this.flags[im] & FLAGS.HA ? 1 : 0
      this.flags[im] = 0 
    }
  }

  /* Retourne [nv, im]
  - nv: true si l'avatar n'est pas déjà membre du groupe
  - im: im actuel de l'avatar ou du slot qu'il peut occuper
  */
  async slot (na) {
    const nag = await Groupe.getNag(this.na, na)
    let im = 0
    let slot = 0
    for(let i = 1; i < this.anag.length; i++) { 
      if (!slot && this.estLibre(i)) slot = i
      if (this.anag[i] === nag) { im = i; break }
    }
    return !im ? [true, slot || this.anag.length] : [false, im]
  }

  avcAuteurs () {
    const aSt = stores.avatar
    const s = new Set()
    aSt.compte.imGroupe(this.id).forEach(im => { if (this.estAuteur(im)) s.add(im)})
    return s
  }

  async compile (row) {
    const session = stores.session
    this.vsh = row.vsh || 0
    this.dfh = row.dfh || 0
    this.msu = row.msu || null
    this.flags = row.flags || [0]
    this.anag = row.anag || [0]
    const x = row.idhg ? parseInt(await decrypterStr(this.cle, row.idhg)) : 0
    this.idh = x ? ID.long(x, session.ns) : 0
    this.hebC = this.idh === session.compteId
    this.imh = row.imh || 0
    this.mc = row.mcg ? decode(await decrypter(this.cle, row.mcg)) : {}
    this.cv = row.cvg ? decode(await decrypter(this.cle, row.cvg)) : null
    this.lna = row.lna || []
    this.lnc = row.lnc || []
  }

  get mbHeb () { // membre hébergeur
    const gSt = stores.groupe
    return  this.dfh ? null : gSt.getMembre(this.id, this.imh)
  }

  static CREATEUR = FLAGS.AC | FLAGS.AN | FLAGS.AM | FLAGS.DM | FLAGS.DN | FLAGS.DE | FLAGS.PA | FLAGS.HA  | FLAGS.HN | FLAGS.HM | FLAGS.HE
  static async rowNouveauGroupe (nagr, namb, unanime) {
    const n = await Groupe.getNag(nagr, namb)
    const idhg = await Groupe.toIdhg(nagr.rnd)
    const r = {
      id: nagr.id,
      v: 0,
      dfh: 0,
      msu: unanime ? [] : null,
      pe: 0,
      imh: 1,
      flags: [0, Groupe.CREATEUR],
      anag: [0, n],
      idhg
    }
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'groupes', id: r.id, v: r.v, _data_ }
  }

  static async getNag (nagr, namb) {
    return hash(await crypter(nagr.rnd, namb.rnd, 1))
  }

  static async getNi (nagr, namb) {
    return hash(await crypter(nagr.rnd, inverse(namb.rnd), 1))
  }

  /* npgk: numéro de participation à un groupe: 
  hash du cryptage par la clé K du compte de `idg / idav`. 
  Ce numéro est la clé du membre dans la map `mpgk` de l'avatar principal du compte.
  */
  static async getNpgk (idg, idav) {
    const session = stores.session
    return hash(await crypter(session.clek, ID.court(idg) + '/' + ID.court(idav), 1))
  }

  static async toIdhg (cle) {
    return await crypter(cle, '' + ID.court(stores.session.compteId))
  }

  async toCvg (cv) {
    return await crypter(this.cle, new Uint8Array(encode(cv)))
  }

  async toMcg (mc) {
    return Object.keys(mc).length ? await crypter(this.cle, new Uint8Array(encode(mc))) : null
  }

}

/** Membre ***********************************************************
_data_:
- `id` : id du groupe.
- `ids`: identifiant, indice `im` de membre relatif à son groupe.
- `v` : 
- `vcv` : version de la carte de visite du membre.
- `dlv` : date de dernière signature + 365 lors de la connexion du compte de l'avatar membre du groupe.
- `ddi` : date de la dernière invitation. 0 s'il n'a jamais été invité.
- `dpa` : date de la _première_ période d'activité. 0 s'il ne l'a jamais été.
- `ddp` : date de passivité (entre `dpa` et `dfa`): date la plus élevée depuis que le membre n'est pas hébergeur et n'a ni accès aux membres ni aux notes. 0 s'il est actif et est soit hébergeur ou a accès aux notes ou aux membres.
- `dfa` : date de la _fin de la dernière_ période d'activité. 0 s'il est toujours actif.
- `inv` : dernière invitation. Liste des indices des animateurs ayant validé l'invitation.
- `nag` : `[nom, cle]` : nom et clé de l'avatar crypté par la clé du groupe.
- `cva` : carte de visite du membre `{v, photo, info}` cryptée par la clé du membre.
- `ardg` : ardoise entre les animateurs et le membre, cryptée par la clé du groupe.

**Extension pour une fiche Invitation **
- ext : { flags, invs: map, chatg }
  invs : clé: im, valeur: { cva, nag }
*/
export class Membre extends GenDoc {
  // Du groupe
  get cleg () { return getCle(this.id) }
  get ng () { return getNg(this.id) } // nom complet du groupe
  // na : nom complet de l'avatar membre

  async compile (row) {
    const aSt = stores.avatar
    this.vsh = row.vsh || 0
    this.dac = row.dac || 0
    this.ddi = row.ddi || 0
    this.dac = row.dac || 0
    this.fac = row.fac || 0
    this.dln = row.dln || 0
    this.fln = row.fln || 0
    this.den = row.den || 0
    this.fen = row.fen || 0    
    this.dam = row.dam || 0
    this.fam = row.fam || 0
    this.flagsiv = row.flagsiv || 0
    this.inv = row.inv || null
    this.na = NomGenerique.from(decode(await decrypter(this.cleg, row.nag)))
    this.nag = await Groupe.getNag (this.ng, this.na) 
    this.estAc = aSt.compte.avatarIds.has(this.na.id)
    this.cv = row.cva && !this.estAc ? decode(await decrypter(this.na.rnd, row.cva)) : null

    if (row.ext) {
      const pSt = stores.people
      this.ext = { flags: row.ext.flags, invs: new Map() }
      if (row.ext.chatg)
        this.ext.chattxt = ungzipB(await decrypter(this.cleg, row.ext.chatg))
      this.ext.cvg = row.ext.cvg ? decode(await decrypter(this.ng.rnd, row.ext.cvg)) : null
      for (const imx in row.ext.invs) {
        const im = parseInt(imx)
        const x = row.ext.invs[imx]
        const na = NomGenerique.from(decode(await decrypter(this.ng.rnd, x.nag)))
        const cv = x.cva ? decode(await decrypter(na.rnd, x.cva)) : null
        this.ext.invs.set(im, na)
        if (!aSt.compte.mav.has(na.id)) pSt.setCv(na, cv) // c'est un people
      }
    }
  } 

  static async rowNouveauMembre (nag, na, im, cv, nvgr) {
    const session = stores.session
    const r = { id: nag.id, ids: im, v: 0, dlv: 0, vcv: cv ? cv.v : 0,
      ddi: 0, dac: 0, fac: 0, dln: 0, fln: 0, den: 0, fen: 0, dam: 0, fam: 0 }
    if (nvgr) {
      r.dac = session.auj
      r.dam = session.auj
      r.dln = session.auj
      r.den = session.auj
      // membre.dlv est mis par le serveur depuis compta
    } else {
      // Un nouveau contact n'a pas de dlv active vis à vis du GC
      r.dlv = AMJ.max
    }
    r.cva = !cv ? null : await crypter(na.rnd, new Uint8Array(encode(cv)))
    r.nag = await crypter(nag.rnd, new Uint8Array(encode([na.nomx, na.rnd])))
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'membres', id: r.id, ids: r.ids, v: r.v, vcv: r.vcv, dlv: r.dlv, _data_ }
  }

}

/** Chatgr ***********************************************************
_data_:
- `id` : id du groupe
- `ids` : `1`
- `v` : sa version.

- `items` : liste ordonnée des items de chat `{im, dh, lg, textg}`
  - `im` : indice membre de l'auteur,
  - `dh` : date-heure d'enregistrement de l'item,
  - `dhx` : date-heure d'effacement de l'item,
  - `l` : longueur du texte en clair de l'item. 0 correspond à un item effacé.
  - `t` : texte crypté par la clé du groupe.
*/
export class Chatgr extends GenDoc {
  // Du groupe
  get cleg () { return getCle(this.id) }
  get ng () { return getNg(this.id) } // nom complet du groupe

  async compile (row) {
    const gSt = stores.groupe
    this.items = []
    const a = []
    this.tit = ''
    this.dh = 0
    const mbs = gSt.egr(this.id)
    if (row.items) for (const item of row.items) {
      const i = { im: item.im, dh: item.dh, l: item.l, t: '', dhx: item.dhx}
      if (!item.dhx) {
        i.t = ungzipB(await decrypter(this.cleg, item.t))
        if (!this.tit && i.t) this.tit = titre(i.t)
      }
      if (this.dh === 0) this.dh = i.dhx ? i.dhx : i.dh
      const mb = mbs ? mbs.membres.get(i.im) : null
      a.push('_**' + $t('dedh', [mb ? mb.na.nomc : '#' + i.im, dhstring(i.dh)]) + '**_')
      if (i.dhx) a.push('\n' + $t('supprime', [dhstring(i.dhx)]) + '\n')
      else a.push('\n' + i.t + '\n')
      this.items.push(i)
    }
    this.txt = a.join('\n')
    if (!this.tit) this.tit = '???'
  }

  static async getItem (cleg, im, txt, dh) {
    const t = txt && txt.length ? await crypter(cleg, gzipB(txt)) : null
    return { im: im, lg: txt ? txt.length || 0 : 0, t, dh: dh || Date.now() }
  }
}

/* Note ***************************************************
_data_:
- `id` : id de l'avatar ou du groupe.
- `ids` : identifiant relatif à son avatar.
- `v` : 1..N.

- `im` : exclusivité dans un groupe. L'écriture et la gestion de la protection d'écriture sont restreintes au membre du groupe dont `im` est `ids`. 
// - `p` : _0: pas protégé, 1: protégé en écriture_.
- `v2` : volume total des fichiers attachés.
- `mc` :
  - note personnelle : vecteur des index de mots clés.
  - note de groupe : map sérialisée,
    - _clé_ : `hgc` du compte l'auteur (1 pour les mots clés du groupe),
    - _valeur_ : vecteur des index des mots clés attribués par le membre.
- `txts` : crypté par la clé de la note.
  - `d` : date-heure de dernière modification du texte.
  - `t` : texte gzippé ou non.
- `mfas` : map des fichiers attachés.
- `refs` : triplet `[id_court, ids, nomp]` crypté par la clé de la note, référence de sa  note _parent_.

**Map `mfas` des fichiers attachés dans une note:**
- _clé_ `idf`: identifiant du fichier.
- _valeur_ : { lg, datas }
  - `lg` : taille du fichier, en clair afin que le serveur puisse toujours recalculer la taille totale v2 d'un note.
  - `datas` : sérialisation cryptée par la clé S du note de : `{ nom, info, dh, type, gz, lg, sha }`.

*/
export class Note extends GenDoc {
  static sort1 (a, b) { // les fake à la fin
    const x = (a.note ? '1' : '2') + a.label
    const y = (b.note ? '1' : '2') + b.label
    return x < y ? -1 : (x === y ? 0 : 1)
  }

  static sortNodes (a,b) { 
    const x = a.type + a.label
    const y = b.type + b.label
    return x < y ? -1 : (x === y ? 0 : 1)
  }

  static estG (key) { return key.charAt(2) === '3' }
  static fake = { txt: '', dh: 0 }

  static clen (id) { return ID.estGroupe(id) ? getCle(id) : stores.session.clek }

  get cle () { return Note.clen(this.id)}
  get ng () { return getNg(this.id) }
  get key () { return this.id + '/' + this.ids }
  get rkey () { return '' + this.id }
  get refk () { return this.ref ? (this.ref[0] + (this.ref[1] ? '/' + this.ref[1] : ''))  : ''}
  get refrk () { return this.ref ? '' + this.ref[0] : ''}
  get refn () {  return this.ref && this.ref.length === 3 ? this.ref[2] : ''}
  get rid () {  return this.ref ? this.ref[0] : 0 }
  get rids () {  return this.ref ? this.ref[1] : 0 }

  get shIds () { return ('' + (this.ids % 1000)).padStart(3, '0')}

  get nomFake () { return '$' + this.rids }

  async compile (row) {
    const session = stores.session
    this.im = row.im || 0
    // this.p = row.p || 0
    this.v2 = row.v2 || 0
    this.deGroupe = ID.estGroupe(this.id)
    if (this.deGroupe) {
      this.hgc = hash(await crypter(session.clek, '' + this.id, 1))
      const mx = row.mc ? decode(row.mc) : {}
      this.mc0 = mx['0'] || new Uint8Array([])
      this.smc = new Set(this.mc0)
      this.mc = mx[this.hgc] || new Uint8Array([])
      this.mc.forEach(x => {this.smc.add(x)})
    } else {
      this.mc = row.mc || new Uint8Array([])
      this.smc = this.mc ? new Set(this.mc) : new Set()
    }
    const x = decode(await decrypter(this.cle, row.txts))
    this.txt = ungzipB(x.t)
    this.titre = titre(this.txt)
    this.dh = x.d
    this.auts = row.auts || []
    // row.ref à une id de note COURTE
    this.ref = row.ref ? decode(await decrypter(this.cle, row.ref)) : null
    if (this.ref) this.ref[0] = ID.long(this.ref[0], NomGenerique.ns)
    this.mfa = new Map()
    if (this.v2) {
      const map = row.mfas ? decode(row.mfas) : {}
      for (const idf in map) {
        const [lg, x] = map[idf]
        const f = decode(await decrypter(this.cle, x))
        f.idf = parseInt(idf)
        this.mfa.set(f.idf, f)
      }
    }
  }

  /*
  initTest (id, ids, ref, txt, dh, v1, v2) { // pour les tests
    this.id = id
    this.ids = ids
    this.ref = ref
    this.txt = txt
    this.titre = titre(this.txt)
    this.dh = dh,
    this.v1 = txt ? txt.length : 0
    this.v2 = v2
    this.mfa = { size : v2 ? (ids % 10) : 0 }
    if (ID.estGroupe(id)) {
      switch (ids % 3) {
        case 0: { this.smc = new Set([1, 101, 255]); break}
        case 1: { this.smc = new Set([1, 102]); break}
        case 0: { this.smc = new Set([255]); break}
      }
    } else {
      switch (ids % 3) {
        case 0: { this.smc = new Set([1, 255]); break}
        case 1: { this.smc = new Set([1, 2]); break}
        case 0: { this.smc = new Set([255]); break}
      }
    }
  }

  settxt (txt) { // pour les tests
    this.txt = txt
    this.titre = titre(this.txt)
    this.v1 = txt ? txt.length : 0
  }
  */

  static async toRowNouveau (id, txt, im, exclu, ref) {
    const session = stores.session
    const cle = Note.clen(id)
    const r = { id, ids: rnd6(), im: exclu ? im : 0, v2 : 0, mc: null }
    r.txts = await Note.toRowTxt(cle, txt)
    if (im) r.auts = [im]
    r.ref = await Note.toRowRef(cle, ref)
    const _data_ = encode(r)
    return { _nom: 'notes', id, ids: r.ids, _data_ }
  }

  static async toRowTxt (cle, txt) {
    const x = { d: Date.now(), t: gzipB(txt) }
    return await crypter(cle, new Uint8Array(encode(x)))
  }

  static async toRowRef (cle, arg) {
    // arg : [rid, rids, rnom || '']
    /*`ref` : [rid, rids, rnom] crypté par la clé de la note. Référence d'une autre note
    rnom n'est défini que pour une note d'avatar référençant un note de groupe (rnom est celui du groupe)*/
    if (!arg) return null
    const x = new Array(arg.length)
    x[0] = ID.court(arg[0])
    x[1] = arg[1]
    if (arg.length === 3) x[2] = arg[2]
    return await crypter(cle, new Uint8Array(encode(x)))
  }

  async nouvFic (idf, nom, info, lg, type, u8) {
    // propriétés ajoutées : u8 (contenu du fichier gzippé crypté), sha, dh gz
    const fic = { idf, nom, info, lg, type, u8 }
    fic.sha = sha256(u8)
    fic.dh = Date.now()
    fic.gz = fic.type.startsWith('text/')
    fic.u8 = await crypter(this.cle, fic.gz ? await gzipT(u8) : u8)
    return fic
  }

  volLidf (lidf) {
    let v = 0
    lidf.forEach(idf => { 
      const f = this.mfa.get(idf)
      if (f)v += f.lg
    })
    return v
  }

  async toRowMfa (fic) {
    const x = await crypter(this.cle, new Uint8Array(encode((fic))))
    return [fic.lg, x]
  }

  nomDeIdf (idf) {
    const f = this.mfa.get(idf)
    return f ? f.nom : null
  }

  async getFichier (idf) {
    // Obtenu localement ou par download. Fichier décrypté ET dézippé
    // idf: id du fichier
    const fSt = stores.fetat
    const fetat = fSt.getFetat(idf)
    const session = stores.session
    let buf = null
    if (fetat && fetat.estCharge) {
      const b = await getFichierIDB(idf)
      buf = await decrypter(this.cle, b)
    } else if (session.accesNet) {
      const b = await new DownloadFichier().run(this, idf, session.compteId)
      if (b && !isAppExc(b)) buf = await decrypter(this.cle, b)
    }
    if (!buf) return null
    const f = this.mfa.get(idf)
    const buf2 = f.gz ? await ungzipT(buf) : buf
    session.setVd(buf2.length)
    return buf2
  }

  nomFichier (idf) {
    const f = this.mfa.get(idf)
    if (!f) return '' + idf
    const fn = nomFichier(f.nom)
    const fi = nomFichier(f.info)
    const i = fi.lastIndexOf('#')
    const s = i == -1 ? fi : fi.substring(0, i)
    const x = mime2ext(f.type)
    const ext = x ? '.' + x : ''
    const n = fn + '_' + s + '#' + f.idf + ext
    return n
  }

  // fichier le plus récent portant le nom donné
  idfDeNom (nom) {
    let idfx = 0
    let dh = 0
    for (const [idf, x] of this.mfa) {
      if (x.nom !== nom) continue
      if (!idfx || dh < x.dh) { idfx = idf; dh = x.dh }
    }
    return idfx
  }  
}

/*****************************************************************/
function decodeIn (buf, cible) {
  const x = decode(buf)
  for (const p in x) cible[p] = x[p]
}

/************************************************************************
NoteLocale:
- id: id du texte (random)
- dh: date-heure d'enregistrement
- txt: string MD gzippé
*/
export class NoteLocale {
  constructor () {
    this.id = 0
    this.txt = 0
    this.dh = 0
  }

  nouveau (txt) {
    this.id = rnd6()
    this.txt = txt
    this.dh = Date.now()
    return this
  }

  async fromIdb (idb) {
    decodeIn(idb, this)
    this.txt = ungzipB(this.txt)
    return this
  }

  async toIdb () {
    const x = { ...this }
    x.txt = gzipB(this.txt)
    return new Uint8Array(encode(x))
  }

  get titre () {
    return this.txt.substring(0, 20) + ' ...'
  }
}

/* FichierLocal ************************************************
locfic : index des fichiers locaux - id: random, crypté par la clé K
- id: id du fichier
- nom: nom du fichier
- info: commentaire court facultatif
- dh: date-heure d'enregistrement
- type: type MIME
- gz: true si le fichier a été stocké gzippé
- lg: taille du fichier d'origine
- sha: sha du fichier d'origine

locdata: contenu d'un fichier local
  - id: id du fichier local
  - data: contenu gzippé ou non crypté par la clé K
*/
export class FichierLocal {
  constructor () { }

  nouveau (nom, info, type, u8) {
    this.id = rnd6()
    this.nom = nom
    this.info = info
    this.dh = Date.now()
    this.type = type
    this.gz = type.startsWith('text/')
    this.lg = u8.length
    this.sha = sha256(u8)
    return this
  }

  fromIdb (idb) {
    decodeIn(idb, this)
    return this
  }

  get toIdb () {
    return encode({ ...this })
  }

  async getU8 () {
    const session = stores.session
    if (!session.accesIdb) return this.u8
    return await FLget(this)
  }

  get titre () {
    return this.nom + ' - ' + this.info.substring(0, 20) + (this.info.length > 20 ? ' ...' : '')
  }

  get nomFichier () {
    let i = this.nom.lastIndexOf('.')
    const ext1 = i === -1 ? '' : this.nom.substring(i)
    const s1 =  i === -1 ? this.nom : this.nom.substring(0, i)
    let s2 = '', ext2 = ''
    if (this.info) {
      i = this.info.lastIndexOf('.')
      ext2 = i === -1 ? '' : this.info.substring(i)
      s2 =  '#' + (i === -1 ? this.info : this.info.substring(0, i))
    }
    const pfx = '#' + suffixe(this.id)
    const n = s1 + s2 + pfx + (ext2 || ext1)
    return n
  }

}

const classes = {
  espaces: Espace,
  tickets: Ticket,
  tribus: Tribu,
  gcvols: Gcvols,
  syntheses: Synthese,
  comptas: Compta,
  avatars: Avatar,
  groupes: Groupe,
  notes: Note,
  sponsorings: Sponsoring,
  chats: Chat,
  membres: Membre,
  chatgrs: Chatgr,
  cvs: Cv
}
