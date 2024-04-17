import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { difference, intersection } from '../app/util.mjs'
import { ID, UNITEN, UNITEV } from '../app/api.mjs'
import { Motscles, RegCc, RegCles } from '../app/modele.mjs'
import { decrypterRSA } from '../app/webcrypto.mjs'

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

    // A REVISER
    motscles: null, // mots clés du compte
    avatarP: null, // avatar principal du compte courant
    comptaP: null, // compta actuelle du compte courant
    synthese: {atr: []}, // synthese de l'espace courant (comptable seulement)
 
    maptr: new Map(), // Map des tribus, uniquement pour le Comptable

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

    invits (state) {
      const m = new Map()
      state.map.forEach(e => {
        const a = e.avatar
        if (a) a.invits.forEach((inv, nx) => { m.set(nx, inv) })
      })
      return m
    },

    getElt: (state) => { return (id) => { return state.map.get(id) } },

    // Avatar courant
    avC (state) { 
      const e = state.map.get(state.session.avatarId)
      return e ? e.avatar : null 
    },

    // Element avatar courant
    eavC (state) { return state.map.get(state.session.avatarId) },

    /*************************************************** */

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

    chatDeAvec: (state) => { return (de, avec) => { 
      const e = state.map.get(de)
      if (e) for (const [ids, c] of e.chats) {
        if (c.idE === avec) return c
      }
      return null
    }},

    /* Construit une Map idx:{c, n} fusionnée depuis,
    celle de la configuration et celle du compte */
    mapMC (state) {
      const m = new Map()
      let mx = state.config.motsclesLOC
      for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
      mx = state.motscles || {}
      for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
      return m
    },

    /* Construit une Map idx:{c, n} fusionnée depuis,
    celle de la configuration, celle du compte et celle du groupe courant*/
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

    /* Construit une Map idx:{c, n} fusionnée depuis celle du compte */
    mapMCC (state) {
      const m = new Map()
      const mx = state.motscles || {}
      for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
      return m
    },

    /* Construit une Map idx:{c, n} fusionnée depuis celle du groupe courant*/
    mapMCG (state) {
      const m = new Map()
      if (state.session.groupeId) {
        const mx = state.gSt.egrC.groupe.mc || {}
        for (const i in mx) { m.set(i, Motscles.cn(mx[i])) }
      }
      return m
    },

    /* Array des tribus, pour le Comptable, 
     triée par ordre alphabétique de leur info, la Primitive en tête
    */ 
    getTribus: (state) => {
      const t = []
      state.compte.atr.forEach(x => { 
        if (x) t.push({id: x.id, info: x.info || ''})
      })
      const idp = state.session.tribuId
      t.sort((a,b) => { return (a.id === idp ? -1 : 
        (b.id === idp ? 1: (a.info < b.info ? -1 : (a.info === b.info ? 0 : 1))) )})
      const tr = []
      t.forEach(x => { tr.push(state.maptr.get(x.id))})
      return tr
    },

    avatars: (state) => {
      const m = new Map()
      state.map.forEach((av, id) => { m.set(id, av.avatar) })
      return m
    },

    /* liste des na des avatars triée par ordre alphabétique de leur noms */
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

    /* retourne [tribu, it, eltAct] du compte id 
    SI il est dans la tribu du compte ou la tribu courante.
    */
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

    getElt: (state) => { return (id) => { return state.map.get(id) } },

    estAvatar: (state) => { return (id) => { 
        return state.map.has(id)
      }
    },

    /* id d'un groupe ou avatar. Retourne [mcs, memos]
    - mcs : union des mots clés attribués par les avatars
    - memos : concaténation des textes des mémos attribués par les avatars
    */
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
    // retourne l'array des idE des chats de l'avatar id
    getChatIdEs: (state) => { return (id) => { 
        const a = []
        const e = state.map.get(id)
        if (e.chats) e.chats.forEach((chat, ids) => { 
          a.push(chat.naE.id) 
        })
        return a
      }
    },
    getChatIdIE: (state) => {  return (idI, idE) => { 
        const e = state.map.get(idI)
        if (e) for (const [ids, chat] of e.chats) { 
          if (chat.naE.id === idE) return chat
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
    // retourne le ticket ids de l'avatar id
    getTicket: (state) => { return (id, ids) => { 
      const e = state.map.get(id)
      return e ? e.tickets.get(ids) : null 
    }
    },
    // retourne l'array des tickets de l'avatar du compte
    getTickets: (state) => {
        const e = state.map.get(state.session.compteId)
        return e ? Array.from(e.tickets.values()) : []
    },

    // elt act dans tribu pour la tribu courante et le compte courant
    act: (state) => {
      const t = state.tribu
      return t ? t.act[state.compta.it] : { vide: true}
    },

    /** PanelPeople ****************************************************/
    // elt act dans tribu pour la tribu courante et le people courant
    actPeC: (state) => {
      const t = state.tribuC || state.tribu
      if (!t) return null
      const peId = state.session.peopleId
      for (const e of t.act) 
        if (e && e.id === peId) return e
    },

    // PageChats ******************************************
    nbchats: (state) => {
      let n = 0
      for (const [,elt] of state.map) if (elt.chats) n += elt.chats.size
      return n
    },

    tousChats: (state) => {
      const f = state.filtre.filtre.chats
      const flimj = f.nbj ? (Date.now() - (f.nbj * 86400000)) : 0
      const fsetp = f.mcp && f.mcp.length ? new Set(f.mcp) : new Set()
      const fsetn = f.mcn && f.mcn.length ? new Set(f.mcn) : new Set()
      const r = []
      for (const [,elt] of state.map) {
        if (!f.tous && state.session.avatarId !== elt.avatar.id) continue
        for (const [,c] of elt.chats) {
          if (f.rac) {
            if (f.rac === 1 && stI !== 1) continue
            if (f.rac === 2 && stI !== 0) continue
          }
          if (flimj && c.dh < flimj) continue
          if (f.nom && !c.naE.nom.startsWith(f.nom)) continue
          if (f.txt && (!c.txt || c.txt.indexOf(f.txt) === -1)) continue
          if (fsetp.size || fsetn.size) {
            const mcmemo = state.compte.mcmemo(c.naE.id)
            if (!mcmemo || !mcmemo.mc || !mcmemo.mc.length) continue
            const s = new Set(mcmemo.mc)
            if (fsetp.size && difference(fsetp, s).size) continue
            if (fsetn.size && intersection(fsetn, s).size) continue          
          }
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
      const c = this.session.compte
      if (avatar.id === this.session.compteId && !c.priv) {
        c.priv = RegCc.getPriv(avatar.id)
        setTimeout(async () => { 
          if (!c.clep && c.clePKX) {
            c.clep = RegCles.set(await decrypterRSA(c.priv, c.clePKX))
            delete c.clePX
          }
          if (c.notifX) {
            c.notif = await Notification.decrypt(c.notifX, c.clep)
            delete c.notifX
          }
          await this.session.setNotifP()
        }, 1)
      }
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
    
    delChat (id, id2) {
      const e = this.map.get(id)
      if (e) e.chats.delete(ids)
    }
  }
})

