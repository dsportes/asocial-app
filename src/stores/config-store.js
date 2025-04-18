import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Tarif } from '../app/api.mjs'
import { b64ToU8, HelpTree, sleep } from '../app/util.mjs'
import stores from './stores.mjs'

export const useConfigStore = defineStore('config', {
  state: () => ({
    build: 0,

    search: '',
    appurl: '',
    appbase: '',
    readme: '',
    docsurl: '',

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

    OPURL: '',
    PUBSUBURL: '',
    svc: '',
    services: null,
    orgs: {},

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
    session: (state) => stores.session,
    motsclesLOC (state) { 
      const lg = useI18n().locale.value
      return state.motsclesloc[lg]
    },
    permission: (state) => state.permState === 'granted',
    subOK: (state) => state.subJSON !== '???'
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
      for(const svc in this.services)
        for(const org of this.services[svc].orgs) this.orgs[org] = svc
      await this.getPerm()
    },

    setURLs (svc) {
      this.svc = svc
      this.OPURL = this.services[svc].opurl + '/op/'
      this.PUBSUBURL = (this.services[svc].pubsuburl || this.services[svc].opurl) + '/pubsub/'
      console.log('OPURL: ' + this.OPURL)
      console.log('PUBSUBURL: ' + this.PUBSUBURL)
    },

    setEmojiIndex (ei) {
      this.emojiIndex = ei
    },

    async setRegistration(registration) {
      await this.listenPerm()
      this.registration = registration
      if (this.permState === 'granted') await this.setSubscription()
      console.log('SW ready. subJSON: ' + this.subJSON.substring(0, 200))
    },

    async callSW (payload) {
      while (!this.registration) await sleep(1000)
      this.registration.active.postMessage({ type: 'FROM_APP', payload })
    },

    sendNotif (titre, texte, icon) {
      if (this.registration && this.session.acceptNotif) {
        this.registration.showNotification(titre, {
          requireIntercation: false,
          body: texte || '',
          badge: this.logo,
          icon: icon || this.logo
        })
      }
    },

    async listenPerm () {
      await this.getPerm()
      this.notificationPerm.onchange = async () => {
        console.log("User decided to change his settings. New permission: " + this.notificationPerm.state)
        await this.getPerm()
        if (this.permState === 'granted') await this.setSubscription()
      }
    },

    async setSubscription () {
      if (!this.registration) return
      const pm = this.registration.pushManager
      if (!pm) {
        const m = 'pushManager pas disponsible dans ce browser'
        console.log(m)
        this.subJSON = '???' + m
        return
      }
      console.log('pushManager getSubscription')
      try {
        let subscription = await pm.getSubscription() // déjà faite
        if (!subscription) subscription = await pm.subscribe({
            userVisibleOnly: true,
            applicationServerKey: b64ToU8(this.vapid_public_key)
          })
        this.subJSON = JSON.stringify(subscription)
        console.log('subJSON: ' + this.subJSON.substring(0, 200))
      } catch (e) {
        console.log(e.toString())
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
