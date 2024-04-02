import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import mime2ext from 'mime2ext'
import { $t, hash, rnd6, inverse, u8ToB64, gzipB, ungzipB, gzipT, ungzipT, titre, suffixe, dhstring } from './util.mjs'
import { pbkfd, sha256, crypter, decrypter, decrypterStr, decrypterRSA } from './webcrypto.mjs'
import { ID, Cles, isAppExc, d14, Compteurs, AMJ, nomFichier, compileMcpt, synthesesPartition, FLAGS } from './api.mjs'
import { DownloadFichier } from './operations.mjs'

import { idb } from './db.mjs'

// FAKE
export const Versions = 0
export function getCle() {}
export const NomGenerique = 0
export class Tribu {}
export function setClet() {}
export function getNg() {}
export class Motscles {}

// const decoder = new TextDecoder('utf-8')
const encoder = new TextEncoder('utf-8')

/* classe RegCles : registre des clés connues dans la session **********
- `reset ()` : réinitialisation en début de session
- `get (id)` : retourne la clé enregistrée avec cette id
- `set (cle)` : enregistré la clé sous son id
*/
export class RegCles {
  static ns = 0
  static registre = new Map()

  static reset () { RegCles.registre.clear }

  static get (id) { return RegCles.registre.get(ID.long(id, RegCles.ns)) }

  static set (cle) {
    const id = Cles.id(cle, RegCles.ns)
    RegCles.registre.set(id, cle)
    return cle
  }
}

/* classe RegCc : registre des clés des chats ******************************
*/
export class RegCc {
  static registre = new Map() // clé: ids d'un chat - valeur: clé C du chat
  static regpriv = new Map() // clé: id d'un avatar du compte - valeur: clé privée

  static async setPriv (id, privK) {
    if (!RegCc.regpriv.has(id)) {
      const priv = await decrypter(stores.session.clek, privK)
      RegCc.regpriv.set(id, priv)
    }
  }

  static getPriv (id) { return RegCc.regpriv.get(id)}

  static async get (chat) {
    const session = stores.session
    let cc = RegCc.registre.get(chat.ids)
    if (cc) return cc
    if (chat.cleCKP.length !== 256) {
      cc = await decrypter(session.clek, chat.cleCKP)
      RegCc.registre.set(chat.ids, cc)
      return cc
    }
    cc = await decrypterRSA(RegCc.getPriv(chat.id), chat.cleCKP)
    RegCc.registre.set(chat.ids, cc)
    return cc
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

  get estDelegue () { return this.sp || false }

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

/* class CV : Carte de Visite ****************************************
Création: 
- await CV.set(cv, (cle)) => objet CV (photo et texte en clair)
    cv : { id, v, ph, tx} (photo et texte cryptés)
- new CV(id, v, ph, tx) (ph et tx en clair)
- CV.fake(id) (sans photo ni texte)
*/
export class CV {
  /* cv "cryptée" (ou sans tx / ph) OU instance de CV (toujours en clair) 
  cle: (fac) si l'id n'est pas enregistrée (sponsoring)
  */
  static async set (cv, cle) { 
    if (cv instanceof CV) return cv
    const c = new CV()
    if (cv) {
      c.id = ID.court(cv.id)
      c.v = cv.v || 0
      const k = cle || RegCles.get(cv.id)
      if (k) {
        if (cv.ph) c.ph = await decrypterStr(k, cv.ph)
        if (cv.tx) c.tx = await decrypterStr(k, cv.tx)
      }
    } else { 
      c.id = 0 
    }
    return c
  }

  static fake (id) { return new CV(ID.court(id))}

  constructor (id, v, ph, tx) {
    this.id = ID.court(id)
    this.v = v || 0
    this.ph = ph || null
    this.tx = tx || ''
  }

  store () { stores.people.setCV(this); return this }

  get photo () {
    if (this.ph) return this.ph
    const cfg = stores.config
    if (this.id === 0) return cfg.iconSuperman
    if (ID.estGroupe(this.id)) return cfg.iconGroupe
    if (ID.estComptable(this.id)) return cfg.iconComptable
    return cfg.iconAvatar
  }

  get texte () {
    if (this.tx) return this.tx
    const cfg = stores.config
    if (this.id === 0) return cfg.nomDeAdmin
    if (ID.estComptable(this.id)) return cfg.nomDuComptable
    return '#' + ID.long(this.id, RegCles.ns)
  }

  get nom () {
    if (!this.tx) return this.texte
    let i = this.tx.indexOf('\n')
    let l = i === -1 ? this.tx : this.tx.substring(0, i)
    l = (l.replaceAll('#', '')).trim()
    return l.length < 16 ? l : l.substring(0, 16)
  }

  get nomC () {
    if (!this.tx) return this.texte
    const s = '' + this.id
    return this.nom + '#' + s.substring(s.length - 4)
  }

  /* Retourne un objet {id,v,ph,tx} ph/tx cryptés (pas une CV)*/
  async crypter(cle) {
    return {
      id: ID.court(this.id),
      v: this.v || 0,
      ph: this.ph ? await crypter(cle, this.ph) : null,
      tx: this.tx ? await crypter(cle, this.tx) : '',
    }
  }
}

/* Notification *********************************************************
Type des notifications:
- E : de l'espace
- P : d'une partition (comptes O)
- C : d'un compte (comptes O)
- Q : de dépassement de quotas
- X : d'excès de consommation (dépassement du solde pour un compte "A"). 

Une notification a les propriétés suivantes:
- `nr`: restriction d'accès: 
  - 1 : **aucune restriction**. La notification est informative mais peut annoncer une restriction imminente.
  - 2 : **restriction réduite**
    - E : espace figé
    - P : accès en lecture seule
    - C : accès en lecture seule
    - Q : actions accroissant le volume interdites
  - 3 : **restriction forte**
    - E : espace clos
    - P : accès minimal
    - C : accès minimal
    - X : accès minimal
- `dh` : date-heure de création.
- `texte`: il est crypté par: 
  - type E: la clé A du Comptable (que tous les comptes de l'espace ont).
  - types P et C par la clé P de la partition.
  - types Q et X: pas de texte, juste un code.
- `idDel`: id du délégué ayant créé cette notification pour un type P ou C quand ce n'est pas le Comptable. !!!Discutable!!!

**Remarque:** une notification `{ dh: ... }` correspond à la suppression de la notification antérieure (ni restriction, ni texte).
*/
export class Notification {
  // Factory construisant une objet Notification depuis sa forme cryptée
  static async decrypt (ntf, cle) {
    const n = { nr: ntf.nr || 0, dh: ntf.dh || 0 }
    n.texte = ntf.texte ? await decrypterStr(cle, nrf.texte) : ''
    if (ntf.idDel) n.idEl = ntf.idDel
    return new Notification(n)
  }

  async crypt(cle) {
    const n = { nr: this.nr, dh: this.dh }
    if (this.idDel) n.idDel = ID.court(this.idDel)
    n.texte = this.texte ? await crypter(cle, this.texte) : ''
    return n
  }

  constructor ({nr, dh, texte, idDel}) {
    if (idDel) this.idDel = ID.long(idSource, RegCles.ns)
    this.nr = nr || 0
    this.texte = texte || ''
    this.dh = dh || Date.now()  
  }

  clone () {
    return new Notification(this)
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
  obj.vsh = row.vsh || 0
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
- `v` : 1..N
- `org` : code de l'organisation propriétaire.

- `creation` : date de création.
- `moisStat` : dernier mois de calcul de la statistique des comptas.
- `moisStatT` : dernier mois de calcul de la statistique des tickets.
- `nprof` : numéro de profil d'abonnement.
- `dlvat` : `dlv` de l'administrateur technique.
- `notifE` : notification pour l'espace de l'administrateur technique. Le texte n'est pas crypté.
- `notifP` : pour un délégué, la notification de sa partition.
- `opt`: option des comptes autonomes.
- `nbmi`: nombre de mois d'inactivité acceptable pour un compte O fixé par le comptable. Ce changement n'a pas d'effet rétroactif.
- `tnotifP` : table des notifications de niveau _partition_.
  - _index_ : id (numéro) de la partition.
  - _valeur_ : notification (ou `null`), texte crypté par la clé P de la partition.
*/
export class Espace extends GenDoc {

  async compile (row) {
    this.org = row.org
    this.creation = row.creation
    this.moisStat = row.moisStat || 0
    this.moisStatT = row.moisStatT || 0
    this.opt = row.opt || 0
    this.nprof = row.nprof || 0
    this.dlvat = row.dlvat || 0
    this.nbmi = row.nbmi || 6
    this.notifE = row.notifE ? new Notification(row.notifE) : null
    this.notifP = row.notifP ? new Notification(row.notifP) : null
    this.tnotifP = row.tnotifP || []
  }

}

/** Synthese *********************************************
_data_:
- `id` : ns de son espace.
- `v` : date-heure de dernière mise à jour (à titre informatif).

- `tsp` : table des _synthèses_ des partitions.
  - _index_: numéro de la partition.
  - _valeur_ : `synth`, objet des compteurs de synthèse calculés de la partition.
    - `id nbc nbd`
    - `ntfp[1,2,3]`
    - `q` : `{ qc, qn, qv }`
    - `qt` : { qc qn qv c2m n v }`
    - `ntf[1,2,3]`
    - `pcac pcan pcav pcc pcn pcv`

L'agrégation des `synth[i]` est calculée en session et stockée en `tsp[0]`.
*/
export class Synthese extends GenDoc {
  static l1 = ['qc', 'qn', 'qv']
  static l2 = ['qc', 'qn', 'qv', 'c2m', 'n', 'v']

  get ns () { return ID.ns(this.id) }

  async compile (row) {
    this.tsp = [null]

    const a = { // colonne 0 de totalisation
      id: 0, 
      nbc: 0, 
      nbd: 0,
      ntfp: [0, 0, 0],
      ntf: [0, 0, 0],
      q: { qc: 0, qn: 0, qv: 0 },
      qt: { qc: 0, qn: 0, qv: 0, c2m: 0, n: 0, v: 0 }
    }

    for (let i = 1; i < row.tsp.length; i++) {
      const r = row.tsp[i] || null
      if (r) {
        r.id = ID.long(i, this.ns)
        r.pcac = !r.q.qc ? 0 : Math.round(r.qt.qc * 100 / r.q.qc) 
        r.pcan = !r.q.qn ? 0 : Math.round(r.qt.qn * 100 / r.q.qn) 
        r.pcav = !r.q.qv ? 0 : Math.round(r.qt.qv * 100 / r.q.qv) 
        r.pcc = !r.q.qc ? 0 : Math.round(r.qt.c2m * 100 / r.q.qc) 
        r.pcn = !r.q.qn ? 0 : Math.round(r.qt.n * 100 / r.q.qn) 
        r.pcv = !r.q.qv ? 0 : Math.round(r.qt.v * 100 / r.q.qv) 
      
        a.nbc += r.nbc
        a.nbd += r.nbd
        a.ntfp[0] += r.ntfp[0]; a.ntfp[1] += r.ntfp[1]; a.ntfp[2] += r.ntfp[2]
        a.ntf[0] += r.ntf[0]; a.ntf[1] += r.ntf[1]; a.ntf[2] += r.ntf[2]
        Synthese.l1.forEach(f => { a.q[f] += r.q[f] })
        Synthese.l2.forEach(f => { a.qt[f] += r.qt[f] })
        this.tsp.push(r)
      } 
    }
    a.pcac = !a.q.qc ? 0 : Math.round(a.qt.qc * 100 / a.q.qc) 
    a.pcan = !a.q.qn ? 0 : Math.round(a.qt.qn * 100 / a.q.qn) 
    a.pcav = !a.q.qv ? 0 : Math.round(a.qt.qv * 100 / a.q.qv) 
    a.pcc = !a.q.qc ? 0 : Math.round(a.qt.c2m * 100 / a.q.qc) 
    a.pcn = !a.q.qn ? 0 : Math.round(a.qt.n * 100 / a.q.qn) 
    a.pcv = !a.q.qv ? 0 : Math.round(a.qt.v * 100 / a.q.qv) 
    this.tsp[0] = a
  }

}

/** Partition *********************************
_data_:
- `id` : numéro de partition attribué par le Comptable à sa création.
- `v` : 1..N

- `nrp`: niveau de restriction de la notification (éventuelle) de niveau _partition_ mémorisée dans `espaces` et dont le texte est crypté par la clé P de la partition.
- `q`: `{ qc, qn, qv }` quotas globaux attribués à la partition par le Comptable.
- `mcpt` : map des comptes attachés à la partition. 
  - _clé_: id du compte.
  - _valeur_: `{ nr, cleA, del, q }`
    - `nr`: niveau de restriction de la notification de niveau _compte_ (0 s'il n'y en a pas, 1 (sans restriction), 2 ou 3).
    - `cleAP` : clé A du compte crypté par la clé P de la partition.
    - `del`: `true` si c'est un délégué.
    - `q` : `qc qn qv c2m nn nc ng v` extraits du document `comptas` du compte.
      - `c2m` est le compteur `conso2M` de compteurs, montant moyen _mensualisé_ de consommation de calcul observé sur M/M-1 (observé à `dhic`). 

Compilé:
- this.sdel: Set des ids des délégués

- mcpt compilé - Ajout à q :
  - pcc : pourcentage d'utilisation de la consommation journalière c2m / qc
  - pcn : pourcentage d'utilisation effective de qn : nn + nc ng / qn
  - pcv : pourcentage d'utilisation effective de qc : v / qv

this.synth est calculé:
- `qt` : les totaux des compteurs `q` :
  (`qc qn qv c2m n (nn+nc+ng) v`) de tous les comptes,
- `ntf`: [1, 2, 3] - le nombre de comptes ayant des notifications de niveau de restriction 1 / 2 / 3. 
- `nbc nbd` : le nombre total de comptes et le nombre de délégués.
- _recopiés de la racine dans `synth`_ : `id nrp q`
- plus, calculés localement :
  - pcac : pourcentage d'affectation des quotas : qt.qc / q.qc
  - pcan : pourcentage d'affectation des quotas : qt.qn / q.qn
  - pcav : pourcentage d'affectation des quotas : qt.qv / q.qv
  - pcc : pourcentage d'utilisation de la consommation journalière qt.c2m / q.qc
  - pcn : pourcentage d'utilisation effective de qn : qt.n / q.qn
  - pcv : pourcentage d'utilisation effective de qc : qt.v / q.qv
*/
export class Partition extends GenDoc {
  get ns() { return ID.ns(this.id) }

  async compile (row) {
    this.vsh = row.vsh || 0
    const cleP = RegCles.get(this.id)
    this.nrp = row.nrp || 0
    this.q = row.q
    const ns = ID.ns(this.id)
    this.mcpt = {}
    this.sdel = new Set() // Set des délégués
    
    if (row.mcpt) for(const idx in row.mcpt) {
      const id = ID.long(parseInt(idx), ns)
      const e = row.mcpt[idx]
      if (e.del) { this.sdel.add(id); e.del = true }
      RegCles.set(await decrypter(cleP, e.cleAP))
      const q = { ...e.q }
      q.pcc = !q.qc ? 0 : Math.round(q.c2m * 100 / q.qc) 
      q.pcn = !q.qn ? 0 : Math.round((q.nn + q.nc + q.ng) * 100 / q.qn) 
      q.pcv = !q.qv ? 0 : Math.round(q.v * 100 / q.qv) 
      this.mcpt[id] = { nr: e.nr || 0, q: e.q }
    }
    this.synth = synthesesPartition(this)
  }
}

/** Compte **********************************************************************
_data_ :
- `id` : numéro du compte = id de son avatar principal.
- `v` : 1..N.
- `hXR` : `ns` + `hXR`, hash du PBKFD d'un extrait de la phrase secrète.
- `dlv` : dernier jour de validité du compte.

- `rds` : null en session.
- `hXC`: hash du PBKFD de la phrase secrète complète (sans son `ns`).
- `cleKXC` : clé K cryptée par XC (PBKFD de la phrase secrète complète).
- `cleEK` : clé de l'espace cryptée par la clé K du compte, à la création de l'espace pour le Comptable, à l'acceptation du sponsoring pour les autres comptes.

- `dhvuK` : date-heure de dernière vue des notifications par le titulaire du compte, cryptée par la clé K.
- `qv` : `{ qc, qn, qv, pcc, pcn, pcv, nbj }`
  - `pcc, pcn, pcv, nbj` : remontés de `compta` en fin d'opération quand l'un d'eux passe un seuil de 5% / 5j, à la montée ou à la descente.
    - `pcc` : pour un compte O, pourcentage de sa consommation mensualisée sur M/M-1 par rapport à son quota `qc`.
    - `nbj` : pour un compta A, nombre de jours estimés de vie du compte avant épuisement de son solde en prolongeant sa consommation des 4 derniers mois et son abonnement `qn qv`.
    - `pcn` : pourcentage de son volume de notes / chats / groupes par rapport à son quota qn.
    - `pcv` : pourcentage de son volume de fichiers par rapport à son quota qv.
  - `qc qn qv` : maj immédiate en cas de changement des quotas.
    - pour un compte O identiques à ceux de son entrée dans partition.
    - pour un compte A, qn qv donné par le compte lui-même.
    - en cas de changement, les compteurs de consommation sont remontés. 
  - permet de calculer `notifQ`, `notifX` (O), `notifS` (A)

_Comptes "O" seulement:_
- `clePK` : clé P de la partition cryptée par la clé K du compte. Si cette clé a une longueur de 256, la clé P a été cryptée par la clé publique de l'avatar principal du compte suite à une affectation à une partition APRÈS sa création (changement de partition, passage de compte A à O)
- `idp` : id de la partition (son numéro).
- `del` : `true` si le compte est délégué de la partition.
- `notif`: notification de niveau _compte_ dont le texte est crypté par la clé P de la partition (`null` s'il n'y en a pas).

- `mav` : map des avatars du compte. 
  - _clé_ : id court de l'avatar.
  - _valeur_ : `{ rds, claAK }`
    - `rds`: de l'avatar (clé d'accès à son `versions`). null en session.
    - `cleAK`: clé A de l'avatar crypté par la clé K du compte.

- `mpg` : map des participations aux groupes:
  - _clé_ : id du groupe
  - _valeur_: `{ rds, cleGK, lav }`
    - `rds`: du groupe (clé d'accès à son `versions`). null en session.
    - `cleGK` : clé G du groupe cryptée par la clé K du compte.
    - `lav`: liste de ses avatars participant au groupe. compilé -> sav : Set

**Comptable seulement:**
- `tpk` : table des partitions {cleP, code } cryptés par la clé K du Comptable. 
  Son index est le numéro de la partition.
  - `cleP` : clé P de la partition.
  - `code` : code / commentaire court de convenance attribué par le Comptable
Compilé en mcode: Map(): clé: idp, valeur: code
*/
export class Compte extends GenDoc {
  get estComptable () { return ID.estComptable(this.id) }

  async compile (row) {
    this.ns = ID.ns(this.id)
    const session = stores.session
    const cfg = stores.config
    const clek = session.clek || await session.setIdClek(this.id, row.cleKXC)

    this.dhvu = row.dhvuK ? parseInt(await decrypterStr(clek, row.dhvuK)) : 0
    this.qv = row.qv

    this.dlv = row.dlv
    this.nbj = AMJ.diff(this.dlv, session.auj)
    this.alerteDlv = cfg.alerteDlv > this.nbj
    // this.alerteDlv = this.nbj > 5 // test

    if (row.idp) {
      this.estA = false
      this.idp = ID.long(row.idp, this.ns)
      const clep = RegCles.set(await decrypter(clek, row.clePK))
      this.del = row.del || false
      this.notif = row.notif ? await Notification.decrypt(row.notif, clep) : null
    } else this.estA = true

    this.mav = new Set()
    for(const idx in row.mav) {
      const e = row.mav[idx]
      const id = ID.long(parseInt(idx), this.ns)
      RegCles.set(await decrypter(clek, e.cleAK))
      this.mav.add(id)
    }

    this.mpg = new Map()
    for(const idx in row.mpg) {
      const idg = ID.long(parsInt(idx), this.ns)
      const e = row.mpg[idx]
      RegCles.set(await decrypter(clek, e.cleGK))
      const sav = new Set()
      for(const idx2 of e.lp) sav.add(ID.long(parseInt(idx2), this.ns))
      this.mpg.set(idg, sav)
    }

    if (this.estComptable) {
      this.mcode = new Map()
      for(let i = 1; i < row.tpk.length; i++) {
        const x = row.tpk[i]
        if (x) {
          const { cleP, code } = decode(await decrypter(clek, x))
          const idp = Cles.id(RegCles.set(cleP), this.ns)
          if (code) this.mcode.set(idp, code)
        }
      }
    }
  }

  // retourne le code de la partition id (Comptable)
  codeP (id) { 
    const n = ID.long(id, this.ns)
    return this.mcode.get(n) || '#' + ID.court(id)
  }
  
  // Retourne [amb, amo] - un avatar au moins accède aux membres / notes du groupe
  ambano (groupe) {
    let ano = false, amb = false
    const sav = this.mpg.get(groupe.id)
    if (sav) {
      for(const idav of sav) {
        const im = groupe.imDe(idav)
        if (im) {
          const f = groupe.flags[im]
          if ((f & FLAGS.AM) && (f & FLAGS.DM)) amb = true
          if ((f & FLAGS.AN) && (f & FLAGS.DN)) ano = true  
        }
      }
    }
    return [amb, ano]
  }
  
  /* Id des groupes de l'avatar ida (tous avatars si ida absent) */
  idGroupes (ida) {
    const x = new Set()
    this.mpg.forEach((sav, idg) => { if (!ida || sav.has(ida)) x.add(idg) })
    return x
  }

  /*
  // Map(ida, im) des avatars du compte dans mpg ou les invits des avatars
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
  */
}

/** Compta **********************************************************************
_data_:
- `id` : numéro du compte = id de son avatar principal.
- `v` : 1..N.
- `qv` : `{qc, qn, qv, nn, nc, ng, v}`: quotas et nombre de groupes, chats, notes, volume fichiers. Valeurs courantes.
- `compteurs` sérialisation des quotas, volumes et coûts.
- _Comptes "A" seulement_
  - `solde`: résultat, 
    - du cumul des crédits reçus depuis le début de la vie du compte (ou de son dernier passage en compte A), 
    - plus les dons reçus des autres,
    - moins les dons faits aux autres.
  - `ticketsK`: liste des tickets cryptée par la clé K du compte `{ids, v, dg, dr, ma, mc, refa, refc, di}`.
*/
export class Compta extends GenDoc {
  get ns () { return ID.ns(this.id) }

  async compile (row) {
    const clek = stores.session.clek

    this.qv = row.qv
    this.compteurs = new Compteurs(row.compteurs, this.qv)
    this.pc = this.compteurs.pourcents // {pcc, pcn, pcv, max}
    this.solde = row.solde || 0
    if (row.ticketsK) this.tickets = decode(await decrypter(clek, row.ticketsK))
    this.estA = this.tickets !== undefined
  }

  /* TODO Depuis la liste actuelle des tickets de compta,
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

  /* TODO Depuis la liste actuelle des tickets de compta,
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

  /* TODO Incorporation des tickets et des dons en attente au credits,
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

}

/* Classe compti ****************************************************
_data_:
- `id` : id du compte.
- `v` : version.

- `mc` : map à propos des contacts (des avatars) et des groupes _connus_ du compte,
  - _cle_: `id` court de l'avatar ou du groupe,
  - _valeur_ : `{ ht, tx }` cryptée par la clé K du compte.
    - `ht` : liste des hashtags attribués par le compte.
    - `tx` : commentaire écrit par le compte (gzippé)
*/
export class Compti extends GenDoc {

  async compile (row) {
    const clek = stores.session.clek
    this.ns = ID.ns(this.id)
    this.mc = new Map()
    if (row.mc) for(const idx in row.mc) {
      const x = row[idx]
      const id = ID.long(parseInt(idx), this.ns)
      const ht = x.ht ? decode(await decrypter(clek, x.ht)) : []
      const tx = x.tx ? ungzipB(await decrypter(this.clek, x.tx)) : ''
      this.mc.set(id, { ht, tx })
    }
  }

  get (id) {
    const x = this.mc.get(id)
    return x ||  { ht: new Set(), texte: '', fake: true }
  }
}

/** Avatar *********************************************************
_data_:
- `id` : id de l'avatar.
- `v` : 1..N. Par convention, une version à 999999 désigne un **avatar logiquement détruit** mais dont les données sont encore présentes. L'avatar est _en cours de suppression_.
- `vcv` : version de la carte de visite afin qu'une opération puisse détecter (sans lire le document) si la carte de visite est plus récente que celle qu'il connaît.
- `hZR` : `ns` + hash du PBKFD de la phrase de contact réduite.

- `rds` : pas transmis en session.
- `cleAZC` : clé A cryptée par ZC (PBKFD de la phrase de contact complète).
- `pcK` : phrase de contact complète cryptée par la clé K du compte.
- `hZC` : hash du PBKFD de la phrase de contact complète.

- `cvA` : carte de visite de l'avatar `{id, v, photo, texte}`. photo et texte cryptés par la clé A de l'avatar.

- `pub privK` : couple des clés publique / privée RSA de l'avatar.

- `invits`: map des invitations en cours de l'avatar:
  - _clé_: `idg` id court du groupe.
  - _valeur_: `{cleGA, cvG, ivpar, dh}` 
    - `cleGA`: clé du groupe crypté par la clé A de l'avatar.
    - `cvG` : carte de visite du groupe (photo et texte sont cryptés par la clé G du groupe).
    - `ivpar` : indice `im` de l'invitant.
    - `dh` : date-heure d'invitation. Le couple `[ivpar, dh]` permet de retrouver l'item dans le chat du groupe donnant le message de bienvenue / invitation émis par l'invitant.

  Compilé en : { ivpar, dh }
*/
export class Avatar extends GenDoc {

  /** compile *********************************************************/
  async compile (row) {
    this.ns = ID.ns(this.id)
    const clek = stores.session.clek
    // this.vcv = row.vcv || 0
    // this.hZR = row.hZR

    if (row.pcK) { // phrase de contact cryptée par la clé K.
      // this.cleAZC = row.cleAZC
      this.pc = await decrypterStr(clek, row.pcK)
    }

    const clea = RegCles.get(this.id)
    const cv = await CV.set(row.cvA || CV.fake(this.id))
    cv.store()
    await RegCc.setPriv(this.id, row.privK)

    this.invits = new Map()
    if (row.invits) {
      for (const idgx in row.invits) {
        const idg = ID.long(parseInt(idgx), this.ns)
        const e = row.invits[idgx] // {cleGA, cvg, ivpar, dh}
        RegCles.set(await decrypter(clea, e.cleGA))
        const cv = await CV.set(e.cvG || CV.fake(idg))
        cv.store()
        this.invits.set(idg, { ivpar: e.ivpar, dh: e.dh })
      }
    }
  }

}

/** Sponsoring ************************************************************
_data_:
- `id` : id de l'avatar sponsor.
- `ids` : `ns` + (hYR) hash du PBKFD de la phrase réduite de parrainage, 
- `v`: 1..N.
- `dlv` : date limite de validité

- `st` : statut. _0: en attente réponse, 1: refusé, 2: accepté, 3: détruit / annulé_
- `pspK` : texte de la phrase de sponsoring cryptée par la clé K du sponsor.
- `YCK` : PBKFD de la phrase de sponsoring cryptée par la clé K du sponsor.
- `hYC`: hash du PBKD de la phrase de sponsoring
- `dh`: date-heure du dernier changement d'état.
- `cleAYC` : clé A du sponsor crypté par le PBKFD de la phrase complète de sponsoring.
- `partitionId`: id de la partition si compte 0
- `clePYC` : clé P de sa partition (si c'est un compte "O") cryptée par le PBKFD de la phrase complète de sponsoring (donne le numéro de partition).
- `nomYC` : nom du sponsorisé, crypté par le PBKFD de la phrase complète de sponsoring.
- `del` : `true` si le sponsorisé est délégué de sa partition.
- `cvA` : CV du sponsor, textes cryptés par sa cle A.
- `quotas` : `{qc, q1, q2}` quotas attribués par le sponsor.
  - pour un compte "A" `[0, 1, 1]`. Un tel compte n'a pas de `qc` et peut changer à loisir `[q1, q2]` qui sont des protections pour lui-même (et fixe le coût de l'abonnement).
- `don` : pour un compte autonome, montant du don.
- `dconf` : le sponsor a demandé à rester confidentiel. Si oui, aucun chat ne sera créé à l'acceptation du sponsoring.
- `ardYC` : ardoise de bienvenue du sponsor / réponse du sponsorisé cryptée par le PBKFD de la phrase de sponsoring.
- `csp, itsp` : id du COMPTE sponsor et sont it dans sa partition. Écrit par le serveur et NON communiqué aux sessions.
*/
export class Sponsoring extends GenDoc {
  get ns () { return ID.ns(this.id) }

  /* commun */
  async comp (row) {
    this.st = row.st
    this.dh = row.dh
    this.partitionId = row.partitionId || 0
    this.estA = !this.partitionId
    this.nom = await decrypterStr(this.YC, row.nomYC)
    this.cleA = await decrypter(this.YC, row.cleAYC)
    this.del = row.del || false
    this.quotas = row.quotas
    this.don = row.don || 0
    this.dconf = row.dconf || false
    this.hYC = row.hYC
    this.ard = await decrypterStr(this.YC, row.ardYC)
    if (!this.estA) this.cleP = RegCles.set(await decrypter(this.YC, row.clePYC))
  }

  /* Par l'avatar sponsor */
  async compile (row) {
    this.vsh = row.vsh || 0
    const clek = stores.session.clek
    this.psp = await decrypterStr(clek, row.psK)
    this.YC = await decrypter(clek, row.YCK)
    await this.comp(row)
  }

  /* Par l'avatar sponsorisé : HORS SESSION - Registres inutilisables
  Création: await new Sponsoring().compileHS(row, psp)
  */
  async compileHS (rowSp, cle) {
    const row = decode(rowSp._data_)
    this.id = row.id
    this.ids = row.ids
    this.v = row.v
    this.dlv = row.dlv
    this.YC = cle
    await this.comp(row)
    this.cleA = RegCles.set(await decrypter(this.YC, row.cleAYC))
    this.cv = await CV.set(row.cvA, this.cleA)
  }

}

/** Ticket ***********************************************
_data_:
- `id`: id du Comptable.
- `ids` : numéro du ticket
- `v` : version du ticket.

- `dg` : date de génération.
- `dr`: date de réception. Si 0 le ticket est _en attente_.
- `ma`: montant déclaré émis par le compte A.
- `mc` : montant déclaré reçu par le Comptable.
- `refa` : code court (32c) facultatif du compte A à l'émission.
- `refc` : code court (32c) facultatif du Comptable à la réception.
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
- `id`: id de I,
- `ids`: aléatoire.
- `v`: 1..N.
- `vcv` : version de la carte de visite de E.

- `st` : deux chiffres `I E`
  - I : 0:passif, 1:actif
  - E : 0:passif, 1:actif, 2:disparu
- `idE idsE` : identifiant de _l'autre_ chat.
- `cvA` : `{id, v, photo, info}` carte de visite de E au moment de la création / dernière mise à jour du chat (textes cryptés par sa clé A).
- `cleCKP` : clé C du chat cryptée,
  - si elle a une longueur inférieure à 256 bytes par la clé K du compte de I.
  - sinon cryptée par la clé RSA publique de I.
- `cleEC` : clé A de l'avatar E cryptée par la clé du chat.
- `items` : liste des items `[{a, dh, dhx, t}]`
  - `a` : 0:écrit par I, 1: écrit par E
  - `dh` : date-heure d'écriture.
  - `dhx` : date-heure de suppression.
  - `t` : texte crypté par la clé C du chat (vide s'il a été supprimé).
*/
export class Chat extends GenDoc {
  get stI () { return Math.floor(this.st / 10) }
  get stE () { return this.st % 10 }

  async compile (row) {
    const session = stores.session
    this.ns = ID.ns(this.id)

    this.st = row.st
    this.idE = ID.long(row.idE, this.ns)
    this.idsE = ID.long(row.idsE, this.ns)

    this.cleCKP = row.cleCKP
    this.clec = await RegCc.get(this)

    let cleE = RegCles.get(this.idE)
    if (!cleE) {
      cleE = await decrypter(this.clec, row.cleEC)
      RegCles.set(cleE)
    }

    const cvE = await CV.set(row.cvE || CV.fake(this.idE))
    cvE.store()
    const cvI = session.getCV(this.id)

    this.items = []
    const a = []
    this.tit = ''
    this.dh = 0
    let t1r = false
    this.yo = false
    if (row.items) for (const it of row.items) {
      const t = it.t ? ungzipB(await decrypter(this.clec, it.t)) : null
      if (!t1r && it.a === 1) {
        if (t === '**YO**') this.yo = true
        t1r = true
      }
      if (this.dh === 0) this.dh = it.dhx ? it.dhx : it.dh
      this.items.push({ a: it.a, t, dh: it.dh, dhx: it.dhx || 0})

      a.push('_**' + $t('dedh', [it.a ? cvI.nom : cvE.nom, dhstring(it.dh)]) + '**_')
      if (it.dhx) a.push('\n' + $t('supprime', [dhstring(it.dhx)]) + '\n')
      else a.push('\n' + t + '\n')
      a.push('\n')
      if (!this.tit && t) this.tit = titre(t)
    }
    this.txt = a.join('\n')
    if (!this.tit) this.tit = '???'
  }

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
- `v` :  1..N, Par convention, une version à 999999 désigne un **groupe logiquement détruit** mais dont les données sont encore présentes. Le groupe est _en cours de suppression_.
- `dfh` : date de fin d'hébergement.

- `rds` : pas transmis en session.
- `qn qv n v`: nombres de notes actuel et maximum attribué par l'hébergeur, volume total actuel des fichiers des notes et maximum attribué par l'hébergeur.
- `idh` : id du compte hébergeur (pas transmise aux sessions).
- `imh` : indice `im` du membre dont le compte est hébergeur.
- `msu` : mode _simple_ ou _unanime_.
  - `null` : mode simple.
  - `[ids]` : mode unanime : liste des indices des animateurs ayant voté pour le retour au mode simple. La liste peut être vide mais existe.
- `tid` : table des ids courts des membres.
- `flags` : tables des flags.
- `hists` : tables des flags historiques.
- `lng` : liste noire _groupe_ des ids (courts) des membres.
- `lnc` : liste noire _compte_ des ids (courts) des membres.
- `cvG` : carte de visite du groupe, textes cryptés par la clé du groupe `{v, photo, info}`.
*/

export class Groupe extends GenDoc {

  async compile (row) {
    this.ns = ID.ns(this.id)

    this.qn = row.qn; this.qv = row.qv; this.n = row.n; this.v = row.v
    this.imh = row.imh
    this.msu = row.msu || null

    this.mmb = new Map()
    this.tid = new Array(row.tid.length)
    row.tid.forEach((id, im) => { 
      const ida = ID.long(id, this.ns)
      this.tid[im] = ida
      this.mmb.set(ida, im)
    })
    this.flags = row.flags
    this.hists = row.hists
    this.lng = new Array(row.lng.length)
    row.lng.forEach((id, i) => { this.lng[i] = ID.long(id, this.ns)})
    this.lnc = new Array(row.lnc.length)
    row.lnc.forEach((id, i) => { this.lnc[i] = ID.long(id, this.ns)})
    const cv = await CV.set(row.cvG || CV.fake(this.id))
    cv.store()
  }
  
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

  imDeId (id) { return this.mmb(id) }

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
  estOubliable (im) { const f = this.flags[im] || 0; const h = this.hists[im] || 0; 
    return !(f & FLAGS.AC) && !(f & FLAGS.IN) && !(h & FLAGS.HA)
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
    const f = this.flags[im] || 0; const h = this.hists[im] || 0; 
    if (f & FLAGS.AC) return 1
    return h & FLAGS.HA ? 2 : 0
  }
  accesMembreH (im) { // 0:jamais, 1:oui, 2:l'a eu, ne l'a plus
    const f = this.flags[im] || 0; const h = this.hists[im] || 0; 
    if ((f & FLAGS.AC) && (f & FLAGS.AM) && (f & FLAGS.DM)) return 1
    return h & FLAGS.HM ? 2 : 0
  }
  accesLecNoteH (im) { // 0:jamais, 1:oui, 2:l'a eu, ne l'a plus
    const f = this.flags[im] || 0; const h = this.hists[im] || 0; 
    if ((f & FLAGS.AC) && (f & FLAGS.AN) && (f & FLAGS.DN)) return 1
    return h & FLAGS.HN ? 2 : 0
  }
  accesEcrNoteH (im) { // 0:jamais, 1:oui, 2:l'a eu, ne l'a plus
    const f = this.flags[im] || 0; const h = this.hists[im] || 0; 
    if ((f & FLAGS.AC) && (f & FLAGS.AN) && (f & FLAGS.DE)) return 1
    return h & FLAGS.HE ? 2 : 0
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
- `id` : id du groupe.
- `ids`: identifiant, indice `im` de membre relatif à son groupe.
- `v` : 
- `vcv` : version de la carte de visite du membre.

- `ddi` : date de l'invitation la plus récente.
- **dates de début de la première et fin de la dernière période...**
  - `dac fac` : d'activité
  - `dln fln` : d'accès en lecture aux notes.
  - `den fen` : d'accès en écriture aux notes.
  - `dam fam` : d'accès aux membres.
- `flagsiv` : flags de l'invitation en cours.
- `inv` : . Liste des indices des animateurs ayant validé la dernière invitation.
- `idm` : id de l'avatar membre
- `cleAG` : clé A de l'avatar membre cryptée par la clé G du groupe.
- `cvA` : carte de visite du membre `{v, photo, info}`, textes cryptés par la clé A de l'avatar membre.

**Extension pour une fiche Invitation **
- ext : { flags, invs: map, chatg }
  invs : clé: im, valeur: { cva, nag }
*/
export class Membre extends GenDoc {
  async compile (row) {
    const ns = ID.ns(this.id)
    this.vsh = row.vsh || 0
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
    this.idm = ID.long(row.idm, ns)
    this.na = NomGenerique.from(decode(await decrypter(this.cleg, row.nag)))
    this.nag = await Groupe.getNag (this.ng, this.na) 
    this.estAc = aSt.compte.avatarIds.has(this.na.id)
    this.cv = row.cva && !this.estAc ? decode(await decrypter(this.na.rnd, row.cva)) : null
    /*
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
    */
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

- `items` : liste ordonnée des items de chat `{im, dh, lg, texte}`
  - `im` : indice membre de l'auteur,
  - `dh` : date-heure d'enregistrement de l'item,
  - `dhx` : date-heure de suppression
  - `t` : texte (gzippé) crypté par la clé G du groupe.
*/
export class Chatgr extends GenDoc {

  async compile (row) {
    this.vsh = row.vsh || 0
    const gSt = stores.groupe
    const pSt = stores.people
    const cle = RegCles.get(this.id)
    const g = gSt.groupe(this.id)
    this.items = []
    const a = []
    this.tit = ''
    this.dh = 0
    const mbs = gSt.egr(this.id)
    if (row.items) for (const item of row.items) {
      const i = { im: item.im, dh: item.dh, t: '', dhx: item.dhx}
      if (!item.dhx) {
        i.t = ungzipB(await decrypter(cle, item.t))
        if (!this.tit && i.t) this.tit = titre(i.t)
      }
      if (this.dh === 0) this.dh = i.dhx ? i.dhx : i.dh
      const idm = g.tid[i.im]
      if (!idm) continue
      const cv = pSt.getCV(idm)
      a.push('_**' + $t('dedh', [cv.nomC, dhstring(i.dh)]) + '**_')
      if (i.dhx) a.push('\n' + $t('supprime', [dhstring(i.dhx)]) + '\n')
      else a.push('\n' + i.t + '\n')
      this.items.push(i)
    }
    this.txt = a.join('\n')
    if (!this.tit) this.tit = '???'
  }

  static async getItem (cleg, im, txt, dh) {
    const t = txt && txt.length ? await crypter(cleg, gzipB(txt)) : null
    return { im: im, t, dh: dh || Date.now() }
  }
}

/* Note ***************************************************
_data_:
- `id` : id de l'avatar ou du groupe.
- `ids` : identifiant aléatoire relatif à son avatar.
- `v` : 1..N.

- `im` : exclusivité dans un groupe. L'écriture est restreinte au membre du groupe dont `im` est `ids`. 
- `vf` : volume total des fichiers attachés.
- `ht` : liste des hashtags _personnels_ cryptée par la clé K du compte.
- `htg` : note de groupe : liste des hashtags cryptée par la clé du groupe.
- `htm` : NON TRANSMIS en session pour une note de groupe seulement, hashtags des membres. Map:
    - _clé_ : id courte du compte de l'auteur,
    - _valeur_ : liste des hashtags cryptée par la clé K du compte.
- `l` : liste des _auteurs_ (leurs `im`) pour une note de groupe.
- `d` : date-heure de dernière modification.
- `texte` : texte (gzippé) crypté par la clé de la note.
- `mfa` : map des fichiers attachés.
- `ref` : triplet `[id_court, ids, nomp]` crypté par la clé de la note, référence de sa note _parent_.

**Map `mfas` des fichiers attachés dans une note:**
- _clé_ `idf`: identifiant du fichier.
- _valeur_ : { lg, datas }
  - `lg` : taille du fichier, en clair afin que le serveur puisse toujours recalculer la taille totale v d'un note.
  - `data` : sérialisation cryptée par la clé de la note de : `{ nom, info, dh, type, gz, lg, sha }`.

*/
export class Note extends GenDoc {
  async compile (row) {
    this.vsh = row.vsh || 0
    const ns = ID.ns(this.id)
    this.deGroupe = ID.estGroupe(this.id)
    const clek = stores.session.clek
    const cleg = this.deGroupe ? RegCles.get(this.id) : null

    this.im = row.im || 0
    if (row.ht) this.ht = await decrypter(clek, row.ht)
    if (row.htg) this.htg = await decrypter(cleg, row.htg)
    this.l = row.l || []
    this.d = row.d || 0

    const t = await decrypter(this.deGroupe ? cleg : clek, row.texte)
    this.texte = ungzipB(t)
    this.titre = titre(this.texte)

    // row.ref à une id de note COURTE
    this.ref = row.ref || null
    if (this.ref) this.ref[0] = ID.long(this.ref[0], ns)

    this.mfa = new Map()
    if (this.vf && row.mfa) for (const idf in row.mfa) {
      const [lg, x] = row.mfa[idf]
      const f = decode(await decrypter(this.deGroupe ? cleg : clek, x))
      f.idf = parseInt(idf)
      this.mfa.set(f.idf, f)
    }
  }

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


  /*
  initTest (id, ids, ref, txt, dh, n, v) { // pour les tests
    this.id = id
    this.ids = ids
    this.ref = ref
    this.txt = txt
    this.titre = titre(this.txt)
    this.dh = dh,
    this.n = txt ? txt.length : 0
    this.v = v
    this.mfa = { size : v ? (ids % 10) : 0 }
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
    this.n = txt ? txt.length : 0
  }
  */

  static async toRowNouveau (id, txt, im, exclu, ref) {
    const session = stores.session
    const cle = Note.clen(id)
    const r = { id, ids: rnd6(), im: exclu ? im : 0, v : 0, mc: null }
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
      const b = await idb.getFichierIDB(idf)
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
    return await idb.FLget(this)
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
  partitions: Partition,
  syntheses: Synthese,
  comptes: Compte,
  comptas: Compta,
  comptis: Compti,
  avatars: Avatar,
  groupes: Groupe,
  notes: Note,
  sponsorings: Sponsoring,
  chats: Chat,
  membres: Membre,
  chatgrs: Chatgr
}
