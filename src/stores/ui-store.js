import { defineStore } from 'pinia';

import { sleep } from '../app/util.mjs'

export const useUiStore = defineStore('ui', {
  state: () => ({
    page: 'login',
    pageback: '',
    pagetab: '',

    pagesF: new Set(['chats', 'tribus', 'tribu', 'people', 'groupes', 'groupesac', 'groupe']),
    tabF: new Set(['membres']),
    pagesB: new Set(['tribus', 'groupes', 'groupesac']),
    menu: false,

    // filtre: false,

    etroite: false,
    seuillarge: 800,

    dialogueerreur: false,
    dialogueerreurresolve: null,
    exc: null, // Exception trappée : en attente de décision de l'utilisateu

    detailspeople: false,

    detailsmembre: false,

    detailsavatar: false,
    
    dialoguehelp: false,
    helpstack: [],

    messageto: null, // timeOut du message affiché
    message: null,
    aunmessage: false,

    dialoguedrc: false, // App et page accueil

    choixEmoji: false,
  }),

  getters: {
    filtre: (state) => {
      if (!state.pagesF.has(state.page)) return false
      return !state.pagetab || state.tabF.has(state.pagetab)
    }
  },

  actions: {
    setEtroite (v) {
      this.etroite = v
      this.menu = false
      if (!this.etroite && this.filtre) 
        setTimeout(() => { this.menu = true }, 500)
    },
    async setPage (p, tab) {
      this.menu = false
      this.pageback = this.pagesB.has(this.page) ? this.page : ''
      this.page = null
      await sleep(200)
      this.page = p
      this.setPageTab(tab || '')
    },

    setPageTab (tab) {
      this.pagetab = tab
      this.menu = this.filtre && !this.etroite
    },

    async setPageBack () {
      if (!this.pageback) return
      await this.setPage(this.pageback)
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

    // Fonctions internes à une page. Appel par détection ui.$onAction
    jailu () { }, // Invoquée par App.vue, le bouton fait partie de la toolbar
  
    secrets () { }
  }
})
