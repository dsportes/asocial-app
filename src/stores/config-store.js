import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Tarif } from '../app/api.mjs'

export const useConfigStore = defineStore('config', {
  state: () => ({
    build: 0,

    // données gérées par SW
    nouvelleVersion: false, // nouvelle version disponible
    registration: null, // objet de registration du SW
    subJSON: '???', // subscription obtenu de SW sérialisé
    pageSessionId: '', // rnd, identifiant universel du chargement de la page (session browser)
    nc: 0, // numéro d'ordre de connexion dans la session
    permission: false, // true si la session a accepté les notifications web-push

    locales: [],
    motsclesloc: {},
    motscles: {},

    pagesHelp: new Set(),

    logo: '',
    cliccamera: '',
    iconAvatar: '',
    iconGroupe: '',
    iconGroupe: '',
    iconSuperman: '',

    /* Directement de config.mjs */
    locale: 'fr-FR',
    localeOptions: [
      { value: 'en-EN', label: 'English',  flag: '🇬🇧' },
      { value: 'fr-FR', label: 'Français', flag: '🇫🇷' }
    ],
    portupload: 33666,
    phrases: [ ],
      
    lgtitre: 120,
    maxlgtextegen: 250,
    maxlgtextenote: 5000,
    alerteDlv: 15,

    /* Autres */
    emojiIndex: null
  }),

  
  getters: {
    motsclesLOC (state) { 
      const lg = useI18n().locale.value
      return state.motsclesloc[lg]
    }
  },

  actions: {
    setConfig(cfg) {
      Tarif.tarifs = cfg.tarifs
      for(const x in cfg) this[x] = cfg[x]

      cfg.planHelp.forEach(s => {
        s.lp.forEach(p => { this.pagesHelp.add(p) })
        this.pagesHelp.add(s.id) 
      })
  
    },

    setEmojiIndex (ei) {
      this.emojiIndex = ei
    },

    async setRegistration(registration) {
      this.registration = registration
      await this.setSubscription()
      console.log('SW ready. subJSON: ' + this.subJSON.substring(0, 50))
    },

    async setSubscription () { // peut être invoqué sur demande permission de web-push
      if (!this.registration) return
      try {
        let subscription = await this.registration.pushManager.getSubscription() // déjà faite
        if (!subscription) subscription = await this.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: b64ToU8(stores.config.vapid_public_key)
          })
        this.subJSON = JSON.stringify(subscription)
      } catch (e) {
        this.subJSON = '???' + e.message
      }
    },

    // ServiceWorker : événements de détection de changement de version
    setSwev (x) {
      console.log('SW event reçu:', x)
      if (x === 'updated') this.nouvelleVersion = true
    }

  }
})
