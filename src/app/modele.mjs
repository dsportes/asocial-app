import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import { $t, hash, rnd6, intToB64, u8ToB64, idToSid, titre, gzip, ungzip, ungzipT, egaliteU8, tru8, splitPK } from './util.mjs'
import { random, pbkfd, sha256, crypter, decrypter, decrypterStr } from './webcrypto.mjs'

import { IDCOMPTABLE, RNDCOMPTABLE, Compteurs, UNITEV1, UNITEV2, AMJ } from './api.mjs'

import { getFichierIDB, saveSessionSync } from './db.mjs'

const decoder = new TextDecoder('utf-8')

function decodeIn (buf, cible) {
  const x = decode(buf)
  for (const p in x) cible[p] = x[p]
}

export function getSecret (id, ids) {
  const st = id % 10 === 8 ? stores.groupe : stores.avatar
  return st.getSecret(id, ids)
}

// Retourne l'array des [id, ids] des secrets voisins de celui passé en argument
export function getVoisins(id, ids) {
  const r = []
  stores.avatar.getVoisins(id, ids).forEach(pk => { r.push(splitPK(pk)) })
  stores.groupe.getVoisins(id, ids).forEach(pk => { r.push(splitPK(pk)) })
  return r
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
  static get (id) { return Versions.map[id] || 0 }
  static set (id, v) { Versions.map[id] = v; Versions.toSave = true }
  static del (id) { delete Versions.map[id]; Versions.toSave = true }
  static load (idb) { 
    Versions.map = idb ? decode(idb) : {}
    Versions.toSave = false
    return Versions.map
  }
  static toIdb () { Versions.toSave = false; return new Uint8Array(encode(Versions.map))}
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
NomGenerique : NomAvatar / NomContact / NomGroupe / NomTribu
************************************************************/
export class NomGenerique {
  constructor (nom, rnd) {
    let c = false
    if (typeof rnd === 'number' ) {
      if (rnd === -1) {
        this.rnd = RNDCOMPTABLE
        c = true
       } else { 
        this.rnd = random(32)
        this.rnd[0] = rnd
        c = false
      }
    } else {
      this.rnd = rnd
      c = egaliteU8(this.rnd, RNDCOMPTABLE)
    }
    this.nom = c ? stores.config.nomDuComptable : nom
    this.id = c ? IDCOMPTABLE : (Math.round(hash(this.rnd) / 10) * 10) + this.rnd[0]
  }

  get estGroupe () { return this.id % 10 === 2 }
  get estTribu () { return this.id % 10 === 3 }
  get estAvatar () { return this.id % 10 < 2 }
  get estAvatarP () { return this.id % 10 === 0 }
  get estAvatarS () { return this.id % 10 === 1 }
  get estComptable () { return this.id === IDCOMPTABLE }
  get nomc () { return this.nom + (this.estComptable ? '' : ('#' + ('' + this.id).substring(0, 4))) }
  // get nomf () { return normpath(this.nomc) }
  get sid () { return intToB64(this.id) }
  get cv () { return getCv(this.id) }

  egal (ng) {
    return this.nom === ng.nom && this.id === ng.id && egaliteU8(this.rnd, ng.rnd)
  }

  get photo () {
    if (this.id === IDCOMPTABLE) return stores.config.iconSuperman
    const cv = getCv(this.id)
    return cv ? cv.photo : ''
  }

  get info () {
    if (this.id === IDCOMPTABLE) return stores.config.nomDuComptable
    const cv = getCv(this.id)
    return cv ? cv.info : ''
  }

}

export class NomAvatar extends NomGenerique {
  constructor (nom, rnd) { super(nom, rnd) }

  get titre () {
    const info = this.info
    return info ? titre(info) : ''
  }

  get photoDef () { return this.photo || stores.config.iconAvatar }

  clone () { return new NomAvatar(this.nom, this.rnd) }
}

export class NomGroupe extends NomGenerique {
  constructor (nom, rnd) { super(nom, rnd || 2) }

  get photoDef () { return this.photo || stores.config.iconGroupe }

  clone () { return new NomGroupe(this.nom, this.rnd) }
}

export class NomTribu extends NomGenerique {
  constructor (nom, rnd) { super(nom, rnd || 3) }

  clone () { return new NomTribu(this.nom, this.rnd) }
}

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
    const m = new Map()
    const mx = stores.config.motscles
    for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
    if (duCompte) {
      const mx = stores.avatar.motscles || {}
      for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
    }
    if (duGroupe) {
      const g = stores.groupe.getGroupe(duGroupe)
      if (g) {
        mx = g.motscles || null
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
    this.pcb64 = u8ToB64(this.pcb)
    this.pcbh = hash(this.pcb)
    this.dpbh = hash(await pbkfd(debut)) // hps1 dans compta
  }

  get shax () { return sha256(this.pcb) }

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

const lstfBlocage = ['sp', 'jib', 'nja', 'njl', 'dh']
export class Blocage {

  /* Attributs: 
  - `sp`: id du sponsor si créé / gérée par un sponsor (absent / 0 pour un blocage _tribu_). Lorsque le comptable a pris le contrôle sur une procédure de blocage de compte, un sponsor ne peut plus la modifier / remplacer / supprimer.
  - `jib` : jour initial de la procédure de blocage sous la forme `aaaammjj`.
  - `nja njl` : nb de jours passés en niveau _alerte_, et _lecture seule_.
  Attributs calculés (pour le jour courant):
  - niv : niveau actuel (0: alerte, 1:lecture, 2:bloqué)
  - njra: nb jours restant sur le niveau alerte
  - njrl: nb jours restant sur le niveau lecture
  - njrb: nb jours restant à vivre bloqué
  - dja : dernier jour en alerte
  - djl : dernier jour en lecture
  - djb : dernier jour en blocage (fin de vie du compte)
  */
  constructor (buf, sp) {
    if (buf) {
      const r = decode(buf)
      for (const f of lstfBlocage) this[f] = r[f]
      this.sp = r.sp || 0
    } else {
      this.sp = sp
      this.jib = AMJ.amjUtc()
      this.nja = 30
      this.njl = 30
      this.dh = 0
    }
    this.recalculBloc()
  }

  clone () {
    return new Blocage(this.encode()) 
  }

  encode () {
    const buf = {}
    for (const f of lstfBlocage) buf[f] = this[f]
    return new Uint8Array(encode(buf))
  }

  recalculBloc () {
    try {
    this.djb = AMJ.amjUtcPlusNbj(this.jib, stores.config.limitesjour.dlv)
    this.dja = AMJ.amjUtcPlusNbj(this.jib, this.nja)
    this.djl = AMJ.amjUtcPlusNbj(this.jib, this.nja + this.njl)
    const now = AMJ.amjUtc()
    this.njrb = AMJ.diff(this.djb, now)
    if (now > this.djl) { this.niv = 2; this.njra = 0; this.njrl = 0; return }
    this.njrl = AMJ.diff(this.djl, now)
    if (now > this.dja) { this.niv = 1; this.njra = 0; return }
    this.njra = AMJ.diff(this.dja, now)
    this.niv = 0
    } catch (e) {
      console.log(e)
    }
  }
}

/****************************************************
 * Tous les objets Documents
****************************************************/
export class GenDoc {
  static deGroupe (id) { return id && id % 10 === 8 }
  static idCompta (id) { return Math.floor(id / 10) * 10 }
  get pk () { return this.id + (this.ids ? '/' + this.ids : '')}
  static _iv (id, v) { return ((id % 1000000 ) * 1000000) + v}
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
  obj.id = row.id
  if (row.ids) obj.ids = row.ids
  if (row.dlv) obj.dlv = row.dlv
  obj.v = row.v
  if (row._data_) {
    const x = decode(row._data_)
    await obj.compile(x)
  } else {
    obj._zombi = true
  }
  return obj
}

/** Tribu *********************************
- `id` : numéro de la tribu
- `v` : sa version

- `nctkc` : `[nom, rnd]` de la tribu crypté par la clé K du comptable.
- `infok` : commentaire privé du comptable crypté par la clé K du comptable.
- `notifco` : notification du comptable à la tribu (cryptée par la clé de la tribu).
- `notifsp` : notification d'un sponsor à la tribu (cryptée par la clé de la tribu).
- `a1 a2` : sommes des volumes V1 et V2 déjà attribués comme forfaits aux comptes de la tribu.
- `r1 r2` : volumes V1 et V2 en réserve pour attribution aux comptes actuels et futurs de la tribu.
- `mbtr` : map des membres de la tribu:
  - _clé_ : id pseudo aléatoire, hash de la clé `rnd` du membre.
  - _valeur_ :
    - `na` : `[nom, rnd]` du membre crypté par la clé de la tribu.
    - `sp` : si `true` / présent, c'est un sponsor.
    - `bl` : si `true`, le compte fait l'objet d'une procédure de blocage.
    - `cv` : `{v, photo, info}`, uniquement pour un sponsor, sa carte de visite cryptée par la clé CV du sponsor (le `rnd` ci-dessus).
- `blocaget` : blocage crypté par la clé de la tribu.
*/

export class Tribu extends GenDoc {
  get na () { return getNg(this.id) }
  get clet () { return getCle(this.id) }
  get stn () { return this.blocage ? this.blocage.stn : 0 }

  async compile (row) {
    const session = stores.session
    this.vsh = row.vsh || 0
    this.id = row.id
    this.dh = row.dh
    this.v = row.v

    if (session.estComptable) {
      // Le comptable peut décoder n'importe quelle tribu
      const [nom, rnd] = decode(await decrypter(session.clek, row.nctkc))
      const na = new NomTribu(nom, rnd)
      setNg(na)
      this.info = row.infok ? await decrypterStr(session.clek, row.infok) : ''
    }
    this.nctkc = row.nctkc
    this.a1 = row.a1
    this.a2 = row.a2
    this.r1 = row.r1
    this.r2 = row.r2

    this.notifco = row.notifco ? decode(await decrypter(this.clet, row.notifco)) : null
    this.notifsp = row.notifsp ? decode(await decrypter(this.clet, row.notifsp)) : null

    this.nbsp = 0
    this.nbco = 0
    this.nbbl = 0

    this.mbtr = row.mbtr || {}
    for (const x in this.mbtr) {
      const e = this.mbtr[x]
      const [nom, cle] = decode(await decrypter(this.clet, e.na))
      e.na = new NomAvatar(nom, cle)
      e.sp = e.sp ? true : false
      e.bl = e.bl ? true : false
      setNg(e.na)
      e.cv = e.cv ? decode(await decrypter(e.na.rnd, e.cv)) : null
      if (e.sp) this.nbsp++
      this.nbco++
      if (e.bl) this.nbbl++
    }
    if (row.blocaget) {
      const b = await decrypter(this.clet, row.blocaget)
      this.blocage = new Blocage(b)
    } else this.blocage = null
  }

  get naSponsors () { // array des na des sponsors
    const r = []
    for (const x in this.mbtr) {
      const e = this.mbtr[x]
      if (e.sp) r.push(e.na)
    }
    return r
  }

  get naMembres () { // array des na des membres
    const r = []
    for (const x in this.mbtr) r.push(this.mbtr[id].na)
    return r
  }

  get idSponsors () { // array des id des sponsors
    const r = []
    for (const x in this.mbtr) {
      const e = this.mbtr[x]
      if (e.sp) r.push(e.na.id)
    }
    return r
  }

  // retourne la CV du sponsor d'id donné
  cvSponsor (id) {
    for (const x in this.mbtr) {
      const e = this.mbtr[x]
      if (e.na.id === id) {
        return e.cv ? e.cv : null
      }
    }
    return null
  }

  static async primitiveRow (nt, a1, a2, r1, r2) {
    const naComptable = getNg(IDCOMPTABLE)
    const r = {}
    r.vsh = 0
    r.id = nt.id
    r.v = 1
    r.iv = GenDoc._iv(r.id, r.v)
    r.a1 = a1
    r.a2 = a2
    r.r1 = r1
    r.r2 = r2
    r.mbtr = { }
    /* - `mbtr` : map des membres de la tribu:
    - _clé_ : id pseudo aléatoire, hash de la clé `rnd` du membre.
    - _valeur_ :
      - `na` : `[nom, rnd]` du membre crypté par la clé de la tribu.
      - `sp` : si `true` / présent, c'est un sponsor.
      - `bl` : si `true`, le compte fait l'objet d'une procédure de blocage.
      - `cv` : `{v, photo, info}`, uniquement pour un sponsor, sa carte de visite cryptée par la clé CV du sponsor (le `rnd` ci-dessus).
    */
    r.mbtr['' + hash(naComptable.rnd)] = { 
      na : await crypter(nt.rnd, new Uint8Array(encode([naComptable.nom, naComptable.rnd]))),
      sp: true
    }
    r.nctkc = await crypter(stores.session.clek, new Uint8Array(encode([nt.nom, nt.rnd])))
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'tribus', id: r.id, v: r.v, iv: r.iv, _data_ }
  }

  static async nouvelleRow (nt, r1, r2) {
    const r = {}
    r.vsh = 0
    r.id = nt.id
    r.v = 1
    r.iv = GenDoc._iv(r.id, r.v)
    r.a1 = 0
    r.a2 = 0
    r.r1 = r1
    r.r2 = r2
    r.mbtr = { }
    r.nctkc = await crypter(stores.session.clek, new Uint8Array(encode([nt.nom, nt.rnd])))
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'tribus', id: r.id, v: r.v, iv: r.iv, _data_ }
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

- `cva` : carte de visite cryptée par la clé CV de l'avatar `{v, photo, info}`.
- `lgrk` : map :
  - _clé_ : `ni`, numéro d'invitation obtenue sur une invitation.
  - _valeur_ : cryptée par la clé K du compte de `[nomg, clég, im]` reçu sur une invitation.
  - une entrée est effacée par la résiliation du membre au groupe (ce qui l'empêche de continuer à utiliser la clé du groupe).
- `invits` : map des invitations en cours
  - _clé_ : `ni`, numéro d'invitation.
  - _valeur_ : cryptée par la clé CV de l'avatar `[nomg, clég, im]`.
  - une entrée est effacée par l'annulation de l'invitation du membre au groupe ou sur acceptation ou refus de l'invitation.
- `pck` : PBKFD de la phrase de contact cryptée par la clé K.
- `hpc` : hash de la phrase de contact.
- `napc` : `[nom, clé]` de l'avatar cryptée par le PBKFD de la phrase de contact.
*/

export class Avatar extends GenDoc {
  get primaire () { return this.id % 10 === 0 } // retourne true si l'objet avatar est primaire du compte
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
    for (const t of this.lgr) {
      const e = map[t.ng.id]
      if (!e) { map[t.ng.id] = { idg, mbs: [t.im], dlv } } else e.mbs.push(t.im)
    }
  }

  /* Ids des groupes de l'avatar, accumulés dans le set s */
  idGroupes (s) {
    const x = s || new Set()
    for (const t of this.lgr) x.add(t.ng.id)
    return x
  }

  /* Retourne les numéros d'invitation de l'avatar pour les groupes de setg
  si del, supprime ces entrées */
  niDeGroupes (setg) {
    const ani = []
    for (const t of this.lgr) if (setg.has(t.ng.id)) ani.push(t.ni)
    ani.forEach(ni => { this.lgr.delete(ni) })
    return ani
  }

  /** compile *********************************************************/
  async compile (row) {
    const session = stores.session
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
      for (const ni in row.lgrk) {
        const [nom, rnd, im] = decode(await decrypter(session.clek, row.lgrk[ni]))
        this.lgr.set(parseInt(ni), { ng: new NomGroupe(nom, rnd), ni, im})
      }
    }

    this.invits = new Map()
    if (row.invits) {
      /* map des invitations en cours - clé : `ni`, numéro d'invitation.
        - _valeur_ : cryptée par la clé CV de l'avatar `[nom, cle, im]`.*/
      for (const ni in row.invits) {
        const [nom, rnd, im] = decode(await decrypter(kcv, row.invits[ni]))
        this.invits.set(parseInt(ni), { ng: new NomGroupe(nom, rnd), ni, im})
      }
    }

    return this
  }

  static async primaireRow (na) {
    const r = {}
    r.id = na.id
    r.v = 1
    r.iv = GenDoc._iv(r.id, r.v)
    r.vcv = 0
    r.ivc = GenDoc._iv(r.id, r.vcv)
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
- `dhb` : date-heure `dh` du blocage quand elle est non nulle (qu'il y a un blocage).
- `hps1` : hash du PBKFD de la ligne 1 de la phrase secrète du compte : sert d'accès au row compta à la connexion au compte.
- `shay` : SHA du SHA de X (PBKFD de la phrase secrète). Permet de vérifier la détention de la phrase secrète complète.
- `kx` : clé K du compte, cryptée par le PBKFD de la phrase secrète courante.
- `stp` : statut parrain (0: non, 1:oui).
- `notifco` : notification du comptable au compte (cryptée par la clé de l'avatar principal du compte).
- `notifsp` : notification d'un sponsor au compte (cryptée par la clé de l'avatar principal du compte).
- `dhvu` : date-heure de dernière vue des notifications par le titualire du compte, cryptée par la clé du compte.
- `mavk` : map des avatars du compte cryptée par la clé K du compte. 
  - _clé_ : id de l'avatar.
  - _valeur_ : `[nom clé]` : son nom complet.
- `nctk` : `[nom, clé]` de la tribu crypté par la clé K du compte.
- `nctkc` : `[nom, clé]` de la tribu crypté par la clé K **du Comptable**: 
- `napt`: `[nom, clé]` de l'avatar principal du compte crypté par la clé de la tribu.
- `compteurs`: compteurs sérialisés (non cryptés).
- `blocaget` : blocage du compte crypté par la clé de la tribu.
- `dhdq` : date-heure de détection du _dépassement_ des quotas.
- `dhrq` : date-heure de détection du retour au _respect_ des quotas. 
*/

export class Compta extends GenDoc {
  get estSponsor () { return this.stp === 1 }
  get stn () { return this.blocage ? this.blocage.stn : 0 }
  get clet () { return this.nct.rnd }

  get avatarIds () { return new Set(this.mav.keys()) } // retourne (ou accumule dans s), le set des ids des avatars du compte

  get lstAvatarNas () { // retourne l'array des na des avatars du compte (trié ordre alpha, primaire en tête)
    const t = []; for(const na of this.mav.values()) { t.push(na) }
    t.sort((a,b) => { return a.rnd[0] === 0 ? -1 : (b.rnd[0] === 0 ? 1 : (a.nom < b.nom ? -1 : (a.nom === b.nom ? 0 : 1)))})
    return t
  }

  avatarDeNom (n) { // retourne l'id de l'avatar de nom n (ou 0)
    for(const na of this.mav.values()) { if (na.nom === n) return na.id }
    return 0
  }

  // na d'un des avatars du compte
  naAvatar (id) { return id === this.id ? this.nap : this.mav.get(id) || null}

  estAc (id) { return this.mav.get(id) !== null }

  async compile (row) {
    const session = stores.session
    this.k = await decrypter(session.phrase.pcb, row.kx)
    session.clek = this.k
    session.compteId = this.id

    this.vsh = row.vsh || 0
    this.id = row.id
    this.v = row.v

    const [nomt, rndt] = decode(await decrypter(session.clek, row.nctk))
    this.nct = new NomTribu(nomt, rndt)
    this.idt = this.nct.id
    setNg(this.nct)
    const [nomp, rndp] = decode(await decrypter(rndt, row.napt))
    this.nap = new NomAvatar(nomp, rndp)
    setNg(this.id, this.nap)

    this.hps1 = row.hps1
    this.shay = row.shay
    this.stp = row.stp

    this.notifco = row.notifco ? decode(await decrypter(this.nap.rnd, row.notifco)) : null
    this.notifsp = row.notifsp ? decode(await decrypter(this.nap.rnd, row.notifsp)) : null

    /* `mavk` {id} `[nom, cle]` */
    const m = decode(await decrypter(session.clek, row.mavk))
    this.mav = new Map()
    for(const id in m) {
      const [nom, cle] = m[id]
      const na = new NomAvatar(nom, cle)
      this.mav.set(parseInt(id), na)
      setNg(na) 
      if (na.estAvatarP) this.naprim = na
    }
    
    this.compteurs = new Compteurs(row.compteurs)

    if (row.blocaget) {
      const b = await decrypter(this.clet, row.blocaget)
      this.blocage = new Blocage(b)
    } else this.blocage = null

    this.dhdq = row.dhdq || 0
    this.dhrq = row.dhrq || 0
  }

  async ajoutAvatarMavk (nvna) {
    const m = {}
    for(const na of this.mav.values()) {
      m[na.id] = [na.nom, na.rnd]
    }
    m[nvna.id] = [nvna.nom, nvna.rnd]
    return await crypter(stores.session.clek, new Uint8Array(encode(m)))
  }

  static async row (na, nt, nctkc, q1, q2, estSponsor) { 
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
    r.kx = await crypter(session.phrase.pcb, k)
    session.clek = k
    r.stp = estSponsor ? 1 : 0
    r.hps1 = session.phrase.dpbh
    r.shay = session.phrase.shay

    r.nctk = await crypter(k, new Uint8Array(encode([nt.nom, nt.rnd])))
    r.nctkc = nctkc || r.nctk
    r.napt = await crypter(nt.rnd, new Uint8Array(encode([na.nom, na.rnd])))

    const m = { }
    m[na.id] = [na.nom, na.rnd]
    r.mavk = await crypter(session.clek, new Uint8Array(encode(m)))

    r.dhdq = 0
    r.dhrq = 0
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
    this.id = row.id
    this.ids = row.ids
    this.v = row.v
    this.dlv = row.dlv
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
    obj.na = new NomAvatar(x.na[0], x.na[1])
    obj.naf = new NomAvatar(x.naf[0], x.naf[1], 0)
    obj.nct = new NomTribu(x.nct[0], x.nct[1])
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
    const av = session.avC
    const n = new NomAvatar(nom, 0)
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
- `ids` : identifiant du chat relativement à son avatar,
    Pour A, hash du cryptage de `idA/idB` par le `rnd` de A.
    Pour B, hash du cryptage de `idB/idA` par le `rnd` de B.
- `v`
- `dlv` : la dlv permet au GC de purger les chats. Dès qu'il y a une dlv, le chat est considéré comme inexistant autant en session que pour le serveur.

- `mc` : mots clés attribués par l'avatar au chat
- `cva` : `{v, photo, info}` carte de visite de _l'autre_ au moment de la création / dernière mise à jour du chat, cryptée par la clé de _l'autre_
- `contc` : contenu crypté par la clé de l'avatar _lecteur_.
  - `na` : `[nom, cle]` de _l'autre_.
  - `dh`  : date-heure de dernière mise à jour.
  - `txt` : texte du chat.
  Compilé:
  - dh
  - naE
  - txt
  - cv
*/

export class Chat extends GenDoc {
  get cle () { return getCle(this.id) }
  get naI () { return getNg(this.id) }

  async compile (row) {
    this.id = row.id
    this.ids = row.ids
    this.v = row.v
    if (row.dlv) {
      this._zombi = true
    } else {
      this.vsh = row.vsh || 0
      this.mc = row.mc
      const x = decode(await decrypter(this.cle, row.contc))
      this.naE = new NomAvatar(x.na[0], x.na[1])
      this.dh = x.dh
      this.txt = x.txt
      this.cv = row.cva ? decode(await decrypter(this.naE.rnd, row.cva)) : null
    }
  }

  static async getIds (naI, naE) {{
    return hash(await crypter(naI.rnd, naI.id + '/' + naE.id, 1))
  }}

  static async nouveauRow (naI, naE, dh, txt, mc) {
    const ids = await Chat.getIds(naI, naE)
    const id = naI.id
    const r = { id, ids, v: 0, dlv: 0, iv: GenDoc._iv(naI.id, 0)}
    if (mc) r.mc = mc
    r.contc = await Chat.getContc (naI, naE, dh, txt)
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'chats', id, ids, v: 0, dlv: 0, _data_}
  }

  static async getContc (naI, naE, dh, txt) {
    const x = { na: [naE.nom, naE.rnd], dh: dh, txt: txt }
    return await crypter(naI.rnd, new Uint8Array(encode(x)))
  }
}

/** Groupe ***********************************************************************
_data_:
- `id` : id du groupe.
- `v` : version, du groupe, ses secrets, ses membres. 
- `dlv` : plus haute `dlv` des membres, 
- `dfh` : jour de fin d'hébergement quand le groupe n'est plus hébergé,

- `stx` : 1-ouvert (accepte de nouveaux membres), 2-fermé (ré-ouverture en vote)
- `sty` : 0-en écriture, 1-protégé contre la mise à jour, création, suppression de secrets.
- `ast` : array des statuts des membres (dès qu'ils ont été pressentis) :
  - 10:pressenti, 
  - 20,21,22:invité en tant que lecteur / auteur / animateur, 
  - 30,31,32:actif (invitation acceptée) en tant que lecteur / auteur / animateur, 
  - 40: invitation refusée,
  - 50: suspendu, 
  - 0: disparu / oublié
- `idhg` : id du compte hébergeur crypté par la clé du groupe.
- `imh` : indice `im` du membre dont le compte est hébergeur.
- `v1 v2` : volumes courants des secrets du groupe.
- `q1 q2` : quotas attribués par le compte hébergeur.
- `mcg` : liste des mots clés définis pour le groupe cryptée par la clé du groupe cryptée par la clé du groupe.
- `cvg` : carte de visite du groupe cryptée par la clé du groupe `{v, photo, info}`. 
*/

export class Groupe extends GenDoc {
  get cle () { return getCle(this.id) }
  get na () { return getNg(this.id) }
  get nom () { return this.na.nom }
  get nomc () { return this.na.nomc }
  get photo () { const cv = this.cv; return cv ? cv[0] : '' }
  get info () { const cv = this.cv; return cv ? cv[1] : '' }
  get pc1 () { return Math.round(this.v1 / UNITEV1 / this.q1) }
  get pc2 () { return Math.round(this.v2 / UNITEV2 / this.q2) }

  async compile (row) {
    this.vsh = row.vsh || 0
    this.id = row.id
    this.v = row.v
    this.dfh = row.dfh || 0
    this.dlv = row.dlv
    if (row._zombi) { this._zombi = true; return }

    this.dnv = row.dnv
    this.stx = row.stx
    this.sty = row.sty
    this.ast = row.ast
    this.idh = row.idhg ? parseInt(await decrypterStr(this.cle, row.idhg)) : 0
    this.imh = row.imh || 0
    this.v1 = row.v1
    this.v2 = row.v2
    this.q1 = row.q1
    this.q2 = row.q2
    this.mc = row.mcg ? decode(await decrypter(this.cle, row.mcg)) : {}
    this.cv = row.cvg ? decode(await decrypter(this.cle, row.cvg)) : null
  }

  get mbHeb () { // membre hébergeur
    return  this.dfh ? null : stores.membre.getMembre(this.id, this.imh)
  }

  setDisparus(setIds) { // statuts des membres disparus
    setIds.forEach(ids => { this.ast[ids] = 0 })
  }

  /* En attente *************************************************
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
  */

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
- `dlv` : date de dernière signature lors de la connexion du compte de l'avatar membre du groupe.

- `stx` : 0:pressenti, 1:invité, 2:actif (invitation acceptée), 3: refusé (invitation refusée), 4: résilié, 5: disparu.
- `laa` : 0:lecteur, 1:auteur, 2:animateur.
- `npi` : 0: accepte d'être invité, 1: ne le souhaite pas.
- `vote` : vote de réouverture.
- `mc` : mots clés du membre à propos du groupe.
- `infok` : commentaire du membre à propos du groupe crypté par la clé K du membre.
- `datag` : données, immuables, cryptées par la clé du groupe :
  - `nom` `cle` : nom complet de l'avatar.
  - `ni` : numéro d'invitation du membre. Permet de supprimer l'invitation et d'effacer le groupe dans son avatar (clé de `lgrk`).
	- `idi` : id du membre qui l'a _pressenti_.
- `cvm` : carte de visite du membre `{v, photo, info}` crypté par la clé du membre.
*/

export class Membre extends GenDoc {
  // Du groupe
  get cleg () { return getCle(this.id) }
  get ng () { return getNg(this.id) } // nom complet du groupe
  
  // De l'avatar membre
  get estAc () { return stores.avatar.compte.estAc(this.na.id) }
  get clem () { return this.namb.cle }
  // na : nom complet de l'avatar membre

  async compile (row) {
    this.vsh = row.vsh || 0
    this.id = row.id
    this.ids = row.ids
    this.v = row.v
    this.dlv = row.dlv

    this.stx = row.stx
    this.laa = row.laa
    this.npi = row.npi || 0
    this.vote = row.vote || 0
    this.mc = row.mc
    this.data = decode(await decrypter(this.cleg, row.datag))
    this.namb = new NomAvatar(this.data.nom, this.data.cle)
    if (!this.estAc) setNg(this.namb)
    this.info = row.infok && this.estAc ? await decrypterStr(stores.session.clek, row.infok) : ''
    this.cv = row.cvm ? decode(await decrypter(clem, row.cvm)) : null
  }

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

}

/** Secret ****************************************************
- `id` : id de l'avatar ou du groupe.
- `ids` : identifiant relatif à son avatar.
- `v` : sa version.

- `st` :
  - `99999` pour un _permanent_.
  - `dlv` pour un _temporaire_.
- `imx` : exclusivité dans un groupe. L'écriture et la gestion de la protection d'écriture sont restreintes au membre du groupe dont `im` est `x`. 
- `p` : 0: pas protégé, 1: protégé en écriture.
- `v1` : volume du texte
- `v2` : volume total des fichiers attachés
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
- `refs` : couple `[id, ids]` crypté par la clé du secret référençant un autre secret _référence de voisinage_ qui par principe, lui, n'aura pas de `refs`).

**Map `mfas` des fichiers attachés dans un secret:**
- _clé_ `idf`: identifiant du fichier en base64.
- _valeur_ : { lg, datas }
  - `lg` : taille du fichier, en clair afin que le serveur puisse toujours recalculer la taille totale v2 d'un secret.
  - `datas` : sérialisation cryptée par la clé S du secret de : `{ nom, info, dh, type, gz, lg, sha }`.
*/

export class Secret extends GenDoc {
  get cle () { return getCle(this.id) }
  get deGroupe () { return this.id % 10 === 8 }

  async compile (row) {
    this.vsh = row.vsh || 0
    this.id = row.id
    this.ids = row.ids
    this.v = row.v

    this._zombi = row._zombi
    if (this._zombi) return
    this.st = row.st
    this.imx = row.imx
    this.v1 = row.v1
    this.v2 = row.v2
    this.mc = this.deGroupe ? (row.mc ? decode(row.mc) : {}) : (row.mc || new Uint8Array([]))
    this.txt = decode(await decrypter(cle, row.txts))
    this.txt.t = ungzip(this.txt.t)
    this.ref = row.refs ? decode(await decrypter(this.cle, row.refs)) : null

    this.mfa = {}
    this.nbfa = 0
    if (this.v2) {
      const map = row.mfas ? decode(row.mfas) : {}
      for (const idf in map) {
        const x = map[idf]
        const y = { lg: x.lg }
        this.mfa[idf] = y
        y.data = decode(await decrypter(cle, x.datas))
        this.nbfa++
      }
    }
  }

  get avatar () { return this.deGroupe ? null : stores.avatar.getAvatar(this.id) }
  get groupe () { return !this.deGroupe ? null : stores.groupe.getGroupe(this.id) }

  // TODO : gestion des voisins d'un secret

  /* `dlv` : date limite de validité, en nombre de jours depuis le 1/1/2020. */

  get pkref () { return !this.ref ? '' : (idToSid(this.ref[0]) + '/' + this.ref[1]) }
  // get horsLimite () { return this.st < 0 || this.st >= 99999 ? false : dlvDepassee(this.st) }
  get nbj () { return this.st <= 0 || this.st === 99999999 ? 0 : AMJ.diff(this.st, AMJ.amjUtc()) }
  get dh () { return dhcool(this.txt.d * 1000) }

  get idCompta () { return this.deGroupe ? this.groupe.idh : GenDoc.idCompta(this.id) }
  get idGroupe () { return this.deGroupe ? this.id : 0 }

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
  tribus: Tribu,
  comptas: Compta,
  avatars: Avatar,
  groupes: Groupe,
  secrets: Secret,
  sponsorings: Sponsoring,
  chats: Chat,
  membres: Membre,
  cvs: Cv
}
