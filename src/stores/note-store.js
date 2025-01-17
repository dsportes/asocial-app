import { defineStore } from 'pinia'
import { ID } from '../app/api.mjs'
import stores from './stores.mjs'
import { difference, intersection } from '../app/util.mjs'

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
      id: pour une racine égal à ids. Pour une note, id de la note
      ids: clé de map. ids de la note, id du groupe / avatar pour une racine
      pid // id du parent - existe toujours, sauf racines
      pids // ids de la note parent - existe si rattaché à une note, sinon null
      ratt // true si le node courant peut être rattaché à ce node
      children : [] nodes fils
      note : absent pour une racine et une note fake

    type:
      1 : racine avatar
      2 : racine groupe
      3 : racine groupe zombi
      4 5 : note avatar / groupe
      6 7 : note fake avatar / groupe
    */

    map: new Map(), // map des nodes cle: id (racine) ids (note), value: node

    nodes: [ ], // liste des nodes racines

    node: null, // node "courant"

    presel: '', // note pre-selected avant ouverture PageNote

    filtre: { v: '0' }, // paramètres du filtre courant

    /* nfnt est une map claculée par calculNfnt() ayant pour clé une node id / ids:
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

    cvNode: (state) => { return state.session.getCV(state.node.id) },

    // Pour le node courant
    note: (state) => { return state.node ? state.node.note : null },

    // Si le node courant est un groupe
    estGroupe (state) {
      const t = state.node ? state.node.type : 0
      return t === 2 || t === 3 || t === 5 || t === 7
    },

    // Si la note du node courant existe et est une note de groupe
    estGr: (state) => { 
      return state.node && state.node.note && ID.estGroupe(state.node.note.id)
    },

    // Si la note du node courant existe et est une note d'avatar
    estAv: (state) => { 
      return state.node && state.node.note && ID.estAvatar(state.node.note.id)
    },

    // id du node courant
    idC (state) { return state.node.id },

    nodeP: (state) => { return state.map.get(state.node.pids || state.node.pid) },

    // { nb: nombre d'auteurs, avc: true si tous du compte }
    nbAuts: (state) => {
      const r = { nb: state.note && state.note.l ? state.note.l.length : 0, avc: true }
      const g = state.groupe
      if (g && state.note) {
        const mav = state.session.compte.mav
        let n = 0
        state.note.l.forEach(im => { if (mav.has(g.tid[im])) n++ })
        r.avc = n === r.nb
      }
      return r
    },

    // retourne { avc: true/false, ida, im, cv } ou null s'il n'y a pas d'exclusivité
    mbExclu: (state) => {
      if (!state.imEX) return null
      const n = state.note
      let avc = false
      const gr = state.gSt.egr(n.id).groupe // le groupe existe du fait de state.imEx
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
      const gr = egr.groupe
      const imEx = state.imEX
      // tous les auteurs sont de mon compte
      const autsAvc = state.nbAuts.avc

      for (let im = 1; im < gr.tid.length; im++) {
        const ida = gr.tid[im]
        // seulement ceux actifs, pas l'actuel et ayant accès aux notes en écriture
        if (!ida || n.im === im || gr.st[im] < 4 || gr.accesNote2(im) !== 2) continue
        const avc = mav.has(ida)

        let ok
        if (imEx) { // il y a une VRAIE exclu
          if (mav.has(gr.tid[n.im])) ok = true // mon compte a l'exclu: tous membres possibles
          else {
            // si compte animateur et auteur exclusif pas animateur, tous
            if (egr.estAnim && gr.st[n.im] !== 5) ok = true
            else ok = false // aucun membre
          }
        } else { // pas d'exclu
          if (egr.estAnim) { // compte est animateur
            ok = true // tous possibles
          } else {
            if (autsAvc) { // les auteurs sont tous avatar de mon compte
              // les avatars de mon compte sont possibles
              if (mav.has(ida)) ok = true
              else ok = false // pas les autres
            } else ok = false // aucun n'est possible
          }
        }
        
        if (ok) {
          const nom = state.pSt.getCV(ida).nomC
          lx.push({ida, nom, im, avc})
        }
      }
      lx.sort((a,b) => {
        if (a.avc && b.avc) return (a.nom < b.nom ? -1 : 1)
        if (a.avc) return -1
        if (b.avc) return 1
        return (a.nom < b.nom ? -1 : (a.nom === b.nom ? 1 : 0))
      })
      return lx
    },

    egr: (state) => {
      if (!state.estGr) return null
      return state.gSt.egr(state.node.note.id)
    },

    groupe: (state) => state.egr ? state.egr.groupe : null,

    // im de l'avatar exclusif encore actif et AYANT TOUJOURS droits d'écriture, sinon 0
    imEX: (state) => state.note && state.groupe && state.note.im && state.groupe.accesEcrNote(state.note.im) ? state.note.im : 0,

    // l'avatar exclusif de la note courante est avatar du compte
    imEXestC: (state) => {
      if (state.imEX) {
        const ida = state.groupe.tid[state.imEX]
        return state.session.compte.mav.has(ida)
      } else return true
    },

    aUnAccesEcrNote: (state) => !state.groupe || state.groupe.aUnAccesEcrNote, 

    diagEd: (state) => {
      if (!state.aUnAccesEcrNote) return 'PNOroEcr'
      const im = state.imEX
      if (!im) return ''
      if (!state.imEXestC) return 'PNOroEx'
      return ''
    },

    // l'avatar exclusif est animateur du groupe de la note courante
    imEXanim: (state) => state.imEX !== 0 && state.groupe.value.st[state.imEX] === 5,

    // get de la note ids
    getNote: (state) => { return (ids) => {
        const n = state.map.get(ids)
        return n ? (n.note || null) : null
      }
    },
  
    // get de la racine du node (elle-même si c'est une racine)
    getRacine: (state) => { return (node) => {
        const anc = node.type > 3 ? this.getAncetres(node.ids) : [node.ids]
        return state.map.get(anc[anc.length -1])
      }
    },

    // retourne la liste des ancêtres du node dont l'id ou ids est donné 
    // inclus la note elle-même (première), jusqu'à la racine (dernier de la liste)
    // liste vide pour une racine
    getAncetres: (state) => { return (ids) => {
        const anc = []
        let node = state.map.get(ids)
        while (node) {
          anc.push(node.ids)
          if (node.type < 4) break
          node = state.map.get(node.pids || node.pid)
        }
        return anc
      }
    },

    // Retourne une map de clé racine et de valeur { nn: nombre de notes, vf }
    statsParRacine: (state) => {
      const m = {}
      for (const [, node] of state.map) {
        const id = node.id
        if (node.type >= 4 && node.type <= 5) {
          let e = m[id]; if (!e) { e = { nn: 0, vf: 0 }; m[id] = e }
          e.nn++
          e.vf += node.note.vf
        }
      }
      for (const r of state.nodes) {
        if (!m[r.id]) m[r.id] = { nn: 0, vf: 0 }
      }
      return m
    }

  },

  actions: {
    calculNfnt () {
      const m = {}
      if (this.ui.page === 'notes') {
        this.nodes.forEach(n => { m[n.id] = { nf: 0, nt: 0 }}) // racines
        this.map.forEach((node, idx) => {
          const ok = this.filtrage(node)
          const anc = this.getAncetres(idx) // pour une racine, seulement son id
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

    setCourant (ids) { this.node = this.map.get(ids) },

    setPreSelect (ids, opt) {
      if (opt) {
        this.presel = ''
        setTimeout(() => {
          this.presel = ids
        }, 100)
      } else this.presel = ids
    },

    stats (f) { // f(node): function de filtrage
      this.nodes.forEach(n => { n.nt = 0; n.nf = 0 })
      this.map.forEach(n => {
        const r = this.getRacine(n)
        if (n.type > 3) {
          r.nt++
          if (f && f(n.note)) r.nf++
        }
      })
    },
    
    resetRatt (tf) {
      this.map.forEach(n => { n.ratt = tf })
    },

    // Fixe le booléen ratt sur tous les nodes auxquels le node courant
    // peut être rattaché. Si le node courant est une racine (???), rien à faire
    scanTop () {
      const sx = new Set()
      if (this.node.type < 4) return
      const nc = this.node
      const g = this.estGroupe
      for (const n of this.nodes) { // n est une racine : types 1, 2, 3
        // sous-arbre avatar : OK si de même id que la note courante
        // sous-arbre groupe: OK si pas note de groupe ou du même groupe que la note courante
        if (n.type < 3) {
          const ok = n.type === 1 ? !g && nc.id === n.id : !g || (g && nc.id === n.id)
          if (ok) this.scanST(n, nc, g, sx)
        }
      }
      return sx
    },

    /* Scan un sous-arbre: 
    - x: node du (sous-)arbre à scanner
    - nc: note courante
    - g: la note courante est une note de groupe
    */
    scanST (x, nc, g, sx) {
      if (nc.ids !== x.ids) { x.ratt = true; sx.add(x.ids) }
      for (const c of x.children) {
        if (c.ids === nc.ids || c.ids === nc.pids) continue // pas rattachable dans son propre sous-arbre
        const okst = (g && (c.id === nc.id)) || (!g && ((c.id === nc.id) || ID.estNoteGr(c.ids)))
        if (okst && (x.type === 4 || x.type === 5)) { c.ratt = true; sx.add(c.ids) } 
        if (okst) this.scanST(c, nc, g, sx)
      }
    },

    // Tri des nodes enfants d'un node
    sort1 (a, b) { // les fake à la fin
      const x = a.note ? '1' + a.note.titre : (a.type > 5 ? '3' + a.ids : '2' + a.ids)
      const y = b.note ? '1' + b.note.titre : (b.type > 5 ? '3' + b.ids : '2' + b.ids)
      return x < y ? -1 : (x === y ? 0 : 1)
    },

    setNote (note){
      if (!note) return
      const type = ID.estGroupe(note.id) ? 5 : 4
      let n = this.map.get(note.ids)

      if (n) { // son node existait - remplacement - était fake ou pas, elle est désormais réelle
        n.type = type
        n.note = note
        if ((n.pid !== note.pid) || (n.pids !== note.pids)) { // son rattachement a changé
          this.detachNote(n) // détachement de l'ancien parent
          n.pid = note.pid || note.id
          n.pids = note.pids || null
          this.rattachNote(n) // rattachement au nouveau
        }
      } else { // création de son node
        n = {
          type,
          id: note.id,
          ids: note.ids,
          pid: note.pid || note.id,
          pids: note.pids || null,
          children: [],
          note: note
        }
        this.map.set(n.ids, n)
        this.rattachNote(n) // rattachement à sa racine ou sa note
      }

      this.setPreSelect(n.ids)
      this.calculNfnt()
    },

    delNote (id, ids) {
      const n = this.map.get(ids)
      if (!n || (n.type > 5)) return // node inexistant ou était déjà fake
      
      if (!n.children.length) { // Note existant SANS enfants
        this.detachNote(n) // détachement de son parent
        this.map.delete(ids) // suppression
        this.setPreSelect(n.pids || n.pid) // son parent s'ouvrira
      } else {
        // note ayant des enfants: la rendre fake et la déplacer sous sa racine "naturelle"
        const nvpid = n.id // sa racine naturelle
        n.type += 2 // devient fake
        delete n.note 
        if (nvpid !== n.pid) { // si elle doit bouger 
          this.detachNote(n)
          n.pid = nvpid
          n.pids = null
          this.rattachNote(n)
        }
        this.setPreSelect(n.ids) 
      }

      this.calculNfnt()
    },

    rattachNote (n) { // n est une note, a toujours un pid
      let p = this.map.get(n.pids || n.pid)
      if (p) { // cas "normal", la note / racine de rattachement existe
        p.children.push(n)
        p.children.sort(this.sort1)
        return
      }
      // la note / racine de rattachement n'existait pas
      if (!n.pids) { // C'est un rattachement à une racine (qui peut-être n'existe pas)
        this.rattachRac(n)
        return
      }
      /* cas #2a #4b #4d : c'est un rattachement à une note qui n'existe pas: 
      création d'un node fake rattachée à une racine d'avatar ou de groupe */
      const nf = {
        type: ID.estGroupe(n.pid) ? 7 : 6,
        id: n.pid,
        ids: n.pids,
        pid: n.id,
        children: [n]
      }
      this.rattachRac(nf)
      this.map.set(nf.ids, nf)
    },

    rattachRac (n) {
      let r = this.map.get(n.pid)
      if (!r) r = this.setRacine(n.pid, 3)  // cas "rare": création d'une racine groupe fake
      r.children.push(n)
      return r
    },

    detachNote (n) { // détachement d'une note de son parent actuel
      const p = this.map.get(n.pids || n.pid)
      if (!p) return
      const a = []
      p.children.forEach(c => { if (c.ids !== n.ids) a.push(c)})
      p.children = a
      if (p.children.length) return
    
      // le node parent n'a plus d'enfants: nettoyages éventels
      if (p.type === 3) { // le parent était une racine groupe fake désormais vide
        // On l'enleve de la liste des nodes racines
        this.delRacine(p.id)
        this.map.delete(p.id)
        return
      } 
      
      if (p.type > 5) { // était attachée à une note fake désormais vide
        // On enleve la note fake de la liste des nodes de sa racine
        const rac = this.map.get(p.pid) // racine de la note fake
        const b = []
        rac.children.forEach(c => { if (c.ids !== p.ids) b.push(c)})
        rac.children = b
        this.map.delete(p.ids)
        if (rac.type === 3 && !rac.children.length) { // la racine elle-même était vide
          // la supprimer aussi
          this.delRacine(p.ids)
          this.map.delete(rac.ids)
        }
      }
    },

    setRacine (id, type) { // on ajoute un node pour l'avatar / groupe juste à la racine
      let n = this.map.get(id)
      if (!n) { 
        n = { type, id, ids: id, children: [] }
        this.map.set(id, n)
        this.nodes.push(n)
        this.calculNfnt()
      } else {
        n.type = type // re-création d'un groupe 3 devenant 2
      }
      return n
    },

    delRacine (ids) { // retire la racine id, si elle existait
      const a = []
      for(const n of this.nodes) { if (n.ids !== ids) a.push(n) }
      if (a.length !== this.nodes.length) this.nodes = a
    },

    setAvatar (id) { // on ajoute un node pour l'avatar juste à la racine
      this.setRacine(id, 1)
    },

    setGroupe (id) { // on ajoute un node pour le groupe juste à la racine
      this.setRacine(id, 2)
    },

    delAvatar (id) { // delNote de toutes les notes de l'avatar
      this.map.forEach(n => { 
        if ((n.type === 4 || n.type === 6) && (n.note.id === id))
          this.delNote(n.note.ids)
      })
      this.delRacine(id)
      this.map.delete(id)
      this.calculNfnt()
    },

    delGroupe (id) {  // les notes du groupe ont déjà été supprimées
      const n = this.map.get(id)
      if (n && n.children.length) n.type = 3 // il reste des notes zombi / avatar
      else { // on retire le groupe de la racine
        this.delRacine(id)
        this.map.delete(id)
      }
      this.calculNfnt()
    }
  }
})
