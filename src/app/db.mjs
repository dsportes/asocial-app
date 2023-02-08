import Dexie from 'dexie'
import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'
import { SessionSync } from './modele.mjs'
import { crypter, decrypter } from './webcrypto.mjs'
import { AppExc, E_DB } from './api.mjs'
import { u8ToB64, edvol, sleep, difference, html } from './util.mjs'
import { getSecret } from '../app/modele.mjs'

function decodeIn (buf, cible) {
  const x = decode(buf)
  for (const p in x) cible[p] = x[p]
}

const STORES = {
  compte: 'id',
  sessionsync: 'id',
  tribus: 'id',
  comptas: 'id',
  avatars: 'id',
  chats: 'id+ids',
  rdvs: 'id+ids',
  groupes: 'id',
  membre: '[id+ids]',
  secrets: '[id+ids]',
  avsecret: '[id+ids]',
  cvs: 'id',  // data: cryptK { id, v, photo, info }
  fetat: 'id',
  fdata: 'id',
  loctxt: 'id',
  locfic: 'id',
  locdata: 'id'
}

const TABLES = []
for (const x in STORES) TABLES.push(x)

function EX1 (e) {
  return e instanceof AppExc ? e : new AppExc(E_DB, 1, [e.message], e.stack || '')
}

function EX2 (e) {
  return e instanceof AppExc ? e : new AppExc(E_DB, 2, [e.message], e.stack || '')
}

let db

export async function openIDB () {
  const session = stores.session
  try {
    db = new Dexie(session.nombase, { autoOpen: true })
    db.version(1).stores(STORES)
    await db.open()
  } catch (e) {
    throw EX1(e)
  }
}

export function closeIDB () {
  const session = stores.session
  if (db && db.isOpen()) {
    try { db.close() } catch (e) {}
  }
  db = null
}

export async function deleteIDB (lsKey) {
  const session = stores.session
  try {
    await Dexie.delete(session.nombase)
    await sleep(100)
    console.log('RAZ db')
  } catch (e) {
    console.log(e.toString())
  }
  db = null
}

/** Gestion de l'état de la dernière session ***********************************************************/

// lecture de l'état de la dernière session (ou vide en mode incognito)
export async function lectureSessionSyncIdb () {
  try {
    const session = stores.session
    const s = new SessionSync()
    if (session.accesIdb) {
      try {
        const r = await db.sessionsync.get('1')
        const idb = await decrypter(session.clek, r.data)
        s.fromIdb(idb)
      } catch (e) {} // session vide si pas lisible sur IDB
    }
    session.sessionSync = s
  } catch (e) {
    throw EX2(e)
  }
}

// sauvegarde de l'état courant (sauf incognito)
export async function saveSessionSync (idb) {
  try {
    const session = stores.session
    await db.sessionsync.put({ id: '1', data: await crypter(session.clek, idb) })
  } catch (e) {
    throw EX2(e)
  }
}

/**Text Local - TL **********************************************************************/
export async function TLfromIDB () {
  const session = stores.session
  const tflocaux = stores.tflocaux
  try {
    await db.loctxt.each(async (idb) => {
      const tl = new TexteLocal().fromIdb(await decrypter(session.clek, idb.data))
      tflocaux.setTexteLocal(tl)
    })
  } catch (e) {
    throw EX2(e)
  }
}

export async function TLins (txt) {
  const session = stores.session
  const tflocaux = stores.tflocaux
  try {
    const tl = new TexteLocal().nouveau(txt)
    tflocaux.setTexteLocal(tl)
    if (session.accesIdb) {
      const buf = await crypter(session.clek, tl.toIdb)
      const cle = u8ToB64(await crypter(session.clek, '' + id, 1), true)
      await db.loctxt.put({ id: cle, data: buf })
    }
  } catch (e) {
    throw EX2(e)
  }
}

export async function TLupd (id, txt) {
  const session = stores.session
  const tflocaux = stores.tflocaux
  try {
    const tl = tflocaux.getTexteLocal(id)
    if (!tl) return
    tl.txt = txt
    tl.dh = new Date().getTime()
    tflocaux.setTexteLocal(tl)
    if (session.accesIdb) {
      const buf = await crypter(session.clek, tl.toIdb)
      const cle = u8ToB64(await crypter(session.clek, '' + tl.id, 1), true)
      await db.loctxt.put({ id: cle, data: buf })
    }
  } catch (e) {
    throw EX2(e)
  }
}

export async function TLdel (id) {
  const session = stores.session
  const tflocaux = stores.tflocaux
  try {
    const tl = tflocaux.delTexteLocal(id)
    if (session.accesIdb) {
      const cle = u8ToB64(await crypter(session.clek, '' + id, 1), true)
      await db.loctxt.where({ id: cle }).delete()
    }
  } catch (e) {
    throw EX2(e)
  }
}

/** Fichier Local ********************************************
locdata: contenu d'un fichier local
  - id: id du fichier local
  - data: contenu gzippé ou non crypté par la clé K
*/

export async function FLfromIDB () {
  const session = stores.session
  const tflocaux = stores.tflocaux
  try {
    const map = {}
    await db.locfic.each(async (idb) => {
      const fl = new FichierLocal().fromIdb(await decrypter(session.clek, idb.data))
      tflocaux.setFichierLocal(fl)
    })
  } catch (e) {
    throw data.setErDB(EX2(e))
  }
}

export async function FLins (nom, info, type, u8) {
  const session = stores.session
  const tflocaux = stores.tflocaux
  try {
    const fl = new FichierLocal().nouveau(nom, info, type, u8)
    tflocaux.setFichierLocal(fl)
    const cle = u8ToB64(await crypter(session.clek, '' + fic.id, 1), true)
    const buf = await crypter(session.clek, fl.gz ? gzipT(u8) : u8)
    const data = await crypter(session.clek, fl.toIdb)
    if (session.accesIdb) {
      await db.transaction('rw', ['locfic', 'locdata'], async () => {
        await db.locfic.put({ id: cle, data: data })
        await db.locdata.put({ id: cle, data: buf })
      })
    } else {
      fl.u8 = u8
    }
    return fl
  } catch (e) {
    throw EX2(e)
  }
}

/* Maj d'un FichierLocal : id est obligatoire
- si nom n'est pas false, nom est mis à jour
- si info n'est pas false, info est mis à jour
- si u8 n'est pas false,
  - type est mis à jour, si non false
  - gz et sha sont recalculés
  - u8 est stocké (en store ou IDB)
*/
export async function FLupd (id, nom, info, type, u8) {
  const session = stores.session
  const tflocaux = stores.tflocaux
  try {
    const fl = tflocaux.getFichierLocal(id)
    if (!fl) return
    let buf
    fl.dh = new Date().getTime()
    if (nom !== false) fl.nom = nom
    if (info !== false) fl.info = info
    if (u8 !== false) {
      if (type !== false) fl.type = type
      fl.gz = type.startsWith('text/')
      if (session.accesIdb) buf = await crypter(session.clek, fl.gz ? gzipT(u8) : u8)
    }
    const cle = u8ToB64(await crypter(session.clek, '' + fl.id, 1), true)
    const data = await crypter(session.clek, fl.toIdb)
    if (session.accesIdb) {
      await db.transaction('rw', ['locfic', 'locdata'], async () => {
        await db.locfic.put({ id: cle, data: data })
        if (buf) await db.locdata.put({ id: cle, data: buf })
      })
    } else {
      if (u8) fl.u8 = u8
    }
    return fl
  } catch (e) {
    throw EX2(e)
  }
}

/* get du CONTENU du fichier
Si idb, lecture deouis idb
Sinon (mode incognito) le contenu est déjà dans fl
*/
export async function FLget (fl) { // get du CONTENU
  const session = stores.session
  if (!session.accesIdb) return fl.u8
  try {
    const cle = u8ToB64(await crypter(session.clek, '' + fl.id, 1), true)
    const idb = await db.locdata.get(cle)
    if (idb) {
      const buf = await decrypter(session.clek, idb.data)
      return fl.gz ? ungzip(buf) : buf
    }
    return null
  } catch (e) {
    throw EX2(e)
  }
}

export async function FLdel (id) {
  const session = stores.session
  const tflocaux = stores.tflocaux
  try {
    const cle = u8ToB64(await crypter(session.clek, '' + id, 1), true)
    if (session.accesIdb) {
      await data.db.transaction('rw', ['locfic', 'locdata'], async () => {
        await db.locfic.where({ id: cle }).delete()
        await db.locdata.where({ id: cle }).delete()
      })
    }
    tflocaux.delFichierLocal(id)
  } catch (e) {
    throw data.setErDB(EX2(e))
  }
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
  db.version(2).stores(STORES)
  await db.open()
  let v1 = 0, v2 = 0
  const map = {}
  for (const x in STORES) {
    let v = 0
    await db[x].each(async (idb) => { v += idb.data.length })
    session.volumeTable = x + ': ' + edvol(v)
    if (x === 'fdata' || x === 'locdata') v2 += v; else v1 += v
    map[x] = v
    await sleep(50)
  }
  db.close()
  return [v1, v2, map]
}

/**********************************************************************
Lecture du compte : crypté par le PBKFD de la phrase secrète. { id, k }
- id: id du compte
- k: clé K 
*/

export async function getCompte () {
  const session = stores.session
  try {
    const idb = await db.compte.get('1')
    return decode(await decrypter(session.phrase.pcb, idb.data))
  } catch (e) {
    return false
  }
}

export async function getAvatarPrimaire () {
  const session = stores.session
  try {
    const idb = await db.avatars.get(session.compteId)
    return decode(await decrypter(session.clek, idb.data))
  } catch (e) {
    throw EX2(e)
  }
}

export async function getCompta () {
  const session = stores.session
  try {
    const idb = await db.comptas.get(session.compteId)
    return decode(await decrypter(session.clek, idb.data))
  } catch (e) {
    throw EX2(e)
  }
}

/** Lecture d'une collection complète : 
Retourne l'array des rows reçus du serveur : { _nom, id, ids, v, dlv, _data_} 
*/
export async function getColl (nom) {
  const session = stores.session
  try {
    const r = []
    await db[nom].each(async (idb) => { 
      const row = await decrypter(session.clek, idb.data)
      r.push(row)
    })
    return r
  } catch (e) {
    throw EX2(e)
  }
}

/** Lecture de la collection des Cartes de Visite des contacts par chat.
Retourne une map de clé 'id' et de valeur { id, v, photo, info }
*/
export async function getCvs () {
  const session = stores.session
  try {
    const r = {}
    await db.cvs.each(async (row) => {
      const idb = await decrypter(session.clek, row.data)
      r[idb.id] = decode(idb)
    })
    return r
  } catch (e) {
    throw EX2(e)
  }
}

export async function getCv (id) {
  const session = stores.session
  const idk = u8ToB64(await crypter(clek, '' + id, 1), true)
  try {
    return decode(await db.cvs.get({ id: idk }))
  } catch (e) {
    throw EX2(e)
  }
}

export async function delCv (id) {
  const session = stores.session
  const idk = u8ToB64(await crypter(clek, '' + id, 1), true)
  try {
    return await db.cvs.delete({ id: idk })
  } catch (e) {
    throw EX2(e)
  }
}

export async function putCv (cv) { // { id, v, photo, info }
  const session = stores.session
  const idk = u8ToB64(await crypter(clek, '' + cv.id, 1), true)
  const rowk = await crypter(clek, new Uint8Array(encode(cv)), 1)
  try {
    return await db.cvs.put({ id: idk, data: rowk })
  } catch (e) {
    throw EX2(e)
  }
}

/** OpBufC : buffer des actions de mise à jour de IDB ***************************/
export class IDBbuffer {
  constructor () {
    this.idb = stores.session.accesIdb
    this.lmaj = [] // rows à modifier / insérer en IDB
    this.lsuppr = [] // row { _nom, id, ids } à supprimer de IDB
    this.lav = new Set() // set des ids des avatars à purger (avec secrets, sponsorings, chats)
    this.lgr = new Set() // set des ids des groupes à purger (avec secrets, membres)
    this.mapSec = {} // map des secrets (cle: id/ids, valeur: secret) pour gestion des fichiers locaux
    this.lsecsup = [] // liste des secrets temporaires à faire supprimer sur le serveur en fin de connexion
  }

  putIDB (row) { if (this.idb) this.lmaj.push(row); return row }
  supprIDB (row) { if (this.idb) this.lsuppr.push(row); return row } // obj : { _nom, id, ids }
  purgeAvatarIDB (id) { if (this.idb) this.lav.add(id) }
  purgeGroupeIDB (id) { if (this.idb) this.lgr.add(id) }
  async commitIDB (setCompteClek) { if (this.idb) await commitRows(this, setCompteClek) }
}

/** Mises à jour / purges globales de IDB *****************************************/
export async function commitRows (opBuf, setCompteClek) {
  try {
    const session = stores.session
    const clek = session.clek

    // Objets à mettre à jour
    const lidb = []
    if (opBuf.lmaj && opBuf.lmaj.length) {
      for (const row of opBuf.lmaj) {
        const idk = u8ToB64(await crypter(clek, '' + row.id, 1), true)
        const idsk = row.ids ? u8ToB64(await crypter(clek, '' + row.ids, 1), true) : null
        const rowk = await crypter(clek, new Uint8Array(encode(row)) , 1)
        lidb.push({ table: row._nom, idk, idsk, rowk })
      }
    }

    // Objets à supprimer individuellement - rows : { _nom, id, ids }
    const lidbs = []
    if (opBuf.lsuppr && opBuf.lsuppr.length) {
      for (const row of opBuf.lsuppr) {
        const idk = u8ToB64(await crypter(clek, '' + obj.id, 1), true)
        const idsk = obj.ids ? u8ToB64(await crypter(clek, '' + obj.ids, 1), true) : null
        lidbs.push({ table: row._nom, idk, idsk })
      }
    }

    // set des ids des avatars à purger
    const idac = []
    if (opBuf.lav && opBuf.lav.size) {
      for (const id of opBuf.lav) idac.push(u8ToB64(await crypter(clek, '' + id, 1), true))
    }

    // set des ids des groupes à purger
    const idgc = []
    if (opBuf.lgr && opBuf.lgr.size) {
      for (const id of opBuf.lgr) idgc.push(u8ToB64(await crypter(clek, '' + id, 1), true))
    }

    await db.transaction('rw', TABLES, async () => {
      if (setCompteClek) {
        const x = { id: session.compteId, k: session.clek}
        const data = await crypter(session.phrase.pcb, new Uint8Array(encode(x)) , 1)
        await db.compte.put({ id: '1', data })
      }

      for (const x of lidb) { // tous objets
        await db[x.table].put( { id: x.idk, data: x.rowk })
      }

      for (const x of lidbs) { // tous objets à supprimer
        if (x.idsk) {
          await db[x.table].where({ id: x.idk, ids: x.idsk }).delete()
        } else {
          await db[x.table].where({ id: x.idk }).delete()
        }
      }

      for (const idk of idac) {
        const id = { id: idk }
        await db.avatars.where(id).delete()
        await db.sponsorings.where(id).delete()
        await db.chats.where(id).delete()
        await db.secrets.where(id).delete()
      }

      for (const idk of idgc) {
        const id = { id: idk }
        await db.groupes.where(id).delete()
        await db.membres.where(id).delete()
        await db.secrets.where(id).delete()
      }
    })
  } catch (e) {
    throw EX2(e)
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
  - `nom info` : à titre d'information (redondance de son secret).
  - `ids ns` : id/ns de son secret.

schemas.forSchema({
  name: 'idbFetat',
  cols: ['id', 'dhd', 'dhc', 'dhx', 'lg', 'nom', 'info', 'ids', 'ns', 'err']
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


async function getFetats (map) {
  try {
    await db.fetat.each(async (idb) => {
      const x = new Fetat().fromIdb(await decrypter(stores.session.clek, idb.data))
      map[x.id] = x
    })
  } catch (e) {
    throw EX2(e)
  }
}

export async function getFichierIDB (idf) {
  try {
    const id = u8ToB64(await crypter(stores.session.clek, '' + idf, 1), true)
    const idb = await db.fdata.where({ id: id }).first()
    return !idb ? null : idb.data
  } catch (e) {
    throw EX2(e)
  }
}

async function getAvSecrets (map) {
  try {
    await db.avsecret.each(async (idb) => {
      const x = new AvSecret().fromIdb(await decrypter(stores.session.clek, idb.data))
      map[x.pk] = x
    })
  } catch (e) {
    throw EX2(e)
  }
}

/* Commit des MAJ de fetat et avsecret */
async function commitFic (lstAvSecrets, lstFetats) { // lst : array / set d'idfs
  const session = stores.session
  const debug = stores.config.debug
  try {
    const x = []
    const y = []
    for (const obj of lstAvSecrets) {
      const row = {}
      row.id = u8ToB64(await crypter(session.clek, '' + obj.id, 1), true)
      row.id2 = u8ToB64(await crypter(data.clek, '' + obj.id2, 1), true)
      row.data = obj.suppr ? null : await crypter(session.clek, obj.toIdb)
      x.push(row)
      if (debug) console.log('IDB avsecret to ', obj.suppr ? 'DEL' : 'PUT', obj.pk)
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

    await db.transaction('rw', TABLES, async () => {
      for (const row of x) {
        if (row.data) {
          await db.avsecret.put(row)
        } else {
          await db.avsecret.where({ id: row.id, id2: row.id2 }).delete()
        }
      }
      for (const row of y) {
        if (row.data) {
          await db.fetat.put(row)
        } else {
          await db.fetat.where({ id: row.id }).delete()
          await db.fdata.where({ id: row.id }).delete()
        }
      }
    })
  } catch (e) {
    throw EX2(e)
  }
}

/* Fin de chargement d'un fichier : maj conjointe de fetat (pour dhc) et insertion de fdata */
async function setFa (fetat, buf) { // buf : contenu du fichier non crypté
  try {
    const session = stores.session
    const row1 = {}
    row1.id = u8ToB64(await crypter(session.clek, '' + fetat.id, 1), true)
    row1.data = await crypter(session.clek, fetat.toIdb)
    const row2 = { id: row1.id, data: buf }
    await db.transaction('rw', TABLES, async () => {
      await db.fetat.put(row1)
      await db.fdata.put(row2)
    })
    if (stores.config.debug) {
      console.log('IDB fetat to PUT', fetat.id, fetat.dhc)
      console.log('IDB fdata to PUT', fetat.id)
    }
  } catch (e) {
    throw EX2(e)
  }
}

/*********************************************************************
Gestion des fichiers hors-ligne : fin de connexion et synchronisation
**********************************************************************/

/* Fin de synchronisation : liste des secrets notifiés */
export async function gestionFichierSync (lst) {
  const avst = stores.avsecret
  const fest = stores.fetat

  const nvFa = []
  const nvAvs = []
  for (const pk in lst) {
    const s = lst[pk]
    const avs = avst.getAvSecret(s.id, s.ns)
    if (!avs || avs.v >= s.v) continue // pas d'avsecret associé ou déjà à jour (??)
    const [nv, nvf] = avs.diff(s) // nouvel AvSecret compte tenu du nouveau s
    nvAvs.push(nv) // changé, au moins la version : il y a peut-être, des idfs en plus et en moins
    if (nvf) for (const x of nvf) nvFa.push(x)
  }

  // Mise à jour de IDB (fetat / fdata et avsecret)
  if (nvFa.length || nvAvs.length) await commitFic(nvAvs, nvFa)

  // Mise en store des AvSecret créés / modifiés / supprimés
  nvAvs.forEach(avs => { avst.setAvsecret(avs) })

  // Mise en db/store des fetat créés / supprimés
  fest.chargementIncremental(nvFa)
}

/* Fin de connexion en mode synchronisé : secrets, map par pk de tous les secrets existants */
export async function gestionFichierCnx (secrets) {
  const fetats = {}
  await getFetats(fetats)
  const avsecrets = {}
  await getAvSecrets(avsecrets)

  const nvFa = [] // les fetat créés ou supprimés
  const lavs = [] //  Tous les AvSecret (existant et conservé, ou créé, ou modifié)
  const nvAvs = [] // Les AvSecrets créés / modifiés / supprimés
  
  /* Parcours des AvSecret existants : ils peuvent,
  - soit être détruits : le secret correspondant n'existe plus ou n'a plus de fichiers
  - soit être inchangés : le secret correspondant a la même version
  - soit être "mis à jour"" : des fichiers sont à supprimer, d'autres (cités dans mnom) ont une nouvelle version
  voire le cas échéant réduits au point de disparaître.
  */
  for (const pk in avsecrets) {
    const avs = avsecrets[pk]
    const s = secrets[pk]
    if (s && s.v === avs.v) { lavs.push(avs); continue } // inchangé
    const [nv, nvf] = avs.diff(s) // nouvel AVS compte tenu du nouveau s ou de son absence (peut-être à supprimer)
    if (!nv.suppr) lavs.push(nv) // ceux utiles seulement, pas les supprimés
    nvAvs.push(nv) // changé, au moins la version : il y a peut-être, des idfs en plus et en moins
    if (nvf) for (const x of nvf) nvFa.push(x)
  }

  // Liste des fetat utiles et mise en db/store ou delete
  for (const fetat of nvFa) {
    // fetat.dhc = new Date().getTime()
    if (fetat.suppr) delete fetats[fetat.idf]; else fetats[fetat.idf] = fetat
  }

  // Mise à jour de IDB (fetat / fdata et avsecret)
  if (nvFa.length || nvAvs.length) await commitFic(nvAvs, nvFa)

  const avst = stores.avsecret
  lavs.forEach(avs => { avst.setAvsecret(avs) })

  stores.fetat.chargementInitial(fetats)
}

/*********************************************************************
Gestion des fichiers hors-ligne : MAJ des fichiers off-line pour un secret
**********************************************************************/

/* Session UI : MAJ des fichiers off-line pour un secret */
export async function gestionFichierMaj (secret, plus, idf, nom) {
  const avst = stores.avsecret
  const fest = stores.fetat

  const avs = avst.getAvSecret(secret.id, secret.ns) || new AvSecret().nouveau(secret)
  const [nvAvs, nvFa] = avs.maj(secret, plus, idf, nom)

  // Mise à jour de IDB (fetat / fdata et avsecret)
  if (nvFa.length || nvAvs) await commitFic(nvAvs ? [nvAvs] : [], nvFa)

  // Mise en db/store de l'AvSecret créé / modifié / supprimé
  if (nvAvs) avst.setAvsecret(nvAvs)

  if (nvFa.length) fest.chargementIncremental(nvFa)
}

/*********************************************************************
Gestion des fichiers hors-ligne : classes Fetat et Avsecret
**********************************************************************/

/* classe Fetat : un fichier off-line *************************************************/
class Fetat {
  get table () { return 'fetat' }
  get estCharge () { return this.dhc !== 0 }
  get enAttente () { return this.dhc === 0 && !this.dhx }
  get enEchec () { return this.dhc === 0 && this.dhx }

  nouveauSuppr (idf) { this.id = idf; this.suppr = true; return this }

  nouveau (s, f) {
    this.id = f.idf
    this.dhd = new Date().getTime()
    this.dhc = 0
    this.dhx = 0
    this.lg = f.lg
    this.nom = f.nom
    this.info = f.info
    this.ids = s.id
    this.ns = s.ns
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

  async chargementOk(buf) {
    this.dhc = new Date().getTime()
    this.err = ''
    this.dhx = 0
    await setFa(this, buf) // Maj IDB de fetat et fdata conjointement
  }

  async chargementKO(exc) {
    this.dhx = new Date().getTime()
    this.err = html(exc)
    await commitFic([], [this]) // Maj de IDB de fetat avant la date-heure d'échec
    stores.ui.afficherExc(exc)
  }

  async retry () {
    this.dhx = 0
    this.err = ''
    await commitFic([], [this])
    stores.fetat.retry(this.id)
  }

  async abandon () {
    stores.fetat.abandon(this.id)
    const s = getSecret(this.ids, this.ns)
    if (!s) return
    const nom = s.nomDeIdf(this.id)
    await gestionFichierMaj(s, false, this.id, nom)
  }
}

/* AvSecret ****************************************************
Un objet de classe `AvSecret` existe pour chaque secret pour lequel le compte a souhaité
avoir au moins un des fichiers attachés disponible en mode avion.
- Identifiant : `[id, ns]`
- Propriétés :
  - `lidf` : liste des identifiants des fichiers explicitement cités par leur identifiant comme étant souhaité _hors ligne_.
  - `mnom` : une map ayant,
    - _clé_ : `nom` d'un fichier dont le compte a souhaité disposer de la _version la plus récente_ hors ligne.
    - _valeur_ : `idf`, identifiant de cette version constaté dans l'état le plus récent du secret.

schemas.forSchema({
  name: 'idbAvSecret',
  cols: ['id', 'ns', 'v', 'lidf', 'mnom']
})

Un secret off-line */
class AvSecret {
  constructor () { 
    this.lidf = []
    this.mnom = {}
    this.v = 0
  }

  get table () { return 'avsecret' }
  get id2 () { return this.ns }
  get pk () { return this.id + '/' + this.ns }

  nouveau (secret) { 
    this.id = secret.id
    this.ns = secret.ns
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
        const f = s.mfa[idf]
        nvFa.push(new Fetat().nouveau(s, f))
      }
    }
    return nvFa
  }

  /* s est la mise à jour du secret. diff retourne [nv, nvFa]:
  - nv.suppr : si avsecret est à supprimer
  - nv : le nouvel avsecret de même id/ns qui remplace l'ancien. Dans ce cas obj a 2 propriétés :
  - nvFa : la liste des nouveaux Fetat (ou null)
    SI PAS de s : idfs à enlever (les fetat / fdata associés)
  */
  diff (s) {
    const idfs = new Set(this.lidf) // set des idf actuels
    const idfs2 = new Set() // nouvelle liste des idf
    let n = 0
    const nv = new AvSecret().nouveau(this) // clone minimal de this

    if (s) {
      nv.v = s.v
      for (const idf of this.lidf) {
        if (s.mfa[idf]) { nv.lidf.push(idf); idfs2.add(idf) }
      }
      for (const nx in this.mnom) {
        idfs.add(this.mnom[nx])
        const f = s.dfDeNom(nx)
        if (f) { nv.mnom[nx] = f.idf; idfs2.add(f.idf); n++ }
      }
    }
    if (!n && !nv.lidf.length) nv.suppr = true // AvSecret à détruire (plus aucun idf n'existe dans s, s'il y a un s)

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
    const nv = new AvSecret().nouveau(this) // clone minimal de this
    nv.v = s.v

    for (const i of this.lidf) { // reconduction de la liste précédente
      if (i === idf && !plus) continue // sauf si idf doit être enlevé
      if (s.mfa[i]) { nv.lidf.push(i); idfs2.add(i) }
    }
    if (plus && idf && !idfs2.has(idf) && s.mfa[idf]) { nv.lidf.push(idf); idfs2.add(idf) }

    for (const nx in this.mnom) {
      idfs.add(this.mnom[nx]) // complète la liste des idf (avant)
      if (nx === nom && !plus) continue // on ne reconduit pas le nom s'il est enlevé
      const f = s.dfDeNom(nx)
      if (f) { idfs2.add(f.idf); nv.mnom[nx] = f.idf; n++ }
    }
    if (plus && nom && !nv.mnom[nom]) {
      const f = s.dfDeNom(nom)
      if (f) { idfs2.add(f.idf); nv.mnom[nom] = f.idf; n++ }
    }
    if (!n && !nv.lidf.length) nv.suppr = true // AvSecret à détruire (plus aucun idf n'existe dans s, s'il y a un s)

    const nvFa = this.setNvFa(s, idfs, idfs2)
    return [nv, nvFa]
  }
}
