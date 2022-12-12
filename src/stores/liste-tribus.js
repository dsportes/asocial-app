import { defineStore } from 'pinia';
import stores from './stores.mjs'

// people : { na: na, cv: null, mbIds: new Set(), cpIds: new Set() }

/* Paramètres de $onAction
  name, // name of the action
  store, // store instance, same as `someStore`
  args, // array of parameters passed to the action [id, n]
  after, // hook after the action returns or resolves
  onError // hook if the action throws or rejects
*/

export const useListeTribusStore = defineStore('listeTribus', {
  state: () => ({
    /* critères de sélection
    - cf: 1 "contient", 2 "commence par"
    - contient: si non '', ce texte doit être contenu dans nom
    */
    filtre: { opt: 'c', txt: '', bloquee: false },

    idx: 0,
    id: 0,

    base: [], // liste maximale non triée des items : absence de filtre
    liste : [], // liste issue de base, filtrée

    /* Nombres d'actions ayant modifié "base" depuis son dernier calcul
    - 0 : base est à jour
    - >0 : il faut lancer calculBase(), mais quand on veut et si on veut le dernier état
    */
    modifs: 0 // true tant que la "base" n'a pas besoin d'être recalculée
  }),

  getters: {
    fin: (state) => { return state.liste.length },
    aSuivant: (state) => { return state.idx < state.liste.length - 1 },
    aPrecedent: (state) => { return state.idx > 0 },
    estVide: (state) => { return state.liste.length === 0},
    courante: (state) => { return state.estVide ? null : state.liste[state.idx] }
  },

  actions: {
    setIdx (idx) {
      const x = this.liste[idx]
      if (x) {
        this.idx = idx
        this.id = x.id
      }
    },
    suivant () {
      if (this.aSuivant) {
        this.idx++
        this.id = this.liste[this.idx].id
      }
    },
    precedent () {
      if (this.aPrecedent) {
        this.idx--
        this.id = this.liste[this.idx].id
      }
    },
    premier () {
      if (!this.estVide) {
        this.idx = 0
        this.id = this.liste[0]
      }
    },
    dernier () {
      if (!this.estVide) {
        this.idx = this.liste.length - 1
        this.id = this.liste[this.idx]
      }
    },
    reposId () {
      this.idx = -1
      if (this.id) {
        for (let i = 0; i < this.liste.length; i++) {
          if (this.liste[i].id === this.id) { this.idx = i; break }
        }
      }
      if (this.idx === -1 && this.liste.length > 0) this.idx = 0
    },
    setFiltre (opt, txt, bloquee) { // mise à jour du filtre
      this.filtre.txt = txt
      this.filtre.opt = opt
      this.filtre.bloquee = bloquee
      this.filtrer()
    },

    calculBase () {
      const tribu = stores.tribuStore
      this.base.length = 0 // on NE REMPLACE PAS base, on la vide et on la remplit
      // Dans ce cas le "calcul" est très simple
      const m = tribu.map
      Array.from(m.values()).forEach(x => { this.base.push(x) })
      this.filtrer()
      this.modifs = 0
      tribu.$onAction(({ name, args, after }) => {
        after((result) => {
          this.modifs++
        })
      })
    },

    filtrer () {
      this.liste.length = 0 // on NE REMPLACE PAS liste, on la vide et on la remplit
      const opt = this.filtre.cf
      const t = this.filtre.txt
      const b = this.filtre.bloquee
      this.base.forEach(x => {
        let ok = false
        if (t) {
          if (opt === 'c') {
            if (x.na.nom.indexOf(t) !== -1) ok = true
          } else {
            if (x.na.nom.startsWith(t)) ok = true
          }
        } else ok = true
        if (ok) {
          if (!b || (b && x.blocage)) this.liste.push(x)
        }
      })
      this.reposId ()
    },
  }
})
