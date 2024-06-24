import { defineStore } from 'pinia'
import stores from './stores.mjs'

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

    chatsDuCompte: (state) => { return (idE, chex) => { // chex: true - Seulement ceux ayant un chat
        const l = []
        const lav = state.session.compte.lstAvatars
        for(let i = 0; i < lav.length; i++) {
          const e = { ...lav[i] }
          e.ch = state.chatDeAvec(e.id, idE)
          if (!chex || e.ch) l.push(e)
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

    /*************************************************** */

    /*
    qv: (state) => {
      const qv = { nc: 0, nn: 0, v2: 0 }
      state.map.forEach((av, id) => {
        av.notes.forEach((n, ids) => { qv.nn++; qv.v2 += n.v2})
        av.chats.forEach((c, ids) => { if (c.r > 0) qv.nc++ })
      })
      return qv
    },

    exV1: (state) => {
      const c = state.compta.qv
      return c.nn + c.nc + c.ng > c.q1 * UNITEN
    },

    exV2: (state) => {
      const c = state.compta.qv
      return c.v2 > c.q2 * UNITEV
    },

    occV2: (state) => {
      const c = state.compta.qv
      return (c.q2 * UNITEV) - c.v2
    },
    */

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

    /* Construit une Map idx:{c, n} fusionnée depuis,
    celle de la configuration et celle du compte 
    mapMC (state) {
      const m = new Map()
      let mx = state.config.motsclesLOC
      for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
      mx = state.motscles || {}
      for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
      return m
    },
    */

    /* Construit une Map idx:{c, n} fusionnée depuis,
    celle de la configuration, celle du compte et celle du groupe courant
    mapMCGr (state) {
      const m = new Map()
      let mx = state.config.motsclesLOC
      for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
      mx = state.motscles || {}
      for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
      if (state.session.groupeId) {
        mx = state.gSt.egrC.groupe.motscles || {}
        for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
      }
      return m
    },
    */

    /* Construit une Map idx:{c, n} fusionnée depuis celle du compte
    mapMCC (state) {
      const m = new Map()
      const mx = state.motscles || {}
      for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
      return m
    },
    */

    /* Construit une Map idx:{c, n} fusionnée depuis celle du groupe courant
    mapMCG (state) {
      const m = new Map()
      if (state.session.groupeId) {
        const mx = state.gSt.egrC.groupe.mc || {}
        for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
      }
      return m
    },
    */

    /*
    avatars: (state) => {
      const m = new Map()
      state.map.forEach((av, id) => { m.set(id, av.avatar) })
      return m
    },

    // liste des na des avatars triée par ordre alphabétique de leur noms
    naAvatars: (state) => {
      const l = []
      state.map.forEach(e => { l.push(e.avatar.na) })
      l.sort((a,b) => { return a.nom < b.nom ? -1 : (a.nom === b.nom ? 0 : 1)})
      return l
    },

    // liste (array) des ids des avatars DU COMPTE enregistrés
    ids: (state) => { return Array.from(state.map.keys()) },

    getTribu: (state) => { return (id) => { 
        return state.maptr.get(id)
      }
    },

    // retourne [tribu, it, eltAct] du compte id 
    // SI il est dans la tribu du compte ou la tribu courante.
    getTribuDeCompte: (state) => { return (id) => { 
        if (state.tribu) for (let it = 1; it < state.tribu.act.length; it++) {
          const e = state.tribu.act[it]
          if (e && !e.vide && e.id === id) { return [state.tribu, it, e] }
        }
        if (state.tribuC) for (let it = 1; it < state.tribu.act.length; it++) {
          const e = state.tribuC.act[it]
          if (e && !e.vide && e.id === id) { return [state.tribuC, it, e] }
        }
        return [null, 0, null]
      }
    },

    nbTribus: (state) => {
      return state.maptr.size
    },
    */

    getElt: (state) => { return (id) => { return state.map.get(id) } },

    estAvatar: (state) => { return (id) => { 
        return state.map.has(id)
      }
    },

    /* id d'un groupe ou avatar. Retourne [mcs, memos]
    - mcs : union des mots clés attribués par les avatars
    - memos : concaténation des textes des mémos attribués par les avatars
    
    mcmemosDeId: (state) => { return (id) => { 
        let mcs = new Set()
        const memos = []
        state.map.forEach(e => {
          const {mc, memo} = e.avatar.mcmemosDeId(id)
          if (mc) mc.forEach(i => {mcs.add(i)})
          if (memo) memos.push(memo)
        })
        return [new Uint8Array.from(mcs), memos.join('\n\n')]
      }
    },
    */

    // retourne le chat ids de l'avatar id
    getChat: (state) => { return (id, ids) => { 
      const e = state.map.get(id)
      return e ? e.chats.get(ids) : null 
    }
    },

    /* retourne l'array des idE des chats de l'avatar id
    getChatIdEs: (state) => { return (id) => { 
        const a = []
        const e = state.map.get(id)
        if (e.chats) e.chats.forEach((chat, ids) => { 
          a.push(chat.naE.id) 
        })
        return a
      }
    },
    */

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

    /* retourne le ticket ids de l'avatar id
    getTicket: (state) => { return (id, ids) => { 
      const e = state.map.get(id)
      return e ? e.tickets.get(ids) : null 
    }
    },
    */

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
      this.ui.setZombiChat(id, ids)
    }
  }
})

