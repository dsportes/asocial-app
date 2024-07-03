import { defineStore } from 'pinia'
import { splitPK, toRetry } from '../app/util.mjs'

export const useFicavStore = defineStore('ficav', {
  state: () => ({
    map: new Map(), // Map des ficav : clé idf
    keys: new Map() // Clé: key d'une note: value: Set des idf des fichiers attachés à cette note
  }),

  getters: {
    session: (state) => stores.session,
    nSt: (state) => stores.note,

    mapDeNote: (state) => { return (key) => {
        const m = new Map()
        const lf = state.keys(key)
        if (lf) lf.forEach(f => { m.set(f.id, state.map.get(f.id))})
        return m
      }
    },

    mapDeNoteC: (state) => {
      const nc = state.nSt.note
      return nc ? state.mapDeNote(nc.key) : new Map()
    },

    queue: (state) => {
      const l = []
      for(const [idf, f] of state.map)
        if (f.dhdc && (!f.nbr || toRetry(f.nbr, f.dhdc))) l.push(f)
      l.sort((a,b) => { return a.dhdc < b.dhdc ? -1 : ( a.dhdc > b.dhdc ? 1 : 0)})
      return l
    }
  },

  actions: {
    setFicav (f) {
      this.map.set(f.id, f)
      let e = this.keys.get(f.key); if (!e) { e = new Set(); this.keys.set(f.key, e) }
      e.add(f.id)
    },
    
    delFicav (idf) {
      const f = this.map.get(idf)
      if (f) {
        const e = this.keys.get(f.key)
        if (e) {
          e.delete(idf)
          if (!e.size) this.keys.delete(f.key)
        }
      }
    },

    setNote (note, buf) {
      const m = this.mapDeNote(note.key)

      const mn = new Map() // map des ficav de même nom - clé: nom, valeur: set des idf
      for (const [idf, f] of m) {
        let e = mn.get(f.nom); if (!e) { e = new Set(); mn.set(f.nom, e) }; e.add(idf)
      }

      const mfan = new Map() // map des fichiersde la de même nom - clé: nom, valeur: set des idf
      for (const [idf, f] of mfa) {
        let e = mn.get(f.nom); if (!e) { e = new Set(); mfan.set(f.nom, e) }; e.add(idf)
      }

      const mfa = note.mfa
      for (const [idf, nf] of mfa) {
        if (!m.has(idf)) { // Traiter le cas d'un nouveau fichier
          
        }
      }
      for (const [idf, f] of m) {
        if (!mfa.has(idf)) { // Traiter le cas d'un fichier disparu
          buf.purgeFIDB(idf)
          this.delFicav(idf)
        }
      }
      
    },

    // Suppression d'une note
    delNote (id, ids, buf) {
      const k = id + '/' + ids
      const lf = this.keys.get(k)
      if (lf) for(const idf of lf) {
        this.map.delete(idf)
        buf.purgeFIDB(idf)
      }
      this.keys.delete(k)
    },

    // Suppression de toutes les notes de l'avatar ou du groupe id
    delNotes (idag, buf) {
      for(const [k, lf] of this.keys) {
        const [id, ids] = splitPK(k)
        if (id === idag) lf.forEach(idf => { 
          this.map.delete(idf)
          buf.purgeFIDB(idf)
        })
        this.keys.delete(k)
      }
    }
  }
})
