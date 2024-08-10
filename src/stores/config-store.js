import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'
import { Tarif } from '../app/api.mjs'

export const useConfigStore = defineStore('config', {
  state: () => ({
    $q: null,
    /* Calculées par appconfig.js */
    build: 0,
    debug: false,
    dev: false,
    
    wssrv: '',
    urlserveur: '',

    subJSON: '', // subscription obtenu de SW sérialisé
    pageSessionId: '', // rnd, identifiant universel du chargement de la page (session browser)
    nc: 0, // numéro d'ordre de connexion dans la session
    permission: false,

    aide: {},
    locales: [],
    motsclesloc: {},

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
    phrases: [
      'leszsanglotszLONGSzgarezauzGORILLEz',
      'auzvillagezSANSzjaizmauvaisezREPUTATIONz'
    ],
    nomDuComptable: 'Comptable',
    nomTribuPrimitive: 'Primitive',
    allocComptable: [8, 2, 4],
    allocPrimitive: [256, 256, 256],
    quotas: { '0': 0, 'XXS': 1, 'XS': 2, 'SM': 4, 'MD': 8, 'LG': 16, 'XL': 32, 'XXL': 64 },
    profils: [[100, 10, 10], [1000, 50, 50], [10000, 250, 250], [1000, 50, 10], [10000, 250, 50]],
      
    lgtitre: 120,
    maxlgtextegen: 250,
    maxlgtextenote: 5000,
    alertedlv: 40,

    /* Une base locale IDB non resynchronisée depuis plus de idbObs jours est
    considérée comme obsolète et détruite à la première connexion synchronisée */
    idbObs: 500, 
  
    motscles: {},

    /* Autres */
    emojiIndex: null
  }),

  
  getters: {
    motsclesLOC (state) { 
      const lg = useI18n().locale.value
      return state.motsclesloc[lg]
    },
    getCodeQ: (state) => { return (q) => { 
        for (const c in state.quotas) { if (state.quotas[c] === q) return c }
        return ''
      }
    },
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
