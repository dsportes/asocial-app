import { encode, decode } from '@msgpack/msgpack'

export const version = '1'

export const IDCOMPTABLE = 9007199254740980
export const RNDCOMPTABLE = new Uint8Array(
  [0, 255, 255, 255, 255, 255, 255, 255, 
    255, 255, 255, 255, 255, 255, 255, 255, 
    255, 255, 255, 255, 255, 255, 255, 255, 
    255, 255, 255, 255, 255, 255, 255, 255])

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
      this.dj = AMJ.amjUtc()
      this.j = this.dj
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
    this.v1m = Math.round(((this.v1m * AMJ.jj(this.dj)) + delta) / AMJ.jj(this.dj))
    this.v1 = this.v1 + delta
    this.hist[AMJ.mm(this.dj) - 1][2] = mx255(this.v1m / this.q1 * UNITEV1)
    this.maj = true
    return ok
  }

  setV2 (delta) {
    const ok = this.v2 + delta <= this.q2 * UNITEV2
    this.v2m = Math.round(((this.v2m * AMJ.jj(this.dj)) + delta) / AMJ.jj(this.dj))
    this.v2 = this.v2 + delta
    this.hist[AMJ.mm(this.dj) - 1][3] = mx255(this.v2m / this.q2 * UNITEV2)
    this.maj = true
    return ok
  }

  setTr (delta) {
    this.trm = Math.round(((this.trm * AMJ.jj(this.dj)) + delta) / AMJ.jj(this.dj))
    this.hist[AMJ.mm(this.dj) - 1][4] = mx255(this.trm / this.q2 * UNITEV2)
    this.tr[0] = this.tr[0] + delta
    this.setRtr()
    this.maj = true
  }

  setQ1 (q) {
    const ok = this.v1 <= q * UNITEV1
    this.q1 = q
    this.hist[AMJ.mm(this.dj) - 1][2] = mx255(this.v1m / this.q1 * UNITEV1)
    this.maj = true
    return ok
  }

  setQ2 (q) {
    const ok = this.v2 <= q * UNITEV2
    this.q2 = q
    this.hist[AMJ.mm(this.dj) - 1][3] = mx255(this.v2m / this.q2 * UNITEV2)
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
    s = s * 30 / this.tr.length
    this.rtr = s === 0 ? 0 : (this.q2 ? mx255(s / (this.q2 * UNITEV2)) : 255)
  }

  calculauj () { // recalcul à aujourd'hui en fonction du dernier jour de calcul
    const dj = AMJ.amjUtc() // dj: entier aaaammjj
    if (dj === this.j) { this.dj = dj; return } // déjà normalisé, calculé aujourd'hui
    this.dj = dj
    this.maj = true
    const [djaaa, djamm, djajj] = AMJ.aaaammjj(this.j) // "avant"
    const [djaa, djmm, djjj]  = AMJ.aaaammjj(this.dj) // "maintenant"
    if (djaaa === djaa && djamm === djmm) {
      // Dans le même mois
      // Recalcul des moyennes du mois et shift de tr (recalcul rtr)
      this.v1m = Math.round(((this.v1m * djajj) + (this.v1 * (djjj - djajj))) / djjj)
      this.v2m = Math.round(((this.v2m * djajj) + (this.v2 * (djjj - djajj))) / djjj)
      this.trm = Math.round((this.trm * djajj) / djjj)
      this.hist[djmm - 1][2] = mx255(this.v1m / this.q1 * UNITEV1)
      this.hist[djmm - 1][3] = mx255(this.v2m / this.q2 * UNITEV2)
      this.hist[djmm - 1][4] = mx255(this.trm / this.q2 * UNITEV2)
      this.shiftTr(djjj - djajj)
    } else {
      // Moyennes sur le dernier mois de calcul
      const nbjm = AMJ.djm(djaaa, djamm)
      const v1m = Math.round(((this.v1m * djajj) + (this.v1 * (nbjm - djajj))) / djajj)
      const v2m = Math.round(((this.v2m * djajj) + (this.v2 * (nbjm - djajj))) / djajj)
      const trm = Math.round((this.trm * djajj) / djajj)
      const r1 = mx255(v1m / this.q1 * UNITEV1)
      const r2 = mx255(v2m / this.q2 * UNITEV2)
      const r3 = mx255(trm / this.q2 * UNITEV2)

      if ((djmm === djamm + 1 && djaa === djaaa) || (djmm === 1 && djamm === 1 && djaa === djaaa + 1)) {
        // dernier calcul le mois précédent
        this.v1m = v1m
        this.v2m = v2m
        this.trm = 0
        this.hist[djamm - 1] = new Uint8Array([this.q1, this.q2, r1, r2, r3])
        this.hist[djmm - 1] = new Uint8Array([this.q1, this.q2, r1, r2, 0])
        this.shiftTr(nbjm - djajj + djjj) // shift de l'historique
      } else {
        // plus d'un mois depuis le dernier calcul
        // fin du mois du dernier calcul : nb jours du mois du dernier calcul - dja.nbjm
        const nbm = 12 - djamm + djmm + (12 * (djaa - djaaa)) // nb de mois depuis dernier calcul
        this.v1m = v1m
        this.v2m = v2m
        this.trm = 0
        this.shiftTr(NTRJ) // shift de l'historique (raz, plus de NTRJ jours
        if (nbm >= 12) {
          for (let i = 0; i < 12; i++) this.hist[i] = new Uint8Array([this.q1, this.q2, r1, r2, 0])
        } else {
          this.hist[djamm - 1] = new Uint8Array([this.q1, this.q2, r1, r2, r3]) // le dernier mois calculé
          if (djamm < djmm) {
            // dans la même année : suivant avec tr = 0
            for (let i = djamm; i < djmm; i++) this.hist[i] = new Uint8Array([this.q1, this.q2, r1, r2, 0])
          } else {
            // sur fin d'anée et début suivante avec tr = 0
            for (let i = djamm; i < 12; i++) this.hist[i] = new Uint8Array([this.q1, this.q2, r1, r2, 0])
            for (let i = 0; i < djmm; i++) this.hist[i] = new Uint8Array([this.q1, this.q2, r1, r2, 0])
          }
        }
      }
    }
    this.j = this.dj
  }
}

/* Une "amj" est un entier de la forme aaaammjj qui indique "un jour"
Le problème est que le même jour 2024-04-01 ne correspond pas un même instant,
- en "local à Tokyo"
- en "local à Paris"
- en UTC.
Ainsi "maintenant" doit être spécifié amjUtc() ou amjLoc() pour obtenir une amj :
- les valeurs seront différentes entre 0 et 2h du matin (UTC passe plus "tard" au jour suivant)

Une "amj" peut être interprtée comme Loc (locale) ou Utc, ce qu'il faut spécifier 
quand on l'utilise pour signifier un instant.
*/
export class AMJ {
  static get nbjm () { return [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] }

  // Dernier jour du mois M de l'année A
  static djm (a, m) { return (m === 2) && (a % 4 === 0) ? AMJ.nbjm[m] + 1 : AMJ.nbjm[m] }
  
  static zp (n) { return n > 9 ? '' + n: '0' + n }

  /* Retourne [a, m, j] depuis une amj */
  static aaaa (amj) { return Math.round(amj / 10000) }

  static mm (amj) { return Math.round((amj % 10000) / 100) }

  static jj (amj) { return amj % 100 }

  static aaaammjj (amj) { return [AMJ.aaaa(amj), AMJ.mm(amj), AMJ.jj(amj)] }
  
  /* Edite une amj avec des - séparateurs */
  static editDeAmj (amj) { 
    if (!amj) return '?'
    const [a, m, j] = AMJ.aaaammjj(amj)
    return '' + a + '-' + AMJ.zp(m) + '-' + AMJ.zp(j) 
  }
  
  /* Retourne une amj depuis une forme éditée 'aaaa-mm-jj' */
  static amjDeEdit (edit) { 
    const [a, m, j] = [ parseInt(edit.substring(0,4)), parseInt(edit.substring(5,7)), parseInt(edit.substring(8)) ]
    return (a * 10000) + (m * 100) + j
  }

  // epoch d'une amj représentant un jour local
  static tDeAmjLoc (amj) { const [a, m ,j] = AMJ.aaaammjj(amj); return new Date(a, m - 1, j).getTime() }
  
  // epoch d'une amj représentant un jour utc
  static tDeAmjUtc (amj) { const [a, m ,j] = AMJ.aaaammjj(amj); return Date.UTC(a, m - 1, j) }

  // Retourne l'amj locale d'une epoch
  static amjLocDeT (t) {
    const d = new Date(t); const [a, m, j] = [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    return (a * 10000) + (m * 100) + j
  }

  // Retourne l'amj utc d'une epoch
  static amjUtcDeT (t) {
    const d = new Date(t); const [a, m, j] = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]
    return (a * 10000) + (m * 100) + j
  }

  // amj du jour actuel "local"
  static amjLoc () { return AMJ.amjLocDeT( Date.now() )}

  // amj du jour actuel "utc"
  static amjUtc () { return AMJ.amjUtcDeT( Date.now() )}

  // jour de la semaine de 1 (Lu) à 7 (Di) d'une amj locale
  static jDeAmjLoc (amj) { const d = new Date(AMJ.tDeAmjLoc(amj)); const j = d.getDay(); return j === 0 ? 7 : j }

  // jour de la semaine de 1 (Lu) à 7 (Di) d'une amj utc
  static jDeAmjUtc (amj) { const d = new Date(AMJ.tDeAmjUtc(amj)); const j = d.getDay(); return j === 0 ? 7 : j }

  // Retourne le nombre de jours entre 2 amj
  static diff (amj1, amj2) { return (AMJ.tDeAmjUtc(amj1) - AMJ.tDeAmjUtc(amj2)) / 86400000 }

  // Retourne l'amj + N jours (locale) de celle passée en argument
  static amjUtcPlusNbj(amj, nbj) {
    const d = new Date(AMJ.tDeAmjUtc(amj))
    d.setDate(d.getDate() + nbj)
    return AMJ.amjUtcDeT(d.getTime())
  }

  // Retourne l'amj + N jours (utc) de celle passée en argument
  static amjLocPlusNbj(amj, nbj) {
    const d = new Date(AMJ.tDeAmjLoc(amj))
    d.setDate(d.getDate() + nbj)
    return AMJ.amjLocDeT(d.getTime())
  }

  // Retourne l'amj de l'amj passée en argument + 1 mois (en restant dans les jours acceptables)
  static plusUnMois (amj) {
    const [a, m, j] = AMJ.aaaammjj(amj)
    if (m === 12) return ((a + 1) * 10000) + 100 + j
    const jm = AMJ.djm(a, m + 1)
    return (a * 10000) + ((m + 1) * 100) + (j < jm ? j : jm)
  }

  // Retourne l'amj de l'amj passée en argument - 1 mois (en restant dans les jours acceptables)
  static moinsUnMois (amj) {
    const [a, m, j] = AMJ.aaaammjj(amj)
    if (m === 1) return ((a - 1) * 10000) + 1200 + j
    const jm = AMJ.djm(a, m - 1)
    return (a * 10000) + ((m - 1) * 100) + (j < jm ? j : jm)
  }

  // Retourne l'amj du dernier jour du mois de celle passée en argument
  static djMois (amj) {
    const [a, m, ] = AMJ.aaaammjj(amj)
    return (a * 10000) + (m * 100) + AMJ.djm(a, m)
  }

  // Retourne l'amj du dernier jour du mois de celle passée en argument
  static pjMois (amj) {
    const [a, m, ] = AMJ.aaaammjj(amj)
    return (a * 10000) + (m * 100) + 1
  }

  // Retourne l'amj du dernier jour du mois de celle passée en argument
  static djMoisPrec (amj) {
    const [a, m, ] = AMJ.aaaammjj(amj)
    const [ap, mp] = m === 1 ? [a - 1, 12] : [a, m - 1]
    return (ap * 10000) + (mp * 100) + AMJ.djm(ap, mp)
  }

  // Retourne l'amj du dernier jour du mois de celle passée en argument
  static pjMoisSuiv (amj) {
    const [a, m, ] = AMJ.aaaammjj(amj)
    const [ap, mp] = m === 12 ? [a + 1, 1] : [a, m + 1]
    return (ap * 10000) + (mp * 100) + 1
  }

  // Retourne l'amj du dernier jour du mois de celle passée en argument
  static djAnnee (amj) {
    const [a, , ] = AMJ.aaaammjj(amj)
    return (a * 10000) + 1200 + 31
  }

  // Retourne l'amj du dernier jour du mois de celle passée en argument
  static pjAnnee (amj) {
    const [a, , ] = AMJ.aaaammjj(amj)
    return (a * 10000) + 100 + 1
  }

  // Retourne l'amj du dernier jour du mois de celle passée en argument
  static djAnneePrec (amj) {
    const [a, , ] = AMJ.aaaammjj(amj)
    return ((a - 1) * 10000) + 1200 + 31
  }

  // Retourne l'amj du dernier jour du mois de celle passée en argument
  static pjAnneeSuiv (amj) {
    const [a, , ] = AMJ.aaaammjj(amj)
    return ((a + 1) * 10000) + 100 + 1
  }
  
}

/* Tests
console.log(AMJ.amjLoc(), AMJ.amjUtc())

const t1 = Date.UTC(2023, 2, 2, 23, 30) // le 2 mars en UTC, le 3 mars en local
const t2 = new Date(2023, 2, 3, 0, 30).getTime() // le 2 mars en UTC, le 3 mars ebn local
console.log(AMJ.amjUtcDeT(t1), AMJ.amjLocDeT(t1))
console.log(AMJ.amjUtcDeT(t2), AMJ.amjLocDeT(t2))

const amj29f = 20240229
const amj1a = 20240401
console.log(AMJ.editDeAmj(amj29f))
console.log(AMJ.amjDeEdit('2024-02-29'))

const tl = AMJ.tDeAmjLoc(amj29f)
console.log(new Date(tl))
const tu = AMJ.tDeAmjUtc(amj29f)
console.log(tl, tu, (tl - tu) / 60000)
console.log(AMJ.jDeAmjLoc(amj29f), AMJ.amjLocDeT(tl), AMJ.amjUtcDeT(tl))

const x1 = AMJ.amjUtcPlusNbj(amj29f, 1)
console.log(x1)
console.log(AMJ.diff(x1, amj29f))
const x2 = AMJ.amjUtcPlusNbj(amj29f, 365)
console.log(x2)
console.log(AMJ.diff(x2, amj29f))
console.log(AMJ.amjUtcPlusNbj(amj1a, 365))

console.log(AMJ.djMois(amj29f), AMJ.pjMois(amj29f), AMJ.pjMoisSuiv(amj29f), AMJ.djMoisPrec(amj29f))
console.log(AMJ.djAnnee(amj29f), AMJ.pjAnnee(amj29f), AMJ.pjAnneeSuiv(amj29f), AMJ.djAnneePrec(amj29f))

const amj31j = 20230131
console.log(AMJ.plusUnMois(amj31j), AMJ.moinsUnMois(amj31j))
*/
