import { schemas, serial, deserial } from './schemas.mjs'

export const version = '1'

export const IDCOMPTABLE = 9007199254740988

export const UNITEV1 = 250000
export const UNITEV2 = 25000000
export const PINGTO = 60 // en secondes. valeur élevée en test

export const E_BRK = 1000 // Interruption volontaire de l'opération
export const E_WS = 2000 // Toutes erreurs de réseau
export const E_DB = 3000 // Toutes erreurs d'accès à la base locale
export const E_BRO = 4000 // Erreur inattendue trappée sur le browser
export const F_BRO = 5000 // Erreur fonctionnelle trappée sur le browser
export const A_BRO = 6000 // Situation inattendue : assertion trappée par le browser
export const E_SRV = 7000 // Erreur inattendue trappée sur le serveur
export const F_SRV = 8000 // Erreur fonctionnelle trappée sur le serveur
export const A_SRV = 9000 // Situation inattendue : assertion trappée sur le serveur

export class AppExc {
  constructor (majeur, mineur, args, stack) {
    this.code = majeur + (mineur || 0)
    if (args) this.args = args
    if (stack) this.stack = stack
  }

  get majeur () { return Math.floor(this.code / 1000) }

  toString () {
    return JSON.stringify(this)
  }
}

export function appexc (e) {
  return !e ? null : (e instanceof AppExc ? e : new AppExc(E_BRO, 0, [e.message], e.stack || ''))
}

export const MC = {
  NOUVEAU: 255,
  LISTENOIRE: 254,
  PARRAIN: 253,
  FILLEUL: 252,
  INTRODUCTEUR: 251,
  INTRODUIT: 250,
  FAVORI: 249,
  IMPORTANT: 248,
  OBSOLETE: 247,
  ALIRE: 246,
  ATRAITER: 245
}

/* Cas particulier de 'tribu':
Pour LE compte comptable, il n'y a pas de 'tribu' attaché au compte, MAIS toutes les tribus sont en store/db.
Pour les comptes normaux, il y a une seule tribu attachée au compte et elle est stockée en IDB, et c'est la seule qui est en store/db.
- vis à vis de IDB, c'est toujours un singleton ("la" tribu d'un compte).
- vis à vis de store/db : c'est un singleton pour tous les comptes, SAUF pour le comptable.
Donc on considère que 'tribu' N'EST PAS un singleton, et que dans le cas des comptes normaux et IDB
il faut fournir son id (disponible dans compte.
*/

export const t0n = new Set(['compte', 'prefs']) // singletons
export const t1n = new Set(['tribu', 'avatar', 'compta', 'couple', 'groupe', 'fetat', 'avsecret']) // clé à 1 niveau
export const t2n = new Set(['membre', 'secret']) // clé à 2 niveaux

/*
- `versions` (id) : table des prochains numéros de versions (actuel et dernière sauvegarde) et autres singletons (id value)
- `avrsa` (id) : clé publique d'un avatar
- `trec` (id) : transfert de fichier en cours (uploadé mais pas encore enregistré comme fichier d'un secret)
- `gcvol` (id) : GC des volumes des comptes disparus.

_**Tables transmises au client**_

- `compte` (id) : authentification et liste des avatars d'un compte
- `prefs` (id) : données et préférences d'un compte
- `compta` (id) : ligne comptable du compte
- `cv` (id) : statut d'existence, signature et carte de visite des avatars, contacts et groupes
- `avatar` (id) : données d'un avatar et liste de ses contacts et groupes
- `couple` (id) : données d'un contact entre deux avatars
- `groupe` (id) : données du groupe
- `membre` (id, im) : données d'un membre du groupe
- `secret` (id, ns) : données d'un secret d'un avatar, couple ou groupe
- `contact` (phch) : parrainage ou rencontre de A0 vers un A1 à créer ou inconnu par une phrase de contact
- `invitgr` (id, ni) : **NON persistante en IDB**. invitation reçue par un avatar à devenir membre d'un groupe
- `invitcp` (id, ni) : **NON persistante en IDB**. invitation reçue par un avatar à devenir membre d'un couple
- `tribu` (id) : données et compteurs d'une tribu.
*/

schemas.forSchema({
  name: 'rowversions',
  cols: ['id', 'v']
})

schemas.forSchema({
  name: 'rowtribu',
  cols: ['id', 'v', 'nbc', 'f1', 'f2', 'r1', 'r2', 'datak', 'mncpt', 'datat', 'vsh']
})

schemas.forSchema({
  name: 'rowtrec',
  cols: ['id', 'idf', 'dlv']
})

schemas.forSchema({
  name: 'rowcompte',
  cols: ['id', 'v', 'dpbh', 'pcbh', 'kx', 'stp', 'nctk', 'mack', 'vsh']
})

schemas.forSchema({
  name: 'rowprefs',
  cols: ['id', 'v', 'mapk', 'vsh']
})

schemas.forSchema({
  name: 'rowavrsa',
  cols: ['id', 'clepub', 'vsh']
})

schemas.forSchema({
  name: 'rowcv',
  cols: ['id', 'v', 'x', 'dds', 'cv', 'vsh']
})

schemas.forSchema({
  name: 'rowavatar',
  cols: ['id', 'v', 'lgrk', 'lcck', 'vsh']
})

schemas.forSchema({
  name: 'rowcompta',
  cols: ['id', 't', 'v', 'datat', 'data', 'sta', 'ard1', 'ard2', 'ard3', 'vsh']
})

schemas.forSchema({
  name: 'rowcouple',
  cols: ['id', 'v', 'st', 'npi', 'v1', 'v2', 'mx10', 'mx20', 'mx11', 'mx21', 'dlv', 'datac', 'phk0', 'infok0', 'infok1', 'mc0', 'mc1', 'ardc', 'vsh']
})

schemas.forSchema({
  name: 'rowcontact',
  cols: ['phch', 'dlv', 'datax', 'vsh']
})

schemas.forSchema({
  name: 'rowgroupe',
  cols: ['id', 'v', 'dfh', 'st', 'mxim', 'imh', 'v1', 'v2', 'f1', 'f2', 'mcg', 'vsh']
})

schemas.forSchema({
  name: 'rowmembre',
  cols: ['id', 'im', 'v', 'st', 'npi', 'vote', 'mc', 'infok', 'datag', 'ardg', 'vsh']
})

schemas.forSchema({
  name: 'rowinvitgr',
  cols: ['id', 'ni', 'datap']
})

schemas.forSchema({
  name: 'rowinvitcp',
  cols: ['id', 'ni', 'datap']
})

schemas.forSchema({
  name: 'rowsecret',
  cols: ['id', 'ns', 'v', 'x', 'st', 'xp', 'v1', 'v2', 'mc', 'txts', 'mfas', 'refs', 'vsh']
})

schemas.forSchema({
  name: 'idbCv',
  cols: ['id', 'v', 'x', 'dds', 'cv', 'vsh']
})

schemas.forSchema({
  name: 'idbFetat',
  cols: ['id', 'dhd', 'dhc', 'dhx', 'lg', 'nom', 'info', 'ids', 'ns', 'err']
})

schemas.forSchema({
  name: 'idbAvSecret',
  cols: ['id', 'ns', 'v', 'lidf', 'mnom']
})

schemas.forSchema({
  name: 'syncList',
  cols: ['sessionId', 'dh', 'rowItems']
})

/** Compteurs ***************************
- `j` : jour de calcul
- `v1 v1m` : volume v1 actuel et total du mois
- `v2 v2m` : volume v2 actuel et total du mois
- `trm` : volume transféré dans le mois
- `f1 f2` : forfait de v1 et v2
- `tr` : array de 14 compteurs (les 14 derniers jours) de volume journalier de transfert
- `rtr` : ratio de la moyenne des tr / forfait v2
- `hist` : array de 12 éléments, un par mois. 4 bytes par éléments.
  - `f1 f2` : forfaits du mois
  - `r1` : ratio du v1 du mois par rapport à son forfait.
  - `r2` : ratio du v2 du mois par rapport à son forfait.
  - `r3` : ratio des transferts cumulés du mois / volume du forfait v2
- `s1 s2` : pour un avatar primaire, total des forfaits attribués aux secondaires.
- v1c v2c : total des v1 et v2 pour tous les avatars du compte constaté lors de la dernière connexion.
*/

const lch1 = ['j', 'v1', 'v1m', 'v2', 'v2m', 'trm', 'f1', 'f2', 'rtr', 's1', 's2', 'v1c', 'v2c']
const NTRJ = 14

function mx255 (x) { const n = Math.round(x * 100); return n > 255 ? 255 : n }

export class Compteurs {
  constructor (data) {
    const src = data ? deserial(data) : null
    this.j = src ? src.j : new DateJour().nbj
    this.v1 = src ? src.v1 : 0
    this.v1m = src ? src.v1m : 0
    this.v2 = src ? src.v2 : 0
    this.v2m = src ? src.v2m : 0
    this.trm = src ? src.trm : 0
    this.f1 = src ? src.f1 : 0
    this.f2 = src ? src.f2 : 0
    if (src) {
      this.tr = src.tr
      this.hist = src.hist
    } else {
      this.tr = new Array(NTRJ)
      this.tr.fill(0, 0, NTRJ)
      this.hist = new Array(12)
      for (let i = 0; i < 12; i++) this.hist[i] = new Uint8Array([0, 0, 0, 0, 0])
    }
    this.setRtr()
    this.s1 = src ? (src.s1 || 0) : 0
    this.s2 = src ? (src.s2 || 0) : 0
    this.v1c = src ? (src.v1c || 0) : 0
    this.v2c = src ? (src.v2c || 0) : 0
    this.maj = false
  }

  setRtr () {
    let s = 0; this.tr.forEach(n => { s += n })
    this.rtr = s === 0 ? 0 : (this.f2 ? mx255(s / (this.f2 * UNITEV2)) : 255)
  }

  get copie () { // retourne un {...} contenant les champs (ce N'EST PAS un OBJET Compteurs)
    const c = {}
    lch1.forEach(f => { c[f] = this[f] })
    c.tr = new Array(NTRJ)
    for (let i = 0; i < NTRJ; i++) c.tr[i] = this.tr[i]
    c.hist = new Array(12)
    for (let i = 0; i < 12; i++) {
      const x = new Uint8Array(5)
      for (let j = 0; j < 5; j++) x[j] = this.hist[i][j]
      c.hist[i] = x
    }
    return c
  }

  get serial () { this.maj = false; return serial(this.copie) }

  setV1 (delta) {
    this.calculauj()
    if (this.v1 + delta > this.f1 * UNITEV1) return false
    this.v1m = Math.round(((this.v1m * this.dj.jj) + delta) / this.dj.jj)
    this.v1 = this.v1 + delta
    this.hist[this.dj.mm - 1][2] = mx255(this.v1m / this.f1 * UNITEV1)
    this.maj = true
    return true
  }

  setV2 (delta) {
    this.calculauj()
    if (this.v2 + delta > this.f2 * UNITEV2) return false
    this.v2m = Math.round(((this.v2m * this.dj.jj) + delta) / this.dj.jj)
    this.v2 = this.v2 + delta
    this.hist[this.dj.mm - 1][3] = mx255(this.v2m / this.f2 * UNITEV2)
    this.maj = true
    return true
  }

  setTr (delta) {
    this.calculauj()
    this.trm = Math.round(((this.trm * this.dj.jj) + delta) / this.dj.jj)
    this.hist[this.dj.mm - 1][4] = mx255(this.trm / this.f2 * UNITEV2)
    this.tr[0] = this.tr[0] + delta
    this.setRtr()
    this.maj = true
    return true
  }

  setF1 (f) {
    this.calculauj()
    if (this.v1 > f * UNITEV1) return false
    this.f1 = f
    this.hist[this.dj.mm - 1][2] = mx255(this.v1m / this.f1 * UNITEV1)
    this.maj = true
    return true
  }

  setF2 (f) {
    this.calculauj()
    if (this.v2 > f * UNITEV2) return false
    this.f2 = f
    this.hist[this.dj.mm - 1][3] = mx255(this.v2m / this.f2 * UNITEV2)
    this.maj = true
    return true
  }

  setAS (delta) { // maj forfaits attribués à un avatar secondaire
    if ((this.v1 > (this.f1 - delta[0]) * UNITEV1) || (this.v2 > (this.f2 - delta[1]) * UNITEV2)) return false
    this.f1 = this.f1 - delta[0]
    this.f2 = this.f2 - delta[1]
    this.s1 = this.s1 + delta[0]
    this.s2 = this.s2 + delta[1]
    this.maj = true
    return true
  }

  shiftTr (nj) {
    if (nj <= 0) return
    if (nj >= NTRJ) {
      this.tr.fill(0, 0, NTRJ)
    } else {
      // eslint-disable-next-line for-direction
      for (let i = NTRJ - 1; i >= 0; i--) this.tr[i] = i > nj ? this.tr[i - nj] : 0
    }
    this.setRtr()
  }

  calculauj () { // recalcul à aujourd'hui en fonction du dernier jour de calcul
    const dj = new DateJour()
    this.dj = dj
    if (dj.nbj === this.j) return this // déjà normalisé, calculé aujourd'hui
    this.maj = true
    const dja = new DateJour(this.j)
    if (dja.aa === dj.aa && dja.mm === dj.mm) {
      // Dans le même mois
      // Recalcul des moyennes du mois et shift de tr (recalcul rtr)
      this.v1m = Math.round(((this.v1m * dja.jj) + (this.v1 * (dj.jj - dja.jj))) / dj.jj)
      this.v2m = Math.round(((this.v2m * dja.jj) + (this.v2 * (dj.jj - dja.jj))) / dj.jj)
      this.trm = Math.round((this.trm * dja.jj) / dj.jj)
      this.hist[dj.mm - 1][2] = mx255(this.v1m / this.f1 * UNITEV1)
      this.hist[dj.mm - 1][3] = mx255(this.v2m / this.f2 * UNITEV2)
      this.hist[dj.mm - 1][4] = mx255(this.trm / this.f2 * UNITEV2)
      this.shiftTr(dj.jj - dja.jj)
    } else {
      // Moyennes sur le dernier mois de calcul
      const v1m = Math.round(((this.v1m * dja.jj) + (this.v1 * (dja.nbjm - dja.jj))) / dja.jj)
      const v2m = Math.round(((this.v2m * dja.jj) + (this.v2 * (dja.nbjm - dja.jj))) / dja.jj)
      const trm = Math.round((this.trm * dja.jj) / dja.jj)
      const r1 = mx255(v1m / this.f1 * UNITEV1)
      const r2 = mx255(v2m / this.f2 * UNITEV2)
      const r3 = mx255(trm / this.f2 * UNITEV2)

      if ((dj.mm === dja.mm + 1 && dj.aa === dja.aa) || (dj.mm === 1 && dja.mm === 1 && dj.aa === dja.aa + 1)) {
        // dernier calcul le mois précédent
        this.v1m = v1m
        this.v2m = v2m
        this.trm = 0
        this.hist[dja.mm - 1] = new Uint8Array([this.f1, this.f2, r1, r2, r3])
        this.hist[dj.mm - 1] = new Uint8Array([this.f1, this.f2, r1, r2, 0])
        this.shiftTr(dja.nbjm - dja.jj + dj.jj) // shift de l'historique
      } else {
        // plus d'un mois depuis le dernier calcul
        // fin du mois du dernier calcul : nb jours du mois du dernier calcul - dja.nbjm
        const nbm = 12 - dja.mm + dj.mm + (12 * (dj.aa - dja.aa)) // nb de mois depuis dernier calcul
        this.v1m = v1m
        this.v2m = v2m
        this.trm = 0
        this.shiftTr(NTRJ) // shift de l'historique (raz, plus de NTRJ jours
        if (nbm >= 12) {
          for (let i = 0; i < 12; i++) this.hist[i] = new Uint8Array([this.f1, this.f2, r1, r2, 0])
        } else {
          this.hist[dja.mm - 1] = new Uint8Array([this.f1, this.f2, r1, r2, r3]) // le dernier mois calculé
          if (dja.mm < dj.mm) {
            // dans la même année : suivant avec tr = 0
            for (let i = dja.mm; i < dj.mm; i++) this.hist[i] = new Uint8Array([this.f1, this.f2, r1, r2, 0])
          } else {
            // sur fin d'anée et début suivante avec tr = 0
            for (let i = dja.mm; i < 12; i++) this.hist[i] = new Uint8Array([this.f1, this.f2, r1, r2, 0])
            for (let i = 0; i < dj.mm; i++) this.hist[i] = new Uint8Array([this.f1, this.f2, r1, r2, 0])
          }
        }
      }
    }
    this.j = this.dj.nbj
    return this
  }
}

const j0 = Math.floor(new Date('2020-01-01T00:00:00').getTime() / 86400000)
const nbjm = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const nbjSuppr = 365

const zeroPad = (num, places) => String(num).padStart(places, '0')

export class DateJour {
  constructor (j) {
    const d = !j ? new Date() : (j instanceof Date ? j : new Date((j0 + j) * 86400000))
    this.aa = d.getFullYear() % 100
    this.mm = d.getMonth() + 1
    this.jj = d.getDate()
    const x = d.getDay()
    this.js = x === 0 ? 7 : x
    this.nbj = Math.floor(d.getTime() / 86400000) - j0
  }

  get aaaammjj () { return this.Date.toISOString().substring(0, 10) }

  get jjmmaaaa () { return zeroPad(this.jj, 2) + '/' + zeroPad(this.mm, 2) + '/20' + zeroPad(this.aa, 2) }

  get nbjm () { return nbjm[this.mm] + (this.aa % 4 === 0 ? 1 : 0) }

  get Date () { return new Date((j0 + this.nbj) * 86400000) }

  get dateSuppr () { return -(this.nbj + nbjSuppr) }
}

export const j99 = new DateJour(new Date('2099-12-31T23:59:59')).nbj // 29220 = 365 * 80 + 20 (années bisextiles)

// Retourne un array des chiffres composant l'entier en décimal, sur nbc chiffres
export function chiffres (val, nbc) {
  const a = new Array(nbc).fill(0)
  let n = val
  let i = nbc - 1
  while (n && i >= 0) {
    a[i--] = n % 10
    n = Math.floor(n / 10)
  }
  return a
}
