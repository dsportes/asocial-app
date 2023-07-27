import { defineStore } from 'pinia';

export const useFiltreStore = defineStore('filtre', {
  state: () => ({
    filtre: { 
      chats: {},
      tranche: {},
      people: {},
      groupes: { tous: true },
      groupe: {},
      notes: {}
    },
    contexte : {
      chats: {},
      groupes: {},
      groupe: {},
      notes: {}
    },
    tri: {
      espace: 0,
      tranche: 0,
      groupe: 0,
    },
    stats: {
      groupes: {},
      groupe: {}
    }
  }),

  getters: {
  },

  actions: {
    setFiltre (nom, champ, val) {
      let f = this.filtre[nom]; if (!f) { f = {}; this.filtre[nom] = f}
      f[champ] = val
    },
    setTri (nom, val) {
      this.tri[nom] = val
    },
    setContexte (nom, val) {
      this.contexte[nom] = val
    }
  }
})
