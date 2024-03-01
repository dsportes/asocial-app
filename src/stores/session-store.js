import { defineStore } from 'pinia';
import { encode, decode } from '@msgpack/msgpack'

import stores from './stores.mjs'
import { pbkfd, crypter } from '../app/webcrypto.mjs'
import { u8ToB64, intToB64, rnd6, $t, afficherDiag, hms } from '../app/util.mjs'
import { AMJ, ID } from '../app/api.mjs'
import { NomGenerique } from '../app/modele.mjs'
import { Demon } from '../app/connexion.mjs'

export const useSessionStore = defineStore('session', {
  state: () => ({
    swev1: false,
    swev2: false,
    registration: null,

    status: 0, // 0:fermée, 1:en chargement, 2: ouverte, 3: admin
    mode: 0, // 1:synchronisé, 2:incognito, 3:avion

    ns: 0, // namespace de 10 à 89 : pour "admin" : espace "courant", donc peut être 0
    org: '', // code de l'organisation
    compteId: 0, // id du compte
    clek: null, // clek du compte
    authToken: '',
    phrase: null,
    auj: 0,
    dhConnx: 0, // dh de début de la session
    dh: 0, // dh de la dernière opération
    consocumul: { nl: 0, ne: 0, vm: 0, vd: 0}, // nombres de lectures, écritures, volume montant / descendant sur les POST

    lsk: '', // nom de la variable localStorage contenant le nom de la base
    nombase: '', // nom de la base locale
    volumeTable: '', // volume des tables de la base locale

    fsSync: null, // Objet de synchro pour Firestore
    sessionId: '', // identifiant de session si WS (random(6) -> base64)

    estSelegue: false,
    estAutonome: false,

    partitionId: 0, // id de la partition actuelle du compte
    avatarId: 0, // avatar "courant"
    groupeId: 0, // groupe "courant"
    membreId: 0, // membre "courant" (son im/ids dans son groupe)
    partitionCId: 0, // tribu "courante" pour le comptable (page tribu affichée)
    peopleId: 0, // people "courant"
    
    naComptable: null,

    espaces: new Map(), // sauf pour admin il n'y en a qu'un
    syntheses: new Map(), // sauf pour admin il n'y en a qu'un

    opEncours: null,
    opSpinner: 0,

    notifs: { G: null, P: null, C: null, Q: null, X: null },
    niv: 0, // niveau de restriction : 0 1 2
    alire: false, // Il y a des notifications à lire

    /* Exception insurmontable:exc.code ...
    - 9998 : compte clos
    - 9999 : application fermée par l'administrateur
    - autre : exception rencontrée en synchronisation
    */
    excKO: null 

  }),

  getters: {
    aSt (state) { return stores.avatar },
    ui (state) { return stores.ui },
    config (state) { return stores.config },

    dlv (state) { return state.ok ? this.aSt.compta.dlv : 0 },
    nbj (state) { return AMJ.diff(AMJ.dlv(state.dlv), state.auj) },

    espace (state) { return state.espaces.get(state.ns) },
    estComptable (state) { return ID.estComptable(state.compteId) },
    estAdmin (state) { return state.compteId === 0 },

    editable (state) { return state.mode < 3 && state.niv < 4 },

    synchro (state) { return state.mode === 1 },
    incognito (state) { return state.mode === 2 },
    avion (state) { return state.mode === 3 },
    accesNet (state) { return state.mode === 1 || state.mode === 2},
    accesNetNf (state) { return state.accesNet && !state.estFige },
    accesIdb (state) { return state.mode === 1 || state.mode === 3},
    ok (state) { return state.status === 2 },
  
    accepteA (state) { return state.espace.opt !== 0 },

    pow (state) {
      if (state.estAdmin) return 1
      if (state.estComptable) return 2
      if (state.estSponsor) return 3
      return 4
    },

    // editable (state) { return state.mode < 3 && state.niv < 2 },
    estSansNotif (state) { return state.niv === 0 },
    estFige (state) { const n = state.notifs.G; return n && (n.nr === 1) },
    estClos (state) { const n = state.notifs.G; return n && (n.nr === 2) },

    estLecture (state) {
      if (state.pow <= 2) return false
      const nt = state.notifs[1]; const nc = state.notifs[2]
      let nr = nt ? nt.nr : 0
      if (nc && nc.nr > nr) nr = nc.nr
      return nr === 3
    },
    estMinimalTC (state) {
      if (state.pow <= 2) return false
      const nt = state.notifs[1]
      const nc = state.notifs[2]
      let nr = nt ? nt.nr : 0
      if (nc && nc.nr > nr) nr = nc.nr
      return nr === 4
    },
    estMinimalC (state) {
      if (state.pow <= 2) return false
      const n = state.notifs[4]
      return n && (n.nr === 4) 
    },
    estDecr (state) { 
      if (state.pow <= 2) return false
      const n = state.notifs[3]
      return n && (n.nr === 5) 
    },

    estMinimal (state) { 
      if (!state.fige) return state.estMinimalC || state.estMinimalTC
      return state.estMinimalTC
    },

    roSt (state) {
      if (state.mode === 3) {
        return 1
      } else {
        if (state.estFige) return 2
        else if (state.pow > 2) {
          if (state.estMinimal) return 3
          else if (state.estLecture) return 4
        }
      }
      return 0
    },

    editDiag (state) {
      const y = ['', 'editavion', 'editfige', 'editminimal', 'editlecture']
      const x = state.roSt
      return x ? $t(y[x]) : ''
    },

    // PageAdmin ***************************************************    
    paLeFT: (state) => {
      const x = []; state.espaces.forEach(e => { x.push(e) })
      x.sort((a, b) => { return a.id < b.id ? -1 : (a.id === b.id ? 0 : 1)})
      return x
    }

  },

  actions: {
    // ServiceWorker : apriori registration ne sert à rien
    setRegistration(reg) {
      this.registration = reg
    },
    // ServiceWorker : événements de détection de changement de version
    setSwev (n) {
      console.log('SW event reçu : ' + n)
      if (n === 1) this.swev1 = true
      else if (n === 2) this.swev2 = true
    },

    setMode (mode) { this.mode = mode },

    setOrg (org) { this.org = org || '' },

    setNs (ns) { this.ns = ns; NomGenerique.ns = ns },

    /* Initialise une session depuis une phrase secrète
    session.mode et org ont été enregistrés par PageLogin (connexion ou création compte)
    */
    async initSession(phrase) {
      this.sessionId = this.config.hasWS ? intToB64(rnd6()) : ''
      this.phrase = phrase

      const token = { }
      if (this.org === 'admin') token.shax = phrase ? phrase.shax : null
      else {
        if (!this.config.hasWS) token.sessionId = this.sessionId
        token.hXR = phrase ? phrase.hps1 : null
        token.hXC = phrase ? phrase.hpsc : null
      }
      token.org = this.org      
      this.authToken = u8ToB64(new Uint8Array(encode(token)), true)

      this.lsk = '$asocial$-' + phrase.hps1
      this.nombase = localStorage.getItem(this.lsk) || ''
      
      this.auj = AMJ.amjUtc()
      this.dhConnx = Date.now()
      this.compteId = 0
      this.clek = null
      this.status = 1

      if (session.accesNet) {
        if (this.sessionId) {
          await openWS()
          session.fsSync = null
        } else {
          session.fsSync = new FsSyncSession()
        }
      }

      resetRepertoire() // TODO à rediscuter
      stores.reset(true) // reset SAUF session
    },

    /* id / clek connu depuis: (voir synchro.mjs)
    - ConnexionAvion: lecture du record "boot" de IDB
    - ConnexionSynchroIncognito: retour du row "comptes" sur le premier Sync
    - AcceptationSponsoring
    */
    async setIdCleK (id, clek) {
      this.compteId = id
      this.setNs(ID.ns(id))
      this.naComptable = NomGenerique.comptable()
      this.clek = clek
      const x = await crypter(this.clek, '' + id, 1)
      this.nombase = '$asocial$-' + u8ToB64(x, true)
      if (session.accesIdb) localStorage.setItem(this.lsk, this.nombase)
    },

    setDh (dh) { if (dh && dh > this.dh) this.dh = dh },

    setDhvu (dhvu) { this.dhvu = dhvu; this.setBlocage() },

    setNotifs (notifs) {
      if (!notifs) return
      if (notifs.G) this.notifs.G = notifs.G
      if (notifs.P) this.notifs.P = notifs.P
      if (notifs.C) this.notifs.C = notifs.C
      if (notifs.Q) this.notifs.Q = notifs.Q
      if (notifs.X) this.notifs.X = notifs.X
      this.setBlocage()
    },

    setBlocage () {
      if (this.estAdmin) return
      const c = this.aSt.compta
      const dhvu = c ? (c.dhvu || 0) : 0
      this.niv = 0
      this.alire = false
      this.notifs.forEach(ntf => {
        if (ntf && ntf.texte) {
          if (ntf.dh > dhvu) this.alire = true
          if (ntf.nr > this.niv) this.niv = ntf.nr
        }
      })
    },

    /* Le compte a disparu OU l'administrateur a fermé l'application ***********/
    setExcKO (exc) { this.excKO = exc; ui.setPage('clos') },

    setConso (c) {
      if (c) {
        if (c.nl) this.consocumul.nl += c.nl
        if (c.ne) this.consocumul.ne += c.ne
        if (c.vm) this.consocumul.vm += c.vm
        if (c.vd) this.consocumul.vd += c.vd
      }
    },

    setStatus (s) {
      this.status = s
    },
    setEstSponsor (sp) {
      this.estSponsor = sp
    },
    setEstAutonome (a) {
      this.estAutonome = a
    },

    setFsSync (fsSync) {
      this.fsSync = fsSync
    },

    setAvatarId (id) { this.avatarId = id},

    setTribuId(id) { this.tribuId = id },

    setTribuCId (id) { this.tribuCId = id },

    setPeopleId (id) { this.peopleId = id },

    setGroupeId (id) { this.groupeId = id },

    setMembreId (id) { this.membreId = id },

    setStats (stats) { this.stats = stats},

    setEspace (espace, estAdmin) {
      this.espaces.set(espace.id, espace)
      if (estAdmin) {
        const ne = espace.notif
        const n = this.notifs[0]
        if (ne) {
          if (!n || ne.dh > n.dh) {
            this.setNotifE(ne)
          }
        } else if (n) {
          this.setNotifE(null)
        }
      }
    },

    chgps (phrase) {
      /*
      Suppression de l'ancienne clé lsk donnant le nom de la base du compte
      Recalcul de la nouvelle clé lsk donnant le même nom qu'avant
      Changement du token d'accès
      */
      localStorage.removeItem(this.lsk)
      this.phrase = phrase
      this.lsk = '$asocial$-' + phrase.hps1
      localStorage.setItem(this.lsk, this.nombase)
      const token = {
        sessionId: this.sessionId,
        shax: phrase.shax,
        hps1: phrase.hps1
      }
      const x = new Uint8Array(encode(token))
      this.authToken = u8ToB64(new Uint8Array(x), true)
    },

    setNotifE (ne) {
      const n = this.notifs[0]
      if (ne) {
        if (!n || ne.dh > n.dh) this.notifs[0] = ne
      }
      else this.notifs[0] = { dh: (!n ? 0 : n.dh) }
      this.setBlocage()
    },

    setNotifQ (ne) { // depassement de quotas - return true si changement
      if (!ne) return false
      const n = this.notifs[3]
      if (!n || ne.dh > n.dh) {
        this.notifs[3] = ne
        return true
      }
      return false
    },

    setNotifS (ne) { // solde négatif - return true si changement
      if (!ne) return false
      const n = this.notifs[4]
      if (!n || ne.dh > n.dh) {
        this.notifs[4] = ne
        return true
      }
      return false
    },

    setNotifTC (nt, nc) { // notif tribu et compte (dans tribu)
      let chg = false
      if (nt) {
        const n = this.notifs[1]
        if (!n || nt.dh > n.dh) {
          this.notifs[1] = nt
          chg = true
        }
      }
      if (nc) {
        const n = this.notifs[2]
        if (!n || nc.dh > n.dh) {
          this.notifs[2] = nc
          chg = true
        }
      }
      if (chg) this.setBlocage()
    },

    async editUrgence () {
      if (this.mode === 3) {
        await afficherDiag($t('editavion'))
        return false
      }
      if (this.estFige) {
        await afficherDiag($t('editfige'))
        return false
      }
      return true
    },

    async edit () {
      const d = this.editDiag
      if (!d) return true
      await afficherDiag(d)
      return false
    },

    async editpow (p, noed) {
      const y = ['', 'powadmin', 'powcompta', 'powsponsor']
      if (p === 3) {
        if (this.pow !== 3 && this.pow !== 2) {
          await afficherDiag(p ? $t(y[p]) : '')
          return false
        }
      } else if (p === 1 || p === 2) {
        if (this.pow !== p) {
          await afficherDiag(p ? $t(y[p]) : '')
          return false
        }
      }
      return noed ? true : await this.edit()
    },
    
    opCount () {
      const self = this
      if (this.opTimer) clearTimeout(this.opTimer)
      this.opTimer = setTimeout(() => {
        self.opSpinner++
        self.opCount()
      }, 1000)
    },

    startOp (op) {
      this.opEncours = op
      this.opSpinner = 0
      this.ui.oD('opDialog')
      this.opCount()
    },

    finOp () {
      if (this.opTimer) clearTimeout(this.opTimer)
      this.opEncours = null
      this.opSpinner = 0
      this.ui.fD()
    }
  }
})
