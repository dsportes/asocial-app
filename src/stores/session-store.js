import { defineStore } from 'pinia';

import stores from './stores.mjs'

export const useSessionStore = defineStore('session', {
  state: () => ({
    status: 0, // 0:fermée, 1:en chargement, >=10: ouverte
    mode: 0, // 1:synchronisé, 2:incognito, 3:avion
    reseau: '',
    sessionId: '', // identifiant de session (random(6) -> base64)
    phrase: null,
    dateJourConnx: null,
    sessionSync: null, // objet de trace de la dernière session suynchro (en IDB)

    opencours: null, // Objet opération de l'opération en cours (sauf ProcessQueue)
    sessionSync: null, // Objet de classe SessionSync trçant l'état de synchronisation d'une session sur IDB

    statutIdb: false,
    nombase: '',
    volumeTable: '',

    statutNet: false,
    syncqueue: [], // accumulation des syncList reçues par webSocket

    compte: null,
    estComptable: false,
    clek: null,
    clepubc: null,
    prefs: null,

    avatarId: null,
    groupeId: null,
    coupleId: null,

    blocage: 0, // niveau de blocage: 1-Alerte informative, 2:restriction de volume, 3:passif, 4:bloqué
    infoBlocage: false,
    infoBlocageResolve: null,
    rappelBlocage: 0,
    dernierBlocage: this
  }),

  getters: {
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
    resetReseau () { if (this.status === 0) this.reseau = '' },
    setReseau (reseau) {
      const config = stores.config
      if (this.status === 0 && config.reseaux.indexOf(reseau) !==  -1 && !this.reseau !== reseau) this.reseau = reseau
    },
    setCompte (obj) { this.compte = obj },
    setPrefs (obj) { this.prefs = obj },

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
