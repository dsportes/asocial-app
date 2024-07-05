import { defineStore } from 'pinia'
import { splitPK } from '../app/util.mjs'
import { getData } from '../app/net.mjs'
import { IDBbuffer, idb } from '../app/db.mjs'
import { Ficav } from '../app/modele.mjs'

export const useFicavStore = defineStore('ficav', {
  state: () => ({
    map: new Map(), // Map des ficav : clé idf
    keys: new Map(), // Clé: key d'une note: value: Set des idf des fichiers attachés à cette note
    queue: new Set() // set des idf des fichiers à charger
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

    // Fichiers à charger par dhdc croissantes
    getQueue: (state) => {
      const l = []
      for(const idf of state.queue) {
        const f = state.map.get(idf)
        if (f) l.push(f)
      }
      l.sort((a,b) => { return a.dhdc < b.dhdc ? -1 : ( a.dhdc > b.dhdc ? 1 : 0)})
      return l
    }
  },

  actions: {
    setFicav (f) {
      if (f.dhdc && !state.queue.has(f.idf)) state.queue.add(f.idf)
      if (!f.dhdc && state.queue.has(f.idf)) state.queue.delete(f.idf)
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
      state.queue.delete(f.idf)
    },

    /* Chargement depuis IDB: lf est la liste des ficav enregistrés en IDB. Pour chacun:
    - si la note n'existe plus, NON enregistrement du ficav et purge du ficav et de la data du fichier le cas échéant
    - si la note existe MAIS PAS ce fichier,
      - il ne faut pas enregistrer ce ficav et le purger de IDB
      - mais si ce ficav spécifiait de garder le version la plus récente de ce nom, il faut,
        - soit récupérer ce ficav depuis IDB,
        - soit en créer un à charger 
    */
    async loadFicav (mf) { // mf: Map - clé:idf, valeur: ficav
      const buf = new IDBbuffer()
      for (const [idf, f] of mf) {
        const node = this.nSt.map.get(f.key)
        if (!node || !node.note) { // note absente, suppression du ficav de IDB
          buf.purgeFIDB(idf)
          continue
        } 
        const nf = n.note.mfa[idf] // son entrée dans la note
        if (!nf) { // N'existe plus dans la note : CE ficav désormais inutile N'EST PAS enregistré et purgé de IDN
          buf.purgeFIDB(idf)
          const idfr = n.note.idfDeNom(f.nom) // idf du fichier le plus récent de ce nom dans la note
          if (f.avn && idfr) { // MAIS il faut garder la dernière version pour ce nom
            if (!state.map.has(idfr)) { // Ce fichier n'est PAS (encore) été enregistré, il faut le faire
              let af = mf.get(idfr) // existait-il un ficav pour idfr ?
              if (!af) af = Ficav.fromNote(n.note, f.id, false, true) // NON : création à charger
              this.setFicav(af)
              buf.putFIDB(af)
            } // sinon il l'a été auparavent dans cette boucle
          }
        } else { // enregistrement du ficav
          this.setFicav(f)
        }
      }
      await buf.commit()
      this.startDemon()
    },

    async save (maj, del) {
      const buf = new IDBbuffer()
      for(const f of maj) buf.putFIDB(f)
      for(const idf of del) buf.purgeFIDB(idf)
      await buf.commit()
      if (maj.length) this.startDemon()
    },

    // Invoqué depuis UI
    async retry (idf) {
      const f = this.map.get(idf)
      if (f) {
        f.dhdc = Date.now()
        f.exc = null
        f.nbr = 0
        this.setFicav (f)
        await this.save([f])
      }
    },

    // Invoqué depuis UI
    async cancel (idf) {
      const f = this.map.get(idf)
      if (f) {
        this.delFicav (f)
        await this.save([], [idf])
      }
    },

    // Invoqué depuis le démon
    async ok (idf, data) {
      const f = this.map.get(idf)
      if (f) {
        f.dhdc = 0
        f.exc = null
        f.nbr = 0
        this.setFicav (f)
        await idb.setFa(f, data)
      }
    },

    // Invoqué depuis le démon
    async ko (idf, exc, delaisec) {
      const f = this.map.get(idf)
      if (f) {
        f.dhdc = Date.now() + (delaisec * 1000) // retry dans 1 minute
        f.exc = exc
        f.nbr++
        this.setFicav (f)
        await idb.setFa(f, data)
      }
    },

    // Invoqué depuis UI. L'utilisateur positionne ou enlève l'indicateur d'un fichier demandant que CETTE version soit gardée
    async setAV (note, idf, av) {
      const nf = note.mfa[idf]
      const nom = nf.nom
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
          await this.save([af])
        } else { // pas connue: créer cet entrée pour enregistrer la demande
          af = Ficav.fromNote(note, idf, true, avn) // création
          this.setFicav(af)
          await this.save([af])
        }
      } else { // Il NE FAUT PAS garder cette version spécifiquement
        if (af) { // était connue
          // Faut-il garder cette entrée ?
          if (!avn || (sidfDeNom.size === 1 && sidfDeNom.has(idf))) {
            this.delFicav(idf)
            await this.save([], [idf])
          } else {
            av.af = false
            await this.save([af])
          }
        } else return // N'était pas enregistrée et n'a toujours pas à l'être
      }
    },

    // Invoqué depuis UI. L'utilisateur positionne ou enlève l'indicateur d'un fichier demandant que LA VERSION LA PLUS RECENTE soit gardée
    async setAVN (note, nom, av) {
      const sidfDeNom = this.sidfDeNom(note.key, nom)
      let avn = false // Garder la version la plus récente pour ce nom 
      sidfDeNom.forEach(idf => { const x = this.map.get(idf); if (x && x.avn) avn = true})
      const maj = []
      const del = []
      if (av) { // le mettre partout, ajouter si nécessaire l'entrée idfr
        const idfr = note.idfDeNom(nom) // idf du fichier le plus récent de ce nom
        // let af = this.map.get(idfr)
        sidfDeNom.forEach(idf => {
          const af = this.map.get(idf)
          if (af) { // normalement af existe toujours ici
            if (af.id !== idfr && !af.an) { // entrée inutile
              this.delFicav(idf)
              del.push[idf] 
            } else {
              if (!af.avn) { // entrée utile déjà enregistrée à mettre à jour et déjà enregistrée
                af.avn = true
                maj.push(af)
              } // sinon, était déjà à jour
            }
          }
        })
        let af = this.map.get(idfr)
        if (!af) { // cette entrée n'existait pas, elle doit être créée
          af = Ficav.fromNote(note, idfr, false, true) // création
          this.setFicav(af)
          this.maj.push(af)
        }
      } else { // l'enlever partout, supprimer l'entrée (ou les) inutiles
        sidfDeNom.forEach(idf => {
          const af = this.map.get(idf)
          if (af) { // normalement af existe toujours ici
            if (af.avn) {
              if (!af.av) { // entrée inutile
                this.delFicav(idf)
                del.push[idf] 
              } else {
                af.avn = false
                maj.push(af)
              }
            } else {
              if (!af.av) { // entrée inutile, mais normalement ce cas n'est pas possible
                this.delFicav(idf)
                del.push[idf] 
              }
              // sinon, rien n'a changé pour cette entrée
            }
          }
        })
      }
      if (maj.length || del.length) await this.save(maj, del)
    },

    // En régime établi (synchro) alors que IDB a été chargé
    setNote (note, buf) {
      if (!this.session.ok || !this.session.accesIdb) return
      const m = this.mapDeNote(note.key) // map des ficav relatifs à cette note. MAINTENUE A JOUR dans cette méthode

      for (const [idf, nf] of note.mfa) {
        let fx = null // ficav de version la plus récente de ce nom. Si fx null, nouveau nom
        for(const idf of m) { const f = this.map.get(idf); if (f.nom === nf.nom && (!fx || fx.dh < f.dh)) fx = f } 

        let fy = nf // fichier de la note de version la plus récente de ce nom (fy n'est jamais null)
        for(const [, f] of note.mfa) { if (f.nom === nf.nom && (fy.dh < f.dh)) fy = f } 

        const fav = m.get(idf) // ficav associé à nf

        if (!fav) { // Cas d'un nouveau fichier, nouveau nom ou nom existant
          if (!fx || nf.dh <= fy.dh) continue // nouveau nom OU nf n'est pas la dernière version pde ce nom pour cette note
        } else { // le fichier nf (idf) existe dans la note ET a un ficav fav
          if (!fav.avn) continue // (fav.av est true . Rien de nouveau, la version spécifique est toujours requise
          if (fx && fx.dh >= fy.dh) continue // elle est déjà enregistrée par fx
        }

        if (fx && !fx.av) { // le ficav actuel le plus récent du nom (s'il existe) N'EST PLUS requis (av est false)
          this.delFicav(fx.idf)
          buf.purgeFIDB(fx.idf)
          m.delete(fx.idf)
        }
        // Inscription d'un nouveau ficav avec avn
        const af = Ficav.fromNote(note, idf, false, true)
        this.setFicav(af)
        buf.putFIDB(af)
        m.set(idf, af)
      }

      // Fichiers ayant un ficav ...
      for (const [idf, f] of m) {
        if (!note.mfa.has(idf)) { // dont l'idf n'est PLUS existant dans la note
          buf.purgeFIDB(idf)
          this.delFicav(idf)
        } // else : le cas a été traité ci-dessus - fichier existant dans la note ET ayant un ficav
      }
      
    },

    // En régime établi (synchro) alors que IDB a été chargé, suppression d'une note
    delNote (id, ids, buf) {
      if (!this.session.ok || !this.session.accesIdb) return
      const k = id + '/' + ids
      const lf = this.keys.get(k)
      if (lf) for(const idf of lf) {
        this.delFicav(idf)
        buf.purgeFIDB(idf)
      }
      this.keys.delete(k)
    },

    // En régime établi (synchro) alors que IDB a été chargé, suppression d'un avatar ou d'un groupe idag
    delNotes (idag, buf) {
      if (!this.session.ok || !this.session.accesIdb) return
      for(const [k, lf] of this.keys) {
        const [id, ] = splitPK(k)
        if (id === idag) lf.forEach(idf => { 
          this.delFicav(idf)
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
