import { defineStore } from 'pinia'

export const useAvnoteStore = defineStore('avnote', {
  state: () => ({
    map: new Map()
    /* Map(id) est une Map(ids)
    Identifiant : `[id, ids]` - id d'une note
    - Propriétés :
      - `lidf` : liste des identifiants des fichiers explicitement cités par leur identifiant comme étant souhaité _hors ligne_.
      - `mnom` : une map ayant,
        - _clé_ : `nom` d'un fichier dont le compte a souhaité disposer de la _version la plus récente_ hors ligne.
        - _valeur_ : `idf`, identifiant de cette version constaté dans l'état le plus récent de la note.
    */
  }),

  getters: {
    getIds: (state) => { return Array.from(state.map.keys()) },
    
    getAvnote: (state) => { return (id, ids) => {
        const e = this.map.get(id)
        if (!e) return null
        return e.get(ids)
      }
    },

    /* Avnotes d'une id */
    getAvnotes: (state) => { return (id) => {
        const e = this.map.get(id)
        const r = []
        if (!e) return r
        return Array.from(e.keys())
      }
    }
  },

  actions: {
    setAvnote (avnote) {
      let e = this.map.get(avnote.id)
      if (e) {
        if (avnote.suppr) {
          e.delete(avnote.ids)
          if (!e.size) this.map.delete(avnote.id)
        } else e.set(avnote.ids, avnote)
      } else {
        if (avnote.suppr) return
        e = new Map(); 
        this.map.set(avnote.id, e)
        e.set(avnote.ids, avnote)
      }
    },

    del (id, ids) {
      const e = this.map.get(id)
      if (!e) return
      e.delete(ids)
      if (!e.size) delete this.map.delete(id)
    }
  }
})
