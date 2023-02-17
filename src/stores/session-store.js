import { defineStore } from 'pinia';
import { encode } from '@msgpack/msgpack'

import stores from './stores.mjs'
import { pbkfd, sha256 } from '../app/webcrypto.mjs'
import { u8ToB64, intToB64, rnd6 } from '../app/util.mjs'
import { DateJour, IDCOMPTABLE } from '../app/api.mjs'

export const useSessionStore = defineStore('session', {
  state: () => ({
    status: 0, // 0:fermée, 1:en chargement, >=10: ouverte
    mode: 0, // 1:synchronisé, 2:incognito, 3:avion
    sessionId: '', // identifiant de session (random(6) -> base64)
    authToken: '',
    phrase: null,
    dateJourConnx: null,
    lsk: '',
    nombase: '',
    volumeTable: '',

    opencours: null, // Objet opération de l'opération en cours (sauf ProcessQueue)

    sessionSync: null, // Objet de classe SessionSync traçant l'état de synchronisation d'une session sur IDB

    syncEncours: false,

    fscredentials: null, // pour connexion à Firestore
    fsSync: null, // Objet de synchro pour Firestore

    compteId: 0,
    tribuId: 0,
    clek: null,
    avatarId: 0, // avatar "courant"
    groupeId: 0, // groupe "courant"

    /* niveau de blocage:
     1-Alerte informative,
     2:restriction de volume, (en baisse)
     3:passif, (pas de maj -sauf chat sponsor / comptable)
     4:bloqué
    */
    blocage: 0,
    infoBlocage: false,
    infoBlocageResolve: null,
    rappelBlocage: 0,
    dernierBlocage: this
  }),

  getters: {
    // trois alias utiles
    compte (state) { return stores.avatar.compte },
    compta (state) { return stores.avatar.compta },
    tribu (state) { return stores.avatar.tribu },

    estParrain (state) { return stores.avatar.compta && stores.avatar.compta.estParrain },
    estComptable (state) { return state.compteId === IDCOMPTABLE },

    // Avatar et groupes courants
    avC (state) { return stores.avatar.getAvatar(state.avatarId) },
    grC (state) { return stores.groupe.getGroupe(state.groupeId)},

    synchro (state) { return state.mode === 1 },
    incognito (state) { return state.mode === 2 },
    avion (state) { return state.mode === 3 },
    accesNet (state) { return state.mode === 1 || state.mode === 2},
    accesIdb (state) { return state.mode === 1 || state.mode === 3},
    ok (state) { return state.status > 1 }
  },

  actions: {
    init (phrase) {
      this.sessionId = intToB64(rnd6())
      if (phrase) {
        this.phrase = phrase
        this.lsk = '$asocial$-' + phrase.dpbh
      }
      const token = {
        sessionId: this.sessionId,
        shax: phrase ? phrase.shax : null,
        hps1: phrase ? phrase.dpbh : null
      }
      const x = new Uint8Array(encode(token))
      this.authToken = u8ToB64(new Uint8Array(x), true)
      this.nombase = this.lsk ? localStorage.getItem(this.lsk) : ''
      this.dateJourConnx = new DateJour()
      this.status = 1
    },
    async setNombase () { // Après avoir obtenu cle K du serveur
      const x = await pbkfd(this.clek)
      this.nombase = '$asocial$-' + u8ToB64(x, true)
      localStorage.setItem(this.lsk, this.nombase)
    },

    setAvatarCourant (id) {
      this.avatarId = id
    },
    
    chgps (phrase) {
      /*
      Suppression de l'ancienne clé lsk donnant le nom de la base du compte
      Recalcul de la nouvelle clé lsk donnant le même nom qu'avant
      Changement du token d'accès
      */
      localStorage.removeItem(this.lsk)
      this.phrase = phrase
      this.lsk = '$asocial$-' + phrase.dpbh
      localStorage.setItem(this.lsk, this.nombase)
      const token = {
        sessionId: this.sessionId,
        shax: phrase.shax,
        hps1: phrase.dpbh
      }
      const x = new Uint8Array(encode(token))
      this.authToken = u8ToB64(new Uint8Array(x), true)
    },

    /* Calcul du blocage depuis compta et tribu
    Retourne la nature du changement:
    - 0: pas de changement
    - 1: le changement n'affecte pas le blocage / déblocage
    - 2: le compte VIENT d'être bloqué
    - 3: le compte VIENT d'être débloqué
    */
    setBlocage () {
      if (this.estComptable || this.avion) {
        this.blocage = 0
        return 0
      }
      const av = this.blocage
      let ap = 0
      if (this.tribu.stn > ap) ap = this.tribu.stn
      if (this.compta.stn > ap) ap = compta.stn
      this.blocage = ap
      if (this.synchro && this.blocage === 4) this.mode = 2
      if (av === ap) return 0
      if (av === 4 && ap < 4) return 3
      if (av < 4 && ap === 4) return 2
      return 1
    },

    /* authToken : base64 de la sérialisation de :
    - `sessionId`
    - `shax` : SHA de X, le PBKFD de la phrase complète.
    - `hps1` : hash du PBKFD de la ligne 1 de la phrase secrète.
    */
    setAuthToken () {
      const token = {
        sessionId: this.sessionId,
        shax: sha256(session.phrase.pcb),
        hps1: session.phrase.dpbh
      }
      session.authToken = u8ToB64(new Uint8Array(encode(token)))
    },

    /* Gère les autorisations d'exécuter l'action
    - nmb : interdit avec un blocage à partir de nmb
    - cnx : connexion requise (modes synchronisé et incognito)
    */
    auts (nmb, cnx) {
      return !((cnx && this.avion) || this.blocage >= nmb)
    },
    
    async aut (nmb, cnx) {    
      if ((cnx && this.avion) || this.blocage >= nmb) { // action interdite : explication(s)
        return new Promise((resolve) => {
          const av = this.avion
          stores.config.$q.dialog({
            dark: true,
            html: true,
            title: $t('UTI' + av ? 'ac2' : 'ac1'),
            message: (av ? $t('UTImsi') : '') +
              (this.blocage ? '<br><span class="titre-lg text-warning text-bold">' + $t('IB' + b) + '</span>' : ''),
            cancel: !this.blocage ? null : { label: $t('UTIesp'), color: 'primary' },
            ok: { color: 'warning', label: $t('jailu') }
          }).onOk(async () => {
            resolve(false)
          }).onCancel(async () => {
            if (b) await stores.ui.ouvrirInfoBlocage(true)
            resolve(false)
          }).onDismiss(() => {
            resolve(false)
          })
        })
      }
      // action autorisée : rappel du blocage en cours éventuel
      if (this.blocage) await stores.ui.ouvrirInfoBlocage()
      return true
    }
  }
})
