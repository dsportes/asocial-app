import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { UNITEN, UNITEV, FLAGS, ID } from '../app/api.mjs'


/* Store maître des groupes du compte courant :
- map : des groupes dont un des avatars du compte courant est membre
  Sous-collection pour chaque groupe id :
    groupe: l'objet Groupe
    chatgr: l'objet chatgr du groupe
    notes: Map des notes (clé:ids, valeur:v2)
    membres: new Map(), // tous membres
    estAnim: false, // un des avatars du compte est animateur du groupe
    estHeb: false // un des avatars du compte est hébergeur du groupe
- invits: map des invitations en attente.
  - clé : id du groupe + '/' + id de l'avatar invité
  - valeur: {idg, ida, idi, txt}
    - idg : du groupe
    - ida : de l'avatar invité
    - idi : id de l'invitant,
    - txt : message d'invitation
*/

export const useGroupeStore = defineStore('groupe', {
  state: () => ({
    map: new Map(),
    invits: new Map()
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
        if (ID.estGroupe(ida)) return 2 // NON ida est un groupe, pas un avatar
        if (!state.egrC) return 3 // NON il n'y a pas de groupe courant
        if (!state.ambano[0]) return 4 // NON, le compte n'a pas d'avatars ayant accès aux membres
        const g = state.egrC.groupe
        const im = g.mmb.get(ida)
        if (im) return 5 // NON ida est déjà actif du groupe
        if (g.enLNG(ida)) return 6 // NON est en liste noire "groupe" du groupe
        if (g.enLNC(ida)) return 7 // NON est en liste noire "compte" du groupe
        return 0 // OUI, ida PEUT être sélectionné pour devenir contact du groupe
      }
    },

    // 

    amb: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? state.session.compte.ambano(e.groupe)[0] : false
      }
    },

    egr: (state) => { return (id) => { 
        return state.map.get(id)
      }
    },

    getqv: (state) => {
      const qv = { ng: 0, nn: 0, v2: 0 }
      state.map.forEach((gr, id) => {
        qv.ng++
        if (gr.groupe.hebC)
          gr.notes.forEach((n, ids) => { qv.nn++; qv.v2 += n.v2})
      })
      return qv
    },

    nbInvits: (state) => {
      let n = 0
      state.invits.forEach(s => { n += s.size })
      return n
    },
    
    /* liste des ng des groupes triée par ordre alphabétique de leur noms */
    ngGroupes: (state) => {
      const l = []
      state.map.forEach(e => { l.push(e.groupe.na) })
      l.sort((a,b) => { return a.nomc < b.nomc ? -1 : (a.nomc === b.nomc ? 0 : 1)})
      return l
    },
    
    // liste (array) des ids des groupes
    // ids: (state) => { return Array.from(state.map.keys()) },

    getGroupe: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.groupe : null 
      }
    },
    getMembre: (state) => { return (id, idaIm) => { 
        const e = state.map.get(id)
        if (!e) return null
        if (idaIm < 10000) return e.membres.get(idaIm) || null
        for (const m of e.membres) if (m.ida === idaIm) return m
        return null
      }
    },

    membreC: (state) => {
      return state.getMembre(state.session.groupeId, state.session.membreId)
    },

    getMembres: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? e.membres : null 
      }
    },

    // Array des Ids des membres "people" du groupe id
    getMembreIdEs: (state) => { return (id) => {
        const a = []
        const e = state.map.get(id)
        if (e.membres) e.membres.forEach((m, im) => { if (!m.estAc) a.push(m.na.id) })
        return a 
      }
    },

    membreDeId: (state) => { return (e, id) => {
        for (const [,m] of e.membres) { if (m.na.id === id) return m }
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

    // retourne le membre de l'avatar courant dans le groupe courant
    membreAcGc: (state) => {
      const session = stores.session
      for (const [,m] of state.egrC.membres) { if (m.na.id === session.avatarId) return m }
      return null
    },

    // nombre d'invités et d'animateurs dans le groupe courant
    nbAnims: (state) => {
      let na = 0
      state.egrC.groupe.ast.forEach(st => { if (st === 32) na++ })
      return na
    },

    animIds: (state) => { return (e) => {
        const s = new Set()
        for (const [,m] of e.membres) { if (e.groupe.estAnim(m.ids)) s.add(m.na.id) }
        return s
      }
    },

    actifIds: (state) => { return (e) => {
        const s = new Set()
        for (const [,m] of e.membres) { if (e.groupe.estActif(m.ids)) s.add(m.na.id) }
        return s
      }
    },

    /* Animateurs du groupe courant ayant voté 
    - pour inviter le membre courant 
    - contre (en fait pas encore voté)
    */
    animInv: (state) => { return (im) => {
        const lc = [] // vote contre (pas voté)
        const lp = [] // vote pour
        const g = state.egrC.groupe
        if (!im) return [lc, lp]
        const invits = g.invits[im] || { fl, li }
        if (!invits.li) return [lc, la]
        for(let i = 1; i < g.st.length; i++) {
          if (g.estAnim(i)) {
            const cv = state.session.getCV(g.tid[i])
            if (invits.li.indexOf(i) === -1) lc.push(cv); else lp.push(cv)
          }
        }
        return [lp, lc]
      }
    },

    /* Retour true si un des avatars du compte a l'exclusivité */
    excluEstAvc: (state) => { return (id) => {
        const e = state.map.get(id)
        if (!e) return false
        for (const [ids, m] of e.membres) if (m.estAc) return true
        return false
      }
    },

    /* Retour true si un des avatars du compte peut éditer (auteur / animateur) */
    avcAA: (state) => { return (id) => {
        const e = state.map.get(id)
        if (!e) return false
        const ast = e.groupe.ast
        for (const [ids, m] of e.membres) 
          if (m.estAc && ast[ids] >= 31 && ast[ids] <= 32) return true
        return false
      }
    },
  
    /* Map par im des { na, st } des avc membres du groupe 
    imNaStAvc: (state) => { return (id) => {
        const r = new Map()
        const e = state.map.get(id)
        const ast = e.groupe.ast
        if (e.membres) e.membres.forEach((m) => { 
          if (m.estAc) r.set(m.ids, { na: m.na, st: ast[m.ids]})
        })
        return r
      }
    },
    */

  
    /* Map par im des { na, st, avc } des membres du groupe, avc ou auteur-animateur */
    imNaStMb: (state) => { return (id) => {
        const r = new Map()
        const e = state.map.get(id)
        const ast = e.groupe.ast
        if (e.membres) e.membres.forEach((m) => { 
          const st = ast[m.ids]
          if (m.estAc) {
            r.set(m.ids, { na: m.na, st, avc:true})
          } else {
            if (st >= 31 && st <= 32) r.set(m.ids, { na: m.na, st, avc:false})
          }
        })
        return r
      }
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
      this.map.delete(idg)
    },

    getInvit (idg, ida) { // na du groupe et de l'avatar invité
      return this.invits.get(idg + '/' + ida)
    },

    setInvit (inv) { // inv: {idg, ida, idi, txt}
      const e = this.setE(inv.idg)
      this.invits.set(inv.idg + '/' + inv.ida, inv)
    },

    delInvit (idg, ida) { // inv: {idg, ida, idi, txt}
      this.invits.delete(idg + '/' + ida)
    },

    setChatgr (chatgr) {
      if (!chatgr) return
      const e = this.setE(chatgr.id)
      if (!e.chatgr || e.chatgr.v < chatgr.v) e.chatgr = chatgr
    },

    getChatgr (idg) { return this.map.has(idg) ? this.map.get(idg).chatgr : null },

    setMembre (membre) {
      if (!membre) return
      const estAvc = this.session.compte.mav.has(membre.ida)
      const e = this.map.get(membre.id) // entrée du groupe
      if (!e) return
      if (membre._zombi) e.membres.delete(membre.ids)
      else e.membres.set(membre.ids, membre)
    },

    delMembre (id, ids) {
      const e = this.map.get(id)
      if (!e) return
      if (ids) delete m.membres(ids)
      else e.membres.clear()
    },

    delMembres (idg) {
      thgis.delMembre(idg)
    },

    setNote (note) {
    },

    delNote (id, ids) {
    },

    delNotes (idg) {
      this.delNote(idg)
    },




    /* Note Exclu : liste des {im, na} des membres aptes à recevoir l'exclusivité
    - pour les avatars du compte, le na est pris dans le compte
    - pour les autres,, pris dans membres, S'IL Y EN A UN
    */
    nexLm (idg) {
      const t = []
      const e = this.egr(idg)
      const g = e.groupe
      const aSt = stores.avatar
      const mavc = aSt.compte.imNaGroupe(idg)
      for(let im = 1; im < g.flags.length; im++) {
        if (g.estAuteur(im)) {
          let na = mavc.get(im) 
          let avc = na ? true : false
          if (!na) {
            const x = e.membres.get(im)
            if (x) na = x.na}
          if (na) t.push({im, na, avc})
        }
      }
      return t
    },

    setNote (note) {
      if (!note) return
      const e = this.map.get(note.id)
      if (e) e.notes.set(note.ids, note.v2)
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
    }
  }
})
