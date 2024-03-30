import { defineStore } from 'pinia';
import { encode } from '@msgpack/msgpack'

import stores from './stores.mjs'
import { crypter, decrypter } from '../app/webcrypto.mjs'
import { u8ToB64, intToB64, rnd6, $t, afficherDiag } from '../app/util.mjs'
import { AMJ, ID } from '../app/api.mjs'
import { RegCles } from '../app/modele.mjs'
import { WS } from '../app/ws.mjs'
import { FsSyncSession } from '../app/fssync.mjs'

export const useSessionStore = defineStore('session', {
  state: () => ({
    swev1: false,
    swev2: false,
    registration: null,

    websocket: null,

    status: 0, // 0:fermée, 1:en chargement, 2: ouverte, 3: admin
    mode: 0, // 1:synchronisé, 2:incognito, 3:avion

    ns: 0, // namespace de 10 à 89 : pour "admin" : espace "courant", donc peut être 0
    org: '', // code de l'organisation
    compteId: 0, // id du compte
    clek: null, // clek du compte
    authToken: '',
    phrase: null,
    auj: 0,
    dhConnx: 0, // dh de début de la session
    dh: 0, // dh de la dernière opération
    consocumul: { nl: 0, ne: 0, vm: 0, vd: 0}, // nombres de lectures, écritures, volume montant / descendant sur les POST
    setR: new Set(), // set des restrictions
    /*
      static RAL1 = 1 // Ralentissement des opérations
      static RAL2 = 2 // Ralentissement des opérations
      // Comptes O : compte.qv.pcc > 90% / 100%
      // Comptes A : compte.qv.nbj < 20 / 10
      static NRED = 3 // Nombre de notes / chats / groupes en réduction
      // compte.qv.pcn > 100
      static VRED = 4 // Volume de fichier en réduction
      // compte.qv.pcv > 100
      static LECT = 5 // Compte en lecture seule (sauf actions d'urgence) - P2 C2
      // Comptes 0 : espace.notifP compte.notifC de nr == 2
      static MINI = 6 // Accès minimal, actions d'urgence seulement - P3 C3
      // Comptes 0 : espace.notifP compte.notifC de nr == 3
      static FIGE = 9 // Espace figé en lecture - E2
    */

    lsk: '', // nom de la variable localStorage contenant le nom de la base
    nombase: '', // nom de la base locale
    volumeTable: '', // volume des tables de la base locale

    fsSync: null, // Objet de synchro pour Firestore
    sessionId: '', // identifiant de session si WS (random(6) -> base64)

    estSelegue: false,
    estAutonome: false,

    partitionId: 0, // id de la partition actuelle du compte
    avatarId: 0, // avatar "courant"
    groupeId: 0, // groupe "courant"
    membreId: 0, // membre "courant" (son im/ids dans son groupe)
    peopleId: 0, // people "courant"
    
    naComptable: null,

    espaces: new Map(), // Pour admin SEULEMENT
    syntheses: new Map(), // Pour admin SEULEMENT

    partition: null,
    compte: null,
    compta: null,
    espace: null,
    synthese: null, // Dernière synthèse demandée pour admin - de leur espace pour les comptes

    opEncours: null,
    opSpinner: 0,
    opTimer: null,
    opTimer2: null,
    signalOp: false,

    notifs: { G: null, P: null, C: null, Q: null, X: null },
    niv: 0, // niveau de restriction : 0 1 2
    alire: false, // Il y a des notifications à lire

    /* Exception insurmontable:exc.code ...
    - 9998 : compte clos
    - 9999 : application fermée par l'administrateur
    - autre : exception rencontrée en synchronisation
    */
    excKO: null
  }),

  getters: {
    config (state) { return stores.config },
    filtre (state) { return stores.filtre },
    pSt: (state) => stores.people,
    ui: (state) => stores.ui,

    dlv (state) { return state.ok && state.compte ? state.compte.dlv : 0 },
    nbj (state) { return AMJ.diff(AMJ.dlv(state.dlv), state.auj) },

    estComptable (state) { return ID.estComptable(state.compteId) },
    estAdmin (state) { return state.compteId === 0 },
    estDelegue (state) { return state.compte && state.compte.del },
    estA (state) { return state.compte && state.compte.estA },

    editable (state) { return state.mode < 3 && state.niv < 4 },

    synchro (state) { return state.mode === 1 },
    incognito (state) { return state.mode === 2 },
    avion (state) { return state.mode === 3 },
    accesNet (state) { return state.mode === 1 || state.mode === 2},
    accesNetNf (state) { return state.accesNet && !state.estFige },
    accesIdb (state) { return state.mode === 1 || state.mode === 3},
    ok (state) { return state.status === 2 },

    ntfE (state) { return state.espace && state.espace.notifE ? state.espace.notifE : null },
    ntfP (state) { return state.espace && state.espace.notifP ? state.espace.notifP : null },
    ntfC (state) { return state.compte && state.compte.notif ? state.compte.notif : null },

    mini (state) { (state.ntfP && state.ntfP.nr === 3) || (state.ntfC && state.ntfC.nr === 3) },
    lect (state) { (state.ntfP && state.ntfP.nr >= 2) || (state.ntfC && state.ntfC.nr >= 2) },

    /* NotifIcon.niv :  
    /* niveau d'information / restriction: 
    - 0 : aucune notification
    - 1 : au moins une notification informative
    - 2 : accroissement de volume interdit
    - 3 : accés en lecture seule (sauf urgence)
    - 4 : accés en lecture seule (strict, figé)
    - 5 : accès d'urgence seulement
    - 6 : accés en lecture seule (strict, figé) SANS accès d'urgence
    */

    ntfIco (state) {
      const f = state.setR.has(R.FIGE)
      if (f && state.mini) return 6
      if (state.mini) return 5
      if (f) return 4
      if (state.lect) return 3
      if (state.setR.has(R.VRED) || state.setR.has(R.NRED)) return 2
      if (state.setR.size || state.ntfE || state.ntfP || state.ntfC) return 1
      return 0
    },

    pow (state) {
      if (state.estAdmin) return 1
      if (state.estComptable) return 2
      if (state.estDelegue) return 3
      return 4
    },

    // editable (state) { return state.mode < 3 && state.niv < 2 },
    estSansNotif (state) { return state.niv === 0 },
    estFige (state) { const n = state.notifs.G; return n && (n.nr === 1) },
    estClos (state) { const n = state.notifs.G; return n && (n.nr === 2) },
    estMinimal (state) { return state.niv === 2 },

    // TODO
    estLecture (state) {
      if (state.pow <= 2) return false
      const nt = state.notifs[1]; const nc = state.notifs[2]
      let nr = nt ? nt.nr : 0
      if (nc && nc.nr > nr) nr = nc.nr
      return nr === 3
    },

    estDecr (state) { 
      if (state.pow <= 2) return false
      const n = state.notifs[3]
      return n && (n.nr === 5) 
    },

    roSt (state) {
      if (state.mode === 3) {
        return 1
      } else {
        if (state.estFige) return 2
        else if (state.pow > 2) {
          if (state.estMinimal) return 3
          else if (state.estLecture) return 4
        }
      }
      return 0
    },

    editDiag (state) {
      const y = ['', 'editavion', 'editfige', 'editminimal', 'editlecture']
      const x = state.roSt
      return x ? $t(y[x]) : ''
    },

    getCV: (state) => { return (id) => { return state.pSt.getCV(id) } },

    // PageAdmin ***************************************************    
    paLeFT: (state) => {
      const x = []; state.espaces.forEach(e => { x.push(e) })
      x.sort((a, b) => { return a.id < b.id ? -1 : (a.id === b.id ? 0 : 1)})
      return x
    },

    // PagePartition ***************************************************    
    ptLcFT: (state) => {
      const lcF = state.ptLcF

      const f = state.filtre.tri.partition
      if (!f) { state.ui.fmsg(lcF.length); return lcF }

      const ctf = fx[f][0]
      const ctm = fx[f][1]

      function comp (x, y) {
        if (x.nasp && !y.nasp) return -1
        if (!x.nasp && y.nasp) return 1
        const a = x[ctf]
        const b = y[ctf]
        return a > b ? ctm : (a < b ? -ctm : 0) 
      }

      const x = []; lcF.forEach(t => { x.push(t) })
      x.sort(comp)
      state.ui.fmsg(x.length)
      return x
    },

    ptLcF: (state) => {
      const f = state.filtre.filtre.partition
      if (!f) return state.ptLc
      const r = []
      for (const c of state.ptLc) {
        if (f.avecsp && !c.del) continue
        if (f.nomc) {
          const nom = state.getCV(c.id).nom
          if (!nom.startsWith(f.nomc)) continue
        }
        /* 
        - tcpt compilé
        - it : indice dans la table tcpt (id de la partition)
        - notif: notification de niveau compte
        - del: true si délégué
        - q : 
          - qc qn qv c n v : extraits du document `comptas` du compte
          - pcc : pourcentage d'utilisation de la consommation journalière c / qc
          - pcn : pourcentage d'utilisation effective de qn : n / qn
          - pcv : pourcentage d'utilisation effective de qc : v / qv
        // Filtre notif
        gravite0: '(ignorer)',
        gravite1: 'normale ou importante', // notif existe
        gravite2: 'importante' // notif avec restriction
        0:simple 1:lecture 2:accès minimal, 9:aucune
        */
        const nr = !c.notif ? 9 : c.notif.nr
        if (f.notif && nr === 9) continue
        if (f.notif === 2 && nr ===0) continue
        r.push(c)
      }
      return r
    },

    ptLc: (state) => {
      const t = []
      for (const e of (state.partitionC || state.partition).tcpt)
        if (e && !e.vide && (state.pow < 4 || e.del)) t.push(e)
      return t
    }
  },

  actions: {
    // ServiceWorker : apriori registration ne sert à rien
    setRegistration(reg) {
      this.registration = reg
    },
    // ServiceWorker : événements de détection de changement de version
    setSwev (n) {
      console.log('SW event reçu : ' + n)
      if (n === 1) this.swev1 = true
      else if (n === 2) this.swev2 = true
    },

    setMode (mode) { this.mode = mode },

    setOrg (org) { this.org = org || '' },

    setNs (ns) { this.ns = ns; RegCles.ns = ns },

    /* Initialise une session depuis une phrase secrète
    session.mode et org ont été enregistrés par PageLogin (connexion ou création compte)
    */
    async initSession(phrase) {
      this.phrase = phrase

      const token = { }
      if (this.org === 'admin') token.shax = phrase ? phrase.shax : null
      else {
        if (stores.config.hasWS) {
          this.sessionId = intToB64(rnd6())
          token.sessionId = this.sessionId
        }
        token.hXR = phrase ? phrase.hps1 : null
        token.hXC = phrase ? phrase.hpsc : null
      }
      token.org = this.org      
      this.authToken = u8ToB64(new Uint8Array(encode(token)), true)

      this.lsk = '$asocial$-' + phrase.hps1
      this.nombase = localStorage.getItem(this.lsk) || ''
      
      this.auj = AMJ.amjUtc()
      this.dhConnx = Date.now()
      this.compteId = 0
      this.clek = null
      this.status = 1

      if (this.accesNet) {
        if (stores.config.hasWS) {
          if (this.websocket) this.websocket.close()
          this.websocket = new WS()
          await this.websocket.open()
          this.fsSync = null
        } else {
          this.fsSync = new FsSyncSession()
        }
      }

      RegCles.reset() 
      stores.reset(true) // reset SAUF session
    },

    async setIdClek (id, cleKXC, clek) {
      this.compteId = id
      this.avatarId = id
      this.setNs(ID.ns(id))
      this.clek = clek || await decrypter(this.phrase.pcb, cleKXC)
      const x = await crypter(this.clek, '' + id, 1)
      this.nombase = '$asocial$-' + u8ToB64(x, true)
      if (this.accesIdb) localStorage.setItem(this.lsk, this.nombase)
      return this.clek
    },

    setDh (dh) { if (dh && dh > this.dh) this.dh = dh },

    setDhvu (dhvu) { this.dhvu = dhvu; this.setBlocage() },

    setBlocage () {
      if (this.estAdmin || !this.compte) return
      const c = this.compte
      const dhvu = c ? (c.dhvu || 0) : 0
      this.niv = 0
      this.alire = false
      for (const t in this.notifs) {
        const ntf = this.notifs[t]
        if (ntf && ntf.texte) {
          if (ntf.dh > dhvu) this.alire = true
          if (ntf.nr > this.niv) this.niv = ntf.nr
        }
      }
    },

    /* Le compte a disparu OU l'administrateur a fermé l'application ***********/
    setExcKO (exc) { 
      this.excKO = exc
      stores.ui.setPage('clos') 
    },

    setConso (c) {
      if (c) {
        if (c.nl) this.consocumul.nl += c.nl
        if (c.ne) this.consocumul.ne += c.ne
        if (c.vm) this.consocumul.vm += c.vm
        if (c.vd) this.consocumul.vd += c.vd
      }
    },

    setRestrictions (t) {
      const s = new Set(); if (t && t.length) t.forEach(r => { s.add(r) })
      const now = Date.now()

      this.setR = s
    },

    setStatus (s) {
      this.status = s
    },

    setCompte (compte) { 
      if (compte) {
        this.compte = compte
      } else {
        this.compte = null
        this.compteId = 0
      }
    },

    setCompti (compti) {
      if (!this.compti || this.compti.v < compti.v) this.compti = compti
    }, 

    setCompta (compta) {
      if (!this.compta || this.compta.v < compta.v) this.compta = compta
    },

    setEspace (espace, estAdmin) {
      if (estAdmin) this.espaces.set(espace.id, espace)
      else this.espace = espace
    },

    setPartition (partition) {
      this.partition = partition
    },

    setSynthese (synthese) {
      this.synthese = synthese
    },

    setFsSync (fsSync) {
      this.fsSync = fsSync
    },

    setAvatarId (id) { this.avatarId = id },

    setPeopleId (id) { this.peopleId = id },

    setGroupeId (id) { this.groupeId = id },

    setMembreId (id) { this.membreId = id },

    chgps (phrase) {
      /*
      Suppression de l'ancienne clé lsk donnant le nom de la base du compte
      Recalcul de la nouvelle clé lsk donnant le même nom qu'avant
      Changement du token d'accès
      */
      localStorage.removeItem(this.lsk)
      this.phrase = phrase
      this.lsk = '$asocial$-' + phrase.hps1
      localStorage.setItem(this.lsk, this.nombase)
      const token = {
        sessionId: this.sessionId,
        shax: phrase.shax,
        hps1: phrase.hps1
      }
      const x = new Uint8Array(encode(token))
      this.authToken = u8ToB64(new Uint8Array(x), true)
    },

    setNotifE (ne) {
      const n = this.notifs[0]
      if (ne) {
        if (!n || ne.dh > n.dh) this.notifs[0] = ne
      }
      else this.notifs[0] = { dh: (!n ? 0 : n.dh) }
      this.setBlocage()
    },

    async editUrgence () {
      if (this.mode === 3) {
        await afficherDiag($t('editavion'))
        return false
      }
      if (this.estFige) {
        await afficherDiag($t('editfige'))
        return false
      }
      return true
    },

    async edit () {
      const d = this.editDiag
      if (!d) return true
      await afficherDiag(d)
      return false
    },

    async editpow (p, noed) {
      const y = ['', 'powadmin', 'powcompta', 'powsponsor']
      if (p === 3) {
        if (this.pow !== 3 && this.pow !== 2) {
          await afficherDiag(p ? $t(y[p]) : '')
          return false
        }
      } else if (p === 1 || p === 2) {
        if (this.pow !== p) {
          await afficherDiag(p ? $t(y[p]) : '')
          return false
        }
      }
      return noed ? true : await this.edit()
    },
    
    opCount () {
      const self = this
      if (this.opTimer) clearTimeout(this.opTimer)
      this.opTimer = setTimeout(() => {
        self.opSpinner++
        self.opCount()
      }, 1000)
    },

    startOp (op) {
      this.opEncours = op
      this.opSpinner = 0
      stores.ui.oD('opDialog')
      this.opCount()
      if (this.opTimer2) clearTimeout(this.opTimer2)
      this.signalOp = true
    },

    finOp () {
      if (this.opTimer) clearTimeout(this.opTimer)
      this.opEncours = null
      this.opSpinner = 0
      stores.ui.fD()
      this.opTimer2 = setTimeout(() => { this.signalOp = false }, 1000)
    }
  }
})
