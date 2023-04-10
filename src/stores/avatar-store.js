import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { hash, egaliteU8, difference, intersection } from '../app/util.mjs'
import { encode } from '@msgpack/msgpack'
import { E_WS, AppExc } from '../app/api.mjs'

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
    motscles: null, // mots clés du compte
    avatarP: null, // avatar principal du compte courant
    comptaP: null, // compta actuelle du compte courant
    tribu2P: null, // tribu2 actuelle du compte courant
    tribu2CP: null, // tribu2 "courante" pour le comptable
    maptr: new Map(), // Map des tribus, uniquement pour le Comptable

    // PanelPeople
    ppSelId: 0, // Tribu sélectionnée
    ppFiltre: '',

    // Dernier compteurs de compta chargé
    ccCpt: null,

    // stats tribus
    stt: { a1: 0, a2: 0, q1: 0, q2: 0 },
  }),

  getters: {
    /* retourne l'avatar principal du compte actuellement connecté */
    compte: (state) => { return state.avatarP },

    /* retourne la compta de l'avatar principal du compte actuellement connecté */
    compta: (state) => { return state.comptaP },

    /* retourne la tribu de l'avatar principal du compte actuellement connecté */
    tribu: (state) => { return state.maptr.get(stores.session.tribuId) },

    /* retourne la tribu2 de l'avatar principal du compte actuellement connecté */
    tribu2: (state) => { return state.tribu2P },

    /* retourne la tribu "courante" */
    tribuC: (state) => { return state.maptr.get(stores.session.tribuCId) },

    /* retourne la tribu2 "courante" */
    tribu2C: (state) => { return state.tribu2CP },
    
    // Avatar courant
    avC (state) { 
      const e = state.map.get(stores.session.avatarId)
      return e ? e.avatar : null 
    },

    // Map dont la clé est l'id de l'avatar et la valeur le document avatar
    avatars: (state) => {
      const m = new Map()
      state.map.forEach(e => { const a = e.avatar; m.set(a.id, a)})
      return m
    },

    /* Array des tribus, pour le Comptable, 
     triée par ordre alphabétique de leur nom, la Primitive en tête
    */
    getTribus: (state) => {
      const t = Array.from(state.maptr.values())
      const idp = stores.session.tribuId
      t.sort((a,b) => { return (a.id === idp ? -1 : 
        (b.id === idp ? 1: (a.na.nom < b.na.nom ? -1 : (a.na.nom === b.na.nom ? 0 : 1))) )})
      return t
    },

    // liste (array) des ids des avatars DU COMPTE enregistrés
    ids: (state) => { return Array.from(state.map.keys()) },

    getTribu: (state) => { return (id) => { 
        return state.maptr.get(id)
      }
    },

    nbTribus: (state) => {
      return state.maptr.size
    },

    getElt: (state) => { return (id) => { 
        return state.map.get(id)
      }
    },

    getAvatar: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.avatar : null 
      }
    },

    estAvatar: (state) => { return (id) => { 
        return state.map.has(id)
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
    },

    // Set des ids des groupes de l'avatar courant
    getGrIds: (state) => {
      const e = state.map.get(stores.session.avatarId)
      return e ? e.grIds : new Set()
    },

    /** PanelPeople ****************************************************/
    // elt mbtr dans tribu2 pour la tribu courante et le people courant
    mbPeC: (state) => {
      const t2 = state.tribu2CP
      const peId = stores.session.peopleId
      return t2 && peId ? t2.mbtr[peId] : null
    },

    ppTribus: (state) => {
      const y = []
      let q1 = 0, q2 = 0
      if (state.ccCpt) { q1 = state.ccCpt.q1; q2 = state.ccCpt.q2 }
      const l = state.getTribus
      const idt = stores.session.tribuCId
      l.forEach(x => { 
        if (x.id !== idt) {
          const t = x.cpt
          const ok = ((t.q1 - t.a1) >= q1) &&  ((t.q2 - t.a2) >= q2)
          y.push({ nom: x.naC.nom, id: x.id, q1: t.q1, q2: t.q2, r1: t.q1 - t.a1, r2: t.q2 - t.a1, ok   })
        }
      })
      return y
    },

    ppTribusF: (state) => {
      const t = []
      const f = state.ppFiltre
      state.ppTribus.forEach(x => { 
        if (x.nom.startsWith(f)) t.push(x)
      })
      if (t.length === 1) if (t[0].ok) state.ppSelId = t[0].id
      return t
    },

    ppSelTr: (state) => { return state.maptr.get(state.ppSelId) },

    // PageTribu ***************************************************    
    ptLcFT: (state) => {
      const f = stores.filtre.tri.tribu2
      const lcF = state.ptLcF
      function comp (a, b) {
        switch (f.value) {
          case 0 : { return a.nom < b.nom ? -1 : (a.nom > b.nom ? 1 : 0) }
          case 1 : { return a.q1 < b.q1 ? 1 : (a.q1 > b.q1 ? -1 : 0) }
          case 2 : { return a.q2 < b.q2 ? 1 : (a.q2 > b.q2 ? -1 : 0) }
        }
      }
      if (!f) { stores.session.fmsg(lcF.length); return lcF }
      const x = []; lcF.forEach(t => { x.push(t) })
      x.sort(comp)
      stores.session.fmsg(x.length)
      return x
    },

    ptLcF: (state) => {
      const f = stores.filtre.filtre.tribu2
      if (!f) { stores.session.fmsg(state.ptLc.length); return state.getTribus }
      const r = []
      for (const c of state.ptLc) {
        if (f.nomc && !c.na.nom.startsWith(f.nomc)) continue
        if (f.avecbl && !c.blocage) continue
        if (f.avecsp && !c.sp) continue
        if (f.notif) {
          const nt1 = !c.notifco && !c.notifsp
          const nt2 = !((c.notifco && c.notifco.g) || (c.notifsp && c.notifsp.g))
          if (f.notif === 1 && nt1) continue
          if (f.notif === 2 && nt2) continue
        }
        r.push(c)
      }
      stores.session.fmsg(r.length)
      return r
    },

    ptLc: (state) => {
      return Object.values(state.tribu2CP.mbtr)
    },

    // PageTribus ***************************************************    
    ptLtFT: (state) => {
      const f = stores.filtre.tri.tribus
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

    ptLtF: (state) => {
      const f = stores.filtre.filtre.tribus
      const stt = { a1: 0, a2: 0, q1: 0, q2: 0 }
      f.limj = f.nbj ? (new Date().getTime() - (f.nbj * 86400000)) : 0
      f.setp = f.mcp && f.mcp.length ? new Set(f.mcp) : new Set()
      f.setn = f.mcn && f.mcn.length ? new Set(f.mcn) : new Set()
      const r = []
      for (const t of state.getTribus) {
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
      stores.filtre.stats.tribus = stt
      return r
    },

    // PageChats ******************************************
    pcLc: (state) => { 
      return Array.from(state.map.get(stores.session.avatarId).chats.values())
    },

    pcLcF: (state) => {
      const f = stores.filtre.filtre.chats
      if (!f) { stores.session.fmsg(state.pcLc.length); return state.pcLc }
      f.limj = f.nbj ? (new Date().getTime() - (f.nbj * 86400000)) : 0
      f.setp = f.mcp && f.mcp.length ? new Set(f.mcp) : new Set()
      f.setn = f.mcn && f.mcn.length ? new Set(f.mcn) : new Set()
      const r = []
      for (const c of state.pcLc) {
        if (f.limj && c.dh < f.limj) break
        if (f.nom && !c.naE.nom.startsWith(f.nom)) continue
        if (f.txt && (!c.txt || c.txt.indexOf(f.txt) === -1)) continue
        if (f.setp.size || f.setn.size) {
          const s = c.mc && c.mc.length ? new Set(c.mc) : new Set()
          if (f.setp.size && difference(f.setp, s).size) continue
          if (f.setn.size && intersection(f.setn, s).size) continue          
        }        
        r.push(c)
      }
      r.sort((a, b) => { return a.dh > b.dh ? -1 : (a.dh === b.dh ? 0 : 1) })
      stores.session.fmsg(r.length)
      return r
    },

  },

  actions: {
    setCompte (avatar, compta, tribu, tribu2) { // avatar principal du compte connecté
      const session = stores.session
      this.avatarP = avatar
      session.setTribuId(tribu.id)
      session.setTribuCId(tribu.id)
      this.setTribu(tribu)
      this.setCompta(compta)
      this.setAvatar(avatar)
      this.setTribu2(tribu2)
    },

    /* Sert surtout à pouvoir attacher un écouteur pour détecter les changements de mc */
    setMotscles (mc) {
      this.motscles = mc
    },

    setCompta (compta) {
      const bl = this.comptaP && ((this.comptaP.dhvu || 0) !== (compta.dhvu || 0))
      this.comptaP = compta
      if (bl) stores.session.setBlocage()
    },

    /* set d'une tribu courante (pour le Comptable)
    ou par convention (sans paramètre) rend "courante" la tribu de la session
    */
    setTribuC (tribu, tribu2) { 
      const session = stores.session
      if (!tribu) {
        // Par convention, rend "courante" la tribu de la session
        this.tribu2CP = this.tribu2P
        session.setTribuCId(session.tribuId)
      } else {
        session.setTribuCId(tribu.id)
        this.setTribu(tribu)
        this.setTribu2(tribu2)
      }
    },

    setTribu (tribu) { // set / remplacement de la tribu SEULE de la session
      const session = stores.session
      this.maptr.set(tribu.id, tribu)
      if (session.tribuId === tribu.id && this.tribu2P && (this.tribu2P.id === tribu.id)) stores.session.setBlocage()
    },

    setTribu2 (tribu2) { // set ou remplacement de la tribu2 SEULE
      const session = stores.session
      this.tribu2CP = tribu2
      if (session.tribuId === tribu2.id) {
        // tribu (actuelle) du compte : gestion des people
        const peStore = stores.people
        if (this.tribu2P) { // remplacement - enlève des people
          for (const id in this.tribu2P.mbtr) {
            peStore.unsetPeopleTribu(parseInt(id))
          }
        }
        this.tribu2P = tribu2
        for (const id in tribu2.mbtr) {
          const ac = this.comptaP.estAc(parseInt(id))
          if (!ac) {
            const e = tribu2.mbtr[id]
            peStore.setPeopleTribu(e.na, e.cv, e.sp ? 2 : 1)
          }
        }
      }
      if (session.tribuId === tribu2.id && (this.tribu.id === tribu2.id)) stores.session.setBlocage()
    },

    delTribuC (id) { // delete d'une tribu quelconque pour le Comptable
       this.maptr.delete(id)
    },

    setAvatar (avatar) {
      if (!avatar) return
      let e = this.map.get(avatar.id)
      if (!e) {
        e = { 
          avatar: avatar, 
          secrets: new Map(),
          sponsorings: new Map(),
          chats: new Map(),
          grIds: new Set() // Ids des groupes dont l'avatar est membre
         }
        this.map.set(avatar.id, e)
        if (avatar.id % 10 === 0) this.setMotscles (avatar.mc)
      } else {
        if (avatar.id % 10 === 0) {
          const mcav = new Uint8Array(encode(e.avatar.mc || {}))
          const mcap = new Uint8Array(encode(avatar.mc || {}))
          if (!egaliteU8(mcav, mcap )) this.setMotscles(avatar.mc || {})
        }
        e.avatar = avatar
      }
      if (avatar.id === stores.session.compteId) this.avatarP = avatar
    },

    setAvatarGr (id, idg) {
      const e = this.map.get(id)
      if (e) e.grIds.add(idg)
    },

    delAvatarGr (id, idg) {
      const e = this.map.get(id)
      if (e) e.grIds.delete(idg)
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
      stores.people.setPeopleChat(chat, chat.cv)
    },
    
    delChat (id, id2) {
      const e = this.map.get(id)
      if (!e) return
      const ids = hash(id < id2 ? id + '/' + id2 : id2 + '/' + id)
      e.chats.delete(ids)
      stores.people.unsetPeopleChat(id, id2)
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

    /* Avatars référençant un des groupes du set donné
    - supprime les entrées correspondantes
    - retourne mapIdNi : Map
      - clé : id d'un avatar
      - valeur : array des ni des groupes ciblés
    */
    avatarsDeGroupes (setg) {
      const mapIdNi = []
      const x = false
      if (setg && setg.size) {
        this.map.forEach(e => { 
          const a = e.avatar
          // supprime les entrées des groupes dans l'avatar, retourne l'array de leur ni
          const ani = a.niDeGroupes(setg)
          ani.forEach(ni => {
            let y = mapIdNi[a.id]
            if (!y) { y = []; mapIdNi[a.id] = y }
            y.push(ni)
            x = true
          })
        })
      }
      return x ? mapIdNi : null
    },

    /* Mise jour groupée pour un avatar
    e : { av: avatar, lch: [], lsp: [], lsc: [] }
    */
    lotMaj ({av, lch, lsp, lsc}) {
      if (av) this.setAvatar(av)
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
    },

    async getPub (id) {
      try {
        const args = { token: stores.session.authToken, id }
        const ret = this.tr(await post(this, 'GetPub', args))
        return ret.pub
      } catch (e) {
        throw new AppExc(E_WS, 3)
      }
    }
  }
})

