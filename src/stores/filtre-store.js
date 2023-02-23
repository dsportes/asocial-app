import { defineStore } from 'pinia';

export const useFiltreStore = defineStore('filtre', {
  state: () => ({
    chats : { }
  }),

  getters: {
  },

  actions: {
    setFChats (f) {
      this.chats = f
    }
  }
})
