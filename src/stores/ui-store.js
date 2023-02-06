import { defineStore } from 'pinia';

import stores from './stores.mjs'
import { sleep } from '../app/util.mjs'

export const useUiStore = defineStore('ui', {
  state: () => ({
    page: 'login',
    dialogueerreur: false,
    dialogueerreurresolve: null,
    exc: null, // Exception trappée : en attente de décision de l'utilisateu

    dialoguehelp: false,
    helpstack: [],

    messageto: null, // timeOut du message affiché
    message: null,
    aunmessage: false,

    tabCompte: 'listeAvatars',
    tabAvatar: 'detailAvatar',

    panelContacts: false,
    fichiersAvion: false,
    infoSession: false,
    testPing: false,
    gestionBases: false,
    menu: false,
    rapportSynchro: false,
    rapportSynchroMenu: false,
    outilsTests: false,
    nouvelAvatar: false,
    repartirForfaits: false,
    choixEmoji: false,

    ardoiseTribu: false,
    ardoiseTCompta: null,
    ardoiseTNaTribu: null,

    comptaObj: null,
    panelCompta: false,

  }),

  getters: {
  },

  actions: {
    async setPage (p) {
      this.page = null
      await sleep(500)
      this.page = p
    },
    goto10 () { stores.session.status = 10; this.tabCompte = 'detailCompte' },
    goto11 () { stores.session.status = 11; this.tabCompte = 'listeAvatars' },
    goto12 () { stores.session.status = 12; this.tabCompte = 'listeTribus' },
    
    goto20 (avid) {
      const session = stores.session
      if (avid) session.avatarId = avid
      session.status = 20
      this.tabAvatar = 'detailAvatar'
    },

    goto21 (avid) {
      const session = stores.session
      if (avid) session.avatarId = avid
      session.status = 21
      this.tabAvatar = 'listeSecrets'
    },

    goto22 (avid) {
      const session = stores.session
      if (avid) session.avatarId = avid
      session.status = 22
      this.tabAvatar = 'listeContacts'
    },

    goto23 (avid) {
      const session = stores.session
      if (avid) session.avatarId = avid
      session.status = 23
      this.tabAvatar = 'listeGroupes'
    },

    afficherMessage (texte, important) {
      if (this.messageto) clearTimeout(this.messageto)
      this.message = { texte, important: important || false }
      this.aunmessage = true
      this.messageto = setTimeout(() => { 
        this.effacermessage()
      }, important ? 10000 : 5000)
    },

    effacermessage () {
      this.message = null
      this.aunmessage = false
    },

    async afficherExc (exc) {
      if (this.dialogueerreur) return
      return new Promise((resolve) => {
        this.dialogueerreur = true
        this.dialogueerreurresolve = resolve
        this.exc = exc
      })
    },

    resetExc () { 
      this.exc = null
      this.dialogueerreur = false
      this.dialogueerreurresolve = null
    },

    fermerHelp () { this.dialoguehelp = false; this.helpstack.length = 0 },
    pushhelp (page) {
      if (this.helpstack.length === 0) this.dialoguehelp = true
      this.helpstack.push(page)
    },
    pophelp () {
      if (this.helpstack.length === 1) {
        this.dialoguehelp = false
        this.helpstack.length = 0
      } else {
        this.helpstack.splice(this.helpstack.length - 1, 1)
      }
    },

    async ouvrirInfoBlocage (force) {
      const session = stores.session
      if (!session.rappelBlocage) session.rappelBlocage = stores.config.rappelblocageenminutes
      const t = new Date().getTime()
      // On n'ouvre pas si c'est la dernière ouverture est récente et que la demande n'est pas impérative
      if (!force && (t - session.dernierBlocage < (session.rappelBlocage * 60000))) return
      return new Promise((resolve) => {
        session.dernierBlocage = t
        session.infoBlocageResolve = resolve
        session.infoBlocage = true
      })
    },
    fermerInfoBlocage () { 
      const session = stores.session
      session.infoBlocage = false
      if (session.infoBlocageResolve) session.infoBlocageResolve()
    },
    
    ouvrirArdoiseTribu (compta, naTribu) {
      this.ardoiseTCompta = compta
      this.ardoiseTNaTribu = naTribu
      this.ardoiseTribu = true
    },

    ouvrirCompta (compta, na) {
      this.comptaObj = {
        x: compta.compteurs,
        av: {
          na: na,
          estPrimaire: compta.estPrimaire
        }
      } 
      this.panelCompta = true    
    },
    fermerCompta () { this.panelCompta = false },
  }
})
