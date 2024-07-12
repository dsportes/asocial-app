import Dexie from 'dexie'
import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import { NoteLocale, FichierLocal, Ficav } from './modele.mjs'
import { crypter, decrypter } from './webcrypto.mjs'
import { isAppExc, AppExc, E_DB, DataSync, IDBOBS } from './api.mjs'
import { u8ToB64, edvol, sleep } from './util.mjs'

// FAKE
export function commitRows() {}

function decodeIn (buf, cible) {
  const x = decode(buf)
  for (const p in x) cible[p] = x[p]
}

const STORES = {
  singletons: 'n',
  collections: '[id+n+ids]',
  ficav: 'id',
  loctxt: 'id',
  locfic: 'id',
  fdata: 'id'
}

/*************************************************************************
Calcul du volume utile d'une base
- v1: volume de tout sauf des fichiers
- v2: volume des tables fichiers locaux (fdata)
- map: volume par table. clé: nom de la table, valeur: volume utile de la table
*/
export async function vuIDB (nb) {
  const session = stores.session
  session.volumeTable = ''
  const db = new Dexie(nb, { autoOpen: true })
  db.version(1).stores(STORES)
  await db.open()

  let v1 = 0, v2 = 0
  const map = {}
  for (const x in STORES) {
    let v = 0
    await db[x].each(async (rec) => { 
      v += rec.data.length
    })
    session.volumeTable = x + ': ' + edvol(v)
    if (x === 'fdata') v2 += v; else v1 += v
    map[x] = v
    await sleep(50)
  }
  db.close()
  return [v1, v2, map]
}

// Pour la gestion des bases locales : destruction d'une base sans l'avoir ouverte
export async function deleteIDB (nb) {
  try {
    await Dexie.delete(nb)
    await sleep(100)
    console.log('RAZ db')
  } catch (e) {
    console.log(e.toString())
  }
}

/* Classe IDB *******************************************************************/
class IDB {
  static snoms = { boot: 1, espaces: 2, datasync: 3, comptes: 4, comptis: 5, invits: 6 }
  static lnoms = [ '', 'boot', 'espaces', 'datasync', 'comptes', 'comptis', 'invits' ]
  static cnoms = { avatars: 1, groupes: 2, notes: 3, chats: 4, sponsorings: 5, tickets: 6, membres: 7, chatgrs: 8 }

  static EX1 (e) { return isAppExc(e) ? e : new AppExc(E_DB, 1, [e.message])}
  
  static EX2 (e) { return isAppExc(e) ? e : new AppExc(E_DB, 2, [e.message])}

  async open() {
    const nb = stores.session.nombase
    try {
      console.log('Open: [' + nb + ']')
      idb.db = new Dexie(nb, { autoOpen: true })
      idb.db.version(1).stores(STORES)
      await idb.db.open()
    } catch (e) {
      throw IDB.EX1(e)
    }
  }

  close () {
    if (this.db && this.db.isOpen()) {
      try { this.db.close() } catch (e) {}
    }
    this.db = null
  }

  async delete () {
    try {
      await Dexie.delete(stores.session.nombase)
      await sleep(100)
      console.log('RAZ db')
    } catch (e) {
      console.log(e.toString())
    }
    idb.db = null
  }

  constructor () { 
    this.truc = 'machin ' + Date.now()
  }

  /** MODE AVION : lecture boot data { id, clek } (crypté par le PBKFD de la phrase secrète) 
  et enregistrement en session  */
  async getBoot () {
    const session = stores.session
    try {
      const rec = await this.db.singletons.get(IDB.snoms.boot)
      if (rec) {
        const x = decode (await decrypter(session.phrase.pcb, rec.data))
        session.setIdClek(x.id, null, x.clek)
        return true 
      } else return false
    } catch (e) {
      return false
    }
  }

  /** MODE SYNCHRO : lecture boot dh 
  Retourne false si la dh était trop ancienne pour que la base locale soit utilisable
  Dans ce cas a détruit et réouvert une base neuve
  */
  async checkAge () {
    const session = stores.session
    const rec = await this.db.singletons.get(IDB.snoms.boot)
    if (rec && rec.dh) {
      const nbjds = Math.ceil((Date.now() - rec.dh) / 86400000)
      if (nbjds < IDBOBS) return true
    } 
    if (rec) {
      await this.delete(stores.session.nombase)
      await IDB.open()
    }
    return false
  }

  /* Enregistre { id, clek } crypté par le PBKFD de la phrase secrète */
  async storeBoot () {
    const session = stores.session
    const x = encode({ id: session.compteId, clek: session.clek })
    const data = await crypter(session.phrase.pcb, x)
    try {
      await this.db.transaction('rw', ['singletons'], async () => {
        await this.db.singletons.put({ n: IDB.snoms.boot, dh: Date.now(), data })
      })
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  /* Enregistre le row espace */
  async storeEspace (row) {
    const session = stores.session
    if (!session.synchro) return
    const data = await crypter(session.clek, row)
    try {
      await this.db.transaction('rw', ['singletons'], async () => {
        await this.db.singletons.put({ n: IDB.snoms.espaces, dh: Date.now(), data })
      })
    } catch (e) {
      throw IDB.EX2(e)
    }
  }
  
  /** Retourne l'objet DataSync *******************************/
  async getDataSync () {
    const session = stores.session
    try {
      const rec = await this.db.singletons.get(IDB.snoms.datasync)
      if (rec) { 
        const x = await decrypter(session.clek, rec.data)
        return DataSync.deserial(x)
      } 
      else return null
    } catch (e) {
      return null
    }
  }

  /** Retourne les rows espace / compte / compti (mode avion) *************************************
  Map: clé: _nom, valeur: row
  */
  async getECCI () {
    const session = stores.session
    try {
      let res, rce, rci, rin
      {
        const rec = await this.db.singletons.get(IDB.snoms.espaces)
        if (rec) { 
          res = decode(await decrypter(session.clek, rec.data))
        }
      }
      {
        const rec = await this.db.singletons.get(IDB.snoms.comptes)
        if (rec) { 
          rce = decode(await decrypter(session.clek, rec.data))
        }
      }
      {
        const rec = await this.db.singletons.get(IDB.snoms.comptis)
        if (rec) { 
          rci = decode(await decrypter(session.clek, rec.data))
        }
      }
      {
        const rec = await this.db.singletons.get(IDB.snoms.invits)
        if (rec) { 
          rin = decode(await decrypter(session.clek, rec.data))
        }
      }
      return [res, rce, rci, rin]
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  async loadFicav () {
    const session = stores.session
    const l = []
    try {
      await this.db.ficav.each(async (rec) => {
        const f = Ficav.fromData(await decrypter(session.clek, rec.data))
        l.push(f)
      })
      return l
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  /** Retourne un sous-arbre d'id donné (avion et synchronisé *************************
  clé: _nom, valeur: [row]
  */
  async getSA (id) {
    const session = stores.session
    const idx = u8ToB64(await crypter(session.clek, '' + id, 1), true)
    try {
      const r = await this.db.collections.where('id').equals(idx).toArray()
      const m = {}
      for(const l of r) {
        const x = await decrypter(session.clek, l.data)
        const row = decode(x)
        let e = m[row._nom]; if (!e) { e = []; m[row._nom] = e }
        e.push(row)
      }
      return m
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  async setFdata (idf, data) {
    const session = stores.session
    try {
      if (session.accesIdb) {
        const cle = u8ToB64(await crypter(session.clek, '' + idf, 1), true)
        await this.db.fdata.put({ id: cle, data })
      }
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  async getFdata (idf) {
    const session = stores.session
    try {
      if (session.accesIdb) {
        const cle = u8ToB64(await crypter(session.clek, '' + idf, 1), true)
        const rec = await this.db.fdata.get(cle)
        return rec.data || null
      }
      return null
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  async commit(arg) {
    /*
    const arg = {
      singl: [], // singletons à mettre à jour
      colls: [], // collections à mettre à jour
      ficav: [], // ficav à créer / mettre à jour
      idac: [], // avatars à purger
      idgc: [], // groupes à purger
      idgcmb: [], // groupes membres à purger
      idgcno: [], // groupes notes à purger
      idf: [] // id des fichiers à supprimer
    }
    */
    try {
      await this.db.transaction('rw', ['singletons', 'collections', 'ficav', 'fdata'], async () => {  
        for (const x of arg.singl) {
          if (x.data) await this.db.singletons.put({ n: x.n, data: x.data })
          else await this.db.singletons.where({ n: x.n }).delete()
        }

        for (const x of arg.colls) {
          if (x.data) await this.db.collections.put( { id: x.id, n: x.n, ids: x.ids, data: x.data })
          else await this.db.singletons.where({ id: x.id, n: x.n, ids: x.ids }).delete()
        }

        for (const x of arg.ficav) {
          await this.db.ficav.put( { id: x.id, data: x.data } )
        }

        for (const idk of arg.idac) 
          await this.db.collections.where({id: idk}).delete()
        for (const idk of arg.idgc)
          await this.db.collections.where({id: idk}).delete()
        for (const idk of arg.idgcmb) {
          await this.db.collections.where({id: idk, n: IDB.cnoms.membres}).delete()
          await this.db.collections.where({id: idk, n: IDB.cnoms.chatgrs}).delete()
        }
        for (const idk of arg.idgcno)
          await this.db.collections.where({id: idk, n: IDB.cnoms.notes}).delete()
        for (const idk of arg.idgcno) {
          await this.db.ficav.where({id: idk}).delete()
          await this.db.fdata.where({id: idk}).delete()
        }

      })
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  /** Note Locale - TL **********************************************************************/
  async NLfromIDB () {
    const session = stores.session
    const ppSt = stores.pp
    try {
      await this.db.loctxt.each(async (rec) => {
        const nl = new NoteLocale()
        const n = await nl.fromIdb(await decrypter(session.clek, rec.data))
        ppSt.setNote(n)
      })
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  async NLset (txt, id) {
    const session = stores.session
    const ppSt = stores.pp
    try {
      const n = new NoteLocale().nouveau(txt)
      if (id) n.id = id
      ppSt.setNote(n)
      if (session.accesIdb) {
        const buf = await crypter(session.clek, await n.toIdb())
        const cle = u8ToB64(await crypter(session.clek, '' + n.id, 1), true)
        await this.db.loctxt.put({ id: cle, data: buf })
      }
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  async NLdel (id) {
    const session = stores.session
    const ppSt = stores.pp
    try {
      ppSt.delNote(id)
      if (session.accesIdb) {
        const cle = u8ToB64(await crypter(session.clek, '' + id, 1), true)
        await this.db.loctxt.where({ id: cle }).delete()
      }
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  /** Fichier Local *********************************************/

  async FLfromIDB () {
    const session = stores.session
    const ppSt = stores.pp
    try {
      await this.db.locfic.each(async (rec) => {
        const fl = new FichierLocal().fromIdb(await decrypter(session.clek, rec.data))
        ppSt.setFichier(fl)
      })
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  async FLset (nom, info, type, u8) {
    const session = stores.session
    const ppSt = stores.pp
    try {
      const fl = new FichierLocal().nouveau(nom, info, type, u8)
      ppSt.setFichier(fl)
      if (session.accesIdb) {
        const cle = u8ToB64(await crypter(session.clek, '' + fl.idf, 1), true)
        const data = await crypter(session.clek, fl.toIdb)
        const buf = await crypter(session.clek, fl.gz ? await gzipT(u8) : u8)
        await this.db.transaction('rw', ['locfic', 'fdata'], async () => {
          await this.db.locfic.put({ id: cle, data: data })
          await this.db.fdata.put({ id: cle, data: buf })
        })
      } else {
        fl.u8 = u8
      }
      return fl
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  /* get du CONTENU du fichier */
  async FLget (fl) { // get du CONTENU
    try {
      const session = stores.session
      const cle = u8ToB64(await crypter(session.clek, '' + fl.idf, 1), true)
      const rec = await db.fdata.get(cle)
      if (rec) {
        const buf = await decrypter(session.clek, rec.data)
        return fl.gz ? await ungzipB(buf) : buf
      }
      return null
    } catch (e) {
      throw IDB.EX2(e)
    }
  }

  async FLdel (id) {
    const session = stores.session
    const ppSt = stores.pp
    try {
      if (session.accesIdb) {
        const cle = u8ToB64(await crypter(session.clek, '' + id, 1), true)
        await this.db.transaction('rw', ['locfic', 'fdata'], async () => {
          await this.db.locfic.where({ id: cle }).delete()
          await this.db.fdata.where({ id: cle }).delete()
        })
      }
      ppSt.delFichier(id)
    } catch (e) {
      throw EX2(e)
    }
  }

  /* Fin de chargement d'un fichier : maj conjointe de fetat (pour dhc) et insertion de fdata */
  async setFa (f, buf) { // f: ficav, data: contenu brut du fichier
    try {
      const session = stores.session
      const k = u8ToB64(await crypter(session.clek, '' + f.id, 1), true)
      const dataf = await crypter(clek, new Uint8Array(encode(f.toRow())))
      await this.db.transaction('rw', ['ficav', 'fdata'], async () => {
        await this.db.ficav.put( { id: k, data: dataf } )
        if (buf) await this.db.fdata.put( { id: k, data: buf } )
          else this.db.fdata.where({ id: k }).delete()
      })
      if (stores.config.DEBUG) {
        console.log('IDB PUT ficav', f.id, f.dhdc)
        if (buf) console.log('IDB PUT fdata', f.id, buf.length )
        else console.log('IDB DEL fdata', f.id )
      }
    } catch (e) {
      throw EX2(e)
    }
  }
  
  async getFichierIDB (idf) {
    try {
      const id = u8ToB64(await crypter(stores.session.clek, '' + idf, 1), true)
      const rec = await this.db.fdata.where({ id: id }).first()
      return !rec ? null : rec.data
    } catch (e) {
      throw EX2(e)
    }
  }
  
}
export const idb = new IDB()


/** OpBufC : buffer des actions de mise à jour de IDB ***************************/
export class IDBbuffer {
  constructor () {
    this.w = stores.session.synchro
    this.lmaj = [] // rows { _nom, id, ids, _data } à modifier / insérer en IDB / supprimer si _data est null
    this.lmajf = [] // { id, data } des ficav à créeer / mettre à jour
    this.lfic = new Set() // set des ids des fichiers (ficav) à purger
    this.lav = new Set() // set des ids des avatars à purger (avec notes, sponsorings, chats, tickets)
    this.lgr = new Set() // set des ids des groupes à purger (avec notes, membres)
    this.lgrmb = new Set() // set des ids des groupes dont les membres sont à purger
    this.lgrno = new Set() // set des ids des groupes dont les notes sont à purger
    // this.mapSec = {} // map des notes (cle: id/ids, valeur: note) pour gestion des fichiers locaux
  }

  putIDB (row) { if (this.w) this.lmaj.push(row); return row }
  putFIDB (f) { if (this.w) this.lmajf.push({ id: f.id, data: f.toData() }) }
  purgeFIDB (id) { if (this.w) this.lfic.add(id) }
  purgeAvatarIDB (id) { if (this.w) this.lav.add(id) }
  purgeGroupeIDB (id) { if (this.w) this.lgr.add(id) }
  purgeGroupeMbIDB (id) { if (this.w) this.lgrmb.add(id) }
  purgeGroupeNoIDB (id) { if (this.w) this.lgrno.add(id) }

  async commit (dataSync) { 
    if (!this.w) return

    const clek = stores.session.clek
    const arg = {
      singl: [], // singletons à mettre à jour
      colls: [], // collections à mettre à jour
      idac: [], // avatars à purger
      idgc: [], // groupes à purger
      idgcmb: [], // groupes membres à purger
      idgcno: [], // groupes notes à purger
      idf: [], // ficavs à purger
      ficav: [], // rows ficav à mettre à jour
    }

    if (dataSync) arg.singl.push({ 
      n: IDB.snoms.datasync, 
      data: await crypter(clek, new Uint8Array(dataSync.serial()))
    })

    for(const row of this.lmajf) {
      arg.ficav.push({ 
        id: u8ToB64(await crypter(clek, '' + row.id, 1), true),
        data: await crypter(clek, new Uint8Array(encode(row.data)))
      })
    }

    for(const row of this.lmaj) {
      const n = IDB.snoms[row._nom]
      if (n) { // c'est un singleton
        arg.singl.push({ 
          n, 
          data: row._data_ ? await crypter(clek, new Uint8Array(encode(row))) : null
        })
      } else {
        arg.colls.push({ 
          n: IDB.cnoms[row._nom],
          id: u8ToB64(await crypter(clek, '' + row.id, 1), true),
          ids: u8ToB64(await crypter(clek, '' + row.ids, 1), true),
          data: row._data_ ? await crypter(clek, new Uint8Array(encode(row))) : null
        })
      }
    }

    if (this.lav.size)
      for (const id of this.lav) arg.idac.push(u8ToB64(await crypter(clek, '' + id, 1), true))   
    if (this.lgr.size)
      for (const id of this.lgr) arg.idgc.push(u8ToB64(await crypter(clek, '' + id, 1), true))
    if (this.lgrmb.size)
      for (const id of this.lgrmb) arg.idgcmb.push(u8ToB64(await crypter(clek, '' + id, 1), true))
    if (this.lgrno.size)
      for (const id of this.lgrno) arg.idgcno.push(u8ToB64(await crypter(clek, '' + id, 1), true))
    if (this.lfic.size)
      for (const id of this.lfic) arg.idf.push(u8ToB64(await crypter(clek, '' + id, 1), true))
    
    await idb.commit(arg)
  }
}
