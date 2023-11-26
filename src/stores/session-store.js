import { defineStore } from 'pinia';
import { encode } from '@msgpack/msgpack'

import stores from './stores.mjs'
import { pbkfd } from '../app/webcrypto.mjs'
import { u8ToB64, intToB64, rnd6, $t, afficherDiag, hms } from '../app/util.mjs'
import { AMJ, ID } from '../app/api.mjs'
import { MD, NomGenerique } from '../app/modele.mjs'
import { Demon } from '../app/connexion.mjs'

export const useSessionStore = defineStore('session', {
  state: () => ({
    status: 0, // 0:fermée, 1:en chargement, 2: ouverte, 3: admin
    mode: 0, // 1:synchronisé, 2:incognito, 3:avion
    sessionId: '', // identifiant de session (random(6) -> base64)
    estSponsor: false,

    /* namespace de 10 à 59 
    Pour "admin" : espace "courant", donc peut être 0
    */
    ns: 0, 
    org: '', // code de l'organisation
    // presetOrgX: '',
    memoOrg: false,
    
    naComptable: null,
    dh: 0,

    consocumul: { nl: 0, ne: 0, vm: 0, vd: 0},
    consoatt: { nl: 0, ne: 0, vm: 0, vd: 0},
    // nombres de lectures, écritures, volume montant / descendant sur les POST

    /* authToken : base64 de la sérialisation de :
    - `sessionId`
    - `shax` : SHA de X, le PBKFD de la phrase complète.
    - `hps1` : hash du PBKFD de la ligne 1 de la phrase secrète.
    */
    authToken: '',
    phrase: null,
    dateJourConnx: 0,
    dhConnx: 0,
    lsk: '',
    nombase: '',
    volumeTable: '',

    espaces: new Map(), // sauf pour admin il n'y en a qu'un
    syntheses: new Map(), // sauf pour admin il n'y en a qu'un

    opEncours: null,
    opSpinner: 0,

    /* Objet de classe SessionSync traçant l'état de synchronisation d'une session sur IDB
    - créé par db à la lecture de l'état de synchronisation
    - reset à la déconnexion par reset du store
    */
    sessionSync: null,

    syncEncours: false,

    // Objet de synchro pour Firestore
    fsSync: null,
    /* Juste avant login, récupération du statut fs / sql du server
    par ping /fs (retournant 'true' ou 'false') SAUF en mode avion
    */
    estFs: false,

    clek: null,

    compteId: 0, // id du compte / son avatar principal
    tribuId: 0, // id de la tribu actuelle du compte
    avatarId: 0, // avatar "courant"
    groupeId: 0, // groupe "courant"
    membreId: 0, // membre "courant" (son im/ids dans son groupe)
    tribuId: 0, // id de la tribu actuelle du compte
    tribuCId: 0, // tribu "courante" pour le comptable (page tribu affichée)
    peopleId: 0, // people "courant"

    /* Type des notifications:
    - 0 : de l'espace
    - 1 : d'une tribu
    - 2 : d'un compte
    - 3 : dépassement de quotas
    - 4 : alerte de solde / consommation
    */
    notifs: [null, null, null, null, null, null],

    /*
    Une notification a les propriétés suivantes:
    - `nr`: restriction d'accès: (niv)
      - 0 : pas de restriction (1)
      - 1 : espace figé (3)
      - 2 : espace bloqué (5)
      - 3 : accès en lecture seule (3)
      - 4 : accès minimal (4)
      - 5 : actions accroissant le volume interdites (2)
    - `dh` : date-heure de création.
    - `texte`: texte de la notification.
    - `idSource`: id du sponsor ayant créé cette notification pour un type 3.
    */
    nivx: [0, 3, 5, 3, 4, 2],
    /* niveau d'information / restriction: 
    - 0 : aucune notification
    - 1 : au moins une notification informative
    - 2 : accroissement de volume interdit
    - 3 : accés en lecture seule
    - 4 : accès minimal
    - 5 : bloqué
    */
    niv: 0,
    alire: false, // Il y a des notifications à lire

    // message fmsg de report après filtrage
    filtreMsg: ''
  }),

  getters: {
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

    notifAdmin (state) { return state.notifs[0] },

    presetOrg (state) {
      return !state.accesIdb ? '' : (localStorage.getItem('$asocial$org') || '')
    },
    pow (state) {
      if (state.estAdmin) return 1
      if (state.estComptable) return 2
      if (state.estSponsor) return 3
      return 4
    },

    // editable (state) { return state.mode < 3 && state.niv < 2 },
    estSansNotif (state) { return state.niv === 0 },
    estFige (state) { const n = state.notifAdmin; return n && (n.nr === 1) },
    estClos (state) { const n = state.notifAdmin; return n && (n.nr === 2) },
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
    setStatus (s) {
      this.status = s
    },
    setEstSponsor (sp) {
      this.estSponsor = sp
    },
    setNlNe (nl, ne) { 
      this.consoatt.nl += nl
      this.consoatt.ne += ne
      this.consocumul.nl += nl
      this.consocumul.ne += ne
    },
    setVm (vm) { 
      this.consoatt.vm += vm
      this.consoatt.vm += vm
    },
    setVd (vd) { 
      this.consoatt.vd += vd
      this.consoatt.vd += vd
    },
    razConsoatt () {
      this.consoatt.nl = 0
      this.consoatt.ne = 0
      this.consoatt.vd = 0
      this.consoatt.vm = 0
    },
    
    init (phrase) {
      this.sessionId = intToB64(rnd6())
      if (phrase) {
        this.phrase = phrase
        this.lsk = '$asocial$-' + phrase.hps1
      }
      const token = {
        sessionId: this.sessionId,
        shax: phrase ? phrase.shax : null,
        hps1: phrase ? phrase.hps1 : null
      }
      const x = new Uint8Array(encode(token))
      this.authToken = u8ToB64(new Uint8Array(x), true)
      this.nombase = this.lsk ? localStorage.getItem(this.lsk) : ''
      this.dateJourConnx = AMJ.amjUtc()
      this.dhConnx = Date.now()
      this.status = 1
    },

    async setNombase () { // Après avoir obtenu cle K du serveur
      const x = await pbkfd(this.clek)
      this.nombase = '$asocial$-' + u8ToB64(x, true)
      localStorage.setItem(this.lsk, this.nombase)
    },

    // pour tracking des changements sur $onAction
    setCompteId (id) {
      this.ns = ID.ns(id)
      this.compteId = id
      if (!this.estAdmin) this.naComptable = NomGenerique.comptable()
    },

    setMode (mode) { 
      this.mode = mode
      if (this.incognito) localStorage.removeItem('$asocial$org')
    },

    setMemoOrg (v) {
      this.memoOrg = v
    },

    setOrg (org) { 
      this.org = org
      if (this.accesIdb && this.memoOrg) localStorage.setItem('$asocial$org', org)
    },

    resetOrg () { 
      this.org = ''
      if (this.accesIdb) localStorage.removeItem('$asocial$org')
    },

    setNs (ns) { this.ns = ns; NomGenerique.ns = ns },

    setSessionSync (s) {
      this.sessionSync = s
    },

    setFsSync (fsSync) {
      this.fsSync = fsSync
    },

    setEstFs (estFs) {
      this.estFs = estFs
    },

    setAvatarId (id) { this.avatarId = id},

    setTribuId(id) { this.tribuId = id },

    setTribuCId (id) { this.tribuCId = id },

    setPeopleId (id) { this.peopleId = id },

    setGroupeId (id) { this.groupeId = id },

    setMembreId (id) { this.membreId = id },

    setStats (stats) { this.stats = stats},

    setEspace (espace) {
      this.espaces.set(espace.id, espace)
      if (!this.estAdmin) {
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

    setDh (dh) {
      if (dh && dh > this.dh) {
        this.dh = dh
      }
    },

    fmsg (n, msg) {
      this.filtreMsg = hms(new Date(), true) + ' / ' + (msg || $t('items', n, { count: n }))
      setTimeout(() => {
        this.filtreMsg = ''
      }, 1000)
    },

    setDhvu (dhvu) {
      this.dhvu = dhvu
      this.setBlocage()
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

    setBlocage () {
      if (this.estAdmin) return
      const aSt = stores.avatar
      const c = aSt.compta
      const dhvu = c ? (c.dhvu || 0) : 0
      this.niv = 0
      this.alire = false
      this.notifs.forEach(ntf => {
        if (ntf && ntf.texte) {
          if (ntf.dh > dhvu) this.alire = true
          const niv = !ntf.texte ? 0 : ( !ntf.nr ? 1 : this.nivx[ntf.nr])
          if (niv > this.niv) this.niv = niv
        }
      })
      if (this.estClos) {
        Demon.stop()
        this.status = 0
      }
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
      MD.oD('opDialog')
      this.opCount()
    },

    finOp () {
      if (this.opTimer) clearTimeout(this.opTimer)
      this.opEncours = null
      this.opSpinner = 0
      MD.fD()
    }
  }
})
