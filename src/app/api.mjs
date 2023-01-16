import { encode, decode } from '@msgpack/msgpack'

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

/** Compteurs ***************************
- `j` : jour de calcul
- `v1 v1m` : volume v1 actuel et total du mois
- `v2 v2m` : volume v2 actuel et total du mois
- `trm` : volume transféré dans le mois
- `q1 q2` : quotas de v1 et v2
- `tr` : array de 14 compteurs (les 14 derniers jours) de volume journalier de transfert
- `rtr` : ratio de la moyenne des tr / quota v2 en pourcentage (125 => 125%)
- `hist` : array de 12 éléments, un par mois. 4 bytes par éléments.
  - `q1 q2` : quotas du mois
  - `r1` : ratio du v1 du mois par rapport à son quota.
  - `r2` : ratio du v2 du mois par rapport à son quota.
  - `r3` : ratio des transferts cumulés du mois / volume du quota v2
*/

const lch1 = ['j', 'v1', 'v1m', 'v2', 'v2m', 'trm', 'q1', 'q2', 'rtr']
const NTRJ = 14

function mx255 (x) { const n = Math.round(x * 100); return n > 255 ? 255 : n }

export class Compteurs {
  constructor (data) {
    const src = data ? decode(data) : null
    lch1.forEach(f => { this[f] = src ? src[f] : 0 }); 
    if (src) {
      this.tr = src.tr
      this.hist = src.hist
    } else {
      this.j = new DateJour().nbj
      this.tr = new Array(NTRJ)
      this.tr.fill(0, 0, NTRJ)
      this.hist = new Array(12)
      for (let i = 0; i < 12; i++) this.hist[i] = new Uint8Array([0, 0, 0, 0, 0])
    }
    this.setRtr()
    this.maj = false
    this.calculauj()
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

  get serial () { return new Uint8Array(encode(this.copie)) }

  setV1 (delta) {
    const ok = this.v1 + delta <= this.q1 * UNITEV1
    this.v1m = Math.round(((this.v1m * this.dj.jj) + delta) / this.dj.jj)
    this.v1 = this.v1 + delta
    this.hist[this.dj.mm - 1][2] = mx255(this.v1m / this.q1 * UNITEV1)
    this.maj = true
    return ok
  }

  setV2 (delta) {
    const ok = this.v2 + delta <= this.q2 * UNITEV2
    this.v2m = Math.round(((this.v2m * this.dj.jj) + delta) / this.dj.jj)
    this.v2 = this.v2 + delta
    this.hist[this.dj.mm - 1][3] = mx255(this.v2m / this.q2 * UNITEV2)
    this.maj = true
    return ok
  }

  setTr (delta) {
    this.trm = Math.round(((this.trm * this.dj.jj) + delta) / this.dj.jj)
    this.hist[this.dj.mm - 1][4] = mx255(this.trm / this.q2 * UNITEV2)
    this.tr[0] = this.tr[0] + delta
    this.setRtr()
    this.maj = true
  }

  setQ1 (q) {
    const ok = this.v1 <= q * UNITEV1
    this.q1 = q
    this.hist[this.dj.mm - 1][2] = mx255(this.v1m / this.q1 * UNITEV1)
    this.maj = true
    return ok
  }

  setQ2 (q) {
    const ok = this.v2 <= q * UNITEV2
    this.q2 = q
    this.hist[this.dj.mm - 1][3] = mx255(this.v2m / this.q2 * UNITEV2)
    this.maj = true
    return ok
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

  setRtr () {
    let s = 0; this.tr.forEach(n => { s += n })
    this.rtr = s === 0 ? 0 : (this.q2 ? mx255(s / (this.q2 * UNITEV2)) : 255)
  }

  calculauj () { // recalcul à aujourd'hui en fonction du dernier jour de calcul
    const dj = new DateJour()
    if (dj.nbj === this.j) return // déjà normalisé, calculé aujourd'hui
    this.dj = dj
    this.maj = true
    const dja = new DateJour(this.j)
    if (dja.aa === dj.aa && dja.mm === dj.mm) {
      // Dans le même mois
      // Recalcul des moyennes du mois et shift de tr (recalcul rtr)
      this.v1m = Math.round(((this.v1m * dja.jj) + (this.v1 * (dj.jj - dja.jj))) / dj.jj)
      this.v2m = Math.round(((this.v2m * dja.jj) + (this.v2 * (dj.jj - dja.jj))) / dj.jj)
      this.trm = Math.round((this.trm * dja.jj) / dj.jj)
      this.hist[dj.mm - 1][2] = mx255(this.v1m / this.q1 * UNITEV1)
      this.hist[dj.mm - 1][3] = mx255(this.v2m / this.q2 * UNITEV2)
      this.hist[dj.mm - 1][4] = mx255(this.trm / this.q2 * UNITEV2)
      this.shiftTr(dj.jj - dja.jj)
    } else {
      // Moyennes sur le dernier mois de calcul
      const v1m = Math.round(((this.v1m * dja.jj) + (this.v1 * (dja.nbjm - dja.jj))) / dja.jj)
      const v2m = Math.round(((this.v2m * dja.jj) + (this.v2 * (dja.nbjm - dja.jj))) / dja.jj)
      const trm = Math.round((this.trm * dja.jj) / dja.jj)
      const r1 = mx255(v1m / this.q1 * UNITEV1)
      const r2 = mx255(v2m / this.q2 * UNITEV2)
      const r3 = mx255(trm / this.q2 * UNITEV2)

      if ((dj.mm === dja.mm + 1 && dj.aa === dja.aa) || (dj.mm === 1 && dja.mm === 1 && dj.aa === dja.aa + 1)) {
        // dernier calcul le mois précédent
        this.v1m = v1m
        this.v2m = v2m
        this.trm = 0
        this.hist[dja.mm - 1] = new Uint8Array([this.q1, this.q2, r1, r2, r3])
        this.hist[dj.mm - 1] = new Uint8Array([this.q1, this.q2, r1, r2, 0])
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
          for (let i = 0; i < 12; i++) this.hist[i] = new Uint8Array([this.q1, this.q2, r1, r2, 0])
        } else {
          this.hist[dja.mm - 1] = new Uint8Array([this.q1, this.q2, r1, r2, r3]) // le dernier mois calculé
          if (dja.mm < dj.mm) {
            // dans la même année : suivant avec tr = 0
            for (let i = dja.mm; i < dj.mm; i++) this.hist[i] = new Uint8Array([this.q1, this.q2, r1, r2, 0])
          } else {
            // sur fin d'anée et début suivante avec tr = 0
            for (let i = dja.mm; i < 12; i++) this.hist[i] = new Uint8Array([this.q1, this.q2, r1, r2, 0])
            for (let i = 0; i < dj.mm; i++) this.hist[i] = new Uint8Array([this.q1, this.q2, r1, r2, 0])
          }
        }
      }
    }
    this.j = this.dj.nbj
  }
}

const j0 = Math.floor(new Date('2020-01-01T00:00:00').getTime() / 86400000)
const nbjm = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const nbjSuppr = 365

const zeroPad = (num, places) => String(num).padStart(places, '0')

export class DateJour {
  static nj () {
    return Math.floor(new Date().getTime() / 86400000) - j0
  }

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
