import { encode, decode } from '@msgpack/msgpack'
export const schemas = { forSchema, serialize, deserialize, clone }

export function serial (obj) {
  return new Uint8Array(encode(obj))
}

export function deserial (u8) {
  return decode(u8)
}

/* Gestion des schémas **************************************************/
const allTypes = {}

export function forSchema (s) {
  if (s && s.name) allTypes[s.name] = s
  return s
}

export function clone (s, src, dest) {
  deserialize(s, serialize(s, src), dest)
  return dest
}

export function serialize (s, src) {
  const sch = allTypes[s]
  const x = {}
  sch.cols.forEach((col) => { x[col] = src[col] })
  return serial(x)
}

export function deserialize (s, buf, dest) {
  const obj = deserial(buf)
  const sch = allTypes[s]
  const x = {}
  sch.cols.forEach((col) => {
    if (dest) {
      dest[col] = obj[col]
    } else {
      x[col] = obj[col]
    }
  })
  return dest || x
}
