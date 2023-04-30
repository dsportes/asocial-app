import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'

export const useConfigStore = defineStore('config', {
  state: () => ({
    $q: null,
    build: 0,
    debug: false,
    dev: false,
    
    urlwss: '',
    urlserveur: '',
    fsSync: false,

    emojiIndex: null,
    localeOptions: [],
    locale: 'fr-FR',
    logo: '',
    help: {},
    cliccamera: '',
    iconAvatar: '',
    iconGroupe: '',
    iconGroupe: '',
    iconContact: '',
    iconDisparu: '',
    iconSuperman: '',
    lgnom: 16,
    lgtitre: 50,
    nomDuComptable: '',

    phrases: [],
    dtf: null,
    dtf1: null,
    dtf2: null,
    rappelblocageenminutes: 60,
    forfaits: {},
    maxlgtextegen: 250,
    maxlgtextesecret: 5000,
    motsclesloc: {},
    limitesjour: {},

  }),

  
  getters: {
    motscles (state) { 
      const lg = useI18n().locale.value
      return state.motsclesloc[lg]
    }
  },

  actions: {
    setConfig(cfg) {
      this.debug = true // cfg.debug
      this.localeOptions = cfg.localeOptions
      this.locales = []
      this.localeOptions.forEach(t => {this.locales.push(t.value)})
      this.locale = cfg.locale
      this.fsSync = cfg.fsSync
      this.logo = cfg.logo
      this.nomDuComptable = cfg.nomDuComptable || 'Comptable'
      this.nomTribuPrimitive = cfg.nomTribuPrimitive || 'Primitive'
      this.allocComptable = cfg.allocComptable || [32, 32, 256, 256]
      this.cliccamera = cfg.cliccamera
      this.iconAvatar = cfg.iconAvatar
      this.iconGroupe = cfg.iconGroupe
      this.iconContact = cfg.iconContact
      this.iconDisparu = cfg.iconDisparu
      this.iconSuperman = cfg.iconSuperman
      this.lgnom = cfg.lgnom || 16
      this.lgtitre = cfg.lgtitre || 50
      this.build = cfg.build
      this.dev = cfg.dev
      this.urlwss = cfg.urlwss
      this.urlserveur = cfg.urlserveur
      this.help = cfg.help
      this.phrases = cfg.phrases
      this.quotas = cfg.quotas
      this.maxlgtextegen = cfg.maxlgtextegen || 250
      this.maxlgtextesecret = cfg.maxlgtextesecret || 5000
      const mc = cfg.motscles
      this.motsclesloc = {}
      this.locales.forEach(l => { 
        const lmc = {}
        this.motsclesloc[l] = lmc
        for (const idx in mc) {
          const e = mc[idx]
          let val = e[l]
          if (!val) val = e[this.locale]
          if (val) lmc[idx] = val
        }
      })
      this.limitesjour = cfg.limitesjour || { }
      if (!this.limitesjour.dlv) this.limitesjour.dlv = 365
      if (!this.limitesjour.secrettemp) this.limitesjour.secrettemp = 80
      if (!this.limitesjour.sponsoring) this.limitesjour.sponsoring = 14
      if (!this.limitesjour.groupenonheb) this.limitesjour.groupenonheb = 120
      this.profils = cfg.profils || [[10, 10], [50, 50], [250, 250], [50, 10], [250, 50]]
    },

    setEmojiIndex (ei) {
      this.emojiIndex = ei
    }

  }
})
