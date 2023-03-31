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
    
    /* Map de TOUS les groupes. 
      clé: id du groupe, 
      valeur: { groupe, membres, mbacs, secrets }
    */
    groupes: (state) => {
      return state.map
    },

    // Map des groupes RESTREINTE à ceux de l'avatar courant.
    groupesAC: (state) => {
      const m = new Map()
      const grIds = stores.avatar.getGrIds
      grIds.forEach(idg => {
        const e = state.map.get(id)
        if (e) m.set(id, e)
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
    getMembres: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.membres : null 
      }
    },
    /*
    // Array des membres avatars du compte
    getMembresAC: (state) => { return (id) => {
        const a = []
        const e = state.map.get(id)
        if (e.membres) e.membres.forEach((m, im) => { if (m.estAc) a.push(m) })
        return a
      }
    },
    */
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
      const f = stores.filtre.tri.groupes
      const ltF = state.ptLtF
      function f0 (a, b) { return a.na.nom < b.na.nom ? -1 : (a.na.nom > b.na.nom ? 1 : 0) }
      function comp (x, y) {
        const a = x.cpt
        const b = y.cpt
        switch (f.value) {
          case 0 : { return f0(x, y) }
          case 1 : { return a.a1 > b.a1 ? -1 : (a.a1 < b.a1 ? 1 : f0(x,y)) }
          case 2 : { return a.a2 > b.a2 ? -1 : (a.a2 < b.a2 ? 1 : f0(x,y)) }
          case 3 : { return a.q1 - a.a1 > b.q1 - b.a1 ? -1 : (a.q1 - a.a1 < b.q1 - b.a1 ? 1 : f0(x,y)) }
          case 4 : { return a.q2 - a.a2 > b.q2 - b.a2 ? -1 : (a.q2 - a.a2 < b.q2 - b.a2 ? 1 : f0(x,y)) }
          case 5 : { return a.q1 > b.q1 ? -1 : (a.q1 < b.q1 ? 1 : f0(x,y)) }
          case 6 : {  return a.q2 > b.q2 ? -1 : (a.q2 < b.q2 ? 1 : f0(x,y)) }
        }
      }
      if (!f) { stores.session.fmsg(ltF.length); return ltF }
      const x = []; ltF.forEach(t => { x.push(t) })
      x.sort(comp)
      stores.session.fmsg(x.length)
      return x
    },

    pgLgF: (state) => {
      const f = stores.filtre.filtre.groupes
      const stt = { v1: 0, v2: 0, q1: 0, q2: 0 }
      f.limj = f.nbj ? (new Date().getTime() - (f.nbj * 86400000)) : 0
      f.setp = f.mcp && f.mcp.length ? new Set(f.mcp) : new Set()
      f.setn = f.mcn && f.mcn.length ? new Set(f.mcn) : new Set()
      const r = []
      for (const t of state.pgLg) {
        stt.a1 += t.cpt.a1 || 0
        stt.a2 += t.cpt.a2 || 0
        stt.q1 += t.cpt.q1 || 0
        stt.q2 += t.cpt.q2 || 0
        if (f.avecbl && !t.blocage) continue
        if (f.nomt && !t.na.nom.startsWith(f.nomt)) continue
        if (f.txtt && (!t.info || t.info.indexOf(f.txtt) === -1)) continue
        if (f.txtn &&
          (!t.notifco || t.notifco.txt.indexOf(f.txtn) === -1) &&
          (!t.notifcp || t.notifcp.indexOf(f.txtn) === -1)) continue
        if (f.notif) {
          const x = t.cpt.nco || [0, 0]
          const y = t.cpt.nsp || [0, 0]
          if (f.notif === 1 && (x[0] + x[1] + y[0] + y[1] === 0)) continue
          if (f.notif === 2 && (x[1] + y[1] === 0)) continue
        }
        r.push(t)
      }
      stores.filtre.stats.groupes = stt
      return r
    },

    pgLg: (state) => {
      const f = stores.filtre.filtre.groupes
      return f.tous ? state.groupes : state.groupesAC
    },

  },

  actions: {
    /* Sert à pouvoir attacher un écouteur pour détecter les changements de mc */
    setMotscles (id, mc) {
    },
    
    setGroupe (groupe) {
      if (!groupe) return
      let e = this.map.get(groupe.id)
      if (!e) {
        e = { 
          groupe: groupe, 
          membres: new Map(), // tous membres
          mbacs: new Map(), // membres avatars du compte
          secrets: new Map()
        }
        this.map.set(groupe.id, e)
      } else {
        const mcav = new Uint8Array(encode(e.groupe.mc || {}))
        const mcap = new Uint8Array(encode(groupe.mc || {}))
        if (!egaliteU8(mcav, mcap )) this.setMotscles(groupe.id, mcap)
        e.groupe = groupe
      }
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
        } else {
          // ajoute ou remplace le people, met à jour sa cv le cas échéant
          pStore.setPeopleMembre(na, membre.id, membre.ids, membre.cv)
        }
      }
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
