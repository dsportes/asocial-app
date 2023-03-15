import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { hash } from '../app/util.mjs'

/* 
Un "people" est un avatar :
- (M) soit un membre d'un des groupes du compte qui n'est PAS avatar du compte
- (S) soit un sponsor de la tribu du compte qui n'est PAS avatar du compte
- (C) soit l'interlocuteur d'un chat avec un avatar du compte
Un people peut l'être à plusieurs titre:
  - N fois pour M, N fois au titre C, 1 fois au titre S
La "carte de visite" d'un people provient :
  - de l'un membres M
  - soit de la tribu dont le people est sponsor (où figure sa CV)
  - soit d'un des chats
La plus récente est conservée. 
Chaque element a pour clé l'id de l'avatar :
- na : nom d'avatar
- sp: 0: pas membre de la tribu, 1: simple membre de la tribu, 2: sponsor de la tribu
- cv : carte de visite de l'avatar si elle a été explicitement chargée
- chats: set des ids du compte avec qui il a un chat ouvert.
- sponsor (getter): true si l'avatar est sponsor de la tribu du compte
- groupes : map des groupes cle:idg, valeur:ids auquel le people participe
*/
export const usePeopleStore = defineStore('people', {
  state: () => ({
    map: new Map()
  }),

  getters: {
    // Map des noms d'avatar des people (clé: id)
    peoples: (state) => {
      const m = new Map()
      state.map.forEach(e => { m.set(e.na.id, e.na)})
      return m
    },

    ids: (state) => { return Array.from(state.map.keys()) },

    // retourne { na, cv, sp, chats: Set(), groupes: Map(idg, im)}
    getPeople: (state) => { return (id) => {
        const e = state.map.get(id)
        if (!e) return null
        return e
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

    estSponsor: (state) => { return (id) => { // retourne 0, 1 (membre), 2 (sponsor)
        const e = state.map.get(id)
        return e ? e.sp : 0
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

    /* Retourne le set des avatars du compte avec qui le people a un chat ouvert */
    getAvChats: (state) => { return (id) => { 
        const e = state.map.get(id)
        return !e ? new Set() : e.chats
      }
    },

    /* Retourne l'array des objets chats d'un people */
    getChats: (state) => { return (id) => { 
        const e = state.map.get(id)
        if (!e || ! e.chats.size) return []
        const avStore = stores.avatar
        const l = []
        e.chats.forEach(id2 => {
          const ids = hash(id < id2 ? id + '/' + id2 : id2 + '/' + id)
          l.push(avStore.getChat(id, ids))
        })
        return l
      }
    },
  
    /* Retourne le Set des id des people n'étant que chat ???????????? */
    getPeopleChat: (state) => {
      const s = new Set()
      state.map.values().forEach (e => {
        const id = e.na.id
        if (!state.sponsors.has(id) && !e.groupes.size) s.add(id)
      })
      return s
    },
  },
  
  actions: {
    getElt (na, cv) {
      let e = this.map.get(na.id) 
      if (!e) { e = { na: na, sp: 0, groupes: new Map(), chats: new Set() }; this.map.set(na.id, e) }
      if (cv && (!e.cv || e.cv.v < cv.v)) e.cv = cv
      return e
    },

    delElt (id, e) {
      if (!e.sp && !e.chats.size && !e.groupes.size) this.map.delete(id)
    },
  
    setPeopleTribu (na, cv, sp) { // Sponsor ou simple membre de la tribu
      const e = this.getElt(na, cv)
      e.sp = sp
    },

    unsetPeopleTribu (id) {
      const e = this.map.get(id)
      if (!e) return
      e.sp = 0
      this.delElt(id, e)
    },

    setPeopleMembre (na, idg, ids, cv) {
      const e = this.getElt(na, cv)
      e.groupes.set(idg, ids)
    },

    unsetPeopleMembre (id, idg) {
      const e = this.map.get(id)
      if (!e) return
      e.groupes.delete(idg)
      this.delElt(id, e)
    },

    setPeopleChat (na, id2, cv) { // na: du people, id2: de l'avatar ayant un chat avec lui
      const e = this.getElt(na, cv)
      e.chats.add(id2)
    },
    unsetPeopleChat (id, id2) {
      const e = this.map.get(id)
      if (!e) return
      e.chats.delete(id2)
      this.delElt(id, e)
    },

    setCv (na, cv) { // cv: { v, photo, info }
      this.getElt(na, cv)
    },

    del (id) {
      delete this.map[id]
    }
  }
})
