import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', {
  state: () => ({
    $q: null,
    build: 0,
    debug: false,
    dev: false,
    search: '',
    
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
    motscles: {},
    limitesjour: {},

  }),

  getters: {
  },

  actions: {
    setConfig(cfg, search) {
      this.debug = true // cfg.debug
      this.search = search && search.length > 1 ? search.substring(1) : ''
      this.localeOptions = cfg.localeOptions
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
      this.dtf = new Intl.DateTimeFormat(this.locale, cfg.datetimeformat)
      this.dtf1 = new Intl.DateTimeFormat(this.locale, cfg.datetimeformat1)
      this.dtf2 = new Intl.DateTimeFormat(this.locale, cfg.datetimeformat2)
      this.rappelblocageenminutes = cfg.rappelblocageenminutes || 5
      this.quotas = cfg.quotas
      this.maxlgtextegen = cfg.maxlgtextegen || 250
      this.maxlgtextesecret = cfg.maxlgtextesecret || 5000
      const mc = cfg.motscles
      const m = {}
      for (const idx in mc) {
        const e = mc[idx]
        let val = e[this.locale]
        if (!val) val = e.fr
        if (val) m[idx] = val
      }
      this.motscles = m
      this.limitesjour = cfg.limitesjour || { }
      if (!this.limitesjour.dlv) this.limitesjour.dlv = 365
      if (!this.limitesjour.secrettemp) this.limitesjour.secrettemp = 80
      if (!this.limitesjour.sponsoring) this.limitesjour.sponsoring = 14
      if (!this.limitesjour.groupenonheb) this.limitesjour.groupenonheb = 120
      this.raisonsblocage = cfg.raisonsblocage
    },

    setEmojiIndex (ei) {
      this.emojiIndex = ei
    }

  }
})
