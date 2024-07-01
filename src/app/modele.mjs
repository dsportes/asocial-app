import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import mime2ext from 'mime2ext'
import { $t, hash, rnd6, u8ToB64, gzipB, ungzipB, gzipT, ungzipT, titre, suffixe, dhstring } from './util.mjs'
import { pbkfd, sha256, crypter, decrypter, decrypterStr, decrypterRSA } from './webcrypto.mjs'
import { ID, Cles, isAppExc, d14, Compteurs, AMJ, nomFichier, 
  synthesesPartition, FLAGS, UNITEN, UNITEV } from './api.mjs'
import { DownloadFichier } from './operations.mjs'

import { idb } from './db.mjs'

// FAKE
export class Motscles {}

// const decoder = new TextDecoder('utf-8')
const encoder = new TextEncoder('utf-8')

/* classe RegCles : registre des clés connues dans la session **********
- `reset ()` : réinitialisation en début de session
- `get (id)` : retourne la clé enregistrée avec cette id
- `set (cle)` : enregistré la clé sous son id
*/
export class RegCles {
  static registre = new Map()

  static reset () { 
    RegCles.registre.clear()
    RegCc.reset()
  }

  static get (id) { 
    return ID.estComptable(id) ? Cles.comptable() : RegCles.registre.get(id) 
  }

  static set (cle) {
    const id = Cles.id(cle)
    RegCles.registre.set(id, cle)
    return cle
  }
}

/* classe RegCc : registre des clés des chats ******************************
*/
export class RegCc {
  static registre = new Map() // clé: ids d'un chat - valeur: clé C du chat
  static regpriv = new Map() // clé: id d'un avatar du compte - valeur: clé privée

  static reset () { RegCc.registre.clear(); RegCc.regpriv.clear() }

  static async setPriv (id, privK) {
    if (!RegCc.regpriv.has(id)) {
      const priv = await decrypter(stores.session.clek, privK)
      RegCc.regpriv.set(id, priv)
    }
    return RegCc.regpriv.get(id)
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
      c.id = cv.id
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

  static fake (id) { return new CV(id) }

  constructor (id, v, ph, tx) {
    this.id = id
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
    return '#' + this.id
  }

  get nom () {
    if (!this.tx) return this.texte
    let i = this.tx.indexOf('\n')
    let l = i === -1 ? this.tx : this.tx.substring(0, i)
    l = (l.replaceAll('#', '')).trim()
    return l.length < 16 ? l : l.substring(0, 16)
  }

  get nom8 () { const n = this.nom; return n.length < 8 ? n : n.substring(0, 6) + '...' }

  get nomC () {
    if (!this.tx) return this.texte
    const s = '' + this.id
    return this.nom + '#' + s.substring(s.length - 4)
  }

  /* Retourne un objet {id,v,ph,tx} ph/tx cryptés (pas une CV)*/
  async crypter(cle) {
    return {
      id: this.id,
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
    n.texte = ntf.texte ? await decrypterStr(cle, ntf.texte) : ''
    if (ntf.idDel) n.idDel = ntf.idDel
    return new Notification(n)
  }

  async crypt(cle) {
    const n = { nr: this.nr, dh: this.dh }
    if (this.idDel) n.idDel = this.idDel
    n.texte = this.texte ? await crypter(cle, this.texte) : ''
    return n
  }

  constructor ({nr, dh, texte, idDel}) {
    if (idDel) this.idDel = idDel
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
  // _zombi : objet n'ayant pas de _data_
  if (!row._data_ || !row._data_.length) {
    obj.id = ID.court(row.id || 0)
    if (row.ids !== undefined) obj.ids = ID.court(row.ids)
    obj.v = row.v || 0
    obj._zombi = true
  } else {
    const x = decode(row._data_)
    obj.id = x.id || 0
    if (x.ids !== undefined) obj.ids = x.ids
    if (x.dlv !== undefined) obj.dlv = x.dlv
    if (row.dfh !== undefined) obj.dfh = x.dfh
    obj.vsh = x.vsh || 0
    obj.v = x.v || 0  
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
- `cleES` : clé de l'espace cryptée par la clé du site. Permet au comptable de lire les reports créés sur le serveur et cryptés par cette clé E.
- `notifE` : notification pour l'espace de l'administrateur technique. Le texte n'est pas crypté.
- `opt`: option des comptes autonomes.
- `nbmi`: nombre de mois d'inactivité acceptable pour un compte O fixé par le comptable. Ce changement n'a pas d'effet rétroactif.
- `tnotifP` : table des notifications de niveau _partition_.
  - _index_ : id (numéro) de la partition.
  - _valeur_ : notification (ou `null`), texte crypté par la clé P de la partition.
*/
export class Espace extends GenDoc {

  async compile (row) {
    const session = stores.session
    this.org = row.org
    this.creation = row.creation
    this.cleES = row.cleES
    this.moisStat = row.moisStat || 0
    this.moisStatT = row.moisStatT || 0
    this.opt = row.opt || 0
    this.nprof = row.nprof || 0
    this.dlvat = row.dlvat || 0
    this.nbmi = row.nbmi || 6
    this.notifE = row.notifE ? new Notification(row.notifE) : null
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
    this.prochNp = row.tsp.length
    for (let i = 1; i < row.tsp.length; i++) {
      const r = row.tsp[i] || null
      if (r) {
        r.id = i
        r.pcac = !r.q.qc ? 0 : Math.round(r.qt.qc * 100 / r.q.qc) 
        r.pcan = !r.q.qn ? 0 : Math.round(r.qt.qn * 100 / r.q.qn) 
        r.pcav = !r.q.qv ? 0 : Math.round(r.qt.qv * 100 / r.q.qv) 
        r.pcc = !r.q.qc ? 0 : Math.round(r.qt.c2m * 100 / r.q.qc) 
        r.pcn = !r.q.qn ? 0 : Math.round(r.qt.n * 100 / (r.q.qn * UNITEN)) 
        r.pcv = !r.q.qv ? 0 : Math.round(r.qt.v * 100 / (r.q.qv * UNITEV)) 
      
        a.nbc += r.nbc
        a.nbd += r.nbd
        a.ntfp[0] += r.ntfp[0]; a.ntfp[1] += r.ntfp[1]; a.ntfp[2] += r.ntfp[2]
        a.ntf[0] += r.ntf[0]; a.ntf[1] += r.ntf[1]; a.ntf[2] += r.ntf[2]
        Synthese.l1.forEach(f => { a.q[f] += r.q[f] })
        Synthese.l2.forEach(f => { a.qt[f] += r.qt[f] })
        this.tsp.push(r)
      } else this.tsp.push(null)
    }
    a.pcac = !a.q.qc ? 0 : Math.round(a.qt.qc * 100 / a.q.qc) 
    a.pcan = !a.q.qn ? 0 : Math.round(a.qt.qn * 100 / a.q.qn) 
    a.pcav = !a.q.qv ? 0 : Math.round(a.qt.qv * 100 / a.q.qv) 
    a.pcc = !a.q.qc ? 0 : Math.round(a.qt.c2m * 100 / a.q.qc) 
    a.pcn = !a.q.qn ? 0 : Math.round(a.qt.n * 100 / (a.q.qn * UNITEN)) 
    a.pcv = !a.q.qv ? 0 : Math.round(a.qt.v * 100 / (a.q.qv * UNITEV)) 
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
    - `notif`: notification du compte cryptée par la clé P de la partition (redonde celle dans compte).
    - `cleAP` : clé A du compte crypté par la clé P de la partition.
    - `del`: `true` si c'est un délégué.
    - `q` : `qc qn qv c2m nn nc ng v` extraits du document `comptas.qv` du compte.
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

  async compile (row) {
    this.vsh = row.vsh || 0
    const clep = RegCles.get(this.id)
    this.nrp = row.nrp || 0
    this.q = row.q
    this.mcpt = {}
    this.sdel = new Set() // Set des délégués
    
    if (row.mcpt) for(const idx in row.mcpt) {
      const id = parseInt(idx)
      const e = row.mcpt[idx]
      RegCles.set(await decrypter(clep, e.cleAP))
      const q = { ...e.q }
      q.pcc = !q.qc ? 0 : Math.round(q.c2m * 100 / q.qc) 
      q.pcn = !q.qn ? 0 : Math.round((q.nn + q.nc + q.ng) * 100 / (q.qn * UNITEN)) 
      q.pcv = !q.qv ? 0 : Math.round(q.v * 100 / (q.qv * UNITEV)) 
      const r = { id: id, q: e.q }
      if (e.notif && clep) r.notif = await Notification.decrypt(e.notif, clep)
      if (e.del) { this.sdel.add(id); r.del = true }
      this.mcpt[id] = r
    }
    this.synth = synthesesPartition(this)
  }

  estDel (id) {
    const e = this.mcpt[id]
    return e && e.del
  }

  get nbDels () { let n = 0; this.mcpt.forEach(e => { if (e.del) n++ }); return n }

  estCpt (id) { return this.mcpt[id] !== undefined }
}

/** Compte **********************************************************************
_data_ :
- `id` : numéro du compte = id de son avatar principal.
- `v` : 1..N.
- `hk` : `ns` + `hXR`, hash du PBKFD d'un extrait de la phrase secrète.
- `dlv` : dernier jour de validité du compte.

- `rds` : null en session.
- `hXC`: hash du PBKFD de la phrase secrète complète (sans son `ns`).
- `cleKXC` : clé K cryptée par XC (PBKFD de la phrase secrète complète).
- `cleEK` : clé de l'espace cryptée par la clé K du compte, à la création de l'espace pour le Comptable. Permet au comptable de lire les reports créés sur le serveur et cryptés par cette clé E.
- `privK` : clé privée RSA de son avatar principal cryptée par la clé K du compte.

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
    const session = stores.session
    const cfg = stores.config
    const clek = session.clek || await session.setIdClek(this.id, row.cleKXC)
    if (row.cleEK) this.cleE = await decrypter(clek, row.cleEK)
    this.priv = await RegCc.setPriv(this.id, row.privK)
    this.dhvu = row.dhvuK ? parseInt(await decrypterStr(clek, row.dhvuK)) : 0
    this.qv = row.qv

    this.dlv = row.dlv
    this.nbj = AMJ.diff(this.dlv, session.auj)
    if (this.nbj > 999) this.nbj = 999
    this.alerteDlv = cfg.alerteDlv > this.nbj
    // this.alerteDlv = this.nbj > 5 // test

    if (this.estComptable) {
      this.mcode = new Map()
      for(let i = 1; i < row.tpk.length; i++) {
        const x = row.tpk[i]
        if (x) {
          const { cleP, code } = decode(await decrypter(clek, x))
          RegCles.set(cleP)
          const idp = Cles.id(cleP)
          if (code) this.mcode.set(idp, code)
        }
      }
    }

    if (row.idp) {
      this.estA = false
      this.idp = row.idp
      if (row.clePK.length === 256) this.clep = RegCles.set(await decrypterRSA(this.priv, row.clePK))
      else this.clep = RegCles.set(await decrypter(clek, row.clePK))
      this.del = row.del || false
      if (row.notif) this.notif = await Notification.decrypt(row.notif, this.clep)
      else this.notif = null
    } else this.estA = true

    this.mav = new Set()
    for(const idx in row.mav) {
      const e = row.mav[idx]
      const id = parseInt(idx)
      RegCles.set(await decrypter(clek, e.cleAK))
      this.mav.add(id)
    }

    this.mpg = new Map()
    for(const idx in row.mpg) {
      const idg = parseInt(idx)
      const e = row.mpg[idx]
      RegCles.set(await decrypter(clek, e.cleGK))
      this.mpg.set(idg, new Set(e.lav))
    }
  }

  get lstAvatars () {
    const session = stores.session
    const l = []
    for (const id of this.mav) { const cv = session.getCV(id); l.push({id, cv, nom: cv.nom }) }
    if (l.length > 1) l.sort((a, b) => {
      return a.id === this.id ? -1 : (a.id === this.id ? 1 : (a.nom < b.nom ? -1 : (a.nom > b.nom ? 1 : 0))) 
    })
    return l
  }

  // Retourne [amb, amo] - un avatar au moins accède aux membres / notes du groupe
  ambano (groupe) {
    let ano = false, amb = false
    const sav = this.mpg.get(groupe.id)
    if (sav) {
      for(const idav of sav) {
        const im = groupe.mmb.get(idav)
        if (im) {
          const f = groupe.flags[im]
          if ((f & FLAGS.AM) && (f & FLAGS.DM)) amb = true
          if ((f & FLAGS.AN) && (f & FLAGS.DN)) ano = true  
        }
      }
    }
    return [amb, ano]
  }

  avatarDeNom (nom) {
    const session = stores.session
    for(const ida of this.mav) {
      const cv = session.getCV(ida)
      if (cv.nom === nom) return ida 
    }
    return null
  }
  
  /* Id des groupes de l'avatar ida (tous avatars si ida absent) */
  idGroupes (ida) {
    const x = new Set()
    this.mpg.forEach((sav, idg) => { if (!ida || sav.has(ida)) x.add(idg) })
    return x
  }

  /* Map(ida, im) des avatars du compte dans mpg 
  ou les invits des avatars
  imIdGroupe (idg) { // map (cle:id val:im) pour le groupe idg
    const m = new Map()
    this.mpg.forEach((sav, id) => { 
      if (id === idg && sav && sav.size) 
        sav.forEach(im => {m.set(id, im)})
    })
    return m
    /*
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
  - `tickets`: map des tickets / dons:
    - _clé_: `ids`
    - _valeur_: `{dg, dr, ma, mc, refa, refc, di}`
  - `dons` : liste des dons effectués / reçus `[{ dh, m, iddb }]`
    - `dh`: date-heure du don
    - `m`: montant du don (positif ou négatif)
    - `iddb`: id du donateur / bénéficiaire (selon le signe de `m`).
*/
export class Compta extends GenDoc {

  async compile (row) {
    const clek = stores.session.clek

    this.qv = row.qv
    this.compteurs = new Compteurs(row.compteurs, this.qv)
    this.pc = this.compteurs.pourcents // {pcc, pcn, pcv, max}
    this.solde = row.solde || 0
    this.tickets = row.tickets || {}
    this.dons = row.dons || []
    this.estA = !this.qv.qc
  }

}

/* Classe compti ****************************************************
_data_:
- `id` : id du compte.
- `v` : version.

- `mc` : map à propos des contacts (des avatars) et des groupes _connus_ du compte,
  - _cle_: `id` court de l'avatar ou du groupe,
  - _valeur_ : `{ ht, tx }`.
    - `ht` : suite des hashtags séparés par un espace attribués par le compte et cryptée par la clé K du compte.
    - `tx` : commentaire écrit par le compte gzippé et crypté par la clé K du compte.
*/
export class Compti extends GenDoc {

  async compile (row) {
    const clek = stores.session.clek
    this.mc = new Map()
    if (row.mc) for(const idx in row.mc) {
      const x = row.mc[idx]
      const id = parseInt(idx)
      const y = x.ht ? await decrypterStr(clek, x.ht) : null
      const ht = new Set(y ? y.split(' ') : new Set())
      let tx = ''
      const b = x.tx ? await decrypter(clek, x.tx) : null
      tx = x.tx ? ungzipB(b) : ''
      this.mc.set(id, { ht, tx })
    }
  }

  aHT (id, s) {
    const x = this.mc.get(id)
    if (!x || !s || !s.size) return false
    for(const t of s) if (x.ht.has(t)) return true
    return false
  }
  
}

/**Invits *********************************************************
 * - `invits`: liste des invitations en cours:
  - _valeur_: `{idg, ida, cleGA, cvG, ivpar, dh}`
    - `idg`: id du groupe,
    - `ida`: id de l'avatar invité
    - `cleGA`: clé du groupe crypté par la clé A de l'avatar.
    - `cvG` : carte de visite du groupe (photo et texte sont cryptés par la clé G du groupe).
    - `flags` : d'invitation.
    - `invpar` : `[{ cleAG, cvA }]`
      - `cleAG`: clé A de l'avatar invitant crypté par la clé G du groupe.
      - `cvA` : carte de visite de l'invitant (photo et texte sont cryptés par la clé G du groupe). 
    - `msgG` : message de bienvenue / invitation émis par l'invitant.
*/
export class Invit extends GenDoc {

  async compile (row) {
    const session = stores.session
    const clek = session.clek
    this.invits = []
    if (row.invits) {
      for (const e of row.invits) {
        const clea = RegCles.get(e.ida)
        const cleg = RegCles.set(await decrypter(clea, e.cleGA))
        const cv = await CV.set(e.cvG || CV.fake(e.idg))
        cv.store()
        const s = new Set()
        if (e.invpar) for (const x of e.invpar) {
          const clei = RegCles.set(await decrypter(cleg, x.cleAG))
          s.add(Cles.id(clei))
          const cvA = await CV.set(x.cvA || CV.fake(e.idg))
          cvA.store()
        }
        const b = e.msgG ? await decrypter(cleg, e.msgG) : null
        const msg = b ? ungzipB(b) : ''
        this.invits.push({ idg: e.idg, ida: e.ida, flags: e.flags, invpar: s, msg })
      }
    }
  }

}

/** Avatar *********************************************************
_data_:
- `id` : id de l'avatar.
- `v` : 1..N. Par convention, une version à 999999 désigne un **avatar logiquement détruit** mais dont les données sont encore présentes. L'avatar est _en cours de suppression_.
- `vcv` : version de la carte de visite afin qu'une opération puisse détecter (sans lire le document) si la carte de visite est plus récente que celle qu'il connaît.
- `hZR` : `ns` + hash du PBKFD de la phrase de contact réduite.

- `rds` : pas transmis en session.
- `idc` : id du compte de l'avatar (égal à son id pour l'avatar principal).
- `cleAZC` : clé A cryptée par ZC (PBKFD de la phrase de contact complète).
- `pcK` : phrase de contact complète cryptée par la clé K du compte.
- `hZC` : hash du PBKFD de la phrase de contact complète.

- `cvA` : carte de visite de l'avatar `{id, v, photo, texte}`. photo et texte cryptés par la clé A de l'avatar.

- `pub privK` : couple des clés publique / privée RSA de l'avatar.
*/
export class Avatar extends GenDoc {

  /** compile *********************************************************/
  async compile (row) {
    const session = stores.session
    const clek = session.clek
    // this.vcv = row.vcv || 0
    // this.hZR = row.hZR

    if (row.pcK) { // phrase de contact cryptée par la clé K.
      // this.cleAZC = row.cleAZC
      this.pc = await decrypterStr(clek, row.pcK)
    }

    // this.idc = row.idc // inutile en session
    const clea = RegCles.get(this.id)
    const cv = await CV.set(row.cvA || CV.fake(this.id))
    cv.store()
    await RegCc.setPriv(this.id, row.privK)

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
*/
export class Sponsoring extends GenDoc {

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
*/
export class Ticket extends GenDoc {
  async compile (row) {
    this.dg = row.dg
    this.iddb = row.iddb || 0
    this.ma = row.ma || 0
    this.mc = row.mc || 0
    this.dr = row.dr || 0
    this.refa = row.refa || ''
    this.refc = row.refc || ''
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

    this.st = row.st
    this.idE = row.idE
    this.idsE = row.idsE

    this.cleCKP = row.cleCKP
    this.clec = await RegCc.get(this)

    let cleE = RegCles.get(this.idE)
    if (!cleE) {
      cleE = await decrypter(this.clec, row.cleEC)
      RegCles.set(cleE)
    }

    const cvE = await CV.set(row.cvE || CV.fake(this.idE))
    cvE.store()
    this.vcv = cvE.v
    const cvI = session.getCV(this.id)

    this.items = []
    const a = []
    this.tit = ''
    this.dh = 0
    if (row.items) for (const it of row.items) {
      let t = ''
      if (it.t) {
        const y = await decrypter(this.clec, it.t)
        t = ungzipB(y)
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

}

/** Groupe ***********************************************************************
_data_:
- `id` : id du groupe.
- `v` :  1..N, Par convention, une version à 999999 désigne un **groupe logiquement détruit** mais dont les données sont encore présentes. Le groupe est _en cours de suppression_.
- `dfh` : date de fin d'hébergement.

- `rds` : pas transmis en session.
- `nn qn vf qv`: nombres de notes actuel et maximum attribué par l'hébergeur, volume total actuel des fichiers des notes et maximum attribué par l'hébergeur.
- `idh` : id du compte hébergeur (pas transmise aux sessions).
- `imh` : indice `im` du membre dont le compte est hébergeur.
- `msu` : mode _simple_ ou _unanime_.
  - `null` : mode simple.
  - `[ids]` : mode unanime : liste des indices des animateurs ayant voté pour le retour au mode simple. La liste peut être vide mais existe.
- `invits` : map `{ fl, li[] }` des invitations en attente de vote ou de réponse.
- `tid` : table des ids courts des membres.
- `st` : table des statuts.
- `flags` : tables des flags.
- `lng` : liste noire _groupe_ des ids (courts) des membres.
- `lnc` : liste noire _compte_ des ids (courts) des membres.
- `cvG` : carte de visite du groupe, textes cryptés par la clé du groupe `{v, photo, info}`.

Calculée : mmb: Map des membres. Clé: id long du membre, Valeur: son im
*/

export class Groupe extends GenDoc {

  async compile (row) {
    this.qn = row.qn; this.qv = row.qv; this.nn = row.nn; this.vf = row.vf
    this.imh = row.imh
    this.msu = row.msu || null
    this.invits = row.invits || {}

    this.mmb = new Map()
    this.tid = new Array(row.tid.length)
    for (let im = 0; im < row.tid.length; im++) { 
      const id = row.tid[im]
      if (id) {
        this.tid[im] = id
        this.mmb.set(id, im)
      }
    }
    this.flags = row.flags
    this.st = row.st
    this.lng = new Set()
    if (row.lng) row.lng.forEach(id => { this.lng.add(id)})
    this.lnc = new Set()
    if (row.lnc) row.lnc.forEach(id => { this.lnc.add(id)})
    const cv = await CV.set(row.cvG || CV.fake(this.id))
    cv.store()
    const nx = [0, 0, 0, 0, 0, 0]
    this.st.forEach(st => { nx[st]++ });
    this.nbContacts = nx[1]
    this.nbPreInvites = nx[2]
    this.nbInvites = nx[3]
    this.nbActifs = nx[4] + nx[5]
    this.nbAnims = nx[5]
    this.sts = nx
  }
  
  // imDeId (id) { return this.mmb.get(id) || 0 }

  estRadie (im)  { return this.st[im] === 0 }
  // estContact (im) { return this.st[im] === 1 }
  //.estPreInvite (im) { return this.st[im] === 2 }
  estInvite (im) { return this.st[im] === 3 }
  estActif (im) { return this.st[im] >= 4 }
  estAnim (im) { return this.st[im] === 5 }
  estAuteur (im) { const f = this.flags[im] || 0; 
    return im && (f & FLAGS.AN) && (f & FLAGS.DN) && (f & FLAGS.DE) 
  }
  // estInvitable (id) { const im = this.mmb.get(id); 
  //  return (!im || (this.st[im] === 1)) && !this.lnc.has(id) && !this.lng.has(id)
  //}
  // estContactable (id) { return !this.mmb.get(id) && !this.lnc.has(id) && !this.lng.has(id) }

  estHeb (im) { return this.estActif(im) && im === this.imh }

  accesMembre (im) {
    const f = this.flags[im] || 0;
    return im && this.estActif(im) && (f & FLAGS.AM) && (f & FLAGS.DM) 
  }
  aUnAccesMembre (s) { // Set des im
    let b = false
    s.forEach(im => { if (this.accesMembre(im)) b = true})
    return b
  }
  /*
  accesMembreNA (im) { // accès aux membres NON activé 0: pas accès
    if (!im || !this.estActif(im)) return 0
    const f = this.flags[im] || 0
    return (f & FLAGS.AC) && !(f & FLAGS.AM) && (f & FLAGS.DM) ? 1 : 0
  }
  */
 // A un accès aux membres et aux notes en écriture
  aUnAccesMNE (s) { // Set des im
    let b = false
    s.forEach(im => { 
      if (this.accesMembre(im) || this.accesNote2(im) === 2) b = true
    })
    return b
  }

  accesNote (im) {
    const f = this.flags[im] || 0;
    return im && this.estActif(im) && (f & FLAGS.AN) && (f & FLAGS.DN) 
  }
  accesNote2 (im) {
    const f = this.flags[im] || 0;
    const x = im && this.estActif(im) && (f & FLAGS.AN) && (f & FLAGS.DN) 
    if (!x) return 0
    return (f & FLAGS.DE) ? 2 : 1
  }
  aUnAccesNote (s) { // Set des im
    let b = false
    s.forEach(im => { if (this.accesNote(im)) b = true})
    return b
  }
  /*
  accesNoteE (im) {
    const f = this.flags[im] || 0;
    return im && this.estActif(im) && (f & FLAGS.AN) && (f & FLAGS.DE) 
  }
  */
  accesLecNoteH (im) { // 0:jamais, 1:oui, 2:l'a eu, ne l'a plus
    const f = this.flags[im] || 0 
    if ((f & FLAGS.AC) && (f & FLAGS.AN) && (f & FLAGS.DN)) return 1
    return f & FLAGS.HN ? 2 : 0
  }
  accesEcrNoteH (im) { // 0:jamais, 1:oui, 2:l'a eu, ne l'a plus
    const f = this.flags[im] || 0
    if ((f & FLAGS.AC) && (f & FLAGS.AN) && (f & FLAGS.DE)) return 1
    return f & FLAGS.HE ? 2 : 0
  }

  /* acces aux notes activable: 
  - 0:pas activable 
  - 1: déjà activé
  - 2:activable en lect, 
  - 3:activable en ecr 
  accesNoteNA (im) { 
    const f = this.flags[im] || 0
    if (!im || !this.estActif(im) || !(f & FLAGS.DN)) return 0
    return !(f & FLAGS.AN) ? (f & FLAGS.DE ? 3 : 2) : 1
  }
  */
  /*
  actifH (im) { // 0:jamais, 1:oui, 2:l'a été, ne l'est plus
    const f = this.flags[im] || 0; const h = this.hists[im] || 0; 
    if (f & FLAGS.AC) return 1
    return h & FLAGS.HA ? 2 : 0
  }
  */
  accesMembreH (im) { // 0:jamais, 1:oui, 2:l'a eu, ne l'a plus
    const f = this.flags[im] || 0
    if ((f & FLAGS.AC) && (f & FLAGS.AM) && (f & FLAGS.DM)) return 1
    return f & FLAGS.HM ? 2 : 0
  }

  // mis dans la liste noire par un animateur
  enLNG (ida) { return this.lng.has(ida) }
  // mis dans la liste noire par le compte lui-même
  enLNC (ida) { return this.lnc.has(ida) }

  /*
  get mbHeb () { // membre hébergeur
    const gSt = stores.groupe
    return  this.dfh ? null : gSt.getMembre(this.id, this.imh)
  }
  */

}

/** Membre ***********************************************************
- `id` : id du groupe.
- `ids`: identifiant, indice `im` de membre relatif à son groupe.
- `v` : 
- `vcv` : version de la carte de visite du membre.

- `dpc` : date de premier contact (ou de première invitation s'il a été directement invité).
- `ddi` : date de la dernière invitation (envoyée au membre, c'est à dire _votée_).
- **dates de début de la première et fin de la dernière période...**
  - `dac fac` : d'activité.
  - `dln fln` : d'accès en lecture aux notes.
  - `den fen` : d'accès en écriture aux notes.
  - `dam fam` : d'accès aux membres.
- `cleAG` : clé A de l'avatar membre cryptée par la clé G du groupe.
- `cvA` : carte de visite du membre `{id, v, photo, info}`, textes cryptés par la clé A de l'avatar membre.
- `msgG`: message d'invitation crypté par la clé G pour une invitation en attente de vote ou de réponse. 
*/
export class Membre extends GenDoc {
  async compile (row) {
    this.vsh = row.vsh || 0
    this.dpc = row.dpc || 0
    this.ddi = row.ddi || 0
    this.dac = row.dac || 0
    this.fac = row.fac || 0
    this.dln = row.dln || 0
    this.fln = row.fln || 0
    this.den = row.den || 0
    this.fen = row.fen || 0    
    this.dam = row.dam || 0
    this.fam = row.fam || 0
    const cleg = RegCles.get(this.id)
    const clea = await decrypter(cleg, row.cleAG)
    RegCles.set(clea)
    this.ida = Cles.id(clea)
    const cv = await CV.set(row.cvA || CV.fake(this.ida))
    cv.store()
    this.vcv = cv.v
    this.msg = row.msgG ? ungzipB(await decrypter(cleg, row.msgG)) : ''
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
    const cle = RegCles.get(this.id)
    this.items = []
    this.dh = 0
    this.tit = '?'
    if (row.items) for (const item of row.items) {
      const i = { im: item.im, dh: item.dh, t: '', dhx: item.dhx}
      if (!item.dhx) {
        i.t = ungzipB(await decrypter(cle, item.t))
        if (!this.tit && i.t) this.tit = titre(i.t)
      }
      if (this.dh === 0) this.dh = i.dhx ? i.dhx : i.dh
      this.items.push(i)
    }
  }

  get txt () {
    const g = stores.groupe.groupe.get(this.id)
    const session = stores.session
    const a = []
    if (this.items) for (const item of this.items) {
      const idm = g.tid[i.im]
      if (!idm) continue
      const cv = session.getCV(idm)
      a.push('_**' + $t('dedh', [cv.nomC, dhstring(i.dh)]) + '**_')
      if (i.dhx) a.push('\n' + $t('supprime', [dhstring(i.dhx)]) + '\n')
      else a.push('\n' + i.t + '\n')
    }
    return a.join('\n')
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

- `rds`:
- `im` : exclusivité dans un groupe. L'écriture est restreinte au membre du groupe dont `im` est `ids`. 
- `vf` : volume total des fichiers attachés.
- `ht` : liste des hashtags _personnels_ cryptée par la clé K du compte.
  - En session, pour une note de groupe, `ht` est le terme de `htm` relatif au compte de la session.
- `htg` : note de groupe : liste des hashtags cryptée par la clé du groupe.
- `htm` : note de groupe seulement, hashtags des membres. Map:
    - _clé_ : id courte du compte de l'auteur,
    - _valeur_ : liste des hashtags cryptée par la clé K du compte.
    - non transmis en session.
- `l` : liste des _auteurs_ (leurs `im`) pour une note de groupe.
- `d` : date-heure de dernière modification du texte.
- `texte` : texte (gzippé) crypté par la clé de la note.
- `mfa` : map des fichiers attachés.
- `ref` : triplet `[id, ids]` référence de sa note _parent_:

**A propos de `ref`**:
- Pour un note de groupe:
  - absent: rattachement _virtuel_ au groupe lui-même.
  - `[id, ids]` : 
    - `id`: du groupe (de la note), 
    - `ids`: de la note du groupe à laquelle elle est rattachée (possiblement supprimée)
- Pour un note personnelle:
  - absent: rattachement _virtuel_ à l'avatar de la note.
  - `[id, ids]` : 
    - `id`: de l'avatar (de la note), 
    - `ids`: de la note de l'avatar à laquelle elle est rattachée (possiblement supprimée).
  - `[id, 0]` : 
    - `id`: d'UN GROUPE, 
    - rattachement _virtuel_ au groupe lui-même, possiblement disparu / radié.
  - `[id, ids]` : 
    - `id`: d'UN GROUPE, possiblement disparu / radié.
    - `ids`: de la note de ce groupe à laquelle elle est rattachée (possiblement supprimée).
*/
export class Note extends GenDoc {
  static clen (id) { return ID.estGroupe(id) ? RegCles.get(id) : stores.session.clek }

  async compile (row) {
    this.vsh = row.vsh || 0
    this.deGroupe = ID.estGroupe(this.id)
    const clek = stores.session.clek
    this.cle = this.deGroupe ? RegCles.get(this.id) : clek

    this.im = row.im || 0
    let y = row.ht ? await decrypterStr(clek, row.ht) : null
    this.ht = new Set(y ? y.split(' ') : new Set())
    y = row.htg && this.deGroupe ? await decrypterStr(this.cle, row.htg) : null
    this.htg = new Set(y ? y.split(' ') : new Set())
    this.l = row.l || []
    this.d = row.d || 0

    const t = row.texte ? await decrypter(this.cle, row.texte) : null
    this.texte = t ? ungzipB(t) : ''
    this.titre = titre(this.texte)

    this.ref = row.ref || null

    this.mfa = new Map()
    if (this.vf && row.mfa) for (const idf in row.mfa) {
      const [lg, x] = row.mfa[idf]
      const f = decode(await decrypter(this.cle, x))
      f.idf = parseInt(idf)
      this.mfa.set(f.idf, f)
    }
  }

  get tousHt () { const s = new Set()
    this.ht.forEach(ht => { s.add(ht)})
    this.htg.forEach(ht => { s.add(ht)})
    return s
  }

  // Set des id des avatars du compte pouvant éditer la note ou sa racine
  static idasEdit (n) { // n : node du store notes
    const session = stores.session
    const lav = session.compte.mav
    if (!Note.estG(n.key)) return lav
    const s = new Set()
    const gSt = stores.groupe
    const e = gSt.egr(Note.idDeKey(n.key))
    if (!e) return s
    const gr = e.groupe
    for (const ida of lav) {
      const im = gr.mmb.get(ida)
      if (im && gr.accesNote2(im) === 2 &&
          (!this.im || this.im === im || gr.estAnim(im))) s.add(ida)
    }
    return s
  }

  static estG (key) { return key.charAt(0) === '3' }
  // key de la racine de rattachement SSI le rattachement est à une racine
  static pEstRac (pkey) { return pkey && pkey.length === 14 }
  // key de la racine de la note de rattachement SSI le rattachement est à une note
  static racNoteP (pkey) { return pkey && pkey.length > 14 ? pkey.substring(0, 14) : null }
  // id d'une key
  static idDeKey (key) { return parseInt(key.substring(0, 14)) }
  // ids d'une key
  static idsDeKey (key) { return parseInt(key.substring(15)) }

  get key () { return this.id + '/' + this.ids }
  /* clé du parent:
    - si elle n'est pas rattachée, c'est la racine (avatar ou groupe) de son id
    - sinon, c'est,
      - si ref[1] = 0 elle est rattachée à une autre racine (un groupe pour une note d'avatar): ref[0]
      - sinon c'est la note ref[0]/ref[1]
  */
  get pkey () {
    return !this.ref ? '' + this.id : (this.ref[1] ? this.ref[0] + '/' + this.ref[1] : '' + this.ref[0])
  }
  get rkey () { return '' + this.id }
  get refk () { return this.ref ? (this.ref[0] + (this.ref[1] ? '/' + this.ref[1] : '')) : '' }
  get rid () {  return this.ref ? this.ref[0] : 0 }
  get rids () {  return this.ref ? this.ref[1] : 0 }
  get shIds () { return ('' + (this.ids % 10000)).padStart(4, '0')}

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
  invits: Invit,
  comptis: Compti,
  avatars: Avatar,
  groupes: Groupe,
  notes: Note,
  sponsorings: Sponsoring,
  chats: Chat,
  membres: Membre,
  chatgrs: Chatgr
}
