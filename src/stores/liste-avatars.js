import { defineStore } from 'pinia';
import stores from './stores.mjs'

// avatar : { avatar: avatar, cv: null, grIds: new Set(), cpIds: new Set(), secrets: new Map() }

/* Paramètres de $onAction
  name, // name of the action
  store, // store instance, same as `someStore`
  args, // array of parameters passed to the action [id, n]
  after, // hook after the action returns or resolves
  onError // hook if the action throws or rejects
*/

export const useListeAvatarsStore = defineStore('listeAvatars', {
  state: () => ({
    liste : [], // liste de base triée

    /* Nombres d'actions ayant modifié "liste" depuis son dernier calcul
    - 0 : base est à jour
    - >0 : il faut lancer calculBase(), mais quand on veut et si on veut le dernier état
    */
    modifs: 0 // true tant que la "liste" n'a pas besoin d'être recalculée
  }),

  getters: {
  },

  actions: {
    calculBase () {
      const avatar = stores.avatar
      this.liste.length = 0 // on NE REMPLACE PAS liste, on la vide et on la remplit
      // Dans ce cas le "calcul" est très simple
      const m = avatar.map
      Array.from(m.values()).forEach(x => { this.liste.push(x) })
      this.trier()
      this.modifs = 0

      avatar.$onAction(({ name, args, after }) => {
        const actions = new Set(['setAvatar', 'setCompta', 'setCv', 'del'])
        after((result) => {
          if (actions.has(name)) this.modifs++
        })
      })
    },

    tri1 (x, y) {
      const a = x.avatar
      const b = y.avatar
      if (a.estPrimaire) return -1
      if (b.estPrimaire) return 1
      const anom = a.na.nom
      const bnom = b.na.nom
      return anom < bnom ? -1 : (anom > bnom ? 1 : 0) 
    },

    trier () {
      this.liste.sort(this.tri1) // on NE REMPLACE PAS liste, on la trie sur place
    }
  }
})
