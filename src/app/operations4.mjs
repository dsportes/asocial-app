import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { Operation } from './synchro.mjs'
import { random, gzipB } from './util.mjs'
import { Cles, d14 } from './api.mjs'
import { post } from './net.mjs'
import { RegCles, compile, CV } from './modele.mjs'
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

/* OP_SetDhvuCompta: 'Mise à jour de la date-heure de "vu" des notifications d\'un compte'
args.token: éléments d'authentification du compte.
args.dhvu : dhvu cryptée par la clé K
Retour:
*/
export class SetDhvuCompta extends Operation {
  constructor () { super('SetDhvuCompta') }

  async run () {
    try {
      const session = stores.session
      const dhvu = await crypter(session.clek, '' + (Date.now()))
      const args = { token: session.authToken, dhvu }
      await post(this, 'SetDhvuCompta', args)
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

/* OP_EstAutonome: 'Vérification que le bénéficiaire envisagé d\'un don est bien un compte autonome'
indique si l'avatar donné en argument est 
l'avatar principal d'un compte autonome
- token : jeton d'authentification du compte de **l'administrateur**
- id : id de l'avatar
Retour: 
- `st`: 
  - 0 : pas avatar principal 
  - 1 : avatar principal d'un compte A
  - 2 : avatar principal d'un compte O
*/
export class EstAutonome extends Operation {
  constructor () { super('EstAutonome') }

  async run (id) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, id }
      const ret = await post(this, 'EstAutonome', args)
      return this.finOK(ret.st)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_RafraichirCvsAv: 'Rafraichissement des CVs des chats de l\'avatar'
- token : jeton d'authentification du compte de **l'administrateur**
- id : id de l'avatar
Retour:
- `n`: nombre de CV mises à jour
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
      await this.finKO(e)
    }
  }
}
