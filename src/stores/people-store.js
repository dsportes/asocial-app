import { defineStore } from 'pinia'
import stores from './stores.mjs'

/* 
Un "people" est un avatar :
- (M) soit un membre d'un des groupes du compte qui n'est PAS avatar du compte
- (S) soit un sponsor de la tribu du compte qui n'est PAS avatar du compte
- (C) soit l'interlocuteur d'un chat avec un avatar du compte
Un people peut l'être à plusieurs titre:
  - N fois pour M, N fois au titre C, N fois au titre S
La "carte de visite" d'un people provient :
  - de l'un membres M
  - soit de la tribu dont le people est sponsor (où figure sa CV)
  - soit d'avoir été explictement recherchée s'il n'est connu que pour chat
Chaque element a pour clé l'id de l'avatar :
- na : nom d'avatar
- cv : carte de visite de l'avatar si elle a été explicitement chargée
- estChat: true si le people est apparu au moins une fois dans la session
  dans un chat, même s'il n'apparaît plus
- sponsor (getter): true si l'avatar est sponsor de la tribu du compte
- groupes : map des groupes cle:idg, valeur:ids auquel le people participe
*/
export const usePeopleStore = defineStore('people', {
  state: () => ({
    map: new Map(),
    sponsors: new Set() // set des ids des sponsors (incluant les avatars du compte !)
  }),

  getters: {
    // Map des noms d'avatar des people (clé: id)
    peoples: (state) => {
      const m = new Map()
      state.map.forEach(e => { m.set(e.na.id, e.na)})
      return m
    },

    ids: (state) => { return Array.from(state.map.keys()) },

    // retourne { na, cv, sponsor: true/false, groupes: Map(idg, im)}
    getPeople: (state) => { return (id) => {
        const e = state.map.get(id)
        if (!e) return null
        const r = { ...e }
        r.cv = this.getCv(id)
        return r
      }
    },
    getNa: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.na : null 
      }
    },

    /* Retourne la CV */
    getCv: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.cv : null
      }
    },

    estSponsor: (state) => { return (id) => {
        return state.sponsors.has(id) 
      }
    },

    // Retourne l'Array des documents 'groupe' auquel ce people participe
    getGroupes: (state) => { return (id) => { 
        const e = state.map.get(id)
        if (!e) return null
        const st = stores.groupe
        const a = []
        if (e.groupes && e.groupes.size)
          e.groupes.forEach(idg => { a.push(st.getGroupe(idg)) })
        return a
      }
    },

    // Retourne l'Array de TOUS les documents membre pour 
    // TOUS les groupes auquel ce people id participe
    getMembres: (state) => { return (id) => { 
        const e = state.map.get(id)
        if (!e || !e.groupes) return null
        const st = stores.groupe
        const a = []
        e.groupes.forEach((im, idg) => { a.push(st.getMembre(idg, im)) })
        return a
      }
    },

    // Retourne LE document membre de ce people id dans LE groupe idg
    getMembre: (state) => { return (id, idg) => { 
        const e = state.map.get(id)
        if (!e || !e.groupes) return null
        const im = e.groupes.get(idg)
        return im ? stores.groupe.getMembre(idg, im) : null
      }
    },

    /* Retourne le Set des id des people n'étant que chat */
    getPeopleChat: (state) => {
      const s = new Set()
      Array.from(state.map.values()).forEach (e => {
        const id = e.na.id
        if (!state.sponsors.has(id) && !e.groupes.size) s.add(id)
      })
      return s
    },
  },

  actions: {
    setPeopleSponsor (na, cv) {
      const e = this.map.get(na.id) || { na: na, groupes: new Map() }
      if (cv && (!e.cv || e.cv.v < cv.v)) e.cv = cv
      this.map.set(na.id, e)
      this.sponsors.add(na.id)
      return e
    },

    unsetPeopleSponsor (id) {
      const e = this.map.get(id)
      if (!e) return
      this.sponsors.delete(id)
      if (!e.estChat && !groupes.size) this.map.delete(id)
    },

    setPeopleMembre (na, idg, ids, cv) {
      const e = this.map.get(na.id) || { na: na, groupes: new Map() }
      if (cv && (!e.cv || e.cv.v < cv.v)) e.cv = cv
      e.groupes.set(idg, ids)
      this.map.set(na.id, e)
      return e
    },

    unsetPeopleMembre (id, idg) {
      const e = this.map.get(id)
      if (!e) return
      e.groupes.delete(idg)
      if (!e.estChat && !groupes.size) this.map.delete(id)
    },

    setPeopleChat (na, cv) {
      const e = this.map.get(id) || { na: na, groupes: new Map() }
      if (cv && (!e.cv || e.cv.v < cv.v)) e.cv = cv
      e.estChat = true
      this.map.set(id, e)
      return e
    },

    setCv (id, cv) { // cv: { v, photo, info }
      const e = this.map.get(id)
      if (!e) return
      if (cv && (!e.cv || e.cv.v < cv.v)) e.cv = cv
      return e
    },

    /*
    newPeople (na, reset) {
      const  e = { na: na, cv: null, groupes: new Map() }
      if (!this.map.has(na.id) || reset) this.map.set(na.id, e)
      return this.map.get(na.id)
    },

    // Inscrit que ce people id est le membre im du groupe idg
    // OU si im est 0, supprime la participation de CE people au groupe
    setMbId (id, idg, im) {
      const e = this.map.get(id)
      if (!e) return
      const g = e.groupes.get(idg)
      if (!g) {
        if (im) e.groupes.set(idg, im)
      } else {
        if (im) e.groupes.set(idg, im); else e.groupes.delete(idg)
      }
    },

    setCv (cv) { // cv: { v, photo, info }
      if (!cv) return
      const e = this.map.get(cv.id)
      if (!e || e.groupes.size) return // N'enregistre pas de CV pour un people membre d'un groupe
      e.cv = cv
    },

    delCv (id) {
      if (!id) return
      const e = this.map.get(id)
      if (!e) return
      e.cv = null
    },

    setSponsors (ids) { // array des id des sponsors
      if (!ids) return
      this.sponsors = new Set(ids)
    },
    */

    del (id) {
      delete this.map[id]
    }
  }
})
