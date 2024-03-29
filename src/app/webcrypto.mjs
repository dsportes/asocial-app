/***********************************************
IMPLEMENTATION de webcrypto.js EN UTILISANT Web Cryptography API (sans Node)
***********************************************/

import { sha256 as jssha256 } from 'js-sha256'
import { toByteArray, fromByteArray } from './base64.mjs'
import { AppExc, E_BRO } from './api.mjs'
import { $t } from './util.mjs'

const SALTS = new Array(256)

{
  const s = new Uint8Array([5, 255, 10, 250, 15, 245, 20, 240, 25, 235, 30, 230, 35, 225, 40, 220])
  SALTS[0] = s
  for (let i = 1; i < 256; i++) {
    const x = new Uint8Array(16)
    for (let j = 0; j < 16; j++) x[j] = (s[j] + i) % 256
    SALTS[i] = x
  }
}

function ab2b (ab) { return new Uint8Array(ab) }

const enc = new TextEncoder()
const dec = new TextDecoder()

export async function pbkfd (secret) {
  const u8 = typeof secret === 'string' ? enc.encode(secret) : secret
  const passwordKey = await window.crypto.subtle.importKey('raw', u8, 'PBKDF2', false, ['deriveKey'])
  const key = await window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt : SALTS[0], iterations: 5000, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  const res = await window.crypto.subtle.exportKey('raw', key)
  return ab2b(res)
}

export function sha256 (buffer) {
  // return ab2b(await window.crypto.subtle.digest('SHA-256', buffer))
  return ab2b(jssha256.arrayBuffer(buffer))
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

export async function crypter (cle, u8, idxIV) {
  try {
    if (typeof u8 === 'string') u8 = enc.encode(u8)
    if (!(cle instanceof Uint8Array) || cle.length !== 32) throw new Error($t('EX4010'))
    if (!(u8 instanceof Uint8Array)) throw new Error($t('EX4011'))
    const n = !idxIV ? Number(random(1)) : idxIV
    const iv = SALTS[n]
    const x0 = new Uint8Array(1).fill(n)
    const key = await window.crypto.subtle.importKey('raw', arrayBuffer(cle), 'aes-cbc', false, ['encrypt'])
    const buf = await crypto.subtle.encrypt({ name: 'aes-cbc', iv: iv }, key, arrayBuffer(u8))
    return ab2b(concat([x0, new Uint8Array(buf)]))
  } catch (e) {
    const x1 = JSON.stringify(u8.slice(0, 4))
    const x2 = JSON.stringify(cle.slice(0, 4))
    throw new AppExc(E_BRO, 7, [x1, x2, e.toString()], e.stack)
  }
}

export async function decrypter (cle, u8) {
  try {
    if (!(cle instanceof Uint8Array) || cle.length !== 32) throw new Error($t('EX4012'))
    if (!(u8 instanceof Uint8Array)) throw new Error($t('EX4013'))
      const key = await window.crypto.subtle.importKey('raw', arrayBuffer(cle), 'aes-cbc', false, ['decrypt'])
    const iv = SALTS[Number(u8[0])]
    const r = await crypto.subtle.decrypt({ name: 'aes-cbc', iv: iv }, key, arrayBuffer(u8.slice(1)))
    return ab2b(r)
  } catch (e) {
    const x1 = JSON.stringify(u8.slice(0, 4))
    const x2 = JSON.stringify(cle.slice(0, 4))
    throw new AppExc(E_BRO, 8, [x1, x2, e.toString()], e.stack)
  }
}

export async function decrypterStr (cle, buffer) {
  const buf = await decrypter(cle, buffer)
  return dec.decode(arrayBuffer(buf))
}

function abToPem (ab, pubpriv) { // ArrayBuffer
  const s = fromByteArray(new Uint8Array(ab))
  let i = 0
  const a = ['-----BEGIN ' + pubpriv + ' KEY-----']
  while (i < s.length) {
    a.push(s.substring(i, i + 64))
    i += 64
  }
  a.push('-----END ' + pubpriv + ' KEY-----')
  return a.join('\n')
}

function keyToU8 (pem, pubpriv) {
  const d = '-----BEGIN ' + pubpriv + ' KEY-----'
  const f = '-----END ' + pubpriv + ' KEY-----'
  const s = pem.substring(d.length, pem.length - f.length)
  return toByteArray(s.replace(/\n/g, ''))
}

export async function genKeyPair (asPem) {
  const rsaOpt = { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([0x01, 0x00, 0x01]), hash: { name: 'SHA-256' } }
  const key = await window.crypto.subtle.generateKey(rsaOpt, true, ['encrypt', 'decrypt'])
  const jpriv = await window.crypto.subtle.exportKey('pkcs8', key.privateKey)
  const jpub = await window.crypto.subtle.exportKey('spki', key.publicKey)
  if (asPem) return { publicKey: abToPem(jpub, 'PUBLIC'), privateKey: abToPem(jpriv, 'PRIVATE') }
  return { publicKey: new Uint8Array(jpub), privateKey: new Uint8Array(jpriv) }
}

export async function crypterRSA (clepub, u8) {
  try {
    if (typeof u8 === 'string') u8 = enc.encode(u8)
    const k = typeof clepub === 'string' ? keyToU8(clepub, 'PUBLIC') : clepub
    if (!(k instanceof Uint8Array)) throw new Error($t('EX4014'))
    if (!(u8 instanceof Uint8Array)) throw new Error($t('EX4015'))  
    // !!! SHA-1 pour que Node puisse decrypter !!!
    const key = await window.crypto.subtle.importKey('spki', arrayBuffer(k), { name: 'RSA-OAEP', hash: 'SHA-1' }, false, ['encrypt'])
    const buf = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, arrayBuffer(u8))
    return ab2b(buf)
  } catch (e) {
    const x1 = JSON.stringify(u8.slice(0, 4))
    const x2 = JSON.stringify(k.slice(0, 4))
    throw new AppExc(E_BRO, 21, [x1, x2, e.toString()], e.stack)
  }
}

export async function decrypterRSA (clepriv, u8) {
  try {
    const k = typeof clepriv === 'string' ? keyToU8(clepriv, 'PRIVATE') : clepriv
    if (!(k instanceof Uint8Array)) throw new Error($t('EX4016'))
    if (!(u8 instanceof Uint8Array)) throw new Error($t('EX4017'))
      // !!! SHA-1 pour que Node puisse decrypter !!!
    const key = await window.crypto.subtle.importKey('pkcs8', arrayBuffer(k), { name: 'RSA-OAEP', hash: 'SHA-1' }, false, ['decrypt'])
    const r = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, key, arrayBuffer(u8))
    return ab2b(r)
  } catch (e) {
    const x1 = JSON.stringify(u8.slice(0, 4))
    const x2 = JSON.stringify(k.slice(0, 4))
    throw new AppExc(E_BRO, 20, [x1, x2, e.toString()], e.stack)
  }
}

export function concat (arrays) {
  // sum of individual array lengths
  const totalLength = arrays.reduce((acc, value) => acc + value.length, 0)
  if (!arrays.length) return null
  const result = new Uint8Array(totalLength)
  let length = 0
  for (const array of arrays) {
    result.set(array, length)
    length += array.length
  }
  return result
}

/* Cryptage Serveur *******************************/
const CLE = new Uint8Array(32)
{
  const s = new Uint8Array([5, 255, 10, 250, 15, 245, 20, 240, 25, 235, 30, 230, 35, 225, 40, 220])
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 16; j++) CLE[i + j] = (s[j] + i) % 256
  }
}
const IV = CLE.slice(8, 24)

export async function crypterSrv (u8) {
  try {
    const key = await window.crypto.subtle.importKey('raw', arrayBuffer(CLE), 'aes-cbc', false, ['encrypt'])
    return new Uint8Array(await crypto.subtle.encrypt({ name: 'aes-cbc', iv: IV }, key, arrayBuffer(u8)))
  } catch (e) {
    throw new AppExc(E_BRO, 7, ['', 'srv', e.toString()], e.stack)
  }
}

export async function decrypterSrv (u8) {
  try {
    const key = await window.crypto.subtle.importKey('raw', arrayBuffer(CLE), 'aes-cbc', false, ['decrypt'])
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'aes-cbc', iv: IV }, key, arrayBuffer(u8)))
  } catch (e) {
    throw new AppExc(E_BRO, 8, ['', 'srv', e.toString()], e.stack)
  }
}

/*
setTimeout(async () => {
  const x = await crypterSrv(enc.encode('toto est très très très très beau'))
  console.log(dec.decode(await decrypterSrv(x)))
}, 1)
*/
