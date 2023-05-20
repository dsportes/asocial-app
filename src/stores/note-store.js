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

    /***************************************************************/
    setNote2 (note) {
      if (!note) return
      const key = note.pk
      let n = this.map.get(key)
      if (n) {
        const ancRef = n.note.reftop // ancienne référence (ref ou id-top)
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
        n.top = p.top
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
      if (!n.children.length) {
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
