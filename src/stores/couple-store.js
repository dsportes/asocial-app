import { defineStore } from 'pinia'
import stores from './stores.mjs'

export const useCoupleStore = defineStore('couple', {
  state: () => ({
    map: new Map()
  }),

  getters: {
    getIds: (state) => { return Array.from(state.map.keys()) },

    getCouple: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.couple : null 
      }
    },
    getSecret: (state) => { return (id, ns) => { 
        const e = state.map.get(id)
        return e ? e.secrets.get(ns) : null 
      }
    },
    getSecrets: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.secrets : null 
      }
    }
  },

  actions: {
    setCouple (couple) {
      if (!couple) return
      let e = this.map.get(couple.id)
      if (!e) {
        e = { couple: couple, secrets: new Map() }
        this.map.set(couple.id, e)
      } else e.couple = couple
      const people = stores.people
      const na = couple.naE
      const nax = people.getNa(na.id)
      if (!nax || !nax.egal(na)) people.setNa(na)
      if (!people.hasCpId(na.id, couple.id)) {
        people.addCpId(na.id, couple.id)
      }
    },

    setSecret (secret) {
      if (!secret) return
      const e = this.map.get(secret.id)
      if (!e) return
      e.secrets.set(secret.ns, secret)
    },
    delSecret (id, ns) {
      const e = this.map.get(id)
      if (!e) return
      e.secrets.delete(ns)
    },
    delSecrets (id) {
      const e = this.map.get(id)
      if (!e) return
      e.secrets.clear()
    },

    del (id) {
      delete map[id]
    }
  }
})
