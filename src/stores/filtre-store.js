import { defineStore } from 'pinia';

export const useFiltreStore = defineStore('filtre', {
  state: () => ({
    filtre: { 
      chats: {},
      tribus: {}
    },
    contexte : {
      chats: {}
    },
    tri: {
      tribus: 0
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
