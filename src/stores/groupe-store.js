import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { encode } from '@msgpack/msgpack'

/* Store maître des groupes du compte courant :
- groupes : les groupes dont un des avatars du compte courant est membre
Sous-collection pour chaque groupe id :
  - secrets : getSecrets(id)
  - membres : getMembres(id)
*/

export const useGroupeStore = defineStore('groupe', {
  state: () => ({
    map: new Map(),
    voisins: new Map()
  }),

  getters: {
    // Map dont la clé est l'id du groupe et la valeur le document groupe
    groupes: (state) => {
      const m = new Map()
      state.map.forEach(e => { const g = e.groupe; m.set(g.id, g)})
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
    getMembreIdEs: (state) => { return (id) => {
      const a = []
        const e = state.map.get(id)
        const compte = stores.avatar.compte
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
    }
  },

  actions: {
    /* Sert à pouvoir attacher un écouteur pour détecter les changements de mc */
    setMotscles (id, mc) {
    },
    
    setGroupe (groupe) {
      if (!groupe) return
      let e = this.map.get(groupe.id)
      if (!e) {
        e = { groupe: groupe, membres: new Map(), secrets: new Map() }
        this.map.set(groupe.id, e)
      } else {
        const mcav = new Uint8Array(encode(e.groupe.mc || {}))
        const mcap = new Uint8Array(encode(groupe.mc || {}))
        if (!egaliteU8(mcav, mcap )) this.setMotscles(groupe.id)
        e.groupe = groupe
      }
    },

    setMembre (membre) {
      if (!membre) return
      const e = this.map.get(membre.id)
      if (!e) return
      const compte = stores.avatar.compte
      const pStore = stores.people
      if (membre._zombi) {
        // membre disparu
        const m = e.membres.get(membre.ids)
        if (!m) return // membre déjà traité disparu
        e.membres.delete(membre.ids)
        const na = m.na
        if (compte.estAc(na.id)) return
        pStore.unsetPeopleMembre(na.id, membre.id)
      } else {
        e.membres.set(membre.ids, membre)
        const na = membre.na
        if (compte.estAc(na.id)) return // c'est un des avatars du compte, pas concerné par people
        // ajoute ou remplace le people, met à jour sa cv le cas échéant
        pStore.setPeopleMembre(na, membre.id, membre.ids, membre.cv) 
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
