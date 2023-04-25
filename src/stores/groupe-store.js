import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { encode } from '@msgpack/msgpack'
import { egaliteU8 } from '../app/util.mjs'
// import { ID } from '../app/api.mjs'

/* Store maître des groupes du compte courant :
- map : des groupes dont un des avatars du compte courant est membre
  Sous-collection pour chaque groupe id :
    groupe: l'objet Groupe
    membres: new Map(), // tous membres
    mbacs: new Map(), // membres avatars du compte
    secrets: new Map(),
    estAnim: false, // un des avatars du compte est animateur du groupe
    estHeb: false // un des avatars du compte est hébergeur du groupe
- invits: pour chaque avatar, le Set des ids des groupes dont il est invité en attente
*/

export const useGroupeStore = defineStore('groupe', {
  state: () => ({
    map: new Map(),
    voisins: new Map(),
    invits: new Map()
  }),

  getters: {
    // groupe courant
    egrC (state) { 
      return state.map.get(stores.session.groupeId)
    },
    
    /* Map de TOUS les groupes. 
      clé: id du groupe, 
      valeur: { groupe, membres, mbacs, secrets }
    groupes: (state) => {
      const m = new Map()
      state.map.forEach(e => { const g = e.groupe; m.set(g.id, g)})
      return m
    },
    */

    // Map des groupes RESTREINTE à ceux de l'avatar courant.
    groupesAC: (state) => {
      const aSt = stores.avatar
      const m = new Map()
      const grIds = aSt.getGrIds
      grIds.forEach(idg => {
        const e = state.map.get(idg)
        if (e) m.set(idg, e)
      })
      return m
    },
    
    // liste (array) des ids des groupes
    // ids: (state) => { return Array.from(state.map.keys()) },

    getGroupe: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.groupe : null 
      }
    },
    getMembre: (state) => { return (id, im) => { 
        const e = state.map.get(id)
        return e ? e.membres.get(im) : null 
      }
    },
    membreC: (state) => {
      const session = stores.session
      const e = state.map.get(session.groupeId)
      return e ? e.membres.get(session.membreId) : null 
    },

    getMbac: (state) => { return (idg, im) => { 
        const e = state.map.get(idg)
        return e ? e.mbac.get(im) : null 
      }
    },
    getMembres: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.membres : null 
      }
    },
    // Array des Ids des membres "people" du groupe id
    getMembreIdEs: (state) => { return (id) => {
        const a = []
        const e = state.map.get(id)
        if (e.membres) e.membres.forEach((m, im) => { if (!m.estAc) a.push(m.na.id) })
        return a 
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
    },
    // retourne le Set des pk des voisins du secret (id, ids)
    getVoisins: (state) => { return (id, ids) => {
        return state.voisins.get(id + '/' + ids) || new Set()
      }
    },

    membreDeId: (state) => { return (e, id) => {
        for (const [,m] of e.membres) { if (m.na.id === id) return m }
        return null
      }
    },

    animIds: (state) => { return (e) => {
        const s = new Set()
        for (const [,m] of e.membres) { if (e.groupe.ast[m.ids] === 32) s.add(m.na.id) }
        return s
      }
    },

    // PageGroupes ***************************************************
    pgLgFT: (state) => {
      function f0 (x, y) {
        const a = x.groupe, b = y.groupe
        return a.na.nom < b.na.nom ? -1 : (a.na.nom > b.na.nom ? 1 : 0) 
      }
      const f = stores.filtre.filtre.groupes
      const stt = { v1: 0, v2: 0, q1: 0, q2: 0 }
      const r = []
      for (const [, e] of state.pgLg) {
        const v = e.objv.vols
        stt.v1 += v.v1 || 0
        stt.v2 += v.v2 || 0
        stt.q1 += v.q1 || 0
        stt.q2 += v.q2 || 0
        // TODO filtre des groupes
        r.push(e)
      }
      stores.filtre.stats.groupes = stt
      r.sort(f0)
      return r
    },

    pgLg: (state) => {
      const f = stores.filtre.filtre.groupes
      return f.tous ? state.map : state.groupesAC
    },

    // PageGroupe - membres people ***************************************************
    pgLmFT: (state) => {
      function f0 (a, b) { return a.na.nom < b.na.nom ? -1 : (a.na.nom > b.na.nom ? 1 : 0) }
      const f = stores.filtre.filtre.groupe
      const r = []
      for (const e of state.pgLm) {
        // TODO filtre des membres
        r.push(t)
      }
      r.sort(f0)
      return r
    },

    pgLm (state) {
      const t = []
      const e = state.map.get(stores.session.groupeId)
      if (e) e.membres.forEach(m => { if (!m.estAc) t.push(e) })
      return t
    },

  },

  actions: {
    test1 (e) {
      e.groupe.msu = new Uint8Array([1])
    },
    /* Sert à pouvoir attacher un écouteur pour détecter les changements de mc */
    setMotscles (id, mc) {
    },

    setInvit (idg, ida) { // id du groupe et de l'avatar invité
      const e = this.invits.get(ida)
      if (!e) { e = new Set(); this.invits.set(ida, e)}
      e.add(idg)
    },

    delInvit (idg, ida) { // id du groupe et de l'avatar invité
      const e = this.invits.get(ida)
      if (!e) return
      e.delete(idg)
    },

    setAnimHeb (e) {
      const g = e.groupe
      g.estAnim = false
      for (const [, m] of e.mbacs) {
        if (g.ast[m.ids] === 32) e.estAnim = true
        if (m.ids === g.imh) e.estHeb = true
      }
    },
    
    setGroupe (groupe) {
      if (!groupe) return
      let e = this.map.get(groupe.id)
      if (!e) {
        e = { 
          groupe: groupe, 
          membres: new Map(), // tous membres
          mbacs: new Map(), // membres avatars du compte
          secrets: new Map(),
          estAnim: false, // un des avatars du compte est animateur du groupe
          estHeb: false, // un des avatars du compte est hébergeur du groupe
          objv: { v: 0, vols: {v1: 0, v2: 0, q1: 0, q2: 0} } //  { v, vols: {v1, v2, q1, q2} }
        }
        this.map.set(groupe.id, e)
      } else {
        if (groupe.v > e.groupe.v) {
          const mcav = new Uint8Array(encode(e.groupe.mc || {}))
          const mcap = new Uint8Array(encode(groupe.mc || {}))
          if (!egaliteU8(mcav, mcap )) this.setMotscles(groupe.id, mcap)
          e.groupe = groupe
        }
      }
      this.setAnimHeb(e)
    },

    setVols (id, objv) {
      const e = this.map.get(id)
      if (e && objv.v > e.objv.v) e.objv = objv
    },

    setMembre (membre) {
      const aSt = stores.avatar
      if (!membre) return
      const e = this.map.get(membre.id)
      if (!e) return
      const pSt = stores.people
      if (membre._zombi) {
        // membre disparu : c'est sync qui a détecté que le membre n'existait plus
        const m = e.membres.get(membre.ids)
        if (!m) return // membre déjà traité disparu
        e.membres.delete(membre.ids)
        const na = m.na
        if (m.estAc) return
        pSt.unsetPeopleMembre(na.id, membre.id)
      } else {
        e.membres.set(membre.ids, membre)
        const na = membre.na
        if (membre.estAc) {
          // un des avatars du compte: enreg dans son avatar
          aSt.setAvatarGr(na.id, membre.id)
          e.mbacs.set(membre.ids, membre)
        } else {
          // ajoute ou remplace le people, met à jour sa cv le cas échéant
          pSt.setPeopleMembre(na, membre.id, membre.ids, membre.cv)
        }
      }
      this.setAnimHeb(e)
    },

    delMembre (id, ids) {
      const pSt = stores.people
      const aSt = stores.avatar
      const e = this.map.get(id)
      if (!e) return
      const m = e.membres.get(ids)
      if (!m) return
      const idp = m.na.id
      if (m.estAc) {
        aSt.delAvatarGr(idp, id)
        delete m.mbacs(ids)
      } else {
        pSt.unsetPeopleMembre(idp, id)
      }
      delete m.membres(ids)
    },

    setSecret (secret) {
      if (!secret) return
      const e = this.map.get(secret.id)
      if (!e) return
      e.secrets.set(secret.ids, secret)
      const ref = secret.refs
      if (ref) {
        const pk = ref[0] + '/' + ref[1]
        let v = this.voisins.get(pk)
        if (!v) { v = new Set(); this.voisins.set(pk, v) }
        v.add(secret.pk)
      }
      // TODO : gérer les ajouts / suppressions de fichiers ayant une copie locale
    },

    delSecret (id, ids) {
      const e = this.map.get(id)
      if (!e) return
      const secret = e.secrets.get(ids)
      if (secret) {
        e.secrets.delete(ids)
        const ref = secret.refs
        if (ref) {
          const pk = ref[0] + '/' + ref[1]
          let v = this.voisins.get(pk)
          if (v) v.delete(secret.pk)
          if (!v.size) this.voisins.delete(pk)
        }
      }
    },

    /* Mise jour groupée pour un groupe
    e : { gr, lmb: [], lsc: [] }
    */
    lotMaj ({id, gr, lmb, lsc, objv}) {
      if (gr) this.setGroupe(gr)
      if (objv) this.setVols (id, objv)
      lsc.forEach(s => { this.setSecret(s) })
      lmb.forEach(m => { this.setMembre(m) })
    },

    del (id) {
      const e = this.map[id]
      if (e) {
        e._zombi = true
        delete this.map[id]
      }
    }
  }
})
