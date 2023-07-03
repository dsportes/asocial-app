import { defineStore } from 'pinia'
import { getData, post } from '../app/net.mjs'
import { appexc, AppExc, E_BRO } from '../app/api.mjs'
// import { sleep } from '../app/util'
import stores from './stores.mjs'

export const useFetatStore = defineStore('fetat', {
  state: () => ({
    map: new Map(), // Map des Fetat, clé idf
    /*
      this.id = f.idf
      this.ids = n.id
      this.dhd = new Date().getTime()
      this.dhc = 0
      this.dhx = 0
      this.lg = f.lg
      this.nom = f.nom
      this.info = f.info
      this.type = f.type
      this.ns = n.ids
      this.err = ''
        get estCharge () { return this.dhc !== 0 }
        get enAttente () { return this.dhc === 0 && !this.dhx }
        get enEchec () { return this.dhc === 0 && this.dhx }
    */

    queue: [], // liste ordonnée des idf des fichiers à charger par ordre croissant de leur dhd
    echecs: new Set(), // set des ids des chargements ayant échoué
    encours: 0, // id du fetat dont le chargement est en cours
    dernierFichierCharge: { idf: 0, data: null }
  }),

  getters: {
    getFetat: (state) => { return (idf) => state.map.get(idf) }
  },

  actions: {
    setAny () {
    },

    setQueue (push, splice) {
      if (push) this.queue.push(push); else this.queue.splice(splice, 1)
      this.setAny()
    },

    setEchec (plus, idf) {
      if (plus) this.echecs.add(idf); else this.echecs.delete(idf)
      this.setAny()
    },

    chargementInitial (fetats) { // MAP des fetat au début de session. A charger ou non
      const chec = []
      for(const pk in fetats) {
        const fetat = fetats[pk]
        if (!fetat.suppr) {
          this.map.set(fetat.id, fetat)
          // if (fetat.enAttente) chec.push([fetat.dhd, fetat.id])
          if (!fetat.estCharge) chec.push([fetat.dhd, fetat.id])
        }
      }
      chec.sort((a, b) => { return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0) })
      chec.forEach(x => { this.setQueue(x[1]) })
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
          if (i) this.setQueue(0, i)
        }
      }
      chec.sort((a, b) => { return a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0) })
      chec.forEach(x => { this.setQueue(x[1]) })
      this.startDemon()
    },

    retry (idf) {
      const e = this.map.get(idf)
      if (!e) return
      e.dhx = 0 // en fait c'est déja fait
      e.err = ''
      this.setEchec(false, idf)
      if (this.queue.indexOf(idf) === -1) this.setQueue(idf)
      this.startDemon()
    },

    abandon (idf) {
      this.setEchec(false, idf)
      const i = this.queue.indexOf(idf)
      if (i !== -1) this.setQueue(0, i) // normalement c'est inutile, il ne devrait pas y être
      this.setAny()
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
              /* imputation sur LA COMPTA du compte. idc : id de la compta */
              const idc = session.compteId
              const args = { token: session.authToken, id: e.ids, idf: e.id, idc, vt: e.lg }
              const ret =  await post(null, 'GetUrl', args)
              if (!ret) throw new AppExc(E_BRO, 3, [e.id])
              const url = ret.getUrl
              buf = await getData(url)
              // await sleep(10000)
              // throw 'Ex de test'
            }
            this.setQueue(0, 0)
            if (session.debug) console.log(`OK chargement : ${e.idf} ${e.nom}#${e.info}`)
            e.chargementOK(buf) // Maj IDB de fetat et fdata conjointement
          } catch (ex) {
            e.chargementKO(appexc(ex, 20))
            this.setEchec(true, this.encours)
            this.setQueue(0, 0)
          }
          this.encours = this.queue.length ? this.queue[0] : 0
        }
      }, 10)
    }
  }
})
