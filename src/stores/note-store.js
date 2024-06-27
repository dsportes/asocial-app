import { defineStore } from 'pinia'
import { AMJ, ID } from '../app/api.mjs'
import { Note } from '../app/modele.mjs'
import stores from './stores.mjs'
import { splitPK, $t } from '../app/util.mjs'

export const useNoteStore = defineStore('note', {
  state: () => ({
    /* 
    note 
      key: 'id/ids' (clé de la note)

      // rkey: 'id' (clé de sa racine)
      // refk: 'id/ids de ref' (clé de sa note de rattachement)
      // refrk: 'id de ref' (clé de la racine de sa note de rattachement)

    node
      type
      key : 'id/ids'
      pkey : clé du parent
        - null: racine avter ou groupe
        - 'id': rattachement direct à une racine de groupe ou d'avatar
        - 'id/ids': rattachement à une autre note
      children : [] nodes fils
      idg : pour un node avatar FAKE (rattaché à une racine), id du groupe
        auquel la note était rattachée quand elle existait
      note : absent pour une racine et une note fake
      label : titre de la note
      
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
    session: (state) => stores.sesion,
    aSt: (state) => stores.avatar,
    gSt: (state) => stores.groupe,
    ui: (state) => stores.ui,

    // Pour le node courant
    note: (state) => { return state.node ? state.node.note : null },

    // Si le node courant est un groupe
    estGroupe (state) {
      const t = state.node ? state.node.type : 0
      return t === 2 || t === 5 || t === 7
    },

    // id du node courant
    idC (state) {
      const t = state.node ? state.node.type : 0
      if (!t) return 0
      if (t < 4) return parseInt(state.node.key)
      return state.node.note ? state.node.note.id : 0
    },

    nodeP: (state) => {
      const n = state.note
      return n && n.ref ? state.map.get(n.refk) : null
    },

    // retourne { avc: true/false, ida, im, nom } ou null s'il n'y a pas d'exclusivité
    mbExclu: (state) => {
      const n = state.note
      let avc = false
      if (!n || !n.im) return null
      const egr = state.gSt.egr(n.id)
      if (!egr) return { avc, ida: 0, im: n.im, nom: '#' + n.im }
      const gr = egr.groupe
      const ida = gr.tid[n.im]
      avc = state.session.compte.mav.has(ida)
      const cv = state.session.getCV(ida)
      return { avc, ida, im: n.im, nom: this.session.getCV(ida).nomC }
      /*
      const aSt = stores.avatar
      let na = aSt.compte.naDeIdgIm(n.id, n.im)
      if (na) {
        x = { avc: true, na: na, nom: $t('moi2', [na.nom]), im: n.im }
      } else {
        const gSt = stores.groupe
        const m = gSt.getMembre(n.id, n.im)
        if (m) {
          na = m.na
          x = { avc: false, im: n.im, na: na, nom: m.na.nomc }
        } else x = { avc: false, im: n.im, nom: '#' + n.im }
      }
      return x
      */
    },

    /* Pour une note de groupe, liste des {im, ida, nom} des membres 
    aptes à recevoir l'exclusivité, sauf celui actuel */
    lstImNa (state) { 
      const lx = []
      if (!state.egr) return lx
      const gr = state.egr.groupe
      const acMNE = gr.aUnAccesMNE(state.session.compte.mav)
      if (!acMNE) return lx

      const id = state.note.id
      const anim = egr.estAnim
      const xav = state.mbExclu // retourne { avc: true/false, ida, im, nom } ou null s'il n'y a pas d'exclusivité

      // TODO fonctionnalité pas claire. 
      let autAvc = true
      const ims = aSt.compte.imGroupe(id) 
      state.note.auts.forEach(im => { if (!ims.has(im)) autAvc = false })
  
      const l = gSt.nexLm(state.note.id) // liste des membres "auteurs" aptes à recevoir l'exclusivité
      l.forEach(e => {
        if (e.im !== state.note.im) { // sauf celui actuel
          if (anim // je suis animateur
            || (xav && xav.avc) // j'ai l'exclusité
            || (!xav && e.avc && autAvc) // personne n'a l'exclusivité, c'est un de mes avatars ET je suis seul auteur de la note
            ) {
              const x = { ...e }
              x.nom = x.avc ? $t('moi2', [x.na.nom]) : x.na.nomc
              lx.push(x)
            }
        }
      })
      lx.sort((a,b) => {
        if (a.avc && b.avc) return (a.nom < b.nom ? -1 : 1)
        if (a.avc) return -1
        if (b.avc) return 1
        return (a.nom < b.nom ? -1 : (a.nom === b.nom ? 1 : 0))
      })
      return lx
    },
    
    /*
    nbjTemp: (state) => {
      const n = state.note
      if (!n || n.st === 99999999) return 0
      const session = stores.session
      const auj = session.auj
      return AMJ.diff(n.st, auj)
    },

    mbAuteurs: (state) => {
      const l = []
      const n = state.note
      if (!n || !n.auts.length) return l
      const gSt = stores.groupe
      n.auts.forEach(im => { l.push(gSt.getMembre(n.id, im)) })
      return l
    },
    */

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

    // get de l'entrée Note
    getNode: (state) => { return (id, ids) => {  // id / ids ou pk (id/ids)
        return state.map.get(ids ? (id + '/' + ids) : ('' + id))
      }
    },

    /*
    getRacine: (state) => { return (node) => {
        if (!node.note) return state.map.get(node.key)
        const n = node.note
        let refk = n.refk
        if (!refk) return state.map.get(n.rkey)
        while (true) {        
          const p = state.map.get(refk)
          if (!p.note || !p.note.refk) return state.map.get(p.rkey)
          refk = p.note.refk
        }
      }
    },
    */

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

    /*
    getAncetres1: (state) => { return (key) => {
        const anc = []
        const node = state.map.get(key)
        if (!node || !node.note) return anc
        anc.push(key)
        let refk = node.note.refk
        if (!refk) { anc.push(node.rkey); return anc }
        anc.push(refk)
        while (true) {        
          const p = state.map.get(refk)
          if (!p.note || !p.note.refk) { anc.push(p.rkey); break }
          refk = p.note.refk
          anc.push(refk)
        }
        return anc
      }
    },
    */

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
      if (f.lim && n.dh && n.dh < f.lim) return false
      if (f.note && n.txt && n.txt.indexOf(f.note) === -1) return false
      if (f.vf && n.vf < f.vf) return false
      if (f.mcp && n.smc && difference(f.mcp, n.smc).size) return false
      if (f.mcn && n.smc && intersection(f.mcn, n.smc).size) return false
      return true
    },

    setFiltre (f) {
      this.filtre = f
      this.calculNfnt()
    },

    setCourant (key) {
      this.node = this.getNode(key)
    },

    setPreSelect (key) {
      this.presel = key
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

    koP (n) { // exclusion du node parent de la note (elle y est déjà rattachée !)
      const np = this.map.get(n.refk ? n.refk : n.rkey)
      np.ratt = false
    },

    koSA (n) { // exclut sans condition le sous-arbre démarrant au noeud n 
      n.ratt = false
      if (n.children) for(const c of n.children) this.koSA(c)
    },

    koSAC (n, idg, ida) { 
      /* exclut tous les sous-arbres démarrant à n 
      dès qu'ils ne sont ni du groupe idg, ni de l'avatar ida */
      if (n.type > 5) { // exclusion inconditionnelle des sous-arbres fake
        this.koSA(n)
      } else if (''+ idg === n.rkey) { 
        // sous-arbre du groupe, on descend
        if (n.children) for(const c of n.children) this.koSAC(c, idg, ida)
      } else if (''+ ida !== n.rkey) {
        // sous-arbre d'un autre avatar que ida: à exclure
        this.koSA(n)
      }
      // début d'un sous-arbre de l'avatar : OK
    },

    koSAG (n, idg) { 
      /* exclut tous les sous-arbres démarrant à n 
      dès qu'ils ne sont pas du groupe idg */
      if (n.type > 5) { // exclusion inconditionnelle des sous-arbres fake
        this.koSA(n)
      } else if (''+ idg === n.rkey) { 
        // sous-arbre du groupe, on descend
        if (n.children) for(const c of n.children) this.koSAG(c, idg)
      } else {
        // sous-arbre autre que du groupe: à exclure
        this.koSA(n)
      }
    },

    koAV (ida) { // exclut les sous arbres zombi et groupes/avatars autres que idg et les fakes
      for (const n of this.nodes) { // n est une racine : types 1, 2, 3
        const id = parseInt(n.key)
        if (n.type === 3 || (n.type === 1 && id !== ida)) { 
          // exclusion inconditionnelle des arbres "groupes zombis"
          // et des arbres d'un autre avatar
          this.koSA(n)
        } else {
          if (id !== ida) {
            // c'est une racine de groupe (les autres avatars ont été exclus ci-dessus)
            this.koSAC(n, id, ida)
          }
        }
      }
    },

    koGR (idg) { // exclut les sous arbres zombi et groupes/avatars autres que idg et les fakes
      for (const n of this.nodes) { // n est une racine : types 1, 2, 3
        const id = parseInt(n.key)
        if (n.type === 3) { 
          // exclusion inconditionnelle des "groupes zombis"
          this.koSA(n)
        } else {
          if (id === idg) {
            // c'est la racine du groupe idg : à explorer
            this.koSAG(n, id)
          } else { // racine d'un autre groupe, d'un avatars ... : à exclure
            this.koSA(n)
          }
        }
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

      if (n) { // son node existait - remplacement - fake ou pas, elle devient réelle
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
          note: note
        }
        this.rattachNote(n) // rattachement à sa racine ou sa note
      }

      this.setPreSelect(key)
      this.calculNfnt()
    },

    delNote (id, ids) {
      const key = id + '/' + ids
      const n = this.map.get(key)
      if (!n || !n.note) return // node inexistant ou était déjà fake
      
      if (!n.children.length) { // Node existant SANS enfants
        this.detachNote(n) // détachement de son parent
        this.map.delete(n.key) // suppression
        this.setPreSelect(n.pkey) // son parent s'ouvrira
      } else {
        // node ayant des enfants
        if (Note.pEstRac(n.pkey)) { // elle était rattachée à sa racine
          delete n.note // devient juste fake
        } else { // le node DEVIENT FAKE rattaché à sa racine
          this.detachNote(n) // détachement de son parent actuel (racine ou non)
          const nf = this.creationFake(Note.racNoteP(n.pkey)) // création d'une fake rattachée à la racine
          nf.children = n.children // récupération des enfants
          nf.idg = n.note.refIdg
          delete n.note // devient fake
        }
      }

      this.calculNfnt()
    },
      
    /*
      if (!n.note.ref || !n.note.ref[1] ) {
        // était rattachée à UNE racine (la sienne ou un groupe pour un avatar) - devient fake ou supprimée
        if (n.children.length) { // a des enfants : devient fake
          n.note = null
          n.type = Note.estG(n.rkey) ? 7 : 6
          this.setLabel(n)
        } else { // la note n'a pas d'enfants
          // à supprimer des enfants de sa racine
          const a = []; np.children.forEach(c => { if (c.key !== key) a.push(c)}); np.children = a
          let cpt = false
          if (np.type === 3) {
            // c'est une racine groupe "zombi"
            if (!np.children.length) {
              // avatar ou groupe zombi inutile
              this.map.delete(np.key)
              // par convention on dépliera la racine du compte
              cpt = true
            }
          }
          this.map.delete(n.key) // note simplement supprimée (puisqu'elle n'a pas d'enfant)
          this.setPreSelect(cpt ? '' + this.session.compteId : npkey) // la racine ou celle du compte s'ouvre
        }
        this.calculNfnt()
        return
      }

      // La note supprimée était rattachée à une autre note np

      if (!n.children.length) { // elle n'avait pas d'enfants
        // elle est retirée de la liste des enfants de son parent
        const a = []
        np.children.forEach(c => { if (c.key !== key) a.push(c)})
        np.children = a
        this.map.delete(n.key) // elle est simplement supprimée
        this.setPreSelect(npkey) // son parent s'ouvrira
        this.calculNfnt()
        return
      }

      // la note supprimée avait des enfants : elle DEVIENT UNE FAKE rattachée à sa racine
      // on l'enlève de son parent
      const a = []
      np.children.forEach(c => { if (c.key !== key) a.push(c)})
      np.children = a

      n.type = Note.estG(n.rkey) ? 7 : 6
      // SI c'était une note d'avatar rattachée à une note de groupe
      // const refn = (!Note.estG(n.key) && Note.estG(np.key)) ? np.rkey : '' 
      n.note = null
      this.rattachRac (n)
      this.setLabel(n)
      this.setPreSelect(n.key) // elle sera dépliée
      this.calculNfnt()
    */

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
      /* C'est un rattachement à une note qui n'existe pas: 
      création d'un node fake rattaché à une racine d'avatar ou de groupe */
      const nf = this.creationFake(Note.racNoteP(n.pkey))
      nf.children = [n]
    },

    // création d'un node fake SANS ENFANTS rattachée à une racine d'avatar ou de groupe
    creationFake (key) { 
      const nf = {
        type: Note.estG(key) ? 5 : 4,
        key: key,
        pkey: Note.racNoteP(key),
        children: []
      }
      this.rattachRac(nf)
      return nf
    },

    detachNote (n) { // détachement d'une note de son parent actuel
      const p = this.map.get(n.pkey)
      if (!p) return
      const a = []; p.children.forEach(c => { if (c.key !== n.key) a.push(c)}); p.children = a
      if (a.length === 0 && p.type === 3) { // plus d'enfants et elle était attachée à une racine groupe fake
        // On enleve la racine groupe fake de la liste des nodes racines
        const idx = -1; this.notes.forEach((r, i) => { if (r.key === p.key) idx = i})
        if (idx !== -1) this.notes.splice(idx, 1)
        this.map.delete(p.key)
      }
    },

    rattachRac (n) {
      let r = this.map.get(n.pkey)
      if (r) { // cas "normal" la racine avatar / groupe existe
        r.children.push(n)
        r.children.sort(this.sort1)
      } else { // cas "rare": création d'une racine groupe fake
        r = this.setRacine(n.pkey, 3) // Groupe _zombi_
        r.children.push(n)
      }
      return r
    },

    setRacine (key, type) { // on ajoute un node pour l'avatar / groupe juste à la racine
      let n = this.map.get(key)
      if (!n) { 
        n = { type, key, children: [] }
        this.map.set(key, n)
        this.nodes.push(n)
        this.nodes.sort(Note.sortNodes)
        this.calculNfnt()
      }
      return n
    },

    setAvatar (id) { // on ajoute un node pour l'avatar juste à la racine
      this.setRacine('' + id, 1)
    },

    setGroupe (id) { // on ajoute un node pour le groupe juste à la racine
      this.setRacine('' + id, 2)
    },

    delAvatar (id) { // TODO
      this.calculNfnt()
    },

    delGroupe (id) {  // TODO - compliqué, enlever toutes les notes de groupe
      this.calculNfnt()
    }

    /*
    setLabel (n) {
      // le label dépend à qui est rattachée la note et si c'est une fake ou non
      let pfx = '', sfx = ''
      if (n.type === 4 && n.note.refrk) {
        if (n.note.refrk !== n.rkey) {
          // note avatar rattachée à une note de groupe (ayant une racine différente)
          pfx = '[' + this.map.get(n.rkey).label + ']'
        } else {
          const nr = this.map.get(n.note.refk)
          // note avatar rattachée à une note avatar ayant un préfixe : reconduction du préfixe
          if (nr && nr.pfx) pfx = nr.pfx
        }
      }
      if (n.note) { // note réelle
        sfx = n.note.titre
      } else { // note fake
        const {id, ids} = splitPK(n.key)
        sfx = '$' + ids
        if (n.pfx) pfx = n.pfx
      }
      n.pfx = pfx
      n.label = (pfx ? (pfx + ' '): '') + sfx
    },
    */
  }
})
