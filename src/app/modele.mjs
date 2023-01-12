import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'

import { forSchema, serialize, deserialize, clone, serial, deserial } from './schemas.mjs'
import { $t, hash, rnd6, intToB64, b64ToInt, u8ToB64, idToSid, dlvDepassee, titre, normpath, gzip, ungzip, ungzipT, egaliteU8, tru8 } from './util.mjs'
import { random, pbkfd, sha256, decrypterRSA, crypterRSA, crypter, decrypter, decrypterStr } from './webcrypto.mjs'

import { IDCOMPTABLE, DateJour, Compteurs, UNITEV1, UNITEV2, chiffres, decodeIn } from './api.mjs'

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
    const x = this.getSecret(obj.id, obj.ids)
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
 * Tous les objets Documents
****************************************************/
class GenDoc {
  static deGroupe (id) { return id && id % 10 === 8 }
  static idCompta (id) { return Math.floor(id / 10) * 10 }
  get pk () { return this.id + (this.ids ? '/' + this.ids : '')}
  async compile (row) { }
}

const classes = {
  tribus: Tribu,
  comptas: Compta,
  avatars: Avatar,
  groupes: Groupe,
  secrets: Secret,
  rdvs: Rdv,
  chats: Chat,
  membres: Membre,
  cvs: Cv
}

// Retourne un objet depuis un 'row'
export async function compile (row) {
  if (!row) return null
  const cl = classes[row._nom]
  if (!cl) return null
  const obj = new cl()
  obj._nom = row._nom
  obj.id = row.id
  if (row.ids) obj.ids = row.ids
  obj.v = row.v
  if (row._data_) {
     await obj.compile(decode(row._data_))
  } else obj._zombi = true
  return obj
}

/** Tribu *********************************
- `id` : numéro de la tribu
- `v` : sa version
- `dh` : date-heure dernière modification.
- `dhb` : =dh quand la tribu est bloquée

- `nbc` : nombre de comptes actifs dans la tribu.
- `a1 a2` : sommes des volumes V1 et V2 déjà attribués comme forfaits aux comptes de la tribu.
- `r1 r2` : volumes V1 et V2 en réserve pour attribution aux comptes actuels et futurs de la tribu.
- `infok` : commentaire privé du comptable crypté par la clé K du comptable :
- `mncpt` : map des noms complets des parrains:
  - _clé_ : `id` du sponsor.
  - _valeur_ :
    - `na` : `[nom, rnd]` crypté par la clé de la tribu. ("na" est un NomTribu une fois compilé))
    - `cv` : `[photo, info]` carte de visite cryptée par la clé du sponsor
  - l'ajout d'un parrain ne se fait que par le comptable mais un retrait peut s'effectuer aussi par un traitement de GC.
- `blocaget` : cryptée par la clé de la tribu : ("blocage" quand compilé)
  - `stn` : raison majeure du blocage : 0 à 9 repris dans la configuration de l'organisation.
  - `c`: 1 si positionné par le comptable (dans une tribu toujours 1)
  - `txt` : libellé explicatif du blocage.
  - `jib` : jour initial de la procédure de blocage
  - `lj` : `[j12 j23 j34]` : nb de jours de passage des niveaux de 1 à 2, 2 à 3, 3 à 4.
  - `dh` : date-heure de dernier changement du statut de blocage.
*/

export class Tribu extends GenDoc {
  get nom () { return this.na.nom }
  get clet () { return this.na.rnd }
  get stn () { return this.blocage ? this.blocage.stn : 0 }
  get ist () { return !this.nbc ? 4 : this.stn } // "index" du statut de blocage

  async compile (row) {
    const session = stores.session
    this.vsh = row.vsh || 0
    this.id = row.id
    this.dh = row.dh
    this.v = row.v

    this.nbc = row.nbc
    this.a1 = row.a1
    this.a2 = row.a2
    this.r1 = row.r1
    this.r2 = row.r2
    this.info = session.estComptable ? await decrypterStr(session.clek, row.infok) : ''

    this.mncpt = row.mncpt ? decode(row.mncpt) : {}
    for (const id in this.mncpt) {
      const e = this.mncpt[id]
      const [nom, cle] = decode(await decrypter(this.clet, e.na))
      e.na = new NomAvatar(nom, cle)
      setNg(na)
      e.cv = e.cv ? decode(await decrypter(cle, e.cv)) : null
    }
    this.blocage = !row.blocaget ? null : decode(await decrypter(this.clet, row.blocaget))
    if (this.blocage) {
      const [niv, ljc] = compilNiv(this.blocage.jib, this.blocage.lj)
      this.blocage.stn = niv
      this.blocage.ljc = ljc
      this.dhb = this.dh
    }
  }

  get naSponsors () { // array des na des sponsors
    const r = []
    for (const id in this.mncp) r.push(this.mncpt[id].na)
    return r
  }

  get idSponsors () { // array des id des sponsors
    const r = []
    for (const id in this.mncp) r.push(this.mncpt[id].na.id)
    return r
  }

  // retourne la CV du sponsor d'id donné
  cvSponsor (id) {
    const x = this.mncpt[id]
    return x ? x.cv : null
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

  /*
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
  */
}

/** Avatar *********************************************************
**Données n'existant que pour un avatar principal**
- `kx` : clé K du compte, cryptée par la X (phrase secrète courante).
- `stp` : statut parrain (0: non, 1:oui).
- `nctk` : nom complet `[nom, rnd]` de la tribu crypté,
  - soit par la clé K du compte,
  - soit par la clé publique de son avatar primaire après changement de tribu par le comptable.
- `lavk` [] `[nom, cle, cpriv]` : array des avatars du compte cryptée par la clé K, position d'un avatar dans la liste donnée par le dernier chiffre de son id. `[nom, cle, cpriv]`
  - `nom cle` : nom complet de l'avatar.
  - `cpriv` : clé privée asymétrique.
- `mck` {} : map des mots-clés du compte cryptée par la clé K. clé: code (1-255), valeur: 'categ/label'
- `memok` : mémo personnel du compte.

**Données disponibles pour les avatars primaires et secondaires**
- `id`, 
- `v`,
- `vcv` : version de la carte de visite afin qu'une session puisse détecter (sans lire le document) si la carte de visite qu'elle détient est la plus récente ou non.
- `dlv` : date limite de validité.

- `rsapub` : clé publique RSA de l'avatar.
- `cvk` : carte de visite cryptée par la clé K `{v, photo, info}`.
- `lgrk` : map :
  - _clé_ : `ni`, numéro d'invitation obtenue sur une invitation.
  - _valeur_ : cryptée par la clé K du compte de `[nom, rnd, im]` reçu sur une invitation.
  - une entrée est effacée par la résiliation du membre au groupe ou sur refus de l'invitation (ce qui l'empêche de continuer à utiliser la clé du groupe).
- `invits` : map des invitations en cours
  - _clé_ : `ni`, numéro d'invitation.
  - _valeur_ : cryptée par la clé publique de l'avatar `[nom, cle, im]`.
  - une entrée est effacée par l'annulation de l'invitation du membre au groupe ou sur acceptation ou refus de l'invitation.
- `pck` : phrase de contact cryptée par la clé K.
- `hpc` : hash du PBKFD de la phrase de contact.
- `dlpc` : date limite de validité de la phrase de contact.
- `napc` : [nom, cle] de l'avatar cryptée par le PBKFD de la phrase de contact.

** Compilées**
- nct: nom complet de la tribu
**Remarques:**
- une mise à jour de la carte de visite est redondée dans tous les groupes dont l'avatar est membre (cryptée par la clé du groupe).
*/

export class Avatar extends GenDoc {
  get idxAv () { return this.id % 10 }
  get estParrain () { return this.stp === 1 } // retourne true si le compte est parrain
  get estComptable () { return this.id === IDCOMPTABLE } // retourne true si le compte est celui du comptable
  get primaire () { return this.idxAv === 0 } // retourne l'objet avatar primaire du compte
  get naprim () { return this.lav[0].na } // na de l'avatar primaire du compte
  get apropos () { return this.nct ? ($t('tribus', 0) + ':' + this.nct.nom) : $t('comptable') }

  cpriv (id) { return this.primaire ? this.lav[id % 10].cpriv : null }

  // INTERNE : Enregistrement des na des avatars du compte. Effectué à la construction de l'objet
  repAvatars () { if (this.primaire) this.lav.forEach(x => { setNg(x.na) }) }

  avatarIds (s) { // retourne (ou accumule dans s), le set des ids des avatars du compte
    const s1 = new Set()
    if (this.primaire) for(let i = 0; i < this.lav; i++) {
      const x = this.lav[i]
      if (!x) continue
      if (s) s.add(x.na.id); else s1.add(x.na.id)
    }
    return s || s1
  }

  avatarNas (s) { // retourne (ou accumule dans s), le set des ids des avatars du compte
    const s1 = new Set()
    if (this.primaire) for(let i = 0; i < this.lav; i++) {
      const x = this.lav[i]
      if (!x) continue
      if (s) s.add(x.na); else s1.add(x.na)
    }
    return s || s1
  }

  avatarDeNom (n) { // retourne l'id de l'avatar de nom n (ou 0)
    if (!this.primaire) return 0
    for(let i = 0; i < this.lav; i++) {
      const x = this.lav[i]
      if (!x) continue
      if (x.na.nom === n) return x.na.id
    }
    return 0
  }

  nomAvatars () { // retourne la liste des noms des avatars du compte
    const l = []
    if (this.primaire) for(let i = 0; i < this.lav; i++) {
      const x = this.lav[i]
      if (!x) continue
      l.push(x.na.nom)
    }
    return l
  }

  estAc (id) { return this.avatarIds.has(id) }

  /* Remplit la map avec les membres des groupes de l'avatar/
  - clé: id du groupe
  - valeur: { idg: , mbs: [ids] }
  */
  membres (map) {
    for (const ni in this.lgr) {
      const [nom, rnd, im] = this.lgr[ni]
      const idg = new NomGroupe(nom, rnd).id
      const e = map[idg]
      if (!e) { map[igd] = { idg, mbs: [im] } } else e.mbs.push(im)
    }
  }

  /* `napc` : [nom, cle] de l'avatar cryptée par le PBKFD de la phrase de contact.
  texte : texte de la phrase de contact
  Retourne le na de l'avatar décrypté depuis la phrase
  */
  async getNapc (texte) { 
    const phrase = await new PhraseContact().init(texte)
    const [nom, cle] = decode(decrypter(phrase.clex, this.napc))
    return new NomAvatar(nom, cle)
  }

  // na d'un des avatar du compte
  naAvatar (id) {
    const i = id % 10
    return this.lav[i].na
  }

  /** compile *********************************************************/
  async compile (row) {
    const session = stores.session
    this.vsh = row.vsh || 0
    this.vcv = row.vcv || 0
    this.rsapub = row.rsapub
    this.stp = row.stp || 0
    this.dlv = row.dlv || 0
    this.hpc = row.hpc
    this.dlpc = row.dlpc
    this.napc = row.napc

    if (this.primaire) { // Avatar principal
      this.k = await decrypter(session.phrase.pcb, row.kx)
      session.clek = this.k

      /* `lavk` [] `[nom, cle, cpriv]` */
      this.lav = []
      for(let i = 0; i < 7; i++) {
        const x = this.lavk[i]
        if (!x) this.lav[i] = null
        const [nom, cle, cpriv] = decode(await decrypter(session.clek, x))
        this.lav[i] = { na: new NomAvatar(nom, cle), cpriv }
      }

      if (row.nctk) {
        /* `nctk` : nom complet `[nom, rnd]` de la tribu crypté,
          - soit par la clé K du compte,
          - soit par la clé publique de son avatar primaire */
        let nr
        if (row.nctk.length === 256) {
          const kp = this.cpriv(this.id)
          tru8('Priv compte.fromRow nctk ' + this.id, kp)
          nr = await decrypterRSA(kp, row.nctk)
          this.nctkCleK = await crypter(session.clek, nr)
        } else {
          nr = await decrypter(session.clek, row.nctk)
          this.nctkCleK = null
        }
        const [nom, cle] = decode(nr)
        this.nct = new NomTribu(nom, cle)
      } else { // Ne devrait JAMAIS se produire, même le comptable a une tribu
        this.nct = null
        this.nctk = null
      }

      if (row.mck) {
        this.mc = decode(await decrypter(session.clek, row.mck))
      } else this.mc = {}

      if (row.memok) {
        this.memo = await decrypterStr(session.clek, row.memok)
      } else this.memo = ''

      setNg(this.nct)
      this.repAvatars()
    }

    if (row.pck) { // phrase de contact cryptée par la clé K.
      this.pc = await decrypterStr(session.clek, row.cvk)
    } else this.pc = null

    if (row.cva) { // carte de visite cryptée par la clé K, `{v, photo, info}`.
      this.cv = decode(await decrypter(getCle(this.id), row.cva))
    } else this.cv = null

    this.lgr = {}
    if (row.lgrk) { 
      /* map : - _clé_ : `ni`, numéro d'invitation obtenue sur une invitation.
        - _valeur_ : cryptée par la clé K du compte de `[nom, rnd, im]` reçu sur une invitation. */
      for (const ni in row.lgrk) {
        this.lgr[ni] = decode(await decrypter(session.clek, row.lgrk[ni]))
      }
    }

    this.invits = {}
    if (row.invits) {
      /* map des invitations en cours - clé : `ni`, numéro d'invitation.
        - _valeur_ : cryptée par la clé publique de l'avatar `[nom, cle, im]`.*/
      const kp = this.cpriv(this.id)
      tru8('Priv compte.fromRow nctk ' + this.id, kp)
      for (const ni in row.invits) {
        this.invits[ni] = decode(await decrypterRSA(kp, row.invits[ni]))
      }
    }

    return this
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

  /* En attente *******************************************
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
  */
}

/* Cv : n'a qu'un seul champ - id: de l'avatar
cv : { v, photo, info } - crypté par la clé de l'avatar
*/
export class Cv extends GenDoc {
  async compile (row) {
    this.cv = deserial(await decrypter(getCle(this.id), row.cva))
  }
}

/** Compta **********************************************************************
- `id` : numéro du compte
- `idt` : id de la tribu
- `v` : version
- `hps1` : hash du PBKFD de la ligne 1 de la phrase secrète du compte.
- `shay` : SHA du SHA de X (PBKFD de la phrase secrète).
- `nat`: `[nom, clé]` de l'avatar principal du compte crypté par la clé de la tribu. (compilé en "na")
- `trcp` : `[nom, clé]` de la tribu crypté par la clé publique du comptable.
- `compteurs`: compteurs sérialisés (non cryptés).
- `blocaget` : blocage du compte (cf `blocaget` de tribu).
- `lavv` : array des dernières versions de chaque avatar du compte, indexée par l'index de l'avatar dans son compte (le dernier chiffre de son id).
*/

export class Compta extends GenDoc {
  get stn () { return this.blocage ? this.blocage.stn : 0 }
  get clet () { return repertoire.cle(this.idt) }

  async compile (row) {
    this.vsh = row.vsh || 0
    this.id = row.id
    this.idt = row.idt
    this.v = row.v

    this.hps1 = row.hps1
    this.shay = row.shay
    const [nom, cle] = decode(await decrypter(this.clet, row.nat))
    this.na = new NomAvatar(nom, cle)
    setNg(na)

    this.trcp = row.trcp
    this.compteurs = new Compteurs(row.compteurs).calculauj()
    this.blocage = !row.blocaget ? null : decode(await decrypter(this.clet, row.blocaget))
    if (this.blocage) {
      const [niv, ljc] = compilNiv(this.blocage.jib, this.blocage.lj)
      this.blocage.stn = niv
      this.blocage.ljc = ljc
      this.idtb = this.idt
    }
    this.lavv = row.lavv
  }

  // Pour le comptable seulement 
  async nomTribu () {
    const cpriv = stores.avatar.compte.cpriv(IDCOMPTABLE)
    const [nom, cle] = decode(await decrypterRSA(cpriv, this.trcp))
    return new NomTribu(nom, cle)
  }

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

}

/** Sponsoring ************************************************************
- `id` : id de l'avatar.
- `ids` : hash de la phrase de parrainage, 
- `v`
- `dlv` : date limite de validité

- `descrx` : crypté par X, le PBKFD de la phrase de sponsoring
  - `na` : `[nom, cle]` de P / A.
  - `cv` : `[photo, info]` de P / A.
  - `naf` : `[nom, cle]` attribué au filleul.
  - `nct` : `[nom, cle]` de sa tribu.
  - `sp` : vrai si le filleul est lui-même sponsor (créé par le Comptable, le seul qui peut le faire).
  - `quotas` : `[v1, v2]` quotas attribués par le parrain.
*/

export class Sponsoring extends GenDoc {

  async fromRow (row) {
    this.id = row.id
    this.ids = row.ids
    this.v = row.v
    this.dlv = row.dlv
    this.vsh = row.vsh || 0
    this.descrx = row.descrx
  }

  async decrypterDescr (clex) {
    const x = decode(await decrypter(clex, this.descrx))
    this.descr = { cv: x.cv, sp: x.sp, quotas: x.quotas }
    this.descr.na = new NomAvatar(x.na[0], x.na[1])
    this.descr.naf = new NomAvatar(x.naf[0], x.naf[1])
    this.descr.nct = new NomTribu(x.nct[0], x.nct[1])
  }

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
}

/** Chat ************************************************************
- `id`
- `ids` : identifiant du chat relativement à son avatar.
- `v`
- `dlv` : pour effacement automatique des chats trop vieux. Chaque exemplaire a sa dlv que l'avatar peut modifier.

- `mc` : mots clés attribués par l'avatar au chat
- `contc` : contenu crypté par la clé de l'avatar (celle de sa carte de visite).
  - `na` : `[nom, cle]` de _l'autre_.
  - `dh`  : date-heure de l'item.
  - `txt` : texte du chat.
*/

export class Chat extends GenDoc {

  async fromRow (row) {
    this.id = row.id
    this.ids = row.ids
    this.v = row.v
    this.dlv = row.dlv
    this.vsh = row.vsh || 0
    this.mc = row.mc
    this.naI = stores.avatar.compte.naAvatar(this.id)
    const x = decode(await decrypter(this.naI.cle, row.contc))
    this.naE = new NomAvatar[x.na[0], x.na[1]]
    this.dh = x.dh
    this.txt = x.txt
  }

  static getIds (naI, naE) {{
    const id0 = naI.id
    const id1 = naE.id
    const k = id0 < id1 ? id0 + '/' + id1 : id1 + '/' + id0
    return hash(k)
  }}

  async nouveau () { 
    return this
  }
}

/** Groupe ***********************************************************************
- `id` : id du groupe.
- `v`, 
- `dlv` : plus haute `dlv` des membres, 
- `dfh` : jour de fin d'hébergement quand le groupe n'est plus hébergé,

- `dnv` : dernier numéro de version utilisé sur le groupe.
- `stx` : 1-ouvert (accepte de nouveaux membres), 2-fermé (ré-ouverture en vote)
- `sty` : 0-en écriture, 1-protégé contre la mise à jour, création, suppression de secrets.
- `mxim` : dernier `im` de membre attribué.
- `idhg` : id du compte hébergeur crypté par la clé du groupe.
- `imh` : indice `im` du membre dont le compte est hébergeur.
- `v1 v2` : volumes courants des secrets du groupe.
- `q1 q2` : quotas attribués par le compte hébergeur.
- `mcg` : liste des mots clés définis pour le groupe cryptée par la clé du groupe cryptée par la clé du groupe.
- `cvg` : carte de visite du groupe crypté par la clé du groupe `{v, photo, info}`. 
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
    this.mxim = row.mxim
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
    return await crypter(this.cle, serial([cv.ph, cv.info]))
  }

  async toMcg (mc) {
    return Object.keys(mc).length ? await crypter(this.cle, serial(mc)) : null
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
      const map = row.mfas ? deserial(row.mfas) : {}
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
  get pkref () { return !this.ref ? '' : (idToSid(this.ref[0]) + '/' + this.ref[1]) }
  get horsLimite () { return this.st < 0 || this.st >= 99999 ? false : dlvDepassee(this.st) }
  get nbj () { return this.st <= 0 || this.st === 99999 ? 0 : (this.st - getJourJ()) }
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
    if (stores.session.synchro) await saveSessionSync(serialize('idbSessionSync', this))
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
    return encode(x)
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
