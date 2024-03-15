import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import mime2ext from 'mime2ext'
import { $t, dhcool, hash, rnd6, inverse, u8ToB64, gzipB, ungzipB, gzipT, ungzipT, titre, suffixe, dhstring } from './util.mjs'
import { pbkfd, sha256, crypter, decrypter, decrypterStr, decrypterRSA } from './webcrypto.mjs'
import { Rds, ID, Cles, isAppExc, d13, d14, Compteurs, AMJ, nomFichier, 
  lcSynt, synthesesPartition, FLAGS } from './api.mjs'
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

  static reset () { RegCles.registre.clear; RegRds.reset() }

  static get (id) { return RegCles.registre.get(ID.long(id, RegCles.ns)) }

  static set (cle) {
    const id = Cles.id(cle, RegCles.ns)
    RegCles.registre.set(id, cle)
    return id
  }
}

/* classe RegCc : registre des clés des chats ******************************
*/
export class RegCc {
  static registre = new Map() // clé: ids d'un chat - valeur: clé C du chat
  static regpriv = new Map() // clé: id d'un avatar du compte - valeur: clé privée

  static async get (chat) {
    const session = stores.session
    let cc = RegCc.registre.get(chat.ids)
    if (cc) return cc
    if (chat.cleCKP.length !== 256) {
      cc = await decrypter(session.clek, chat.cleCKP)
      RegCc.registre.set(chat.ids, cc)
      return cc
    }
    let priv = RegCc.regpriv.get(chat.id)
    if (!priv) {
      const av = stores.avatar.getAvatar(chat.id)
      priv = await decrypter(session.clek, av.privK)
      RegCc.regpriv.set(av.id, priv)
    }
    cc = await decrypterRSA(priv, chat.cleCKP)
    RegCc.registre.set(chat.ids, cc)
    return cc
  }

}

/* classe RegRds : registre des rds (référence DataSync) connues dans la session **********
- `reset ()` : réinitialisation en début de session
- `rds (id)` : retourne le rds enregistré avec cette id
- `id` (rds) : retourne l'id enregistré avec ce rds
- `set (rds, id)` : enregistré le rds / id
*/
export class RegRds {
  static regId = new Map()
  static regRds = new Map()

  static reset () { RegRds.regId.clear;  RegRds.regRds.clear }

  static rds (id) { return RegRds.regId.get(ID.long(id, RegCles.ns)) }

  static id (rds) { return RegRds.regRds.get(Rds.long(rds, RegCles.ns)) }

  static set (rds, id) {
    const r = rds < d14 ? Rds.long(rds, RegCles.ns) : rds
    const i = ID.long(id, RegRds.ns)
    RegRds.regId.set(i, r)
    RegRds.regRds.set(r, i)
    return r
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
    cv : { id, dh, photo, texte} (photo et texte cryptés)
- new CV(id, dh, photo, texte) (photo et texte en clair)
- CV.fake(id) (sans photo ni texte)
*/
export class CV {
  static async set (cv, cle) { // cle si l'id n'est pas enregistrée (sponsoring)
    if (cv && cv.clair) return cv
    const c = new CV()
    if (cv) {
      c.id = ID.court(cv.id)
      c.dh = cv.dh || 0
      const k = cle || RegCles.get(cv.id)
      if (k) {
        if (cv.photo) c.ph = await decrypterStr(k, cv.photo)
        if (cv.texte) c.tx = await decrypterStr(k, cv.texte)
      }
    } else { 
      c.id = 0 
    }
    return c
  }

  static fake (id) { const c = new CV; c.id = ID.court(id); c.clair = true; return c}

  constructor (id, dh, photo, texte) {
    this.id = id
    this.dh = dh || 0
    this.ph = photo || null
    this.tx = texte || ''
    this.clair = true
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
    return '#' + this.id
  }

  get dhed () { return this.dhx ? dhcool(this.dh) : $t('dateinc')}

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

  async crypter(cle) {
    return {
      id: ID.court(this.id),
      dh: this.dh,
      photo: this.ph ? await crypter(cle, this.ph) : null,
      texte: this.tx ? await crypter(cle, this.tx) : '',
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
- `v` : 1..N
- `org` : code de l'organisation propriétaire.

- `rds`
- `cleES` : clé E cryptée par la clé S.
- `creation` : date de création.
- `moisStat` : dernier mois de calcul de la statistique des comptas.
- `moisStatT` : dernier mois de calcul de la statistique des tickets.
- `notif` : notification de l'administrateur. Texte crypté par la clé A du Comptable (une constante bien connue depuis le `ns`).
- `dlvat` : `dlv` de l'administrateur technique.
- `t` : numéro de _profil_ de quotas dans la table des profils définis dans la configuration. 
**Mis à jour par le Comptable:**
- `opt`:
  - 0: 'Pas de comptes "autonomes"',
  - 1: 'Le Comptable peut rendre un compte "autonome" sans son accord',
  - 2: 'Le Comptable NE peut PAS rendre un compte "autonome" sans son accord',
- `nbmi`: nombre de mois d'inactivité acceptable pour un compte O fixé par le comptable. Ce changement n'a pas d'effet rétroactif.
*/
export class Espace extends GenDoc {
  // get rds () { return RegRds.rds(this.id) }
  get ns () { return ID.ns(this.id) }

  async compile (row) {
    this.vsh = row.vsh || 0
    /* cas admin: espace peut être compilé SANS qu'un ns  
    n'ait été enregistré dans RegRds (admin n'ayant pas de ns courant) */
    this.rds = RegRds.set(Rds.long(row.rds, this.ns), this.id)

    this.org = row.org
    this.creation = row.creation
    this.moisStat = row.moisStat || 0
    this.moisStatT = row.moisStatT || 0
    this.opt = row.opt || 0
    this.dlvat = row.dlvat
    this.nbmi = row.nbmi || 6
    this.t = row.t || 0
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
- `id` : id de l'espace.
- `v` : date-heure d'écriture (purement informative).

- `tp` : table des synthèses des partitions de l'espace. L'indice dans cette table est l'id court de la partition. Chaque élément est la sérialisation de:
  - id : id long de la partition (calculé localement)
  - `qc qn qv` : quotas de la partition.
  - `ac an av` : sommes des quotas attribués aux comptes attachés à la partition.
  - `c n v` : somme des consommations journalières et des volumes effectivement utilisés.
  - `ntr0` : nombre de notifications partition sans restriction d'accès.
  - `ntr1` : nombre de notifications partition avec restriction d'accès 1.
  - `ntr2` : nombre de notifications partition avec restriction d'accès 2_.
  - `nbc` : nombre de comptes.
  - `nbd` : nombre de comptes _délégués_.
  - `nco0` : nombres de comptes ayant une notification sans restriction d'accès.
  - `nco1` : nombres de comptes ayant une notification avec restriction d'accès 1.
  - `nco2` : nombres de comptes ayant une notification avec restriction d'accès 2.

  Claculés localement les _pourcentages_: 
  - pcac pcan pcav pcc pcn pcv

`tp[0]` est la somme des `tp[1..N]` calculé en session, pas stocké.

*/
export class Synthese extends GenDoc {
  get ns () { return ID.ns(this.id) }
  /* lcSynt = ['qc', 'qn', 'qv', 'ac', 'an', 'av', 'c', 'n', 'v', 
  'nbc', 'nbd', 'ntr0', 'ntr1', 'ntr2', 'nco0', 'nco1', 'nco2'] */

  async compile (row) {
    const session = stores.session
    this.tp = new Array(row.tp.length)

    const a0 = { id: 0 } // colonne 0 de totalisation
    lcSynt.forEach(f => { a0[f] = 0 })

    for (let i = 1; i < row.tp.length; i++) {
      const x = row.tp[i]
      if (x && !x.vide) {
        x.id = ID.long(i, this.ns)
        x.pcac = !x.qc ? 0 : Math.round(x.ac * 100 / x.qc) 
        x.pcan = !x.qn ? 0 : Math.round(x.an * 100 / x.qn) 
        x.pcav = !x.qv ? 0 : Math.round(x.av * 100 / x.qv) 
        x.pcc = !x.qc ? 0 : Math.round(x.c * 100 / x.qc) 
        x.pcn = !x.qn ? 0 : Math.round(x.n * 100 / x.qn) 
        x.pcv = !x.qv ? 0 : Math.round(x.v * 100 / x.qv)   
        lcSynt.forEach(f => { a0[f] +=  x[f] })
      }
      this.tp[i] = x
    }
    a0.pcac = !a0.qc ? 0 : Math.round(a0.ac * 100 / a0.qc) 
    a0.pcan = !a0.qn ? 0 : Math.round(a0.an * 100 / a0.qn) 
    a0.pcav = !a0.qv ? 0 : Math.round(a0.av * 100 / a0.qv) 
    a0.pcc = !a0.qc ? 0 : Math.round(a0.c * 100 / a0.qc) 
    a0.pcn = !a0.qn ? 0 : Math.round(a0.n * 100 / a0.qn) 
    a0.pcv = !a0.qv ? 0 : Math.round(a0.v * 100 / a0.qv) 
    this.tp[0] = a0 
  }

  /*
  static async nouveau (aco, apr) { 
    const session = stores.session
    const r = { id: session.ns, v: Date.now(), atr: [null, null] }

    const e = {}
    lcSynt.forEach(f => { e[f] = 0 })
    e.qc = apr[0]
    e.qn = apr[1]
    e.qv = apr[2]
    e.ac = aco[0]
    e.a1 = aco[1]
    e.a2 = aco[2]
    e.nbc = 1
    e.nbsp = 1

    r.atr[1] = new Uint8Array(encode(e))
    return { _nom: 'syntheses', id: r.id, v: r.v, _data_: new Uint8Array(encode(r))}
  }
  */
}

/** Partition *********************************
_data_:
- `id` : numéro d'ordre de création de la partition par le Comptable.
- `v` : 1..N

- `rds`
- `qc qn qv` : quotas totaux de la partition.
- `clePK` : clé P de la partition cryptée par la clé K du comptable.
- `notif`: notification de niveau _partition_ dont le texte est crypté par la clé P de la partition.

- `ldel` : liste des clés A des délégués cryptées par la clé P de la partition.

- `tcpt` : table des comptes attachés à la partition. L'index `it` dans cette table figure dans la propriété `it` du document `comptes` correspondant :
  - `notif`: notification de niveau compte dont le texte est crypté par la clé P de la partition (`null` s'il n'y en a pas).
  - `cleAP` : clé A du compte crypté par la clé P de la partition.
  - `del`: `true` si c'est un délégué.
  - `q` : `qc qn qv c n v` extraits du document `comptas` du compte. 
    - En cas de changement de `qc qn qv` la copie est immédiate, sinon c'est effectué seulement lors de la prochaine connexion du compte.
    - `c` : consommation moyenne mensuelle lissée sur M et M-1 (`conso2M` de compteurs)
    - `n` : nn + nc + ng nombre de notes, chats, participation aux groupes.
    - `v` : volume de fichiers effectivement occupé.

Compilé:
- this.sdel: Set des ids des délégués

- tcpt compilé
  - it : indice dans la table tcpt (id de la partition)
  - notif: notification de niveau compte
  - del: true si délégué
  - q : 
    - qc qn qv c n v : extraits du document `comptas` du compte
    - pcc : pourcentage d'utilisation de la consommation journalière c / qc
    - pcn : pourcentage d'utilisation effective de qn : n / qn
    - pcv : pourcentage d'utilisation effective de qc : v / qv

- this.synth: item de synthese calculé localement, 
  - cet objet est exactement similaire à une ligne de Synthese de l'espace.
  - plus, calculés localement :
    - pcac : pourcentage d'affectation des quotas : ac / qc
    - pcan : pourcentage d'affectation des quotas : an / qn
    - pcav : pourcentage d'affectation des quotas : av / qv
    - pcc : pourcentage d'utilisation de la consommation journalière c / qc
    - pcn : pourcentage d'utilisation effective de qn : n / qn
    - pcv : pourcentage d'utilisation effective de qc : v / qv
*/
export class Partition extends GenDoc {
  get rds () { return RegRds.rds(this.id) }

  async compile (row) {
    const session = stores.session
    this.vsh = row.vsh || 0
    const estComptable = session.estComptable
    const clek = session.clek
    const ns = ID.ns(this.id)
    RegRds.set(row.rds)

    this.qc = row.qc || 0; this.qn = row.qn || 0; this.qv = row.qv || 0

    if (estComptable) RegCles.set(await decrypter(clek, row.clePK))
    /* Pour les comptes standard, 
    compile() de leur compte a enregistré la clé P de LEUR partition */

    const clep = RegCles.get(this.id)
    if (estComptable && row.notif) 
      // Le Comptable peut visiter et notifier TOUTES les partitions (pas seulement la soienne)
      this.notif = Notification.deSerial(await decrypter(clep, row.notif))

    this.qc = row.qc; this.qn = row.qn; this.qv = row.qv

    this.sdel = new Set() // Set des délégués
    if (row.ldel) {
      for(const cleAP of row.ldel) {
        const cleA = await decrypter(clep, cleAP)
        RegCles.set(cleA)
        this.sdel.add(Cles.id(cleA, ns))
      }
    }

    if (row.tcpt) { // Transmis seulement aux délégués
      this.tcpt = new Array(row.tcpt.length)
      for (let it = 0; it < row.tcpt.length; it++) {
        const item = row.tcpt[it]
        if (!item || item.vide) { this.tcpt[it] = null; continue }
        const r = { }
        if (item.del) r.del = true
        const cleA = await decrypter(clep, item.cleAP)
        RegCles.set(cleA)
        r.id = Cles.id(cleA, ns)
        r.it = it
        if (item.notif)
          r.notif = Notification.deSerial(await decrypter(clep, item.notif))
        r.q = { ...item.q }
        r.q.pcc = !r.q.qc ? 0 : Math.round(r.q.c * 100 / r.q.qc) 
        r.q.pcn = !r.q.qn ? 0 : Math.round(r.q.n * 100 / r.q.qn) 
        r.q.pcv = !r.q.qv ? 0 : Math.round(r.q.v * 100 / r.q.qv) 
        this.tcpt[it] = r
      }
      // synth : généré localement
      this.synth = synthesesPartition(this)
    }
  }

  get aCompte () {
    for (const x of this.act) if (!x.vide) return true
    return false
  }

  static async getIdT (clet, id) {
    return await crypter(clet, '' + ID.court(id))
  }

  // id de la partition, qn , qv 
  static async nouvelle (idt, qt, primitive, qc) {
    const session = stores.session
    const c = getCle(idt)
    const r = {}
    r.vsh = 0
    r.id = idt
    r.v = 1
    r.act = [null]
    r.qc = qt[0]
    r.qn = qt[1]
    r.qv = qt[2]
    r.stn = 0
    r.cletX = await crypter(session.clek, c)
    if (primitive) { // inscription du comptable comme premier compte
      const nac = NomGenerique.comptable()
      const item = {
        idT: await Tribu.getIdT(c, nac.id),
        qc: qc[0], qn: qc[1], qv: qc[2],
        ac: 0, a1: 0, a2: 0, stn: 0, ca: 0, n: 0, v: 0,
        nasp: await crypter(c, new Uint8Array(encode(nac.anr)))
      }
      r.act.push(item)
    }
    const _data_ = new Uint8Array(encode(r))
    return { _nom: 'tribus', id: r.id, v: r.v, _data_ }
  }
}

/** Compte **********************************************************************
_data_ :
- `id` : numéro du compte = id de son avatar principal.
- `v` : 1..N.
- `hXR` : `ns` + `hXR`, hash du PBKFD d'un extrait de la phrase secrète.
- `dlv` : dernier jour de validité du compte.

- `rds`
- `hXC`: hash du PBKFD de la phrase secrète complète (sans son `ns`).
- `cleKXC` : clé K cryptée par XC (PBKFD phrase secrète complète).

_Comptes "O" seulement:_
- `clePA` : clé P de la partition cryptée par la clé A de l'avatar principal du compte.
- `rdsp` : `rds` (court) du documents partitions.
- `idp` : id de la partition (pour le serveur) (sinon 0)
- `del` : `true` si le compte est délégué de la partition.
- `it` : index du compte dans `tcpt` de son document `partitions`.

- `mav` : map des avatars du compte. 
  - _clé_ : id court de l'avatar.
  - _valeur_ : `{ rds, claAK }` compilé => rds (long)
    - `rds`: de l'avatar (clé d'accès à son `versions`).
    - `cleAK`: clé A de l'avatar crypté par la clé K du compte.
  mav compilé: Set des id des avatars

- `mpg` : map des participations aux groupes:
  - _clé_ : id du groupe
  - _valeur_: `{ cleGK, rds, lp }`
    - `cleGK` : clé G du groupe cryptée par la clé K du compte.
    - rds: du groupe (clé d'accès à son `versions`)
    - `lp`: map des participations: 
      - _clé_: id court de l'avatar.
      - _valeur_: indice `im` du membre dans la table `tid` du groupe (`ids` du membre).

    - _valeur_ compilé => sav : set des id (long) des avatars du compte participant au groupe

**Comptable seulement:**
- `cleEK` : Clé E de l'espace cryptée par la clé K.
- `tp` : table des partitions : `{c, qc, qn, qv}`. => compilé { code, qc, qn, qv }
  - `c` : `{ cleP, code }` crypté par la clé K du comptable
    - `cleP` : clé P de la partition.
    - `code` : texte très court pour le seul usage du comptable.
  - `qc, qn, qv` : quotas globaux de la partition.
*/
export class Compte extends GenDoc {
  get rds () { return RegRds.rds(this.id) }

  async compile (row) {
    this.vsh = row.vsh || 0
    const session = stores.session
    const clek = session.clek || await session.setIdClek(this.id, row.cleKXC)
    const ns = ID.ns(this.id)
    RegRds.set(row.rds)

    this.it = row.it || 0
    this.estA = this.it === 0
    this.estComptable = ID.estComptable(this.id)

    this.mav = new Set()
    for(const idx in row.mav) {
      const e = row.mav[idx]
      RegCles.set(await decrypter(clek, e.cleAK))
      RegRds.set(e.rds)
      this.mav.add(ID.long(parseInt(idx), ns))
    }

    if (!this.estA) {
      const cleA = RegCles.get(this.id)
      this.idp = RegCles.set(await decrypter(cleA, row.clePA))
      this.del = row.del
      this.rdsp = RegRds.set(row.rdsp)
    }

    this.mpg = new Map()
    for(const idx in row.mpg) {
      const idg = ID.long(parsInt(idx), ns)
      const e = row.mpg[idx]
      RegCles.set(await decrypter(clek, e.cleGK))
      RegRds.set(e.rds)
      const sav = new Set()
      for(const idx2 in e.lp) sav.add(ID.long(parseInt(idx2), ns))
      this.mpg.set(idg, sav)
    }

    if (this.estComptable) {
      RegCles.set(await decrypter(clek, row.cleEK))
      this.tp = new Array(row.tp.length)
      for(let i = 0; i < row.tp.length; i++) {
        const e = row.tp[i]
        if (e && !e.vide) {
          const c = decode(await decrypter(clek, e.c))
          RegCles.set(c.cleP)
          this.tp[i] = { code: c.code, qc: e.qc, qn: e.qn, qv: e.qv}
        } else this.tp[i] = null
      }
    }
  }

  // retourne le code de la partition id (Comptable)
  codeP (id) { 
    const n = ID.court(id)
    if (!this.tp) return '#' + n
    const a = this.tp[n]
    return a && a.code ? a.code : '#' + n
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
  
  /* Ids des groupes de l'avatar ida (tous avatars si ida absent) */
  idGroupes (ida) {
    const x = new Set()
    if (ida) this.mpg.forEach((sav, idg) => { if (ida && sav.has(ida)) x.add(idg) })
    else this.mpg.forEach((sav, idg) => { x.add(idg)})
    return x
  }

  /*
  // im de l'avatar ida dans le groupe idg
  imGA (idg, ida) {
    for (const [ ,e]  of this.mpg){
      if (e.ng.id === idg && e.id === ida) return e.im
    }
    return 0
  }

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

  // Map (cle:im val:na) des avc participants au groupe idg, 
  // et sur option invits ayant une invitation dans le groupe 
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

  // Map(im, na) des avatars du compte participant à idg d'après membres
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

  static async atrItem (clet, info, q) {
    const session = stores.session
    const item = {clet, info, q}
    return await crypter(session.clek, new Uint8Array(encode(item)))
  }

  static async mavkKV (na) {
    return await crypter(stores.session.clek, new Uint8Array(encode([na.nomx, na.rnd])))
  }

  static async mavkK (id) {
    return hash(await crypter(stores.session.clek, '' + ID.court(id), 1))
  }
  */
}

/** Compta **********************************************************************
_data_ :
- `id` : numéro du compte = id de son avatar principal.
- `v` : 1..N.

- `rds`
- `dhvuK` : date-heure de dernière vue des notifications par le titulaire du compte, cryptée par la clé K.
- `qv` : `{qc, qn, qv, nn, nc, ng, v}`: quotas et nombre de groupes, chats, notes, volume fichiers. Valeurs courantes.
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
    - `hashtags` : liste des hashtags attribués par le compte. (compilé ==> ht: Set)
    - `texte` : commentaire écrit par le compte.

Juste après une conversion de compte "O" en "A", `ticketsK` est vide et le `solde` est de 2c.
*/
export class Compta extends GenDoc {
  get rds () { return RegRds.rds(this.id) }

  async compile (row) {
    this.vsh = row.vsh || 0
    const clek = stores.session.clek
    const ns = ID.ns(this.id)
    RegRds.set(row.rds)

    this.dhvu = row.dhvuK ? parseInt(await decrypterStr(clek, row.dhvuK)) : 0
    this.qv = row.qv
    this.compteurs = new Compteurs(row.compteurs, this.qv)
    this.pc = this.compteurs.pourcents.max
    this.solde = row.solde || 0
    if (row.ticketsK) this.tickets = decode(await decrypter(clek, row.ticketsK))
    this.estA = this.tickets !== undefined
    this.apropos = new Map()
    if (row.apropos) for(const idx in row.apropos) {
      const id = ID.long(parseInt(idx, ns))
      const x = decode(await decrypter(clek, row.apropos[idx]))
      this.apropos.set(id, { ht: new Set(x.hashtags || []), texte: x.texte || ''})
    }
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

/** Avatar *********************************************************
_data_:
- `id` : id de l'avatar.
- `v` : 1..N. Par convention, une version à 999999 désigne un **avatar logiquement détruit** mais dont les données sont encore présentes. L'avatar est _en cours de suppression_.
- `vcv` : version de la carte de visite afin qu'une opération puisse détecter (sans lire le document) si la carte de visite est plus récente que celle qu'il connaît.
- `hZR` : `ns` + hash du PBKFD de la phrase de contact réduite.

- `rds`

- `cleAZC` : clé A cryptée par ZC (PBKFD de la phrase de contact complète).
- `pcK` : phrase de contact complète cryptée par la clé K du compte.

- `cvA` : carte de visite de l'avatar `{v, photo, texte}`. photo et texte cryptés par la clé A de l'avatar.
- `pub privK` : couple des clés publique / privée RSA de l'avatar.

- `invits`: map des invitations en cours de l'avatar:
  - _clé_: `idav/idg` id court de l'avatar invité / id court du groupe.
  - _valeur_: `{cleGA, rds, cvg, im, ivpar, dh}` 
    - `cleGA`: clé du groupe crypté par la clé A de l'avatar.
    - `rds`: du groupe. ??? intérêt. Sera obtenu à l'acceptation
    - `cvG` : carte de visite du groupe (photo et texte sont cryptés par la clé G du groupe)
    - `im`: indice du membre dans la table `tid` du groupe.
    - `ivpar` : indice `im` de l'invitant.
    - `dh` : date-heure d'invitation. Le couple `[ivpar, dh]` permet de retrouver l'item dans le chat du groupe donnant le message de bienvenue / invitation émis par l'invitant.
  Compilé en : { idav, idg, rds, im, ivpar, dh }
*/
export class Avatar extends GenDoc {
  get rds () { return RegRds.rds(this.id) }

  /** compile *********************************************************/
  async compile (row) {
    this.vsh = row.vsh || 0
    const clek = stores.session.clek
    const ns = ID.ns(this.id)
    RegRds.set(row.rds)
    // this.vcv = row.vcv || 0
    // this.hZR = row.hZR

    if (row.pcK) { // phrase de contact cryptée par la clé K.
      // this.cleAZC = row.cleAZC
      this.pc = await decrypterStr(clek, row.pcK)
    }

    const clea = RegCles.get(this.id)
    const cv = row.cvA ? await CV.set(row.cvA) : CV.fake(this.id)
    cv.store()
    this.privK = row.privK

    this.invits = new Map()
    if (row.invits) {
      for (const nx in row.invits) {
        const { id, ids } = splitPK(nx)
        const idav = ID.long(id, ns)
        const idg = ID.long(ids, ns)
        const e = row.invits[nx] // {cleGA, rds, cvg, im, ivpar, dh}
        const cleG = await decrypter(clea, e.cleGA)
        RegCles.set(cleG)
        await CV.set(e.cvG).store()
        RegRds.set(e.rds)
        const inv = { idav, idg, im: e.im, ivpar: e.ivpar, dh: e.dh }
        this.invits.set(nx, inv)
      }
    }
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
- `dh`: date-heure du dernier changement d'état.
- `cleAYC` : clé A du sponsor crypté par le PBKFD de la phrase complète de sponsoring.
- `partitionId`: id de la partition si compte 0
- `clePYC` : clé P de sa partition (si c'est un compte "O") cryptée par le PBKFD de la phrase complète de sponsoring (donne le numéro de partition).
- `nomYC` : nom du sponsorisé, crypté par le PBKFD de la phrase complète de sponsoring.
- `del` : `true` si le sponsorisé est délégué de sa partition.
- `cvA` : CV du sponsor, textes cryptés par sa cle A.
- `quotas` : `[qc, q1, q2]` quotas attribués par le sponsor.
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
    this.vsh = row.vsh || 0
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
    this.ard = await decrypterStr(this.YC, row.ardYC)
    if (!this.estA) this.cleP = await decrypter(this.YC, row.clePYC)
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
    this.cleA = await decrypter(this.YC, row.cleAYC)
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
    this.vsh = row.vsh || 0
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
- `cvA` : `{v, photo, info}` carte de visite de E au moment de la création / dernière mise à jour du chat (textes cryptés par sa clé A).
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
    this.vsh = row.vsh || 0
    const ns = ID.ns(this.id)

    this.st = row.st
    this.idE = ID.long(row.idE, ns)
    this.idsE = ID.long(row.idsE, ns)

    this.cleCKP = row.cleCKP
    this.clec = await RegCc.get(this)

    let cleE = RegCles.get(this.idE)
    if (!cleE) {
      cleE = await decrypter(this.clec, row.cleEC)
      RegCles.set(cleE)
    }
    const cvx = row.cvA || CV.fake(this.idE)
    const cvE = await CV.set(cvx)
    cvE.store()
    const cvI = session.getCV(this.id)

    this.items = []
    const a = []
    const supp = $t('supprime')
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

- `rds`
- `qn qv n v`: nombres de notes actuel et maximum attribué par l'hébergeur, volume total actuel des fichiers des notes et maximum attribué par l'hébergeur.
- `idh` : id du compte hébergeur (pas transmise aux sessions).
- `imh` : indice `im` du membre dont le compte est hébergeur.
- `msu` : mode _simple_ ou _unanime_.
  - `null` : mode simple.
  - `[ids]` : mode unanime : liste des indices des animateurs ayant voté pour le retour au mode simple. La liste peut être vide mais existe.
- `tid` : table des ids courts des membres.
- `flags` : tables des flags.
- `lng` : liste noire _groupe_ des ids (courts) des membres.
- `lnc` : liste noire _compte_ des ids (courts) des membres.
- `cvG` : carte de visite du groupe, textes cryptés par la clé du groupe `{v, photo, info}`.
*/

export class Groupe extends GenDoc {
  get rds () { return RegRds.rds(this.id) }

  async compile (row) {
    this.vsh = row.vsh || 0
    const ns = ID.ns(this.id)
    RegRds.set(row.rds)

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
    this.lng = new Array(row.lng.length)
    row.lng.forEach((id, i) => { this.lng[i] = ID.long(id, ns)})
    this.lnc = new Array(row.lnc.length)
    row.lnc.forEach((id, i) => { this.lnc[i] = ID.long(id, ns)})
    await CV.set(row.cvG).store()
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
      const cv = pSt.getCV(idm) || await CV.set(null, idm)
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
  avatars: Avatar,
  groupes: Groupe,
  notes: Note,
  sponsorings: Sponsoring,
  chats: Chat,
  membres: Membre,
  chatgrs: Chatgr
}
