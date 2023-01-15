import { defineStore } from 'pinia'

/* Store maître du compte courant :
- compte : avatar principal du compte courant
- compta : compta du compte courant
- tribu : tribu actuelle du compte courants
- avatars : les avatars du compte courant
  Sous-collection pour chaque avatar id :
  - secrets : getSecrets(id)
  - chats : getChats(id)
  - sponsorings : getSponsorings(id)
*/

export const useAvatarStore = defineStore('avatar', {
  state: () => ({
    map: new Map(),
    compteId: 0,
    avatarP: null,
    comptaP: null,
    tribuP: null
  }),

  getters: {
    /* retourne l'avatar principal du compte actuellement connecté */
    compte: (state) => { return state.avatarP },

    /* retourne la compta de l'avatar principal du compte actuellement connecté */
    compta: (state) => { return state.comptaP },

    /* retourne la tribu de l'avatar principal du compte actuellement connecté */
    tribu: (state) => { return state.tribuP },

    // Map dont la clé est l'id de l'avatar et la valeur le document avatar
    avatars: (state) => {
      const m = new Map()
      state.map.forEach(e => { const a = e.avatar; m.set(a.id, a)})
      return m
    },

    // liste (array) des ids des avatars DU COMPTE enregistrés
    ids: (state) => { return Array.from(state.map.keys()) },

    getAvatar: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.avatar : null 
      }
    },

    // retourne le secret ns de l'avatar id
    getSecret: (state) => { return (id, ids) => { 
        const e = state.map.get(id)
        return e ? e.secrets.get(ids) : null 
      }
    },
    // retourne la Map des secrets (clé ns) de l'avatar id
    getSecrets: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.secrets : null 
      }
    },
    // retourne le chat ids de l'avatar id
    getChat: (state) => { return (id, ids) => { 
      const e = state.map.get(id)
      return e ? e.chats.get(ids) : null 
    }
    },
    // retourne la Map des chats (clé ids) de l'avatar id
    getChats: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.chats : null 
      }
    },
    // retourne le sponsoring d'id ids de l'avatar id
    getSponsoring: (state) => { return (id, ids) => { 
      const e = state.map.get(id)
      return e ? e.sponsorings.get(ids) : null 
    }
    },
    // retourne la Map des sponsorings (clé ids) de l'avatar id
    getSponsorings: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.sponsorings : null 
      }
    }
  },

  actions: {
    setCompte (avatar, compta, tribu) { // avatar principal du compte connecté
      if (!avatar) { this.compteId = 0; this.compte = null; return }
      this.compteId = avatar.id
      this.avatarP = avatar
      this.setTribu(tribu)
      this.setCompta(compta)
      this.setAvatar(avatar)
    },

    setCompta (compta) {
      this.comptaP = compta
    },

    setTribu (tribu) { // set ou remplacement de la tribu
      const peStore = stores.people
      if (this.tribuP) { // remplacement - enlève des people
        for (const idsp in this.tribuP.mncpt) peStore.unsetPeopleSponsor(parseInt(idsp))
      }
      this.tribuP = tribu
      const t = tribu.mncpt
      for (const idsp in t) {
        if (!this.avatarP.estAc(idsp)) {
          const e = t[idsp]
          peStore.setPeopleSponsor(e.na, e.cv)
        }
      }
    },

    setAvatar (avatar) {
      if (!avatar) return
      let e = this.map.get(avatar.id)
      if (!e) {
        e = { 
          avatar: avatar, 
          secrets: new Map(),
          sponsorings: new Map(),
          chats: new Map
         }
        this.map.set(avatar.id, e)
      } else e.avatar = avatar
      if (avatar.id === this.compteId) this.avaataP = avatar
    },

    setSecret (secret) {
      if (!secret) return
      const e = this.map.get(secret.id)
      if (!e) return
      e.secrets.set(secret.ids, secret)
    },
    delSecret (id, ids) {
      const e = this.map.get(id)
      if (!e) return
      e.secrets.delete(ids)
    },

    setChat (chat) {
      if (!chat) return
      const e = this.map.get(chat.id)
      if (!e) return
      e.chats.set(chat.ids, chat)
    },
    delChat (id, ids) {
      const e = this.map.get(id)
      if (!e) return
      e.chats.delete(ids)
    },

    setSponsoring (sponsoring) {
      if (!sponsoring) return
      const e = this.map.get(sponsoring.id)
      if (!e) return
      e.sponsorings.set(sponsoring.ids, sponsoring)
    },
    delSponsoring (id, ids) {
      const e = this.map.get(id)
      if (!e) return
      e.sponsorings.delete(ids)
    },


    del (id) {
      delete map[id]
    }
  }
})
