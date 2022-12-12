import { defineStore } from 'pinia'
import stores from './stores.mjs'

export const useGroupeStore = defineStore('groupe', {
  state: () => ({
    map: new Map()
  }),

  getters: {
    getIds: (state) => { return Array.from(state.map.keys()) },

    getGroupe: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.groupe : null 
      }
    },
    getCv: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.cv : null 
      }
    },
    getMembre: (state) => { return (id, im) => { 
        const e = state.map.get(id)
        return e ? e.membres.get(im) : null 
      }
    },
    getMembres: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.membres : null 
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
    setGroupe (groupe) {
      if (!groupe) return
      let e = this.map.get(groupe.id)
      if (!e) {
        e = { groupe: groupe, cv: null, membres: new Map(), secrets: new Map() }
        this.map.set(groupe.id, e)
      } else e.groupe = groupe
    },

    setMembre (membre) {
      if (!membre) return
      const e = this.map.get(membre.id)
      if (!e) return
      e.membres.set(membre.im, membre)
      const na = membre.namb
      const compte = stores.session.compte
      if (compte.estAc(na.id)) return // c'est un des avatars du compte
      // c'est vraiement un avatar externe
      const people = stores.people
      if (!people.getNa(na.id)) people.setNa(na)
      if (!people.hasMbId(na.id, membre.id, membre.im)) {
        people.addMbId(na.id, membre.id, membre.im)
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

    setCv (cv) {
      if (!cv) return
      const e = this.map.get(cv.id)
      if (!e) return
      e.cv = cv
    },

    delCv (id) {
      if (!id) return
      const e = this.map.get(id)
      if (!e) return
      e.cv = null
    },

    del (id) {
      delete map[id]
    }
  }
})
