import { defineStore } from 'pinia'
import { splitPK, toRetry } from '../app/util.mjs'
import { getData } from '../app/net.mjs'

export const useFicavStore = defineStore('ficav', {
  state: () => ({
    map: new Map(), // Map des ficav : clé idf
    keys: new Map() // Clé: key d'une note: value: Set des idf des fichiers attachés à cette note
  }),

  getters: {
    session: (state) => stores.session,
    nSt: (state) => stores.note,

    mapDeNote: (state) => { return (key) => {
        const m = new Map()
        const lf = state.keys(key)
        if (lf) lf.forEach(f => { m.set(f.id, state.map.get(f.id))})
        return m
      }
    },

    sidfDeNom: (state) => { return (key, nom) => {
        const s = new Set()
        const lf = state.keys(key)
        if (lf) lf.forEach(f => { if (f.nom === nom) s.add(f.id)})
        return s
      }
    },

    mapDeNoteC: (state) => {
      const nc = state.nSt.note
      return nc ? state.mapDeNote(nc.key) : new Map()
    },

    queue: (state) => {
      const l = []
      for(const [idf, f] of state.map)
        if (f.dhdc && (!f.nbr || toRetry(f.nbr, f.dhdc))) l.push(f)
      l.sort((a,b) => { return a.dhdc < b.dhdc ? -1 : ( a.dhdc > b.dhdc ? 1 : 0)})
      return l
    }
  },

  actions: {
    setFicav (f) {
      this.map.set(f.id, f)
      let e = this.keys.get(f.key); if (!e) { e = new Set(); this.keys.set(f.key, e) }
      e.add(f.id)
    },
    
    delFicav (idf) {
      const f = this.map.get(idf)
      if (f) {
        const e = this.keys.get(f.key)
        if (e) {
          e.delete(idf)
          if (!e.size) this.keys.delete(f.key)
        }
      }
    },

    // Positionne ou enlève l'indicateur d'un fichier demandant que CETTE version soit gardée
    setAV (note, idf, av) {
      const nf = note.mfa[idf]
      const nom = nf.nom
      const idfr = note.idfDeNom(nom) // idf du fichier le plus récent de ce nom
      let af = this.map.get(idf)
      const sidfDeNom = this.sidfDeNom(note.key, nom)
      let avn = false // Garder la version la plus récente pour ce nom 
      sidfDeNom.forEach(idf => { const x = this.map.get(idf); if (x && x.avn) avn = true})

      if (av) { // If faut garder cette version spécifiquement
        if (af) { // déjà connue
          if (af.av) return // rien de nouveau
          // mais pas enregistrée pour garder CETTE version
          af.av = true // Chargement demandé
          av.dhdc = Date.now()
          av.nbr = 0
          av.exc = null
          this.save([af])
        } else { // pas connue: créer cet entrée pour enregistrer la demande
          af = Ficav.fromNote(note, idf, true, avn) // création
          this.setFicav(af)
          this.save([af])
        }
      } else { // Il NE FAUT PAS garder cette version spécifiquement
        if (af) { // était connue
          // Faut-il garder cette entrée ?
          if (!avn || (sidfDeNom.size === 1 && sidfDeNom.has(idf))) {
            this.delFicav(idf)
            this.save([], [idf])
          } else {
            av.af = false
            this.save([af])
          }
        } else return // N'était pas enregistrée et n'a toujours pas à l'être
      }
    },

    setNote (note, buf) {
      const m = this.mapDeNote(note.key)

      const mn = new Map() // map des ficav de même nom - clé: nom, valeur: set des idf
      for (const [idf, f] of m) {
        let e = mn.get(f.nom); if (!e) { e = new Set(); mn.set(f.nom, e) }; e.add(idf)
      }

      const mfan = new Map() // map des fichiersde la de même nom - clé: nom, valeur: set des idf
      for (const [idf, f] of mfa) {
        let e = mn.get(f.nom); if (!e) { e = new Set(); mfan.set(f.nom, e) }; e.add(idf)
      }

      const mfa = note.mfa
      for (const [idf, nf] of mfa) {
        if (!m.has(idf)) { // Traiter le cas d'un nouveau fichier
          
        }
      }
      for (const [idf, f] of m) {
        if (!mfa.has(idf)) { // Traiter le cas d'un fichier disparu
          buf.purgeFIDB(idf)
          this.delFicav(idf)
        }
      }
      
    },

    // Suppression d'une note
    delNote (id, ids, buf) {
      const k = id + '/' + ids
      const lf = this.keys.get(k)
      if (lf) for(const idf of lf) {
        this.map.delete(idf)
        buf.purgeFIDB(idf)
      }
      this.keys.delete(k)
    },

    // Suppression de toutes les notes de l'avatar ou du groupe id
    delNotes (idag, buf) {
      for(const [k, lf] of this.keys) {
        const [id, ids] = splitPK(k)
        if (id === idag) lf.forEach(idf => { 
          this.map.delete(idf)
          buf.purgeFIDB(idf)
        })
        this.keys.delete(k)
      }
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
              const args = { token: session.authToken, id: e.ids, idf: e.id, vt: e.lg }
              const ret =  await post(null, 'GetUrlNf', args)
              const url = ret.getUrl
              buf = await getData(url)
              // await sleep(10000)
              // throw 'Ex de test'
            }
            this.setQueue(0, 0)
            if (stores.config.DEBUG) console.log(`OK chargement : ${e.idf} ${e.nom}#${e.info}`)
            await e.chargementOK(buf) // Maj IDB de fetat et fdata conjointement
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
