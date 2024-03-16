import Dexie from 'dexie'
import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import { NoteLocale, FichierLocal } from './modele.mjs'
import { crypter, decrypter } from './webcrypto.mjs'
import { isAppExc, AppExc, E_DB, DataSync, IDBOBS } from './api.mjs'
import { u8ToB64, edvol, sleep, difference, html } from './util.mjs'

// FAKE
export function commitRows() {}

function decodeIn (buf, cible) {
  const x = decode(buf)
  for (const p in x) cible[p] = x[p]
}

const STORES = {
  singletons: 'n',
  collections: '[id+n+ids]',
  avnote: '[id+ids]',
  fetat: 'id',
  fdata: 'id',
  loctxt: 'id',
  locfic: 'id',
  locdata: 'id'
}

/*************************************************************************
Calcul du volume utile d'une base
- v1: volume de tout sauf des fichiers
- v2: volume des tables fichiers locaux (fdata, flocdata)
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
    if (x === 'fdata' || x === 'locdata') v2 += v; else v1 += v
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
  static snoms = { boot: 1, datasync: 2, comptes: 3, comptas: 4, espaces: 5, partitions: 6 }
  static lnoms = [ '', 'boot', 'datasync', 'comptes', 'comptas', 'espaces', 'partitions' ]
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

  constructor () { this.idb = null }

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

  /** Retourne l'objet DataSync *******************************/
  async getDataSync () {
    const session = stores.session
    try {
      const rec = await this.db.singletons.get(IDB.snoms.datasync)
      if (rec) { 
        const x = await decrypter(session.clek, rec.data)
        return new DataSync(x)
      } 
      else return null
    } catch (e) {
      return null
    }
  }

  /** Retourne la Map des CCEP (mode avion) *************************************
  Map: clé: _nom, valeur: row
  */
  async getCcep () {
    const session = stores.session
    try {
      const r = []
      await this.db.singletons.each(rec => { 
        if (rec.n > 2) r.push(rec.data)
      })
      const m = {}
      for(const data of r) {
        const row = decode(await decrypter(session.clek, data))
        m[row._nom] = row
      }
      return m
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

  async commit(arg) {
    /*
    const arg = {
      singl: [], // singletons à mettre à jour
      colls: [], // collections à mettre à jour
      idac: [], // avatars à purger
      idgc: [], // groupes à purger
      idgcmb: [], // groupes membres à purger
      idgcno: [] // groupes notes à purger
    }
    */
    try {
      await this.db.transaction('rw', ['singletons', 'collections'], async () => {  
        for (const x of arg.singl) {
          if (x.data) await this.db.singletons.put({ n: x.n, data: x.data })
          else await this.db.singletons.where({ n: x.n }).delete()
        }

        for (const x of arg.colls) {
          if (x.data) await this.db.collections.put( { id: x.id, n: x.n, ids: x.ids, data: x.data })
          else await this.db.singletons.where({ id: x.id, n: x.n, ids: x.ids }).delete()
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

  /** Fichier Local ********************************************
  locdata: contenu d'un fichier local
    - id: id du fichier local
    - data: contenu gzippé ou non crypté par la clé K
  */

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

  async FLset (nom, info, type, u8, id) {
    const session = stores.session
    const ppSt = stores.pp
    try {
      const fl = new FichierLocal().nouveau(nom, info, type, u8)
      if (id) fl.id = id
      ppSt.setFichier(fl)
      if (session.accesIdb) {
        const cle = u8ToB64(await crypter(session.clek, '' + fl.id, 1), true)
        const data = await crypter(session.clek, fl.toIdb)
        const buf = await crypter(session.clek, fl.gz ? await gzipT(u8) : u8)
        await this.db.transaction('rw', ['locfic', 'locdata'], async () => {
          await this.db.locfic.put({ id: cle, data: data })
          await this.db.locdata.put({ id: cle, data: buf })
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
      const cle = u8ToB64(await crypter(session.clek, '' + fl.id, 1), true)
      const rec = await db.locdata.get(cle)
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
        await this.db.transaction('rw', ['locfic', 'locdata'], async () => {
          await this.db.locfic.where({ id: cle }).delete()
          await this.db.locdata.where({ id: cle }).delete()
        })
      }
      ppSt.delFichier(id)
    } catch (e) {
      throw EX2(e)
    }
  }

  /* Fin de chargement d'un fichier : maj conjointe de fetat (pour dhc) et insertion de fdata */
  async setFa (fetat, buf) { // buf : contenu du fichier non crypté
    try {
      const session = stores.session
      const row1 = {}
      row1.id = u8ToB64(await crypter(session.clek, '' + fetat.id, 1), true)
      row1.data = await crypter(session.clek, fetat.toIdb)
      const row2 = { id: row1.id, data: buf }
      await this.db.transaction('rw', ['fetat', 'fdata'], async () => {
        await db.fetat.put(row1)
        await db.fdata.put(row2)
      })
      if (stores.config.DEBUG) {
        console.log('IDB fetat to PUT', fetat.id, fetat.dhc)
        console.log('IDB fdata to PUT', fetat.id)
      }
    } catch (e) {
      throw EX2(e)
    }
  }

  async loadFetats () {
    try {
      const feSt = stores.fetat
      await this.db.fetat.each(async (rec) => {
        const fe = new Fetat().fromIdb(await decrypter(stores.session.clek, rec.data))
        feSt.setFetat(fe)
      })
    } catch (e) {
      throw IDB.EX2(e)
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
  
  async loadAvNotes () {
    try {
      const avnSt = stores.avnote
      await this.db.avnote.each(async (rec) => {
        const avn = new AvNote().fromIdb(await decrypter(stores.session.clek, rec.data))
        avnSt.setAvNote(avn)
      })
    } catch (e) {
      throw IDB.EX2(e)
    }
  }
  
  /* Commit des MAJ de fetat et avnote */
  async commitFic (lstAvNotes, lstFetats) { // lst : array / set d'idfs
    const session = stores.session
    const debug = stores.config.DEBUG
    try {
      const x = []
      const y = []
      for (const obj of lstAvNotes) {
        const row = {}
        row.id = u8ToB64(await crypter(session.clek, '' + obj.id, 1), true)
        row.ids = u8ToB64(await crypter(session.clek, '' + obj.ids, 1), true)
        row.data = obj.suppr ? null : await crypter(session.clek, obj.toIdb)
        x.push(row)
        if (debug) console.log('IDB avnote to ', obj.suppr ? 'DEL' : 'PUT', obj.pk)
      }
  
      for (const obj of lstFetats) {
        const row = {}
        row.id = u8ToB64(await crypter(session.clek, '' + obj.id, 1), true)
        row.data = obj.suppr ? null : await crypter(session.clek, obj.toIdb)
        y.push(row)
        if (debug) {
          console.log('IDB fetat to ', obj.suppr ? 'DEL' : 'PUT', obj.id, obj.dhc)
          if (obj.suppr) console.log('IDB fdata to DEL', obj.id)
        }
      }
  
      await this.db.transaction('rw', ['avnotes', 'fetat'], async () => {
        for (const row of x) {
          if (row.data) {
            await this.db.avnote.put(row)
          } else {
            await this.db.avnote.where({ id: row.id, ids: row.ids }).delete()
          }
        }
        for (const row of y) {
          if (row.data) {
            await this.db.fetat.put(row)
          } else {
            await this.db.fetat.where({ id: row.id }).delete()
            await this.db.fdata.where({ id: row.id }).delete()
          }
        }
      })
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
    this.lav = new Set() // set des ids des avatars à purger (avec notes, sponsorings, chats, tickets)
    this.lgr = new Set() // set des ids des groupes à purger (avec notes, membres)
    this.lgrmb = new Set() // set des ids des groupes dont les membres sont à purger
    this.lgrno = new Set() // set des ids des groupes dont les notes sont à purger
    this.mapSec = {} // map des notes (cle: id/ids, valeur: note) pour gestion des fichiers locaux
  }

  putIDB (row) { if (this.w) this.lmaj.push(row); return row }
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
      idgcno: [] // groupes notes à purger
    }

    if (dataSync) arg.singl.push({ 
      n: IDB.snoms.datasync, 
      data: await crypter(clek, new Uint8Array(dataSync.serial))
    })

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

    await idb.commit(arg)
  }
}

/*********************************************************************
Gestion des fichiers hors-ligne sur IDB
*********************************************************************
Deux tables gèrent le stockage en IDB :
idf : identifiant du fichier

- `fdata` : colonnes `idf, data`. Seulement insertion et suppression
  - `data` est le contenu du fichier tel que stocké sur le serveur (crypté / gzippé).
- `fetat` : colonnes `idf, data : {dhd, dhc, lg, nom, info}`. Insertion, suppression et mise à jour.
  - `dhd` : date-heure de demande de chargement.
  - `dhc` : date-heure de chargement.
  - `dhx` : date-heure d'échec du chargement.
  - `lg` : taille du fichier (source, son v2).
  - `nom info` : à titre d'information (redondance de sa note).
  - `ids ns` : id/ns de sa note.
})

#### Transactions
- `fetat` peut subir une insertion sans mise à jour de `fdada`.
- `fetat` peut subir une suppression sans mise à jour de `fdata` si le row indique qu'il était encore en attente (`dhc` 0).
- `fetat` et `fdata` peuvent subir une suppression synchronisée.
- quand `fdata` subit une insertion, `fetat` subit dans la même transaction la mise à jour de `dhc`.

La table `fetat` est,
- lue à l'ouverture d'une session en modes _synchronisé_ et _avion_ (lecture seule),
- l'état _commité_ est disponible en mémoire durant toute la session.
*/

/*********************************************************************
Gestion des fichiers hors-ligne : fin de connexion et synchronisation
**********************************************************************/

/* Fin de synchronisation : map des notes notifiées */
export async function gestionFichierSync (lst) {
  const avst = stores.avnote
  const fSt = stores.fetat

  const nvFa = []
  const nvAvs = []
  for (const pk in lst) {
    const n = lst[pk]
    const avs = avst.getAvnote(n.id, n.ids)
    if (!avs || avs.v >= n.v) continue // pas d'avnote associé ou déjà à jour (??)
    const [nv, nvf] = avs.diff(n) // nouvel AvNote compte tenu de la nouvelle note
    nvAvs.push(nv) // changé, au moins la version : il y a peut-être, des idfs en plus et en moins
    if (nvf) for (const x of nvf) nvFa.push(x)
  }

  // Mise à jour de IDB (fetat / fdata et avnote)
  if (nvFa.length || nvAvs.length) await commitFic(nvAvs, nvFa)

  // Mise en store des AvNote créés / modifiés / supprimés
  nvAvs.forEach(avs => { avst.setAvnote(avs) })

  // Mise en db/store des fetat créés / supprimés
  fSt.chargementIncremental(nvFa)
}

/* Fin de connexion en mode synchronisé : notes, map par pk de toutes les notes existantes */
export async function gestionFichierCnx (notes) {
  const fetats = {}
  await getFetats(fetats) // chargement depuis IDB de tous les fetats
  const avnotes = {}
  await getAvNotes(avnotes) // changement depuis IDB de toutes les avnotes

  const nvFa = [] // les fetat créés ou supprimés
  const lavn = [] //  Tous les AvNote (existant et conservé, ou créé, ou modifié)
  const nvAvn = [] // Les AvNotes créés / modifiés / supprimés
  
  /* Parcours des AvNote existants : elles peuvent,
  - soit être détruits : la note correspondante n'existe plus ou n'a plus de fichiers
  - soit être inchangés : la note correspondante a la même version
  - soit être "mise à jour"" : des fichiers sont à supprimer, d'autres (cités dans mnom) ont une nouvelle version
  voire le cas échéant réduits au point de disparaître.
  */
  for (const pk in avnotes) {
    const avn = avnotes[pk]
    const n = notes[pk]
    if (n && n.v === avn.v) { lavn.push(avn); continue } // inchangé
    const [nv, nvf] = avn.diff(n) // nouvel AVN compte tenu de la nouvelle note ou de son absence (peut-être à supprimer)
    if (!nv.suppr) lavn.push(nv) // celles utiles seulement, pas les supprimées
    nvAvn.push(nv) // changé, au moins la version : il y a peut-être, des idfs en plus et en moins
    if (nvf) for (const x of nvf) nvFa.push(x)
  }

  // Liste des fetat utiles et mise en db/store ou delete
  for (const fetat of nvFa) {
    // fetat.dhc = Date.now()
    if (fetat.suppr) delete fetats[fetat.idf]; else fetats[fetat.idf] = fetat
  }

  // Mise à jour de IDB (fetat / fdata et avnote)
  if (nvFa.length || nvAvn.length) await commitFic(nvAvn, nvFa)

  const avnSt = stores.avnote
  lavn.forEach(avn => { avnSt.setAvnote(avn) })

  const fSt = stores.fetat
  fSt.chargementInitial(fetats)
}

/*********************************************************************
Gestion des fichiers hors-ligne : MAJ des fichiers off-line pour une note
**********************************************************************/

/* Session UI : MAJ des fichiers off-line pour une note */
export async function gestionFichierMaj (note, plus, idf, nom) {
  const avnSt = stores.avnote
  const fSt = stores.fetat

  let avn = avnSt.getAvnote(note.id, note.ids)
  if (!avn) avn = new AvNote().nouveau(note)
  const [nvAvn, nvFa] = avn.maj(note, plus, idf, nom)

  // Mise à jour de IDB (fetat / fdata et avnote)
  if (nvFa.length || nvAvn) await commitFic(nvAvn ? [nvAvn] : [], nvFa)

  // Mise en db/store de l'AvNote créé / modifié / supprimé
  if (nvAvn) avnSt.setAvnote(nvAvn)

  if (nvFa.length) fSt.chargementIncremental(nvFa)
}

/*********************************************************************
Gestion des fichiers hors-ligne : classes Fetat et Avnote
**********************************************************************/

/* classe Fetat : un fichier off-line **********************************************
- id: id du fichier (idf)
- ids: id de l'avatar / groupe propriétaire (id de la note à laquelle le fichier est attaché)
- ns: id secondaire de sa note ( la note est identifiée par ids / ns)
***/
class Fetat {
  get table () { return 'fetat' }
  get estCharge () { return this.dhc !== 0 }
  get enAttente () { return this.dhc === 0 && !this.dhx }
  get enEchec () { return this.dhc === 0 && this.dhx }

  get st () {
    if (this.enAttente) return 1
    if (this.estCharge) return 2
    if (this.enEchec) return 3
    return 0
  }

  nouveauSuppr (idf) { this.id = idf; this.suppr = true; return this }

  nouveau (n, f) {
    this.id = f.idf
    this.ids = n.id
    this.dhd = Date.now()
    this.dhc = 0
    this.dhx = 0
    this.lg = f.lg
    this.nom = f.nom
    this.info = f.info
    this.type = f.type
    this.dh = f.dh
    this.ns = n.ids
    this.err = ''
    return this
  }

  get toIdb () {
    const x = { ...this }
    return new Uint8Array(encode(x))
  }

  fromIdb (idb) {
    decodeIn(idb, this)
    return this
  }

  async chargementOK(buf) {
    this.dhc = Date.now()
    this.err = ''
    this.dhx = 0
    await setFa(this, buf) // Maj IDB de fetat et fdata conjointement
  }

  async chargementKO(exc) {
    this.dhx = Date.now()
    this.err = html(exc)
    await commitFic([], [this]) // Maj de IDB de fetat avant la date-heure d'échec
    stores.ui.afficherExc(exc)
  }

  async retry () {
    this.dhx = 0
    this.err = ''
    await commitFic([], [this])
    const fSt = stores.fetat
    fSt.retry(this.id)
  }

  async abandon () {
    const fSt = stores.fetat
    fSt.abandon(this.id)
    const nSt = stores.note
    const node = nSt.getNode(this.ids, this.ns)
    const n = node ? node.note : null
    if (!n) return
    const nom = n.nomDeIdf(this.id)
    if (!nom) return
    await gestionFichierMaj(n, false, this.id, nom)
  }
}

/* AvNote ****************************************************
Un objet de classe `AvNote` existe pour chaque note pour laquelle le compte a souhaité
avoir au moins un des fichiers attachés disponible en mode avion.
- Identifiant : `[id, ids]`
- Propriétés :
  - `lidf` : liste des identifiants des fichiers explicitement cités par leur identifiant comme étant souhaité _hors ligne_.
  - `mnom` : une map ayant,
    - _clé_ : `nom` d'un fichier dont le compte a souhaité disposer de la _version la plus récente_ hors ligne.
    - _valeur_ : `idf`, identifiant de cette version constaté dans l'état le plus récent de la note.
*/
class AvNote {
  constructor () { 
    this.lidf = []
    this.mnom = {}
    this.v = 0
  }

  get table () { return 'avnote' }
  get pk () { return this.id + '/' + this.ids }
  get key () { return this.id + '/' + this.ids }

  nouveau (note) { 
    this.id = note.id
    this.ids = note.ids
    this.v = 0
    return this 
  }

  get estVide () { return !this.lidf.length && !Object.keys(this.mnom).length }

  get toIdb () {
    const x = { ...this }
    return new Uint8Array(encode(x))
  }

  fromIdb (idb) {
    decodeIn(idb, this)
    return this
  }

  setNvFa (s, idfs, idfs2) { // calcul des fetat en plus et en moins
    // difference (setA, setB) { // element de A pas dans B
    const x1 = difference(idfs, idfs2) // idf disparus
    const x2 = difference(idfs2, idfs) // nouveaux, version de nom plus récente
    const nvFa = []
    if (x1.size) {
      for (const idf of x1) {
        const e = new Fetat().nouveauSuppr(idf)
        nvFa.push(e)
      }
    }
    if (x2.size && s) {
      for (const idf of x2) {
        const f = s.mfa.get(idf)
        nvFa.push(new Fetat().nouveau(s, f))
      }
    }
    return nvFa
  }

  /* s est la mise à jour de la note. diff retourne [nv, nvFa]:
  - nv.suppr : si avnote est à supprimer
  - nv : le nouvel avnote de même id/ns qui remplace l'ancien. Dans ce cas obj a 2 propriétés :
  - nvFa : la liste des nouveaux Fetat (ou null)
    SI PAS de s : idfs à enlever (les fetat / fdata associés)
  */
  diff (s) {
    const idfs = new Set(this.lidf) // set des idf actuels
    const idfs2 = new Set() // nouvelle liste des idf
    let n = 0
    const nv = new AvNote().nouveau(this) // clone minimal de this

    if (s) {
      nv.v = s.v
      for (const idf of this.lidf) {
        if (s.mfa.get(idf)) { nv.lidf.push(idf); idfs2.add(idf) }
      }
      for (const nx in this.mnom) {
        idfs.add(this.mnom[nx])
        const idf = s.idfDeNom(nx)
        if (idf) { nv.mnom[nx] = idf; idfs2.add(idf); n++ }
      }
    }
    if (!n && !nv.lidf.length) nv.suppr = true // AvNote à détruire (plus aucun idf n'existe dans s, s'il y a un s)

    const nvFa = this.setNvFa(s, idfs, idfs2)
    return [nv, nvFa]
  }

  lstIdf () {
    const idfs = new Set(this.lidf)
    for (const nx in this.mnom) idfs.add(this.mnom[nx])
    return idfs
  }

  maj (s, plus, idf, nom) {
    /* plus : true: ajout de idf ou d'un nom, false: enlève un idf ou un nom */
    const idfs = new Set(this.lidf) // set des idf actuels
    const idfs2 = new Set() // nouvelle liste des idf
    let n = 0
    const nv = new AvNote().nouveau(this) // clone minimal de this
    nv.v = s.v

    for (const i of this.lidf) { // reconduction de la liste précédente
      if (i === idf && !plus) continue // sauf si idf doit être enlevé
      if (s.mfa.get(i)) { nv.lidf.push(i); idfs2.add(i) }
    }
    if (plus && idf && !idfs2.has(idf) && s.mfa.get(idf)) { nv.lidf.push(idf); idfs2.add(idf) }

    for (const nx in this.mnom) {
      idfs.add(this.mnom[nx]) // complète la liste des idf (avant)
      if (nx === nom && !plus) continue // on ne reconduit pas le nom s'il est enlevé
      const idf = s.idfDeNom(nx)
      if (idf) { idfs2.add(idf); nv.mnom[nx] = idf; n++ }
    }
    if (plus && nom && !nv.mnom[nom]) {
      const idf = s.idfDeNom(nom)
      if (idf) { idfs2.add(idf); nv.mnom[nom] = idf; n++ }
    }
    if (!n && !nv.lidf.length) nv.suppr = true // AvNote à détruire (plus aucun idf n'existe dans s, s'il y a un s)

    const nvFa = this.setNvFa(s, idfs, idfs2)
    return [nv, nvFa]
  }
}
