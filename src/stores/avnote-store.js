import { defineStore } from 'pinia'

export const useAvnoteStore = defineStore('avnote', {
  state: () => ({
    map: new Map()
  }),

  getters: {
    getIds: (state) => { return Array.from(state.map.keys()) },
    
    getAvnote: (state) => { return (id, ns) => {
        const e = this.map.get(id)
        if (!e) return null
        return e.get(ns)
      }
    },

    getAvnotes: (state) => { 
      return (id) => {
        const e = this.map.get(id)
        const r = []
        if (!e) return r
        return Array.from(e.keys())
      }
    }
  },

  actions: {
    setAvnote (avnote) {
      let e = this.map.get(avnote.id)
      if (e) {
        if (avnote.suppr) {
          e.delete(avnote.ns)
          if (!e.size) this.map.delete(avnote.id)
        } else e.set(ns, avnote)
      } else {
        if (avnote.suppr) return
        e = new Map(); 
        this.map.set(avnote.id, e)
        e.set(avnote.ns, avnote)
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
