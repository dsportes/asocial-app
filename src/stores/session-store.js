import { defineStore } from 'pinia';
import { encode, decode } from '@msgpack/msgpack'

import stores from './stores.mjs'
import { useI18n } from 'vue-i18n'
import { pubsub } from '../app/net.mjs'
import { crypter, decrypter } from '../app/webcrypto.mjs'
import { u8ToB64, $t } from '../app/util.mjs'
import { AMJ, ID, AppExc, A_SRV, HBINSECONDS } from '../app/api.mjs'
import { RegCles, Notification as MaNotification } from '../app/modele.mjs'
import { GetCompta, GetPartition } from '../app/synchro.mjs'
import { b64ToU8 } from '../app/util.mjs'

export const useSessionStore = defineStore('session', {
  state: () => ({
    swev1: false,
    swev2: false,
    registration: null,

    status: 0, // 0:fermée, 1:en chargement, 2: ouverte, 3: admin
    mode: 0, // 1:synchronisé, 2:incognito, 3:avion

    ns: '', // namespace du compte. Pour "admin" : espace "courant", donc peut être 0
    org: '', // code de l'organisation
    compteId: '', // id du compte
    clek: null, // clek du compte
    authToken: '',
    sessionId: '',
    phrase: null,
    auj: 0,
    dhConnx: 0, // dh de début de la session
    dh: 0, // dh de la dernière opération
    consocumul: { nl: 0, ne: 0, vm: 0, vd: 0}, // nombres de lectures, écritures, volume montant / descendant sur les POST

    nhb: 0, // numéro de heartbeat dans la connexion
    dhhb: 0, // date-heure du dernier heartbeat de la connexion
    syncauto: false, // statut de synchro de la connexion
    pubsubTO: null,

    lsk: '', // nom de la variable localStorage contenant le nom de la base
    nombase: '', // nom de la base locale
    volumeTable: '', // volume des tables de la base locale

    partitionId: '', // id de la partition actuelle du compte
    avatarId: '', // avatar "courant"
    groupeId: '', // groupe "courant"
    membreId: '', // membre "courant" (son im/ids dans son groupe)
    peopleId: '', // people "courant"
    notifC: null, // notifC du people courant
    notifP: null, // notifP de la partition du compte
    mnotifP: new Map(), // map des notifP compilées
    tnotifP: null, // dernière table des notifp PAS compilées
    
    syntheses: new Map(), // Pour admin SEULEMENT

    partition: null,
    compte: null,
    compta: null,
    compti: null,
    espace: null,
    synthese: null, // Dernière synthèse demandée pour admin - de leur espace pour les comptes

    opEncours: null,
    opSpinner: 0,
    opTimer: null,
    opTimer2: null,
    signalOp: false,

    alire: false, // Il y a des notifications à lire
    dhvu: 0, // Dernière validation de lecture des alertes

    /* Exception insurmontable:exc.code ...
    - 9998 : compte clos
    - 9999 : application fermée par l'administrateur
    - autre : exception rencontrée en synchronisation
    */
    excKO: null,

    hashtags: new Set(),
    locale: null
  }),

  getters: {
    config (state) { return stores.config },
    filtre (state) { return stores.filtre },
    pSt: (state) => stores.people,
    ui: (state) => stores.ui,

    nomGrC (state) { if (!state.groupeId) return ''; return state.getCV(state.groupeId).nomC },
    
    dlv (state) { return state.ok && state.compte ? state.compte.dlv : 0 },
    nbj (state) { return AMJ.diff(AMJ.dlv(state.dlv), state.auj) },

    estComptable (state) { return ID.estComptable(state.compteId) },
    estAdmin (state) { return !state.compteId },
    estDelegue (state) { return state.compte && state.compte.del },
    estA (state) { return state.compte && state.compte.estA },
    estAvc: (state) => { return (id) => { return state.compte && state.compte.mav.has(id) } },

    editable (state) { return state.mode < 3 && state.niv < 4 },

    synchro (state) { return state.mode === 1 },
    incognito (state) { return state.mode === 2 },
    avion (state) { return state.mode === 3 },
    accesNet (state) { return state.mode === 1 || state.mode === 2},
    accesNetNf (state) { return state.accesNet && !state.estFige },
    accesIdb (state) { return state.mode === 1 || state.mode === 3},
    ok (state) { return state.status === 2 },

    ntfE (state) { return state.espace && state.espace.notifE && state.espace.notifE.nr ? state.espace.notifE : null },
    ntfP (state) { return state.notifP && state.notifP.nr ? state.notifP : null },
    ntfC (state) { return state.compte && state.compte.notif ? state.compte.notif : null },

    mini (state) { return (state.ntfP && state.ntfP.nr === 3) || (state.ntfC && state.ntfC.nr === 3) || state.ral === 3 },
    lect (state) { return (state.ntfP && state.ntfP.nr >= 2) || (state.ntfC && state.ntfC.nr >= 2) },
    estFige (state) { const n = state.ntfE; return n && (n.nr === 2) },
    estClos (state) { const n = state.ntfE; return n && (n.nr === 3) },
    ral (state) { if (!state.compte) return 0
      if (state.compte.estA) {
        const n = state.compte.qv.nbj
        return n <= 0 ? 3 : (n < 10 ? 2 : (n < 20 ? 1 : 0)) 
      }
      const n = state.compte.qv.pcc; return n >= 100 ? 2 : (n >= 90 ? 1 : 0)
    },
    quotn (state) { if (!state.compte) return 0
      const n = state.compte.pcn; return n >= 100 ? 2 : (n >= 90 ? 1 : 0)
    },
    quotv (state) { if (!state.compte) return 0
      const n = state.compte.pcv; return n >= 100 ? 2 : (n >= 90 ? 1 : 0)
    },
    quotmax (state) { return state.quotn > state.quotv ? state.quotn : state.quotv },

    /* NotifIcon.niv :  
    /* niveau d'information / restriction: 
    - 0 : aucune notification
    - 1 : au moins une notification informative
    - 2 : accroissement de volume interdit
    - 3 : accés en lecture seule (sauf urgence)
    - 4 : accés en lecture seule (strict, figé)
    - 5 : accès d'urgence seulement
    - 6 : accés en lecture seule (strict, figé) SANS accès d'urgence
    - 7 : ralentissement 1
    - 8 : ralentissement 2 
    */

    ntfIco (state) {
      const f = state.ntfE && state.ntfE.nr === 2
      if (f && state.mini) return 6
      if (state.mini) return 5
      if (f) return 4
      if (state.lect) return 3
      if (state.quotn === 2 || state.quotv === 2) return 2
      if (state.ral === 2) return 8
      if (state.ral === 1) return 7
      if (state.ral || state.quotn || state.quotv || state.ntfE || state.ntfP || state.ntfC) return 1
      return 0
    },

    cEdit (state) {
      if (state.estAdmin) return ''
      if (state.avion) return $t('condA')
      if (state.estFige) return $t('condF')
      if (state.lect) return $t('condL')
      return ''
    },

    cUrgence (state) {
      if (state.estAdmin) return ''
      if (state.avion) return $t('condA')
      if (state.estFige) return $t('condF')
      return ''
    },

    cVisu (state) {
      if (state.estAdmin) return ''
      if (state.mini) return $t('condM')
      return ''
    },

    cSync () {
      if (state.avion) return $t('condA')
      return ''
    },

    pow (state) {
      if (state.estAdmin) return 1
      if (state.estComptable) return 2
      if (state.estDelegue) return 3
      return 4
    },

    getCV: (state) => { return (id) => { return state.pSt.getCV(id) } },

    notifPX: (state) => { return (id) => { return state.mnotifP.get(id) } },

    // Elément mcpt du compte O id dans sa partition : {notif, del, q}
    // Si non trouvé retourne { fake: true }
    eltPart: (state) => { return (id) =>  
      state.partition ? (state.partition.mcpt[id] || { fake: true }) : { fake: true }
    },

    codePart: (state) => { return (id) => { 
      const s = id.substring(id.length -4)
      return state.estComptable ? '#' + s + ' ' + state.compte.mcode.get(id) : '#' + s
    }},

    defHT (state) {
      if (state.locale) locale = useI18n().locale
      const s = new Set()
      state.locale
      const def = $t('defhashtags')
      const x = def ? def.split(' ') : []
      x.forEach(t => { s.add(t)})
      return s
    },

    // PagePartition ***************************************************    
    ptLcFT: (state) => {
      const lcF = state.ptLcF

      const f = state.filtre.tri.partition
      if (!f) { state.ui.fmsg(lcF.length); return lcF }

      /*
      TRIpartition1: 'Quota nb notes, chats ↑',
      TRIpartition2: 'Quota nb notes, chats ↓',
      TRIpartition3: 'Quota fichiers des notes ↑',
      TRIpartition4: 'Quota fichiers des notes ↓',
      TRIpartition5: '% util. quota nb notes... ↑',
      TRIpartition6: '% util. quota nb notes... ↓',
      TRIpartition7: '% util. quota fichiers ↑',
      TRIpartition8: '% util. quota fichiers ↓'
      */
      function vf (x) {
        return f === 1 || f === 2 ? x.q.qn 
          : (f === 3 || f === 4 ? x.q.qv 
          : (f === 5 || f === 6 ? x.pcn : x.pcv))
      }
      const ctm = (f % 2) === 1 ? -1 : 1

      function comp (x, y) {
        if (x.del && !y.del) return -1
        if (!x.del && y.del) return 1
        const a = vf(x)
        const b = vf(y)
        return a > b ? ctm : (a < b ? -ctm : 0) 
      }

      lcf.sort(comp)
      state.ui.fmsg(lcf.length)
      return lcf
    },

    ptLcF: (state) => {
      const f = state.filtre.filtre.partition
      if (!f) return state.ptLc
      const r = []
      for (const c of state.ptLc) {
        if (f.avecsp && !c.del) continue
        if (f.nomc && !c.cv.nom.startsWith(f.nomc)) continue
        /* 
        - `mcpt` : map (object) des comptes attachés à la partition. 
          - _clé_: id du compte.
          - _valeur_: `{ id, nr, del, q }`
            - `nr`: niveau de restriction de la notification de niveau _compte_ (0 s'il n'y en a pas, 1 (sans restriction), 2 ou 3).
            - `notif`: notification du compte cryptée par la clé P de la partition (redonde celle dans compte).            - `del`: `true` si c'est un délégué.
            - `q` : `qc qn qv c2m nn nc ng v` extraits du document `comptas` du compte.
              - `c2m` est le compteur `conso2M` de compteurs, montant moyen _mensualisé_ de consommation de calcul observé sur M/M-1 (observé à `dhic`). 

            Ajout à q :
            - pcc : pourcentage d'utilisation de la consommation journalière c2m / qc
            - pcn : pourcentage d'utilisation effective de qn : nn + nc ng / qn
            - pcv : pourcentage d'utilisation effective de qc : v / qv
        */
        if (f.notif && c.nr === 0) continue
        if (f.notif && c.nr < f.notif) continue
        r.push(c)
      }
      return r
    },

    ptLc: (state) => {
      const t = []
      if (state.partition) for (const id in state.partition.mcpt) {
        const e = state.partition.mcpt[id]
        const cv = state.getCV(e.id)
        t.push( { ...e, cv} )
      }
      return t
    }
  },

  actions: {
    async setRegistration(registration) {
      this.registration = registration
      await this.setSubscription()
      console.log('SW ready. subJSON: ' + this.config.subJSON.substring(0, 50))
    },

    async setSubscription () {
      if (!this.registration) return
      try {
        let subscription = await this.registration.pushManager.getSubscription() // déjà faite
        if (!subscription) subscription = await this.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: b64ToU8(stores.config.vapid_public_key)
          })
        this.config.subJSON = JSON.stringify(subscription)
      } catch (e) {
        this.config.subJSON = '???' + e.message
      }
    },

    // ServiceWorker : événements de détection de changement de version
    setSwev (x) {
      // console.log(x + 'event reçu')
      if (x === 'updatefound') this.swev1 = true
      else if (x === 'updated') this.swev2 = true
    },

    setMode (mode) { this.mode = mode },

    setOrg (org) { this.org = org || '' },

    setAuthToken (phrase) {
      this.sessionId = this.config.pageSessionId + '.' + this.config.nc
      console.log('sessionId: ', this.sessionId)

      const token = { org: this.org, sessionId: this.sessionId}
      if (this.org === 'admin') {
        token.shax = phrase ? phrase.shax : null
      } else {
        token.hXR = phrase ? phrase.hps1 : null
        token.hXC = phrase ? phrase.hpsc : null
      }
      this.authToken = u8ToB64(new Uint8Array(encode(token)), true) 
      this.lsk = '$asocial$-' + phrase.hps1
    },

    /* Initialise une session depuis une phrase secrète
    session.mode et org ont été enregistrés par PageLogin (connexion ou création compte)
    */
    async initSession(phrase) {
      this.phrase = phrase
      this.config.nc++
      this.nhb = 0 // numéro de heartbeat dans la connexion
      this.dhhb = 0 // date-heure du dernier heartbeat de la connexion
      this.syncauto = false // statut de synchro de la connexion
  
      this.setAuthToken(phrase)

      this.nombase = localStorage.getItem(this.lsk) || ''
      this.auj = AMJ.amjUtc()
      this.dhConnx = Date.now()
      this.compteId = ''
      this.clek = null
      this.status = 1

      RegCles.reset()
    },

    // Retour de sync : numéro de heartbeat connu de PUBSUB pour cette session
    setNhb (nhb) {
      this.syncauto = nhb === this.nhb
    },

    async startHB () {
      if (this.avion) return
      if (this.pubsubTO) clearTimeout(this.pubsubTO)
      if (this.config.permission) {
        this.nhb++
        const ret = await pubsub('heartbeat', { org: this.org, sid: this.sessionId, nhb: this.nhb })
        if (ret === this.nhb - 1) {
          this.syncauto = true
          this.pubsubTO = setTimeout(async () => {
            await this.startHB()
          }, HBINSECONDS * 1000)
        } else {
          this.syncauto = false
          this.nhb = 0
        }
      }
    },

    async stopHB () {
      if (this.avion || !this.ok) return
      if (this.pubsubTO) clearTimeout(this.pubsubTO)
      await pubsub('heartbeat', { org: this.org, sid: this.sessionId, nhb: 0 })
      this.syncauto = false
      this.nhb = 0
    },

    chgps (phrase) {
      /*
      Suppression de l'ancienne clé lsk donnant le nom de la base du compte
      Recalcul de la nouvelle clé lsk donnant le même nom qu'avant
      Changement du token d'accès
      */
      localStorage.removeItem(this.lsk)
      this.phrase = phrase
      this.setAuthToken(phrase)
      localStorage.setItem(this.lsk, this.nombase)
    },

    async setIdClek (id, cleKXC, clek) {
      this.compteId = id
      this.avatarId = id
      this.clek = clek || await decrypter(this.phrase.pcb, cleKXC)
      const x = await crypter(this.clek, '' + id, 1)
      this.nombase = '$asocial$-' + u8ToB64(x, true)
      if (this.accesIdb) localStorage.setItem(this.lsk, this.nombase)
      return this.clek
    },

    setDh (dh) { if (dh && dh > this.dh) this.dh = dh },

    /* Le compte a disparu OU l'administrateur a fermé l'application ***********/
    setExcKO (exc) { this.excKO = exc },

    setConso (c) {
      if (c) {
        if (c.nl) this.consocumul.nl += c.nl
        if (c.ne) this.consocumul.ne += c.ne
        if (c.vm) this.consocumul.vm += c.vm
        if (c.vd) this.consocumul.vd += c.vd
      }
    },

    setStatus (s) { this.status = s },

    setCompte (compte) { 
      if (compte) {
        if (compte.dhvu && compte.dhvu !== this.dhvu) { this.dhvu = compte.dhvu; this.alire = false }
        const ral = this.ral, quotn = this.quotn, quotv = this.quotv
        this.compte = compte
        if (ral !== this.ral || quotn !== this.quotn || quotv !== this.quotv) this.alire = true
        if (compte.notif && compte.notif.dh > this.dhvu) this.alire = true
      } else {
        this.compte = null
        this.compteId = ''
      }
      setTimeout(async () => { await this.setNotifP()}, 1)
    },

    setCompti (compti) {
      if (!this.compti || this.compti.v < compti.v) this.compti = compti
      for (const [,e] of compti.mc) this.setHT(e.ht)
    }, 

    setCompta (compta) {
      if (!this.compta || this.compta.v < compta.v) this.compta = compta
    },

    setEspace (espace, estAdmin) {
      const ntf = espace.notifE
      if (this.pow !== 1 && ntf && ntf.nr === 3) {
        this.setExcKO(new AppExc(A_SRV, 999, [ntf.texte, ntf.dh]))
        stores.ui.setPage('clos')
        return
      }
      this.espace = espace
      this.tnotifP = espace.tnotifP
      setTimeout(async () => { await this.setNotifP()}, 1)
      if (espace.notifE && espace.notifE.dh > this.dhvu) this.alire = true
    },

    setPartition (partition) { this.partition = partition },

    setSynthese (synthese) { this.synthese = synthese },

    setFsSync (fsSync) { this.fsSync = fsSync },

    setAvatarId (id) { this.avatarId = id ; console.log(id)},

    setPeopleId (id) { this.peopleId = id },

    setGroupeId (id) { this.groupeId = id },

    setMembreId (id) { this.membreId = id },

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
      stores.ui.oD('opDialog', 'a')
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
    },

    /* La notifP de la partition d'un compte peut changer:
    - soit parce qu'elle est mise à jour par Espace,
    - soit parce que le compte a changé de partition par Compte.
    En conséquence il faut recalculer la notifP à l'occasion de
    l'enregistrement en store de ceux événements.
    Le Comptable est le seul qui peut obtenir toutes les clés P
    qui cryptent les notifs de toutes les partitions. Pour les autres comptes
    il n'y a qu'une seule notif de partition décryptable.
    */
    async setNotifP () {
      if (this.estAdmin) return
      const mnotifP = new Map()
      if (this.estComptable) {
        for (let i = 1; i < this.tnotifP.length; i++) {
          const ntf = this.tnotifP[i]
          if (ntf) {
            const cl = RegCles.get(i)
            if (cl) mnotifP.set(i, await MaNotification.decrypt(ntf, cl))
          }
        }
      } else if (!this.estA) {
        const ntf = this.tnotifP[this.compte.idp]
        if (ntf) {
          const cl = RegCles.get(this.compte.idp)
          if (cl) mnotifP.set(this.compte.idp, await MaNotification.decrypt(ntf, cl))
        }
      }
      this.mnotifP = mnotifP
      this.notifP = this.compte.idp ? mnotifP.get(this.compte.idp) : null
      if (this.notifP && this.notifP.dh > this.dhvu) this.alire = true
    },

    setHT (s) { if (s && s.size) s.forEach(t => { if (!this.defHT.has(t)) this.hashtags.add(t) }) },

    async reloadCompta () {
      await new GetCompta().run()
      if (!this.estA) await new GetPartition().run(this.compte.idp)
    }
  }
})
