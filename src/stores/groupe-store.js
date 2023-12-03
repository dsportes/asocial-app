import { defineStore } from 'pinia'
import stores from './stores.mjs'
import { encode } from '@msgpack/msgpack'
import { egaliteU8, difference, intersection } from '../app/util.mjs'
import { UNITEV1, UNITEV2, FLAGS } from '../app/api.mjs'

/* Store maître des groupes du compte courant :
- map : des groupes dont un des avatars du compte courant est membre
  Sous-collection pour chaque groupe id :
    groupe: l'objet Groupe
    notes: Map des notes (clé:ids, valeur:v2)
    membres: new Map(), // tous membres
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
      const id = stores.session.groupeId
      return state.map.get(id)
    },

    // Retourne [amb, ano] : les avatars du compte ont ou non accès aux membres / notes
    ambano (state) {
      return state.egrC ? stores.avatar.compte.ambano(state.egrC.groupe) : [false, false]
    },

    amb: (state) => { return (id) => { 
        const e = state.map.get(id)
        return e ? stores.avatar.compte.ambano(e.groupe)[0] : false
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
        const fx = e.groupe.flags
        for(let i = 1; i < fx.length; i++) {
          const fl = fx[i]
          if (fl & FLAGS.IN) {
            if (e.membres.get(i).estAc) n++
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

    /* NA des animateurs du groupe courant ayant voté 
    - pour inviter le membre courant 
    - contre (en fait pas encore voté)
    */
    animInv: (state) => {
      const lc = []
      const la = []
      const session = stores.session
      const e = state.map.get(session.groupeId)
      if (!e) return
      const m = e.membres.get(session.membreId)
      const g = e.groupe
      if (!m) return [lc, la]
      const inv = m.inv || []
      for(let im = 1; im < g.flags.length; im++) {
        if (g.flags[im] & FLAGS.PA) {
        const a = e.membres.get(im)
        if (inv.indexOf(im) === -1) la.push(a.na); else lc.push(a.na)
        }
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
      const aSt = stores.avatar
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
        if (e.estHeb) {
          stt.v1 += v.v1 || 0
          stt.v2 += v.v2 || 0
          stt.q1 += v.q1 || 0
          stt.q2 += v.q2 || 0
        }
        const g = e.groupe
        if (f.ngr && !g.na.nom.startsWith(f.ngr)) continue
        if (f.sansheb && g.dfh === 0) continue
        if (f.excedent && ((v.q1 * UNITEV1) > v.v1) && ((v.q2 * UNITEV2) > v.v2 )) continue
        const mcmemo = aSt.compte.mcmemo(g.id)

        if (f.infmb && mcmemo && mcmemo.memo && mcmemo.memo.indexOf(f.infmb) === -1) continue
        if (f.setp.size || f.setn.size) {
          if (!mcmemo || !mcmemo.mc || !mcmemo.mc.length) continue
          const s = new Set(mcmemo.mc)
          if (f.setp.size && difference(f.setp, s).size) continue
          if (f.setn.size && intersection(f.setn, s).size) continue          
        }
        if (f.invits && g.nbInvits === 0) continue
        r.push(e)
      }
      stores.filtre.stats.groupes = stt
      r.sort(f0)
      stores.session.fmsg(r.length)
      return r
    },

    pgLg: (state) => {
      const f = stores.filtre.filtre.groupes
      if (f.tous) return state.map
      const aSt = stores.avatar
      const s = aSt.compte.idGroupes(stores.session.avatarId)
      const m = new Map()
      s.forEach(idg => {
        const e = state.map.get(idg)
        m.set(idg, e)
      })
      return m
    },

    // PageGroupe - membres people ***************************************************
    pgLmFT: (state) => {
      function f0 (a, b) { return a.na.nom < b.na.nom ? -1 : (a.na.nom > b.na.nom ? 1 : 0) }
      const f = stores.filtre.filtre.groupe
      const r = []
      const g = state.egrC.groupe
      for (const m of state.pgLm) {
        if (f.nmb && !m.na.nom.startsWith(f.nmb)) continue
        if (f.stmb) {
          const stm = g.statutMajeur(m.ids)
          if (stm + 1 !== f.stmb) continue
        }
        if (f.ambno) {
          const mb = g.accesMembre(m.ids)
          const no = g.accesNote(m.ids)
          if (f.ambno === 1 && !(mb && !no)) continue
          if (f.ambno === 2 && !(no && !mb)) continue
          if (f.ambno === 3 && !(mb && no)) continue
          if (f.ambno === 4 && !(!mb && !no)) continue
          if (f.ambno === 5 && g.accesEcrNoteH(m.ids) !== 1) continue
        }
        r.push(m)
      }
      r.sort(f0)
      stores.session.fmsg(r.length)
      return r
    },

    pgLm (state) {
      const t = []
      const e = state.map.get(stores.session.groupeId)
      if (e) e.membres.forEach(m => { if (!m.estAc) t.push(m) })
      return t
    }
  },

  actions: {
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
    
    /* Sert à pouvoir attacher un écouteur pour détecter les changements de mc */
    setMotscles (id, mc) {
    },

    setInvit (ng, na, im) { // na du groupe et de l'avatar invité
      this.invits.set(ng.id + '/' + na.id, {ng, na, im})
    },

    delInvit (idg, ida) { // id du groupe et de l'avatar invité
      const e = this.invits.get(ida)
      if (!e) return
      e.delete(idg)
    },
    
    setGroupe (groupe) {
      if (!groupe) return
      const aSt = stores.avatar
      let e = this.map.get(groupe.id)
      if (!e) {
        e = { 
          groupe: groupe, 
          notes: new Map(),
          membres: new Map(), // tous membres
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
      e.estAnim = false
      e.estHeb = false
      const m = aSt.compte.imIdGroupe(groupe.id)
      for (const [id, im] of m) {
        if (groupe.estAnim(im)) e.estAnim = true
        if (im === groupe.imh) e.estHeb = true
      }
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
        if (!membre.estAc) {
          // ajoute ou remplace le people, met à jour sa cv le cas échéant
          pSt.setPeopleMembre(na, membre.id, membre.ids, membre.cv)
        }
      }
    },

    delMembre (id, ids) {
      const pSt = stores.people
      const aSt = stores.avatar
      const e = this.map.get(id)
      if (!e) return
      if (ids) {
        const m = e.membres.get(ids)
        if (!m) return
        const idp = m.na.id
        if (!m.estAc) pSt.unsetPeopleMembre(idp, id)
        delete m.membres(ids)
      } else {
        e.membres.forEach((m, ids) => {
          const idp = m.na.id
          pSt.unsetPeopleMembre(idp, id)
        })
        e.membres.clear()
      }
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
    },

    /* Mise jour groupée pour un groupe
    e : { id, gr, lmb: [], lno: [] }
    */
    lotMaj ({id, gr, lmb, lno, objv}) {
      if (gr) this.setGroupe(gr)
      if (objv) this.setVols (id, objv)
      lno.forEach(s => { 
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
