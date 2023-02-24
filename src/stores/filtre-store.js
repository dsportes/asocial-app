import { defineStore } from 'pinia';

export const useFiltreStore = defineStore('filtre', {
  state: () => ({
    filtre: { 
      chats: {}
    },
    contexte : {
      chats: {}
    }
  }),

  getters: {
  },

  actions: {
    setFiltre (nom, champ, val) {
      let f = this.filtre[nom]; if (!f) { f = {}; this.filtre[nom] = f}
      f[champ] = val
    }
  }
})
