import { defineStore } from 'pinia'

export const useAvsecretStore = defineStore('avsecret', {
  state: () => ({
    map: new Map()
  }),

  getters: {
    getIds: (state) => { return Array.from(state.map.keys()) },
    
    getAvsecret: (state) => { return (id, ns) => {
        const e = this.map.get(id)
        if (!e) return null
        return e.get(ns)
      }
    },

    getAvsecrets: (state) => { 
      return (id) => {
        const e = this.map.get(id)
        const r = []
        if (!e) return r
        return Array.from(e.keys())
      }
    }
  },

  actions: {
    setAvsecret (avsecret) {
      let e = this.map.get(avsecret.id)
      if (e) {
        if (avsecret.suppr) {
          e.delete(avsecret.ns)
          if (!e.size) this.map.delete(avsecret.id)
        } else e.set(ns, avsecret)
      } else {
        if (avsecret.suppr) return
        e = new Map(); 
        this.map.set(avsecret.id, e)
        e.set(avsecret.ns, avsecret)
      }
    },

    del (id, ns) {
      const e = this.map.get(id)
      if (!e) return
      e.delete(ns)
      if (!e.size) delete this.map.delete(id)
    }
  }
})
