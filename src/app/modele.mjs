import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import mime2ext from 'mime2ext'
import { $t, hash, rnd6, u8ToB64, gzipB, ungzipB, gz, ungz, titre, suffixe } from './util.mjs'
import { random, pbkfd, sha256, crypter, decrypter, decrypterStr, crypterRSA, decrypterRSA } from './webcrypto.mjs'
import { post } from './net.mjs'
import { ID, isAppExc, d13, d14, Compteurs, UNITEV1, UNITEV2, AMJ, nomFichier, limitesjour, lcSynt } from './api.mjs'
import { DownloadFichier } from './operations.mjs'

import { getFichierIDB, saveSessionSync, FLget } from './db.mjs'

const decoder = new TextDecoder('utf-8')
const encoder = new TextEncoder('utf-8')

export class MD {
  static dialogStack = []
  static app = []

  static declare (nom, ref) { // Déclaration d'un modèle de App.vue PARTAGÉ
    MD.app[nom] = ref
    return ref
  }

  static val (nom) { return MD.app[nom] ? MD.app[nom].value : false }

  static oD (m) {
    const ui = stores.ui
    ui.menug = false
    if (typeof m === 'string') {
      MD.dialogStack.push(MD.app[m])
      MD.app[m].value = true
    } else {
      MD.dialogStack.push(m)
      m.value = true  
    }
  }

  static fD () {
    if (MD.dialogStack.length) {
      const m = MD.dialogStack.pop()
      if (m) m.value = false
    }
  }
  
  static fTD () {
    while (MD.dialogStack.length) MD.fD()
  }
}

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
    const z = row.dlv && row.dlv <= session.dateJourConnx
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
  get nomc () { return !this.nomx ? stores.config.nomDuComptable : (this.nomx + '#' + (this.id % 10000)) }
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

  /* Construit une Map idx:{c, n} fusionnée depuis,
  - celle de la configuration
  - celle du compte (true / false)
  - celle du groupe d'id donné (0 su aucun)
  */
  static mapMC (duCompte, duGroupe) {
    const aSt = stores.avatar
    const gSt = stores.groupe
    const m = new Map()
    let mx = stores.config.motsclesLOC
    for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
    if (duCompte) {
      mx = aSt.motscles || {}
      for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
    }
    if (duGroupe) {
      const g = gSt.getGroupe(duGroupe)
      if (g) {
        mx = g.mc || null
        if (mx) for (const i in mx) { m.set(i, Motscles.cn(mx[i]))}
      }
    }
    return m
  }

  static nom (idx, mapMC) {
    const e = mapMC[idx]
    return e && e.n ? e.n : ''
  }

  static editU8 (u8, mapMC) {
    if (!u8 || !u8.length || !mapMC) return ''
    const l = []
    for (let j = 0; j < u8.length; j++) { l.push(Motscles.nom(u8[j, mapMC]))}
    return l.join(' / ')
  }

  /* Objet Motscles
  - mc : objet UI réactif associé
  - edit: true mode édition, false mode sélection
  - duCompte: true, mots clés du compte
  - duGroupe: id mots clés du groupe id
  Si edit c'est cpt OU gr. En sélection ça peut être cpt et gr
  Les mots clés de la configuration sont chargés mais NON modifiables

  En sélection, l'objet est immutable.
  En édition il ne peut subir qu'un seul cycle d'édition: 
  - debutEdition
  - changerMC supprMc
  - finEdition : retourne la map "source" modifiée
  */
  constructor (mc, edit, duCompte, duGroupe) { // mc : objet editeur / selecteur de UI
    this.edit = edit
    this.cpt = duCompte ? true : false
    this.gr = duGroupe || 0
    this.mc = mc
    this.localIdx = {} // map de clé idx. valeur: nom/categ
    this.localNom = {} // map de clé nom. valeur: [idx, categ]
    this.premier = this.cpt ? 1 : 100
    this.dernier = this.cpt ? 99 : 199
    this.mc.categs.clear() // Map: clé: nom catégorie, valeur: [[nom, idx] ...] (mots clés ayant cette catégorie)
    this.mc.lcategs.length = 0 // Liste des catégories existantes
    const mapAll = Motscles.mapMC(this.cpt, this.gr)
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
    if (x && x[0] !== idx) return $t('MCer3', [x[0], x[1]])
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
  static idxch = [0, 1, 2, 3, 4, 5 ,6, 7, 8, 9, 10, 11, 12, 14, 16, 17, 21, 24, 27]

  async init (texte, org) {
    const o1 = org || ''
    const i = o1.lastIndexOf('@')
    const o2 = i === -1 ? o1 : o1.substring(0, i)
    this.org = org
    const x = o2.padEnd(12, '$')
    this.phrase = texte
    const u8 = encoder.encode(x + texte)
    const deb = new Uint8Array(Phrase.idxch.length)
    for (let i = 0; i < Phrase.idxch.length; i++) deb[i] = u8[Phrase.idxch[i]]
    this.pcb = await pbkfd(u8)
    this.pcbh = hash(this.pcb)
    this.hps1 = hash(deb)
    return this
  }

  get shax () { return sha256(this.pcb) }

  get shax64 () { return u8ToB64(this.shax) }

  get shay () { return sha256(this.shax) } 

  // par compatibilité avec le code écrit avant fusion phrases
  get phch () { return this.hps1 } 
  get clex () { return this.pcb }

}

/* Notification *******************************************
De facto un objet notification est immuable: 
en cas de _mise à jour_ il est remplacé par un autre.

Il est crypté selon son type par: 
0) la clé du Comptable, 1,2) la clé de la tribu.

Type des notifications:
- 0 : de l'espace
- 1 : d'une tribu
- 2 : d'un compte
- 3 : dépassement de quotas
- 4 : alerte de solde / consommation

Une notification a les propriétés suivantes:
- `nr`: restriction d'accès: 
  - 0 : pas de restriction
  - 1 : espace figé
  - 2 : espace bloqué
  - 3 : accès en lecture seule
  - 4 : accès minimal
  - 5 : actions accroissant le volume interdites.
- `dh` : date-heure de création.
- `texte`: texte de la notification.
- `idSource`: id du sponsor ayant créé cette notification pour un type 3.
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
  const z = row.dlv && row.dlv <= session.dateJourConnx
  // _zombi : objet dont la dlv est dépassée OU n'ayant pas de _data_
  if (z || !row._data_) {
    obj._zombi = true
  } else {
    const x = decode(row._data_)
    await obj.compile(x)
  }
  return obj
}

/** Espaces **************************************
_data_ :
- `id` : de l'espace de 10 à 89.
- `v`
- `org` : code de l'organisation propriétaire
- `opt`: `xy` 0 10 11 20 21
  - x : 0: l'organisation n'autorise pas les comptes A.
  - x : 1: comptes A autorisés sous contrôle du Comptable.
  - x : 2: comptes A autorisés sous contrôle du Comptable ou d'un sponsor.
  - y : 0: l'accord du compte n'est pas nécessaire pour passer de O à A
  - y : 1: l'accord du compte est requis pour passer de O à A.
- `notif` : notification de l'administrateur, cryptée par la clé du Comptable.
- `t` : numéro de _profil_ de quotas dans la table des profils définis dans la configuration 
  (chaque profil donne un triplet qc q1 q2).
*/
export class Espace extends GenDoc {

  async compile (row) {
    this.org = row.org
    this.opt = row.opt || 0
    this.t = row.t || 0
    // la clé est la clé du Comptable de l'espace
    if (row.notif) {
      const ser = await decrypter(NomGenerique.cleComptable, row.notif)
      this.notif = Notification.deSerial(ser)
    } else this.notif = null
  }

  static async nouveau (org) {
    const session = stores.session
    const r = { id: session.ns, org, v: 1, t: 1, notif: null }
    return { _nom: 'espaces', id: r.id, org: r.org, v: r.v, _data_: new Uint8Array(encode(r))}
  }
}

/** Ticket ***********************************************
Il y a un document `tickets` par ticket de paiement reçu et pas encore _crédité ou traité_.
_data_:
- `id`: numéro de ticket.
- `dh`: date-heure d'enregistrement.
- `m`: montant.
- `infoK`: texte facultatif du Comptable pour un ticket qu'il considère comme _à traiter_ plus tard, à vérifier, etc.
- `cr`: 0: pas encore crédité par le compte, 1: crédité par le compte.
*/
export class Ticket extends GenDoc {
  async compile (row) {
    const session = stores.session
    this.dh = row.dh
    this.m = row.m
    this.cr = row.cr || 0
    if (row.infoK) {
      if (session.estComptable) {
        this.info = await decrypter(session.cleK, row.infoK)
      } else this.info = true
    } else this.info = false
  }

  static async nouveauRow (id, m, info) {
    const session = stores.session
    const r = { id, m }
    if (info && session.estComptable)
      r.infoK = await crypter(session.cleK, info)
    this.dh = Date.now()
    return { _row: 'tickets', id, _data_: new Uint8Array(encode(r)) }
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
  - `cj v1 v2` : somme des volumes (approximatifs) effectivement utilisés.
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

  static async nouveau (ac, a1, a2, qc, q1, q2) { // a: au comptable, q: à la tribu primitive
    const session = stores.session
    const r = { id: session.ns, v: Date.now(), atr: [null, null] }

    const e = {}
    lcSynt.forEach(f => { e[f] = 0 })
    e.qc = qc
    e.q1 = q1
    e.q2 = q2
    e.ac = ac
    e.a1 = a1
    e.a2 = a2
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
  - `cj v1 v2` : volumes **approximatifs** effectivement utilisés.
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

    this.notif = row.notif ? new Notification(await decrypter(c, row.notif)) : null

    this.qc = row.qc || 0
    this.q1 = row.q1 || 0
    this.q2 = row.q2 || 0
    this.stn = row.stn || 0

    this.act = []
    if (row.act) for (let it = 0; it < row.act.length; it++) {
      const item = row.act[it]
      if (!item || item.vide) { this.act.push({ vide: true }); continue }
      const r = { }
      r.id = ID.long(await decrypterStr(c, item.idT), NomGenerique.ns)
      r.notif = item.notif ? new Notification(await decrypter(c, item.notif)) : null
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
    this.act.forEach(x => { if (!x.vide && x.nasp) s.add(nasp.id) })
    return s
  }

  get aCompte () {
    for (const x of this.act) if (!x.vide) return true
    return false
  }

  // id de la tribu, q1 , q2 
  static async nouvelle (idt, qct, q1t, q2t, primitive, qcc, q1c, q2c) {
    const session = stores.session
    const c = getCle(idt)
    const r = {}
    r.vsh = 0
    r.id = idt
    r.v = 1
    r.act = [null]
    r.qc = qct
    r.q1 = q1t
    r.q2 = q2t
    r.stn = 0
    r.cletX = await crypter(session.clek, c)
    if (primitive) { // inscription du comptable comme premier compte
      const nac = NomGenerique.comptable()
      const item = {
        idT: await crypter(c, '' + ID.court(nac.id)),
        qc: qcc, q1: q1c, q2: q2c,
        ac: 0, a1: 0, a2: 0, stn: 0, cj: 0, v1: 0, v2: 0,
        nasp: await crypter(c, new Uint8Array(encode(nac.anr)))
      }
      r.act.push(item)
    }
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'tribus', id: r.id, v: r.v, _data_ }
  }
}

/** Gcvols ******************************************/
export class Gcvols extends GenDoc {
  async compile (row) {
    const session = stores.session
    this.clet = await decrypter(session.clek, row.cletX)
    this.idt = Tribu.id(this.clet)
    this.it = row.it
  }
}

/** Compta **********************************************************************
- `id` : numéro du compte
- `v`
- `hps1` : le hash du PBKFD du début de la phrase secrète du compte.

- `shay`, le SHA du SHA de X (PBKFD de la phrase secrète).
- `kx` : clé K du compte, cryptée par le PBKFD de la phrase secrète courante.
- `dhvu` : date-heure de dernière vue des notifications par le titulaire du compte, cryptée par la clé K.
- `sp` : 1: est sponsor
- `cletX` : clé de la tribu cryptée par la clé K du comptable.
- `cletK` : clé de la tribu cryptée par la clé K du compte : 
  si cette clé a une longueur de 256, elle est cryptée par la clé publique RSA du compte 
  (en cas de changement de tribu forcé par le comptable).
- `it` : index du compte dans la table `act` de sa tribu.
- `mavk` : map des avatars du compte. 
  - _clé_ : id court de l'avatar cryptée par la clé K du compte.
  - _valeur_ : couple `[nom clé]` de l'avatar crypté par la clé K du compte.
- `qv` : `{qc, q1, q2, nn, nc, ng, v2}`: quotas et nombre de groupes, chats, notes, volume fichiers. Valeurs courantes.
- `oko` : hash du PBKFD de la phrase de confirmation d'un accord pour passage de O à A ou de A à O.
- `credits` : pour un compte A seulement:
  - `total`: cumul des crédits reçus depuis le début de la vie du compte.
  - `tickets`: liste des tickets en attente d'enregistrement.
  - crypté par la clé K sauf après une conversion de compte O ou c'est crypté par la clé publique de l'avatar principal du compte.
- `compteurs` sérialisation non cryptée d'évolution des quotas, volumes et coûts.
**Pour le Comptable seulement**
-`atr` : table des tribus : `{clet, info, q1, q2}` crypté par la clé K du comptable.
  - `clet` : clé de la tribu (donne aussi son id, index dans `atrx / astn`).
  - `info` : texte très court pour le seul usage du comptable.
  - `qc q1 q2` : quotas globaux de la tribu.
- `astn` : table des statuts de notification des tribus:
  _0:aucune, 1:lecture seule, 2:accès minimal_
*/
export class Compta extends GenDoc {
  get estSponsor () { return this.sp === 1 }
  get estA () { return !this.it }

  /* retourne l'array des na des avatars du compte (trié ordre alpha
    PRIMAIRE EN TETE
  */
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

  infoTr (id) { 
    if (!this.atr) return ''
    const a = this.atr[ID.court(id)]
    return a && a.info ? a.info : ''
  }

  async compile (row) {
    const session = stores.session
    const aSt = stores.avatar
    this.k = await decrypter(session.phrase.pcb, row.kx)
    session.clek = this.k

    this.vsh = row.vsh || 0

    this.mav = new Map()
    for(const i in row.mavk) {
      const [nom, cle] = decode(await decrypter(session.clek, row.mavk[i]))
      const na = NomGenerique.from([nom, cle])
      this.mav.set(na.id, na)
      if (na.id === this.id) this.naprim = na
    }
    this.avatarIds = new Set(this.mav.keys())
    
    if (row.cletK.length !== 256) {
      this.clet = await decrypter(session.clek, row.cletK)
      this.idt = setClet(this.clet)
    } else { // CHANGEMENT DE TRIBU par le comptable
      // Le Comptable a crypté la tribu par la clé PUB du compte (il ne connait pas K)
      const avatar = aSt.getAvatar(this.id)
      if (avatar) {
        this.clet = await decrypterRSA(avatar.priv, row.cletK)
        // pour mettre à jour le row compta sur le serveur
        this.cletK = await crypter(session.clek, this.clet)
        this.idt = setClet(this.clet)
      } else { 
        // CA SE FERA DANS compile2() quand l'avatar sera en store (seulement à la connexion)
        this.rowCletK = row.cletK
      }
    }

    this.it = row.it

    this.hps1 = row.hps1
    this.shay = row.shay
    this.dhvu = row.dhvu ? parseInt(await decrypterStr(session.clek, row.dhvu)) : 0
    this.sp = row.sp

    this.qv = row.qv
    if (row.credits) {
      if (row.credits.length !== 256) {
        this.credits = await decrypter(session.clek, row.credits)
      } else {const avatar = aSt.getAvatar(this.id)
        if (avatar) {
          this.credits = decode(await decrypterRSA(avatar.priv, row.credits))
        } this.creditsX = row.credits // SERA FAIT DANS compile2()
      }
    }

    this.compteurs = new Compteurs(row.compteurs, this.qv)
    this.pc = this.compteurs.pourcents.max

    /**Pour le Comptable seulement**
    -`atr` : table des tribus : `{clet, info, qc, q1, q2}` crypté par la clé K du comptable.
      - `clet` : clé de la tribu (donne aussi son id, index dans `atrx / astn`).
      - `info` : texte très court pour le seul usage du comptable.
      - `qc q1 q2` : quotas globaux de la tribu.
    - `astn` : table des statuts de notification des tribus _aucune simple bloquante_.
    */
    if (ID.estComptable(this.id)) {
      this.atr = new Array(row.atr.length)
      for (let i = 0; i < row.atr.length; i++) {
        if (row.atr[i]) {
          const item = decode(await decrypter(session.clek, row.atr[i]))
          item.id = Tribu.id(item.clet)
          this.atr[i] = item
        } else this.atr[i] = null
      }
      this.astn = row.astn
    }
  }

  async compile2 (priv) { // UNIQUEMENT à la connexion
    const session = stores.session
    this.clet = await decrypterRSA(priv, this.rowCletK)
    // pour mettre à jour le row compta sur le serveur
    this.cletK = await crypter(session.clek, this.clet)
    this.idt = setClet(this.clet)
    delete this.rowCletK
    if (this.creditsX) {
      this.credits = decode(await decrypterRSA(priv, this.creditsX))
      delete this.creditsX
    }
  }

  updAvatarMavk (setSupprIds) {
    let ok = false
    if (setSupprIds && setSupprIds.size) setSupprIds.forEach(id => { 
      if (this.mav.has(id)) {
        ok = true
        this.mav.delete(id)
      }
    })
    if (ok) this.avatarIds = new Set(this.mav.keys())
    return ok
  }

  async lmAvatarMavk (setSupprIds) {
    // set des id à supprimer
    const session = stores.session
    const lm = []
    if (setSupprIds && setSupprIds.size) for (const id of setSupprIds) {
      lm.push(await Compta.mavkK(id, session.clek))
    }
    return lm
  }

  static async atrItem (clet, info, q1, q2) {
    const session = stores.session
    const item = {clet, info, q1, q2}
    return await crypter(session.clek, new Uint8Array(encode(item)))
  }

  static async mavkKV (na, k) {
    return await crypter(k, new Uint8Array(encode([na.nomx, na.rnd])))
  }

  static async mavkK (id, k) {
    return u8ToB64(await crypter(k, '' + ID.court(id), 1), true)
  }

  static async row (na, clet, cletX, qc, q1, q2, estSponsor, phrase) { 
    /* création d'une compta
    Pour le comptable le paramètre cletX est null (il est calculé). 
    Pour les autres, c'est le nctkc pris dans la tribu
    */
    const session = stores.session
    const r = {}
    r.id = na.id
    r.v = 1
    r.vcv = 0
    r.vsh = 0

    const k = random(32)
    const ph = phrase || session.phrase
    r.kx = await crypter(ph.pcb, k)
    session.clek = k

    r.sp = estSponsor ? 1 : 0
    r.hps1 = ph.hps1
    r.shay = ph.shay
    
    r.it = clet ? 1 : 0 // Pour une création d'espace, sera surchargé sur le serveur en AcceptationSponsoring
    r.cletK = clet ? await crypter(k, clet) : null
    r.cletX = ID.estComptable(na.id) ? r.cletK : cletX

    r.mavk = { }
    r.mavk[await Compta.mavkK(na.id, k)] = await Compta.mavkKV(na, k)

    r.compteurs = new Compteurs(null, { qc, q1, q2, nn: 0, nc: 0, ng: 0, v2: 0}).serial

    if (ID.estComptable(r.id)) {
      const x = { clet, info: '', qc, q1, q2 }
      r.atr = [ null, await crypter(k, new Uint8Array(encode(x)))]
      r.astn = [0, 0]
    }

    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'comptas', id: r.id, v: r.v, hps1: r.hps1, _data_ }
  }

}

/** Avatar *********************************************************
**_data_  : données n'existant que pour un avatar principal**
- `mck` {} : map des mots-clés du compte cryptée par la clé K
- `memok` : mémo personnel du compte.

**_data_ : données disponibles pour les avatars primaires et secondaires**
- `id`, 
- `v`,
- `vcv` : version de la carte de visite afin qu'une opération puisse détecter (sans lire le document) si la carte de visite est plus récente que celle qu'il connaît.

- `pub` : clé publique RSA
- `privk`: clé privée RSA cryptée par la clé K.
- `cva` : carte de visite cryptée par la clé CV de l'avatar `{v, photo, info}`.
- `lgrk` : map :
  - _clé_ : `ni` : _numéro d'invitation_ hash de la clé inversée du groupe crypté par la  clé de l'avatar.
  - _valeur_ : `[nomg, cleg, im]`,
    - crypté par la clé publique RSA de l'avatar pour une invitation.
    - ré-encrypté par la clé K du compte par l'opération d'acceptation d'une invitation.
- `pck` : PBKFD de la phrase de contact cryptée par la clé K.
- `hpc` : hash de la phrase de contact.
- `napc` : `[nom, clé]` de l'avatar cryptée par le PBKFD de la phrase de contact.
*/
export class Avatar extends GenDoc {
  get na () { return getNg(this.id) }
  get nbGroupes () { return this.lgr.size }
  get photo () { return this.cv && this.cv.photo ? this.cv.photo : stores.config.iconAvatar }

  /* Remplit la map avec les membres des groupes de l'avatar/
  - clé: id du groupe
  - valeur: { idg: , mbs: [ids], dlv }
  */
  membres (map, dlv) {
    for (const [ ,t] of this.lgr) {
      const e = map[t.ng.id]
      if (!e) { map[t.ng.id] = { idg: t.ng.id, mbs: [t.im], dlv } } else e.mbs.push(t.im)
    }
  }

  /* Ids des groupes de l'avatar, accumulés dans le set s */
  idGroupes (s) {
    const x = s || new Set()
    for (const [ ,t] of this.lgr) x.add(t.ng.id)
    return x
  }

  /* Retourne les numéros d'invitation de l'avatar pour les groupes de setg
  et supprime leurs entrées dans lgr 
  VERIFIER s'il faut prendre les résiliés en attente
  */
  niDeGroupes (setg) {
    const ani = new Set()
    for (const [ni ,t] of this.lgr) {
      if (setg.has(t.ng.id)) ani.add(ni)
    }
    ani.forEach(ni => this.lgr.delete(ni))
    return Array.from(ani)
  }

  /** compile *********************************************************/
  async compile (row) {
    const session = stores.session
    const gSt = stores.groupe
    this.vsh = row.vsh || 0
    this.vcv = row.vcv || 0
    this.hpc = row.hpc
    this.napc = row.napc
    const kcv = getCle(this.id)

    // Avatar principal
    if (session.compteId === this.id) {
      if (row.mck) {
        this.mc = decode(await decrypter(session.clek, row.mck))
      } else this.mc = {}

      if (row.memok) {
        this.memo = await decrypterStr(session.clek, row.memok)
      } else this.memo = ''
    }

    this.priv = await decrypter(session.clek, row.privk)
    this.pub = row.pub

    if (row.pck) { // phrase de contact cryptée par la clé K.
      this.pc = await decrypterStr(session.clek, row.pck)
    } else this.pc = null

    if (row.cva) { // carte de visite cryptée par la clé de la CV de l'avatar, `{v, photo, info}`.
      this.cv = decode(await decrypter(kcv, row.cva))
    } else this.cv = null

    this.lgr = new Map()
    if (row.lgrk) { 
      /* map : 
      - _clé_ : `ni`, numéro d'invitation.
      - _valeur_ : `[nomg, clég, im]`
        - crypté par la clé publique RSA de l'avatar.
        - ré-encrypté par la clé K du compte par l'opération d'acceptation d'une invitation.
      */
      for (const nx in row.lgrk) {
        const ni = parseInt(nx)
        if (row[nx].length === 256) {
          const [nom, rnd, im] = decode(await decrypterRSA(this.priv, row[nx]))
          ng = NomGenerique.from([nom, rnd])
          gSt.setInvit(ng.id, this.id)
        } else {
          const [nom, rnd, im] = decode(await decrypter(session.clek, row[nx]))
          ng = NomGenerique.from([nom, rnd])
          gSt.delInvit(ng.id, this.id)
        }
        this.lgr.set(ni, { ng, im })
      }
    }
  }

  static async primaireRow (na, publicKey, privateKey) {
    const r = {}
    r.id = na.id
    r.v = 1
    r.vcv = 0
    r.privk = await crypter(stores.session.clek, privateKey)
    r.pub = publicKey
    r.lgrk = {}
    const _data_ = new Uint8Array(encode(r))
    const row = { _nom: 'avatars', id: r.id, v: r.v, vcv: r.vcv, _data_ }
    return row
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
  }

  static async nouveauRow (phrase, dlv, nom, cletX, clet, sp, quotas, ard) {
    /* 
      - 'phrase: objet phrase
      - 'dlv'
      - 'nom': nom de l'avatar du compte à créer
      - `clet` : cle de la tribu.
      - 'cletX' : clé de la tribu crypté par la clé K du comptable
      - `sp` : 1 si le filleul est lui-même sponsor (créé par le Comptable, le seul qui peut le faire).
      - `quotas` : `[qc, q1, q2]` quotas attribués par le parrain.
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
      it : 0
    }
    if (!session.estSponsor && !session.estComptable) {
      const c = aSt.compta
      d.it = c.it || 0
    }
    const descrx = await crypter(phrase.clex, new Uint8Array(encode(d)))
    const ardx = await crypter(phrase.clex, ard || '')
    const pspk = await crypter(session.clek, phrase.phrase)
    const bpspk = await crypter(session.clek, phrase.clex)
    const org = session.org
    const _data_ = new Uint8Array(encode({ 
      id: av.id,
      org,
      ids: phrase.phch,
      dlv,
      st: 0,
      dh: Date.now(),
      pspk,
      bpspk,
      descrx,
      ardx,
      vsh: 0
    }))
    const row = { _nom: 'sponsorings', id: av.id, ids: phrase.phch, dlv, _data_ }
    return row
  }
}

/** Chat ************************************************************
_data_:
- `id`: id de A,
- `ids`: hash du cryptage de `idA_court/idB_court` par la clé de A.
- `v`: 1..N.
- `dlv`
- `vcv` : version de la carte de visite.

- `r` : 0:raccroché, 1:en ligne, 2:en ligne mais E est mort
- `mc` : mots clés attribués par l'avatar au chat.
- `cva` : `{v, photo, info}` carte de visite de _l'autre_ au moment de la création / dernière mise à jour du chat, cryptée par la clé de _l'autre_.
- `cc` : clé `cc` du chat cryptée par la clé K du compte de I ou par la clé publique de I.
- `seq` : numéro de séquence de changement du texte.
- `contc` : contenu crypté par la clé `cc` du chat.
  - `na` : `[nom, cle]` de _l'autre_.
  - `dh`  : date-heure de dernière mise à jour.
  - `txt` : texte du chat. '' quand le compte a raccroché (ce qui ne _vide_ pas l'autre exemplaire.)

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

  async compile (row) {
    const aSt = stores.avatar
    const session = stores.session
    this.vsh = row.vsh || 0
    this.r = row.r || 0
    this.mc = row.mc
    this.seq = row.seq
    if (row.cc.length === 256) {
      const av = aSt.getAvatar(this.id)
      this.cc = await decrypterRSA(av.priv, row.cc)
      this.ccK = await crypter(session.clek, this.cc)
    } else {
      this.cc = await decrypter(session.clek, row.cc)
      this.ccK = null
    }
    const x = decode(await decrypter(this.cc, row.contc))
    this.naE = NomGenerique.from(x.na)
    this.idsE = await Chat.getIds(this.naE, this.naI)
    this.dh = x.dh
    this.txt = x.txt
    this.cv = row.cva ? decode(await decrypter(this.naE.rnd, row.cva)) : null
  }

  static async getIds (naI, naE) {{
    return hash(await crypter(naI.rnd, ID.court(naI.id) + '/' + ID.court(naE.id), 1))
  }}

  /*
  naI, naE : na des avatars I et E
  dh : date-heure d'écriture
  txt: texte du chat
  seq: numéro de séquence du "source" d'où txt a été modifié
  cc: clé du chat : si null créé random
  publicKey: clé publique de I. Si null récupérée depuis son avatar
  mc: mot clés attribués
  */
  static async nouveauRow (naI, naE, contc, cc, pubE, mc) {
    const ids = await Chat.getIds(naI, naE)
    const id = naI.id
    const r = { id, ids, st: 0, r: 1, seq: 1, contc } // v vcv cva sont mis par le serveur
    if (mc) r.mc = mc
    if (pubE) {
      r.cc = await crypterRSA(pubE, cc)
    } else {
      r.cc = await crypter(stores.session.clek, cc)
    }
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'chats', id, ids, _data_}
  }

  static async getContc (na, dh, txt, cc) {
    const x = { na: [na.nom, na.rnd], dh: dh, txt: txt }
    return await crypter(cc, new Uint8Array(encode(x)))
  }
}

/** Groupe ***********************************************************************
__data_:
- `id` : id du groupe.
- `v` : version, du groupe, ses notes, ses membres. 
- `iv`
- `dfh` : date de fin d'hébergement.

- `idhg` : id du compte hébergeur crypté par la clé du groupe.
- `imh` : indice `im` du membre dont le compte est hébergeur.
- `msu` : mode _simple_ ou _unanime_.
  - `null` : mode simple.
  - `[ids]` : mode unanime : liste des indices des animateurs ayant voté pour le retour au mode simple. La liste peut être vide mais existe.
- `pe` : 0-en écriture, 1-protégé contre la mise à jour, création, suppression de notes.
- `ast` : table des statuts des membres. Deux chiffres `sta laa` (0: disparu / oublié):
  - `sta`: statut d'activité: 1: contact, 2:invité, 3:actif, 4:résilié
  - `laa`: 1:lecteur, 2:auteur, 3:animateur
- `nag` : table des 'hcmg' (hash de la clé de l'avatar membre cryptée par la clé du groupe). Les index dans `nag` et `ast` correspondent.
- `ln` : liste noire des 'hcmg' des avatars interdits de redevenir contact. 
- `mcg` : liste des mots clés définis pour le groupe cryptée par la clé du groupe cryptée par la clé du groupe.
- `cvg` : carte de visite du groupe cryptée par la clé du groupe `{v, photo, info}`.
- `ardg` : ardoise cryptée par la clé du groupe.
*/

export class Groupe extends GenDoc {
  get cle () { return getCle(this.id) }
  get na () { return getNg(this.id) }
  get nom () { return this.na.nom }
  get nomc () { return this.na.nomc }
  get photo () { return this.cv && this.cv.photo ? this.cv.photo : stores.config.iconGroupe }
  get nbInvits () { let n = 0
    this.ast.forEach(x => { if (x >= 60 && x <= 73) n++ })
    return n
  }

  sta (im) { const n = this.ast[im]; return !n ? 0 : Math.floor(n / 10) }
  laa (im) { const n = this.ast[im]; return !n ? 0 : n % 10 }
  estContact (im) { return this.sta(im) === 1 }
  estInvite (im) { return this.sta(im) === 2 }
  estActif (im) { return this.sta(im) === 3 }
  estResilie (im) { return this.sta(im) === 4 }
  estAuteur (im) { return this.las(im) > 1 }
  estAnim (im) { return this.las(im) === 3 }

  async compile (row) {
    const session = stores.session
    this.vsh = row.vsh || 0
    this.dfh = row.dfh || 0
    this.msu = row.msu || null
    this.pe = row.pe || 0
    this.ast = row.ast || new Uint8Array([0])
    const x = row.idhg ? parseInt(await decrypterStr(this.cle, row.idhg)) : 0
    this.idh = x ? ID.long(x, session.ns) : 0
    this.hebC = this.idh === session.compteId
    this.imh = row.imh || 0
    this.mc = row.mcg ? decode(await decrypter(this.cle, row.mcg)) : {}
    this.cv = row.cvg ? decode(await decrypter(this.cle, row.cvg)) : null
    this.nag = row.nag || [0]
    this.ln = row.ln || []
    this.ard = !row.ardg ? '' : await decrypterStr(this.cle, row.ardg)
  }

  get mbHeb () { // membre hébergeur
    return  this.dfh ? null : stores.membre.getMembre(this.id, this.imh)
  }

  async setDisparus(setIds) { // check / maj des statuts des membres disparus
    const session = stores.session
    for(const ids of setIds) {
      if (this.ast[ids]) {
        this.ast[ids] = 0
        const args = { token: session.authToken, id: this.id, ids }
        this.tr(await post(this, 'DisparitionMembre', args))
      }
    }
  }

  static async rowNouveauGroupe (nagr, namb, unanime) {
    const n = hash(await crypter(nagr.rnd, namb.rnd, 1))
    const idhg = await Groupe.toIdhg(nagr.rnd)
    const r = {
      id: nagr.id,
      v: 0,
      dfh: 0,
      msu: unanime ? new Uint8Array([]) : null,
      pe: 0,
      imh: 1,
      ast: new Uint8Array([0, 32]),
      nag: [0, n],
      ln: [],
      idhg
    }
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'groupes', id: r.id, v: r.v, _data_ }
  }

  static async toIdhg (cle) {
    return await crypter(cle, '' + ID.court(stores.session.compteId))
  }

  async toCvg (cv) {
    return await crypter(this.cle, new Uint8Array(encode([cv.ph, cv.info])))
  }

  async toMcg (mc) {
    return Object.keys(mc).length ? await crypter(this.cle, new Uint8Array(encode(mc))) : null
  }

}

/** Membre ***********************************************************
- `id` : id du groupe.
- `ids`: identifiant, indice de membre relatif à son groupe.
- `v`
- `vcv` : version de la carte de visite du membre
- `dlv` : date de dernière signature + 365 lors de la connexion du compte de l'avatar membre du groupe.

- `ddi` : date de la _dernière_ invitation
- `dda` : date de début d'activité (jour de la _première_ acceptation)
- `dfa` : date de fin d'activité (jour de la _dernière_ suspension)
- `inv` : validation de la dernière invitation:
  - `null` : le membre n'a pas été invité où le mode d'invitation du groupe était _simple_ au moment de l'invitation.
  - `[ids]` : liste des indices des animateurs ayant validé l'invitation.
- `mc` : mots clés du membre à propos du groupe.
- `infok` : commentaire du membre à propos du groupe crypté par la clé K du membre.
- `nag` : `[nom, rnd]` : nom complet de l'avatar crypté par la clé du groupe :
- `cva` : carte de visite du membre `{v, photo, info}` cryptée par la clé du membre.
*/
export class Membre extends GenDoc {
  // Du groupe
  get cleg () { return getCle(this.id) }
  get ng () { return getNg(this.id) } // nom complet du groupe
  // na : nom complet de l'avatar membre

  async compile (row) {
    const aSt = stores.avatar
    this.vsh = row.vsh || 0
    this.ddi = row.ddi || 0
    this.dda = row.dda || 0
    this.dfa = row.dfa || 0
    this.inv = row.inv || null
    this.mc = row.mc || new Uint8Array([])
    const x = decode(await decrypter(this.cleg, row.nag)) // x: [nom, rnd]
    this.na = NomGenerique.from(x)
    this.estAc = aSt.compta.avatarIds.has(this.na.id)
    this.info = row.infok && this.estAc ? await decrypterStr(stores.session.clek, row.infok) : ''
    this.cv = row.cva && !this.estAc ? decode(await decrypter(this.na.rnd, row.cva)) : null
  }

  static async rowNouveauMembre (nag, na, im, dlv, cv) {
    const r = { id: nag.id, ids: im, v: 0, dlv, vcv: cv ? cv.v : 0,
      ddi: 0, dda: 0, dfa: 0, mc: new Uint8Array([]) }
    if (dlv) r.dda = Date.now()
    r.cva = !cv ? null : await crypter(na.rnd, new Uint8Array(encode(cv)))
    r.nag = await crypter(nag.rnd, new Uint8Array(encode([na.nomx, na.rnd])))
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'membres', id: r.id, ids: r.ids, v: r.v, vcv: r.vcv, dlv: r.dlv, _data_ }
  }

}

/* Note ***************************************************
_data_:
- `id` : id de l'avatar ou du groupe.
- `ids` : identifiant relatif à son avatar.
- `v` : 1..N.

- `st` :
  - `99999999` pour un _permanent_.
  - `aaaammjj` date limite de validité pour un _temporaire_.
- `im` : exclusivité dans un groupe. L'écriture et la gestion de la protection d'écriture sont restreintes au membre du groupe dont `im` est `ids`. 
- `p` : _0: pas protégé, 1: protégé en écriture_.
- `v2` : volume total des fichiers attachés.
- `mc` :
  - note personnelle : vecteur des index de mots clés.
  - note de groupe : map sérialisée,
    - _clé_ : `im` de l'auteur (0 pour les mots clés du groupe),
    - _valeur_ : vecteur des index des mots clés attribués par le membre.
- `txts` : crypté par la clé de la note.
  - `d` : date-heure de dernière modification du texte.
  - `l` : liste des auteurs pour une note de groupe.
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
  get nbj () { return this.st <= 0 || this.st === 99999999 ? 0 : AMJ.diff(this.st, AMJ.amjUtc()) }
  get key () { return this.id + '/' + this.ids }
  get rkey () { return '' + this.id }
  get refk () { return this.ref ? (this.ref[0] + (this.ref[1] ? '/' + this.ref[1] : ''))  : ''}
  get refrk () { return this.ref ? '' + this.ref[0] : ''}
  get refn () {  return this.ref && this.ref.length === 3 ? this.ref[2] : ''}
  get rid () {  return this.ref ? this.ref[0] : 0 }
  get rids () {  return this.ref ? this.ref[1] : 0 }

  get nomFake () { return '$' + this.rids }

  async compile (row) {
    this.st = row.st || 99999999
    this.im = row.im || 0
    this.p = row.p || 0
    this.v2 = row.v2 || 0
    this.deGroupe = ID.estGroupe(this.id)
    this.mc = this.deGroupe ? (row.mc ? decode(row.mc) : {}) : (row.mc || null)
    const x = decode(await decrypter(this.cle, row.txts))
    this.txt = await ungzipB(x.t)
    this.titre = titre(this.txt)
    this.dh = x.d
    this.auts = x.l ? x.l : []
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
    this.setSmc()
  }

  /* setSmc : calcul smc, le set des mots clés de la note pour le compte
  Ce calcul est fait à la compilation de la note.
  Toutefois, quand un compte a plus d'un avatar membre d'un groupe G,
  quand l'un de ses avatars est résilié, il faut recalculer ce set,
  sinon il apparaîtra des mots clés fantômes pour le compte
  (ce qui n'est pas très grave) jusqu'à la prochaine session ou mise à jour
  de la note
  */
  setSmc () {
    if (!this.mc) { this.smc = null; return }
    if (ID.estGroupe(this.id)) {
      const gSt = stores.groupe
      const g = this.mc['0']
      const s = g ? new Set(g) : new Set()
      const e = gSt.egr(this.id)
      e.mbacs.forEach(m => {
        const x = this.mc[''+m.ids]
        if (x) x.forEach(mc => { s.add(mc)})
      })
      this.smc = s.size ? s : null
    } else {
      this.smc = new Set(this.mc)
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
  */

  settxt (txt) { // pour les tests
    this.txt = txt
    this.titre = titre(this.txt)
    this.v1 = txt ? txt.length : 0
  }

  static async toRowNouveau (id, txt, im, nbj, p, exclu, ref) {
    const session = stores.session
    const cle = Note.clen(id)
    const r = { id, ids: rnd6(), p: p ? 1 : 0, im: exclu ? im : 0, v2 : 0, mc: null }
    r.txts = await Note.toRowTxt(cle, txt, im)
    r.ref = await Note.toRowRef(cle, ref)
    r.st = nbj === 99999999 ? 0 : AMJ.amjUtcPlusNbj(session.dateJourConnx, nbj)
    const _data_ = encode(r)
    return { _nom: 'notes', id, ids: r.ids, _data_ }
  }

  static async toRowTxt (cle, txt, im, auts) {
    const x = { d: Date.now(), t: await gzipB(txt) }
    if (im) {
      const nl = [im]
      if (auts) auts.forEach(t => { if (t !== im) nl.push(t) })
      x.l = nl
    }
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
    fic.u8 = await crypter(this.cle, fic.gz ? await gz(u8) : u8)
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
    const buf2 = f.gz ? await ungz(buf) : buf
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

/**SessionSync : Dernier état de session synchronisé***************************
Uniquement sur IDB - pas de fromRow - compilé par fromIdb
- dhdebutp : dh de début de la dernière session sync terminée
- dhfinp : dh de fin de la dernière session sync terminée
- dhdebut: dh de début de la session sync en cours
- dhsync: dh du dernier traitement de synchronisation
- dhpong: dh du dernier pong reçu
*/

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
    const row = decode(idb)
    this.dhdebut = row.dhdebut
    this.dhsync = row.dhsync
    this.dhpong = row.dhpong
    this.dhdebutp = this.dhdebut
    this.dhfinp = max([this.dhdebut, this.dhsync, this.dhpong])
    return this
  }

  async setConnexion (dh) { // appel quand la session est ouverte (fin de l'opération de connexion)
    this.dhdebut = dh
    this.dhpong = dh
    await this.save()
  }

  async setDhSync (dh) { // appel à la fin de chaque synchro
    if (stores.session.status < 2) return
    this.dhsync = dh
    this.dhpong = dh
    await this.save()
  }

  async setDhPong (dh) { // appel par WebSocket sur réception de pong
    this.dhpong = dh
    await this.save()
  }

  async save () {
    if (stores.session.synchro) {
      const x = { 
        dhdebutp: this.dhdebutp,
        dhfinp: this.dhfinp,
        dhdebut: this.dhdebut,
        dhsync: this.dhsync,
        dhpong: this.dhpong
      }
      await saveSessionSync(new Uint8Array(encode(x)))
    }
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
    this.txt = await ungzipB(this.txt)
    return this
  }

  async toIdb () {
    const x = { ...this }
    x.txt = await gzipB(this.txt)
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
    const ext1 = i === -1 ? '' : f.nom.substring(i)
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
  cvs: Cv
}
