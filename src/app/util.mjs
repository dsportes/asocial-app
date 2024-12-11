import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'

import { toByteArray, fromByteArray } from './base64.mjs'
import { AMJ, appexc } from './api.mjs'

/* i18n : fonction $t() ********************************************/
export let $t
export let $q
export function set$t (t, q) { $t = t; $q = q}

let pako

export const interdits = '< > : " / \\ | ? *'
// eslint-disable-next-line no-control-regex
export const regInt = /[<>:"/\\|?*\x00-\x1F]/
// eslint-disable-next-line no-control-regex
export const regIntg = /[<>:"/\\|?*\x00-\x1F]/g
// eslint-disable-next-line no-control-regex
export const regInt2g = /[\u{0180}-\u{10FFFF}]/gu

export function setRequiredModules (m) { 
  pako = m.pako
}

export function random (nbytes) {
  const u8 = new Uint8Array(nbytes)
  window.crypto.getRandomValues(u8)
  return u8
}

export function arrayBuffer (u8) {
  // https://stackoverflow.com/questions/37228285/uint8array-to-arraybuffer
  return u8 ? u8.buffer.slice(u8.byteOffset, u8.byteLength + u8.byteOffset) : null
}

export function dkli (idx) {
  // if (!$q) $q = useQuasar()
  return ($q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0')) + ' '
}

export function bcf () { return $q.dark.isActive ? ' bordfonce' : ' bordclair' }

export function styp (sz) { 
  // if (!$q) $q = useQuasar()
  return ($q.dark.isActive ? 'sombre bsf pw' : 'clair bsc pw') + (sz || 'md') + ' '
}

export function sty () { 
  // if (!$q) $q = useQuasar()
  return $q.dark.isActive ? 'sombre ' : 'clair '
}

const decoder = new TextDecoder('utf-8')
const encoder = new TextEncoder('utf-8')

let audioContext = null

export async function beep() {
  const config = stores.config
  if (config.silence) return
  if (!audioContext) audioContext = new AudioContext()
  const b64 = config.beep.substring(config.beep.indexOf(',') + 1)
  const beep = toByteArray(b64)

  const b = await audioContext.decodeAudioData(beep.buffer) // (arrayBuffer)
  const source = audioContext.createBufferSource() // creates a sound source
  source.buffer = b                  // tell the source which sound to play
  source.connect(audioContext.destination)       // connect the source to the context's destination (the speakers)
  source.start()                          // play the source now
}

export function html (exc) {
  const str = !exc.args ? $t('EX' + exc.code) : $t('EX' + exc.code, exc.args)
  return  exc.code + ' - ' + str.replace(/\n/g, '<br>')
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
  ui.setPage('accueil')
  if (opt === 1) { ui.setPage('accueil'); return }
  if (opt === 2) { ui.fD(); return }
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

export function union (setA, setB) { // element de A ou de B
  const u = new Set()
  for (const elem of setA) elem.add(elem)
  for (const elem of setB) elem.add(elem)
  return u
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

export function dhcool (timems, sec, pash) {
  if (!timems) return $t('nondate')
  aujhier()
  const dx = new Date(timems)
  const d = [dx.getFullYear(), dx.getMonth(), dx.getDate()]
  const mm = auj[0] === d[0] && auj[1] === d[1]
  if (mm && auj[2] === d[2]) {
    return pash ? $t('auja') : $t('aujah', [hms(dx, sec)])
  }
  if (hier[0] === d[0] && hier[1] === d[1] && hier[2] === d[2]) {
    return pash ? $t('hiera') : $t('hierah', [hms(dx, sec)])
  }
  if (mm) {
    return pash ? $t('lea', [d[2]]) : $t('leah', [d[2], hms(dx, sec)])
  }
  return pash ? $t('ja', [aaaammjj(dx)]) : $t('jah', [aaaammjj(dx), hms(dx, sec)])
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
  return d.toISOString(d)
  // return aaaammjj(d) + ' ' + hms(d, sec)
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
export function gzipT (data) { return pako.gzip(data) }

export function ungzipT (data) { return pako.ungzip(data) }

export function gzipB (arg) {
  if (!arg) return null
  // t: 0:binaire, 1:texte zippé, 2:texte non zippé
  const t = typeof arg === 'string' ? (arg.length > 1024 ? 1 : 2) : 0
  let u8 = t ? encoder.encode(arg) : arg
  if (t < 2) u8 = gzipT(u8)
  const res = new Uint8Array(u8.length + 1)
  res.set(u8, 1)
  res.set([t], 0)
  return res
}

export function ungzipB (arg) {
  if (!arg || arg.length < 1) return null
  const t = arg[0]
  const c = arg.slice(1)
  const res = t < 2 ? ungzipT(c) : c
  return t ? decoder.decode(arrayBuffer(res)) : res
}


/* divers *****************************************************************/
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

/*
export function mon (v, n) { // n : nombres de chiffres après les centimes
  if (!v) return '0c'
  const p = v < 0 ? -v : v
  const s = v < 0 ? '-' : ''
  if (!n) return s + Math.round(p) + 'c'
  return s + p.toFixed(n).replace('.', ',') + 'c'
}
*/

const chouia = '0.000000000000000'

export function mon (v, n) { // n : si décimal, nombre de chiffres significatifs
  if (!v) return '0c'
  const p = v < 0 ? -v : v
  const s = v < 0 ? '-' : ''
  const e = Math.floor(p)
  if (e === p) return s + p + 'c' // Entier
  const es = ('' + e).length
  if (es >= n) return s + Math.round(p) + 'c' // Décimal mais assez de chiffres sur entier
  if (p < 1) {
    const x = (p.toFixed(n)) // 0.00..999
    const y = chouia.substring(0, n + 2)
    if (x === y) return s + '<' + (chouia.substring(0, n + 1) + '1').replace('.', ',') + 'c'
    return s + x.replace('.', ',') + 'c'
  }
  return s + p.toPrecision(n).replace('.', ',') + 'c'
}

/*
console.log(mon(1234, 0), '1234')
console.log(mon(1234, 3), '1234')
console.log(mon(1234, 6), '1234')
console.log(mon(123.4567, 3), '123')
console.log(mon(123.4567, 6), '123.457')
console.log(mon(0.1234567, 2), '0.12')
console.log(mon(0.1234567, 5), '0.12346')
console.log(mon(0.0001234567, 3), '<0.001')
console.log(mon(12.01234567, 4), '12.01')
console.log(mon(1.0001234567, 6), '1.00012')
*/

export function nbn (vol, n, u) { // v: nombre de notes ... n: avec décimales
  const v = vol || 0
  if (v === 0) return '0'
  if (!n) {
    if (v < 1000) return v + (u || '')
    if (v < 1000000) return (v / 1000).toPrecision(3) + 'K ' + (u || '')
    return (v / 1000000).toPrecision(3) + 'M ' + (u || '')
  }
  return vol.toFixed(n)
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
    let i = m.indexOf('\n')
    const s = m.substring(0, (i === -1 || i > lgtitre ? lgtitre : i))
    i = 0
    for (let j = 0; j < s.length; j++) if (s.charAt(j) !== '#') { i = j; break }
    return i ? s.substring(i) : s
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

/* Retourne l'année et le mois depuis un code à 6 lettres */
export function amDeL6 (l6) {
  const a = new Date().getFullYear()
  const pa = a % 2
  const c = l6.charCodeAt(0) - 64
  const [p, m] = c > 12 ? [1, c - 12] : [0, c]
  return [p === pa ? a : a - 1, m]
}

export function suffixe (int) {
  const s = '0000' + int
  return s.substring(s.length - 4, s.length)
}

/************************************************************************/
export function normNomFichier (v) {
  if (!v) return ''
  const v2 = v.trim()
  const i = v2.lastIndexOf('.')
  const v3 = i === -1 ? v2 : v2.substring(0, i)
  return v3.replace(regIntg, '_').replace(regInt2g, '')
}

export function normNom (v, max) {
  if (!v) return ''
  const s = v.trim().replace(regIntg, '').replace(regInt2g, '')
  return s.length > max ? s.substring(0, max) : s
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
    ui.oD('diag', 'a')
  })
}

export async function afficher8000 (r, idg, ida) {
  if (r === 1) await afficherDiag(this.$t('EX8001a', [ida]))
  else await afficherDiag(this.$t('EX8002a', [idg]))
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

export class HelpTree {
  constructor (plan) {
    this.arbre = []
    this.helpPages = new Map()

    plan.forEach(p => {
      if (typeof p === 'string') {
        if (this.helpPages.has(p)) console.log('Doublon page help: ' + p)
        else {
          this.helpPages.set(p, null)
          this.arbre.push({ id: p, label: $t('A_' + p), children: [], type: 1 })
        }
      } else {
        this.node(null, null, p, 1)
      }
    })
  }

  node (chp, parentId, page, n) { // page est un Array de la liste de la page et de ses sous pages
    if (!page.length) return
    if (this.helpPages.has(page[0])) {
      console.log('Doublon page help: ' + page[0])
      return
    }
    this.helpPages.set(page[0], parentId)
    const ch = []
    page.forEach((p, i) => {
      if (i) {
        if (typeof p === 'string') {
          if (this.helpPages.has(p)) console.log('Doublon page help: ' + p)
          else {
            this.helpPages.set(p, page[0])
            ch.push({ id: p, label: $t('A_' + p), children: [], type: n + 1 })
          }
        } else {
          this.node(ch, page[0], p, n + 1)
        }
      }
    })
    const x = chp || this.arbre
    x.push({ id: page[0], label: $t('A_' + page[0]), children: ch, type: n })
  }
}
