import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { hash, egaliteU8 } from '../app/util.mjs'
import { encode } from '@msgpack/msgpack'

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
    tribuP: null, // tribu actuelle du compte courant
    tribu2P: null, // tribu2 actuelle du compte courant
    tribu2CP: null, // tribu2 "courante" pour le comptable
    maptr: new Map() // Map des tribus, uniquement pour le Comptable
  }),

  getters: {
    /* retourne l'avatar principal du compte actuellement connecté */
    compte: (state) => { return state.avatarP },

    /* retourne la compta de l'avatar principal du compte actuellement connecté */
    compta: (state) => { return state.comptaP },

    /* retourne la tribu de l'avatar principal du compte actuellement connecté */
    tribu: (state) => { return state.tribuP },

    /* retourne la tribu de l'avatar principal du compte actuellement connecté */
    tribu2: (state) => { return state.tribu2P },

    /* retourne la tribu de l'avatar principal du compte actuellement connecté */
    tribu2C: (state) => { return state.tribu2CP },

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
      const idp = state.tribuP.id
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
    setCompte (avatar, compta, tribu, tribu2) { // avatar principal du compte connecté
      this.avatarP = avatar
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

    setTribu (tribu) { // set ou remplacement de la tribu
      this.tribuP = tribu
      if (this.tribu2P) stores.session.setBlocage()
    },

    setTribu2 (tribu2) { // set ou remplacement de la tribu
      const session = stores.session
      if (session.tribuCid === tribu2.id) {
        // tribu "courante" affichée pour le comptable
        this.tribu2CP = tribu2
      }
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
        session.setBlocage()
      }
    },

    setTribuCourante (t2) {
      this.tribu2CP = t2
    },

    setTribuC (tribu) { // set d'une tribu quelconque pour le Comptable
      if (tribu.id === this.tribuP.id) this.setTribu(tribu)
      this.maptr.set(tribu.id, tribu)
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
          chats: new Map()
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
    }
  }
})
