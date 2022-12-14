import { defineStore } from 'pinia';

import stores from './stores.mjs'
import { pbkfd, sha256 } from '../app/webcrypto.mjs'
import { u8ToB64 } from '../app/util.mjs'

export const useSessionStore = defineStore('session', {
  state: () => ({
    status: 0, // 0:fermée, 1:en chargement, >=10: ouverte
    mode: 0, // 1:synchronisé, 2:incognito, 3:avion
    sessionId: '', // identifiant de session (random(6) -> base64)
    authToken: '',
    phrase: null,

    dateJourConnx: null,

    opencours: null, // Objet opération de l'opération en cours (sauf ProcessQueue)
    sessionSync: null, // Objet de classe SessionSync trçant l'état de synchronisation d'une session sur IDB

    statutIdb: false,
    nombase: '',
    volumeTable: '',

    statutNet: false,
    syncqueue: [], // accumulation des syncList reçues par webSocket
    fscredentials: null, // pour connexion à Firestore

    estComptable: false,
    compteId: 0,
    clek: null,
    clepubc: null,
    compta: null,
    compte: null, // avatar principal

    avatarId: null,
    groupeId: null,

    blocage: 0, // niveau de blocage: 1-Alerte informative, 2:restriction de volume, 3:passif, 4:bloqué
    infoBlocage: false,
    infoBlocageResolve: null,
    rappelBlocage: 0,
    dernierBlocage: this
  }),

  getters: {
    // Nom de l'entrée LocalStorage devant contenir le nom de la base
    lsk (state) { return '$asocial$-' + state.phrase.dpbh},
    niveau (state) { return Math.floor(state.status / 10) },
    synchro (state) { return state.mode === 1 },
    incognito (state) { return state.mode === 2 },
    avion (state) { return state.mode === 3 },
    accesNet (state) { return state.mode === 1 || state.mode === 2},
    accesIdb (state) { return state.mode === 1 || state.mode === 3},
    ok (state) { return state.status > 1 },
    avC (state) { return stores.avatar.getAvatar(state.avatarId) },
    tribu (state) {
      if (state.estComptable) return null
      const idt = state.compte.nat.id
      return stores.tribu.getTribu(idt) 
    },
    getPrefs (state) { return state.prefs },

  },

  actions: {
    async getNombase () {
      if (!this.nombase) {
        if (!this.clek) return ''
        const x = await pbkfd(this.clek)
        this.nombase = '$asocial$-' + u8ToB64(x, true)
      }
      return this.nombase
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
    
    setCompte (obj) { this.compte = obj },

    /* Gère les autorisations d'exécuter l'action
    - nmb : interdit avec un blocage à partir de nmb
    - cnx : connexion requise (modes synchronisé et incognito)
    */
    auts (nmb, cnx) {
      return !((cnx && this.mode > 2) || this.blocage >= nmb)
    },
    
    async aut (nmb, cnx) {    
      if ((cnx && this.mode > 2) || this.blocage >= nmb) { // action interdite : explication(s)
        return new Promise((resolve) => {
          const av = this.mode > 2
          stores.config.$q.dialog({
            dark: true,
            html: true,
            title: $t('UTI' + av ? 'ac2' : 'ac1'),
            message: (av ? $t('UTImsi') : '') +
              (this.blocage ? '<br><span class="titre-lg text-warning text-bold">' + $t('IB' + b) + '</span>' : ''),
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
