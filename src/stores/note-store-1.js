import { defineStore } from 'pinia'
import { ID } from '../app/api.mjs'
import { Note } from '../app/modele.mjs'
import stores from './stores.mjs'
import { splitPK, difference, intersection } from '../app/util.mjs'

/* On ne peut recevoir des notes que de ce type:
- note d'avatar (4) - key:av1/ids1 relative à l'avatar av1 du compte. Elle peut avoir un ref:
  - #1 - pas de ref (comme si [av1, 0]) : pkey: av1
  - #2 - ref: [av1, ids2] -> pkey: av1/ids2, note du même avatar, existante ou non
    #2a: la note av1/ids2 n'existe pas, on créé une note fake (5) de key: av1/ids2, pkey: av1
    #2z: la note av1/ids2 existe
  - #3 - ref: [gr?, 0] -> pkey: gr0, à propos du groupe gr?, actif ou non pour le compte
    #3a: gr2 est actif pour le compte
    #3b: gr3 n'est pas actif, on créé un groupe fake gr3 (3)
  - #4 - ref: [gr?, ids8] -> note du groupe gr?, actif ou non pour le compte
    #4a - gr3 n'est pas actif, on créé un groupe fake gr3 (3)
    #4b - la note gr3/ids8 n'existe pas, on créé une note fake (7) de key: gr3/ids8, pkey: gr3
    #4c - gr2 est actif
    #4d - la note gr2/ids8 n'existe pas, on créé une note fake (7) de key: gr2/ids8, pkey: gr2
    #4z - la note gr?/ids8 existe
- note de groupe gr2/ids11 relative au groupe gr2 actif pour le compte. Elle peut avoir un ref:
  - #11 - pas de ref (comme si [gr2, 0]) : pkey: gr2
  - #12 - ref: [gr2, ids12] -> note du même groupe, existante ou non
    #12a - la note gr2/ids12 n'existe pas, on créé une note fake (7) de key: gr2/ids12, pkey: gr2
    #12z - la note gr2/ids12 existe

A la racine (1) d'un avatar de key: av1, on peut trouver:
- des notes réelles (4) key: av1/ids1 pkey: av1 - cas #1
- des notes fake (6) key: av1/id1 pkey: av1 - cas #2a

A la racine (2) d'un groupe actif pour le compte de key: gr2, on peut trouver:
- des notes réelles (4) key: av1/ids1, pkey: gr2 - cas #3a (note d'avatar rattachée au groupe)
- des notes réelles (5) key: gr2/ids11, pkey: gr2 - cas #11 (note du groupe rattachée au groupe)
- des notes fake (6) key: gr2/ids8, pkey: gr2 - cas #4d
- des notes fake (7) key: gr3/ids12, pkey: gr3 - cas #12a

A la racine (3) d'un groupe NON actif pour le compte de key: gr3, on peut trouver: créé par #4a #6
- des notes réelles (4) key: av1/ids1, pkey: gr3 - cas #3b (note d'avatar rattachée au groupe)
- des notes fake (7) key: gr3/ids8, pkey: gr3 - cas #4b

*/
export const useNoteStore = defineStore('note', {
  state: () => ({
    /* 
    node
      type
      key : 'id/ids'
      pkey : clé du parent
        - null: racine avatar ou groupe
        - 'id': rattachement direct à une racine de groupe ou d'avatar
        - 'id/ids': rattachement à une autre note
      children : [] nodes fils
      note : absent pour une racine et une note fake
      
    type:
      1 : racine avatar
      2 : racine groupe
      3 : racine groupe zombi
      4 5 : note avatar / groupe
      6 7 : note fake avatar / groupe
    */

    map: new Map(), // map des nodes cle: key, value: node

    nodes: [ ],

    node: null, // node "courant"

    test: { avs: {}, grs: {} },

    presel: '', // note pre-selected avant ouverture PageNote

    filtre: { v: '0' }, // paramètres du filtre courant

    /* nfnt est une map claculée par calculNfnt() ayant pour clé une node.key:
    - les racines ont une entrée dans nfnt,
    - les notes ont une entrée dans nfnt.
    La valeur { nf, nt } donne le nombre de notes dans le sous-arbre en dessous,
    - nt: total,
    - nf: satisfaisant au filtre courant.
    nfnt est (re)calculé:
    - à l'instantiation de PageNotes,
    - quand la page courante est PageNotes:
      - quand les arguments de filtre changent,
      - quand une note change: setNote delNote
      - à la création / suppression d'une racine.
    */
    nfnt: {}

  }),

  getters: {
    session: (state) => stores.session,
    aSt: (state) => stores.avatar,
    gSt: (state) => stores.groupe,
    pSt: (state) => stores.people,
    ui: (state) => stores.ui,

    cvNode: (state) => { 
      const id = Note.idDeKey(state.node.key)
      const cv = state.session.getCV(id) 
      return cv
    },

    // Pour le node courant
    note: (state) => { return state.node ? state.node.note : null },

    // Si le node courant est un groupe
    estGroupe (state) {
      const t = state.node ? state.node.type : 0
      return t === 2 || t === 5
    },

    // id du node courant
    idC (state) {
      return Note.idDeKey(state.node.key)
    },

    nodeP: (state) => { return state.map.get(state.node.pkey) },

    nbRatt: (state) => {
      let nb = 0
      for (const [,n] of state.map) { if (n.ratt) nb++ }
      return nb
    },

    // retourne { avc: true/false, ida, im, cv } ou null s'il n'y a pas d'exclusivité
    mbExclu: (state) => {
      const n = state.note
      let avc = false
      if (!n || !n.im) return null
      const egr = state.gSt.egr(n.id)
      if (!egr) return null
      const gr = egr.groupe
      const ida = gr.tid[n.im]
      avc = state.session.compte.mav.has(ida)
      const cv = state.session.getCV(ida)
      return { avc, ida, im: n.im, cv }
    },

    /* Pour une note de groupe, liste des {im, ida, nom} des membres 
    aptes à recevoir l'exclusivité, sauf celui actuel */
    lstImNa: (state) => { 
      const mav = state.session.compte.mav
      const lx = []
      const n = state.note
      if (!n) return lx
      const egr = state.gSt.egr(n.id)
      if (!egr) return lx
      const gr = state.egr.groupe
      for (let im = 1; im < gr.tid.length; im++) {
        const ida = gr.tid[im]
        if (!ida || gr.st[im] < 4 || im === n.im || gr.accesNote2(im) !== 2) continue
        // actifs, pas celui actuel, accès aux notes en écriture
        const nom = state.pSt.getCV(ida).nomC
        lx.push({ida, nom, im, avc: mav.has(ida)})
      }
      lx.sort((a,b) => {
        if (a.avc && b.avc) return (a.nom < b.nom ? -1 : 1)
        if (a.avc) return -1
        if (b.avc) return 1
        return (a.nom < b.nom ? -1 : (a.nom === b.nom ? 1 : 0))
      })
      return lx
    },

    estGr: (state) => { 
      return state.node && state.node.note && ID.estGroupe(state.node.note.id)
    },

    estAv: (state) => { 
      return state.node && state.node.note && ID.estAvatar(state.node.note.id)
    },

    egr: (state) => {
      if (!state.estGr) return null
      const gSt = stores.groupe
      return gSt.egr(state.node.note.id)
    },

    // get du node id ou id / ids
    getNode: (state) => { return (id, ids) => {
        return state.map.get(ids ? (id + '/' + ids) : ('' + id))
      }
    },

    // get de la note id / ids
    getNote: (state) => { return (id, ids) => {
        const n = state.map.get(id + '/' + ids)
        return n ? (n.note || null) : null
      }
    },
  
    getRacine: (state) => { return (node) => {
        const anc = this.getAncetres(node.key)
        const k = anc[anc.length -1]
        return state.map.get(k)
      }
    },

    getAncetres: (state) => { return (key) => {
        const anc = []
        let node = state.map.get(key)
        while (node) {
          anc.push(node.key)
          node = node.pkey ? state.map.get(node.pkey) : null
        }
        return anc
      }
    },

    // Retourne une map de clé racine et de valeur { nn: nombre de notes, vf }
    statsParRacine: (state) => {
      const m = {}
      for (const [key, node] of state.map) {
        const {id, ids} = splitPK(key)
        if (node.type >= 4 && node.type <= 5) {
          let e = m[id]; if (!e) { e = { nn: 0, vf: 0 }; m[id] = e }
          e.nn++
          e.vf += node.note.vf
        }
      }
      for (const r of state.nodes) {
        if (!m[r.key]) m[r.key] = { nn: 0, vf: 0 }
      }
      return m
    }

  },

  actions: {
    calculNfnt () {
      const m = {}
      if (this.ui.page === 'notes') {
        this.nodes.forEach(n => m[n.key] = { nf: 0, nt: 0 })
        this.map.forEach(node => {
          const ok = this.filtrage(node)
          const anc = this.getAncetres(node.key)
          for(let i = 1; i < anc.length; i++){
            // on ne prend pas la note elle-même, seulement ses ancêtres
            const k = anc[i]
            let e = m[k]; if (!e) { e = { nf: 0, nt: 0 }; m[k] = e }
            e.nt++; if (ok) e.nf++  
          }
        })
      }
      this.nfnt = m
    },

    filtrage (node, arg) {
      const n = node.note
      if (!n) return true
      const f = this.filtre
      if (f.v === '0') return true
      if (f.avgr && n.id !== f.avgr) return false
      if (f.lim && n.d && n.d < f.lim) return false
      if (f.note && n.texte && n.texte.indexOf(f.note) === -1) return false
      if (f.vf && n.vf < f.vf) return false
      if (f.mcp && n.smc && difference(f.mcp, n.smc).size) return false
      if (f.mcn && n.smc && intersection(f.mcn, n.smc).size) return false
      return true
    },

    setFiltre (f) {
      this.filtre = f
      this.calculNfnt()
    },

    setCourant (key) { this.node = this.map.get(key) },

    setPreSelect (key, opt) {
      if (opt) {
        this.presel = ''
        setTimeout(() => {
          this.presel = key
        }, 100)
      } else   this.presel = key
    },

    stats (f) { // f(node): function de filtrage
      this.nodes.forEach(n => { n.nt = 0; n.nf = 0 })
      this.map.forEach(n => {
        const r = this.getRacine(n)
        if (n.type > 3) {
          r.nt++
          if (f && f(n.note)) 
            r.nf++
        }
      })
    },
    
    resetRatt (tf) {
      this.map.forEach(n => { n.ratt = tf })
    },

    scanTop () {
      const id = Note.idDeKey(this.node.key)
      const pk = this.node.pkey
      const g = ID.estGroupe(id)
      for (const n of this.nodes) { // n est une racine : types 1, 2, 3
        const idt = n.key
        if (n.type === 1) { // sous-arbre avatar
          if (!g && id === idt) this.scanST(n, this.node.key, pk, id, g)
        } else { // sous-arbre groupe
          if (!g || (g && id === idt)) this.scanST(n, this.node.key, pk, id, g)
        }
      }
    },

    scanST (x, k, pk, id, g) {
      if (pk !== x.key && x.type !== 3) x.ratt = true
      for (const c of x.children) {
        if (c.key === k || c.key === pk) continue // pas rattachable dans son propre sous-arbre
        const idn = Note.idDeKey(c.key)
        const okst = (g && (idn === id)) || (!g && ((idn === id) || ID.estGroupe(idn)))
        if (okst && (x.type === 4 || x.type === 5)) c.ratt = true 
        if (okst) this.scanST(c, k, pk, id, g)
      }
    },

    sort1 (a, b) { // les fake à la fin
      const x = a.note ? '1' + a.note.titre : (a.idg ? '3' + a.idg + a.key : '2' + a.key)
      const y = b.note ? '1' + a.note.titre : (b.idg ? '3' + b.idg + b.key : '2' + b.key)
      return x < y ? -1 : (x === y ? 0 : 1)
    },

    setNote (note){
      if (!note) return
      const key = note.key
      const pkey = note.pkey
      let n = this.map.get(key)

      if (n) { // son node existait - remplacement - était fake ou pas, elle est désormais réelle
        n.type = Note.estG(key) ? 5 : 4
        n.note = note
        if (n.pkey !== pkey) { // son rattachement a changé
          this.detachNote(n) // détachement de l'ancien parent
          n.pkey = pkey
          this.rattachNote(n) // rattachement au nouveau
        }
      } else { // création de son node
        n = {
          type: Note.estG(key) ? 5 : 4,
          key,
          pkey,
          children: [],
          note: note
        }
        this.map.set(n.key, n)
        this.rattachNote(n) // rattachement à sa racine ou sa note
      }

      this.setPreSelect(key)
      this.calculNfnt()
    },

    delNote (id, ids) {
      const key = id + '/' + ids
      const n = this.map.get(key)
      if (!n || (n.type > 5)) return // node inexistant ou était fake
      
      if (!n.children.length) { // Node existant SANS enfants
        this.detachNote(n) // détachement de son parent
        this.map.delete(n.key) // suppression
        this.setPreSelect(n.pkey) // son parent s'ouvrira
      } else {
        // node ayant des enfants: la rendre fake et la déplacer sous sa racine "naturelle"
        const nvpkey = '' + Note.idDeKey(n.key)
        n.type += 2; delete n.note // devient fake
        if (nvpkey !== n.pkey) { // si elle doit bouger 
          this.detachNote(n) 
          n.pkey = nvpkey
          this.rattachNote(n)
        }
        this.setPreSelect(n.key) 
      }

      this.calculNfnt()
    },

    rattachNote (n) {
      let p = this.map.get(n.pkey)
      if (p) { // cas "normal", la note / racine de rattachement existe
        p.children.push(n)
        p.children.sort(this.sort1)
        return
      }
      // la note / racine de rattachement n'existait pas
      if (Note.pEstRac(n.pkey)) { // C'est un rattachement à une racine
        this.rattachRac(n)
        return
      }
      /* cas #2a #4b #4d : c'est un rattachement à une note qui n'existe pas: 
      création d'un node fake rattachée à une racine d'avatar ou de groupe */
      const nf = {
        type: Note.estG(n.pkey) ? 7 : 6,
        key: n.pkey,
        pkey: Note.racNoteP(n.pkey),
        children: [n]
      }
      this.rattachRac(nf)
      this.map.set(nf.key, nf)
    },

    rattachRac (n) {
      let r = this.map.get(n.pkey)
      if (!r) r = this.setRacine(n.pkey, 3)  // cas "rare": création d'une racine groupe fake
      r.children.push(n)
      return r
    },

    detachNote (n) { // détachement d'une note de son parent actuel
      const p = this.map.get(n.pkey)
      if (!p) return
      const a = []; p.children.forEach(c => { if (c.key !== n.key) a.push(c)}); p.children = a
      if (p.children.length) return
    
      // le node parent n'a plus d'enfants: nettoyages éventels
      if (p.type === 3) { // le parent était une racine groupe fake désormais vide
        // On l'enleve de la liste des nodes racines
        const a = []; this.notes.forEach(c => { if (c.key !== p.key) a.push(c)}); this.notes = a
        this.map.delete(p.key)
        return
      } 
      
      if (p.type > 5) { // était attachée à une note fake désormais vide
        // On enleve la note fake de la liste des nodes de sa racine
        const rac = this.map.get(p.pkey) // racine de la note fake
        const b = []; rac.children.forEach(c => { if (c.key !== p.key) b.push(c)}); rac.children = b
        this.map.delete(p.key)
        if (rac.type === 3 && !rac.children) { // la racine elle-même était vide
          // la supprimer aussi
          const d = []; this.notes.forEach(c => { if (c.key !== rac.key) d.push(c)}); this.notes = d
          this.map.delete(rac.key)
        }
      }
    },

    setRacine (key, type) { // on ajoute un node pour l'avatar / groupe juste à la racine
      let n = this.map.get(key)
      if (!n) { 
        n = { type, key, children: [] }
        this.map.set(key, n)
        this.nodes.push(n)
        this.calculNfnt()
      } else {
        n.type = type // re-création d'un groupe 3 devenant 2
      }
      // console.log('setRacine', n.key, n.type)
      return n
    },

    setAvatar (id) { // on ajoute un node pour l'avatar juste à la racine
      this.setRacine('' + id, 1)
    },

    setGroupe (id) { // on ajoute un node pour le groupe juste à la racine
      this.setRacine('' + id, 2)
    },

    delAvatar (id) { // delNote de toutes les notes de l'avatar
      const k = '' + id
      this.map.forEach(n => { 
        if ((n.type === 4 || n.type === 6) && (n.note.id === id))
          this.delNote(n.note.id, n.note.ids)
      })
      const a = []; for(const n of this.notes) { if (n.key !== k) a.push(n)}; this.notes = a
      this.map.delete(k)
      this.calculNfnt()
    },

    delGroupe (id) {  // les notes du groupe ont déjà été supprimées
      const k = '' + id
      const n = this.map.get(k)
      if (n && n.children.length) { // il reste des notes zombi / avatar
        n.type = 3
        // console.log('delGroupe', n.key, n.type)
      } else { // on retire le groupe de la racine
        const a = []; for(const n of this.notes) { if (n.key !== k) a.push(n)}; this.notes = a
        this.map.delete(k)
      }
      this.calculNfnt()
    }
  }
})