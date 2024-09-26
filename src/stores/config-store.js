import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Tarif } from '../app/api.mjs'

export const useConfigStore = defineStore('config', {
  state: () => ({
    $q: null,
    /* Calculées par appconfig.js */
    build: 0,

    subJSON: '???', // subscription obtenu de SW sérialisé
    pageSessionId: '', // rnd, identifiant universel du chargement de la page (session browser)
    nc: 0, // numéro d'ordre de connexion dans la session
    permission: false,

    aide: {},
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
    }

  }
})
