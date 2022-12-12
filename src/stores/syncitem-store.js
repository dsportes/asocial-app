import { defineStore } from 'pinia';

export const useSyncitemStore = defineStore('syncitem', {
  state: () => ({
    map: new Map(),
    liste : []
  }),

  getters: {
  },

  actions: {
    push (k, st, label, args) {
      this.map.set(k, { k, st, label, args: args || [] })
      this.liste.length = 0
      Array.from(this.map.values()).forEach(x => { this.liste.push(x)})
      this.liste.sort((a, b) => { return a.k < b.k ? -1 : (a.k === b.k ? (a.label < b.label ? -1 : (a.label > b.label) ? 1 : 0) : 1) })
    }
  }
})
