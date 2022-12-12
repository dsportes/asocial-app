import { defineStore } from 'pinia'
import { getData } from '../app/net.mjs'
import { appexc } from '../app/api.mjs'

export const useFetatStore = defineStore('fetat', {
  state: () => ({
    map: new Map(), // Map des Fetat, clé id
    queue: [], // liste ordonnée des id des fichiers à charger par ordre croissant de leur dhd
    echecs: new Set(), // set des ids des chargements ayant échoué
    encours: 0, // id du fetat dont le chargement est en cours
    dernierFichierCharge: { idf: 0, data: null }
  }),

  getters: {
    getFetat: (state) => { return (id) => this.map.get(id) }
  },

  actions: {
    chargementInitial (fetats) { // MAP des fetat au début de session. A charger ou non
      const chec = []
      for(const pk in fetats) {
        const fetat = fetats[pk]
        if (!fetat.suppr) {
          this.map.set(fetat.id, fetat)
          if (fetat.enAttente) chec.push([fetat.dhd, fetat.id])
        }
      }
      chec.sort((a, b) => { return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0) })
      chec.forEach(x => { this.queue.push(x[1]) })
      this.startDemon()
    },

    chargementIncremental (fetats) { 
      // ARRAY des fetat ajoutés / modifiés / supprimés par sync ou maj UI
      const chec = []
      for(const fetat of fetats) {
        if (!fetat.suppr) {
          this.map.set(fetat.id, fetat)
          if (fetat.enAttente) chec.push([fetat.dhd, fetat.id])
        } else {
          this.map.delete(fetat.id)
          const i = this.queue.indexOf(fetat.id)
          if (i) this.queue.splice(i, 1)
        }
      }
      chec.sort((a, b) => { return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0) })
      chec.forEach(x => { this.queue.push(x[1]) })
      this.startDemon()
    },

    retry (idf) {
      const e = this.map.get(idf)
      if (!e) return
      e.dhx = 0 // en fait c'est déja fait
      e.err = ''
      this.echecs.delete(idf)
      if (this.queue.indexOf(idf) === -1) this.queue.push(idf)
      this.startDemon()
    },

    abandon (idf) {
      this.echecs.delete(idf)
      const i = this.queue.indexOf(fetat.id)
      if (i) this.queue.splice(i, 1) // normalement c'est inutile, il ne devrait pas y être
    },

    startDemon () {
      if (this.encours || !this.queue.length) return
      this.encours = this.queue[0]
      const session = stores.session
      setTimeout(async () => {
        while (this.encours) {
          const e = this.map.get(this.encours)
          try {
            let buf
            if (this.dernierFichierCharge.idf === e.id) {
              // Il arrive que le fichier demandé soit le dernier chargé
              buf = this.dernierFichierCharge.data
              this.dernierFichierCharge.data = null
              this.dernierFichierCharge.idf = 0
            } else {
              /* imputation sur LA COMPTA de l'avatar courant (s'il y en a) 
              ou sur celle de l'avatar primaire du compte. idc : id de la compta */
              const idc = session.avatarId || session.compte.id
              const args = { sessionId: data.sessionId, id: e.ids, ts: e.ns % 3, idf: e.id, idc, vt: e.lg }
              const r = await get('m1', 'getUrl', args)
              if (!r) throw new AppExc(E_BRO, 3, [Sid(e.id)])
              const url = dec.decode(r)
              buf = await getData(url)
            }
            this.queue.splice(0, 1)
            if (session.debug) console.log(`OK chargement : ${Sid(e.idf)} ${e.nom}#${e.info}`)
            e.chargementOK(buf) // Maj IDB de fetat et fdata conjointement
          } catch (ex) {
            this.echecs.add(this.encours)
            this.queue.splice(0, 1)
            e.chargementKO(appexc(ex))
          }
          this.encours = this.queue.length ? this.queue[0] : 0
        }
      }, 10)
    }
  }
})
