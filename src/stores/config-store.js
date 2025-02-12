import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Tarif } from '../app/api.mjs'
import { b64ToU8, HelpTree } from '../app/util.mjs'

export const useConfigStore = defineStore('config', {
  state: () => ({
    build: 0,

    // données gérées par SW
    nouvelleVersion: false, // nouvelle version disponible
    registration: null, // objet de registration du SW
    subJSON: '???', // subscription obtenu de SW sérialisé
    pageSessionId: '', // rnd, identifiant universel du chargement de la page (session browser)
    nc: 0, // numéro d'ordre de connexion dans la session
    notificationPerm: null,
    permState: '!!!', // granted denied prompt

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
    alerteDlv: 31,

    planHelp: null,
    helpTree: null,

    /* Autres */
    emojiIndex: null
  }),

  
  getters: {
    motsclesLOC (state) { 
      const lg = useI18n().locale.value
      return state.motsclesloc[lg]
    },
    permission: (state) => state.permState === 'granted'
  },

  actions: {
    getHelpPages () {
      if (!this.helpTree) this.helpTree = new HelpTree(this.planHelp)
      return this.helpTree.helpPages
    },

    getHelpArbre () {
      if (!this.helpTree) this.helpTree = new HelpTree(this.planHelp)
      return this.helpTree.arbre
    },

    async getPerm () {
      if (!this.notificationPerm)
        this.notificationPerm = await navigator.permissions.query({ name: 'notifications' })
      const p = this.notificationPerm.state
      if (p !== this.permState) {
        this.permState = p
      }
    },

    async setConfig(cfg) {
      if (cfg.tarifs) 
        Tarif.tarifs = cfg.tarifs
      for(const x in cfg) this[x] = cfg[x]
      await this.getPerm()
    },

    setEmojiIndex (ei) {
      this.emojiIndex = ei
    },

    async setRegistration(registration) {
      await this.listenPerm()
      this.registration = registration
      if (this.permState === 'granted') await this.setSubscription()
      console.log('SW ready. subJSON: ' + this.subJSON.substring(0, 50))
    },

    async listenPerm () {
      await this.getPerm()
      this.notificationPerm.onchange = async () => {
        console.log("User decided to change his seettings. New permission: " + this.notificationPerm.state)
        await this.getPerm()
        if (this.permState === 'granted') await this.setSubscription()
      }
    },

    async setSubscription () {
      if (!this.registration) return
      try {
        let subscription = await this.registration.pushManager.getSubscription() // déjà faite
        if (!subscription) subscription = await this.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: b64ToU8(this.vapid_public_key)
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
