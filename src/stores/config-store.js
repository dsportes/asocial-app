import { defineStore } from 'pinia'

export const useConfigStore = defineStore('config', {
  state: () => ({
    $q: null,
    emojiIndex: null,
    localeOptions: [],
    locale: 'fr-FR',
    reseaux: [],
    icons: {},
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
    build: 0,
    debug: false,
    dev: false,
    urlwss: '',
    urlserveur: '',
    search: '',
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
    setConfig(cfg, icons, search) {
      this.localeOptions = cfg.localeOptions
      this.locale = cfg.locale
      this.reseaux = cfg.reseaux
      this.icons = icons
      this.logo = cfg.logo
      this.cliccamera = cfg.cliccamera
      this.iconAvatar = cfg.iconAvatar
      this.iconGroupe = cfg.iconGroupe
      this.iconContact = cfg.iconContact
      this.iconDisparu = cfg.iconDisparu
      this.iconSuperman = cfg.iconSuperman
      this.lgnom = cfg.lgnom || 16
      this.lgtitre = cfg.lgtitre || 50
      this.build = cfg.build
      this.debug = cfg.debug
      this.dev = cfg.dev
      this.urlwss = cfg.urlwss
      this.urlserveur = cfg.urlserveur
      this.help = cfg.help
      this.phrases = cfg.phrases
      if (search && search.length > 1) { 
        this.search = search.substring(1)
        if (this.search !== '666' && this.reseaux.indexOf(this.search) !== -1) this.reseauDef = this.search
      }
      this.dtf = new Intl.DateTimeFormat(this.locale, cfg.datetimeformat)
      this.dtf1 = new Intl.DateTimeFormat(this.locale, cfg.datetimeformat1)
      this.dtf2 = new Intl.DateTimeFormat(this.locale, cfg.datetimeformat2)
      this.rappelblocageenminutes = cfg.rappelblocageenminutes || 5
      this.forfaits = cfg.forfaits
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
      this.limitesjour = cfg.limitesjour || { secrettemp: 60, parrainage: 14, groupenonheb: 180 }
      this.raisonsblocage = cfg.raisonsblocage
    },

    setEmojiIndex (ei) {
      this.emojiIndex = ei
    }

  }
})
