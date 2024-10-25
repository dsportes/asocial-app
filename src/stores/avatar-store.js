import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { ID } from '../app/api.mjs'

const fx = [['id', 1],
['q1', 1], ['q1', -1],
['q2', 1], ['q2', -1],
['pcv1', 1], ['pcv1', -1],
['pcv2', 1], ['pcv2', -1]
]

export const useAvatarStore = defineStore('avatar', {
  state: () => ({
    /* Map des avatars du compte courant. Sous-collection pour chaque avatar id :
      - avatar: avatar,
      - sponsorings: new Map(), // clé: ids, valeur : sponsoring
      - chats: new Map(), // clé: ids, valeur : chat
      - tickets: new Map(), // clé: ids, valeur : ticket
      - notes: new Map() // clé: ids, valeur: vf
    */
    map: new Map(),

    // Filtre des tribus dans BarrePeople
    ppFiltre: '',
    ppSelId: 0,
    
    // Dernier compteurs de compta chargé (enrichi de clet(ou null), id, it, na(ou null))
    ccCpt: { id: 0 }
  }),

  getters: {
    session (state) { return stores.session },
    config (state) { return stores.config },
    gSt (state) { return stores.groupe },
    ui (state) { return stores.ui },
    filtre (state) { return stores.filtre },
    pSt (state) { return stores.people },
    nSt (state) { return stores.note },

    getAvatar: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.avatarId : null 
      }
    },

    getChat: (state) => { return (id, ids) => { 
        const e = state.map.get(id)
        return e ? e.chats.get(ids) : null 
      }
    },

    // chats des avatars du compte avec idE
    // si n'en a pas, e.cr est true si on peut en créer un (idE est people ou comptable)
    chatsDuCompte: (state) => { return (idE) => {
        const l = []
        const lav = state.session.compte.lstAvatars
        for(let i = 0; i < lav.length; i++) {
          const e = { ...lav[i] } // { id, cv, nom }
          e.ch = state.chatDeAvec(e.id, idE)
          if (!e.ch && (state.pSt.estPeople(idE) || ID.estComptable(idE))) e.cr = true
          if (e.ch || e.cr) l.push(e)
        }
        return l
      }
    },

    getElt: (state) => { return (id) => { return state.map.get(id) } },

    // Avatar courant
    avC (state) { 
      const e = state.map.get(state.session.avatarId)
      return e ? e.avatar : null 
    },

    // Element avatar courant
    eavC (state) { 
      const x = state.session.avatarId
      return state.map.get(x)
    },

    chatDeAvec: (state) => { return (de, avec) => { 
      const e = state.map.get(de)
      if (e) for (const [ids, c] of e.chats) {
        if (c.idE === avec) return c
      }
      return null
    }},

    chatsAvec: (state) => { return (avec) => {
      const l = []
      for (const [id, e] of state.map) {
        for (const [ids, c] of e.chats) {
          if (c.idE === avec) l.push(c)
        }
      }
      return l
    }},

    // liste des couples {id, nom} des avatars triés par ordre alphabétique de leur noms
    naAvatars: (state) => {
      const l = []
      state.map.forEach(e => { 
        const id = e.avatar.id
        l.push({ id, nom: state.pSt.getCV(id).nom})
      })
      l.sort((a,b) => { return a.nom < b.nom ? -1 : (a.nom === b.nom ? 0 : 1)})
      return l
    },

    getElt: (state) => { return (id) => { return state.map.get(id) } },

    estAvatar: (state) => { return (id) => { 
        return state.map.has(id)
      }
    },

    // retourne le chat ids de l'avatar id
    getChat: (state) => { return (id, ids) => { 
      const e = state.map.get(id)
      return e ? e.chats.get(ids) : null 
    }
    },

    getChatIdIE: (state) => {  return (idI, idE) => { 
        const e = state.map.get(idI)
        if (e) for (const [ids, chat] of e.chats) { 
          if (chat.idE === idE) return chat
        }
        return null
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

    // retourne l'array des tickets de l'avatar du compte
    getTickets: (state) => {
        const e = state.map.get(state.session.compteId)
        return e ? Array.from(e.tickets.values()) : []
    },

    // PageChats ******************************************
    nbchats: (state) => {
      let n = 0
      for (const [,elt] of state.map) if (elt.chats) n += elt.chats.size
      return n
    },

    tousChats: (state) => {
      const f = state.filtre.filtre.chats
      const ci = state.session.compti
      const flimj = f.nbj ? (Date.now() - (f.nbj * 86400000)) : 0
      const fsetp = f.mcp && f.mcp.size ? f.mcp : null
      const fsetn = f.mcn && f.mcn.size ? f.mcn : null
      const r = []
      for (const [,elt] of state.map) {
        if (!f.tous && state.session.avatarId !== elt.avatar.id) continue
        for (const [,c] of elt.chats) {
          if (f.rac === 0 && c.stI !== 1) continue
          if (f.rac === 1 && c.stI !== 0) continue
          if (flimj && c.dh < flimj) continue
          if (f.nom) {
            const cv = state.session.getCV(c.idE)
            if (!cv.nom.startsWith(f.nom)) continue
          }
          if (f.txt && (!c.txt || c.txt.indexOf(f.txt) === -1)) continue
          if (fsetp && !ci.aHT(c.idE, fsetp)) continue
          if (fsetn && ci.aHT(c.idE, fsetn)) continue
          r.push(c)
        }
      }
      return r
    }
  },

  actions: {
    setAvatar (avatar) {
      let e = this.map.get(avatar.id)
      if (!e) { e = { 
          avatar: avatar,
          notes: new Map(),
          sponsorings: new Map(),
          chats: new Map(),
          tickets: new Map()
       }
       this.map.set(avatar.id, e)
      }
      e.avatar = avatar
      this.nSt.setAvatar(avatar.id)
    },

    delAvatar (id) {
      this.nSt.delAvatar(id)
      this.map.delete(id)
    },

    setSponsoring (sponsoring) {
      const e = this.map.get(sponsoring.id)
      if (e) e.sponsorings.set(sponsoring.ids, sponsoring)
    },

    delSponsoring (id, ids) {
      const e = this.map.get(id)
      if (e) e.sponsorings.delete(ids)
    },

    setTicket (ticket) {
      const e = this.map.get(ticket.id)
      if (e) e.tickets.set(ticket.ids, ticket)
    },

    delTicket (id, ids) {
      const e = this.map.get(id)
      if (e) e.tickets.delete(ids)
    },

    setNote (note) {
      const e = this.map.get(note.id)
      if (e) e.notes.set(note.ids, note.vf)
    },

    delNote (id, ids) {
      const e = this.map.get(id)
      if (e) e.notes.delete(ids)
    },

    setChat (chat) {
      const e = this.map.get(chat.id)
      if (e) e.chats.set(chat.ids, chat)
    },
    
    delChat (id, ids) {
      const e = this.map.get(id)
      if (e) e.chats.delete(ids)
    }
  }
})

