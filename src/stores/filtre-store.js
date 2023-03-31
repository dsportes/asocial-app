import { defineStore } from 'pinia';

export const useFiltreStore = defineStore('filtre', {
  state: () => ({
    filtre: { 
      chats: {},
      tribus: {},
      tribu2: {},
      people: {},
      groupes: { tous: true }
    },
    contexte : {
      chats: {}
    },
    tri: {
      tribus: 0,
      tribu2: 0
    },
    stats: {
      groupes: {}
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
    }
  }
})
