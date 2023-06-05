import { defineStore } from 'pinia'
import { AMJ } from '../app/api.mjs'
import { Note } from '../app/modele.mjs'
import stores from './stores.mjs'

export const useNoteStore = defineStore('note', {
  state: () => ({
    /* 
    key: id + '/' + ids
    value:
      key:
      label: titre de la note ou son ids en B64 si c'est une disparue
      children: liste des nodes enfants
      note: (fake pour une disparue)
        fake : id de l'avatar / groupe pour une note disparue
        ref: key de la note parente
    */
    map: new Map(), // map des nodes

    nodes: [
    ],

    node: null, // node "courant"

    test: { avs: {}, grs: {} }
  }),

  getters: {
    // Pour le node courant
    note: (state) => { return state.node ? state.node.note : null },

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
      return AMJ.diff(auj, n.st)
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
          if (!p.refk) return state.map.get(p.rkey)
          refk = p.refk
        }
      }
    }
  },

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
    label :
      - réelle : titre de la note
      - fake : #idsB64
  type:
    1 : racine avatar
    2 : racine groupe
    3 : racine groupe zombi
    4 5 : note avatar / groupe
    6 7 : note fake avatar / groupe
  */

  actions: {
    setCourant (key) {
      this.node = this.getNode(key)
    },

    setSelected (key) { // $onAction dans PageNotes pour forcer la sélection
      this.setCourant(key) 
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

    setNote (note){
      if (!note) return
      const key = note.key
      let n = this.map.get(key)
      if (!note.ref) { // note rattachée à la racine
        if (n) { // elle existait - remplacement - fake ou pas, elle devient réelle
          if (!n.note) n.type -= 2 // si c'était une fake, elle est réelle
          n.note = note
          n.label = note.titre
        } else {
          // création d'une note réelle à la racine
          n = {
            rkey: note.rkey,
            key: key,
            type: Note.estG(key) ? 5 : 4,
            label: note.titre,
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
          } else { // la note de rattachement existe et est réelle
            n.note = note
            n.label = note.titre
          }
        } else { // la note n'existait pas
          n = {
            rkey: note.rkey,
            key: key,
            type: Note.estG(key) ? 5 : 4,
            label: note.titre,
            note: note,
            children: []
          }
          this.map.set(key, n)
          this.rattachNote(n) // on la rattache à sa note de rattachement
        }
      }
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
          label: n.note.nomFake,
          children: [n],
        }
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

    setAvatar (na, type) { // on ajoute un node pour l'avatar juste à la racine
      this.setRacine('' + na.id, 1, na.nom )
    },

    setGroupe (na) { // on ajoute un node pour l'avatar juste à la racine
      this.setRacine('' + na.id, 2, na.nomc)
    },

    delNote (id, ids) {
      // TODO
    },

    delAvatar (id) {
      // TODO
    },

    delGroupe (id) {
      // TODO
    }
  }
})
