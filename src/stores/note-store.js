import { defineStore } from 'pinia'
import { ID } from '../app/api.mjs'
import { Note } from '../app/modele.mjs'

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
      { 
        type: 0,
        key: 'groupes', 
        label: 'Groupes', 
        children: [ ]
      }
    ],

    test: {
      avs: {},
      grs: {}
    }

  }),

  getters: {
    // get de l'entrée Note
    getNode: (state) => { return (id, ids) => {  // id / ids ou pk (id/ids)
        return state.map.get(ids ? (id + '/' + ids) : ('' + id))
      }
    },

    getGroupes: (state) => {
      for(const r of state.nodes) if (r.key === 'groupes') return r
      return null
    }

  },

  actions: {
    setNote (note) {
      if (!note) return
      const key = note.pk
      let n = this.map.get(key)
      if (n) {
        const ancRef = n.note.reftop // ancienne référence (ref ou id-top-)
        n.note = note
        n.label = note.titre
        if (ancRef !== note.reftop) { // n change de place dans l'arbre
          this.detachDuParent(n, ancRef)
          this.rattAuParent(n) // le rattacher à son parent (le nouveau)
        }
      } else {
        // le node n n'est pas dans l'arbre : le créer et l'y installer
        const type = note.ng.estGroupe ? 4 : 3
        n = { key: key, type, label: note.titre, note: note, children: [] }
        this.map.set(key, n)
        this.rattAuParent(n) // le rattacher à son parent
      }
    },

    /* Détacher le node n de son ancien parent ap */
    detachDuParent (n, ap) {
      // enlever n de la liste des children de son ancien node parent
      const p = this.map.get(ap) // peut-être un top node (neo avatar / groupe)
      const nch = []
      p.children.forEach(ch => { if (ch.key !== n.key) nch.push(nch) })
      p.children = nch
      // si le parent était fake et qu'il n'a plus de children, l'enlever de l'arbre
      if (p.tid && !p.children.length) {
        this.map.del(p.key)
        const t = this.map.get(p.tid)
        const tch = []
        t.children.forEach(ch => { if (ch.key !== p.key) tch.push(ch) })
        t.children = tch
      }
    },

    /* Chercher le parent de n:
      - si trouvé : rattacher n
      - si pas trouvé créer un fake et s'y rattacher
    */
    rattAuParent (n) { // chercher le parent de n
      const p = this.map.get(n.note.reftop) // une note ou un top (avatar / groupe)
      if (p) {
        // l'ajouter à liste des children, retrier par label
        p.children.push(n)
        p.children.sort(Node.sort1)
      } else {
        const tid = '' + n.note.id // racine de n
        const t = this.map.get(tid) // top node (avatar ou groupe)
        if (!t) return
        if (n.note.ref) { // si ref existe : créer une note fake, s'y rattacher, rattacher la fake à sa racine
          const type = n.note.rnom ? 4 : 3
          const fnode = { 
            key: n.note.pkref,
            tid,
            type,
            label: n.note.nomFake, 
            note: Note.fake,
            children: [n]
          }
          this.map.set(fnode.key, fnode)
          t.children.push(fnode) // rattacher fake à sa racine
        } else { // rattacher la note à son top node (avatar ou groupe)
          t.children.push(n)
        }
        t.children.sort(Node.sort1)
      }
    },

    delNote (id, ids) {
      const n = this.map.get(id + '/' + ids)
      if (!n) return
      const tid = '' + n.note.id
      const ancRef = n.reftop
      detachDuParent (n, ancRef) // enlève le node n de l'arbre,
      if (n.children.length) {
        this.map.delete(n.pk)
      } else {
        /* S'il a des children : transformation de n en fake et inscription au top */
        const t = this.map.get(tid) // top node (avatar ou groupe)
        if (!t) return
        n.tid = tid
        n.label = n.note.nomFake
        n.note =  Note.fake
        t.children.push(n) // rattachement de fake à sa racine
        t.children.sort(Node.sort1)
      }
    },

    setAvatar (na) { // on ajoute un node pour l'avatar juste à la racine
      const tid = '' + na.id
      const n = this.map.get(tid)
      if (!n) {
        const node = { 
          type: 1,
          key: tid,
          label: na.nom,
          note: Note.fake,
          children: []
        }
        this.map.set(tid, node)
        this.nodes.push(node)
        this.nodes.sort(Note.sortNodes)
      }
    },
    
    delAvatar (id) {
      const tid = '' + id
      this.map.del(tid)
      const nch = []
      this.nodes.forEach(ch => { if (ch.key !== tid) nch.push(ch)})
      this.nodes = nch
      this.nodes.sort(Note.sortNodes)
      // TODO : c'est plus compliqué que ça. 
      // Retirer aussi TOUTES les notes de l'avatar des groupes de l'arbre
    },

    setGroupe (na) {
      const tid = '' + na.id
      const n = this.map.get(tid)
      if (!n) {
        const node = { 
          key: tid,
          type: 2,
          label: na.nom,
          note: Note.fake,
          children: []
        }
        this.map.set(tid, node)
        const g = this.getGroupes
        g.children.push(node)
        g.children.sort(Note.sort1)
      }
    },

    delGroupe (id) {
      // TODO : c'est plus compliqué que ça
      /* il faut collecter toutes les notes qui ne sont pas du groupe (celles des avatars). 
      Ce sont celles dont la ref pointe, soit le groupe, soit une note du groupe,
      bref la tête d'une branche (en dessous de laquelle il n'y a plus que des nodes du même avatar).
      Ce n'est qu'ensuite que cette collection est vide que le groupe peut être détruit.
      Sinon il faut intégrer en children du groupe les notes de cette collection
      */
      const tid = '' + id
      this.map.del(tid)
      const g = this.getGroupes
      const nch = []
      g.children.forEach(ch => { if (ch.key !== tid) nch.push(ch)})
      g.children = nch
      g.children.sort(Note.sort1)
    }
  }
})
