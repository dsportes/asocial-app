import { defineStore } from 'pinia'
import stores from './stores.mjs'

/* Chaque element a pour clé l'id de l'avatar :
- na : nom d'avatar
- cv : carte de viste de l'avatar
- paraain : true si l'avatar est parrain de la tribu du compte (pas pour le comptable)
- mbIds : set des ids de membre des groupes (forme : 'id/im')
- cpIds: set des Ids des couples dont l'avatar est l'élément externe.
*/
export const usePeopleStore = defineStore('people', {
  state: () => ({
    map: new Map(),
    parrains: new Set()
  }),

  getters: {
    getIds: (state) => { return Array.from(state.map.keys()) },

    getParrains: (state) => { return state.parrains },

    getPeople: (state) => { return (id) => { 
        return state.map.get(id)
      }
    },
    getNa: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.avatar : null 
      }
    },
    getCv: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.cv : null 
      }
    },
    estParrain: (state) => { return (id) => {
        return state.parrains.has(id) 
      }
    },
    hasMbId: (state) => { return (id, idg, im) => { 
        const e = state.map.get(id)
        if (!e) return false
        return e.mbIds.has(idg + '/' + im)
      }
    },
    getMbIds: (state) => { return (id) => { 
        const e = state.map.get(id)
        if (!e) return []
        const r = []
        if (!e.mbIds.size) return r
        e.mbIds.forEach(s => {
          const i = s.indexOf('/')
          r.push([parseint(s.substring(0, n), parseInt(s.substring(n + 1)))])
        })
        return r 
      }
    },
    getMembres: (state) => { return (id) => { 
        const e = state.map.get(id)
        if (!e) return []
        const r = []
        if (!e.mbIds.size) return r
        const stg = stores.groupe
        e.mbIds.forEach(s => {
          const n = s.indexOf('/')
          const idg = parseInt(s.substring(0, n))
          const im = parseInt(s.substring(n + 1))
          const mb = stg.getMembre(idg, im)
          if (mb) r.push(mb)
        })
        return r 
      }
    },
    hasCpId: (state) => { return (id, idc) => { 
        const e = state.map.get(id)
        if (!e) return false
        return e.cpIds.has(idc)
      }
    },
    getCpIds: (state) => { return (id) => { 
        const e = state.map.get(id)
        if (!e) return []
        if (!e.cpIds.size) return []
        return Array.from(e.cpIds)
      }
    },
    getCouples: (state) => { return (id) => { 
        const e = state.map.get(id)
        if (!e) return []
        if (!e.cpIds.size) return []
        const r = []
        const stc = stores.couple
        e.cpIds.forEach(id => {
          const cp = stc.getCouple(id)
          if (cp) r.push(cp)
        })
        return r
      }
    },
  },

  actions: {
    setNa (na) {
      if (!na) return
      if (!this.map.get(na.id)) this.newPeople(na)
    },

    /* Cette méthode permet de détecter plus facilement sur les $onAction
    les créations de people (avatars externes)
    - si opt, ne créé pas un nouvel élément s'il y est déjà */
    newPeople (na, opt) {
      const  e = { na: na, cv: null, mbIds: new Set(), cpIds: new Set() }
      if (!opt) {
        this.map.set(na.id, e)
      } else {
        if (!this.map.has(na.id)) this.map.set(na.id, e)
      }
      return this.map.get(na.id)
    },

    addMbId (id, idg, im) {
      const e = this.map.get(id)
      if (!e) return
      const pk = idg + '/' + im
      if (!e.mbIds.has(pk)) e.mbIds.add(pk)
    },

    remMbId (id, idg, im) {
      const e = this.map.get(id)
      if (e) return
      const pk = idg + '/' + im
      if (e.mbIds.has(pk)) e.mbIds.delete(pk)
    },

    addCpId (id, idc) {
      const e = this.map.get(id)
      if (!e) return
      if (!e.cpIds.has(idc)) e.cpIds.add(idc)
    },

    remCpId (id, idc) {
      const e = this.map.get(id)
      if (!e) return
      if (!e.cpIds.has(idc)) e.cpIds.delete(idc)
    },

    setCv (cv) {
      if (!cv) return
      const e = this.map.get(cv.id)
      if (!e) return
      e.cv = cv
    },

    setParrain (id, estParrain) {
      if (!id) return
      if (!this.map.get(id)) return
      if (estParrain) this.parrains.add(id); else this.parrains.delete(id)
    },

    delCv (id) {
      if (!id) return
      const e = this.map.get(id)
      if (!e) return
      e.cv = null
    },

    del (id) {
      delete this.map[id]
    }
  }
})
