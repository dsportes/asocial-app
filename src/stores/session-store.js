import { defineStore } from 'pinia';
import { encode } from '@msgpack/msgpack'

import stores from './stores.mjs'
import { pbkfd, sha256 } from '../app/webcrypto.mjs'
import { u8ToB64, intToB64, rnd6, $t, afficherDiag, hms } from '../app/util.mjs'
import { AMJ, ID } from '../app/api.mjs'
import { MD, NomGenerique } from '../app/modele.mjs'

export const useSessionStore = defineStore('session', {
  state: () => ({
    status: 0, // 0:fermée, 1:en chargement, 2: ouverte, 3: admin
    mode: 0, // 1:synchronisé, 2:incognito, 3:avion
    sessionId: '', // identifiant de session (random(6) -> base64)
    estAdmin: false,

    /* namespace de 10 à 59 
    Pour "admin" : espace "courant", donc peut être 0
    */
    ns: 0, 
    org: '', // code de l'organisation
    presetOrg: '',
    naComptable: null,
    dh: 0,
    /* authToken : base64 de la sérialisation de :
    - `sessionId`
    - `shax` : SHA de X, le PBKFD de la phrase complète.
    - `hps1` : hash du PBKFD de la ligne 1 de la phrase secrète.
    */
    authToken: '',
    phrase: null,
    dateJourConnx: 0,
    lsk: '',
    nombase: '',
    volumeTable: '',

    espaces: new Map(), // sauf pour admin il n'y en a qu'un
    syntheses: new Map(), // sauf pour admin il n'y en a qu'un

    opEncours: null,
    opSpinner: 0,

    sessionSync: null, // Objet de classe SessionSync traçant l'état de synchronisation d'une session sur IDB

    syncEncours: false,

    fscredentials: null, // pour connexion à Firestore
    fsSync: null, // Objet de synchro pour Firestore

    clek: null,

    compteId: 0, // id du compte / son avatar principal
    estComptable: false,
    tribuId: 0, // id de la tribu actuelle du compte
    avatarId: 0, // avatar "courant"
    groupeId: 0, // groupe "courant"
    membreId: 0, // membre "courant" (son im/ids dans son groupe)
    tribuId: 0, // id de la tribu actuelle du compte
    tribuCId: 0, // tribu "courante" pour le comptable (page tribu affichée)
    peopleId: 0, // people "courant"

    /* blocage / notification
    - niv : niveau d'alerte
      0: pas de blocage,
      1: alerte simple
      2: alerte grave (une procédure de blocage est planifiée)
      3: lecture seule, 
      4: ni lecture ni écriture,
      5: résilié
    */
    niv: 0,
    alire: false, // Il y a des notifications à lire
    notifG: null, // notification générale courante

    // message fmsg de report après filtrage
    filtreMsg: ''
  }),

  getters: {
    estBloque (state) { return state.niv >= 4 },
    estSponsor (state) { 
      const aSt = stores.avatar
      const t2 = aSt.tribu2.mbtr[state.compteId]
      return (t2 && t2.sp) || false 
    },

    editable (state) { return state.mode < 3 && state.niv < 4 },

    synchro (state) { return state.mode === 1 },
    incognito (state) { return state.mode === 2 },
    avion (state) { return state.mode === 3 },
    accesNet (state) { return state.mode === 1 || state.mode === 2},
    accesIdb (state) { return state.mode === 1 || state.mode === 3},
    ok (state) { return state.status === 2 },

    editable (state) { return state.mode < 3 && state.niv < 2 },

    // PageAdmin ***************************************************    
    paLeFT: (state) => {
      const x = []; state.espaces.forEach(e => { x.push(e) })
      x.sort((a, b) => { return a.id < b.id ? -1 : (a.id === b.id ? 0 : 1)})
      return x
    }

  },

  actions: {
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
      if (!this.estAdmin) {
        this.estComptable = ID.estComptable(id)
        this.naComptable = NomGenerique.comptable()
      }
    },

    setMode (mode) { this.mode = mode },

    setOrg (org) { this.org = org },

    setNs (ns) { this.ns = ns; NomGenerique.ns = ns },

    setPresetOrg (org) { this.presetOrg = org},

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
        if (espace.notif) {
          if (!this.notifG || (espace.notif.v > this.notifG.v)) {
            this.notifG = espace.notif
            this.setBlocage()
          }
        } else if (this.notifG) {
          this.notifG = null
          this.setBlocage()
        }
      }
    },

    setSynthse (synthese) {
      this.syntheses.set(synthese.id, synthese)
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

    fmsg (n) {
      this.filtreMsg = hms(new Date(), true) + ' / ' + $t('items', n, { count: n })
      setTimeout(() => {
        this.filtreMsg = ''
      }, 1000)
    },

    /* Calcul du niveau de notification / blocage max
    */
    setBlocage () {
      const self = this
      function ntfx (ntf) {
        if (ntf && ntf.dh) {
          if (ntf.dh > dhvu) self.alire = true
          if (ntf.niv > self.niv) self.niv = ntf.niv
        }  
      }
      const aSt = stores.avatar
      const tr = aSt.tribu
      const et2 = aSt.mbtr
      const dhvu = aSt.compta.dhvu || 0
      this.niv = 0
      this.alire = false
      ntfx(this.notifG)
      ntfx(tr.notif)
      ntfx(et2.notif)
    },

    editDiag (avionSeulement) {
      if (this.mode === 3) return $t('editavion')
      if (avionSeulement) return ''
      if (this.niv >= 2) return $t('editlecture')
      return ''
    },

    roSt () {
      if (this.mode === 3) return 1
      if (this.niv >= 2) return 2
      return 0
    },

    async edit (avionSeulement) {
      const d = this.editDiag(avionSeulement)
      if (d) {
        await afficherDiag(d)
        return false
      }
      return true
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
