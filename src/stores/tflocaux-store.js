import { defineStore } from 'pinia';

// Textes et fichiers locaux : "clipboard"

export const useTflocauxStore = defineStore('tflocaux', {
  state: () => ({
    tl: new Map(),
    fl: new Map()
  }),

  getters: {
    getTexteLocal: (state) => { return (id) => this.tl.get(id) },
    getFichierLocal: (state) => { return (id) => this.fl.get(id) }

  },

  actions: {
    setTexteLocal (tl) {
      this.tl.set(tl.id, tl)
    },
    delTexteLocal (id) {
      this.tl.delete(id)
    },
    setFichierLocal (tl) {
      this.fl.set(tl.id, tl)
    },
    delFichierLocal (id) {
      this.fl.delete(id)
    }
  }
})
