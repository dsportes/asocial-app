import { defineStore } from 'pinia'
import { Idn } from '../app/modele.mjs'

export const useFiltreStore = defineStore('note', {
  state: () => ({
    /* 
    clé: Objet Idn (id, ids)
    valeur:
      idn: objet Idn l'identifiant
      ref: Idn de la note référencée
      refs: Set des Idn des notes qui la référence
      note: Objet Secret
    */
    map: new Map()
  }),

  getters: {
    // get de l'entrée Note
    getEN: (state) => { return (idn) => { 
        return state.map.get(idn)
      }
    },

  },

  actions: {
    setNote (note) {
      if (!note) return
      const idn = Idn.get(note.id, note.ids)
      let e = this.map.get(idn); if (!e) { e = {}; this.map.set(idn, e) }
      e.idn = idn
      e.ref = note.ref
      e.refs = note.refs ? new Set(note.refs) : new Set()
      e.note = note
    },

    del (note) {
      const idn = Idn.get(note.id, note.ids)
      this.map.del(idn)
    }
  }
})
