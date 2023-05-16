import { defineStore } from 'pinia'
import { idToSid, splitPK } from '../app/util.mjs'
import { Note } from '../app/modele.mjs'
import { ID } from '../app/api.mjs'

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
        const ancRef = n.note.ref || ('' + n.note.id) // ancienne référence (ref ou id-top-)
        n.note = note
        n.label = note.titre
        if (ancRef !== (note.ref || ('' + note.id))) { // n change de place dans l'arbre
          this.detachDuParent(n, ancRef)
          this.rattAuParent(n) // le rattacher à son parent (le nouveau)
        }
      } else {
        // le node n n'est pas dans l'arbre : le créer et l'y installer
        const type = ID.estGroupe(note.id) ? 4 : 3
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
    rattAuParent (n) { // chercher le parent
      const tid = '' + n.note.id
      const p = this.map.get(n.note.ref || tid) // une note ou un top (avatar / groupe)
      if (p) {
        // l'ajouter à liste des children, retrier par label
        p.children.push(n)
        p.children.sort((a,b) => { return a.label < b.label ? -1 : (a.label === b.label ? 0 : 1)} )
      } else {
        const t = this.map.get(tid) // top node (avatar ou groupe)
        if (n.note.ref) { // si ref existe : créer une note fake, s'y rattacher, rattacher la fake à sa racine
          const fnode = { 
            key: n.note.ref,
            tid,
            label: idToSid(splitPK(n.note.ref).ids),
            note: { texte: '', dh: 0 },
            children: [n]
          }
          this.map.set(fnode.key, fnode)
          if (t) t.children.push(fnode) // rattacher fake à sa racine, sinon perdue, avatar ou groupe lui-même disparu !!!
        } else { // rattacher la note à son top node (avatar ou groupe)
          if (t) {
            t.children.push(n)
            t.children.sort((a,b) => { return a.label < b.label ? -1 : (a.label === b.label ? 0 : 1)} )
          } // sinon perdue, avatar ou groupe lui-même disparu !!!
        }
      }
    },

    delNote (id, ids) {
      const n = this.map.get(id + '/' + ids)
      if (!n) return
      const tid = '' + n.note.id
      const ancRef = n.ref || tid
      /* 
      - enlève le node n de l'arbre, 
      - le transforme en fake
      - l'insère à top
      */
      detachDuParent (n, ancRef)
      n.tid = tid
      n.label = idToSid(n.note.ids)
      n.note =  { texte: '', dh: 0 }
      const t = this.map.get(tid) // top node (avatar ou groupe)
      if (t) t.children.push(n) // rattacher fake à sa racine, sinon perdue, avatar ou groupe lui-même disparu !!!
    },

    sortNodes () {
      this.nodes.sort((a,b) => { 
        if (a.key === 'groupes') return 1
        if (b.key === 'groupes') return -1
        return a.label < b.label ? -1 : (a.label === b.label ? 0 : 1 )
      })
    },

    setAvatar (na) { // on ajoute un node pour l'avatar juste à la racine
      const tid = '' + na.id
      const n = this.map.get(tid)
      if (!n) {
        const node = { 
          type: 1,
          key: tid,
          label: na.nom,
          note: { texte: '', dh: 0 },
          children: []
        }
        this.map.set(tid, node)
        this.nodes.push(node)
        this.sortNodes()
      }
      this.test1 (na)
    },
    
    delAvatar (id) {
      const tid = '' + id
      this.map.del(tid)
      const nch = []
      this.nodes.forEach(ch => { if (ch.key !== tid) nch.push(ch)})
      this.nodes = nch
      this.sortNodes()
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
          note: { texte: '', dh: 0 },
          children: []
        }
        this.map.set(tid, node)
        const g = this.getGroupes
        g.children.push(node)
        g.children.sort((a,b) => { return a.label < b.label ? -1 : (a.label === b.label ? 0 : 1)} )
      }
      this.test1(na)
    },

    delGroupe (id) {
      // TODO : c'est plus compliqué que ça
      /* il faut collecter toutes les notes qui ne sont pas du groupe (celles des avatars). 
      Ce sont celle dont la ref pointe, soit le groupe, soit une note du groupe,
      bref la tête d'une branche (en dessous de laquelle il n'y a plus que des nodes du même avatar).
      Ce n'est qu'ensuite cette collection est vide que le groupe peut être détruit.
      Sinon il faut intégrer en children du groupe les notes de cette collection
      */
      const tid = '' + id
      this.map.del(tid)
      const g = this.getGroupes
      const nch = []
      g.children.forEach(ch => { if (ch.key !== tid) nch.push(ch)})
      g.children = nch
      g.children.sort((a,b) => { return a.label < b.label ? -1 : (a.label === b.label ? 0 : 1)} )
    },

    test1 (na) { // génération de notes de test
      const id = na.id
      // (id, ids, ref, texte, dh, v1, v2)
      const n1 = new Note()
      n1.initTest(id, 101, null, '##Ma note 1', new Date().getTime(), 10, 12)
      this.setNote(n1)
      const n2 = new Note()
      n2.initTest(id, 102, n1.id + '/' + n1.ids, 'Ma note 2 bla bla bla bla bla\nbla bla bla bla', new Date().getTime(), 8, 0)
      this.setNote(n2)
      const n3 = new Note()
      n3.initTest(id, 103, n1.id + '/' + n1.ids, 'Ma tres belle note 3 bla bla bla bla bla\nbla bla bla bla', new Date().getTime(), 8, 0)
      this.setNote(n3)
      const n4 = new Note()
      n4.initTest(id, 104, n2.id + '/' + n2.ids, 'Ma tres belle note 4 bla bla bla bla bla\nbla bla bla bla', new Date().getTime(), 8, 0)
      this.setNote(n4)
    }
  }

})
