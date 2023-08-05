import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from 'firebase/firestore'

import { decode } from '@msgpack/msgpack'

// import stores from '../stores/stores.mjs'
import { SyncQueue } from './sync.mjs'
import { ID } from './api.mjs'
import { toByteArray } from './base64.mjs'

export class FsSyncSession {
  static app = null

  constructor () { 
    this.fs = null
    this.subTribu = new Map()
    this.subVersion = new Map()
    this.subCompta = null
    this.subEspace = null
  }

  async unsub (unsub) {
  }

  async sub (nom, id) {
    return null
  }

  open (firebaseConfig) {
    // Initialize Firebase
    if (!FsSyncSession.app)
      FsSyncSession.app = initializeApp(firebaseConfig)
    // Initialize Cloud Firestore and get a reference to the service
    this.fs = getFirestore(FsSyncSession.app)
    // connectFirestoreEmulator(this.fs, '127.0.0.1', 8080)
  }

  async getEspace (ns) {
    try {
      const docRef = doc(this.fs, 'espaces/' + ns)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const row = docSnap.data()
        row._nom = docSnap.ref.parent.path
        if (row._data_) row._data_ = row._data_.toUint8Array()

        const esp = decode(row._data_) // compile simplifié
        console.log(JSON.stringify(esp))
        return esp.org

      } else {
        console.log("No such document!")
        return '???'
      }
    } catch (e) {
      console.log(e)
    }
  }

  close () { // PAS ASYNC !!! Déconnexion n'est async
    for (const [id, u] of this.subTribu) this.unsub(u)
    for (const [id, u] of this.subVersion) this.unsub(u)
    if (this.subCompta) this.unsub(this.subCompta)
    if (this.subEspace) this.unsub(this.subEspace)
    this.subTribu.clear()
    this.subVersion.clear()
    this.subCompta = null
    this.subEspace = null
  }

  /*
  Mettre un row reçu à traiter : SyncQueue.push(row)
  */
  onRow (doc) {
    const row = doc.data()
    // Pour rendre le row compilable
    if (row._data_) row._data_ = row._data_.toUint8Array()
    // !!! MANQUE row._nom
    row._nom = doc.ref.parent.path
    SyncQueue.push(row)
  }

  async setCompte (id) { // comptas ET espace
    this.subCompta = await this.sub('comptas', id)
    this.subEspace = await this.sub('comptas', ID.ns(id))
  }

  async setTribu (id) { // tribus du compte
    if (!this.subTribu.has(id)) {
      const unsub = await this.sub('tribus', id)
      this.subTribu.set(id, unsub)
    }
  }

  async setGroupe (id) { // versions
    if (!this.subVersion.has(id)) {
      const unsub = await this.sub('versions', id)
      this.subVersion.set(id, unsub)
    }
  }

  async setAvatar (id) { // versions
    await this.setGroupe(id)
  }

  async unsetTribu (id) {
    const unsub = this.subTribu.get(id)
    if (unsub) this.unsub(unsub)
  }

  async unsetGroupe (id) {
    const unsub = this.subVersion.get(id)
    if (unsub) this.unsub(unsub)
  }

  async unsetAvatar (id) {
    await this.unsetGroupe(id)
  }
}