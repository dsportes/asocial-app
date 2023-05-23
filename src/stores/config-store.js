import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'

export const useConfigStore = defineStore('config', {
  state: () => ({
    $q: null,
    /* Calculées par appconfig.js */
    build: 0,
    debug: false,
    dev: false,
    
    urlwss: '',
    urlserveur: '',
    fsSync: false,

    aide: {},
    locales: [],
    motsclesloc: {},

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
    fsSync: false,
    portupload: 33666,
    phrases: [
      'leszsanglotszLONGSzgarezauzGORILLEz',
      'auzvillagezSANSzjaizmauvaisezREPUTATIONz'
    ],
    nomDuComptable: 'Comptable',
    nomTribuPrimitive: 'Primitive',
    allocComptable: [32, 32, 256, 256],
    quotas: { '0': 0, 'XXS': 1, 'XS': 2, 'SM': 4, 'MD': 8, 'LG': 16, 'XL': 32, 'XXL': 64 },
    profils: [[10, 10], [50, 50], [250, 250], [50, 10], [250, 50]],
  
    limitesjour: { dlv: 365, secrettemp: 60, sponsoring: 14, groupenonheb: 120 },
    lgtitre: 120,
    maxlgtextegen: 250,
    maxlgtextesecret: 5000,
  
    motscles: {},

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
      for(const x in cfg) this[x] = cfg[x]
    },

    setEmojiIndex (ei) {
      this.emojiIndex = ei
    }

  }
})
