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

export const useListeContactsStore = defineStore('listeContacts', {
  state: () => ({
    /* critères de sélection
    - cf: 1 "contient", 2 "commence par"
    - contient: si non '', ce texte doit être contenu dans nom
    */
    filtre: { cf: 1, txt: '' },
    
    /* code du critère de tri
    - 1 : ascendant par nom
    - 2 : descendant par nom
    */
    tri: 1,

    base: [], // liste maximale non triée des items : absence de filtre
    liste : [], // liste issue de base, filtrée et triée

    /* Nombres d'actions ayant modifié "base" depuis son dernier calcul
    - 0 : base est à jour
    - >0 : il faut lancer calculBase(), mais quand on veut et si on veut le dernier état
    */
    modifs: 0 // true tant que la "base" n'a pas besoin d'être recalculée
  }),

  getters: {
  },

  actions: {
    setFiltre (cf, txt) { // mise à jour du filtre
      this.filtre.txt = txt
      this.filtre.cf = cf
      this.filtrer()
      this.trier()
    },

    setTri (critere) {
      if (this.tri !== critere) {
        this.tri = critere
        this.trier()
      }
    },

    calculBase () {
      const people = stores.people
      this.base.length = 0 // on NE REMPLACE PAS base, on la vide et on la remplit
      // Dans ce cas le "calcul" est très simple
      const m = people.map
      Array.from(m.values()).forEach(x => { this.base.push(x) })
      this.filtrer()
      this.trier()
      this.modifs = 0

      people.$onAction(({ name, args, after }) => {
        after((result) => {
          this.modifs++
        })
      })
    },

    filtrer () {
      this.liste.length = 0 // on NE REMPLACE PAS liste, on la vide et on la remplit
      const cf = this.filtre.cf
      const t = this.filtre.txt
      this.base.forEach(x => {
        if (t) {
          if (cf === 1) {
            if (x.na.nom.indexOf(t) !== -1) this.liste.push(x)
          } else {
            if (x.na.nom.startsWith(t)) this.liste.push(x)
          }
        } else this.liste.push(x)
      })
    },

    tri1 (a, b) { return a.na.nom < b.na.nom ? -1 : (a.na.nom > b.na.nom ? 1 : 0) },
    tri2 (a, b) { return a.na.nom > b.na.nom ? -1 : (a.na.nom < b.na.nom ? 1 : 0) },

    trier () {
      const f = [null, this.tri1, this.tri2]
      this.liste.sort(f[this.tri]) // on NE REMPLACE PAS liste, on la trie sur place
    }
  }
})
