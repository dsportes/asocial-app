import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import mime2ext from 'mime2ext'
import { $t, u8ToB64, gzipB, ungzipB, gzipT, ungzipT, titre, 
  dhstring, normNomFichier } from './util.mjs'
import { pbkfd, sha256, crypter, decrypter, decrypterStr, decrypterRSA } from './webcrypto.mjs'
import { ID, Cles, E_BRO, Compteurs, AMJ,
  synthesesPartition, synthesePartPC, FLAGS, UNITEN, UNITEV } from './api.mjs'
import { DownloadFichier } from './operations4.mjs'

import { idb } from './db.mjs'

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

  async init (texte) {
    this.phrase = texte
    const u8 = encoder.encode(texte)
    this.pcb = await pbkfd(u8)
    this.hpsc = Cles.hash9(this.pcb)
    const u8b = encoder.encode(texte.substring(0,12))
    const pr = await pbkfd(u8b)
    this.hps1 = Cles.hash9(pr)
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
    if (!this.id) return $t('nomDeAdmin')
    if (ID.estComptable(this.id)) return $t('nomDuComptable')
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
    return this.nom + '#' + this.id.substring(this.id.length - 4)
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
  - 3 : **restriction forte**
    - E : espace clos
    - P : accès minimal
    - C : accès minimal
- `dh` : date-heure de création.
- `texte`: il est crypté par: 
  - type E: la clé A du Comptable (que tous les comptes de l'espace ont).
  - types P et C par la clé P de la partition.
  - types Q et X: pas de texte, juste un code.
- `idDel`: id du délégué ayant créé cette notification pour un type P ou C quand ce n'est pas le Comptable.

**Remarque:** une notification `{ dh: ... }` correspond à la suppression de la notification antérieure (ni restriction, ni texte).
*/
export class Notification {
  // Factory construisant une objet Notification depuis sa forme cryptée
  static async decrypt (ntf, cle) {
    const n = { nr: ntf.nr || 0, dh: ntf.dh || 0, dh3: ntf.dh3 || 0 }
    n.texte = ntf.texte ? await decrypterStr(cle, ntf.texte) : ''
    if (ntf.idDel) n.idDel = ntf.idDel
    return new Notification(n)
  }

  async crypt(cle) {
    const n = { nr: this.nr, dh: this.dh, dh3: this.dh3 }
    if (this.idDel) n.idDel = this.idDel
    n.texte = this.texte ? await crypter(cle, this.texte) : ''
    return n
  }

  constructor ({nr, dh, dh3, texte, idDel}) {
    if (idDel) this.idDel = idDel
    this.nr = nr || 0
    this.texte = texte || ''
    this.dh = dh || Date.now() 
    this.dh3 = dh3 || 0
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
export async function compile (row) { // row est le row._data_ du serveur
  if (!row) return null
  const x = decode(row)
  const cl = classes[x._nom]
  if (!cl) return null
  const obj = new cl()
  obj._nom = x._nom
  obj.id = x.id
  if (x.ids !== undefined) obj.ids = x.ids
  if (x.dlv !== undefined) obj.dlv = x.dlv
  if (row.dfh !== undefined) obj.dfh = x.dfh
  obj.vsh = x.vsh || 0
  obj.v = x.v || 0  
  if (!x._zombi) await obj.compile(x); else obj._zombi = true
  
  return obj
}

/** Espaces **************************************
_data_ :
- `id` : ns de l'espace [0-9][a-z][A-Z].
- `v` : 1..N
- `org` : code de l'organisation propriétaire.

- `ns` : **cette propriété N'EST PAS persistante**. 
  Elle calculée par le service OP et transmise en session UI.

- `creation` : date de création.
- `moisStat` : dernier mois de calcul de la statistique des comptas.
- `moisStatT` : dernier mois de calcul de la statistique des tickets.
- `quotas`: { qn, qv, qc }` donne les quotas globaux maximum attribués par l'administrateur technique.
- `dlvat` : `dlv` de l'administrateur technique.
- `cleES` : clé de l'espace cryptée par la clé du site. Permet au comptable de lire les reports créés sur le serveur et cryptés par cette clé E.
- `notifE` : notification pour l'espace de l'administrateur technique. Le texte n'est pas crypté.
- `opt`: option des comptes autonomes.
- `nbmi`: nombre de mois d'inactivité acceptable pour un compte O fixé par le comptable. Ce changement n'a pas d'effet rétroactif.
- `tnotifP` : map des notifications de niveau _partition_.
  - _clé_ : ID de la partition.
  - _valeur_ : notification (ou `null`), texte crypté par la clé P de la partition.
*/
export class Espace extends GenDoc {

  async compile (row) {
    this.org = row.org
    this.ns = row.ns
    this.creation = row.creation
    this.cleES = row.cleES
    this.cleET = row.cleET
    this.hTC = row.hTC
    this.moisStat = row.moisStat || 0
    this.moisStatT = row.moisStatT || 0
    this.opt = row.opt || 0
    this.quotas = row.quotas
    this.dlvat = row.dlvat || AMJ.max
    this.nbmi = row.nbmi || 6
    this.notifE = row.notifE ? new Notification(row.notifE) : null
    this.tnotifP = row.tnotifP || {}
  }

}

/** Synthese *********************************************
_data_:
- `id` : ns de son espace.
- `v` : date-heure de dernière mise à jour (à titre informatif).
- `qA` : `{ qc, qn, qv }` - quotas **maximum** disponibles pour les comptes A.
- `qtA` : `{ qc, qn, qv }` - quotas **effectivement attribués** aux comptes A. 
  En conséquence `qA.qn - qtA.qn` est le quotas qn encore attribuable aux compte A.

- `tsp` : map des _synthèses_ des partitions.
  - _clé_: ID de la partition.
  - _valeur_ : `synth`, objet des compteurs de synthèse calculés de la partition.
    - `id nbc nbd`
    - `ntfp[1,2,3]`
    - `q` : `{ qc, qn, qv }`
    - `qt` : { qc qn qv c2m n v }`
    - `ntf[1,2,3]`
    - `pcac pcan pcav pcc pcn pcv`

L'agrégation des `synth[i]` est calculée à la compilation dans `tsp['0']`.
*/
export class Synthese extends GenDoc {
  static l1 = ['qc', 'qn', 'qv']
  static l2 = ['qc', 'qn', 'qv', 'c2m', 'n', 'v']

  async compile (row) {
    this.qA = row.qA
    this.qtA = row.qtA
    this.tsp = {}

    if (row.tsp) for (const id in row.tsp) {
      const r = row.tsp[id]
      r.id = id
      synthesePartPC(r)
      this.tsp[id] = r
    }
  }

}

/** Partition *********************************
_data_:
- `id` : ID de la partition
- `v` : 1..N

- `nrp`: niveau de restriction de la notification (éventuelle) de niveau _partition_ mémorisée dans `espaces` et dont le texte est crypté par la clé P de la partition.
- `q`: `{ qc, qn, qv }` quotas globaux attribués à la partition par le Comptable.
- `mcpt` : map des comptes attachés à la partition. 
  - _clé_: id du compte.
  - _valeur_: `{ notif, cleAP, del, q }`
    - `notif`: notification du compte cryptée par la clé P de la partition (redonde celle dans compte).
    - `cleAP` : clé A du compte crypté par la clé P de la partition.
    - `del`: `true` si c'est un délégué.
    - `q` : `qc qn qv cjm nn nc ng v` extraits du document `comptas.compteurs.qv` du compte.

Compilé:
- this.sdel: Set des ids des délégués

- mcpt compilé - Ajout à q :
  - pcc : pourcentage d'utilisation de la consommation journalière c2m / qc
  - pcn : pourcentage d'utilisation effective de qn : nn + nc ng / qn
  - pcv : pourcentage d'utilisation effective de qc : v / qv

this.synth est calculé:
- `qt` : les totaux des compteurs `q` :
  (`qc qn qv cjm n (nn+nc+ng) v`) de tous les comptes,
- `ntf`: [1, 2, 3] - le nombre de comptes ayant des notifications de niveau de restriction 1 / 2 / 3. 
- `nbc nbd` : le nombre total de comptes et le nombre de délégués.
- _recopiés de la racine dans `synth`_ : `id nrp q`
- plus, calculés localement :
  - pcac : pourcentage d'affectation des quotas : qt.qc / q.qc
  - pcan : pourcentage d'affectation des quotas : qt.qn / q.qn
  - pcav : pourcentage d'affectation des quotas : qt.qv / q.qv
  - pcc : pourcentage d'utilisation de la consommation journalière qt.cjm * 30 / q.qc
  - pcn : pourcentage d'utilisation effective de qn : qt.n / q.qn
  - pcv : pourcentage d'utilisation effective de qc : qt.v / q.qv
*/
export class Partition extends GenDoc {

  async compile (row) {
    const clep = RegCles.get(this.id)
    this.nrp = row.nrp || 0
    this.q = row.q
    this.mcpt = {}
    this.sdel = new Set() // Set des délégués
    
    if (row.mcpt) for(const id in row.mcpt) {
      const e = row.mcpt[id]
      if (e.cleAP) RegCles.set(await decrypter(clep, e.cleAP))
      const q = { ...e.q }
      q.pcc = !q.qc ? 0 : Math.round(q.cjm * 30 * 100 / q.qc) 
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
- `id` : ID du compte = ID de son avatar principal.
- `v` : 1..N.
- `hk` : `hXR`, hash du PBKFD d'un extrait de la phrase secrète (en base précédé de `ns`).
- `dlv`: date limite de validité, dernier jour d'un mois,
  le compte peut être détruit dès le lendemain.

- `flags`: flags issus du dernier calcul des compteurs de compta.
- `dharF dhopf dharC dhopC dharS dhopS`: dh des ACCES RESTREINT (F, C, S).

- `vpe` : version du périmètre
- `vci` : version de `comptis`
- `vin` : version de `invits`

- `hXC`: hash du PBKFD de la phrase secrète complète (sans son `ns`).
- `cleKXC` : clé K cryptée par XC (PBKFD de la phrase secrète complète).
- `cleEK` : pour le Comptable, clé de l'espace cryptée par sa clé K à la création de l'espace pour le Comptable. Permet au comptable de lire les reports créés sur le serveur et cryptés par cette clé E.
- `privK` : clé privée RSA de son avatar principal cryptée par la clé K du compte.

- `dhvuK` : date-heure de dernière vue des notifications par le titulaire du compte, cryptée par la clé K.
- `qv` : qv de compta.compteurs.qv (à quelques % près)

_Comptes "O" seulement:_
- `clePK` : clé P de la partition cryptée par la clé K du compte. Si cette clé a une longueur de 256, la clé P a été cryptée par la clé publique de l'avatar principal du compte suite à une affectation à une partition APRÈS sa création (changement de partition, passage de compte A à O)
- `idp` : ID de sa partition.
- `del` : `true` si le compte est délégué de la partition.
- `notif`: notification de niveau _compte_ dont le texte est crypté par la clé P de la partition (`null` s'il n'y en a pas).

- `mav` : map des avatars du compte. 
  - _clé_ : ID de l'avatar.
  - _valeur_ : `claAK`: clé A de l'avatar crypté par la clé K du compte.

- `mpg` : map des participations aux groupes:
  - _clé_ : ID du groupe
  - _valeur_: `{ cleGK, lav }` - compilé en Set des IDs des avatars.
    - `cleGK` : clé G du groupe cryptée par la clé K du compte.
    - `lav`: liste de ses avatars participant au groupe.

**Comptable seulement:**
- `tpK` : map des partitions cryptée par la clé K du Comptable `[ {cleP, code }]`. Son index est le numéro de la partition.
  - `cleP` : clé P de la partition.
  - `code` : code / commentaire court de convenance attribué par le Comptable.

Compilé en mcode: Map(): clé: idp, valeur: code
*/
export class Compte extends GenDoc {
  get estComptable () { return ID.estComptable(this.id) }

  async compile (row) {
    const session = stores.session
    const clek = session.clek || await session.setIdClek(this.id, row.cleKXC)
    if (row.cleEK) this.cleE = await decrypter(clek, row.cleEK)
    this.priv = await RegCc.setPriv(this.id, row.privK)
    this.dhvu = row.dhvuK ? parseInt(await decrypterStr(clek, row.dhvuK)) : 0
    this.qv = row.qv

    this.dlv = row.dlv
    this.dharF = row.dharF || 0
    this.dharC = row.dharC || 0
    this.dharS = row.dharS || 0
    this.dhopF = row.dhopF || 0
    this.dhopC = row.dhopC || 0
    this.dhopS = row.dhopS || 0
    this.flags = row.flags || 0

    if (this.estComptable) {
      this.mcode = new Map()
      for(const idp in row.tpk) {
        const { cleP, code } = decode(await decrypter(clek, row.tpk[idp]))
        RegCles.set(cleP)
        if (code) this.mcode.set(idp, code)
      }
    }

    this.perimetre = []

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
    for(const id in row.mav) {
      const cleAK = row.mav[id]
      this.perimetre.push(id)
      RegCles.set(await decrypter(clek, cleAK))
      this.mav.add(id)
    }

    this.mpg = new Map()
    for(const id in row.mpg) {
      const e = row.mpg[id]
      this.perimetre.push(id)
      RegCles.set(await decrypter(clek, e.cleGK))
      this.mpg.set(id, new Set(e.lav))
    }

    this.perimetre.sort((a,b) => { return a < b ? -1 : (a > b ? 1 : 0)})
  
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

  alVol (v) {
    const voc = (this.pcv * this.qv * UNITEV / 100) + v
    const px = voc / UNITEV / this.qv
    return px > 1 ? 2 : (px > 0.9 ? 1 : 0)
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
}

/** Compta **********************************************************************
_data_:
- `id` : ID du compte = ID de son avatar principal.
- `v` : 1..N.
- `compteurs` sérialisation des quotas, volumes et coûts.
- `tickets`: map des tickets / dons:
  - _clé_: `ids`
  - _valeur_: `{dg, dr, ma, mc, refa, refc}`
- `dons` : liste des dons effectués / reçus `[{ dh, m, iddb }]`
  - `dh`: date-heure du don
  - `m`: montant du don (positif ou négatif)
  - `iddb`: id du donateur / bénéficiaire (selon le signe de `m`).
*/
export class Compta extends GenDoc {

  async compile (row) {
    this.idp = row.idp || '' // inscrit par GetCompta (par commodité en session ?)
    this.compteurs = new Compteurs(row.serialCompteurs)
    this.tickets = row.tickets || {}
    this.dons = row.dons || []
  }

  get estA() { return this.compteurs.estA }
}

/* Classe compti ****************************************************
_data_:
- `id` : id du compte.
- `v` : version.

- `mc` : map des contacts (des avatars) et des groupes _connus_ du compte,
  - _cle_: `id` de l'avatar ou du groupe,
  - _valeur_ : `{ ht, tx }`. Hashtags et texte attribués par le compte.
    - `ht` : suite des hashtags séparés par un espace et cryptée par la clé K du compte.
    - `tx` : commentaire gzippé et crypté par la clé K du compte.
*/
export class Compti extends GenDoc {

  async compile (row) {
    const clek = stores.session.clek
    this.mc = new Map()
    if (row.mc) for(const id in row.mc) {
      const x = row.mc[id]
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
_data_:
- `id` : id du compte.
- `v` : version.

- `invits`: liste des invitations en cours:
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
- `id` : ID de l'avatar.
- `v` : 1..N.
- `vcv` : version de la carte de visite afin qu'une opération puisse détecter (sans lire le document) si la carte de visite est plus récente que celle qu'il connaît.
- `hk` : `hZR` hash du PBKFD de la phrase de contact réduite (précédé du `ns` en base).

- `idc` : id du compte de l'avatar (égal à son id pour l'avatar principal).
- `cleAZC` : clé A cryptée par ZC (PBKFD de la phrase de contact complète).
- `pcK` : phrase de contact complète cryptée par la clé K du compte.
- `hZC` : hash du PBKFD de la phrase de contact complète.

- `cvA` : carte de visite de l'avatar `{id, v, ph, tx}`. photo et texte (possiblement gzippé) cryptés par la clé A de l'avatar.

- `pub privK` : couple des clés publique / privée RSA de l'avatar.
*/
export class Avatar extends GenDoc {

  /** compile *********************************************************/
  async compile (row) {
    const session = stores.session
    const clek = session.clek
    this.alias = row.alias

    // phrase de contact cryptée par la clé K.
    if (row.pcK) this.pc = await decrypterStr(clek, row.pcK) 

    RegCles.get(this.id)
    const cv = await CV.set(row.cvA || CV.fake(this.id))
    cv.store()
    await RegCc.setPriv(this.id, row.privK)
  }

}

/** Sponsoring ************************************************************
_data_:
- `id` : id de l'avatar sponsor.
- `ids` : `hYR` hash du PBKFD de la phrase réduite de parrainage (précé en base du `ns`), 
- `v`: 1..N.
- `dlv` : date limite de validité

- `st` : statut. _0: en attente réponse, 1: refusé, 2: accepté, 3: détruit / annulé_
- `pspK` : texte de la phrase de sponsoring cryptée par la clé K du sponsor.
- `YCK` : PBKFD de la phrase de sponsoring cryptée par la clé K du sponsor.
- `hYC` : hash du PBKFD de la phrase de sponsoring,
- `dh`: date-heure du dernier changement d'état.
- `cleAYC` : clé A du sponsor crypté par le PBKFD de la phrase complète de sponsoring.
- `partitionId`: id de la partition si compte "O"
- `clePYC` : clé P de sa partition (si c'est un compte "O") cryptée par le PBKFD de la phrase complète de sponsoring (donne le numéro de partition).
- `nomYC` : nom du sponsorisé, crypté par le PBKFD de la phrase complète de sponsoring.
- `del` : `true` si le sponsorisé est délégué de sa partition.
- `cvA` : `{ id, v, ph, tx }` du sponsor, textes cryptés par sa cle A.
- `quotas` : `[qc, q1, q2]` quotas attribués par le sponsor.
  - pour un compte "A" `[0, 1, 1]`. Un tel compte n'a pas de `qc` et peut changer à loisir `[q1, q2]` qui sont des protections pour lui-même (et fixe le coût de l'abonnement).
- `don` : pour un compte autonome, montant du don.
- `dconf` : le sponsor a demandé à rester confidentiel. Si oui, aucun chat ne sera créé à l'acceptation du sponsoring.
- `dconf2` : le sponsorisé a demandé à rester confidentiel. Si oui, aucun chat ne sera créé à l'acceptation du sponsoring (ignoré en session UI).
- `ardYC` : ardoise de bienvenue du sponsor / réponse du sponsorisé cryptée par le PBKFD de la phrase de sponsoring.
*/
export class Sponsoring extends GenDoc {

  /* commun */
  async comp (row) {
    this.st = row.st
    this.dh = row.dh
    this.partitionId = row.partitionId || ''
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
    const clek = stores.session.clek
    this.psp = await decrypterStr(clek, row.psK)
    this.YC = await decrypter(clek, row.YCK)
    await this.comp(row)
  }

  /* Par l'avatar sponsorisé : HORS SESSION - Registres inutilisables
  Création: await new Sponsoring().compileHS(row, psp)
  */
  async compileHS (row, cle) {
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
_data_:
- `id`: ID du Comptable.
- `ids` : identifiant du ticket
- `v` : version du ticket.

- `dg` : date de génération.
- `dr`: date de réception. Si 0 le ticket est _en attente_.
- `ma`: montant déclaré émis par le compte A.
- `mc` : montant déclaré reçu par le Comptable.
- `refa` : code court (32c) facultatif du compte A à l'émission.
- `refc` : code court (32c) facultatif du Comptable à la réception.
- `disp`: true si le compte était disparu lors de la réception.
- `idc`: id du compte générateur. Cette donnée n'est pas transmise aux sessions.
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
- `ids`: à la création calculé par hash du cryptage par la clé du site de `idI / idE`.
- `v`: 1..N.
- `vcv` : version de la carte de visite de E.

- `st` : deux chiffres `I E`
  - I : 0:indésirable, 1:actif
  - E : 0:indésirable, 1:actif, 2:disparu
- `idE idsE` : identifiant de _l'autre_ chat.
- `cvE` : `{id, v, ph, tx}` carte de visite de E au moment de la création / dernière mise à jour du chat (textes cryptés par sa clé A).
- `cleCKP` : clé C du chat cryptée,
  - si elle a une longueur inférieure à 256 bytes par la clé K du compte de I.
  - sinon cryptée par la clé RSA publique de I.
- `cleEC` : clé A de l'avatar E cryptée par la clé du chat.
- `items` : liste des items `[{a, dh, l t}]`
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
- `tid` : table des ids des membres.
- `st` : table des statuts.
- `flags` : tables des flags.
- `lng` : liste noire _groupe_ des membres.
- `lnc` : liste noire _compte_ des membres.
- `cvG` : carte de visite du groupe, textes cryptés par la clé du groupe `{v, photo, info}`.

Calculée : mmb: Map des membres. Clé: id long du membre, Valeur: son im
*/

export class Groupe extends GenDoc {

  async compile (row) {
    this.alias = row.alias
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
    this.st.forEach(st => { nx[st]++ })
    this.nbContacts = nx[1]
    this.nbPreInvites = nx[2]
    this.nbInvites = nx[3]
    this.nbActifs = nx[4] + nx[5]
    this.nbAnims = nx[5]
    this.sts = nx
  }

  get taille () { // nombre d'invités + actifs
    let n = 0
    this.st.forEach(st => { if (st > 1) n++})
    return n
  }

  get pcv () { return !this.qv ? 0 : Math.ceil(this.vf * 100 / this.qv * UNITEV) }

  alVol (v) {
    const px = (this.vf + v) / UNITEV / this.qv
    return px > 1 ? 2 : (px > 0.9 ? 1 : 0)
  }

  estRadie (im)  { return this.st[im] === 0 }
  estInvite (im) { return this.st[im] === 3 }
  estActif (im) { return this.st[im] >= 4 }
  estAnim (im) { return this.st[im] === 5 }
  estAuteur (im) { const f = this.flags[im] || 0; 
    return im && (f & FLAGS.AN) && (f & FLAGS.DN) && (f & FLAGS.DE) 
  }

  estHeb (im) { return this.estActif(im) && im === this.imh }

  get cptEstHeb () {
    const session = stores.session
    for(const ida of session.compte.mav) 
      if (this.imh === this.mmb.get(ida)) return true
    return false
  }

  get cptOkExclu () {
    if (!this.im) return true
    const session = stores.session
    for(const ida of session.compte.mav) 
      if (this.im === this.mmb.get(ida)) return true
    return false
  }

  accesMembre (im) {
    const f = this.flags[im] || 0;
    return im && this.estActif(im) && (f & FLAGS.AM) && (f & FLAGS.DM) 
  }

  aUnAccesMembre (s) { // Set des im
    let b = false
    s.forEach(im => { if (this.accesMembre(im)) b = true})
    return b
  }

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
  accesEcrNote (im) {
    const f = this.flags[im] || 0;
    return im && this.estActif(im) && (f & FLAGS.AN) && (f & FLAGS.DN) && (f & FLAGS.DE) 
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

  accesMembreH (im) { // 0:jamais, 1:oui, 2:l'a eu, ne l'a plus
    const f = this.flags[im] || 0
    if ((f & FLAGS.AC) && (f & FLAGS.AM) && (f & FLAGS.DM)) return 1
    return f & FLAGS.HM ? 2 : 0
  }

  // mis dans la liste noire par un animateur
  enLNG (ida) { return this.lng.has(ida) }
  // mis dans la liste noire par le compte lui-même
  enLNC (ida) { return this.lnc.has(ida) }

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
- `ids` : identifiant aléatoire relatif.
- `v` : 1..N.

- `im` : exclusivité dans un groupe. L'écriture est restreinte au membre du groupe d'indice `im`. 
- `vf` : volume total des fichiers attachés.
- `ht` : liste des hashtags _personnels_ cryptée par la clé K du compte.
  - En session, pour une note de groupe, `ht` est le terme de `htm` relatif au compte de la session.
- `htg` : note de groupe : liste des hashtags cryptée par la clé du groupe.
- `htm` : note de groupe seulement, hashtags des membres. Map:
    - _clé_ : id du compte de l'auteur,
    - _valeur_ : liste des hashtags cryptée par la clé K du compte.
    - non transmis en session.
- `l` : liste des _auteurs_ (leurs `im`) pour une note de groupe.
- `d` : date-heure de dernière modification du texte.
- `texte` : texte (gzippé) crypté par la clé de la note.
- `mfa` : map des fichiers attachés.
- `ref` : couple `[id, ids]` référence de sa note _parent_:

Map des fichiers attachés
- _clé_ `idf`: identifiant aléatoire généré à la création. L'identifiant _externe_ est `id` du groupe / avatar, `idf`. En pratique `idf` est un identifiant absolu.
- _valeur_ : `{ idf, lg, ficN }`
  - `ficN` : `{ nom, info, dh, type, gz, lg, sha }` crypté par la clé de la note

**A propos de `ref`**:
- Pour un note de groupe:
  - absent: rattachement _virtuel_ au groupe lui-même.
  - `[id, ids]` : 
    - `id`: du groupe (de la note), 
    - `ids`: de la note du groupe à laquelle elle est rattachée (possiblement supprimée).
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

    this.pid = row.pid || null
    this.pids = row.pid ? (row.pids || null) : null

    this.mfa = new Map()
    this.fnom = new Map()
    this.vf = row.vf
    if (this.vf && row.mfa) for (const idf in row.mfa) {
      const f = decode(await decrypter(this.cle, row.mfa[idf].ficN))
      this.mfa.set(f.idf, f)
      let e = this.fnom.get(f.nom); if (!e) { e = []; this.fnom.set(f.nom, e) }
      e.push(f)
      e.sort((a,b) => { return a.dh > b.dh ? -1 : (a.dh < b.dh ? 1 : 0) })
    }
  }

  get lstNoms () {
    const l = []
    for(const [nom,] of this.fnom) l.push(nom)
    l.sort((a,b) => { return a.nom < b.nom ? -1 : (a.nom > b.nom ? 1 : 0)})
    return l
  }

  get tousHt () { const s = new Set()
    this.ht.forEach(ht => { s.add(ht)})
    this.htg.forEach(ht => { s.add(ht)})
    return s
  }

  // Set des id des avatars du compte pouvant éditer la note
  static idasEdit (n) { // n : node du store notes
    const session = stores.session
    const lav = session.compte.mav
    if (!ID.estGroupe(n.id)) return lav
    const s = new Set()
    const gSt = stores.groupe
    const e = gSt.egr(n.id)
    if (!e) return s
    const gr = e.groupe
    for (const ida of lav) {
      const im = gr.mmb.get(ida)
      const an = gr.accesNote2(im)
      if (an === 2  && (!this.im || this.im === im || gr.estAnim(im))) s.add(ida)
    }
    return s
  }

  get key () { return this.id + '/' + this.ids }
  /* clé du parent:
    - si elle n'est pas rattachée, c'est la racine (avatar ou groupe) de son id
    - sinon, c'est,
      - si ref[1] = 0 elle est rattachée à une autre racine (un groupe pour une note d'avatar): ref[0]
      - sinon c'est la note ref[0]/ref[1]
  */

  get shIds () { return this.ids.substring(this.ids.length - 4) }

  async nouvFic (nom, info, lg, type, u8) {
    // propriétés ajoutées : u8 (contenu du fichier gzippé crypté), sha, dh, gz
    const fic = { nom, info, lg, type }
    fic.sha = sha256(u8)
    fic.dh = Date.now()
    fic.gz = fic.type.startsWith('text/')
    fic.u8 = await crypter(this.cle, fic.gz ? await gzipT(u8) : u8)
    return fic
  }

  async getFichier (f) {
    async function dec (cle, buf) {
      try {
        const b = await decrypter(cle, buf)
        return f.gz ? await ungzipT(b) : b
      } catch (e) {
        throw new AppExc(E_BRO, 22, [f.idf])
      }
    }

    // Obtenu localement ou par download. Fichier décrypté ET dézippé
    // idf: id du fichier
    const faSt = stores.ficav
    const session = stores.session
    let buf = faSt.getDataDeCache(f.idf)
    if (buf) return dec(this.cle, buf)

    if (session.accesIdb) {
      const fa = faSt.map.get(f.idf)
      if (fa && fa.dhdc === 0) {
        buf = await idb.getFichierIDB(f.idf)
        faSt.putDataEnCache(f.idf, buf)
        return dec(this.cle, buf)
      }
    }

    if (session.accesNet) {
      buf = await new DownloadFichier().run(this, f.idf)
      return dec(this.cle, buf)
    }
  }

  nomFichier (f) {
    const n1 = normNomFichier(f.nom)
    const n2 = f.info ? '#' + normNomFichier(f.info) : ''
    const ext = mime2ext(f.type) || 'bin'
    return n1 + n2 + '#' + f.idf + '.' + ext
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
    this.id = ''
    this.txt = ''
    this.dh = 0
  }

  nouveau (txt) {
    this.id = ID.noteLoc()
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

  nouveau (idf, nom, info, type, u8) {
    this.idf = idf || ID.fic()
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
    const n1 = normNomFichier(this.nom)
    const n2 = this.info ? '#' + normNomFichier(this.info) : ''
    const ext = mime2ext(this.type) || 'bin'
    return n1 + n2 + '#' + this.idf + '.' + ext
  }

}

/*
Un document par fichier devant être accessible en mode avion:
- stockés en table `ficav` de IDB (inconnus du serveur).

- `id` : id du fichier (`idf` clé de `Note.mfa`)
- `dh` : date-heure du fichier.
- `dhdc` : date-heure de demande de chargement du fichier: ne pas tenter de le charger avant cette heure. Si 0, le fichier est chargé (nbr et exc sont absents).
- `nbr` : nombre d'essai de chargement. 
- `exc` : exception rencontrée lors de la dernière tentative de téléchargement.
- `noteId noteIds` : `id/ids` identifiant de la note à laquelle le fichier est ou était attaché.
- `nom` : nom du fichier dans son entrée dans Note.mfa
- `av` : `true` - garder cette version spécifiquement
- `avn` : `true` - garder la version la plus récente du fichier ayant ce nom

Note.mfa : map des fichiers attachés à une note
- _clé_: `idf` - identifiant absolu aléatoire du fichier.
- _valeur_: `{ nom, dh, info, type, gz, lg, sha }`

Plusieurs fichiers peuvent avoir le même nom: ils sont considérés comme des versions successives, l'identifiant de la version est dh, la date-heure de l'opération l'ayant créé.
- dans la map, `nom/dh` est une clé.
- `info` est un code court facultatif qualifiant la version.
- l'item d'un `idf` donné est invariant après création.
*/
export class Ficav {

  static fromData (buf) {
    const data = decode(buf)
    const f = new Ficav()
    f.id = data.id
    f.dh = data.dh
    f.dhdc = data.dhdc || 0
    f.exc = data.exc || null
    f.nbr = data.nbr || 0
    f.noteId = data.noteId
    f.noteIds = data.noteIds
    f.nom = data.nom
    f.av = data.av
    f.avn = data.avn
    return f
  }

  static fromNote (note, idf, av, avn) {
    const nf = note.mfa.get(idf)
    const f = new Ficav()
    f.id = idf
    f.dh = nf.dh
    f.dhdc = Date.now()
    f.exc = null
    f.nbr = 0
    f.noteId = note.id
    f.noteIds = note.ids
    f.nom = nf.nom
    f.av = av
    f.avn = avn
    return f
  }

  toRow () { return { ...this } }

}

const classes = {
  espaces: Espace,
  tickets: Ticket,
  partitions: Partition,
  syntheses: Synthese,
  comptes: Compte,
  comptas: Compta,
  comptis: Compti,
  invits: Invit,
  avatars: Avatar,
  groupes: Groupe,
  notes: Note,
  sponsorings: Sponsoring,
  chats: Chat,
  membres: Membre,
  chatgrs: Chatgr
}
