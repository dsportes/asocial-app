import { defineStore } from 'pinia';

// Notes et fichiers locaux : presse-papier

export const usePpStore = defineStore('pp', {
  state: () => ({
    notes: new Map(),
    fichiers: new Map(),
    modecc: false,
    ccfic: null
  }),

  getters: {
    getNote: (state) => { return (id) => this.notes.get(id) },
    getFichier: (state) => { return (id) => this.fichiers.get(id) },

    lstn: (state) => {
      const lst = Array.from(state.notes.values()) || []
      lst.sort((a, b) => { return a.dh < b.dh ? 1 : (a.dh > b.dh ? -1 : 0) })
      return lst
    },

    lstf: (state) => {
      const lst = Array.from(state.fichiers.values()) || []
      lst.sort((a, b) => { return a.dh < b.dh ? 1 : (a.dh > b.dh ? -1 : 0) })
      return lst
    }

  },

  actions: {
    setNote (n) {
      this.notes.set(n.id, n)
    },
    delNote (id) {
      this.notes.delete(id)
    },
    setFichier (f) {
      this.fichiers.set(f.id, f)
    },
    delFichier (id) {
      this.fichiers.delete(id)
    },
    copiercollerfic (fic) {
      // fic : { nom: '', info: '', lg: 0, type: '', u8: null }
      this.ccfic = fic
    },
  }
})
