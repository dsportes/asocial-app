import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { Operation } from './synchro.mjs'
import { random, gzipB } from './util.mjs'
import { Cles, d14, ID } from './api.mjs'
import { idb } from '../app/db.mjs'
import { post } from './net.mjs'
import { RegCles, compile, CV, Ticket } from './modele.mjs'
import { getPub } from './synchro.mjs'
import { decrypter, crypter, genKeyPair, crypterRSA } from './webcrypto.mjs'

/* OP_SetEspaceOptionA: 'Changement de l\'option A de l\'espace'
- `token` : jeton d'authentification du compte de **l'administrateur**
- `ns` : id de l'espace notifié.
- `optionA` : 0 1 2.
- dlvat: aaaammjj,
- nbmi:
Retour: rien
Assertion sur l'existence du row `Espaces`.
L'opération échappe au contrôle espace figé / clos.
Elle n'écrit QUE dans espaces.
*/
export class SetEspaceOptionA extends Operation {
  constructor () { super('SetEspaceOptionA') }

  async run (optionA, nbmi, dlvat) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ns: session.ns, optionA, nbmi, dlvat }
      await post(this, 'SetEspaceOptionA', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_CreerEspace: 'Création d\'un nouvel espace et de son comptable'
- token : jeton d'authentification du compte de **l'administrateur**
- ns : numéro de l'espace
- org : code de l'organisation
- hXR : hash du PBKFD de la phrase secrète réduite
- hXC : hash du PBKFD de la phrase secrète complète
- pub: clé RSA publique du Comptable
- privK: clé RSA privée du Comptable cryptée par la clé K
- clePK: clé P de la partition 1 cryptée par la clé K du Comptable
- cleEK: clé E cryptée par la clé K
- cleE: clé en clair
- cleAP: clé A du Comptable cryptée par la clé de la partition
- cleAK: clé A du Comptable cryptée par la clé K du Comptable
- cleKXC: clé K du Comptable cryptée par XC du Comptable (PBKFD de la phrase secrète complète).
- clePA: cle P de la partition cryptée par la clé A du Comptable
- ck: `{ cleP, code }` crypté par la clé K du comptable

*/
export class CreerEspace extends Operation {
  constructor() { super('CreerEspace') }

  async run(org, phrase, ns) {
    try {
      const session = stores.session
      const config = stores.config

      const cleP = Cles.partition(1) // clé de la partition 1
      const cleK = random(32) // clé K du Comptable
      const cleE = random(32) // clé de l'espace pour lire les rapports générés sur le serveur
      const cleA = Cles.comptable() // clé A de l'avatar Comptable
      const kp = await genKeyPair()

      const tp = {cleP: cleP, code: config.nomPartitionPrimitive}

      const args = {
        token: session.authToken,
        ns: ns,
        org: org,
        hXR: phrase.hps1,
        hXC: phrase.hpsc,
        pub: kp.publicKey,
        privK: await crypter(cleK, kp.privateKey),
        cleEK: await crypter(cleK, cleE),
        cleE,
        clePK: await crypter(cleK, cleP),
        cleAP: await crypter(cleP, cleA, 1),
        cleAK: await crypter(cleK, cleA),
        cleKXC: await crypter(phrase.pcb, cleK),
        clePA: await crypter(Cles.comptable(), cleP),
        // `{ cleP, code }` crypté par la clé K du comptable
        ck: await crypter(cleK, new Uint8Array(encode(tp)))
      }
      await post(this, 'CreerEspace', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/** Ajout d\'un sponsoring ****************************************************
- `token` : éléments d'authentification du comptable / compte sponsor de sa tribu.
- id : id du sponsor
- hYR : hash du PNKFD de la phrase de sponsoring réduite (SANS ns)
- `psK` : texte de la phrase de sponsoring cryptée par la clé K du sponsor.
- `YCK` : PBKFD de la phrase de sponsoring cryptée par la clé K du sponsor.
- `hYC` : hash du PBKFD de la phrase de sponsoring,
- `hYR` : hash du PBKFD de la phrase réduite de sponsoring,
- `cleAYC` : clé A du sponsor crypté par le PBKFD de la phrase complète de sponsoring.
- `partitionId`: id de la partition si compte 0    
- `cleAP` : clé A du COMPTE sponsor crypté par la clé P de la partition.
  Permet au serveur de vérifier que le compte est vraiement de cette partition
  et est délégué.
- `clePYC` : clé P de sa partition (si c'est un compte "O") cryptée par le PBKFD 
  de la phrase complète de sponsoring (donne l'id de la partition).
- `nomYC` : nom du sponsorisé, crypté par le PBKFD de la phrase complète de sponsoring.
- `cvA` : `{ id, v, ph, tx }` du sponsor, (ph et tx) cryptés par sa cle A.
- `ardYC` : ardoise de bienvenue du sponsor / réponse du sponsorisé cryptée par le PBKFD de la phrase de sponsoring.

- `quotas` : `{qc, qn, qv}` pour un compte O, quotas attribués par le sponsor.
  - pour un compte "A" `[0, 1, 1]`. Un tel compte n'a pas de `qc` et peut changer à loisir
   `[qn, qv]` qui sont des protections pour lui-même (et fixe le coût de l'abonnement).
- don: montant du don pour un compte autonome sponsorisé par un compte autonome
- dconf: true, si le sponsor demande la confidentialité (pas de chat à l'avcceptation)
- del: true si le compte est délégué de la partition
Retour:
*/
export class AjoutSponsoring extends Operation {
  constructor () { super('AjoutSponsoring') }

  async run (arg) {
    /*
    - pc: phrase de contact,
    - nom: nom du compte,
    - `quotas` : `[qc, q1, q2]` quotas attribués par le sponsor.
      - pour un compte "A" `[0, 1, 1]`. Un tel compte n'a pas de `qc` et peut changer à loisir `[q1, q2]` qui sont des protections pour lui-même (et fixe le coût de l'abonnement).
    - mot: mot de bienvenue,
    - don: montant du don pour un compte autonome sponsorisé par un compte autonome
    - dconf: true, si le sponsor demande la confidentialité (pas de chat à l'avcceptation)
    - partitionId: id de la partition pour un compte O, sinon c'est un compte A
    - del: true si le compte est délégué de la partition
    */
    try {
      const session = stores.session
      const cleA = RegCles.get(session.avatarId)
      const cleAC = RegCles.get(session.compteId)
      const cv = session.getCV(session.avatarId)
      const args = { 
        token: session.authToken, 
        id: session.avatarId,
        hYR: arg.pc.hps1,
        hYC: arg.pc.hpsc,
        psK: await crypter(session.clek, arg.pc.phrase),
        YCK: await crypter(session.clek, arg.pc.pcb),
        cleAYC : await crypter(arg.pc.pcb, cleA),
        nomYC: await crypter(arg.pc.pcb, arg.nom),
        cvA: await cv.crypter(cleA),
        ardYC: await crypter(arg.pc.pcb, arg.mot),
        dconf: arg.dconf
      }
      if (arg.partitionId) { // compte O
        const cleP = RegCles.get(arg.partitionId)
        args.quotas = arg.quotas
        args.partitionId = arg.partitionId
        args.del = arg.del
        args.clePYC = await crypter(arg.pc.pcb, cleP)
        args.cleAP = await crypter(cleP, cleAC, 1)
      } else {
        args.don = arg.don
      }
      await post(this, 'AjoutSponsoring', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*   OP_MajChat: 'Mise à jour d\'un "chat".'
POST:
- `token` : éléments d'authentification du compte.
- `idI idsI` : id du chat, côté _interne_.
- `idE idsE` : id du chat, côté _externe_.
- `ccKI` : clé cc du chat cryptée par la clé K du compte de I. _Seulement_ si en session la clé cc était cryptée par la clé publique de I.
- `txt1` : texte à ajouter crypté par la clé cc du chat.
- `lgtxt1` : longueur du texte
- `dh` : date-heure du chat dont le texte est à annuler.

Si don:
- `dbDon`: nouveau credits de compta du compte incorporant le don
- `crDon`: don crypté par RSA du bénéficiaire idE à ajouter dans son compta.dons
- `v`: version de compta du compte

Retour:
- `KO`: true si régression de version de compta du compte
- `st` :
  0 : E a disparu, chat zombi.
  1 : chat mis à jour.
- `rowChat` : row du chat I.

Assertions sur l'existence du row `Avatars` de l'avatar I, sa `Versions`, et le cas échéant la `Versions` de l'avatar E (quand il existe).
*/
export class MajChat extends Operation {
  constructor () { super('MajChat') }

  async run (chat, txt, dh, don) {
    try {
      const session = stores.session
      const args = { 
        token: session.authToken, 
        id: chat.id, 
        ids: chat.ids,
        t: txt ? await crypter(chat.clec, gzipB(txt)) : null,
        dh: dh || 0,
        don: don
      }
      const ret = await post(this, 'MajChat', args)
      return this.finOK(ret.disp)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Mise en état "passif" d\'un chat
Nombre de chat - 1, items vidé
- token : éléments d'authentification du compte.
- id ids : id du chat
Retour
- disp: true si E a disparu
*/
export class PassifChat extends Operation {
  constructor () { super('PassifChat') }

  async run (chat) {
    try {
      const session = stores.session
      const args = { 
        token: session.authToken, 
        id: chat.id, 
        ids: chat.ids
      }
      const ret = await post(this, 'PassifChat', args)
      const suppr = ret.suppr
      return this.finOK(suppr)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetEspaceT: 'Attribution d\'un profil à un espace' ******************
args.token donne les éléments d'authentification de l'administrateur.
args.ns
args.nprof
Retour:
*/
export class SetEspaceNprof extends Operation {
  constructor () { super('SetEspaceNprof') }

  async run (ns, nprof) {
    try {
      const session = stores.session
      const args = { token: session.authToken, ns, nprof}
      await post(this, 'SetEspaceNprof', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetNotifE: 'Inscription d\'une notification générale' ***********************
args.token donne les éléments d'authentification du compte.
args.ns
args.ntf
Retour:
*/
export class SetNotifE extends Operation {
  constructor () { super('SetNotifE') }

  async run (ntf, ns) {
    try {
      const session = stores.session
      const args = { token: session.authToken, ns, ntf}
      await post(this, 'SetNotifE', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetNotifP: 'Inscription / mise à jour de la notification d\'une partition'
- `token` : éléments d'authentification du compte.
- `idp` : id de la partition
- `notif` : notification cryptée par la clé de la partition.
*/
export class SetNotifP extends Operation {
  constructor () { super('SetNotifP') }

  async run (notif, idp) {
    try {
      const session = stores.session
      const args = { token: session.authToken, idp, notif }
      await post(this, 'SetNotifP', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetNotifC: 'Inscription / mise à jour de la notification d\'un compte'
- `token` : éléments d'authentification du compte.
- `idc` : id du compte
- `notif` : notification du compte cryptée par la clé de partition
*/
export class SetNotifC extends Operation {
  constructor () { super('SetNotifC') }

  async run (notif, idc) { // id de la tribu, id du compte cible, notif
    try {
      const session = stores.session
      const args = { token: session.authToken, idc, notif }
      await post(this, 'SetNotifC', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetDhvuCompte: 'Mise à jour de la date-heure de "vu" des notifications d\'un compte'
args.token: éléments d'authentification du compte.
args.dhvu : dhvu cryptée par la clé K
Retour:
*/
export class SetDhvuCompte extends Operation {
  constructor () { super('SetDhvuCompte') }

  async run () {
    try {
      const session = stores.session
      const dhvu = await crypter(session.clek, '' + (Date.now()))
      const args = { token: session.authToken, dhvu }
      await post(this, 'SetDhvuCompte', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetAvatarPC: 'Récupération d\'un avatar par sa phrase de contact'
- token: éléments d'authentification du compte.
- hZR: hash de la phrase de contact réduite
- hZC: hash de la phrase de contact complète
Retour:
- cleAZC : clé A cryptée par ZC (PBKFD de la phrase de contact complète)
- cvA: carte de visite cryptée par sa clé A
- collision: true si la phrase courte pointe sur un  autre avatar
*/
export class GetAvatarPC extends Operation {
  constructor () { super('GetAvatarPC') }

  async run (p) { // p: objet Phrase
    try {
      const session = stores.session
      const hZR = (session.ns * d14) + p.hps1
      const args = { token: session.authToken, hZR, hZC: p.hpsc }
      const ret = await post(this, 'GetAvatarPC', args)
      let id = 0
      if (ret.collision) id = -1
      else if (ret.cleAZC) {
        try {
          const cleA = await decrypter(p.pcb, ret.cleAZC)
          RegCles.set(cleA)
          id = Cles.id(cleA, session.ns)
          const cv = await CV.set(ret.cvA)
          cv.store()
        } catch (e) {
          console.log(e)
        }
      }
      return this.finOK(id)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_ChangementPC: 'Changement de la phrase de contact d\'un avatar' *************************
token: éléments d'authentification du compte.
- `id`: de l'avatar
- `hZR`: hash de la phrase de contact réduite (SUPPRESSION si null)
- `cleAZC` : clé A cryptée par ZC (PBKFD de la phrase de contact complète).
- `pcK` : phrase de contact complète cryptée par la clé K du compte.
- `hZC` : hash du PBKFD de la phrase de contact complète.
*/
export class ChangementPC extends Operation {
  constructor () { super('ChangementPC') }

  async run (id, p) {
    try {
      const session = stores.session
      const pcK = p ? await crypter(session.clek, p.phrase) : null
      const cleAZC = p ? await crypter(p.pcb, RegCles.get(id)) : null
      const hZR = p ? p.hps1 : 0
      const hZC = p ? p.hpsc : 0
      const args = { token: session.authToken, id, pcK, hZR, hZC, cleAZC }
      await post(this, 'ChangementPC', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_NouveauChat: 'Création d\'un nouveau chat' *********************************
- token: éléments d'authentification du compte.
- idI
- idE
- mode 
  - 0: par phrase de contact - hZC en est le hash
  - 1: idE est Comptable
  - 2: idE est délégué de la partition de idI
  - idp: idE et idI sont co-membres du groupe idg (idI a accès aux membres)
- hZC : hash du PBKFD de la phrase de contact compléte pour le mode 0
- ch: { cck, ccP, cleE1C, cleE2C, t1c }
  - ccK: clé C du chat cryptée par la clé K du compte de idI
  - ccP: clé C du chat cryptée par la clé publique de idE
  - cleE1C: clé A de l'avatar E (idI) cryptée par la clé du chat.
  - cleE2C: clé A de l'avatar E (idE) cryptée par la clé du chat.
  - txt: item crypté par la clé C

Retour:
- `rowChat` : row du chat I.
*/
export class NouveauChat extends Operation {
  constructor () { super('NouveauChat') }

  async run (idI, idE, mode, hZC, txt) {
    try {
      const session = stores.session
      const aSt =  stores.avatar
      const pSt = stores.people

      const cc = random(32)
      const pub = await getPub(idE)
      const cleAI = RegCles.get(idI)
      const cleAE = RegCles.get(idE)
      const y = gzipB(txt)
      const txtc = await crypter(cc, y)
      const args = { token: session.authToken, idI, idE, mode, hZC }
      args.ch = {
        ccK: await crypter(session.clek, cc), // clé C du chat cryptée par la clé K du compte
        ccP: await crypterRSA(pub, cc), // clé C du chat cryptée par la clé publique de l'avatar sponsor
        cleE1C:  await crypter(cc, cleAI), // clé A de l'avatar E (sponsor) cryptée par la clé du chat.
        cleE2C:  await crypter(cc, cleAE), // clé A de l'avatar E (sponsorisé) cryptée par la clé du chat.
        txt: txtc, // mot du sponsor crypté par la clé C
      }
      const ret = await post(this, 'NouveauChat', args)
      let ch
      if (ret.rowChat) {
        ch = await compile(ret.rowChat)
        aSt.setChat(ch)
        pSt.setPCh(ch.idE, ch.id)
      }
      this.finOK(ch)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_StatutAvatar: 'Vérification que le bénéficiaire envisagé d\'un don est bien un compte autonome'
indique si l'avatar donné en argument est 
un avatar principal ou non, d'un compte autonome ou non
- token : jeton d'authentification du compte de **l'administrateur**
- id : id de l'avatar
Retour: 
- `st`: [P, A]
  - P : true si avatar principal
  - A : true si compte A
*/
export class StatutAvatar extends Operation {
  constructor () { super('StatutAvatar') }

  async run (id) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, id }
      const ret = await post(this, 'StatutAavatar', args)
      return this.finOK(ret.st)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_RafraichirCvsAv: 'Rafraichissement des CVs des chats de l\'avatar'
- token : jeton d'authentification du compte de **l'administrateur**
- id : id de l'avatar
Retour: [nc, nv]
- `nc`: nombre de CV mises à jour
- `nv` : nombre de chats existants
Exception générique:
- 8001: avatar disparu
*/
export class RafraichirCvsAv extends Operation {
  constructor () { super('RafraichirCvsAv') }

  async run (id) { // id: 0-tous people, id d'avatar:chats de id, id de groupe: membres du groupe
    try {
      const session = stores.session
      const args = { token: session.authToken, id }
      const ret = await post(this, 'RafraichirCvsAv', args)
      return this.finOK(ret.ncnv)
    } catch (e) {
      if (isAppExc(e) && e.code === 8001) return -1
      await this.finKO(e)
    }
  }
}

/* OP_RafraichirCvChat: 'Rafraichissement de la carte de visite d\'un chat'
- token : jeton d'authentification du compte de **l'administrateur**
- id, ids : id du chat
Retour:
Exception générique:
- 8001: avatar disparu
- 8002: chat disparu
*/
export class RafraichirCvChat extends Operation {
  constructor () { super('RafraichirCvChat') }

  async run (id, ids) { // id: 0-tous people, id d'avatar:chats de id, id de groupe: membres du groupe
    try {
      const session = stores.session
      const args = { token: session.authToken, id, ids }
      const ret = await post(this, 'RafraichirCvChat', args)
      return this.finOK(ret.ncnv)
    } catch (e) {
      if (isAppExc(e)) {
        if (e.code === 8001) return -1
        if (e.code === 8002) return -2
      }
      await this.finKO(e)
    }
  }
}


/* OP_SetQuotas: 'Fixation des quotas d'un compte dans sa partition'
- token: éléments d'authentification du compte.
- idp : id de la partition
- idc: id du compte
- q: {qc, qn, qv}
Retour:
*/
export class SetQuotas extends Operation {
  constructor () { super('SetQuotas') }

  async run (idc, q) {
    try {
      const session = stores.session
      const idp = session.partition ? session.partition.id :0
      const args = { token: session.authToken, idp, idc, q }
      await post(this, 'SetQuotas', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_NouvellePartition: 'Création d\'une nouvelle partition' *******
Dans Comptes : **Comptable seulement:**
- `tpK` : table des partitions cryptée par la clé K du Comptable `[ {cleP, code }]`. Son index est le numéro de la partition.
  - `cleP` : clé P de la partition.
  - `code` : code / commentaire court de convenance attribué par le Comptable

- token: éléments d'authentification du compte.
- n : numéro de partition
- itemK: {cleP, code} crypté par la clé K du Comptable.
- quotas: { qc, qn, qv }
Retour:
*/
export class NouvellePartition extends Operation {
  constructor () { super('NouvellePartition') }

  async run (code, q) { // q: [qc, q1, q2]
    try {
      const session = stores.session
      const n = session.compte.mcode.size + 1
      const cleP = Cles.partition(n)
      const args = { 
        token: session.authToken, 
        itemK: await crypter(session.clek, new Uint8Array(encode({cleP, code}))),
        quotas: { qc: q.qc, qn: q.qn, qv: q.qv },
        n
      }
      await post(this, 'NouvellePartition', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*  OP_ChangerPartition: 'Transfert d\'un compte dans une autre tranche de quotas' ************
- token: éléments d'authentification du compte.
- id : id du compte qui change de partition
- idp : id de la nouvelle partition
- cleAP : clé A du compte cryptée par la clé P de la nouvelle partition
- clePK : clé de la nouvelle partition cryptée par la clé publique du compte
- notif: notification du compte cryptée par la clé P de la nouvelle partition
Retour:
*/
export class ChangerPartition extends Operation {
  constructor () { super('ChangerPartition') }

  async run (id, idpart, ntf) { // id du compte, id nouvelle partition
    try {
      const session = stores.session
      const idp = ID.long(idpart, session.ns)
      const cleA = RegCles.get(id)
      const cleP = RegCles.get(idp)
      const cleAP = await crypter(cleP, cleA, 1)
      const notif = ntf ? await ntf.crypt(cleP) : null
      const pub = await getPub(id)
      const clePK = await crypterRSA(pub, cleP)
      const args = {
        token: session.authToken,
        id, idp, cleAP, clePK, notif
      }
      await post(this, 'ChangerPartition', args)
      session.notifC = notif
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*  OP_DeleguePartition: 'Changement de statut délégué d\'un compte dans sa partition' ************
- token: éléments d'authentification du compte.
- id : id du compte qui change de statut
- del: true / false, statut délégué
Retour:
*/
export class DeleguePartition extends Operation {
  constructor () { super('ChangerPartition') }

  async run (id, del) { // id du compte, statut délégué
    try {
      const session = stores.session
      const args = { token: session.authToken, id, del }
      await post(this, 'DeleguePartition', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetQuotasPart: 'Mise à jour des quotas d\'une tpartition'
- token: éléments d'authentification du compte.
- idp : id de la partition
- quotas: {qc, qn, qv}
Retour:
*/
export class SetQuotasPart extends Operation {
  constructor () { super('SetQuotasPart') }

  async run (idp, quotas) {
    try {
      const session = stores.session
      const args = { token: session.authToken, idp: ID.long(idp, session.ns), quotas}
      await post(this, 'SetQuotasPart', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetCodePart: 'Mise à jour du code d\'une partition'
- token: éléments d'authentification du compte.
- idp : id de la partition
- etpk: {codeP, code} crypté par la clé K du Comptable
Retour:
*/
export class SetCodePart extends Operation {
  constructor () { super('SetQuotasPart') }

  async run (id, code) {
    try {
      const session = stores.session
      const idp = ID.long(id, session.ns)
      const cleP = RegCles.get(idp)
      const etpk = await crypter(session.clek, new Uint8Array(encode({ cleP, code })))
      const args = { token: session.authToken, idp, etpk}
      await post(this, 'SetCodePart', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_PlusTicket: 'Génération d\'un ticket de crédit'
et ajout du ticket au Comptable
- token : jeton d'authentification du compte de **l'administrateur**
- ma: montant attendu
- refa: référence éventuelle du compte
- ids: ids du ticket généré
Retour: 
- rowCompta: du compte après insertion du ticket
*/
export class PlusTicket extends Operation {
  constructor () { super('PlusTicket') }

  async run (ma, refa, ids) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ma, refa, ids }
      const ret = await post(this, 'PlusTicket', args)
      const compta = await compile(ret.rowCompta)
      session.setCompta(compta)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_MoinsTicket: 'Suppression d\'un ticket de crédit'
et retrait (zombi) du ticket du Comptable
- token : jeton d'authentification du compte
- ids : ticket à enlever
Retour: 
- rowCompta
*/
export class MoinsTicket extends Operation {
  constructor () { super('MoinsTicket') }

  async run (ids) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ids }
      const ret = await post(this, 'MoinsTicket', args)
      const compta = await compile(ret.rowCompta)
      session.setCompta(compta)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_ReceptionTicket: 'Réception d\'un ticket par le Comptable'
- `token` : jeton d'authentification du compte Comptable
- `ids` : du ticket
- `mc` : montant reçu
- `refc` : référence du Comptable
Retour: rien
*/
export class ReceptionTicket extends Operation {
  constructor () { super('ReceptionTicket') }

  async run (ids, mc, refc) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ids, mc, refc }
      await post(this, 'ReceptionTicket', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_MajCv : Mise à jour de la carte de visite d\'un avatar ******************************************
- token : jeton d'authentification du compte
- cv : carte de visite (photo / texte cryptés)
Retour:
*/
export class MajCv extends Operation {
  constructor () { super('MajCv') }

  async run (cv1) {
    try {
      const session = stores.session
      const cle = RegCles.get(ID.long(cv1.id, session.ns))
      const cv = await cv1.crypter(cle)
      const args = { token: session.authToken, cv }
      await post(this, 'MajCv', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetCv : Obtention de la carte de visite d\'un avatar ******************************************
- token : jeton d'authentification du compte
- id : id du people
- ch: [id, ids] id d'un chat d'un des avatars du compte avec le people
Retour:
- cv: si trouvée
*/
export class GetCv extends Operation {
  constructor () { super('MajCv') }

  async run (id) {
    try {
      const session = stores.session
      const aSt = stores.avatar
      const lch = aSt.chatsAvec(id)
      const ch = lch.length ? [lch[0].id, lch[0].ids] : null
      const args = { token: session.authToken, id, ch }
      const ret = await post(this, 'GetCv', args)
      let cv = null
      if (ret.cv) {
        const cle = RegCles.get(ID.long(id, session.ns))
        cv = CV.set(ret.cv, cle)
      }
      return this.finOK(cv)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*OP_NouvelAvatar: 'Création d\'un nouvel avatar du compte' **********************
- token: éléments d'authentification du compte.
- id: de l'avatar à créér
- cleAK : sa clé A cryptée par la clé K
- pub: sa clé RSA publique
- priv: sa clé RSA privée cryptée par la clé K
- cvA: sa CV cryptée par sa clé A
Retour:
*/
export class NouvelAvatar extends Operation {
  constructor () { super('NouvelAvatar') }

  async run (nom) {
    try {
      const session = stores.session
      const clek = session.clek
      const cleA = Cles.avatar()
      const id = Cles.id(cleA, session.ns)
      const kp = await genKeyPair()
      const cv = new CV(id, 0, null, nom)

      const args = {
        token: session.authToken,
        id, // id avatar à créer
        cleAK: await crypter(clek, cleA), // clé A de l'avatar cryptée par la clé K du compte
        pub: kp.publicKey,
        privK: await crypter(clek, kp.privateKey),
        cvA: await cv.crypter(cleA)
      }

      await post(this, 'NouvelAvatar', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_McMemo Changement des mots clés et mémo attachés à un contact ou groupe ********************************
- token: éléments d'authentification du compte.
- id: de l'avatar ou du groupe
- htK : hashtags séparés par un espace et crypté par la clé K
- txK : texte du mémo gzippé et crypté par la clé K
*/
export class McMemo extends Operation {
  constructor () { super('McMemo') }

  async run (id, ht, tx) {
    try {
      const session = stores.session
      const x = tx ? gzipB(tx) : null
      const txK = tx ? await crypter(session.clek, x) : null
      const htK = ht ? await crypter(session.clek, ht) : null
      const args = { token: session.authToken, id, txK, htK }
      await post(this, 'McMemo', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_ChangementPS: 'Changement de la phrase secrete de connexion du compte' ********************
- token: éléments d'authentification du compte.
- hps1: hash du PBKFD de la phrase secrète réduite du compte.
- hXC: hash du PBKFD de la phrase secrète complète.
- cleKXC: clé K cryptée par la phrase secrète
*/
export class ChangementPS extends Operation {
  constructor () { super('ChangementPS') }

  async run (ps) {
    try {
      const session = stores.session
      const cleKXC = await crypter(ps.pcb, session.clek)
      const args = { token: session.authToken, hps1: ps.hps1, hXC: ps.hpsc, cleKXC }
      await post(this, 'ChangementPS', args)
      session.chgps(ps)
      if (session.synchro) await idb.storeBoot()
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_Nouveau membre (contact) *******************************************
- token donne les éléments d'authentification du compte.
- ida : id du contact
- idg : id du groupe
Retour:
- im : indice im attribué
*/
export class NouveauMembre extends Operation {
  constructor () { super('NouveauMembre') }

  async run () { // people courant nouveau contact du groupe courant
    try {
      const session = stores.session
      const args = { token: session.authToken, 
        ida: session.peopleId,
        idg: session.groupeId,
      }
      const ret = await post(this, 'NouveauMembre', args)
      session.setMembreId(ret.im)
      this.ui.setPage('groupe', 'membres')
      this.ui.egrplus = false
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_NouveauGroupe: 'Création d\'un nouveau groupe' ********
- token donne les éléments d'authentification du compte.
- idg : du groupe
- ida : de l'avatar fondateur
- cleAG : clé A de l'avatar cryptée par la clé G
- cleGK : clé du groupe cryptée par la clé K du compte
- cvG: carte de visite du groupe crypté par la clé G du groupe
- msu: true si mode simple
- quotas: { qn, qv } maximum de nombre de notes et de volume fichiers
Retour:
*/
export class NouveauGroupe extends Operation {
  constructor () { super('NouveauGroupe') }

  async run (nom, msu, quotas) { // quotas: {qn, qv ...}
    try {
      const session = stores.session

      const cleg = Cles.groupe()
      const idg = Cles.id(cleg, session.ns)
      const cleA = RegCles.get(session.avatarId)
      const cleAG = await crypter(cleg, cleA)
      const cleGK = await crypter(session.clek, cleg)
      const cv = new CV(idg, 0, null, nom) // (id, v, ph, tx)
      const cvG = await cv.crypter(cleg)

      const args = { 
        token: session.authToken, idg, cvG, cleAG, cleGK, msu,
        quotas: { qn: quotas.qn, qv: quotas.qv },
        ida: session.avatarId
      }
      await post(this, 'NouveauGroupe', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_NouveauContact: 'Ajout d\'un contact à un groupe' ********
- token donne les éléments d'authentification du compte.
- idg : du groupe
- ida : de l'avatar contact
- cleAG : clé A du contact cryptée par la clé G du groupe
Retour:
*/
export class NouveauContact extends Operation {
  constructor () { super('NouveauContact') }

  async run () { 
    try {
      const session = stores.session
      const cleg = RegCles.get(session.groupeId)
      const cleA = RegCles.get(session.peopleId)

      const args = { 
        token: session.authToken, 
        idg: session.groupeId,
        ida: session.peopleId,
        cleAG: await crypter(cleg, cleA)
      }
      await post(this, 'NouveauContact', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_ModeSimple: 'Demande de retour au mode simple d\'invitation à un groupe' **********
- token donne les éléments d'authentification du compte.
- idg : id du groupe
- ida : id de l'avatar demandant le retour au mode simple.
- simple:
  - true 'Je vote pour passer au mode "SIMPLE"'
  - false: 'Annuler les votes et rester en mode UNANIME'
Retour:
*/
export class ModeSimple extends Operation {
  constructor () { super('ModeSimple') }

  async run (simple) {
    try {
      const session = stores.session
      const args = { 
        token: session.authToken, 
        idg: session.groupeId, 
        ida: session.avatarId,
        simple
      }
      await post(this, 'ModeSimple', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_InvitationGroupe: 'Invitation à un groupe' **********
- token donne les éléments d'authentification du compte.
- idg: id du groupe
- idm: id du membre invité
- rmsv: 0: inviter, 2: modifier, 3: supprimer, 4: voter pour
- flags: flags d'invitation
- msgG: message de bienvenue crypté par la clé G du groupe
- idi: id de l'invitant pour le mode d'invitation simple 
  (sinon tous les avatars du comptes animateurs du groupe)
- suppr: 1-contact, 2:radié, 3-radié + LN
- cleGA: clé G du groupe cryptée par la clé A de l'invité
Retour:
*/
export class InvitationGroupe extends Operation {
  constructor () { super('InvitationGroupe') }

  async run (rmsv, idm, idi, flags, msg, suppr) { 
    try {
      const session = stores.session
      const cleg = RegCles.get(session.groupeId)
      const clea = RegCles.get(idm)

      const args = { token: session.authToken, 
        idg: session.groupeId,
        idm: idm,
        rmsv, idi, flags, 
        suppr: rmsv === 3 ? suppr : 0,
        cleGA: await crypter(clea, cleg),
        msgG: await crypter(cleg, gzipB(msg))
      }
      await post(this, 'InvitationGroupe', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_AcceptInvitation: 'Acceptation d\'une invitation à un groupe' *************
- token donne les éléments d'authentification du compte.
- idg : id du groupe
- idm: id du membre invité
- iam: accepte accès aux membres
- ian: accepte l'accès aux notes
- cleGK: cle du groupe cryptée par la clé K du compte
- cas: 1:accepte 2:contact 3:radié 4:radié + LN
- msgG: message de remerciement crypté par la cle G du groupe
Retour:
*/
export class AcceptInvitation extends Operation {
  constructor () { super('AcceptInvitation') }

  async run (cas, inv, iam, ian, msg) { //
    try {
      const session = stores.session
      const cleg = RegCles.get(inv.idg)
      
      const args = { token: session.authToken, 
        idg: inv.idg, 
        idm: inv.ida,
        cas, iam, ian,
        cleGK: await crypter(session.clek, cleg),
        msgG: await crypter(cleg, gzipB(msg))
      }
      await post(this, 'AcceptInvitation', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_MajDroitsMembre: 'Mise à jour des droits d\'un membre sur un groupe' *******
- token donne les éléments d'authentification du compte.
- idg : id du groupe
- idm : id du membre
- nvflags : nouveau flags. Peuvent changer DM DN DE AM AN
- anim: true si animateur
Retour:
*/
export class MajDroitsMembre extends Operation {
  constructor () { super('MajDroitsMembre') }

  async run (idm, nvflags, anim) {
    try {
      const session = stores.session
      const args = { 
        token: session.authToken, 
        idg: session.groupeId,
        idm, nvflags, anim }
      await post(this, 'MajDroitsMembre', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_RadierMembre: 'Oubli d\'un membre d\'un groupe' **************
- token donne les éléments d'authentification du compte.
- idg : id du groupe
- idm : id du membre
- rad: 1-redevient contact, 2-radiation, 3-radiation + ln
Retour:
*/
export class RadierMembre extends Operation {
  constructor () { super('RadierMembre') }

  async run (idm, rad) {
    try {
      const session = stores.session
      const args = { 
        token: session.authToken, 
        idg: session.groupeId,
        idm, rad }
      // await post(this, 'RadierMembre', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}
