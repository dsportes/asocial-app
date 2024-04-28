import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { ID } from '../app/api.mjs'
import { CV, NomGenerique } from '../app/modele.mjs'
import { difference, intersection } from '../app/util.mjs'

/* 
Un people est un avatar (pas du compte):
- soit membre d'un groupe auquel le compte accède,
- soit interlocuteur d'un chat avec un avatar du compte.
Map:
- clé: id de l'avatar
- valeur: { sgr, sch }
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
    getCV: (state) => { return (id) => { return state.cvs.get(ID.long(id, state.ns)) || CV.fake(id)} },

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

    // entrée du people courant
    peC: (state) => { 
      const id = stores.session.peopleId
      return state.map.get(id)
    },

    // Array des ids des people
    peopleIds: (state) => { return Array.from(state.map.keys()) },

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

    // Retourne l'Array des documents 'groupe' auquel ce people participe
    getGroupes: (state) => { return (id) => { 
        const e = state.map.get(id)
        if (!e) return null
        const gSt = stores.groupe
        const a = []
        if (e.groupes && e.groupes.size)
          e.groupes.forEach(idg => { a.push(gSt.getGroupe(idg)) })
        return a
      }
    },

    // Retourne l'Array de TOUS les documents membre pour 
    // TOUS les groupes auquel ce people id participe
    getMembres: (state) => { return (id) => { 
        const e = state.map.get(id)
        if (!e || !e.groupes) return null
        const gSt = stores.groupe
        const a = []
        e.groupes.forEach((im, idg) => { a.push(gSt.getMembre(idg, im)) })
        return a
      }
    },

    // Retourne LE document membre de ce people id dans LE groupe idg
    getMembre: (state) => { return (id, idg) => { 
        const gSt = stores.groupe
        const e = state.map.get(id)
        if (!e || !e.groupes) return null
        const im = e.groupes.get(idg)
        return im ? gSt.getMembre(idg, im) : null
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
    },

    // PagePeople ********************************************
    peLpF: (state) => {
      const ci = state.session.compti
      const part = state.session.partition
      const f = stores.filtre.filtre.people
      const fsetp = f.mcp && f.mcp.size ? f.mcp : null
      const fsetn = f.mcn && f.mcn.size ? f.mcn : null
      const r = []
      for (const [id, p] of state.map) {
        const cv = state.getCV(id)
        if (f.nom && !cv.nom.startsWith(f.nom)) continue
        if (f.rolepart && part) {
          if (!part.estCpt(id)) continue
          if (f.rolepart === 2 && !part.estDel(id)) continue
        } 
        if (f.avecgr && (!p.sgr.size)) continue
        if (fsetp && !ci.aHT(id, fsetp)) continue
        if (fsetn && ci.aHT(id, fsetn)) continue
        r.push({ id, cv, nom: cv.nom, sgr: p.sgr, sch: p.sch })
      }
      r.sort((a, b) => { 
        return (ID.estComptable(a.id) || a.nom < b.nom) ? -1 : (a.nom > b.nom ? 1 : 0)
      })
      stores.ui.fmsg(r.length)
      return r
    }

  },
  
  actions: {
    setCV (cv) {
      const id = ID.long(cv.id, this.ns)
      const x = this.cvs.get(id)
      if (!x || x.v < cv.v) this.cvs.set(id, cv)
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
      const e = this.getElt(idp)
      e.sgr.add(idg)
    },

    delPGr (idp, idg) {
      const e = this.map.get(idp); if (!e) return
      e.sgr.delete(idg)
      this.delElt(idp, e)
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

    // retourne { na, cv, sp, chats: Set(), groupes: Map(idg, im)}
    getPeople (id) {
      const e = this.map.get(id)
      if (!e) {
        if (ID.estComptable(id)) {
          const p = { na: NomGenerique.comptable(), chats: new Map(), groupes: new Map() }
          this.map.set(id, p)
          return p
        }
        return null
      }
      return e
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
  
    setPeopleTribu (na) { // Sponsor de la tribu
      const e = this.getElt(na)
      e.sp = 1
    },

    unsetPeopleTribu (id) { // sponsor devenu simple compte
      const e = this.map.get(id)
      if (!e) return
      e.sp = 0
      this.delElt(id, e)
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

    setCv (na, cv) { // cv: { v, photo, info }
      this.getElt(na, cv)
    },

    del (id) {
      delete this.map[id]
    }
  }
})
