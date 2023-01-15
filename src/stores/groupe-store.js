import { defineStore } from 'pinia'
import stores from './stores.mjs'

/* Store maître des groupes du compte courant :
- groupes : les groupes dont un des avatars du compte courant est membre
Sous-collection pour chaque groupe id :
  - secrets : getSecrets(id)
  - membres : getMembres(id)
*/

export const useGroupeStore = defineStore('groupe', {
  state: () => ({
    map: new Map()
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
    getSecret: (state) => { return (id, ns) => { 
        const e = state.map.get(id)
        return e ? e.secrets.get(ns) : null 
      }
    },
    getSecrets: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.secrets : null 
      }
    }
  },

  actions: {
    setGroupe (groupe) {
      if (!groupe) return
      let e = this.map.get(groupe.id)
      if (!e) {
        e = { groupe: groupe, membres: new Map(), secrets: new Map() }
        this.map.set(groupe.id, e)
      } else e.groupe = groupe
    },

    setMembre (membre) {
      if (!membre) return
      const e = this.map.get(membre.id)
      if (!e) return
      e.membres.set(membre.ids, membre)
      const na = membre.namb
      const compte = stores.avatar.compte
      if (compte.estAc(na.id)) return // c'est un des avatars du compte, pas concerné par people
      // ajoute ou remplace le people, met à jour sa cv le cas échéant
      stores.people.setPeopleMembre(na, membre.id, membre.ids, membre.cv) 
    },

    setSecret (secret) {
      if (!secret) return
      const e = this.map.get(secret.id)
      if (!e) return
      e.secrets.set(secret.ids, secret)
      // TODO : gérer les ajouts / suppressions de fichiers ayant une copie locale
    },

    delSecret (id, ids) {
      const e = this.map.get(id)
      if (!e) return
      e.secrets.delete(ids)
    },

    del (id) {
      delete map[id]
    }
  }
})
