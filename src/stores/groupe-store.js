import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { UNITEN, UNITEV, MAXTAILLEGROUPE, ID } from '../app/api.mjs'


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
        if (im) return [5, g.st[im]] // NON ida est déjà connu du groupe
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

    /* avatars du compte étant animateurs du groupe courant: [{ label: nom, value: id}] */
    avcAnims: (state) => {
      const l = []
      const g = state.egrC.groupe
      state.session.compte.mav.forEach(id => { 
        if (g.estAnim(g.mmb.get(id)))
          l.push({ label: state.session.getCV(id).nom, value: id }) 
      })
      return l
    },

    /* Animateurs du groupe courant:
    - ayant invité ou voter pour inviter le membre courant 
    - n'ayant pas invité ou pas encore voté pour l'invitation
    */
    animInv: (state) => { return (im) => {
        const lc = new Map() // vote contre (pas voté)
        const lp = new Map() // vote pour
        const g = state.egrC.groupe
        if (!im) return [lc, lp]
        const invits = g.invits[im] || { fl, li }
        if (!invits.li) return [lp, lc]
        for(let i = 1; i < g.st.length; i++) {
          if (g.estAnim(i)) {
            const cv = state.session.getCV(g.tid[i])
            if (invits.li.indexOf(i) === -1) lc.set(cv.id, cv); else lp.set(cv.id, cv)
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

    // PageGroupes ***************************************************
    pgLgFT: (state) => {
      const ci = state.session.compti
      const f = stores.filtre.filtre.groupes
      const fsetp = f.mcp && f.mcp.size ? f.mcp : null
      const fsetn = f.mcn && f.mcn.size ? f.mcn : null
      const stt = { nn: 0, vf: 0, qn: 0, qv: 0 }
      const r = []
      for (const [, e] of state.pgLg) {
        const g = e.groupe
        if (e.estHeb) {
          stt.nn += g.nn || 0
          stt.vf += g.vf || 0
          stt.qn += g.qn || 0
          stt.qv += g.qv || 0
        }
        const cv = state.session.getCV(g.id)
        e.nom = cv.nom
        if (f.ngr && !cv.nom.startsWith(f.ngr)) continue
        if (f.sansheb && g.dfh === 0) continue
        if (f.excedent && ((g.qn * UNITEN) > g.nn) && ((g.qv * UNITEV) > q.vf )) continue
        const mc = ci.mc.get(g.id)
        if (f.infmb && (!mc.tx || mc.tx.indexOf(f.infmb)) === -1) continue
        if (fsetp && !ci.aHT(g.id, fsetp)) continue
        if (fsetn && ci.aHT(g.id, fsetn)) continue
        if (f.invits && g.nbInvits === 0) continue
        r.push(e)
      }
      r.sort((a,b) => { return a.nom < b.nom ? -1 : (a.nom > b.nom ? 1 : 0)})
      state.ui.fmsg(r.length)
      return [r, stt]
    },

    pgLg: (state) => {
      const f = state.filtre.filtre.groupes
      if (f.tous) return state.map
      const s = state.session.compte.idGroupes(state.session.avatarId)
      const m = new Map()
      s.forEach(idg => {
        const e = state.map.get(idg)
        m.set(idg, e)
      })
      return m
    },

    /* PageGroupe - membres people **************************************************/
    pgLmFT: (state) => {
      const f = state.filtre.filtre.groupe
      const c = state.session.compte
      const r = []
      let n = 0
      const g = state.egrC.groupe
      for (let im = 1; im < g.st.length; im++) {
        const stm = g.st[im]
        if (!stm) continue
        const idm = g.tid[im]
        if (!idm) continue
        if (c.mav.has(idm)) continue
        n++
        const nom = state.session.getCV(idm).nomC
        if (f.nmb && !nom.startsWith(f.nmb)) continue
        if (f.stmb && stm + 1 !== f.stmb) continue
        if (f.ambno) {
          const mb = g.accesMembre(im)
          const no = g.accesNote(im)
          if (f.ambno === 1 && !(mb && !no)) continue
          if (f.ambno === 2 && !(no && !mb)) continue
          if (f.ambno === 3 && !(mb && no)) continue
          if (f.ambno === 4 && !(!mb && !no)) continue
          if (f.ambno === 5 && g.accesEcrNote(im) !== 1) continue
        } 
        r.push({ id: idm, im, nom })
      }
      r.sort((a, b) => { return a.nom < b.nom ? -1 : (a.nom > b.nom ? 1 : 0) })
      stores.ui.fmsg(r.length)
      return [r, n]
    },

    nbchats: (state) => {
      let n = 0
      for (const [,elt] of state.map) if (elt.chatgr) n++
      return n
    },

    tousChats: (state) => {
      const f = stores.filtre.filtre.chats
      const ci = state.session.compti
      const r = []
      if (!f.tous) return r
      const flimj = f.nbj ? (Date.now() - (f.nbj * 86400000)) : 0
      const fsetp = f.mcp && f.mcp.size ? f.mcp : null
      const fsetn = f.mcn && f.mcn.size ? f.mcn : null
      for (const [,elt] of state.map) {
        const c = elt.chatgr
        const cv = state.session.getCV(c.idE)
        if (c) {
          if (f.rac === 2) continue
          if (flimj && c.dh < flimj) continue
          if (f.nom && !cv.nom.startsWith(f.nom)) continue
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
