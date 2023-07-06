import { defineStore } from 'pinia'
import { AMJ } from '../app/api.mjs'
import { Note } from '../app/modele.mjs'
import stores from './stores.mjs'
import { splitPK } from '../app/util.mjs'

export const useNoteStore = defineStore('note', {
  state: () => ({
    /* 
    note 
      key: 'id/ids' (clé de la note)
      rkey: 'id' (clé de sa racine)
      refk: 'id/ids de ref' (clé de sa note de rattachement)
      refrk: 'id de ref' (clé de la racine de sa note de rattachement)
      refn: nom du groupe de ref (nom du groupe de sa note de rattachement)

    node
      type
      key : 'id/ids'
      rkey : 'id' (clé de sa racine)
      note : absent pour une fake
      pfx : préfixe [nom] du label (ou '')
      label :
        - réelle : titre de la note
        - fake : $56789 (id en chiffres)
      children: [] nodes fils
    type:
      1 : racine avatar
      2 : racine groupe
      3 : racine groupe zombi
      4 5 : note avatar / groupe
      6 7 : note fake avatar / groupe
    */

    map: new Map(), // map des nodes cle: key, value: node

    nodes: [
    ],

    node: null, // node "courant"

    test: { avs: {}, grs: {} },

    presel: '' // note pre-selected avant ouverture PageNote
  }),

  getters: {
    // Pour le node courant
    note: (state) => { return state.node ? state.node.note : null },

    nodeP: (state) => {
      const n = state.note
      return n && n.ref ? state.map.get(n.refk) : null
    },

    mbExclu: (state) => {
      const n = state.note
      if (!n || !n.im) return null
      const gSt = stores.groupe
      return gSt.getMembre(n.id, n.im)
    },

    nbjTemp: (state) => {
      const n = state.note
      if (!n || n.st === 99999999) return 0
      const session = stores.session
      const auj = session.dateJourConnx
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

    estGr: (state) => { 
      return state.node && state.node.note && state.node.note.ng.estGroupe
    },

    estAv: (state) => { 
      return state.node && state.node.note && state.node.note.ng.estAvatar
    },

    egr: (state) => {
      if (!state.estGr) return null
      const gSt = stores.groupe
      return gSt.egr(state.node.note.id)
    },

    eav: (state) => {
      if (!state.estAv) return null
      const aSt = stores.avatar
      return eSt.getElt(state.node.note.id)
    },

    // get de l'entrée Note
    getNode: (state) => { return (id, ids) => {  // id / ids ou pk (id/ids)
        return state.map.get(ids ? (id + '/' + ids) : ('' + id))
      }
    },

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

    getAncetres: (state) => { return (key) => {
        const anc = []
        const node = state.map.get(key)
        if (!node || !node.note) return anc
        anc.push(key)
        let refk = node.note.refk
        if (!refk) { anc.push(node.rkey); return anc }
        anc.push(refk)
        while (true) {        
          const p = state.map.get(refk)
          if (!p.note || !p.note.refk) { anc.push(p.rkey); return anc }
          refk = p.note.refk
          anc.push(refk)
        }
        return anc
      }
    },

    // Retourne une map de clé racine et de valeur n nombre de notes
    nbNotesParRacine: (state) => {
      const m = []
      for (const [key, node] of state.map) {
        const {id, ids} = splitPK(key)
        if (node.type >= 4 || node.type <= 5) {
          let n = m[id] || 0
          m[id] = n++
        }
      }
      return m
    }

  },

  actions: {
    setCourant (key) {
      this.node = this.getNode(key)
    },

    setSelected (key) { // $onAction dans PageNotes pour forcer la sélection
      this.setCourant(key) 
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
          if (f && f(n)) r.nf++
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

    setNote (note){
      if (!note) return
      const key = note.key
      let n = this.map.get(key)
      if (!note.ref) { // note rattachée à la racine
        if (n) { // elle existait - remplacement - fake ou pas, elle devient réelle
          if (!n.note) n.type -= 2 // si c'était une fake, elle est réelle
          const nrav = n.note ? n.note.refk : '' // rattachement AVANT
          n.note = note
          if (nrav) {
            // elle était attachée à une note : on la détache de celle-ci
            this.detachNote(n, nrav)
            // on la rattache à sa racine
            this.rattachRac(n)
          }
        } else {
          // création d'une note réelle à la racine
          n = {
            rkey: note.rkey,
            key: key,
            type: Note.estG(key) ? 5 : 4,
            note: note,
            children: []
          }
          this.map.set(key, n)
          this.rattachRac(n)
        }
      } else { // note rattachée à une autre
        if (n) { // la note existait
          if (!n.note) { // mais c'était une fake (rattachée à SA racine)
            const r = this.map.get(n.rkey)
            // on la détache de SA racine
            const a = []
            r.children.forEach(c => { if (c.key !== n.key) a.push(c)})
            n.children = a
            // elle devient réelle
            n.type -= 2
            n.note = note
            n.label = note.titre
            // on la rattache à sa note de rattachement
            this.rattachNote(n)
          } else { // la note existait et est réelle
            const nrav = n.note.refk // rattachement AVANT
            const nrap = note.refk // rattachement APRES
            n.note = note
            n.label = note.titre
            // était-elle rattachée à une autre ?
            if (!nrav) {
              // n'était pas rattachée
              if (nrap) {
                // on la détache de sa racine
                this.detachNote(n, n.rkey)
                // on la rattache à sa note de rattachement
                this.rattachNote(n)
              }
            } else {
              // était rattachée
              if (nrap) { // est toujours rattachée
                if (nrav !== nrap) {
                  // mais pas à la même : on la détache de l'ancienne
                  this.detachNote(n, nrav)
                  // on la rattache à la nouvelle
                  this.rattachNote(n)
                } // si elle est toujours rattachée à la même rien à faire
              } else {
                // n'est PLUS rattachée : on la détache de l'ancienne
                this.detachNote(n, nrav)
                // on la rattache à sa racine
                this.rattachRac(n)
              }
            }
          }
        } else { // la note n'existait pas
          n = {
            rkey: note.rkey,
            key: key,
            type: Note.estG(key) ? 5 : 4,
            note: note,
            children: []
          }
          this.map.set(key, n)
          this.rattachNote(n) // on la rattache à sa note de rattachement
        }
      }
      this.setLabel(n)
    },

    detachNote (n, nrav) {
      const rav = this.map.get(nrav)
      const a = []
      rav.children.forEach(c => { if (c.key !== n.key) a.push(c)})
      rav.children = a
      if (a.length === 0 && rav.type > 5) {
        // plus d'enfants et c'était une fake on la détache elle-même de sa racine
        this.detachNote(rav, rav.rkey)
        this.map.delete(nrav)
      }
    },

    delNote (id, ids) {
      const session = stores.session
      const key = id + '/' + ids
      const n = this.map.get(key)
      if (!n || !n.note) return // note inexistante ou était déjà fake

      const npkey = n.note.refk || '' + id // parent avatar / groupe ou autre note
      const np = this.map.get(npkey)

      if (!n.note.refk || !n.note.ref[1]) {
        // était rattachée à UNE racine (la sienne ou un groupe pour un avatar) - devient fake ou supprimée
        if (n.children.length) { // a des enfants : devient fake
          n.note = null
          n.type = Note.estG(n.rkey) ? 7 : 6
          this.setLabel(n)
        } else {
          // note à supprimer de sa racine
          const a = []
          np.children.forEach(c => { if (c.key !== key) a.push(c)})
          np.children = a
          let cpt = false
          if (np.type === 3) {
            // c'est une racine groupe "zombi" : inutile ?
            if (!np.children.length) {
              // avatar ou groupe zombi inutile
              this.map.delete(np.key)
              // par convention on sépliera la racine du compte
              cpt = true
            }
          }
          this.map.delete(n.key) // note simplement supprimée (puisqu'elle n'a pas d'enfant)
          this.setPreSelect(cpt ? '' + session.compteId : npkey) // la racine ou celle du compte s'ouvre
        }
        return
      }

      // La note était rattachée à une autre note

      if (!n.children.length) {
        // elle n'avait pas d'enfants
        const a = []
        np.children.forEach(c => { if (c.key !== key) a.push(c)})
        np.children = a
        this.map.delete(n.key) // note simplement supprimée (puisqu'elle n'a pas d'enfant)
        this.setPreSelect(npkey) // son parent s'ouvrira
        return
      }

      // note rattachée ayant des enfants : DEVIENT UNE FAKE rattachée à sa racine
      // on l'enlève de son parent
      const a = []
      np.children.forEach(c => { if (c.key !== key) a.push(c)})
      np.children = a

      n.note = null
      n.type = Note.estG(n.rkey) ? 7 : 6
      // refn SI c'était une note d'avatar rattachée à une note de groupe
      const refn = (!Note.estG(n.key) && Note.estG(np.key)) ? np.rkey : '' 
      this.rattachRac (n, refn)
      this.setLabel(n)
      this.setPreSelect(n.key) // elle sera dépliée
    },

    rattachNote (n) {
      let nr = this.map.get(n.note.refk)
      if (nr) { // la note de rattachement existait (fake ou réelle)
        nr.children.push(n)
        nr.children.sort(Node.sort1)
      } else { // la note de rattachement n'existait pas : on la créé fake
        const key = n.note.refk
        const rkey = n.note.refrk
        nr = {
          type: Note.estG(rkey) ? 7 : 6,
          key,
          rkey,
          children: [n],
        }
        this.setLabel(nr)
        this.map.set(key, nr)
        // On rattache la note de rattachement à sa racine
        this.rattachRac(nr, n.note.refn)
      }
    },

    rattachRac (n, refn) { // n peut être réelle ou fake (rkey donne la clé de sa racine)
      let r = this.map.get(n.rkey) // racine
      if (r) {
        r.children.push(n)
        r.children.sort(Node.sort1)
      } else {
        if (Note.estG(n.rkey)) { // la racine est un groupe
          // création d'un groupe zombi et rattachement à lui
          const x = refn || (n.note ? n.note.refn : '???')
          const r = this.setRacine(n.rkey, 3, refn)
          r.children.push(n)
        }
      }
    },

    setRacine (key, type, nom) { // on ajoute un node pour l'avatar juste à la racine
      let n = this.map.get(key)
      if (!n) {
        n = { 
          nb: 0,
          type,
          key,
          rkey: key,
          label: nom,
          children: []
        }
        this.map.set(key, n)
        this.nodes.push(n)
        this.nodes.sort(Note.sortNodes)
      }
      return n
    },

    setLabel (n) {
      // le label dépend à qui est rattachée la note et si c'est une fake ou non
      let pfx = '', sfx = ''
      if (n.type === 4 && n.note.refrk) {
        if (n.note.refrk !== n.rkey) {
          // note avatar rattachée à une note ayant une racine différente
          pfx = '[' + this.map.get(n.rkey).label + ']'
        } else {
          const nr = this.map.get(n.note.refk)
          // note ratachée à une note ayant un préfixe : reconduction du préfixe
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

    setAvatar (na, type) { // on ajoute un node pour l'avatar juste à la racine
      this.setRacine('' + na.id, 1, na.nom )
    },

    setGroupe (na) { // on ajoute un node pour l'avatar juste à la racine
      this.setRacine('' + na.id, 2, na.nomc)
    },

    delAvatar (id) {
      // TODO
    },

    delGroupe (id) {
      // TODO
    }
  }
})
