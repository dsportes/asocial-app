import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, doc, getDoc, onSnapshot } from 'firebase/firestore'

import { decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { SyncQueue } from './sync.mjs'
import { ID } from './api.mjs'

export class FsSyncSession {
  static app = null

  constructor () { 
    this.fs = null
    this.subTribu = new Map()
    this.subVersion = new Map()
    this.subCompta = null
    this.subEspace = null
  }

  open (firebaseConfig) {
    // Initialize Firebase
    if (!FsSyncSession.app)
      FsSyncSession.app = initializeApp(firebaseConfig)
    // Initialize Cloud Firestore and get a reference to the service
    this.fs = getFirestore(FsSyncSession.app)
    const cfg = stores.config
    if (cfg.fsEmulator)
      connectFirestoreEmulator(this.fs, '127.0.0.1', cfg.fsEmulator)
  }

  close () { // PAS ASYNC !!! Déconnexion n'est async
    for (const [id, u] of this.subTribu) this.unsub(u)
    for (const [id, u] of this.subVersion) this.unsub(u)
    this.unsub(this.subCompta)
    this.unsub(this.subEspace)
    this.subTribu.clear()
    this.subVersion.clear()
    this.subCompta = null
    this.subEspace = null
  }

  async getEspace (ns) { // Pour tester
    try {
      const docRef = doc(this.fs, 'espaces/' + ns)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const row = docSnap.data()
        row._nom = docSnap.ref.parent.path
        if (row._data_) row._data_ = row._data_.toUint8Array()

        const esp = decode(row._data_) // compile simplifié
        console.log(JSON.stringify(esp))
        this.subEspace = this.sub('espaces', ns)

        return esp.org

       } else {
        console.log("No such document!")
        return '???'
      }
    } catch (e) {
      console.log(e)
    }
  }

  async unsub (unsub) {
    if (unsub) unsub()
  }

  async sub (nom, id) {
    return onSnapshot(doc(this.fs, nom + '/' + id), (doc) => {
      this.onRow(doc)
    })
  }

  /*
  Mettre un row reçu à traiter : SyncQueue.push(row)
  */
  onRow (d) {
    const nom = d.ref.parent.path
    const row = d.data()
    row._nom = nom
    if (row._data_) row._data_ = row._data_.toUint8Array()
    // Pour tester - à la console org est modifié dans l'index, pas dans le _data_
    console.log('onRow:', row._nom, row.id, row.org) 
    // De vrai
    // SyncQueue.push(row)
  }

  async setCompte (id) { // comptas ET espace
    this.subCompta = await this.sub('comptas', id)
    this.subEspace = await this.sub('espaces', ID.ns(id))
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
    this.unsub(this.subTribu.get(id))
  }

  async unsetGroupe (id) {
    this.unsub(this.subVersion.get(id))
  }

  async unsetAvatar (id) {
    this.unsub(this.subVersion.get(id))
  }
}