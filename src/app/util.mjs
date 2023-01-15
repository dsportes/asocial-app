import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'

import { useI18n } from 'vue-i18n'
import { arrayBuffer, random, concat } from './webcrypto.mjs'
import { toByteArray, fromByteArray } from './base64.mjs'
import { reconnexion } from './connexion.mjs'
import { ProcessQueue } from './synchro.mjs'

let pako

export function setRequiredModules (m) { 
  pako = m.pako
}

export async function traiterQueue (q) {
  const op = new ProcessQueue()
  await op.run(q) // ne sort jamais en exception
}

const decoder = new TextDecoder('utf-8')
const encoder = new TextEncoder('utf-8')

/* i18n : fonction $t() ********************************************/
let fnt
export function $t (a, b, c) { if (!fnt) fnt = useI18n().t; return fnt(a, b, c) }

export function html (exc) {
  const str = exc.code + ' - ' + 
    (!exc.args ? $t('EX' + exc.code) : $t('EX' + exc.code, exc.args))
  return str.replace(/\n/g, '<br>')
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

export function egaliteU8(a, b) {
  if ((!a && b) || (!b && a)) return false
  if (!a && !b) return true
  if (a.length !== b.length) return false
  for(let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/* dates et heures, dlv *************************************************************/
export function sleep (delai) {
  if (delai <= 0) return
  return new Promise((resolve) => { setTimeout(() => resolve(), delai) })
}

const j0 = Math.floor(new Date('2020-01-01T00:00:00').getTime() / 86400000)
export function getJourJ () {
  return Math.floor(new Date().getTime() / 86400000) - j0
}

/* `dlv` : date limite de validité, en nombre de jours depuis le 1/1/2020. */
export function dlvDepassee (dlv) { return dlv !== 0 && dlv < getJourJ() }

export function dhstring (date) { return stores.config.dtf.format(date) }

let auj, hier
export function aujhier () {
  const now = new Date()
  if (auj && now.getFullYear() === auj.getFullYear() && now.getMonth() === auj.getMonth() && now.getDate() === auj.getDate()) return [auj, hier]
  auj = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  hier = new Date(auj.getTime() - 86400000)
  return [auj, hier]
}

export function dhcool (timems, sec) {
  if (!timems) return '(non daté)'
  aujhier()
  const d = new Date(timems)
  const mm = auj.getFullYear() === d.getFullYear() && auj.getMonth() === d.getMonth()
  if (mm && auj.getDate() === d.getDate()) {
    const t = stores.config.dtf2.format(d)
    return $t('auja', [sec ? t : t.substring(0, 5)])
  }
  if (hier.getFullYear() === d.getFullYear() && hier.getMonth() === d.getMonth() && hier.getDate() === d.getDate()) {
    const t = stores.config.dtf2.format(d)
    return $t('hiera', [sec ? t : t.substring(0, 5)])
  }
  if (mm) {
    const t = stores.config.dtf2.format(d)
    return $t('lea', [d.getDay(), sec ? t : t.substring(0, 5)])
  }
  const t = stores.config.dtf1.format(d)
  return sec ? t : t.substring(0, t.length - 3)
}

/* gzip / ungzip ***************************************************/
export function gzipT (data) { return pako.gzip(data) }

export function ungzipT (data) { return pako.ungzip(data) }

export function gzip (arg) {
  if (!arg) return null
  // t: 0:binaire, 1:texte zippé, 2:texte non zippé
  const t = typeof arg === 'string' ? (arg.length > 1024 ? 1 : 2) : 0
  let u8 = t ? encoder.encode(arg) : arg
  if (t < 2) u8 = pako.deflate(u8)
  return concat([new Uint8Array([t]), u8])
}

export function ungzip (arg) {
  if (!arg || arg.length < 1) return null
  const t = arg[0]
  const c = arg.slice(1)
  const res = t < 2 ? pako.inflate(c) : c
  return t ? decoder.decode(arrayBuffer(res)) : res
}

/* divers *****************************************************************/
export function splitPK(pk) {
  if (!pk) return { id: 0, id2: 0 }
  const i = pk.indexOf('/')
  if (i === -1) return { id: parseInt(pk), id2: 0}
  return { id: parseInt(pk.substring(0, i)), id2: parseInt(pk.substring(i + 1))}
}

// eslint-disable-next-line no-control-regex
const regex = /[.<>:"/\\|?* \x00-\x1F]/g
// eslint-disable-next-line no-control-regex
const regexdot = /[<>:"/\\|?* \x00-\x1F]/g
export function normpath (s, dot) { return s.replace(dot ? regexdot : regex, '_') }

export function edvol (vol) {
  const v = vol || 0
  if (v < 1000) return v + 'o'
  if (v < 1000000) return (v / 1000).toPrecision(3) + 'Ko'
  if (v < 1000000000) return (v / 1000000).toPrecision(3) + 'Mo'
  return (v / 1000000000).toPrecision(3) + 'Go'
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
    return m.substring(0, (i === -1 || i > lgtitre ? lgtitre : i))
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

/* retourne un safe integer hash:
- d'un string
- d'un u8 : dans ce cas le hash est multiple de 4
*/
export function hash (arg) {
  const t = typeof arg
  const bin = t !== 'string'
  // https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0, ch; i < arg.length; i++) {
    ch = bin ? arg[i] : arg.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (bin ? + ((h1 >> 2) << 2) : (h1 >>> 0))
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

export async function afficherDiag (diag, ok, cancel) {
  const $q = stores.config.$q
  return new Promise((resolve) => {
    if (!cancel) {
      $q.dialog({
        dark: true,
        html: true,
        title: $t('UTIatt'),
        message: diag,
        ok: { color: 'primary', label: $t(ok || 'jailu') }
      }).onOk(() => { resolve() })
    } else {
      $q.dialog({
        dark: true,
        html: true,
        title: $t('UTIatt'),
        message: diag,
        ok: { color: 'primary', label: $t(ok) },
        cancel: { color: 'warning', label: $t(concel) },
      })
      .onOk(() => { resolve(true) })
      .onCancel(() => { resolve(false) })
    }
  })
}

export function setTrigramme (nombase, trig) {
  const nt = '$asocial$-trigrammes'
  const x = localStorage.getItem(nt)
  const trigs = x ? decode(b64ToU8(x)) : {}
  if (trig) {
    trigs[nombase] = trig
  } else delete trigs[nombase]
  localStorage.setItem(nt, u8ToB64(encode(trigs), true))
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
        model: '',
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
