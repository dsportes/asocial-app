import { defineStore } from 'pinia'
import { $t, hms } from '../app/util.mjs'

const seuillarge = 900
const pagesF = new Set(['chats', 'espace', 'partition', 'people', 'groupes', 'groupesac', 'groupe', 'invitation', 'notes'])
const tabF = new Set(['membres'])
const pagesB = new Set(['espace', 'compte', 'groupes', 'groupesac'])

// Le compteur de dialogues ouverts DOIT ne pas être remis à 0
// à la déconnexion (en fait au reset du store ui)
const X = {
  idc: 1
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    diag: '',
    diagresolve: null,

    etroite: false,
    screenWidth: 0,
    screenHeight: 0,
    portrait: false,

    pagetab: '',
    page: 'login',
    pageback: '',
    menug: false,
    pfiltre: false,

    dialogueerreurresolve: null,
    exc: null, // Exception trappée : en attente de décision de l'utilisateu

    messageto: null, // timeOut du message affiché
    message: null,

    filtreMsgTo: null,
    filtreMsg: null,

    cveditionId: 0, // id de l'avatar / groupe dont la CV est en édition

    helpstack: [],

    etf: 0, // étape fichier
    ccfic: null, // copier coller fichier

    notifc: null, // notification courante en cours d'édition

    egrplus: false, // un contact peut-être ajouté au groupe courant
    selContact: 0, // contact sélectionné

    dernierfichiercree: '',

    ps: null, // objet props du dialogue PhraseSecrete

    // gestion des dialogues
    // Le compteur de dialogues ouverts idc DOIT ne pas être remis à 0
    // à la déconnexion (en fait au reset du store ui)
    reLogin: true,
    dialogStack: [],
    d: { a: {} }

  }),

  getters: {
    aUnFiltre (state) { 
      if (!pagesF.has(state.page)) return false
      return !state.pagetab || tabF.has(state.pagetab)
    },
    urgence (state) { return state.page === 'compta' && state.pagetab === 'chats' },
    edStack (state) {
      let s = []
      state.dialogStack.forEach(t => { s.push(t[0] + '.' + t[1]) })
      return s.join(' | ')
    }
  },

  actions: {
    setScreenWH (w, h) {
      this.portrait = w < h
      this.screenHeight = h
      const et = w < seuillarge
      if (this.screenWidth === 0) {
        this.screenWidth = w
        this.etroite = et
      } else {
        if (et !== this.etroite) {
          this.etroite = et
          // console.log('etroite', et)
          if (!this.aUnFiltre) 
            this.setPFiltre(false)
          else 
            this.redoPFiltre()
        }
      }
    },

    getIdc () {
      X.idc++
      this.d[X.idc] = {}
      return X.idc
    },

    closeVue (idc) {
      const ds = []
      this.dialogStack.forEach(e => { if (e[0] !== '' + idc) ds.push(e)})
      this.dialogStack = ds
      if (idc !== 'a') delete this.d[idc]
    },

    fD () {
      const l = this.dialogStack.length
      const e = l ? this.dialogStack[l - 1] : null
      if (e) {
        this.dialogStack.length = l - 1
        const x = this.d[e[1]]
        if (x) x[e[0]] = false
      }
    },

    oD (n, idc) {
      const ix = '' + idc
      if (!this.d[ix]) this.d[ix] = {}
      this.d[ix][n] = true
      this.dialogStack.push([n, ix])
    },

    xD (n, idc) {
      if (!idc || !this.d[idc]) return false
      return this.d[idc][n] !== undefined
    },

    estOuvert (n) {
      for (let i = 0; i < this.dialogStack.length; i++) {
        const e = this.dialogStack[i]
        if (e[0] === n) return true
      }
      return false
    },

    resetD () {
      this.dialogStack.forEach(e => { 
        if (e[0] !== 'a') delete this.d[e[0]] 
        else this.d.a[e[1]] = false
      })
      this.dialogStack.length = 0
    },

    ouvrFiltre () { 
      this.setPFiltre(!this.pfiltre)
    },

    fermFiltre () { 
      this.setPFiltre(false)
    },

    setPFiltre (v) {
      setTimeout(() => {
        this.pfiltre = v
      }, 200)
    },

    redoPFiltre () {
      setTimeout(() => {
        this.pfiltre = false
          setTimeout(() => {
            this.pfiltre = true
          }, 200)
      }, 200)
    },

    setPage (p, t) {
      this.resetD()
      this.pageback = pagesB.has(this.page) ? this.page : 'accueil'
      this.page = p
      this.menug = false
      this.setTab(t)
    },

    setTab (tab) {
      this.pagetab = tab
    },

    gotoBack () {
      if (this.page !== 'accueil') this.setPage(this.pageback)
    },

    closeMenug () { 
      this.menug = false
    },
    
    afficherMessage (texte, important) {
      if (this.messageto) clearTimeout(this.messageto)
      this.message = { texte, important: important || false }
      this.d.aunmessage = true
      this.messageto = setTimeout(() => { 
        this.effacermessage()
      }, important ? 10000 : 2000)
    },

    effacermessage () {
      this.message = null
      this.d.aunmessage = false
    },

    async afficherExc (exc) {
      if (this.estOuvert('dialogueerreur')) return
      return new Promise((resolve) => {
        this.oD('dialogueerreur', 'a')
        this.dialogueerreurresolve = resolve
        this.exc = exc
      })
    },

    resetExc () { 
      this.exc = null
      this.fD()
      this.dialogueerreurresolve = null
    },

    fermerHelp () { this.fD(); this.helpstack.length = 0 },
    pushhelp (page) {
      if (this.helpstack.length === 0) this.oD('dialoguehelp', 'a')
      this.helpstack.push(page)
    },
    pophelp () {
      if (this.helpstack.length === 1) {
        this.fD()
        this.helpstack.length = 0
      } else {
        this.helpstack.splice(this.helpstack.length - 1, 1)
      }
    },

    jailu () { }, // Invoquée par App.vue, le bouton fait partie de la toolbar

    setEtf (etf) { this.etf = etf },

    setFichiercree (nom) {
      this.dernierfichiercree = nom
    },

    fmsg (n, msg) {
      if (this.filtreMsgTo) clearTimeout(this.filtreMsgTo)
      this.filtreMsg = hms(new Date(), true) + ' / ' + (msg || $t('items', n, { count: n }))
      this.filtreMsgTo = setTimeout(() => { this.filtreMsg = null }, 2000)
    },

    selectContact (id) {
      this.selContact = id
      this.egrplus = false
      // TODO revenir au dialogue de nouveau contact
    }

  }
})
