import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { CV } from '../app/modele.mjs'

/* 
Un people est un avatar (pas du compte):
- soit membre d'un groupe auquel le compte accède,
- soit interlocuteur d'un chat avec un avatar du compte.
- soit délégué de la partition du compte
Map:
- clé: id de l'avatar
- valeur: { sgr, sch, del }
  - del: true si délégué de la partition du compte
  - sgr: Set des groupes dont le people est membre.
  - sch: Set des avatars du compte avec lequel le people a un chat.
*/
export const usePeopleStore = defineStore('people', {
  state: () => ({
    map: new Map(),
    cvs: new Map()
  }),

  getters: { 
    ns: () => stores.session.ns,
    gSt: () => stores.groupe,
    session: () => stores.session, 

    /* Retourne la CV la plus récente pour une id */
    getCV: (state) => { return (id) => { 
      return id ? state.cvs.get(id) || CV.fake(id) : CV.fake(0) } },

    getSgr: (state) => { return (idp) => { 
        const e = state.map.get(idp)
        return e ? e.sgr : new Set() 
      }
    },

    getSch: (state) => { return (idp) => { 
        const e = state.map.get(idp)
        return e ? e.sch : new Set() 
      }
    },

    // Array des ids des people
    peopleIds: (state) => { return Array.from(state.map.keys()) },

    nom: (state) => { return (id, c) => { // c: 0 court, 1: long, n : lg max 
        const cv = state.getCV(id)
        let l
        if (cv.v) {
          if (!c) return cv.nom
          if (c === 1) return cv.nomC 
          l = cv.nom
        }
        if (!l) {
          const compti = state.session.compti
          const e = compti.mc.get(id)
          l = e ? e.tx : '#' + ('' + id).substring(10)
        }
        if (c < 2 || l.length < c) return l 
        return l.substring(0, c) + '...'
      }
    },

    /* liste des groupes dont le people est co-membre actif 
    de l'avatar idav (ayant accès aux membres) */
    getListeIdGrComb: (state) => { return (idp, idav) => { 
        const l = []
        const e = state.map.get(idp)
        if (e) for (const idg of e.sgr) {
          const eg = gSt.map.get(idg)
          if (eg) {
            const g = eg.groupe
            if (g && ((g.accesMembre(g.mmb(idav) || 0) && g.estActif(g.mmb(idp) || 0)))) l.push(idg)
          }
        }
        return l
      }
    },

    estPeople: (state) => { return (id) => { 
        return state.map.has(id)
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
        e.groupes.forEach((ids, idg) => { lmb.push([idg, ids]) })
        const vcv = e.cv ? e.cv.v : 0
        return { idE, vcv, lch, lmb }
      }
    }

  },
  
  actions: {
    setCV (cv) {
      const x = this.cvs.get(cv.id)
      if (!x || x.v < cv.v) this.cvs.set(cv.id, cv)
    },

    getElt (id) {
      let e = this.map.get(id)
      if (!e) { e = { sch: new Set(), sgr: new Set() }; this.map.set(id, e) }
      return e
    },

    delElt (id, e) {
      if (e && !e.sch.size && !e.sgr.size) this.map.delete(id)
    },

    setPGr (idp, idg) {
      if (!this.session.estAvc(idp)) {
        const e = this.getElt(idp)
        e.sgr.add(idg)
      }
    },

    delPGr (idp, idg) {
      if (!this.session.estAvc(idp)) {
        const e = this.map.get(idp)
        if (e) {
          e.sgr.delete(idg)
          this.delElt(idp, e)  
        }
      }
    },

    delGr (idg) {
      const ppvides = new Set()
      this.map.forEach((e, idp) => {
        if (e.sgr.has(idg)) {
          e.sgr.delete(idg)
          if (!e.sgr.size && !e.sch.size) ppvides.add(idp)
        }
      })
      if (ppvides.vides.size) ppvides.forEach(idp => { this.map.delete(idp) })
    },

    delCh (ida) {
      const ppvides = new Set()
      this.map.forEach((e, idp) => {
        if (e.sch.has(ida)) {
          e.sch.delete(ida)
          if (!e.sgr.size && !e.sch.size) ppvides.add(ida)
        }
      })
      if (ppvides.vides.size) ppvides.forEach(idp => { this.map.delete(idp) })
    },

    setPCh (idp, ida) {
      let e = this.map.get(idp); if (!e) { e = { sgr: new Set(), sch: new Set()}; this.map.set(idp, e)}
      e.sch.add(ida)
    },

    delPCh (idp, ida) {
      const e = this.map.get(idp); if (!e) return
      e.sch.delete(ida)
      if (!e.sgr.size && !e.sch.size) this.map.delete(idp)
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
        hrnd: na.hrnd
      }
    },
  
    setPeopleDelegue (cv) { // délégué de la partition
      if (cv) {
        const e = this.getElt(cv.id)
        this.setCV(cv)
        e.del = true
      }
    },

    setPeopleChat (chat, cv) { // naE: du people, idI: de l'avatar ayant un chat avec lui
      if (chat.stE === 2) {
        // naE disparu
        this.setDisparu(chat.naE)
      } else {
        const e = this.getElt(chat.naE, cv)
        e.chats.set(chat.id, [chat.ids, chat.idsE])  
      }
    },
    
    unsetPeopleChat (id, id2) {
      const e = this.map.get(id)
      if (!e) return
      e.chats.delete(id2)
      this.delElt(id, e)
    },

    del (id) {
      delete this.map[id]
    }
  }
})
