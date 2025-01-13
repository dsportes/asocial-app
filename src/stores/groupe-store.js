import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { ID } from '../app/api.mjs'


/* Store maître des groupes du compte courant :
- map : des groupes dont un des avatars du compte courant est membre
  Sous-collection pour chaque groupe id :
    groupe: l'objet Groupe
    chatgr: l'objet chatgr du groupe
    notes: Map des notes (clé:ids, valeur:v2)
    membres: new Map(), // tous membres
    estAnim: false, // un des avatars du compte est animateur du groupe
    estHeb: false // un des avatars du compte est hébergeur du groupe
- invits: table des invitations en attente. [{idg, ida, flags, invpar, msg}]
    - idg : du groupe
    - ida : de l'avatar invité
    - flags: d'invitation
    - invpar : set des ids des invitants,
    - msg : message d'invitation
*/

export const useGroupeStore = defineStore('groupe', {
  state: () => ({
    map: new Map(),
    invits: [] // [ {idg, ida, invpar (Set), msg} ]
  }),

  getters: {
    session: (state) => stores.session,
    ui: (state) => stores.ui,
    aSt: (state) => stores.avatar,
    nSt: (state) => stores.note,
    pSt: (state) => stores.people,
    filtre: (state) => stores.filtre,

    // groupe courant
    egrC (state) { return state.map.get(state.session.groupeId) },

    nbMbC (state) { const e = state.egrC
      return !e ? 0 : e.membres.size
    },

    // chat du groupe courant
    chatgr (state) {
      const id = stores.session.groupeId
      return state.map.get(id).chatgr
    },

    // Retourne [amb, ano] : les avatars du compte ont ou non accès aux membres / notes
    ambano (state) {
      return state.egrC ? state.session.compte.ambano(state.egrC.groupe) : [false, false]
    },

    // L'avatar ida est-il sélectionnable pour devenir contact du groupe courant ?
    diagContact: (state) => { return (ida) => { 
        if (ID.estGroupe(ida)) return [2, 0] // NON ida est un groupe, pas un avatar
        if (!state.egrC) return [3, 0] // NON il n'y a pas de groupe courant
        if (!state.ambano[0]) return [4, 0] // NON, le compte n'a pas d'avatars ayant accès aux membres
        const g = state.egrC.groupe
        const im = g.mmb.get(ida)
        if (im && g.st[im]) return [5, g.st[im]] // NON ida est déjà connu du groupe
        if (g.enLNG(ida)) return [6, 0] // NON est en liste noire "groupe" du groupe
        if (g.enLNC(ida)) return [7, 0] // NON est en liste noire "compte" du groupe
        return [0, 0] // OUI, ida PEUT être sélectionné pour devenir contact du groupe
      }
    },

    nom: (state) => { return (id) => {
        const cv = state.pSt.getCV(id)
        if (cv.v) return cv.nomC
        const compti = state.session.compti
        const e = compti.mc.get(this.ref[0])
        if (e) return titre(e.tx)
        return '#' + id
      }
    },

    amb: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? state.session.compte.ambano(e.groupe)[0] : false
      }
    },

    egr: (state) => { return (id) => { 
        return state.map.get(id)
      }
    },

    estAnim: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e && e.estAnim
      }
    },

    nbInvits: (state) => {
      return state.invits.length
    },
    
    /* liste des couples {id, nom} des groupes triés par ordre alphabétique de leur noms */
    ngGroupes: (state) => {
      const l = []
      state.map.forEach(e => { 
        const id = e.groupe.id
        l.push({id, nom: state.pSt.getCV(id).nom }) 
      })
      l.sort((a,b) => { return a.nomc < b.nomc ? -1 : (a.nomc === b.nomc ? 0 : 1)})
      return l
    },

    getMembre: (state) => { return (id, idaIm) => { 
        const e = state.map.get(id)
        if (!e) return null
        if (idaIm < 10000) return e.membres.get(idaIm) || null
        for (const m of e.membres) if (m.ida === idaIm) return m
        return null
      }
    },

    nbMesInvits: (state) => { return (e) => {
        let n = 0
        const g = e.groupe
        if (g) {
          const c = state.session.compte
          for(let im = 1; im < g.st.length; im++) {
            if (g.estInvite(im) && c.mav.has(g.tid[im])) n++
          }
        }    
        return n
      }
    },

    /* avatars du compte étant animateurs du groupe courant: { l, m }
    l : [{ label: nom, value: id}] 
    m: Map id, [{ label: nom, value: id}
    */
    avcAnims: (state) => {
      const l = [], m = new Map()
      const g = state.egrC.groupe
      if (g) {
        state.session.compte.mav.forEach(id => { 
          const im = g.mmb.get(id)
          if (g.estAnim(im)) {
            const e ={ label: state.session.getCV(id).nom, value: id }
            l.push(e)
            m.set(id, e)
          }
        })
      }
      return { l, m }
    },

    avcAnimsAM: (state) => {
      const g = state.egrC.groupe
      const s = new Set()
      if (g) {
        state.session.compte.mav.forEach(id => { 
          const im = g.mmb.get(id)
          if (g.estAnim(im)) s.add(im)
        })
      }
      return g && g.aUnAccesMembre(s)
    },


    /* Animateurs du groupe courant:
    - ayant invité ou voter pour inviter le membre courant 
    - n'ayant pas invité ou pas encore voté pour l'invitation
    */
    animInv: (state) => { return (im) => {
        const lc = new Map() // vote contre (pas voté)
        const lp = new Map() // vote pour
        if (!im) return [lc, lp]
        const g = state.egrC.groupe
        const invits = g.invits[im] || null
        const lix = invits ? (invits.li || []) : []
        for(let i = 1; i < g.st.length; i++) {
          if (g.estAnim(i)) {
            const cv = state.session.getCV(g.tid[i])
            if (lix.indexOf(i) === -1) lc.set(cv.id, cv); else lp.set(cv.id, cv)
          }
        }
        return [lp, lc]
      }
    },

    invitsAtt: (state) => { const l = []
      for (const x of state.invits) if (x.invpar.size) l.push(x)
      return l
    },

    contactsAtt: (state) => { const l = []
      for (const x of state.invits) if (!x.invpar.size) l.push(x)
      return l
    },

    nbchats: (state) => {
      let n = 0
      for (const [,elt] of state.map) if (elt.chatgr) n++
      return n
    }
  },

  actions: {
    setE (id) {
      let e = this.map.get(id)
      if (!e) {
        e = { 
          groupe: null, 
          chatgr: null,
          notes: new Map(),
          membres: new Map(), // tous membres
          estAnim: false, // un des avatars du compte est animateur du groupe
          estHeb: false // un des avatars du compte est hébergeur du groupe
        }
        this.map.set(id, e)
      }
      return e
    },

    setGroupe (groupe) {
      if (!groupe) return
      const e = this.setE(groupe.id)
      if (!e.groupe) e.groupe = groupe
      else if (groupe.v > e.groupe.v) e.groupe = groupe
      e.estAnim = false
      e.estHeb = false
      // Set des avatars participants au groupe
      const sav = stores.session.compte.mpg.get(groupe.id)
      sav.forEach(ida => {
        const im = groupe.mmb.get(ida)
        if (im === groupe.imh) e.estHeb = true
        if (groupe.estAnim(im)) e.estAnim = true
      })
      stores.note.setGroupe(groupe.id)
    },

    delGroupe (idg) {
      this.delMembre(idg) // tous
      this.delNote(idg) // toutes
      this.nSt.delGroupe(idg)
      this.map.delete(idg)
      if (this.session.groupeId === idg) this.session.setGroupeId(null)
    },

    setInvit (invit) { // invits:[ {idg, ida, invpar (Set), msg} ]
      this.invits = invit.invits
    },

    getInvit (idg, ida) {
      for (const inv of this.invits)
        if (inv.idg === idg && inv.ida === ida) return inv
      return null
    },

    setChatgr (chatgr) {
      if (!chatgr) return
      const e = this.setE(chatgr.id)
      if (!e.chatgr || e.chatgr.v < chatgr.v) e.chatgr = chatgr
    },

    getChatgr (idg) { return this.map.has(idg) ? this.map.get(idg).chatgr : null },

    setMembre (membre) {
      if (!membre) return
      const e = this.map.get(membre.id) // entrée du groupe
      if (!e) return
      const im = parseInt(membre.ids)
      if (membre._zombi) e.membres.delete(im)
      else e.membres.set(im, membre)
    },

    delMembre (id, ids) {
      const e = this.map.get(id)
      if (!e) return
      if (ids) e.membres.delete(ids)
      else e.membres.clear()
    },

    delMembres (idg) {
      this.delMembre(idg)
    },

    setNote (note) {
      if (!note) return
      const e = this.map.get(note.id)
      if (e) e.notes.set(note.ids, note.vf)
      const nSt = stores.note
      nSt.setNote(note)
    },

    delNote (id, ids) {
      const nSt = stores.note
      const e = this.map.get(id)
      if (!e) return
      if (ids) {
        if (e) e.notes.delete(ids)
        nSt.delNote(id, ids)
      } else {
        e.notes.forEach((n, ids) => {
          nSt.delNote(id, ids)
        })
        e.notes.clear()
      }
    },

    delNotes (idg, buf) {
      this.delNote(idg)
    },
  }
})
