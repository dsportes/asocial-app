import { defineStore } from 'pinia'
import { encode } from '@msgpack/msgpack'

import stores from './stores.mjs'
import { useI18n } from 'vue-i18n'

// N'est PAS inutile: force à charger net.mjs (raison peu claire cependant)
import { } from '../app/net.mjs'

import { crypter, decrypter } from '../app/webcrypto.mjs'
import { u8ToB64, $t } from '../app/util.mjs'
import { AMJ, ID, AppExc, A_SRV, AL, UNITEN, UNITEV } from '../app/api.mjs'
import { RegCles, Notification as MaNotification } from '../app/modele.mjs'
import { GetPartition, GetCompta, GetSynthese } from '../app/operations4.mjs'

export const useSessionStore = defineStore('session', {
  state: () => ({
    status: 0, // 0:fermée, 1:en chargement, 2: ouverte, 3: admin
    mode: 0, // 1:synchronisé, 2:incognito, 3:avion

    org: '', // code de l'organisation
    compteId: '', // id du compte
    clek: null, // clek du compte
    authToken: '',
    sessionId: '',
    phrase: null,
    auj: 0,
    dhConnx: 0, // dh de début de la session

    dh: 0, // dh de la dernière opération
    dlv: AMJ.max,
    acqv: 0,
    flags: 0,
    consocumul: { nl: 0, ne: 0, vm: 0, vd: 0}, // nombres de lectures, écritures, volume montant / descendant sur les POST
    qv: { version: 0, qc: 0, qn: 0, qv: 0, nn: 0, nc: 0, ng: 0, cjm: 0, v: 0 },
    dhvu: 0, // Dernière validation de lecture des alertes
    aldh: new Array(AL.libs.length),

    lsk: '', // nom de la variable localStorage contenant le nom de la base
    nombase: '', // nom de la base locale
    volumeTable: '', // volume des tables de la base locale

    partitionId: '', // id de la partition actuelle du compte
    avatarId: '', // avatar "courant"
    groupeId: '', // groupe "courant"
    // membreId: '', // membre "courant" (son im/ids dans son groupe) !!! jamais lu !!!
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
    config: (state) => stores.config,
    hb: (state) => stores.hb,
    filtre: (state) => stores.filtre,
    pSt: (state) => stores.people,
    ui: (state) => stores.ui,

    nomGrC (state) { if (!state.groupeId) return ''; return state.getCV(state.groupeId).nomC },
    
    dlvat: (state) => state.espace && state.espace.dlvat ? state.espace.dlvat : AMJ.max,

    estComptable (state) { return ID.estComptable(state.compteId) },
    estAdmin (state) { return !state.compteId }, // OU page login !!!
    estDelegue (state) { return state.compte && state.compte.del },
    oad (state) { 
      if (!state.compte || state.estComptable) return 0
      if (state.compte.estA) return 3
      if (state.compte.del) return 2
      return 1
    },
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
    ntfC (state) { return state.compte && state.compte.notif && state.compte.notif.nr ? state.compte.notif : null },

    estFige: (state) => AL.has(state.flags, AL.FIGE),
    estClos (state) { const n = state.ntfE; return n && (n.nr === 3) },
    
    RAL: (state) => AL.txRal(state.qv), // Taux de ralentissement
    hasAR: (state) => AL.has(state.flags, AL.ARSN) || AL.has(state.flags, AL.ARNTF),
    hasLS: (state) => AL.has(state.flags, AL.LSNTF),
    hasNRED: (state) => AL.has(state.flags, AL.NRED),
    hasVRED: (state) => AL.has(state.flags, AL.VRED),
    nbjAt: (state) => AMJ.diff(state.dlvat, state.auj),
    nbjDlv: (state) => AMJ.diff(state.dlv, state.auj),

    /* gravité maximale des alertes
      3 : zombi, compte en suppression ou inaccessibilité imminente
      2 : Accès restreint
      1 : Accès avec contraintes, alertes de compte ou partition
      0 : Pas d'alerte
    */
    nivAlerte (state) {
      if (state.nbjAt < state.config.alerteDlv || state.nbjDlv < state.config.alerteDlv) return 3
      if (state.avion) return 0
      if (state.hasAR) return 2
      if (state.RAL || state.hasLS || state.hasNRED || state.hasVRED
        || state.ntfE || state.ntfC || state.ntfP || state.estFige) return 1
      return 0
    },

    nivAlerteCpt (state) {
      if (AL.has(state.flags, AL.ARSN)) return 2
      if (state.RAL || state.hasNRED || state.hasVRED) return 1
      return 0
    },

    nivAlerteSN (state) {
      if (AL.has(state.flags, AL.ARSN)) return 2
      return 0
    },

    alire: (state) => {
      for(let i = 0; i < state.aldh.length; i++) 
        if (state.aldh[i] && (state.aldh[i] > state.dhvu)) return true
      return false
    },

    cEdit (state) {
      if (state.estAdmin) return ''
      if (state.avion) return 'condA'
      if (state.estFige) return 'condF'
      if (!state.estComptable && state.hasLS) return 'condL'
      return ''
    },

    cUrgence (state) {
      if (state.estAdmin) return ''
      if (state.avion) return 'condA'
      if (state.estFige) return 'condF'
      return ''
    },

    cVisu (state) {
      if (state.estAdmin) return ''
      if (!state.estComptable && state.hasAR) return 'condM'
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

    notifPX: (state) => { return (id) => { 
      const n = state.mnotifP.get(id) 
      return n
    } },

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

    statusPush: (state) => state.hb.statusHB && state.config.permission,

    statusPushIC: (state) => state.statusPush ? {ic: 'notifications_active', c: 'green-5'} : { ic: 'notifications_off', c: 'red'},
    
    statusPermIC: (state) => state.config.permission ? {ic: 'notifications_active', c: 'green-5'} : { ic: 'notifications_off', c: 'red'}

  },

  actions: {
    setDhvu () {
      this.dhvu = Date.now()
    },
    
    setAdq (c) {
      if (!c || c.v < this.acqv) return

      function pc (n, q, u) {
        if (n && !q) return 999
        if (!n) return 0
        return Math.round((n / (q * u)) *100)
      }
      this.acqv = c.v
      this.dh = c.dh || 0

      if (c.nl) this.consocumul.nl += c.nl
      if (c.ne) this.consocumul.ne += c.ne
      if (c.vm) this.consocumul.vm += c.vm
      if (c.vd) this.consocumul.vd += c.vd

      this.flags = c.flags || 0
      const afl = AL.fl2array(this.flags)
      for(let i = 0; i < 5; i++) { 
        if (this.aldh[i] && !afl[i]) this.aldh[i] = 0
        if (!this.aldh[i] && afl[i]) this.aldh[i] = this.dh
      }

      this.dlv = c.dlv || 0
      
      for(const f in c.qv) this.qv[f] = c.qv[f]
      this.qv.pcn = pc(this.qv.nn + this.qv.nc + this.qv.ng, this.qv.qn, UNITEN)
      this.qv.pcv = pc(this.qv.v, this.qv.qv, UNITEV)
      this.qv.pcc = pc(this.qv.cjm * 30, this.qv.qc, 1)
    },

    alVolCpt (v) {
      const qv = this.qv
      if (qv.qv === 0) return 2
      const voc = qv.v + v
      const vq = qv.qv * UNITEV
      const px = voc / vq
      return px > 1 ? 2 : (px > 0.9 ? 1 : 0)
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
      this.setAuthToken(phrase)
      stores.hb.connex()
      this.nombase = localStorage.getItem(this.lsk) || ''
      this.auj = AMJ.amjUtc()
      this.dhConnx = Date.now()
      this.compteId = ''
      this.clek = null
      this.status = 1

      RegCles.reset()
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

    setStatus (s) { this.status = s },

    setCompte (compte) { 
      if (compte) {
        this.compte = compte
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
      if (!this.compta || this.compta.id !== compta.id || this.compta.v < compta.v)
        this.compta = compta
    },

    setEspace (espace) {
      const ntf = espace.notifE
      if (this.pow !== 1 && ntf && ntf.nr === 3) {
        this.setExcKO(new AppExc(A_SRV, 999, [ntf.texte, ntf.dh]))
        stores.ui.setPage('clos')
        return
      }
      this.espace = espace
      this.aldh[6] = ntf && ntf.nr === 2 ? ntf.dh : 0
      this.tnotifP = espace.tnotifP
      setTimeout(async () => { await this.setNotifP()}, 1)
    },

    setPartition (partition) { 
      this.partition = partition 
    },

    setSynthese (synthese) { this.synthese = synthese },

    setFsSync (fsSync) { this.fsSync = fsSync },

    setAvatarId (id) { this.avatarId = id },

    setPeopleId (id) { this.peopleId = id },

    setGroupeId (id) { this.groupeId = id },

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
        for (const i in this.tnotifP) {
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
      
      const np = this.notifP
      const nc = this.compte.notif
      let dh4 = np && np.nr === 2 ? np.dh : 0
      if (nc && nc.nr === 2 && nc.dh > dh4) dh4 = nc.dh
      let dh5 = np && np.nr === 3 ? np.dh : 0
      if (nc && nc.nr === 3 && nc.dh > dh5) dh5 = nc.dh
      this.aldh[4] = dh4
      this.aldh[5] = dh5
    },

    setHT (s) { if (s && s.size) s.forEach(t => { if (!this.defHT.has(t)) this.hashtags.add(t) }) },

    async reloadCompta () {
      await new GetCompta().run()
      if (!this.estA) await new GetPartition().run(this.compte.idp)
    },

    /* Calcul des quotas
    Si NON mutation: les max tiennent compte de la valeur actuelle pour le compte
    */
    async getQuotasP (c, mut) { // { qn, qv ...}
      const qm = this.config.quotasMaxC
      const s = this.partition.synth
      let maxn = s.q.qn - s.qt.qn + (mut ? 0 : c.qn)
      if (maxn <= 0) maxn = mut ? 0 : c.qv.qn
      if (maxn > qm[0]) maxn = qm[0]
      let maxv = s.q.qv - s.qt.qv + (mut ? 0 : c.qv)
      if (maxv <= 0) maxv = mut ? 0 : c.qv
      if (maxv > qm[1]) maxv = qm[1]
      let maxc = s.q.qc - s.qt.qc + (mut ? 0 : c.qc)
      if (maxc <= 0) maxc = mut ? 0 : c.qc
      if (maxc > qm[2]) maxn = qm[2]
      return { 
        qn: c.qn, 
        qv: c.qv, 
        qc: c.qc, 
        minn: 0, minv: 0, minc: 0,
        maxn, maxv, maxc,
        n: c.nn + c.nc + c.ng, 
        v: c.v,
        err: ''
      }
    },

    async getQuotasA (c) { // { qn, qv ...}
      const qm = this.config.quotasMaxC
      await new GetSynthese().run()
      const synth = this.synthese
      const qA = synth.qA
      const qtA = synth.qtA
      let maxn = qA.qn - qtA.qn
      if (maxn < 0) maxn = 0
      if (maxn > qm[0]) maxn = qm[0]
      let maxv = qA.qv - qtA.qv
      if (maxv < 0) maxv = 0
      if (maxv > qm[1]) maxv = qm[1]
      // let maxc = qA.qc - qtA.qc + c.qv.qc
      // if (maxc <= 0) maxc = c.qv.qc
      // if (maxc > qm[2]) maxn = qm[2]
      const maxc = qm[2]
      return {
        qn: c.qn > maxn ? maxn : c.qn, 
        qv: c.qv > maxv ? maxv : c.qv, 
        qc: c.qc > maxc ? maxc : c.qc, 
        minn: 0, minv: 0, minc: 0,
        maxn, maxv, maxc,
        n: c.nn + c.nc + c.ng, 
        v: c.v,
        err: ''
      }
    }
        
  }
})
