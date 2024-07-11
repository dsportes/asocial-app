import { defineStore } from 'pinia'

import stores from './stores.mjs'
import { splitPK } from '../app/util.mjs'
import { getData } from '../app/net.mjs'
import { appexc } from '../app/api.mjs'
import { IDBbuffer, idb } from '../app/db.mjs'
import { Ficav } from '../app/modele.mjs'

const delaisec = 60

export const useFicavStore = defineStore('ficav', {
  state: () => ({
    map: new Map(), // Map des ficav : clé idf
    keys: new Map(), // Clé: key d'une note: value: Set des idf des fichiers attachés à cette note
    queue: new Set(), // set des idf des fichiers à charger
    encours: null, // sessionId du démon en cours d'éxecution
    cacheDL: [], // cache des N derniers téléchargements : {idf, data}
    idfdl: 0 // idf en cours de téléchargement
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

    echecs: (state) => {
      const l = []
      for(const idf of state.queue) {
        const f = state.map.get(idf)
        if (f && f.exc) l.push(f)
      }
      l.sort((a,b) => { return a.dhdc < b.dhdc ? -1 : ( a.dhdc > b.dhdc ? 1 : 0)})
      return l
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
    },

    // prochain téléchargement à traiter
    prochain: (state) => {
      const now = Date.now()
      const fx = null
      for(const idf of state.queue) {
        const f = state.map.get(idf)
        if (f.dhdc < now && (!fx || (f.dhdc < fx.dhdc))) fx = f
      }
      return fx
    },

    getDataDeCache: (state) => { return (idf) => {
        for(const [id, data] of state.cacheDL) if (id === idf) return data
        return null
      }
    },
  },

  actions: {
    putDataEnCache (idf, data) {
      if (this.cacheDL.length > 5) this.cacheDL.pop()
      this.cacheDL.unshidt([idf, data])
    },

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

    /* Chargement depuis IDB: lfav est la liste des ficav enregistrés en IDB. Pour chacun:
    - si la note n'existe plus, NON enregistrement du ficav et purge du ficav
    - si la note existe MAIS PAS ce fichier,
      - il ne faut pas enregistrer ce ficav et le purger de IDB
      - mais si ce ficav spécifiait de garder le version la plus récente de ce nom, il faut,
        - soit récupérer ce ficav depuis IDB,
        - soit en créer un à charger 
    */
    async loadFicav (lfav) { // mf: Map - clé:idf, valeur: ficav
      // Traitement par note / nom / ficav - 
      const buf = new IDBbuffer()
      lfav.sort((a,b) => { // Tri par note / nom / dh décroissante
        a.key < b.key ? -1 : (a.key > b.key ? 1 :
          (a.nom < b.nom ? - 1 : (a.nom > b.nom ? 1 :
            (a.dh > b.dh ? -1 : (a.dh < b.dh ? 1 : 0)))))
      })
      const m = new Map() // clé: note (key) - valeur Map (clé: nom, valeur: liste des ficav par dh)
      for (const f of lfav) {
        const node = this.nSt.map.get(f.key)
        // pas de note portant ce nom, suppression du ficav de IDB
        if (!node || !node.note || !node.note.fnom.has(f.nom)) buf.purgeFIDB(idf)
        else { // ranger dans m pour traitement
          let e1 = m.get(f.key); if (!e1) { e1 = new Map(); m.set(f.key, e1) }
          let e2 = e1.get(f.nom); if (!e2) { e2 = []; e1.set(f.nom, e2) }
          e2.push(f)
        }
      }

      for (const [key, m1] of m) { // les m1 ne sont jamais vide
        // Pour chaque note
        const node = this.nSt.map.get(key)
        const note = node.note
        if (!note) continue
        for (const [nom, m2] of m1) { // les m2 ne sont jamais vides
          // Pour chaque nom
          const lnom = note.fnom.get(nom) // fichiers de la note ayant ce nom
          const df = lnom[0] // fichier le plus récent de ce nom dans la note
          const avn = m2[0].avn // faut-il garder le ficav le plus récent ?
          if (avn) { // oui
            if (df.idf === avn.id) this.setFicav(avn) // le ficav avn convient, gardé
            else { // Création d'un ficav associé à df
              const fa = Ficav.fromNote(note, df.idf, false, true) // création
              this.setFicav(fa)
            }
          }
          // Pour chaque ficav
          for(const fa of m2) { // conserver les ficav ayant un av et pour lesquels il existe une note
            if (fa.id === df.idf) continue // traité ci-avant avec avn
            if (!fa.av || !note.mfa[fa.id]) buf.purgeFIDB(fa.idf)
          }
        }
      }
      await buf.commit()
      this.startDemon(this.session.sessionId)
    },

    async save (maj, del) {
      const buf = new IDBbuffer()
      for(const f of maj) buf.putFIDB(f)
      for(const idf of del) buf.purgeFIDB(idf)
      await buf.commit()
      if (maj.length) this.startDemon(this.session.sessionId)
    },

    // Invoqué depuis UI
    async retry (idf) {
      const f = this.map.get(idf)
      if (f && f.dhdc) {
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
        this.delFicav(f)
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
    async ko (idf, exc) {
      const f = this.map.get(idf)
      if (f) {
        f.dhdc = Date.now() + (delaisec * 1000) // retry dans 1 minute
        f.exc = exc
        f.nbr++
        this.setFicav (f)
        await idb.setFa(f, null)
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

    startDemon (sessionId) {
      if (!this.session.accesIdb || (sessionId !== this.session.sessionId)) return
      setTimeout(async () => {
        while (sessionId === this.session.sessionId) {
          const fa = this.prochain
          if (!fa) {
            setTimeout(() => { this.startDemon(sessionId) }, 60000)
            break
          }
          try {
            this.idfdl = fa.id
            let buf = getDataDeCache(fa.idf)
            if (buf) {
              await this.ok(fa.idf, buf)
              this.idfdl = 0
              continue
            }
            const args = { 
              token: session.authToken, 
              id: fa.ref[0], 
              ids: fa.ref[1],
              idf: fa.id
            }
            const ret =  await post(null, 'GetUrlNf', args)
            if (sessionId !== this.session.sessionId) break
            try {
              buf = await getData(ret.url)
              if (sessionId !== this.session.sessionId) break
              await this.ok(fa.idf, buf)
              if (stores.config.DEBUG) console.log(`OK chargement : ${fa.idf} ${fa.nom}#${fa.info}`)
            } catch (e) {
              if (sessionId !== this.session.sessionId) break
              await this.ko(fa.idf, [404, e.message])
            }
            this.idfdl = 0
          } catch (ex) {
            if (sessionId !== this.session.sessionId) break
            const exc = appexc(ex)
            await this.ko(fa.idf, [exc.code, ''])
            this.idfdl = 0
          }
        }
      }, 10)
    }
  }
})
