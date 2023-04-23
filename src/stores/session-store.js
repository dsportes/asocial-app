import { defineStore } from 'pinia';
import { encode } from '@msgpack/msgpack'

import stores from './stores.mjs'
import { pbkfd, sha256 } from '../app/webcrypto.mjs'
import { u8ToB64, intToB64, rnd6, $t, afficherDiag, hms } from '../app/util.mjs'
import { AMJ, ID } from '../app/api.mjs'
import { setNg } from '../app/modele.mjs'

export const useSessionStore = defineStore('session', {
  state: () => ({
    status: 0, // 0:fermée, 1:en chargement, 2: ouverte, 3: admin
    mode: 0, // 1:synchronisé, 2:incognito, 3:avion
    sessionId: '', // identifiant de session (random(6) -> base64)
    ns: 0, // namespace de 10 à 89 : 0 pour "admin"
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

    opEncours: null,
    opSpinner: 0,
    opDialog: false,

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

    // blocage et notification
    nivbl: 0,
    alirebl: false,
    gntf: 0,
    notifG: null,
    alirentf: false,

    // message fmsg de report après filtrage
    filtreMsg: ''
  }),

  getters: {
    estSponsor (state) { 
      const aSt = stores.avatar
      const t2 = aSt.tribu2.mbtr[state.compteId]
      return (t2 && t2.sp) || false 
    },

    editable (state) { return state.mode < 3 && state.nivbl < 2 },

    synchro (state) { return state.mode === 1 },
    incognito (state) { return state.mode === 2 },
    avion (state) { return state.mode === 3 },
    accesNet (state) { return state.mode === 1 || state.mode === 2},
    accesIdb (state) { return state.mode === 1 || state.mode === 3},
    ok (state) { return state.status === 2 },

    editable (state) { return state.mode < 3 && state.nivbl < 2 }
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
      if (this.ns) {
        this.estComptable = ID.estComptable(id)
        this.naComptable = NomGenerique.comptable(this.ns)
        setNg(this.naComptable)
      }
    },

    setAvatarId (id) { this.avatarId = id},

    setTribuId(id) { this.tribuId = id },

    setTribuCId (id) { this.tribuCId = id },

    setPeopleId (id) { this.peopleId = id },

    setGroupeId (id) { this.groupeId = id },

    setMembreId (id) { this.membreId = id },

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

    setNotifGlobale (notif) {
      this.notifG = notif
      this.setBlocage()
    },

    fmsg (n) {
      this.filtreMsg = hms(new Date(), true) + ' / ' + $t('items', n, { count: n })
      setTimeout(() => {
        this.filtreMsg = ''
      }, 1000)
    },

    /* Calcul des niveaux de notification et de blocage max
    */
    setBlocage () {
      const self = this
      function ntfx (ntf) {
        if (ntf && ntf.dh) {
          if (self.gntf === 0) self.gntf = 1
          if (ntf.g) self.gntf = 2
          if (ntf.dh > dhvu) self.alirentf = true
        }  
      }
      function blx (bl) {
        if (bl) {
          if (bl.niv > self.nivbl) self.nivbl = bl.niv
          if (bl.dh > dhvu) self.alirebl = true
        }  
      }
      const aSt = stores.avatar
      const tr = aSt.tribu
      const et2 = aSt.tribu2.mbtr[this.compteId]
      const dhvu = aSt.compta.dhvu || 0
      this.nivbl = 0
      this.alirebl = false
      this.gntf = 0
      this.alirentf = false
      ntfx(this.notifG)
      ntfx(tr.notifco)
      ntfx(tr.notifsp)
      ntfx(et2.notifco)
      ntfx(et2.notifsp)
      blx(tr.blocage)
      blx(et2.blocage)
    },

    async edit (tst) {
      if (this.mode === 3 || tst === 1) {
        await afficherDiag($t('editavion'))
        return false
      }
      if (this.nivbl >= 2 || tst === 2) {
        await afficherDiag($t('editlecture'))
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
      this.opDialog = true
      this.opCount()
    },

    finOp () {
      if (this.opTimer) clearTimeout(this.opTimer)
      this.opEncours = null
      this.opSpinner = 0
      this.opDialog = false
    }
  }
})
