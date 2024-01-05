import { defineStore } from 'pinia'
import { $t, hms } from '../app/util.mjs'

const seuillarge = 900
const pagesF = new Set(['chats', 'espace', 'tranche', 'people', 'groupes', 'groupesac', 'groupe', 'notes'])
const tabF = new Set(['membres'])
const pagesB = new Set(['espace', 'compte', 'groupes', 'groupesac', 'notes', 'ficavion'])

export const useUiStore = defineStore('ui', {
  state: () => ({
    diag: '',
    diagresolve: null,

    etroite: false,
    screenWidth: 0,

    pagetab: '',
    page: 'login',
    pageback: '',
    menug: false,
    pfiltre: false,

    dialogueerreurresolve: null,
    exc: null, // Exception trappée : en attente de décision de l'utilisateu

    messageto: null, // timeOut du message affiché
    message: null,

    cveditionId: 0, // id de l'avatar / groupe dont la CV est en édition

    helpstack: [],

    etf: 0, // étape fichier
    ccfic: null, // copier coller fichier

    notifc: null, // notification courante en cours d'édition

    egrplus: false, // un contact peut-être ajouté au groupe courant

    dernierfichiercree: '',

    ps: null, // objet props du dialogue PhraseSecrete

    idc: 1,

    // gestion des dialogues
    dialogStack: [],

    d: {
      aunmessage: false,
      PSouvrir: false,
      choixEmoji: false,
      diag: false, // App
      confirmFerm: false,
      dialogueerreur: false,
      dialoguehelp: false,
      pressepapier: false,
      dialoguedrc: false,
      detailspeople: false,
      confirmstopop: false,
      opDialog: false,
      MCmcledit: false, // MotsCles
      PPnvnote: false, // PressePapier
      PPsupprnote: false,
      PPnvfic: false,
      PPsupprdic: false,
      PAoutilsTests: false, // PageAccueil
      FAdetaildial: false, // PageFicavion
      AGvisucv: false, // ApercuGenx
      AMconfig: {}, // ApercuMembre
      AMoubli: {},
      AMinvit: {},
      NSnvsp: false, // NouveauSponsoring
      PTedq: false, // PageTranche
      PTcptdial: false,
      PMdetailsmembre: false, // PanelMembre
      BPchgTr: {}, // BarrePeople
      BPchgSp: {},
      BPcptdial: {},
      OTsuppbase: false, // OutilsTests
      OTrunning: false,
      AAeditionpc: {}, // ApercuAvatar
      ACchatedit: false, // ApercuChat
      ACouvrir: {},
      ACconfirmeff: false,
      ACconfirmrac: false,
      ACGchatedit: false, // ApercuChatgr
      ACGouvrir: {},
      ACGconfirmeff: false,
      CVedition: false, // CarteVisite
      AGnvctc: {}, // ApercuGroupe
      AGediterUna: {},
      AGgererheb: {},
      AMmcedit: {}, // ApercuMotscles
      DNdialoguenotif: {}, // DialogueNotif
      ATconfirmdel: {}, // ApercuTicket
      ATdialtk: {},
      EMmax: {}, // EditeurMd
      IAaccinvit: {}, // InvitationAcceptation
      ACVouvrir: false, // ApercuCv
      MMedition: {}, // McMemo
      PCnouveautk: false, // PanelCredits
      PCdialtk: {}, // PanelCredits
      SHfs: {}, // ShowHtml
      NFouvrir: false, // NouveauFichier
      NFsupprfichier: false, // NoteFichier
      NFconfirmav1: false,
      NFconfirmav2: false,
      NNnotenouvelle: false, // NoteNouvelle
      SAsuppravatar: false, // SupprAvatar
      SAconfirmsuppr: false,
      PCnvav: false, // PageCompte
      PCchgps: false,
      PAedprf: false, // PageAdmin
      PAcreationesp: false,
      PAcheckpoint: false,
      PApageespace: false,
      CCouvrir: false, // ContactChat
      PGcrgr: false, // PageGroupes
      PEnt: false, // PageEspace
      PEedcom: false,
      PEedq: false,
      ASaccsp: false, // AcceptationSponsoring
      NE: false, // NoteEdit
      NX: false, // NoteExclu
      NM: false, // NoteMc
      NF: false, // NoteFichier
      NC: false, // NoteConfirme
      PNdl: false, // PageNotes
    }

  }),

  getters: {
    aUnFiltre (state) { 
      if (!pagesF.has(state.page)) return false
      return !state.pagetab || tabF.has(state.pagetab)
    }
  },

  actions: {
    setScreenWidth (w) {
      const et = w < seuillarge
      if (this.screenWidth === 0) {
        this.screenWidth = w
        this.etroite = et
      } else {
        if (et !== this.etroite) {
          this.etroite = et
          if (!this.aUnFiltre) 
            this.setPFiltre(false)
          else 
            this.redoPFiltre()
        }
      }
    },

    getIdc () {
      return this.idc++
    },

    fD () {
      const e = this.dialogStack.pop()
      if (e) {
        if (e[1] !== 0)
          delete this.d[e[0]][e[1]]
        else
          this.d[e[0]] = false
      }
    },

    oD (n, idc) {
      const ix = idc || 0
      this.dialogStack.push([n, ix])
      if (typeof this.d[n] === 'object') this.d[n][ix] = true
      else this.d[n] = true
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
        if (e[1] !== 0)
          delete this.d[e[0]][e[1]]
        else
          this.d[e[0]] = false
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
      this.pageback = pagesB.has(this.page) ? this.page : ''
      this.page = p
      this.menug = false
      this.setTab(t)
    },

    setTab (tab) {
      this.pagetab = tab
    },

    gotoBack () {
      if (this.pageback) this.setPage(this.pageback)
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
        this.oD('dialogueerreur')
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
      if (this.helpstack.length === 0) this.oD('dialoguehelp')
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

    // Fonctions internes à une page. Appel par détection ui.$onAction
    jailu () { }, // Invoquée par App.vue, le bouton fait partie de la toolbar

    setEtf (etf) { this.etf = etf },

    setFichiercree (nom) {
      this.dernierfichiercree = nom
    },

    fmsg (n, msg) {
      const filtreMsg = hms(new Date(), true) + ' / ' + (msg || $t('items', n, { count: n }))
      this.afficherMessage(filtreMsg)
    }
  }
})
