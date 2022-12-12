import { defineStore } from 'pinia'
import { egalite } from '../app/util.mjs'

export const useAvatarStore = defineStore('avatar', {
  state: () => ({
    map: new Map()
  }),

  getters: {
    // retourne la liste des ids des avatars DU COMPTE enregistrés
    getIds: (state) => { return Array.from(state.map.keys()) },

    getAvatar: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.avatar : null 
      }
    },
    getCv: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.cv : null 
      }
    },
    getCompta: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.compta : null 
      }
    },
    // retourne le secret ns de l'avatar id
    getSecret: (state) => { return (id, ns) => { 
        const e = state.map.get(id)
        return e ? e.secrets.get(ns) : null 
      }
    },
    // retourne la Map des secrets (clé ns) de l'avatar id
    getSecrets: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.secrets : null 
      }
    }
  },

  actions: {
    setAvatar (avatar) {
      if (!avatar) return
      let e = this.map.get(avatar.id)
      if (!e) {
        e = { avatar: avatar, cv: null, grIds: new Set(), cpIds: new Set(), secrets: new Map() }
        this.map.set(avatar.id, e)
      } else e.avatar = avatar
      const sg = avatar.groupeIds()
      if (!egalite(sg, e.grIds)) this.setGrIds(e, sg)
      const cp = avatar.coupleIds()
      if (!egalite(cp, e.grIds)) this.setCpIds(e, cp)
    },

    /* Ces fonctions permettent de détecter plus facilement les changments 
    de liste des groupes / couples sur les $onAction */
    setGrIds (e, sg) {
      e.grIds = sg
    },
    setCpIds (e, cp) {
      e.cpIds = cp
    },

    setSecret (secret) {
      if (!secret) return
      const e = this.map.get(secret.id)
      if (!e) return
      e.secrets.set(secret.ns, secret)
    },
    delSecret (id, ns) {
      const e = this.map.get(id)
      if (!e) return
      e.secrets.delete(ns)
    },

    setCv (cv) {
      if (!cv) return
      const e = this.map.get(cv.id)
      if (!e) return
      e.cv = cv
    },

    delCv (id) {
      if (!id) return
      const e = this.map.get(id)
      if (!e) return
      e.cv = null
    },

    setCompta (compta) {
      if (!compta) return
      const e = this.map.get(compta.id)
      if (!e) return
      e.compta = compta
    },

    del (id) {
      delete map[id]
    }
  }
})
