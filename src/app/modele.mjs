import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import { $t, hash, rnd6, intToB64, u8ToB64, idToSid, gzip, ungzip, ungzipT } from './util.mjs'
import { random, pbkfd, sha256, crypter, decrypter, decrypterStr, genKeyPair, crypterRSA, decrypterRSA } from './webcrypto.mjs'

import { ID, d13, Compteurs, UNITEV1, UNITEV2, AMJ } from './api.mjs'

import { getFichierIDB, saveSessionSync } from './db.mjs'

const decoder = new TextDecoder('utf-8')

function decodeIn (buf, cible) {
  const x = decode(buf)
  for (const p in x) cible[p] = x[p]
}

/* Versions (statique) ***********************************
Versions des sous-collections d'avatars et groupes
- chaque sous collection identifiée par un id d'avatar ou de groupe a une version courante
- au chargement depuis IDB elle donne la version stockée en base:
  - pour un avatar : l'avatar, ses secrets, chats, sponsorings sont tous disponibles
    et consistents jusqu'à cette version v. 
  - pour un groupe : le groupe, ses secrets, ses membres.
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
    return row ? decode(row._data_) : null
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
NomGenerique : NomAvatar, NomGroupe, NomTribu
************************************************************/
export class NomGenerique {
  constructor (n, nom, rnd) {
    this.id = (((rnd[0] * 10) + rnd[1]) * d13) + n
    this.nomx = nom || ''
    this.rnd = rnd
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

  get defIcon () {
    const cfg = stores.config
    if (this.estComptable) return cfg.iconSuperman
    if (this.estGroupe) return cfg.iconGroupe
    return cfg.iconAvatar
  }

  egal (ng) { return this.nom === ng.nom && this.id === ng.id }

  // Factories

  static from([nom, rnd]) {
    let z = true; for (let i = 2; i < 32; i++) if(rnd[i]) { z = false; break }
    const n = z ? 0 : (hash(rnd) % d13)
    if (rnd[1] <= 1) return new NomAvatar(n, n ? nom : '', rnd) // Peut être Comptable
    if (rnd[1] === 2) return new NomGroupe(n, nom, rnd)
    return new NomTribu(n, nom, rnd)
  }

  static comptable(ns) {
    const rnd = new Uint8Array(32)
    rnd[0] = ns
    return new NomAvatar(0, stores.config.nomDu, rnd)
  }

  static compte(ns, nom) {
    const rnd = random(32)
    rnd[0] = ns
    return new NomAvatar(hash(rnd) % d13, nom, rnd)
  }

  static avatar(ns, nom) {
    const rnd = random(32)
    rnd[0] = ns
    rnd[1] = 1
    return new NomAvatar(hash(rnd) % d13, nom, rnd)
  }

  static groupe(ns, nom) {
    const rnd = random(32)
    rnd[0] = ns
    rnd[1] = 2
    return new NomGroupe(hash(rnd) % d13, nom, rnd)
  }

  static tribu(ns, nom) {
    const rnd = random(32)
    rnd[0] = ns
    rnd[1] = 3
    return new NomTribu(hash(rnd) % d13, nom, rnd)
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
    let mx = stores.config.motscles
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
 * classes Phrase, MdpAdmin, PhraseContact
******************************************************/
export class Phrase {
  async init (debut, fin) {
    this.pcb = await pbkfd(debut + '\n' + fin)
    this.pcbh = hash(this.pcb)
    this.hps1 = hash(await pbkfd(debut))
    return this
  }

  get shax () { return sha256(this.pcb) }

  get shax64 () { return u8ToB64(this.shax) }

  get shay () { return sha256(this.shax) }  

}

export class PhraseContact {
  async init (texte) {
    this.phrase = texte
    this.clex = await pbkfd(texte)
    let hx = ''
    for (let i = 0; i < texte.length; i = i + 3) { hx += texte.charAt(i); hx += texte.charAt(i+1) }
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

const lstfnotif = ['idSource', 'idCible', 'jbl', 'nj', 'texte', 'dh']
export class Notification {

  /* Attributs: 
  - `source`: id de la source, du Comptable ou du sponsor, par convention 0 pour l'administrateur.
  - `cible` : 0 pour le global, sinon id de la tribu ou du compte.
  - `jbl` : jour de déclenchement de la procédure de blocage sous la forme `aaaammjj`, 0 s'il n'y a pas de procédure de blocage en cours.
  - `nj` : en cas de procédure ouverte, nombre de jours après son ouverture avant de basculer en niveau 4.
  - `texte` : texte informatif, pourquoi, que faire ...
  - `dh` : date-heure de dernière modification (informative).
  */
  constructor (buf, idSource, idCible) {
    if (buf) {
      const r = decode(buf)
      for (const f of lstfnotif) this[f] = r[f]
    } else {
      this.idSource = idSource
      this.idCible = idCible
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
      this.d5 = AMJ.amjUtcPlusNbj(this.jbl, stores.config.limitesjour.dlv)
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
  const cl = classes[row._nom]
  if (!cl) return null
  const obj = new cl()
  obj._nom = row._nom
  obj.id = row.id || 0
  if (row.ids) obj.ids = row.ids
  if (row.dlv) obj.dlv = row.dlv
  if (row.dfh) obj.dfh = row.dfh
  obj.v = row.v || 0
  if (row._data_) {
    const x = decode(row._data_)
    await obj.compile(x)
  } else {
    obj._zombi = true
  }
  return obj
}

/** Espaces **************************************
- `id` : de l'espace de 10 à 89.
- `v`
_data_:
- `notifA` : notification de l'administrateur, cryptée par la clé du Comptable.
- `notifC` : notification du Comptable cryptée par la clé du Comptable.
- `blocage`: de l'administrateur.
- `t` : taille de l'espace, de 1 à 9, fixé par l'administrateur :
  son poids relatif dans l'ensemble des espaces.
*/
export class Espace extends GenDoc {

  async compile (row) {
    // la clé est le rnd du Comptable de l'espace
    const cle = new Uint8Array(32); cle[0] = this.id
    if (row.notif) {
      this.notif = new Notification(await decrypter(cle, row.notif))
      this.notif.v = this.v
    } else this.notif = null
    this.t = row.t || 0
  }

  static async nouveau (id) {
    const r = { id, v: 1, t: 1, notif: null }
    return { _nom: 'espaces', id, v: 1, _data_: new Uint8Array(encode(r))}
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
      setNg(this.naC)
      this.info = row.infok ? await decrypterStr(session.clek, row.infok) : ''
    }
    this.nctkc = row.nctkc
    this.notif = row.notif ? new Notification(await decrypter(this.clet, row.notif)) : null
    this.cpt = decode(row.cpt)
  }

  static async primitiveRow (nt, a1, a2, q1, q2) {
    const r = {}
    r.vsh = 0
    r.id = nt.id
    r.v = 1
    r.iv = GenDoc._iv(r.id, r.v)
    const cpt = { a1, a2, q1, q2, nbc: 1, nbsp: 1, cbl: 0, nco: [0, 0], nsp: [0, 0]}
    r.cpt = new Uint8Array(encode(cpt))
    r.nctkc = await crypter(stores.session.clek, new Uint8Array(encode([nt.nom, nt.rnd])))
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
      r.bl = e.bl ? true : false
      setNg(r.na)
      r.q1 = e.q1 || 0
      r.q2 = e.q2 || 0
      if (e.blocaget) {
        const b = await decrypter(this.clet, e.blocaget)
        r.blocage = new Blocage(b)
      } else r.blocage = null
      r.cv = e.cv ? decode(await decrypter(e.na.rnd, e.cv)) : null
      r.notif = e.notif ? new Notification(await decrypter(this.clet, e.notif)) : null
      this.mbtr[r.na.id] = r
    }
  }

  get naSponsors () { // array des na des sponsors
    const r = []
    for (const x in this.mbtr) {
      const e = this.mbtr[x]
      if (e.sp) r.push(e.na)
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
  - _clé_ : `ni`, numéro d'invitation obtenue sur une invitation.
  - _valeur_ : cryptée par la clé K du compte de `[nomg, clég, im]` reçu sur une invitation.
  - une entrée est effacée par la résiliation du membre au groupe (ce qui l'empêche de continuer à utiliser la clé du groupe).
  - pour une invitation en attente _valeur_ est cryptée par la clé publique RSA de l'avatar
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
  */
  niDeGroupes (setg) {
    const ani = new Set()
    for (const [ ,t] of this.lgr) if (setg.has(t.ng.id)) {
      ani.add(t.ni)
      this.lgr.delete(ni)
    }
    for (const [ ,t] of this.invits) if (setg.has(t.ng.id)) {
      ani.add(t.ni)
      this.invits.delete(ni)
    }
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
          setNg(ng)
          this.lgr.set(ni, { ng, im})  
          gSt.setInvit(ng.id, this.id)
        } else {
          const [nom, rnd, im] = decode(await decrypter(session.clek, lgrc))
          const ng = NomGenerique.from([nom, rnd])
          setNg(ng)
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
- `hps1` : hash du PBKFD de la ligne 1 de la phrase secrète du compte : sert d'accès au row compta à la connexion au compte.
- `shay` : SHA du SHA de X (PBKFD de la phrase secrète). Permet de vérifier la détention de la phrase secrète complète.
- `kx` : clé K du compte, cryptée par le PBKFD de la phrase secrète courante.
- `dhvu` : date-heure de dernière vue des notifications par le titualire du compte, cryptée par la clé K.
- `mavk` : map des avatars du compte cryptée par la clé K du compte. 
  - _clé_ : id de l'avatar.
  - _valeur_ : `[nom clé]` : son nom complet.
- `nctk` : `[nom, clé]` de la tribu crypté par la clé K du compte.
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

  async compile (row) {
    const session = stores.session
    this.k = await decrypter(session.phrase.pcb, row.kx)
    session.clek = this.k

    this.vsh = row.vsh || 0

    /* `mavk` {id} `[nom, cle]` */
    const m = decode(await decrypter(session.clek, row.mavk))
    this.mav = new Map()
    for(const id in m) {
      const [nom, cle] = m[id]
      const na = NomGenerique.from([nom, cle])
      this.mav.set(parseInt(id), na)
      setNg(na) 
      if (na.estAvatarP) this.naprim = na
    }
    this.avatarIds = new Set(this.mav.keys())
    /* On connait MAINTENANT le na du compte (donc son rnd) */
    
    let b
    let ck = true
    try {
      b = await decrypter(session.clek, row.nctk)
    } catch (e) {
      // Le Comptable a crypter la tribu par le rnd du compte (il ne connait pas K)
      b = await decrypter(this.naprim.rnd, row.nctk)
      ck = false
    }
    const [nomt, rndt] = decode(b)
    if (!ck) {
      this.nctk = await crypter(session.clek, new Uint8Array(encode([nomt, rndt])))
    }
    this.nct = NomGenerique.from([nomt, rndt])
    this.idt = this.nct.id
    setNg(this.nct)

    const [nomp, rndp] = decode(await decrypter(rndt, row.napt))
    this.nap = NomGenerique.from([nomp, rndp])
    setNg(this.id, this.nap)

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

  async ajoutAvatarMavk (nvna) {
    const m = {}
    for(const na of this.mav.values()) {
      m[na.id] = [na.nom, na.rnd]
    }
    m[nvna.id] = [nvna.nom, nvna.rnd]
    return await crypter(stores.session.clek, new Uint8Array(encode(m)))
  }

  static async row (na, nt, nctkc, q1, q2, estSponsor, phrase) { 
    /* création d'une compta
    Pour le comptable le paramètre nctkc est null (il est calculé). 
    Pour les autres, c'est le nctkc pris dans la tribu exi
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

    r.nctk = await crypter(k, new Uint8Array(encode([nt.nom, nt.rnd])))
    r.nctkc = nctkc || r.nctk
    r.napt = await crypter(nt.rnd, new Uint8Array(encode([na.nom, na.rnd])))

    const m = { }
    m[na.id] = [na.nomx, na.rnd]
    r.mavk = await crypter(session.clek, new Uint8Array(encode(m)))

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
    const n = NomGenerique.avatar(session.ns, nom)
    const d = { na: [av.na.nom, av.na.rnd], cv: av.cv , naf: [n.nom, n.rnd], sp, nctkc, quotas}
    d.nct = [nct.nom, nct.rnd]
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
Un chat est une ardoise commune à deux avatars A et B:
- pour être écrite par A :
  - A doit connaître le `[nom, cle]` de B : membre du même groupe, sponsor de la tribu, ou par donnée de la phrase de contact de B.
  - le chat est dédoublé, une fois sur A et une fois sur B.
  - dans l'avatar A, le contenu est crypté par la clé de A.
  - dans l'avatar B, le contenu est crypté par la clé de B.
- un chat a un comportement d'ardoise : chacun _écrase_ la totalité du contenu.
- si A essaie d'écrire à B et que B a disparu, la `dlv` est positionnée sur les deux exemplaires si elle ne l'était pas déjà.

**Suppression d'un chat**
- chacun peut supprimer son chat : par exemple A supprime son chat avec B
- côté A, la `dlv` du chat avec B est positionnée au jour courant + 365 (afin de permettre la synchronisation sur plusieurs sessions / appareils): c'est le GC quotidien qui le purgera.
- en session comme en serveur, dès qu'il y a une `dlv`, le chat est considéré comme inexistant.
- si B réécrit un chat à A, côté A la `dlv` du chat de B est remise à 0. Le chat _renaît_ (s'il avait été supprimé).

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
- `v` : version, du groupe, ses secrets, ses membres. 
- `iv`
- `dfh` : date de fin d'hébergement.

- `idhg` : id du compte hébergeur crypté par la clé du groupe.
- `imh` : indice `im` du membre dont le compte est hébergeur.
- `msu` : mode _simple_ ou _unanime_.
  - `null` : mode simple.
  - `[ids]` : mode unanime : liste des indices des animateurs ayant voté pour le retour au mode simple. La liste peut être vide mais existe.
- `pe` : 0-en écriture, 1-protégé contre la mise à jour, création, suppression de secrets.
- `ast` : array des statuts des membres (dès qu'ils ont été inscrits en _contact_) :
  - 10: contact, 
  - 20,21,22: invité en tant que lecteur / auteur / animateur, 
  - 30,31,32: **actif** (invitation acceptée) en tant que lecteur / auteur / animateur, 
  - 40: invitation refusée,
  - 50: résilié / suspendu, 
  - 0: disparu / oublié.
- `mcg` : liste des mots clés définis pour le groupe cryptée par la clé du groupe cryptée par la clé du groupe.
- `cvg` : carte de visite du groupe cryptée par la clé du groupe `{v, photo, info}`. 
*/

export class Groupe extends GenDoc {
  get cle () { return getCle(this.id) }
  get na () { return getNg(this.id) }
  get nom () { return this.na.nom }
  get nomc () { return this.na.nomc }
  get pc1 () { return Math.round(this.vols.v1 / UNITEV1 / this.vols.q1) }
  get pc2 () { return Math.round(this.vols.v2 / UNITEV2 / this.vols.q2) }

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
  }

  get mbHeb () { // membre hébergeur
    return  this.dfh ? null : stores.membre.getMembre(this.id, this.imh)
  }

  async setDisparus(setIds) { // check / maj des statuts des membres disparus
    for(const ids of setIds) {
      if (this.ast[ids]) {
        this.ast[ids] = 0
        const args = { token: session.authToken, id: this.id, ids }
        this.tr(await post(this, 'DisparitionMembre', args))
      }
    }
  }

  static async rowNouveauGroupe (na, unanime) {
    const r = {
      id: na.id,
      v: 0,
      dfh: 0,
      msu: unanime ? new Uint8Array([]) : null,
      pe: 0,
      imh: 1,
      ast: new Uint8Array([0, 32]),
      idhg: await crypter(na.rnd, '' + stores.session.compteId)
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

  /*
  motcle (n) { // utilisé par util / Motscles
    const s = this.mc[n]
    if (!s) return ''
    const i = s.indexOf('/')
    return i === -1 ? { c: '', n: s } : { c: s.substring(0, i), n: s.substring(i + 1) }
  }
  */
}

/** Membre ***********************************************************
- `id` : id du groupe.
- `ids`: identifiant, indice de membre relatif à son groupe.
- `v`
- `vcv` : version de la carte de visite du membre
- `dlv` : date de dernière signature + 365 lors de la connexion du compte de l'avatar membre du groupe.

- `ddi` : date de la dernière invitation
- `dda` : date de début d'activité (jour de la première acceptation)
- `dfa` : date de fin d'activité (jour de la dernière suspension)
- `inv` : validation de la dernière invitation:
  - `null` : le membre n'a pas été invité où le mode d'invitation du groupe était _simple_ au moment de l'invitation.
  - `[ids]` : liste des indices des animateurs ayant validé la dernière invitation.
- `mc` : mots clés du membre à propos du groupe.
- `infok` : commentaire du membre à propos du groupe crypté par la clé K du membre.
- `datag` : données, immuables, cryptées par la clé du groupe :
  - `nom` `rnd` : nom complet de l'avatar.
  - `ni` : numéro aléatoire d'invitation du membre. Permet de supprimer l'invitation et d'effacer le groupe dans son avatar (clé de `lgrk invits`).
	- `imc` : indice du membre qui l'a inscrit en comme _contact_.
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
    const data = decode(await decrypter(this.cleg, row.datag))
    this.na = NomGenerique.from([data.nom, data.rnd])
    this.ni = data.ni
    this.imc = data.imc
    this.estAc = aSt.compta.avatarIds.has(this.na.id)
    if (!this.estAc) setNg(this.na)
    this.info = row.infok && this.estAc ? await decrypterStr(stores.session.clek, row.infok) : ''
    this.cv = row.cva && !this.estAc ? decode(await decrypter(this.na.rnd, row.cva)) : null
  }

  static async rowNouveauMembre (nag, na, im, ni, imc, dlv) {
    const r = { id: nag.id, ids: im, v: 0, dlv, ddi: 0, dda: 0, dfa: 0, mc: new Uint8Array([]) }
    if (dlv) r.dda = new Date().getTime()
    const x = { nom: na.nom, rnd: na.rnd, ni, imc, inv: null }
    r.datag = await crypter(nag.rnd, new Uint8Array(encode(x)))
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'membres', id: r.id, ids: r.ids, v: r.v, _data_ }
  }

}

/** Secret ****************************************************
_data_:
- `id` : id de l'avatar ou du groupe.
- `ids` : identifiant relatif à son avatar.
- `v` : sa version.

- `st` :
  - `99999999` pour un _permanent_.
  - `aaaammjj` date limite de validité pour un _temporaire_.
- `im` : exclusivité dans un groupe. L'écriture et la gestion de la protection d'écriture sont restreintes au membre du groupe dont `im` est `ids`. 
- `p` : 0: pas protégé, 1: protégé en écriture.
- `v1` : volume du texte
- `v2` : volume total des fichiers attachés.
- `mc` :
  - secret personnel : vecteur des index de mots clés.
  - secret de groupe : map sérialisée,
    - _clé_ : `im` de l'auteur (0 pour les mots clés du groupe),
    - _valeur_ : vecteur des index des mots clés attribués par le membre.
- `txts` : crypté par la clé du secret.
  - `d` : date-heure de dernière modification du texte.
  - `l` : liste des auteurs pour un secret de groupe.
  - `t` : texte gzippé ou non.
- `mfas` : map des fichiers attachés.
- `refs` : couple `[id, ids]` crypté par la clé du secret référençant un autre secret _référence de voisinage_ qui par principe, lui, n'aura pas de `refs`.

**Map `mfas` des fichiers attachés dans un secret:**
- _clé_ `idf`: identifiant du fichier en base64.
- _valeur_ : { lg, datas }
  - `lg` : taille du fichier, en clair afin que le serveur puisse toujours recalculer la taille totale v2 d'un secret.
  - `datas` : sérialisation cryptée par la clé S du secret de : `{ nom, info, dh, type, gz, lg, sha }`.
*/

export class Secret extends GenDoc {
  get cle () { return getCle(this.id) }
  get ng () { return getNg(this.id) }

  async compile (row) {
    this.st = row.st || 99999999
    this.im = row.im || 0
    this.p = row.p || 0
    this.v1 = row.v1 || 0
    this.v2 = row.v2 || 0
    this.deGroupe = this.ng.estGroupe
    this.mc = this.deGroupe ? (row.mc ? decode(row.mc) : {}) : (row.mc || new Uint8Array([]))
    this.txt = decode(await decrypter(cle, row.txts))
    this.txt.t = ungzip(this.txt.t)
    this.ref = row.refs ? decode(await decrypter(this.cle, row.refs)) : null

    this.mfa = new Map()
    if (this.v2) {
      const map = row.mfas ? decode(row.mfas) : {}
      for (const idf in map) 
        this.mfa.set(idf, decode(await decrypter(cle, map[idf].datas)))
    }
  }

  get pkref () { return !this.ref ? '' : (idToSid(this.ref[0]) + '/' + this.ref[1]) }
  // get horsLimite () { return this.st < 0 || this.st >= 99999 ? false : dlvDepassee(this.st) }
  get nbj () { return this.st <= 0 || this.st === 99999999 ? 0 : AMJ.diff(this.st, AMJ.amjUtc()) }
  get dh () { return dhcool(this.txt.d * 1000) }

  get idCompta () { 
    if (this.deGroupe) {
      const gSt = stores.groupe
      return gSt.getGroupe(this.id).idh
    } else return stores.session.compteId
  }

  /* En attente ***************************************************
  get nomf () {
    if (this.suppr) return 'SUPPRIMÉ@' + this.sid2
    const i = this.txt.t.indexOf('\n')
    const t = this.txt.t.substring(0, (i === -1 ? 16 : (i < 16 ? i : 16)))
    return normpath(t) + '@' + this.sid2
  }

  get nomEdACG () {
    return this.ts === 0 ? this.avatar.nomc : (this.ts === 1 ? this.couple.nomc : this.groupe.nomc)
  }

  get mcg () { return this.ts === 2 && this.mc ? this.mc[0] || new Uint8Array([]) : new Uint8Array([]) }

  // Si id est celui d'un avatar accédant au secret, retourne id
  // Sinon retourne l'un des avatars du compte accédant au secret
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
    const aSt = stores.avatar
    aSt.compte.avatarIds().forEach(idm => {
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
  */

  nouveau (id, ref) {
    this.id = id
    this.ids = rnd6()
    this.v = 0
    this.x = 0
    this.st = 99999999
    this.xp = 0
    this.txt = { t: '', d: Math.floor(new Date().getTime() / 1000) }
    this.ref = ref || null
  }

  nouveauP (id, ref) {
    this.nouveau(id, ref)
    this.mc = new Uint8Array([])
    return this
  }

  nouveauG (id, ref, im) {
    this.nouveau(id, ref)
    this.mc = { 0: new Uint8Array([]), im: new Uint8Array([]) }
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
TexteLocal:
- id: id du texte (random)
- dh: date-heure d'enregistrement
- txt: string MD gzippé
*/

export class TexteLocal {
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
  }

  toIdb () {
    const x = { ...this }
    x.txt = gzip(encoder.encode(this.txt))
    return new Uint8Array(encode(x))
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
  }

  toIdb () {
    return encode({ ...this })
  }
}

const classes = {
  espaces: Espace,
  tribus: Tribu,
  tribu2s: Tribu2,
  comptas: Compta,
  avatars: Avatar,
  groupes: Groupe,
  secrets: Secret,
  sponsorings: Sponsoring,
  chats: Chat,
  membres: Membre,
  cvs: Cv
}
