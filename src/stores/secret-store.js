import { defineStore } from 'pinia';

export const useSecretStore = defineStore('secret', {
  /*
  map : une entrée par pk de secret (id/ns) qui donne l'objet secret
  voisins : pour chaque secret ayant une ref ([id, ns]) référence vers son secret voisin
  */
  state: () => ({
    map: new Map(),
    voisins: new Map()
  }),

  getters: {
    getSecret: (state) => {
      return (id, ns) => {
        return this.map.get(id + '/' + ns)
      }
    },
    /*
    Retourne la liste des couples [id, ns] des ids des secrets du voisinage du secret,
    - les secrets ayant [id, ns] comme référence de voisinage,
    - le secret, s'il existe, d'id [id, ns], celui tête de voisinage
    */
    getVoisins: (state) => {
      return (secret) => {
        const e = this.voisins.get(secret.id + '/' + secret.ns)
        const r = []
        if (!e) return r
        e.forEach(pk => {
          const i = pk.indexOf('/')
          r.push([parseInt(s.substring(0, i)), parseInt(s.substring(i + 1))])
        })
        return r
      }
    },
  },

  actions: {
    /*
    Enregistre le secret.
    S'il a une référence de voisinage :
    - enregistre dans voisins son [id, ns]
    - enregistre, s'il n'y étatit pas déjà, la tête de voisinage (s'il existe dans le store)
    s'il n'en n'a pas :
    - s'inscrit dans la liste de voisinage de sa propre clé (en tant que "tête" de voisinage)
    mais ne créé pas ce voisinage s'il est seul à y figurer.
    */
    setSecret (secret) {
      const pk = secret.id + '/' + secret.ns
      this.map.set(pk, secret)
      const pkref = secret.ref ? secret.ref[0] + '/' + secret.ref[1] : null
      if (pkref) {
        const e = this.voisins.get(pkref)
        if (!e) { e = new Set(); this.voisins.set(pkref, e) }
        e.add(pk)
        if (!e.has(pkref)) {
          // le secret de référence N'EST PAS ENCORE lui-meme dans sa liste de voisinage
          const secref = this.map.get(pkref)
          if (secref) {
            // le secret de référence existe : on l'ajoute à son voisinage
            e.add(pkref)
          }
        }
      }
    },
    delSecret (id, ns) {
      const pk = secret.id + '/' + secret.ns
      const x = this.map.get(pk)
      if (!x) return
      const pkref = x.ref ? x.ref[0] + '/' + x.ref[1] : null
      if (pkref) {
        const e = this.voisins.get(pkref)
        if (e) {
          e.delete(pk)
          if (e.size === 1) {
            const pkx = e.values().next().value
            if (pkx === pkref) {
              // le seul restant dans le voisinage est le seret de réfrence du voisinage
              // on peut supprimer le voisinage
              this.voisins.delete(pkref)
            }
          }
        }
      }
      this.map.delete(pk)
    }
  }
})
