import { defineStore } from 'pinia';

export const useTribuStore = defineStore('tribu', {
  state: () => ({
    map: new Map()
  }),

  getters: {
    getIds: (state) => { return Array.from(state.map.keys()) },

    getTribu: (state) => { return (id) => state.map.get(id) }
  },

  actions: {
    setTribu (tribu) {
      this.map.set(tribu.id, tribu)
    },
    del (id) {
      this.map.delete(id)
    }
  }
})
