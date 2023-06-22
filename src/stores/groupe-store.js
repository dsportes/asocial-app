import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { encode } from '@msgpack/msgpack'
import { egaliteU8, difference, intersection } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'

/* Store maître des groupes du compte courant :
- map : des groupes dont un des avatars du compte courant est membre
  Sous-collection pour chaque groupe id :
    groupe: l'objet Groupe
    membres: new Map(), // tous membres
    mbacs: new Map(), // membres avatars du compte
    estAnim: false, // un des avatars du compte est animateur du groupe
    estHeb: false // un des avatars du compte est hébergeur du groupe
    objv: { v: 0, vols: {v1: 0, v2: 0, q1: 0, q2: 0} }
- invits: pour chaque avatar, le Set des ids des groupes dont il est invité en attente
*/

export const useGroupeStore = defineStore('groupe', {
  state: () => ({
    map: new Map(),
    invits: new Map()
  }),

  getters: {
    // groupe courant
    egrC (state) { 
      return state.map.get(stores.session.groupeId)
    },

    egr: (state) => { return (id) => { 
        return state.map.get(id)
      }
    },

    nbInvits: (state) => {
      let n = 0
      state.invits.forEach(s => { n += s.size })
      return n
    },

    // Map des groupes RESTREINTE à ceux de l'avatar courant.
    groupesAC: (state) => {
      const aSt = stores.avatar
      const m = new Map()
      const grIds = aSt.getGrIds
      grIds.forEach(idg => {
        const e = state.map.get(idg)
        if (e) m.set(idg, e)
      })
      return m
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
    getMembre: (state) => { return (id, im) => { 
        const e = state.map.get(id)
        return e ? e.membres.get(im) : null 
      }
    },
    membreC: (state) => {
      const session = stores.session
      const e = state.map.get(session.groupeId)
      return e ? e.membres.get(session.membreId) : null 
    },

    getMbac: (state) => { return (idg, im) => { 
        const e = state.map.get(idg)
        return e ? e.mbac.get(im) : null 
      }
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
        e.groupe.ast.forEach((st, i) => {
          if (st >= 60 && st <= 72) {
            if (e.membres.get(i).estAc) n++
          }
        })
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
        for (const [,m] of e.membres) { if (e.groupe.ast[m.ids] === 32) s.add(m.na.id) }
        return s
      }
    },

    /* NA des animateurs du groupe courant ayant voté pour inviter le membre courant */
    animInv: (state) => {
      const lc = []
      const la = []
      const session = stores.session
      const e = state.map.get(session.groupeId)
      if (!e) return
      const m = e.membres.get(session.membreId)
      const g = e.groupe
      if (!m) return
      const inv = m.inv || []
      for(let im = 1; im < g.ast.length; im++) {
        if (g.ast[im] !== 32) continue
        const a = e.membres.get(im)
        if (inv.indexOf(im) === -1) la.push(a.na); else lc.push(a.na)
      }
      return [lc, la]
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
  
    /* Map par im des { na, st } des avc membres du groupe */
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

    /* Return le na du membre im du groupe id */
    imNa: (state) => { return (id, im) => {
        const e = state.map.get(id)
        const mb = e.membres.get(im)
        return mb ? m.na : null
      }
    },
  
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
      function f0 (x, y) {
        const a = x.groupe, b = y.groupe
        return a.na.nom < b.na.nom ? -1 : (a.na.nom > b.na.nom ? 1 : 0) 
      }
      const f = stores.filtre.filtre.groupes
      f.setp = f.mcp && f.mcp.length ? new Set(f.mcp) : new Set()
      f.setn = f.mcn && f.mcn.length ? new Set(f.mcn) : new Set()
      const stt = { v1: 0, v2: 0, q1: 0, q2: 0 }
      const r = []
      for (const [, e] of state.pgLg) {
        const v = e.objv.vols
        stt.v1 += v.v1 || 0
        stt.v2 += v.v2 || 0
        stt.q1 += v.q1 || 0
        stt.q2 += v.q2 || 0
        const g = e.groupe
        if (f.ngr && !g.na.nom.startsWith(f.ngr)) continue
        if (f.sansheb && g.dfh === 0) continue
        if (f.excedent && ((v.q1 * UNITEV1) > v.v1) && ((v.q2 * UNITEV2) > v.v2 )) continue
        if (f.infmb) {
          let tr = false
          for(const [,mb] of e.mbacs) {
            if (mb.info && mb.info.indexOf(f.infmb) !== -1) { tr = true; break }
          }
          if (!tr) continue
        }
        if (f.mcp || f.mcn) {
          let tr = false
          for(const [,mb] of e.mbacs) {
            const s = mb.mc && mb.mc.length ? new Set(mb.mc) : new Set()
            if (f.setp.size && difference(f.setp, s).size) continue
            if (f.setn.size && intersection(f.setn, s).size) continue
            tr = true       
          }
          if (!tr) continue
        }
        if (f.invits && g.nbInvits === 0) continue
        r.push(e)
      }
      stores.filtre.stats.groupes = stt
      r.sort(f0)
      return r
    },

    pgLg: (state) => {
      const f = stores.filtre.filtre.groupes
      return f.tous ? state.map : state.groupesAC
    },

    // PageGroupe - membres people ***************************************************
    pgLmFT: (state) => {
      function f0 (a, b) { return a.na.nom < b.na.nom ? -1 : (a.na.nom > b.na.nom ? 1 : 0) }
      const f = stores.filtre.filtre.groupe
      const r = []
      const ast = state.egrC.groupe.ast
      for (const m of state.pgLm) {
        if (f.nmb && !m.na.nom.startsWith(f.nmb)) continue
        if (f.stmb) {
          const st = ast[m.ids]
          switch (f.stmb) {
            case 1: { if (st !== 32) continue; break }
            case 2: { if (st < 30 || st > 32) continue; break }
            case 3: { if (st !== 10) continue; break }
            case 4: { if (st < 60) continue; break }
            case 5: { if (st < 40 || st > 50) continue; break }
          }
        }
        r.push(m)
      }
      r.sort(f0)
      return r
    },

    pgLm (state) {
      const t = []
      const e = state.map.get(stores.session.groupeId)
      if (e) e.membres.forEach(m => { if (!m.estAc) t.push(m) })
      return t
    },

  },

  actions: {
    /* Sert à pouvoir attacher un écouteur pour détecter les changements de mc */
    setMotscles (id, mc) {
    },

    setInvit (idg, ida) { // id du groupe et de l'avatar invité
      let e = this.invits.get(ida)
      if (!e) { e = new Set(); this.invits.set(ida, e)}
      e.add(idg)
    },

    delInvit (idg, ida) { // id du groupe et de l'avatar invité
      const e = this.invits.get(ida)
      if (!e) return
      e.delete(idg)
    },

    setAnimHeb (e) {
      const g = e.groupe
      g.estAnim = false
      for (const [, m] of e.mbacs) {
        if (g.ast[m.ids] === 32) e.estAnim = true
        if (m.ids === g.imh) e.estHeb = true
      }
    },
    
    setGroupe (groupe) {
      if (!groupe) return
      let e = this.map.get(groupe.id)
      if (!e) {
        e = { 
          groupe: groupe, 
          membres: new Map(), // tous membres
          mbacs: new Map(), // membres avatars du compte
          estAnim: false, // un des avatars du compte est animateur du groupe
          estHeb: false, // un des avatars du compte est hébergeur du groupe
          objv: { v: 0, vols: {v1: 0, v2: 0, q1: 0, q2: 0} } //  { v, vols: {v1, v2, q1, q2} }
        }
        this.map.set(groupe.id, e)
      } else {
        if (groupe.v > e.groupe.v) {
          const mcav = new Uint8Array(encode(e.groupe.mc || {}))
          const mcap = new Uint8Array(encode(groupe.mc || {}))
          if (!egaliteU8(mcav, mcap )) this.setMotscles(groupe.id, mcap)
          e.groupe = groupe
        }
      }
      this.setAnimHeb(e)
      const nSt = stores.note
      nSt.setGroupe(groupe.na)
    },

    setVols (id, objv) {
      const e = this.map.get(id)
      if (e && objv.v > e.objv.v) e.objv = objv
    },

    setMembre (membre) {
      const aSt = stores.avatar
      if (!membre) return
      const e = this.map.get(membre.id)
      if (!e) return
      const pSt = stores.people
      if (membre._zombi) {
        // membre disparu : c'est sync qui a détecté que le membre n'existait plus
        const m = e.membres.get(membre.ids)
        if (!m) return // membre déjà traité disparu
        e.membres.delete(membre.ids)
        const na = m.na
        if (m.estAc) return
        pSt.unsetPeopleMembre(na.id, membre.id)
      } else {
        e.membres.set(membre.ids, membre)
        const na = membre.na
        if (membre.estAc) {
          // un des avatars du compte: enreg dans son avatar
          aSt.setAvatarGr(na.id, membre.id)
          e.mbacs.set(membre.ids, membre)
        } else {
          // ajoute ou remplace le people, met à jour sa cv le cas échéant
          pSt.setPeopleMembre(na, membre.id, membre.ids, membre.cv)
        }
      }
      this.setAnimHeb(e)
    },

    delMembre (id, ids) {
      const pSt = stores.people
      const aSt = stores.avatar
      const e = this.map.get(id)
      if (!e) return
      const m = e.membres.get(ids)
      if (!m) return
      const idp = m.na.id
      if (m.estAc) {
        aSt.delAvatarGr(idp, id)
        delete m.mbacs(ids)
      } else {
        pSt.unsetPeopleMembre(idp, id)
      }
      delete m.membres(ids)
    },

    setNote (note) {
      if (!note) return
      const nSt = stores.note
      nSt.setNote(note)
      // TODO : gérer les ajouts / suppressions de fichiers ayant une copie locale
    },

    delNote (id, ids) {
      const nSt = stores.note
      nSt.delNote(id, ids)
    },

    /* Mise jour groupée pour un groupe
    e : { id, gr, lmb: [], lsc: [] }
    */
    lotMaj ({id, gr, lmb, lsc, objv}) {
      if (gr) this.setGroupe(gr)
      if (objv) this.setVols (id, objv)
      lsc.forEach(s => { 
        if (s._zombi) this.delNote(s.id, s.ids); else this.setNote(s)  
      })
      lmb.forEach(m => { this.setMembre(m) }) // traite AUSSI le cas _zombi (disparu)
    },

    del (id) {
      this.map.delete(id)
      const nSt = stores.note
      nSt.delGroupe(id)
    }
  }
})
