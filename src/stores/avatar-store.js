import { defineStore } from 'pinia'

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
    // retourne le tdv ids de l'avatar id
    getRdv: (state) => { return (id, ids) => { 
      const e = state.map.get(id)
      return e ? e.rdvs.get(ids) : null 
    }
    },
    // retourne la Map des chats (clé ids) de l'avatar id
    getRdvs: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.rdvs : null 
      }
    }
  },

  actions: {
    setAvatar (avatar) {
      if (!avatar) return
      let e = this.map.get(avatar.id)
      if (!e) {
        e = { 
          avatar: avatar, 
          secrets: new Map(),
          rdvs: new Map(),
          chats: new Map
         }
        this.map.set(avatar.id, e)
      } else e.avatar = avatar
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

    setRdv (rdv) {
      if (!rdv) return
      const e = this.map.get(rdv.id)
      if (!e) return
      e.rdvs.set(rdv.ids, rdv)
    },
    delRdv (id, ids) {
      const e = this.map.get(id)
      if (!e) return
      e.rdvs.delete(ids)
    },


    del (id) {
      delete map[id]
    }
  }
})
