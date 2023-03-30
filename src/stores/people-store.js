import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { hash, u8ToB64 } from '../app/util.mjs'

/* 
Un "people" est un avatar :
- (M) soit un membre d'un des groupes du compte qui n'est PAS avatar du compte
- (T) soit un compte de la tribu du compte (qui n'est PAS avatar du compte)
- (C) soit l'interlocuteur d'un chat avec un avatar du compte
Un people peut l'être à plusieurs titre:
  - N fois pour M, N fois au titre C, 1 fois au titre T
La "carte de visite" d'un people provient :
  - de l'un membres M
  - soit de la tribu dont le people est compte (où figure sa CV)
  - soit d'un des chats
La plus récente est conservée. 
Chaque element a pour clé l'id de l'avatar :
- na : nom d'avatar
- disparu : true si le people a été détecté disparu
- sp: 0: pas compte de la tribu, 1: simple compte de la tribu, 2: sponsor de la tribu
- cv : carte de visite de l'avatar si elle a été explicitement chargée
- chats: Map par chats, cle id(de l'avatar) valeur [idsI, idsE].
- sponsor (getter): true si l'avatar est sponsor de la tribu du compte
- groupes : Map des groupes cle:idg, valeur:ids auquel le people participe
*/
export const usePeopleStore = defineStore('people', {
  state: () => ({
    map: new Map()
  }),

  getters: {
    peC: (state) => { 
      const id = stores.session.peopleId
      return state.map.get(id)
    },

    // Array des ids des people
    peopleIds: (state) => { return Array.from(state.map.keys()) },

    naSponsors: (state) => {
      const t = []
      state.map.forEach(e => { if (e.sp === 2) t.push(e.na) })
      return t
    },

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

    estPeople: (state) => { return (id) => { 
        return state.map.has(id)
      }
    },

    estSponsor: (state) => { return (id) => { // retourne 0, 1 (compte de la tribu), 2 (sponsor de la tribu)
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
  
    /* Export pour rafraîchir CV
    { idE, vcv, lch: [[idI, idsI, idsE] ...], lmb: [[idg, im] ...] }
    */
    exportPourCv: (state) => { return (idE) => { 
        const e = state.map.get(idE)
        if (!e) return null
        const lch = []
        const lmb = []
        e.chats.forEach((val, idI) => { lch.push([idI, val[0], val[1]]) })
        e.groupes.forEach((ids, idg) => { lch.push([idg, ids]) })
        const vcv = e.cv ? e.cv.v : 0
        return { idE, vcv, lch, lmb }
      }
    }
  },
  
  actions: {
    getElt (na, cv, disp) {
      let e = this.map.get(na.id)
      if (!e) {
        if (disp) return null
        e = { na: na, sp: 0, groupes: new Map(), chats: new Map() }; this.map.set(na.id, e)
      }
      if (cv && (!e.cv || e.cv.v < cv.v)) e.cv = cv
      return e
    },

    delElt (id, e) {
      if (!e.sp && !e.chats.size && !e.groupes.size) this.map.delete(id)
    },

    setDisparu (na) {
      const e = this.getElt(na, null, true)
      if (!e) return null
      if (e.disparu) return null
      e.disparu = true
      if (!e.sp) return null 
      return { // args de l'opération DisparitionCompte
        idt: stores.session.tribuId,
        idc: na.id,
        hrnd: hash(u8ToB64(na.rnd))
      }
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

    setPeopleChat (chat, cv) { // naE: du people, idI: de l'avatar ayant un chat avec lui
      const e = this.getElt(chat.naE, cv)
      e.chats.set(chat.id, [chat.ids, chat.idsE])
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
