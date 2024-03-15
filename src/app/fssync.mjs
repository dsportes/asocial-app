import { initializeApp } from 'firebase/app'
import { getFirestore, connectFirestoreEmulator, doc, getDoc, onSnapshot } from 'firebase/firestore'

import { decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { syncQueue } from './synchro.mjs'
import { ID } from './api.mjs'

export class FsSyncSession {
  setDs (dataSync) {
    // TODO
  }

  static initfaite = false
  static app = null

  constructor () { 
    this.fs = null
    this.subTribu = new Map()
    this.subVersion = new Map()
    this.subCompta = null
    this.subEspace = null
  }

  open (firebaseConfig, fsEmulator) {
    // Initialize Firebase
    if (!FsSyncSession.initfaite)
      FsSyncSession.app = initializeApp(firebaseConfig)

    // Initialize Cloud Firestore and get a reference to the service
    this.fs = getFirestore(FsSyncSession.app)

    if (!FsSyncSession.initfaite && fsEmulator) {
      const i = fsEmulator.indexOf(':')
      const h = fsEmulator.substring(0, i)
      const p = parseInt(fsEmulator.substring(i + 1))
      connectFirestoreEmulator(this.fs, h, p)
    }
    FsSyncSession.initfaite = true
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

  setPartitionC (rds) {
    // TODO
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
    return onSnapshot(doc(this.fs, nom + '/' + id), async (doc) => {
      if (doc.exists()) await this.onRow(doc)
      // else console.log(`Doc non existant: ${doc.ref.path}`)
    })
  }

  /*
  Mettre un row reçu à traiter : syncQueue.setRows([row])
  */
  async onRow (d) {
    const nom = d.ref.parent.path
    const row = d.data()
    row._nom = nom
    let z = true
    if (row._data_) {
      row._data_ = row._data_.toUint8Array()
      z = false
    }
    console.log(`onRow: ${row._nom} ${z ? 'zombi' : ''} ${row.id}`)
    syncQueue.setRows([row])
  }

  async setCompte (id) { // comptas ET espace
    this.subCompta = await this.sub('comptas', id)
    this.subEspace = await this.sub('espaces', ID.ns(id))
    await this.setVersion(id)
  }

  async setTribu (id) { // tribus du compte
    if (!this.subTribu.has(id)) {
      const unsub = await this.sub('tribus', id)
      this.subTribu.set(id, unsub)
    }
  }

  async setTribuC (id) { // tribu courante
    const session = stores.session
    if (session.tribuCId && (session.tribuCId !== id)) {
      // Désabonnement de la précédente courante
      const unsub = this.subTribu.get(id)
      this.unsub(unsub)
    }
    // Abonnement à la nouvelle courante
    if (!this.subTribu.has(id)) {
      const unsub = await this.sub('tribus', id)
      this.subTribu.set(id, unsub)
    }
  }

  async setVersion (id) { // versions
    if (!this.subVersion.has(id)) {
      const unsub = await this.sub('versions', id)
      this.subVersion.set(id, unsub)
    }
  }

  async setGroupe (id) { // versions
    await this.setVersion(id)
  }

  async setAvatar (id) { // versions
    await this.setVersion(id)
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