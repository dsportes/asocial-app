import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { encode } from '@msgpack/msgpack'

/* Store maître des groupes du compte courant :
- groupes : les groupes dont un des avatars du compte courant est membre
Sous-collection pour chaque groupe id :
  - secrets : getSecrets(id) - Map de clé ids -> objet secret
  - membres : getMembres(id) - Map de clé ids -> objet membre
*/

export const useGroupeStore = defineStore('groupe', {
  state: () => ({
    map: new Map(),
    voisins: new Map(),
  }),

  getters: {
    // groupe courant
    grC (state) { 
      const e = state.map.get(stores.session.groupeId)
      return e ? e.groupe : null 
    },
    eg (state) { 
      return state.map.get(stores.session.groupeId)
    },

    egrC (state) { 
      return state.map.get(stores.session.groupeId)
    },
    
    /* Map de TOUS les groupes. 
      clé: id du groupe, 
      valeur: { groupe, membres, mbacs, secrets }
    */
    groupes: (state) => {
      const m = new Map()
      state.map.forEach(e => { const g = e.groupe; m.set(g.id, g)})
      return m
    },

    // Map des groupes RESTREINTE à ceux de l'avatar courant.
    groupesAC: (state) => {
      const m = new Map()
      const grIds = stores.avatar.getGrIds
      grIds.forEach(idg => {
        const e = state.map.get(idg)
        if (e) m.set(idg, e)
      })
      return m
    },
    
    // liste (array) des ids des groupes
    ids: (state) => { return Array.from(state.map.keys()) },

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
        const g = e.groupe
        stt.a1 += g.vols.v1 || 0
        stt.a2 += g.vols.v2 || 0
        stt.q1 += g.vols.q1 || 0
        stt.q2 += g.vols.q2 || 0
        // TODO
        r.push(e)
      }
      stores.filtre.stats.groupes = stt
      r.sort(f0)
      return r
    },

    pgLg: (state) => {
      const f = stores.filtre.filtre.groupes
      return f.tous ? state.groupes : state.groupesAC
    },

    // PageGroupe - membres people ***************************************************
    pgLmFT: (state) => {
      function f0 (a, b) { return a.na.nom < b.na.nom ? -1 : (a.na.nom > b.na.nom ? 1 : 0) }
      const f = stores.filtre.filtre.groupe
      const r = []
      for (const e of state.pgLm) {
        // TODO
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
    /* Sert à pouvoir attacher un écouteur pour détecter les changements de mc */
    setMotscles (id, mc) {
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
          estHeb: false // un des avatars du compte est hébergeur du groupe
        }
        this.map.set(groupe.id, e)
      } else {
        const mcav = new Uint8Array(encode(e.groupe.mc || {}))
        const mcap = new Uint8Array(encode(groupe.mc || {}))
        if (!egaliteU8(mcav, mcap )) this.setMotscles(groupe.id, mcap)
        e.groupe = groupe
      }
      this.setAnimHeb(e)
    },

    setMembre (membre) {
      if (!membre) return
      const e = this.map.get(membre.id)
      if (!e) return
      const pStore = stores.people
      if (membre._zombi) {
        // membre disparu : c'est sync qui a détecté que le membre n'existait plus
        const m = e.membres.get(membre.ids)
        if (!m) return // membre déjà traité disparu
        e.membres.delete(membre.ids)
        const na = m.na
        if (m.estAc) return
        pStore.unsetPeopleMembre(na.id, membre.id)
      } else {
        e.membres.set(membre.ids, membre)
        const na = membre.na
        if (membre.estAc) {
          // un des avatars du compte: enreg dans son avatar
          stores.avatar.setAvatarGr(na.id, membre.id)
          e.mbacs.set(membre.ids, membre)
        } else {
          // ajoute ou remplace le people, met à jour sa cv le cas échéant
          pStore.setPeopleMembre(na, membre.id, membre.ids, membre.cv)
        }
      }
      this.setAnimHeb(e)
    },

    delMembre (id, ids) {
      const e = this.map.get(id)
      if (!e) return
      const m = e.membres.get(ids)
      if (!m) return
      const idp = m.na.id
      if (m.estAc) {
        stores.avatar.delAvatarGr(idp, id)
        delete m.mbacs(ids)
      } else {
        stores.people.unsetPeopleMembre(idp, id)
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
    lotMaj ({gr, lmb, lsc}) {
      if (gr) this.setGroupe(gr)
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
