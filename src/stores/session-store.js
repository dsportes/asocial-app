import { defineStore } from 'pinia';
import { encode } from '@msgpack/msgpack'

import stores from './stores.mjs'
import { pbkfd, sha256 } from '../app/webcrypto.mjs'
import { u8ToB64, intToB64, rnd6, $t, afficherDiag } from '../app/util.mjs'
import { AMJ, IDCOMPTABLE } from '../app/api.mjs'

export const useSessionStore = defineStore('session', {
  state: () => ({
    status: 0, // 0:fermée, 1:en chargement, >=10: ouverte
    mode: 0, // 1:synchronisé, 2:incognito, 3:avion
    sessionId: '', // identifiant de session (random(6) -> base64)
    dh: 0,
    authToken: '',
    phrase: null,
    dateJourConnx: 0,
    lsk: '',
    nombase: '',
    volumeTable: '',

    opencours: null, // Objet opération de l'opération en cours (sauf ProcessQueue)

    sessionSync: null, // Objet de classe SessionSync traçant l'état de synchronisation d'une session sur IDB

    syncEncours: false,

    fscredentials: null, // pour connexion à Firestore
    fsSync: null, // Objet de synchro pour Firestore

    clek: null,

    compteId: 0, // id du compte / son avatar principal
    tribuId: 0, // id de la tribu actuelle du compte
    avatarId: 0, // avatar "courant"
    groupeId: 0, // groupe "courant"
    tribuCId: 0, // tribu "courante" pour le comptable (page tribu affichée)

    // blocage et notification
    nivbl: 0,
    alirebl: false,
    gntf: 0,
    alirentf: false
  }),

  getters: {
    // trois alias utiles
    compte (state) { return stores.avatar.compte },
    compta (state) { return stores.avatar.compta },
    tribu (state) { return stores.avatar.tribu },
    tribu2 (state) { return stores.avatar.tribu2 },

    estSponsor (state) { return stores.avatar.compta && stores.avatar.compta.estSponsor },
    estComptable (state) { return state.compteId === IDCOMPTABLE },

    // Avatar et groupes courants
    avC (state) { return stores.avatar.getAvatar(state.avatarId) },
    grC (state) { return stores.groupe.getGroupe(state.groupeId)},

    synchro (state) { return state.mode === 1 },
    incognito (state) { return state.mode === 2 },
    avion (state) { return state.mode === 3 },
    accesNet (state) { return state.mode === 1 || state.mode === 2},
    accesIdb (state) { return state.mode === 1 || state.mode === 3},
    ok (state) { return state.status > 1 }
  },

  actions: {
    init (phrase) {
      this.sessionId = intToB64(rnd6())
      if (phrase) {
        this.phrase = phrase
        this.lsk = '$asocial$-' + phrase.dpbh
      }
      const token = {
        sessionId: this.sessionId,
        shax: phrase ? phrase.shax : null,
        hps1: phrase ? phrase.dpbh : null
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

    setAvatarCourant (id) {
      this.avatarId = id
    },

    setTribuCourante (id) {
      this.tribuCId = id
    },

    chgps (phrase) {
      /*
      Suppression de l'ancienne clé lsk donnant le nom de la base du compte
      Recalcul de la nouvelle clé lsk donnant le même nom qu'avant
      Changement du token d'accès
      */
      localStorage.removeItem(this.lsk)
      this.phrase = phrase
      this.lsk = '$asocial$-' + phrase.dpbh
      localStorage.setItem(this.lsk, this.nombase)
      const token = {
        sessionId: this.sessionId,
        shax: phrase.shax,
        hps1: phrase.dpbh
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
    },

    /* Calcul du blocage depuis tribu, tribu2, compta (si chgt dhvu)
    */
    setBlocage () {
      const self = this
      function ntfx (ntf) {
        if (ntf) {
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
      const avStore = stores.avatar
      const tr = avStore.tribu
      const et2 = avStore.tribu2.mbtr[this.compteId]
      const dhvu = avStore.compta.dhvu || 0
      this.nivbl = 0
      this.alirebl = false
      this.gntf = 0
      this.alirentf = false
      ntfx(tr.notifco)
      ntfx(tr.notifsp)
      ntfx(et2.notifco)
      ntfx(et2.notifsp)
      blx(tr.blocage)
      blx(et2.blocage)
    },

    /* authToken : base64 de la sérialisation de :
    - `sessionId`
    - `shax` : SHA de X, le PBKFD de la phrase complète.
    - `hps1` : hash du PBKFD de la ligne 1 de la phrase secrète.
    */
    setAuthToken () {
      const token = {
        sessionId: this.sessionId,
        shax: sha256(session.phrase.pcb),
        hps1: session.phrase.dpbh
      }
      session.authToken = u8ToB64(new Uint8Array(encode(token)))
    },

    async edit () {
      if (this.mode === 3) {
        await afficherDiag($t('editavion'))
        return false
      }
      if (this.nivbl >= 2) {
        await afficherDiag($t('editlecture'))
        return false
      }
      return true
    },
    
    /* Gère les autorisations d'exécuter l'action
    - nmb : interdit avec un blocage à partir de nmb
    - cnx : connexion requise (modes synchronisé et incognito)
    */
    auts (nmb, cnx) {
      return !((cnx && this.avion) || this.blocage >= nmb)
    },
    
    async aut (nmb, cnx) {    
      if ((cnx && this.avion) || this.blocage >= nmb) { // action interdite : explication(s)
        return new Promise((resolve) => {
          const av = this.avion
          const b = this.blocage
          stores.config.$q.dialog({
            dark: true,
            html: true,
            title: $t('UTI' + (av ? 'ac2' : 'ac1')),
            message: (av ? $t('UTImsi') : '') +
              (b ? '<br><span class="titre-lg text-warning text-bold">' + $t('IB' + b) + '</span>' : ''),
            cancel: !this.blocage ? null : { label: $t('UTIesp'), color: 'primary' },
            ok: { color: 'warning', label: $t('jailu') }
          }).onOk(async () => {
            resolve(false)
          }).onCancel(async () => {
            if (b) await stores.ui.ouvrirInfoBlocage(true)
            resolve(false)
          }).onDismiss(() => {
            resolve(false)
          })
        })
      }
      // action autorisée : rappel du blocage en cours éventuel
      if (this.blocage) await stores.ui.ouvrirInfoBlocage()
      return true
    }
  }
})
