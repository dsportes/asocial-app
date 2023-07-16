import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import mime2ext from 'mime2ext'
import { $t, hash, rnd6, u8ToB64, gzip, ungzip, ungzipT, titre, suffixe } from './util.mjs'
import { random, pbkfd, sha256, crypter, decrypter, decrypterStr, crypterRSA, decrypterRSA } from './webcrypto.mjs'
import { post } from './net.mjs'
import { ID, d13, Compteurs, UNITEV1, UNITEV2, AMJ, nomFichier, limitesjour } from './api.mjs'
import { DownloadFichier } from './operations.mjs'

import { getFichierIDB, saveSessionSync, FLget } from './db.mjs'

const decoder = new TextDecoder('utf-8')
const encoder = new TextEncoder('utf-8')

function decodeIn (buf, cible) {
  const x = decode(buf)
  for (const p in x) cible[p] = x[p]
}

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
const repertoire = { rep: {} }

export function resetRepertoire () { repertoire.rep = {} }
export function getCle (id) { const e = repertoire.rep[id]; return e ? e.rnd : null }
export function getNg (id) { return repertoire.rep[id] }

/***********************************************************
NomGenerique : NomAvatar, NomGroupe, NomTribu
************************************************************/
export class NomGenerique {
  static idOf (rnd) {
    let z = true; for (let i = 2; i < 32; i++) if(rnd[i]) { z = false; break }
    const n = z ? 0 : (hash(rnd) % d13)
    return (((rnd[0] * 10) + rnd[1]) * d13) + n
  }

  constructor (id, nom, rnd) {
    this.id = id
    this.nomx = id % d13 === 0 || !nom ? '' : nom
    this.rnd = rnd
    repertoire.rep[id] = this
  }

  get ns () { return this.rnd[0] }
  get type () { return this.rnd[1] }
  get estComptable () { return this.id % d13 === 0 }
  get estGroupe () { return this.rnd[1] === 2 }
  get estTribu () { return this.rnd[1] === 3 }
  get estAvatar () { return this.rnd[1] < 2 }
  get estCompte () { return this.rnd[1] === 0 }
  get estAvatarS () { return this.rnd[1] === 1 }
  get nom () { return this.nomx || stores.config.nomDuComptable }
  get nomc () { return !this.nomx ? stores.config.nomDuComptable : (this.nomx + '#' + (this.id % 10000)) }
  get hrnd () { return hash(u8ToB64(this.rnd)) }
  get anr () { return [this.nomx, this.rnd] } 

  get defIcon () {
    const cfg = stores.config
    if (this.estComptable) return cfg.iconSuperman
    if (this.estGroupe) return cfg.iconGroupe
    return cfg.iconAvatar
  }

  egal (ng) { return this.nom === ng.nom && this.id === ng.id }

  // Factories

  static from([nom, rnd]) {
    const id = NomGenerique.idOf(rnd)
    const e = repertoire.rep[id]
    if (e) return e
    if (rnd[1] <= 1) return new NomAvatar(id, nom, rnd)
    if (rnd[1] === 2) return new NomGroupe(id, nom, rnd)
    return new NomTribu(id, nom, rnd)
  }

  static comptable(ns) {
    const rnd = new Uint8Array(32)
    rnd[0] = ns
    rnd[1] = 0
    const id = NomGenerique.idOf(rnd)
    return new NomAvatar(id, stores.config.nomDuComptable, rnd)
  }

  static compte(ns, nom) {
    const rnd = random(32)
    rnd[0] = ns
    rnd[1] = 0
    const id = NomGenerique.idOf(rnd)
    const e = repertoire.rep[id]
    if (e) return e
    return new NomAvatar(id, nom, rnd)
  }

  static avatar(ns, nom) {
    const rnd = random(32)
    rnd[0] = ns
    rnd[1] = 1
    const id = NomGenerique.idOf(rnd)
    const e = repertoire.rep[id]
    if (e) return e
    return new NomAvatar(id, nom, rnd)
  }

  static groupe(ns, nom) {
    const rnd = random(32)
    rnd[0] = ns
    rnd[1] = 2
    const id = NomGenerique.idOf(rnd)
    const e = repertoire.rep[id]
    if (e) return e
    return new NomGroupe(id, nom, rnd)
  }

  static tribu(ns, nom) {
    const rnd = random(32)
    rnd[0] = ns
    rnd[1] = 3
    const id = NomGenerique.idOf(rnd)
    const e = repertoire.rep[id]
    if (e) return e
    return new NomTribu(id, nom, rnd)
  }
}

// NE PAS UTILISER ces constructeurs MAIS les factories de NomGenerique
export class NomAvatar extends NomGenerique { constructor (n, nom, rnd) { super(n, nom, rnd) } }
export class NomGroupe extends NomGenerique { constructor (n, nom, rnd) { super(n, nom, rnd) } }
export class NomTribu extends NomGenerique { constructor (n, nom, rnd) { super(n, nom, rnd) } }

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
const enc = new TextEncoder()
const idxch = [0, 2, 4, 5, 9, 12]

export class Phrase {
  async init (texte) {
    this.phrase = texte
    const u8 = enc.encode(texte)
    const deb = new Uint8Array(idxch.length)
    for (let i = 0; i < idxch.length; i++) deb[i] = u8[idxch[i]]
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

const lstfnotif = ['idSource', 'jbl', 'nj', 'texte', 'dh']
export class Notification {

  /* Attributs: 
  - `idSource`: id du Comptable ou du sponsor, par convention 0 pour l'administrateur.
  - `jbl` : jour de déclenchement de la procédure de blocage sous la forme `aaaammjj`, 0 s'il n'y a pas de procédure de blocage en cours.
  - `nj` : en cas de procédure ouverte, nombre de jours après son ouverture avant de basculer en niveau 4.
  - `texte` : texte informatif, pourquoi, que faire ...
  - `dh` : date-heure de dernière modification (informative).
  */
  constructor (buf, idSource) {
    if (buf) {
      const r = decode(buf)
      for (const f of lstfnotif) this[f] = r[f]
    } else {
      this.idSource = idSource
      this.jbl = 0
      this.nj = 0
      this.texte = ''
      this.dh = 0
    }
    if (this.nj > 365) this.nj = 365
    if (this.nj < 0) this.nj = 0
    this.calcul()
  }

  clone () { return new Notification(this.encode()) }

  encode () {
    const buf = {}
    for (const f of lstfnotif) buf[f] = this[f]
    return new Uint8Array(encode(buf))
  }

  /*  Calculés en fonction du jour courant:
  - niv : niveau d'alerte
    0: pas de blocage,
    1: alerte simple
    2: alerte grave (une procédure de blocage est planifiée)
    3: lecture seule, 
    4: ni lecture ni écriture,
    5: résilié
  - d3 : date d'atteinte du niveau 3
  - n3 : nombre de jours avant d'atteindre le niveau 3
  - d4 : date d'atteinte du niveau 2
  - n4 : nombre de jours avant d'atteindre le niveau 4
  - d5 : date d'atteinte du niveau 3
  - n5 : nombre de jours avant d'atteindre le niveau 5
  - np : nombre de jours avant que la procédure de blocage ne s'engage (niv 2 seulement)
  */
  calcul () {
    try {
      this.n3 = 0; this.n4 = 0; this.n5 = 0; this.d4 = 0; this.d5 = 0
      if (!this.jbl) { this.niv = 1; return }

      const auj = AMJ.amjUtc()
      this.n3 = AMJ.diff(this.jbl, auj)
      this.d4 = AMJ.amjUtcPlusNbj(this.jbl, this.nj)
      this.n4 = AMJ.diff(this.d4, auj)
      if (this.n4 === this.n3) this.n3 = 0
      this.d5 = AMJ.amjUtcPlusNbj(this.jbl, limitesjour.dlv)
      this.n5 = AMJ.diff(this.d5, auj)
      if (this.n5 === this.n4) this.n4 = 0

      if (this.n5 <= 0) { this.niv = 5; return } // date de résiliation atteinte ou dépassée
      if (this.n4 <= 0) { this.niv = 4; return } // date de blocage ecritures atteinte ou dépassée
      if (this.n3 <= 0) { this.niv = 3; return } // date de blocage lectures atteinte ou dépassée
      this.niv = 2
    } catch (e) {
      console.log(e)
    }
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
- `id` : de l'espace de 10 à 89.
- `v`
- `org`
_data_:
- `org` : code de l'organisation
- `notif` : notification de l'administrateur, cryptée par la clé du Comptable.
- `stats`: statistiques sérialisées de l'espace par le comptable 
  {'ntr', 'a1', 'a2', 'q1', 'q2', 'nbc', 'nbsp', 'ncoS', 'ncoB' }
- `t` : taille de l'espace, de 1 à 9, fixé par l'administrateur
  son poids relatif dans l'ensemble des espaces.
*/
export class Espace extends GenDoc {

  async compile (row) {
    this.org = row.org
    const aSt = stores.avatar
    // la clé est le rnd du Comptable de l'espace
    const cle = new Uint8Array(32); cle[0] = this.id
    if (row.notif) {
      this.notif = new Notification(await decrypter(cle, row.notif))
      this.notif.v = this.v
    } else this.notif = null
    this.t = row.t || 0
    this.stats = { dh: 0}
    const r = row.stats ? decode(row.stats) : { }
    this.stats.dh = r.dh || 0
    aSt.lc.forEach(f => { this.stats[f] = r[f] || 0 })
  }

  static async nouveau (id, org) {
    const r = { id, org, v: 1, t: 1, notif: null, stats: new Uint8Array(encode({ dh: 0 })) }
    return { _nom: 'espaces', id, org, v: 1, _data_: new Uint8Array(encode(r))}
  }
}

/** Tribu *********************************
- `id` : numéro de la tribu
- `v` : sa version

- `nctkc` : `[nom, rnd]` de la tribu crypté par la clé K du comptable.
- `infok` : commentaire privé du comptable crypté par la clé K du comptable.
- `notif` : notification comptable / sponsor à la tribu (cryptée par la clé de la tribu).
- `cpt` : sérialisation non cryptée des compteurs suivants:
  - `a1 a2` : sommes des quotas attribués aux comptes de la tribu.
  - `q1 q2` : quotas actuels de la tribu
  - `nbc` : nombre de comptes.
  - `nbsp` : nombre de sponsors.
  - `ncoS` : nombres de comptes ayant une notification simple.
  - `ncoB` : nombres de comptes ayant une notification bloquante.
*/

export class Tribu extends GenDoc {
  get na () { return getNg(this.id) }
  get clet () { return getCle(this.id) }

  async compile (row) {
    const session = stores.session
    this.vsh = row.vsh || 0
    this.id = row.id
    this.v = row.v

    if (session.estComptable) {
      // Le comptable peut décoder n'importe quelle tribu
      const [nom, rnd] = decode(await decrypter(session.clek, row.nctkc))
      this.naC = NomGenerique.from([nom, rnd])
      this.info = row.infok ? await decrypterStr(session.clek, row.infok) : ''
    }
    this.nctkc = row.nctkc
    this.notif = row.notif ? new Notification(await decrypter(this.clet, row.notif)) : null
    this.cpt = decode(row.cpt)
  }

  static async primitiveRow (nt, a1, a2, q1, q2) {
    const session = stores.session
    const r = {}
    r.vsh = 0
    r.id = nt.id
    r.v = 1
    r.iv = GenDoc._iv(r.id, r.v)
    const cpt = { a1, a2, q1, q2, nbc: 1, nbsp: 1, cbl: 0, nco: [0, 0], nsp: [0, 0]}
    r.cpt = new Uint8Array(encode(cpt))
    r.nctkc = await crypter(session.clek, new Uint8Array(encode([nt.nomx, nt.rnd])))
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'tribus', id: r.id, v: r.v, iv: r.iv, _data_ }
  }

  static async nouvelleRow (nt, q1, q2) {
    const r = {}
    r.vsh = 0
    r.id = nt.id
    r.v = 1
    r.iv = GenDoc._iv(r.id, r.v)
    const cpt = { a1: 0, a2: 0, q1, q2, nbc: 0, nbsp: 0, cbl: 0, nco: [0, 0], nsp: [0, 0]}
    r.cpt = new Uint8Array(encode(cpt))
    r.nctkc = await crypter(stores.session.clek, new Uint8Array(encode([nt.nom, nt.rnd])))
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'tribus', id: r.id, v: r.v, iv: r.iv, _data_ }
  }
}

/** Tribu2 *********************************
- `id` : numéro de la tribu
- `v` : sa version

- `mbtr` : map des comptes de la tribu:
  - _clé_ : id pseudo aléatoire, hash de la clé `rnd` du compte.
    Dans l'objet c'est l'id du compte
  - _valeur_ :
    - `na` : `[nom, rnd]` du membre crypté par la clé de la tribu.
    - `sp` : si `true` / présent, c'est un sponsor.
    - `q1 q2` : quotas du compte (redondance dans l'attribut `compteurs` de `compta`)
    - 'ntfb' : true si la notification est bloquante
    - `notif` : notification du compte (cryptée par la clé de la tribu).
    - `cv` : `{v, photo, info}`, carte de visite du compte cryptée par _sa_ clé (le `rnd` ci-dessus).
*/
export class Tribu2 extends GenDoc {
  get na () { return getNg(this.id) }
  get clet () { return getCle(this.id) }

  async compile (row) {
    const session = stores.session
    this.vsh = row.vsh || 0

    this.mbtr = {}
    for (const x in (row.mbtr || {})) {
      const e = decode(row.mbtr[x])
      const r = {}
      const [nom, cle] = decode(await decrypter(this.clet, e.na))
      r.na = NomGenerique.from([nom, cle])
      r.sp = e.sp ? true : false
      r.q1 = e.q1
      r.q2 = e.q2
      r.cv = e.cv ? decode(await decrypter(e.na.rnd, e.cv)) : null
      r.notif = e.notif ? new Notification(await decrypter(this.clet, e.notif)) : null
      this.mbtr[r.na.id] = r
    }
  }

  get aCompte () {
    const session = stores.session
    return this.mbtr[session.compteId] ? true : false
  }

  get naSponsors () { // array des na des sponsors
    const r = []
    for (const x in this.mbtr) {
      const e = this.mbtr[x]
      if (e.sp) r.push(e.na)
    }
    return r
  }

  get idSponsors () { // array des na des sponsors
    const r = new Set()
    for (const x in this.mbtr) {
      const e = this.mbtr[x]
      if (e.sp) r.add(e.na.id)
    }
    return r
  }

  get naComptes () { // array des na des membres
    const r = []
    for (const x in this.mbtr) r.push(this.mbtr[id].na)
    return r
  }

  // retourne la CV du compte d'id donné
  cvCompte (id) {
    for (const x in this.mbtr) {
      const e = this.mbtr[x]
      if (e.na.id === id) {
        return e.cv ? e.cv : null
      }
    }
    return null
  }

  static async primitiveRow (nt, q1, q2, naC) { // q1 q2 : quotas attribués au Comptable
    const naComptable = naC || stores.session.naComptable
    const r = {}
    r.vsh = 0
    r.id = nt.id
    r.v = 1
    r.iv = GenDoc._iv(r.id, r.v)
    r.mbtr = { }
    const e = { 
      na : await crypter(nt.rnd, new Uint8Array(encode([naComptable.nom, naComptable.rnd]))),
      sp: true,
      q1: q1,
      q2: q2,
    }
    r.mbtr[naComptable.hrnd] = new Uint8Array(encode(e))
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'tribu2s', id: r.id, v: r.v, iv: r.iv, _data_ }
  }

  static async nouvelleRow (nt) {
    const r = {}
    r.vsh = 0
    r.id = nt.id
    r.v = 1
    r.iv = GenDoc._iv(r.id, r.v)
    r.mbtr = { }
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'tribu2s', id: r.id, v: r.v, iv: r.iv, _data_ }
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
  - _clé_ : Hash de l'id de l'avatar cryptée par la clé du groupe.
  - _valeur_ : cryptée par la clé K du compte de `[nomg, clég, im]` reçu sur une invitation. Pour une invitation en attente de refus / acceptation _valeur_ est cryptée par la clé publique RSA de l'avatar
  - une entrée est effacée par la résiliation du membre au groupe ou son effacement d'invitation explicite par un animateur ou l'avatar lui-même (ce qui l'empêche de continuer à utiliser la clé du groupe).
- `pck` : PBKFD de la phrase de contact cryptée par la clé K.
- `hpc` : hash de la phrase de contact.
- `napc` : `[nom, clé]` de l'avatar cryptée par le PBKFD de la phrase de contact.
*/
export class Avatar extends GenDoc {
  get primaire () { return ID.estCompte(this.id) } // retourne true si l'objet avatar est primaire du compte
  get naprim () { return this.lav[0].na } // na de l'avatar primaire du compte
  get apropos () { return this.nct ? ($t('tribus', 0) + ':' + this.nct.nom) : $t('comptable') }
  get na () { return getNg(this.id) }
  get nbGroupes () { return this.lgr.size }
  get nbInvits () { return this.invits.size }
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
  */
  niDeGroupes (setg) {
    const ani = new Set()
    for (const [ni ,t] of this.lgr) if (setg.has(t.ng.id)) ani.add(ni)
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

    if (this.primaire) { // Avatar principal
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
      /* map : - _clé_ : `ni`, numéro d'invitation obtenue sur une invitation.
        - _valeur_ : cryptée par la clé K du compte de `[nom, rnd, im]` reçu sur une invitation. */
      for (const nx in row.lgrk) {
        const ni = parseInt(nx)
        const lgrc = row.lgrk[ni]
        if (lgrc.length === 256) {
          // c'est une invitation
          const [nom, rnd, im] = decode(await decrypterRSA(this.priv, lgrc))
          const ng = NomGenerique.from([nom, rnd])
          this.lgr.set(ni, { ng, im})  
          gSt.setInvit(ng.id, this.id)
        } else {
          const [nom, rnd, im] = decode(await decrypter(session.clek, lgrc))
          const ng = NomGenerique.from([nom, rnd])
          this.lgr.set(ni, { ng, im})  
          gSt.delInvit(ng.id, this.id)
        }
      }
    }

    return this
  }

  static async primaireRow (na, publicKey, privateKey) {
    const r = {}
    r.id = na.id
    r.v = 1
    r.iv = GenDoc._iv(r.id, r.v)
    r.vcv = 0
    r.ivc = GenDoc._iv(r.id, r.vcv)
    r.privk = await crypter(stores.session.clek, privateKey)
    r.pub = publicKey
    r.lgrk = {}
    const _data_ = new Uint8Array(encode(r))
    const row = { _nom: 'avatars', id: r.id, v: r.v, iv: r.iv, vcv: r.vcv, ivc: r.ivc, _data_ }
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

/** Compta **********************************************************************
- `id` : numéro du compte
- `v` : version
- `hps1` : hash du PBKFD de la ligne 1 de la phrase secrète du compte : sert d'accès au document `compta` à la connexion au compte.
- `shay` : SHA du SHA de X (PBKFD de la phrase secrète). Permet de vérifier la détention de la phrase secrète complète.
- `kx` : clé K du compte, cryptée par le PBKFD de la phrase secrète courante.
- `dhvu` : date-heure de dernière vue des notifications par le titulaire du compte, cryptée par la clé K.
- `mavk` : map des avatars du compte. 
  - _clé_ : id de l'avatar cryptée par la clé K du compte.
  - _valeur_ : `[nom clé]` : son nom complet cryptée par la clé K du compte.
- `nctk` : `[nom, clé]` de la tribu crypté par la clé K du compte, ou temporairement par la clé _CV_ du compte quand c'est le comptable qui l'a définie sur un changement de tribu.
- `nctkc` : `[nom, clé]` de la tribu crypté par la clé K **du Comptable**: 
- `napt`: `[nom, clé]` de l'avatar principal du compte crypté par la clé de la tribu.
- `compteurs`: compteurs sérialisés (non cryptés).
*/
export class Compta extends GenDoc {
  get stn () { return this.blocage ? this.blocage.stn : 0 }
  get clet () { return this.nct.rnd }

  get lstAvatarNas () { // retourne l'array des na des avatars du compte (trié ordre alpha, primaire en tête)
    const t = []; for(const na of this.mav.values()) { t.push(na) }
    t.sort((a,b) => { return a.rnd[0] === 0 ? -1 : (b.rnd[0] === 0 ? 1 : (a.nom < b.nom ? -1 : (a.nom === b.nom ? 0 : 1)))})
    return t
  }

  avatarDeNom (n) { // retourne l'id de l'avatar de nom n (ou 0)
    for(const na of this.mav.values()) { if (na.nom === n) return na.id }
    return 0
  }

  clone () {
    const c = new Compta()
    c.id = this.id
    c.v = this.v
    c.vsh = this.vsh
    c.hps1 = this.hps1
    c.shay = this.shay
    c.k = this.k
    c.dhvu = this.dhvu
    c.mav = new Map()
    this.mav.forEach((na, id) => { c.mav.set(id, na) })
    c.nct = this.nct
    c.idt = this.idt
    c.nap = this.nap
    c.compteurs = new Compteurs(this.compteurs.serial)
    if (this.naprim) c.naprim = this.naprim
    c.avatarIds = new Set(c.mav.keys())
    if (this.nctk) c.nctk = this.nctk
    c.pc = this.pc
    return c
  }

  async compile (row) {
    const session = stores.session
    this.k = await decrypter(session.phrase.pcb, row.kx)
    session.clek = this.k

    this.vsh = row.vsh || 0

    this.mav = new Map()
    for(const i in row.mavk) {
      const [nom, cle] = decode(await decrypter(session.clek, row.mavk[i]))
      const na = NomGenerique.from([nom, cle])
      this.mav.set(na.id, na)
      if (na.estCompte) this.naprim = na
    }
    this.avatarIds = new Set(this.mav.keys())
    /* On connait MAINTENANT le na du compte (donc son rnd) */
    
    let b
    let ck = true
    try {
      b = await decrypter(session.clek, row.nctk)
    } catch (e) {
      // Le Comptable a crypté la tribu par le rnd du compte (il ne connait pas K)
      b = await decrypter(this.naprim.rnd, row.nctk)
      ck = false
    }
    const [nomt, rndt] = decode(b)
    if (!ck) {
      this.nctk = await crypter(session.clek, new Uint8Array(encode([nomt, rndt])))
    }
    this.nct = NomGenerique.from([nomt, rndt])
    this.idt = this.nct.id

    const [nomp, rndp] = decode(await decrypter(rndt, row.napt))
    this.nap = NomGenerique.from([nomp, rndp])

    this.hps1 = row.hps1
    this.shay = row.shay
    this.dhvu = row.dhvu ? parseInt(await decrypterStr(session.clek, row.dhvu)) : 0
    
    this.compteurs = new Compteurs(row.compteurs)
    /* TEST !!!!!!!!!!!!!
    const c = this.compteurs
    c.v1 = Math.round(this.compteurs.q1 * UNITEV1 * 0.3)
    c.v2 = Math.round(this.compteurs.q2 * UNITEV2 * 0.02)
    */

    this.compteurs.pc1 = Math.round( (this.compteurs.v1 * 100) / (this.compteurs.q1 * UNITEV1))
    this.compteurs.pc2 = Math.round( (this.compteurs.v2 * 100) / (this.compteurs.q2 * UNITEV2))
    this.pc = this.compteurs.pc1 < this.compteurs.pc2 ? this.compteurs.pc2 : this.compteurs.pc1
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

  static async mavkKV (na, k) {
    return await crypter(k, new Uint8Array(encode([na.nomx, na.rnd])))
  }

  static async mavkK (id, k) {
    return u8ToB64(await crypter(k, '' + id, 1), true)
  }

  static async row (na, nt, nctkc, q1, q2, estSponsor, phrase) { 
    /* création d'une compta
    Pour le comptable le paramètre nctkc est null (il est calculé). 
    Pour les autres, c'est le nctkc pris dans la tribu
    */
    const session = stores.session
    const r = {}
    r.id = na.id
    r.v = 1
    r.iv = GenDoc._iv(r.id, r.v)
    r.vcv = 0
    r.ivc = GenDoc._iv(r.id, r.vcv)
    r.vsh = 0

    const k = random(32)
    const ph = phrase || session.phrase
    r.kx = await crypter(ph.pcb, k)
    session.clek = k
    r.stp = estSponsor ? 1 : 0
    r.hps1 = ph.hps1
    r.shay = ph.shay
    r.nctkc = nctkc

    const nax = new Uint8Array(encode(na.anr))
    const xx = await crypter(k, new Uint8Array(encode(nt.anr)))
    r.nctkc = nctkc ? nctkc : xx
    r.nctk = xx
    r.napt = await crypter(nt.rnd, nax)

    r.mavk = { }
    r.mavk[await Compta.mavkK(na.id, k)] = await Compta.mavkKV(na, k)

    const c = new Compteurs()
    c.setQ1(q1)
    c.setQ2(q2)
    r.compteurs = c.serial
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'comptas', 
      id: r.id, v: r.v, iv: r.iv, hps1: r.hps1, _data_ }
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
  - `nct` : `[nom, cle]` de sa tribu.
  - `sp` : vrai si le filleul est lui-même sponsor (créé par le Comptable, le seul qui peut le faire).
  - `quotas` : `[v1, v2]` quotas attribués par le parrain.
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
    this.descr = {}
    await Sponsoring.decrypterDescr(this.descr, clex, row.descrx)
  }

  /* Par le candidat sponsorisé qui connaît la clé X
    du fait qu'il connaît la phrase de sponsoring
  */
  static async fromRow (row, clex) {
    const x = decode(row._data_)
    const obj = {}
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
    obj.sp = x.sp
    obj.quotas = x.quotas
    obj.nctkc = x.nctkc
    obj.na = NomGenerique.from(x.na)
    obj.naf = NomGenerique.from(x.naf)
    obj.nct =  NomGenerique.from(x.nct)
  }

  static async nouveauRow (phrase, dlv, nom, nctkc, nct, sp, quotas, ard) {
    /* 
      - 'phrase: objet phrase
      - 'dlv'
      - 'nom': nom de l'avatar du compte à créer
      - `nct` : `[nom, cle]` de la tribu.
      - 'nctkc' : nom complet tribu crypté par la clé K du comptable
      - `sp` : vrai si le filleul est lui-même sponsor (créé par le Comptable, le seul qui peut le faire).
      - `quotas` : `[v1, v2]` quotas attribués par le parrain.
    */
    const session = stores.session
    const aSt = stores.avatar
    const av = aSt.avC
    const n = NomGenerique.compte(session.ns, nom)
    const d = { na: [av.na.nom, av.na.rnd], cv: av.cv , naf: [n.nom, n.rnd], sp, nctkc, quotas}
    d.nct = nct.anr
    const descrx = await crypter(phrase.clex, new Uint8Array(encode(d)))
    const ardx = await crypter(phrase.clex, ard || '')
    const pspk = await crypter(session.clek, phrase.phrase)
    const bpspk = await crypter(session.clek, phrase.clex)
    const _data_ = new Uint8Array(encode({ 
      id: av.id,
      ids: phrase.phch,
      dlv,
      st: 0,
      dh: new Date().getTime(),
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
Un chat est éternel, une fois créé il ne disparaît qu'à la disparition des avatars en cause.

Un chat est une ardoise commune à deux avatars I et E:
- vis à vis d'une session :
  - I est l'avatar _interne_,
  - E est un avatar _externe_ connu comme _contact_.
- pour être écrite par I :
  - I doit connaître le `[nom, cle]` de E : membre du même groupe, compte de la tribu, chat avec un autre avatar du compte, ou obtenu en ayant fourni la phrase de contact de E.
  - le chat est dédoublé, une fois sur I et une fois sur E.
- un chat a une clé de cryptage `cc` propre générée à sa création (première écriture):
  - cryptée par la clé K,
  - ou cryptée par la clé publique de l'avatar I (par exemple) : dans ce cas la première écriture de contenu de I remplacera cette clé par celle cryptée par K.
- un chat a un comportement d'ardoise : chaque écriture de l'un _écrase_ la totalité du contenu pour les deux. Un numéro séquentiel détecte les écritures croisées risquant d'ignorer la maj de l'un par celle de l'autre.
- si I essaie d'écrire à E et que E a disparu, le statut `st` de I vaut 1 pour informer la session.
**Cartes de visite**
- à la création, puis à chaque mise à jour du texte, les cartes de visites sont remises à jour.
- en session, une action permet de les rafraîchir sans modifier le texte et la date-heure du texte.

_data_:
- `id`
- `ids` : identifiant du chat relativement à son avatar, hash du cryptage de `idA/idB` par le `rnd` de A.
- `v`
- `vcv` : version de la carte de visite

- `st` : statut:
  - 0 : le chat est vivant des 2 côtés
  - 1 : _l'autre_ a été détecté disparu : 
- `mc` : mots clés attribués par l'avatar au chat
- `cva` : `{v, photo, info}` carte de visite de _l'autre_ au moment de la création / dernière mise à jour du chat, cryptée par la clé CV de _l'autre_.
- `cc` : clé `cc` du chat cryptée par la clé K du compte de I ou par la clé publique de I.
- `seq` : numéro de séquence de changement du texte.
- `contc` : contenu crypté par la clé `cc` du chat.
  - `na` : `[nom, cle]` de _l'autre_.
  - `dh`  : date-heure de dernière mise à jour.
  - `txt` : texte du chat.

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
    this.st = row.st || 0
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
    return hash(await crypter(naI.rnd, naI.id + '/' + naE.id, 1))
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
    const r = { id, ids, st: 0, seq: 1, contc } // v vcv cva sont mis par le serveur
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
_data_:
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
- `ast` : **array** des statuts des membres (dès qu'ils ont été inscrits en _contact_) :
  - 10: contact, 
  - 30,31,32: **actif** (invitation acceptée) en tant que lecteur / auteur / animateur, 
  - 40: invitation refusée,
  - 50: résilié, 
  - 60,61,62: invité en tant que lecteur / auteur / animateur, 
  - 70,71,72: invitation à confirmer (tous les animateurs n'ont pas validé) en tant que lecteur / auteur / animateur, 
  - 0: disparu / oublié.
- `nag` : **array** des hash du rnd du membre crypté par le rnd du groupe.
- `mcg` : liste des mots clés définis pour le groupe cryptée par la clé du groupe cryptée par la clé du groupe.
- `cvg` : carte de visite du groupe cryptée par la clé du groupe `{v, photo, info}`.
- `ardg` : ardoise cryptée par la clé du groupe.
*/

export class Groupe extends GenDoc {
  get cle () { return getCle(this.id) }
  get na () { return getNg(this.id) }
  get nom () { return this.na.nom }
  get nomc () { return this.na.nomc }
  get pc1 () { return Math.round(this.vols.v1 / UNITEV1 / this.vols.q1) }
  get pc2 () { return Math.round(this.vols.v2 / UNITEV2 / this.vols.q2) }
  get photo () { return this.cv && this.cv.photo ? this.cv.photo : stores.config.iconGroupe }
  get nbInvits () { let n = 0
    this.ast.forEach(x => { if (x >= 60 && x <= 73) n++ })
    return n
  }

  async compile (row) {
    this.vsh = row.vsh || 0
    this.dfh = row.dfh || 0
    this.msu = row.msu || null
    this.pe = row.pe || 0
    this.ast = row.ast || new Uint8Array([0])
    this.idh = row.idhg ? parseInt(await decrypterStr(this.cle, row.idhg)) : 0
    this.imh = row.imh || 0
    this.mc = row.mcg ? decode(await decrypter(this.cle, row.mcg)) : {}
    this.cv = row.cvg ? decode(await decrypter(this.cle, row.cvg)) : null
    this.nag = row.nag || [0]
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
    const r = {
      id: nagr.id,
      v: 0,
      dfh: 0,
      msu: unanime ? new Uint8Array([]) : null,
      pe: 0,
      imh: 1,
      ast: new Uint8Array([0, 32]),
      nag: [0, n],
      idhg: await crypter(nagr.rnd, '' + stores.session.compteId)
    }
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'groupes', id: r.id, v: r.v, _data_ }
  }

  async toIdhg (idc) {
    return await crypter(this.cle, '' + idc)
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

  static async rowNouveauMembre (nag, na, im, dlv, cv, ard) {
    const r = { id: nag.id, ids: im, v: 0, dlv, vcv: cv ? cv.v : 0,
      ddi: 0, dda: 0, dfa: 0, mc: new Uint8Array([]) }
    if (dlv) r.dda = new Date().getTime()
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
- `v` : sa version.

- `st`: aaaammjj date limite de validité pour un _temporaire_.
- `im` : exclusivité dans un groupe. L'écriture et la gestion de la protection d'écriture sont restreintes au membre du groupe dont `im` est `ids`. 
- `p` : 0: pas protégé, 1: protégé en écriture.
- `v1` : volume du texte
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
- `ref` : [rid, rids, rnom] crypté par la clé de la note. Référence d'une autre note
  rnom n'est défini que pour une note d'avatar référençant un note de groupe (rnom est celui du groupe)

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

  static estG (key) { return key.charAt(2) === '2' }
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
    this.v1 = row.v1 || 0
    this.v2 = row.v2 || 0
    this.deGroupe = this.ng.estGroupe
    this.mc = this.deGroupe ? (row.mc ? decode(row.mc) : {}) : (row.mc || null)
    const x = decode(await decrypter(this.cle, row.txts))
    this.txt = ungzip(x.t)
    this.titre = titre(this.txt)
    this.dh = x.d
    this.auts = x.l ? x.l : []
    this.ref = row.ref ? decode(await decrypter(this.cle, row.ref)) : null
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

  static async toRowNouveau (id, txt, im, nbj, p, exclu, ref) {
    const session = stores.session
    const cle = Note.clen(id)
    const r = { id, ids: rnd6(), p: p ? 1 : 0, im: exclu ? im : 0, v2 : 0, mc: null }
    r.v1 = txt.length 
    r.txts = await Note.toRowTxt(cle, txt, im)
    r.ref = await Note.toRowRef(cle, ref)
    r.st = !nbj ? 0 : AMJ.amjUtcPlusNbj(session.dateJourConnx, nbj)
    const _data_ = encode(r)
    return { _nom: 'notes', id, ids: r.ids, _data_ }
  }

  static async toRowTxt (cle, txt, im, auts) {
    const x = { d: new Date().getTime(), t: gzip(txt) }
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
    return arg ? await crypter(cle, new Uint8Array(encode(arg))) : null
  }

  async nouvFic (idf, nom, info, lg, type, u8) {
    // propriétés ajoutées : u8 (contenu du fichier gzippé crypté), sha, dh gz
    const fic = { idf, nom, info, lg, type, u8 }
    fic.sha = sha256(u8)
    fic.dh = new Date().getTime()
    fic.gz = fic.type.startsWith('text/')
    fic.u8 = await crypter(this.cle, fic.gz ? gzipT(u8) : u8)
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
      if (b) buf = await decrypter(this.cle, b)
    }
    if (!buf) return null
    const f = this.mfa.get(idf)
    const buf2 = f.gz ? ungzipT(buf) : buf
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
    this.dh = new Date().getTime()
    return this
  }

  fromIdb (idb) {
    decodeIn(idb, this)
    this.txt = decoder.decode(ungzip(this.txt))
    return this
  }

  get toIdb () {
    const x = { ...this }
    x.txt = gzip(encoder.encode(this.txt))
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
    this.dh = new Date().getTime()
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
  tribus: Tribu,
  tribu2s: Tribu2,
  comptas: Compta,
  avatars: Avatar,
  groupes: Groupe,
  notes: Note,
  sponsorings: Sponsoring,
  chats: Chat,
  membres: Membre,
  cvs: Cv
}
