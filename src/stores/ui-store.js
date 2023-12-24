import { defineStore } from 'pinia'
import { $t, hms } from '../app/util.mjs'

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

    mcmemoId: 0, // id du McMemo en édition
    cveditionId: 0, // id de l'avatar / groupe dont la CV est en édition

    helpstack: [],

    etf: 0, // étape fichier
    ccfic: null, // copier coller fichier

    notifc: null, // notification courante en cours d'édition

    egrplus: false, // un contact peut-être ajouté au groupe courant

    dernierfichiercree: '',

    ps: null, // objet props du dialogue PhraseSecrete

    // gestion des dialogues
    dialogStack: [],

    d: {
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
      AMconfig: false, // ApercuMembre
      AMinvit: false,
      NSnvsp: false, // NouveauSponsoring
      PTedq: false, // PageTranche
      PTcptdial: false,
      PMdetailsmembre: false, // PanelMembre
      BPchgTr: false, // BarrePeople
      BPchgSp: false,
      BPcptdial: false,
      OTsuppbase: false, // OutilsTests
      OTrunning: false,
      AAeditionpc: false, // ApercuAvatar
      ACchatedit: false, // ApercuChat
      ACouvrir: false,
      ACconfirmeff: false,
      ACconfirmrac: false,
      ACGchatedit: false, // ApercuChatgr
      ACGouvrir: false,
      ACGconfirmeff: false,
      CVedition: false, // CarteVisite
      AGnvctc: false, // ApercuGroupe
      AGediterUna: false,
      AGgererheb: false,
      AMmcedit: false, // ApercuMotscles
      DNdialoguenotif: false, // DialogueNotif
      ATreceptk: false, // ApercuTicket
      ATconfirmdel: false,
      EMmax: false, // EditeurMd
      IAaccinvit: false, // InvitationAcceptation
      ACVouvrir: false, // ApercuCv
      MMedition: false, // McMemo
      PCnouveautk: false, // PanelCredits
      PDdialtk: false, // PanelDialtk
      SHfs: false, // ShowHtml
      NFouvrir: false, // NouveauFichier
      NTsupprfichier: false, // NoteFichier
      NTconfirmav1: false,
      NTconfirmav2: false,
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
  },

  actions: {
    fD () {
      const d = this.dialogStack.pop()
      if (d) this.d[d] = false
    },

    oD (d) {
      this.dialogStack.push(d)
      this.d[d] = true
    },

    estOuvert (d) {
      return this.dialogStack.indexOf(d) !== -1
    },

    resetD () {
      this.dialogStack.forEach(d => { this.d[d] = false})
      this.dialogStack.length = 0
    },

    aFiltre (p, t) {
      if (!this.pagesF.has(p)) return false
      return !t || this.tabF.has(t)
    },

    setPage (p, t) {
      this.resetD()
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
      }, important ? 10000 : 2000)
    },

    effacermessage () {
      this.message = null
      this.aunmessage = false
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
