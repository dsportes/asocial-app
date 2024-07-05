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

    // Retourne la liste des ficav de cette note et ce nom dans l'ordre décroissant des dh
    lfDeNom: (state) => { return (note, nom) => {
        const l = []
        const lf = state.keys.get(note.key)
        if (lf) lf.forEach(idf => { 
          const f = state.map.get(idf)
          if (f.nom === nom) l.push[f]
        })
        l.sort((a,b) => { return a.dh > b.dh ? -1 : (a.dh < b.dh ? 1 : 0) })
        return l
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
    async loadFicav (lfav) { // mf: Map - clé:idf, valeur: ficav
      const buf = new IDBbuffer()
      lfav.sort((a,b) => { // Tri par note / nom / dh décroissante
        a.key < b.key ? -1 : (a.key > b.key ? 1 :
          (a.nom < b.nom ? - 1 : (a.nom > b.nom ? 1 :
            (a.dh > b.dh ? -1 : (a.dh < b.dh ? 1 : 0)))))
      })
      const m = new Map() // clé: note (key) - valeur Map (clé: nom, valeur: liste des ficav par dh)
      for (const [idf, f] of mf) {
        const node = this.nSt.map.get(f.key)
        if (!node || !node.note || node.note.fnom.has(f.nom)) { 
          // note absente ou pas ce nom dans la note, suppression du ficav de IDB
          buf.purgeFIDB(idf)
          continue
        }
        let e1 = m.get(f.key); if (!e1) { e1 = new Map(); m.set(f.key, e1) }
        let e2 = e1.get(f.nom); if (!e2) { e2 = []; e1.set(f.nom, e2) }
        e2.unshift(f)
      }

      for (const [key, m1] of m) {
        const node = this.nSt.map.get(key)
        const note = node.note
        if (!note) continue
        for (const [nom, m2] of m1) {
          const lnom = note.fnom.get(nom) // fichiers de la note ayant ce nom
          const df = lnom[0] // fichier le plus récent de ce nom dans la note
          const avn = m2[0].avn // Il faut garder le ficav le plus récent : df.idf
          for(const fa of m2) {
            

          }
        }
      }

        const note = node.note
        const setAvn = new Set() // Set des noms dont il faut garder le fichier le plus récent
        for (const [, f] of mf) if (f.key === note.key && f.avn) setAvn.add(f.nom)
  
        // const lnom = note.fnom.get(f.nom) // fichiers de la note ayant ce nom

        const nf = note.mfa[idf] // son entrée dans la note
        if (!nf) { // N'existe plus dans la note : CE ficav désormais inutile N'EST PAS enregistré et purgé de IDN
          buf.purgeFIDB(idf)
          const df = lnom[0] // idf du fichier le plus récent de ce nom dans la note
          if (f.avn && df.id === f.id) { // MAIS il faut garder la dernière version pour ce nom
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

    // Invoqué depuis UI. L'utilisateur positionne ou enlève les indicateurs d'un fichier
    async setAV (note, nom, avn, idf, av) { // si av, idf indique pour lequel
      const maj = []
      const del = []
      const lnom = note.fnom.get(nom) // liste des fichiers de note ayant ce nom
      let lfa = this.lfDeNom(note, nom) // liste des ficav de ce nom

      if (!lnom.length) { // nom inconnu dans note - supprimer tous les ficav de ce nom
        lfa.forEach(fa => { del.push(fa.id); this.delFicav(fa.id) })
        await this.save(maj, del)
        return
      }

      // Nettoyage des ficav ne correspondant plus à un fichier de la note
      lfa.forEach(fa => { if (!note.mfa.has(fa.id)) { del.push(fa.id); this.delFicav(fa.id) }})

      lfa = this.lfDeNom(note, nom) // lfa est recalculée après nettoyage

      if (avn) { // garder ou inscrire son ficav avec avn
        const df = lnom[0]
        let fa = this.map.get(df.idf) // ficav du plus récent (dans note) pour ce nom
        if (!fa) { // le plus récent n'était pas inscrit en ficav 
          fa = Ficav.fromNote(note, df.idf, av && df.id === idf, true) // création
          this.setFicav(fa)
          maj.push(fa)
        } else { // le ficav du plus récent existait
          if (!fa.avn || (fa.idf === idf && fa.av !== av)) { // ses indicateurs peuvent avoir besoin d'être mis à jour
            if (fa.idf === idf) fa.av = av
            fa.avn = true
            this.setFicav(fa)
            maj.push(fa)
          }
        }
        lfa = this.lfDeNom(note, nom) // lfa est recalculée après ajout / maj du plus récent
      }

      // Mettre à jour les av des ficav
      lfa.forEach(fa => {
        if (fa.id === idf && fa.av !== av) { // normalement ceux mis à jour ci-dessus ont déjà leur av à jour
          fa.av = av
          this.setFicav(fa)
          maj.push(fa)
        }
      })

      await this.save(maj, del)
    },

    // En régime établi (synchro) alors que IDB a été chargé
    setNote (note, idbuf) {
      if (!this.session.ok || !this.session.accesIdb) return
      let m = this.mapDeNote(note.key) // map des ficav relatifs à cette note

      // suppression des ficav ayant des noms inconnus de la note
      m.forEach(idf => {
        const fa = this.map.get(idf)
        if (!note.fnom.has(fa.nom)) {
          idbuf.purgeFIDB(fa.id)
          this.delFicav(fa.id)
        }
      })

      // Pour chaque nom existant dans la note ...
      for (const [nom, lnom] of note.fnom) {
        let lfa = this.lfDeNom(note, nom) // liste des ficav de ce nom
        let avn = false; lfa.forEach(fa => { if (fa.avn) avn = true})
        if (avn) {
          const df = lnom[0]
          let fa = this.map.get(df.idf) // ficav du plus récent (dans note) pour ce nom
          if (!fa) { // le plus récent n'était pas inscrit en ficav 
            fa = Ficav.fromNote(note, df.idf, false, true) // création
            this.setFicav(fa)
            idbuf.putFIDB(fa)
          } else { // le ficav du plus récent existait
            if (!fa.avn) { // son indicateur avn peut avoir besoin d'être mis à jour
              fa.avn = true
              this.setFicav(fa)
              idbuf.putFIDB(fa)
            }
          }
        }

        // suppression des autres ficav éventuellement inutiles
        lfa.forEach(fa => {
          const nf = note.map.get(fa.idf)
          if (!nf) { // fa inutile
            idbuf.purgeFIDB(fa.id)
            this.delFicav(fa.id)  
          } // sinon était utile, inchangé
        })
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
