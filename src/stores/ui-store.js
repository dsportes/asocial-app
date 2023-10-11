import { defineStore } from 'pinia';

import { sleep } from '../app/util.mjs'
import { MD } from '../app/modele.mjs'

export const useUiStore = defineStore('ui', {
  state: () => ({
    diag: '',
    diagresolve: null,

    pagetab: '',
    page: 'login',
    pageback: '',
    menug: false,
    pagesF: new Set(['chats', 'espace', 'tranche', 'people', 'groupes', 'groupesac', 'groupe', 'notes']),
    tabF: new Set(['membres']),
    pagesB: new Set(['espace', 'compte', 'groupes', 'groupesac', 'notes', 'ficavion']),

    dialogueerreurresolve: null,
    exc: null, // Exception trappée : en attente de décision de l'utilisateu

    messageto: null, // timeOut du message affiché
    message: null,
    aunmessage: false,

    helpstack: [],

    etf: 0, // étape fichier
    ccfic: null, // copie cololler fichier

    naplus: null, // na de l'avatar proposant d'ajouter un contact au groupe egrplus
    egrplus: null, // élément e du groupe dans lequel un contact peut-être ajouté

    dernierfichiercree: ''
  }),

  getters: {
  },

  actions: {
    aFiltre (p, t) {
      if (!this.pagesF.has(p)) return false
      return !t || this.tabF.has(t)
    },

    setPage (p, t) {
      this.pageback = this.pagesB.has(this.page) ? this.page : ''
      this.page = p
      this.menug = false
      this.setTab(t)
    },

    setTab (tab) {
      this.pagetab = tab
    },

    closeMenug () { 
      this.menug = false
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
      if (MD.val('dialogueerreur')) return
      return new Promise((resolve) => {
        MD.oD('dialogueerreur')
        this.dialogueerreurresolve = resolve
        this.exc = exc
      })
    },

    resetExc () { 
      this.exc = null
      MD.fD()
      this.dialogueerreurresolve = null
    },

    fermerHelp () { MD.fD(); this.helpstack.length = 0 },
    pushhelp (page) {
      if (this.helpstack.length === 0) MD.oD('dialoguehelp')
      this.helpstack.push(page)
    },
    pophelp () {
      if (this.helpstack.length === 1) {
        MD.fD()
        this.helpstack.length = 0
      } else {
        this.helpstack.splice(this.helpstack.length - 1, 1)
      }
    },

    // Fonctions internes à une page. Appel par détection ui.$onAction
    jailu () { }, // Invoquée par App.vue, le bouton fait partie de la toolbar

    setEtf (etf) { this.etf = etf },

    setFichiercree (nom) {
      this.dernierfichiercree = nom
    }
  }
})
