import { defineStore } from 'pinia'

/* Store maître du compte courant :
Sous-collection pour chaque avatar id :
  - secrets : getSecrets(id)
  - chats : getChats(id)
  - sponsorings : getSponsorings(id)
voisins : map des voisins d'un secret
- clé: pk du secret de tête" du voisinage
- valeur: Set des pk des secrets référeçant cette tête de voisinage
*/

export const useAvatarStore = defineStore('avatar', {
  state: () => ({
    map: new Map(),
    voisins: new Map(),
    compteId: 0, // id de l'avatar principal du compte courant
    avatarP: null, // avatar principal du compte courant
    comptaP: null, // compta actuelle du compte courants
    tribuP: null // tribu actuelle du compte courants
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
    },

    // retourne le Set des pk des voisins du secret (id, ids)
    getVoisins: (state) => { return (id, ids) => {
        return state.voisins.get(id + '/' + ids) || new Set()
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
      if (avatar.id === this.compteId) this.avatarP = avatar
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

    /* Avatars référençant un groupe donné: liste de [avatar, ni]
    - si del, supprime les entrées
    - retourne mapIdNi : map ou null si aucun
      - clé : id d'un avatar
      - valeur : array des ni des groupes ciblés
    */
    avatarsDeGroupe (idg, del) {
      const mapIdNi = {}
      let x = false
      this.map.forEach(e => { 
        const a = e.avatar
        // supprime l'entrée ni dans ldg de l'avatar qui ne référence plus ce groupe
        const ni = a.niDeGroupe(idg, del)
        if (ni) {
          let y = mapIdNi[a.id]
          if (!y) { y = []; mapIdNi[a.id] = y }
          y.push(ni)
          x = true
        }
      })
      return x ? mapIdNi : null
    },

    /* Mise jour groupée pour un avatar
    e : { av: avatar, ch: [], sp: [], sc: [] }
    */
    lotMaj ({av, lch, lsp, lsc}) {
      const id = av.id
      this.setAvatar(av)
      lsc.forEach(s => { this.setSecret(s) })
      lsp.forEach(s => { this.setSponsoring(s) })
      lch.forEach(c => { this.setChat(c) })
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
