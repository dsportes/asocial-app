import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import { useQuasar } from 'quasar'
import { gzip, gunzip } from 'zlib'

import { arrayBuffer, random, concat } from './webcrypto.mjs'
import { toByteArray, fromByteArray } from './base64.mjs'
import { AMJ, appexc } from './api.mjs'
import { MD } from './modele.mjs'

let $q

export function dkli (idx) {
  if (!$q) $q = useQuasar()
  return ($q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0')) + ' '
}

const decoder = new TextDecoder('utf-8')
const encoder = new TextEncoder('utf-8')

/* i18n : fonction $t() ********************************************/
let fnt
export function set$t (f) { fnt = f}
export function $t (a, b, c) { 
  return fnt(a, b, c)
}

export function html (exc) {
  const str = exc.code + ' - ' + 
    (!exc.args ? $t('EX' + exc.code) : $t('EX' + exc.code, exc.args))
  return str.replace(/\n/g, '<br>')
}

/* gère une exception Javascript inattendue
- l'affiche
- opt 1 : retourne à la page d'accueil
- opt 2 : ferme le dialogue en cours
- opt : fn() exécute cette fonction
*/
export async function trapex (e, opt) {
  const ui = stores.ui
  await ui.afficherExc(appexc(e))
  stores.ui.setPage('accueil')
  if (opt === 1) { stores.ui.setPage('accueil'); return }
  if (opt === 2) { MD.fD(); return }
  if (typeof opt === 'function') { opt(); return }
  return
}

/* Sets, u8 egalité************************************************************/
export function difference (setA, setB) { // element de A pas dans B
  const diff = new Set(setA)
  for (const elem of setB) diff.delete(elem)
  return diff
}

export function intersection (setA, setB) { // element de A aussi dans B
  const inter = new Set()
  for (const elem of setA) if (setB.has(elem)) inter.add(elem)
  return inter
}

export function egalite (setA, setB) {
  if (setA.size !== setB.size) return false
  for (const elem of setA) if (!setB.has(elem)) return false
  for (const elem of setB) if (!setA.has(elem)) return false
  return true
}

export function egaliteU8 (a, b) {
  if ((!a && b) || (!b && a)) return false
  if (!a && !b) return true
  if (a.length !== b.length) return false
  for(let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

export function inverse (a) {
  const b = new Uint8Array(a.length)
  for(let i = 0; i < a.length; i++) b[a.length - 1 - i] = a[i]
  return b
}

/* dates et heures, dlv *************************************************************/
export function sleep (delai) {
  if (delai <= 0) return
  return new Promise((resolve) => { setTimeout(() => resolve(), delai) })
}

let auj, hier
export function aujhier () {
  const now = new Date()
  const n = [now.getFullYear(), now.getMonth(), now.getDate()]
  if (auj && n[0] === auj[0] && n[1] === auj[1] && n[2] === auj[2]) return
  const h = new Date(now.getTime() - 86400000)
  auj = n
  hier = [h.getFullYear(), h.getMonth(), h.getDate()]
}

export function dhcool (timems, sec) {
  if (!timems) return $t('nondate')
  aujhier()
  const dx = new Date(timems)
  const d = [dx.getFullYear(), dx.getMonth(), dx.getDate()]
  const mm = auj[0] === d[0] && auj[1] === d[1]
  if (mm && auj[2] === d[2]) {
    return $t('auja', [hms(dx, sec)])
  }
  if (hier[0] === d[0] && hier[1] === d[1] && hier[2] === d[2]) {
    return $t('hiera', [hms(dx, sec)])
  }
  if (mm) {
    return $t('lea', [d[2], hms(dx, sec)])
  }
  return aaaammjj(dx) + ' ' + hms(dx, sec)
}

export function hms (t, sec) {
  if (!t) return '?'
  const d = t instanceof Date ? t : new Date(t)
  const hh = AMJ.zp(d.getHours())
  const mm = ':' + AMJ.zp(d.getMinutes())
  const ss = sec ? ':' + AMJ.zp(d.getSeconds()) : ''
  return hh + mm + ss
}

export function aaaammjj (t) { 
  if (!t) return '?'
  const d = t instanceof Date ? t : new Date(t)
  const aa = d.getFullYear()
  const mm = '-' + AMJ.zp(d.getMonth() + 1)
  const jj = '-' + AMJ.zp(d.getDate())
  return aa + mm + jj
}

export function dhstring (t, sec) { 
  const d = t instanceof Date ? t : new Date(t)
  return aaaammjj(d) + ' ' + hms(d, sec)
}

/* data:image/svg+xml;base64,... to binaire ************/
export function photoToBin (t) {
  let i = t.indexOf(',')
  const bin = b64ToU8(t.substring(i+1))
  i = t.indexOf(';')
  const j = t.indexOf(':')
  const mime = t.substring(j+1, i)
  return [mime, bin]
}


/* gzip / ungzip ***************************************************/
export function gz (u8) {
  return new Promise((resolve, reject) => {
    gzip(u8, (err, buffer) => {
      if (err) reject(err); else resolve(new Uint8Array(buffer))
    })
  })
}

export function ungz (u8) {
  return new Promise((resolve, reject) => {
    gunzip(u8, (err, buffer) => {
      if (err) reject(err); else resolve(new Uint8Array(buffer))
    })
  })
}

export async function gzipT (data) { return await gz(encoder.encode(data)) }

export async function ungzipT (data) { return decoder.decode(await ungz(data)) }

export async function gzipB (arg) {
  if (!arg) return null
  // t: 0:binaire, 1:texte zippé, 2:texte non zippé
  const t = typeof arg === 'string' ? (arg.length > 1024 ? 1 : 2) : 0
  let u8 = t ? encoder.encode(arg) : arg
  if (t < 2) u8 = await gz(u8)
  return concat([new Uint8Array([t]), u8])
}

export async function ungzipB (arg) {
  if (!arg || arg.length < 1) return null
  const t = arg[0]
  const c = arg.slice(1)
  const res = t < 2 ? await ungz(c) : c
  return t ? decoder.decode(arrayBuffer(res)) : res
}


/* divers *****************************************************************/
export function splitPK(pk) {
  if (!pk) return { id: 0, ids: 0 }
  const i = pk.indexOf('/')
  if (i === -1) return { id: parseInt(pk), ids: 0}
  return { id: parseInt(pk.substring(0, i)), ids: parseInt(pk.substring(i + 1))}
}

export function deselect (u8, idx) {
  if (!u8) return new Uint8Array(0)
  const s = new Set(u8)
  if (!s.has(idx)) return u8
  s.delete(idx)
  const l = Array.from(s)
  return new Uint8Array(l.sort())
}

export function select (u8, idx) {
  if (!u8) return new Uint8Array([idx])
  const s = new Set(u8)
  s.add(idx)
  const l = Array.from(s)
  return new Uint8Array(l.sort())
}

export function cloneU8 (u8) {
  if (!u8) return null
  const r = new Uint8Array(u8.length)
  u8.forEach((x, i) => { r[i] = x })
  return r
}

// eslint-disable-next-line no-control-regex
const regex = /[.<>:"/\\|?* \x00-\x1F]/g
// eslint-disable-next-line no-control-regex
const regexdot = /[<>:"/\\|?* \x00-\x1F]/g
export function normpath (s, dot) { return s.replace(dot ? regexdot : regex, '_') }

export function edvol (vol) {
  const v = vol || 0
  if (v === 0) return '0'
  if (v < 1000) return v + 'B'
  if (v < 1000000) return (v / 1000).toPrecision(3) + 'KB'
  if (v < 1000000000) return (v / 1000000).toPrecision(3) + 'MB'
  if (v < 1000000000000) return (v / 1000000000).toPrecision(3) + 'GB'
  if (v < 1000000000000000) return (v / 1000000000000).toPrecision(3) + 'TB'
  return (v / 1000000000000000).toPrecision(3) + 'PB'
}

export async function readFile (file, bin) {
  return new Promise((resolve, reject) => {
    const image = { size: file.size, name: file.name }
    if (!file.type) {
      image.type = file.name.endsWith('.md') || file.name.endsWith('.markdown') ? 'text/markdown' : 'application/octet-stream'
    } else image.type = file.type

    const reader = new FileReader()
    reader.addEventListener('load', (event) => {
      if (!bin) {
        image.b64 = event.target.result
      } else {
        image.u8 = new Uint8Array(event.target.result)
      }
      resolve(image)
    })
    reader.onerror = (error) => reject(error)
    if (!bin) {
      reader.readAsDataURL(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}

let lgtitre = 0
export function titre (m) {
  if (!lgtitre) lgtitre = stores.config.lgtitre
  if (m) {
    const i = m.indexOf('\n')
    const s = m.substring(0, (i === -1 || i > lgtitre ? lgtitre : i))
    return s.replaceAll('#', '')
  }
  return ''
}

/* conversions ************************************************************/
export function u8ToHex (u8) { return [...u8].map(b => b.toString(16).padStart(2, '0')).join('') }

export function Sid (id) { return id ? (typeof id === 'string' ? id : idToSid(id)) : '' }

/* trace des u8 en debug */
const TRACEU8 = false
export function tru8 (info, u8) {
  if (!TRACEU8 || !u8) return
  const l = u8.length
  if (!l) return
  if (l > 32) {
    const d = u8ToHex(u8.slice(0, 16))
    const f = u8ToHex(u8.slice(l - 16, l))
    console.log(info + ' [' + l + '] ' + d + ' ... ' + f)
  } else {
    console.log(info + ' [' + l + '] ' + u8ToHex(u8))
  }
}

export function u8ToB64 (u8, url) {
  const s = fromByteArray(u8)
  return !url ? s : s.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

export function b64ToU8 (s) {
  const diff = s.length % 4
  let x = s
  if (diff) {
    const pad = '===='.substring(0, 4 - diff)
    x = s + pad
  }
  return toByteArray(x.replace(/-/g, '+').replace(/_/g, '/'))
}

export function rnd6 () {
  const u8 = random(6)
  let r = u8[0]
  for (let i = 5; i > 0; i--) r += u8[i] * (p2[i - 1] + 1)
  return r
}

export function suffixe (int) {
  const s = '0000' + int
  return s.substring(s.length - 4, s.length)
}

/* retourne un safe integer (53 bits) hash:
- d'un string
- d'un u8
*/
export function hash (arg) {
  const t = typeof arg
  const bin = t !== 'string'
  /* https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
    Many of the answers here are the same String.hashCode hash function taken 
    from Java. It dates back to 1981 from Gosling Emacs, 
    is extremely weak, and makes zero sense performance-wise in
    modern JavaScript. 
    In fact, implementations could be significantly faster by using ES6 Math.imul,
    but no one took notice. 
    We can do much better than this, at essentially identical performance.
    Here's one I did—cyrb53, a simple but high quality 53-bit hash. 
    It's quite fast, provides very good* hash distribution,
    and because it outputs 53 bits, has significantly lower collision rates
    compared to any 32-bit hash.
    Also, you can ignore SA's CC license as it's public domain on my GitHub.
  */
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0, ch; i < arg.length; i++) {
    ch = bin ? arg[i] : arg.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export function u8ToInt (u8) {
  if (!u8 || !u8.length || u8.length > 8) return 0
  let r = 0
  for (let i = u8.length - 1; i > 0; i--) {
    r += u8[i] * (p2[i - 1] + 1)
  }
  r += u8[0]
  return r
}

const p2 = [255, (256 ** 2) - 1, (256 ** 3) - 1, (256 ** 4) - 1, (256 ** 5) - 1, (256 ** 6) - 1, (256 ** 7) - 1]
export function intToU8 (n) {
  if (n < 0) n = -n
  let l = 8
  for (let i = 6; i >= 0; i--, l--) if (n > p2[i]) break
  const u8 = new Uint8Array(l)
  for (let i = 0; i < 8; i++) {
    u8[i] = n % 256
    n = Math.floor(n / 256)
  }
  return u8
}

export function intToB64 (n) {
  return u8ToB64(intToU8(n), true)
}

export function b64ToInt (s) {
  return u8ToInt(b64ToU8(s, true))
}

export function idToSid (n) {
  return u8ToB64(intToU8(n), true)
}

export function SidToId (s) {
  return u8ToInt(b64ToU8(s, true))
}

export async function afficherDiag (diag) {
  const ui = stores.ui
  return new Promise((resolve) => {
    ui.diag = diag
    ui.diagresolve = resolve
    MD.oD('diag')
  })
}

export function setTrigramme (nombase, trig) {
  const nt = '$asocial$-trigrammes'
  const x = localStorage.getItem(nt)
  const trigs = x ? decode(b64ToU8(x)) : {}
  if (trig) {
    trigs[nombase] = trig
  } else delete trigs[nombase]
  localStorage.setItem(nt, u8ToB64(new Uint8Array(encode(trigs)), true))
}

export function getTrigramme () {
  const $q = stores.config.$q
  return new Promise((resolve) => {
    function ko (val) {
      return val.length !== 3 || val.search(/[^a-zA-Z]+/) !== -1
    }
    $q.dialog({
      title: $t('OPmsg7'),
      message: $t('OPmsg8'),
      prompt: {
        model: 'xxx',
        isValid: val => !ko(val),
        type: 'text'
      },
      cancel: true,
      persistent: true
    }).onOk(trig => { resolve(trig)
    }).onCancel(() => { resolve('xxx') }
    )
  })
}

