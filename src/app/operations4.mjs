import { encode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { Operation } from './operation.mjs'
import { random, gzipB, $t } from './util.mjs'
import { Cles, isAppExc, ID } from './api.mjs'
import { idb } from '../app/db.mjs'
import { post, getData, putData } from './net.mjs'
import { RegCles, compile, CV } from './modele.mjs'
import { decrypter, crypter, genKeyPair, crypterRSA } from './webcrypto.mjs'

/** Opérations NON authentifiées: ping, echo, Acceptation / refus sponsoring */

/** OP_EchoTexte: 'Lancement d\'un test d\'écho' ***********
args.token donne les éléments d'authentification du compte.
args.to : délai en secondes avant retour de la réponse
args.texte : texte à renvoyer en écho
Retour:
- echo : texte d'entrée retourné
*/
export class EchoTexte extends Operation {
  constructor() { super('EchoTexte') }

  async run(texte, to) {
    try {
      const ret = await post(this, 'EchoTexte', { to: to, texte })
      console.log('Echo : ' + ret.echo)
      return this.finOK(ret.echo)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* ErreurFonc *******************************************/
export class ErreurFonc extends Operation {
  constructor() { super('ErreurFonc') }

  async run(texte, to) {
    try {
      await post(this, 'ErreurFonc', { to, texte })
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_PingDB: '"Ping" de la base distante' *********
*/
export class PingDB extends Operation {
  constructor() { super('PingDB') }

  async run() {
    try {
      const ret = await post(this, 'PingDB', {})
      return this.finOK(ret)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/** Get Sponsoring ****************************************************
args.token: éléments d'authentification du compte.
args.org : organisation
args.hps1 : hash du PBKFD de la phrase de contact réduite
Retour:
- rowSponsoring s'il existe
*/
export class GetSponsoring extends Operation {
  constructor () { super('GetSponsoring') }

  async run (org, hps1, hTC) {
    try {
      const ret = await post(this, 'GetSponsoring', { org, hps1, hTC })
      return this.finOK(ret)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*  OP_AcceptationSponsoring: 'Acceptation d\'un sponsoring et création d\'un nouveau compte'
  org: { t: 'org' }, // organisation
  subJSON: { t: 'string' }, // subscription de la session
  idsp: { t: 'ida' }, // identifiant du sponsor
  idssp: { t: 'ids' }, // identifiant du sponsoring
  id: { t: 'ida' }, // id du compte sponsorisé à créer
  hXR: { t: 'ids' }, // hash du PBKD de sa phrase secrète réduite
  hXC: { t: 'ids' }, // hash du PBKD de sa phrase secrète complète
  hYC:  { t: 'ids' }, // hash du PNKFD de la phrase de sponsoring
  cleKXC: { t: 'u8' }, // clé K du nouveau compte cryptée par le PBKFD de sa phrase secrète complète
  cleAK: { t: 'u8' }, // clé A de son avatar principal cryptée par la clé K du compte
  ardYC: { t: 'u8' }, // ardoise du sponsoring
  dconf: { t: 'bool' }, // dconf du sponsorisé
  pub: { t: 'u8' }, // clé RSA publique de l'avatar
  privK: { t: 'u8' }, // clé privée RSA de l(avatar cryptée par la clé K du compte
  cvA: { t: 'cv' }, // CV de l'avatar cryptée par sa clé A
  clePK: { t: 'u8', n: true }, // clé P de sa partition cryptée par la clé K du nouveau compte
  cleAP: { t: 'u8', n: true }, // clé A de son avatar principâl cryptée par la clé P de sa partition
  clePA: { t: 'u8', n: true }, // cle P de la partition cryptée par la clé A du nouveau compte
  ch: { t: 'chsp', n: true }, // { ccK, ccP, cleE1C, cleE2C, t1c, t2c }
    // ccK: clé C du chat cryptée par la clé K du compte
    // ccP: clé C du chat cryptée par la clé publique de l'avatar sponsor
    // cleE1C: clé A de l'avatar E (sponsor) cryptée par la clé du chat.
    // cleE2C: clé A de l'avatar E (sponsorisé) cryptée par la clé du chat.
    // t1c: mot du sponsor crypté par la clé C
    // t2c: mot du sponsorisé crypté par la clé C
  htK: { t: 'u8' }, // hashtag relatif au sponsor
  txK: { t: 'u8' } // texte relatif au sponsor
*/
export class AcceptationSponsoring extends Operation {
  constructor() { super('AcceptationSponsoring') }

  async run(org, sp, texte, ps, dconf) {
    stores.session.setOrg(org)
    // const config = stores.config
    try {
      const clek = random(32) // du compte
      const cleKXC = await crypter(ps.pcb, clek) // clé K du nouveau compte cryptée par le PBKFD de sa phrase secrète complète
      const cleA = Cles.avatar()
      const id = Cles.id(cleA)
      const kp = await genKeyPair()
      const cv = new CV(id, 0, null, sp.nom)

      const nomsp = sp.cv.nomC
      const txK = await crypter(clek, gzipB(nomsp))
      const htK = await crypter(clek, $t('sponsor'))
      
      const args = {
        org,
        // subJSON: stores.config.subJSON,
        idsp: sp.id,
        idssp: sp.ids,
        id, // id du compte sponsorisé à créer
        hXR: ps.hps1, // hash du PBKD de sa phrase secrète réduite
        hXC: ps.hpsc, // hash du PBKD de sa phrase secrète complète
        hYC: sp.hYC, // hash du PNKFD de la phrase de sponsoring
        cleKXC: cleKXC, // clé K du nouveau compte cryptée par le PBKFD de sa phrase secrète complète
        cleAK: await crypter(clek, cleA), // clé A de son avatar principal cryptée par la clé K du compte
        ardYC: await crypter(sp.YC, texte + '\n' + sp.ard), // ardoise du sponsoring
        dconf: dconf,
        pub: kp.publicKey,
        privK: await crypter(clek, kp.privateKey),
        cvA: await cv.crypter(cleA),
        txK, htK
      }

      if (!sp.estA) {
        RegCles.set(sp.cleP)
        args.clePK = await crypter(clek, sp.cleP) // clé P de sa partition cryptée par la clé A de son avatar principal
        args.clePA = await crypter(cleA, sp.cleP) // clé P de sa partition cryptée par la clé A de son avatar principal
        args.cleAP = await crypter(sp.cleP, cleA, 1) // clé A de son avatar principâl cryptée par la clé P de sa partition
      }
      if (!sp.dconf && !dconf) {
        const cc = random(32)
        const pub = await this.getPub(sp.id, org)
        args.ch = {
          ccK: await crypter(clek, cc), // clé C du chat cryptée par la clé K du compte
          ccP: await crypterRSA(pub, cc), // clé C du chat cryptée par la clé publique de l'avatar sponsor
          cleE1C:  await crypter(cc, sp.cleA), // clé A de l'avatar E (sponsor) cryptée par la clé du chat.
          cleE2C:  await crypter(cc, cleA), // clé A de l'avatar E (sponsorisé) cryptée par la clé du chat.
          t1c: await crypter(cc, gzipB(sp.ard)), // mot du sponsor crypté par la clé C
          t2c: await crypter(cc, gzipB(texte)) // mot du sponsorisé crypté par la clé C
        }
      }

      await post(this, 'AcceptationSponsoring', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_RefusSponsoring: 'Rejet d\'une proposition de sponsoring'
- org: organisation,
- id ids : identifiant du sponsoring
- ardYC : réponse du filleul
- hYC: hash du PBKFD de la phrase de sponsoring
*/
export class RefusSponsoring extends Operation {
  constructor() { super('RefusSponsoring') }

  async run(sp, texte) {
    try {
      console.log(texte)
      const session = stores.session
      const args = { 
        org: session.org,
        id: sp.id,
        ids: sp.ids,
        hYC: sp.hYC,
        ardYC: await crypter(sp.YC, texte)
      }
      await post(this, 'RefusSponsoring', args)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Opérations authentifiées */

/* OP_ProlongerSponsoring: 'Prolongation / annulation d\'un sponsoring'
args.id ids : identifiant du sponsoring
args.dlv : nouvelle dlv (0 == annulation)
*/
export class ProlongerSponsoring extends Operation {
  constructor() { super('ProlongerSponsoring') }

  async run(sp, dlv) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id: sp.id, ids: sp.ids, dlv }
      await post(this, 'ProlongerSponsoring', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Test d\'existence d\'une phrase de connexion / contact / sponsoring ******
args.ids : hash de la phrase de contact / de connexion
args.t :
  - 1 : phrase de connexion(hps1 de compta)
  - 2 : phrase de sponsoring (ids)
  - 3 : phrase de contact (hpc d'avatar)
Retour:
- existe : true si le hash de la phrase existe
*/
export class ExistePhrase extends Operation {
  constructor () { super('ExistePhrase') }

  async run (hps1, t) {
    try {
      const session = stores.session
      const args = { token: session.authToken, hps1: hps1, t, org: session.org }
      const ret = await post(this, 'ExistePhrase' + (t === 1 ? '1' : ''), args)
      const ex = ret.existe || false
      return this.finOK(ex)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetCompta : retourne la compta d'un compte
Le demandeur doit être:
- le comptable,
- OU un délégué de sa partition si c'est un cpompte O
- OU avec un chat ayant un "mut" avec le demandé si c'est un compte A 

  id: { t: 'ida' }, // id du compte dont la compta est demandée
  ids: { t: 'ida', n: true }
Retour:
- rowCompta s'il existe
*/
export class GetCompta extends Operation {
  constructor () { super('GetCompta') }

  async run (id, ids) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id: id || session.compteId, ids: ids || null }
      const ret = await post(this, 'GetCompta', args)
      let c
      if (ret.rowCompta) {
        c = await compile(ret.rowCompta)
        session.setCompta(c)
      }
      return this.finOK(c)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* GetComptaQv : retourne les compteurs qv de la compta d'un compte
- `token` : jeton d'authentification du compte
- `id` : du compte
Retour: rowCompta
*/
export class GetComptaQv extends Operation {
  constructor () { super('GetCompta') }

  async run (id) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id: id || session.compteId }
      const ret = await post(this, 'GetComptaQv', args)
      return this.finOK(ret.comptaQv)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetSynthese: 'Obtention de la synthèse de l\'espace' *********
args.token donne les éléments d'authentification du compte.
Retour:
- rowSynthse
*/
export class GetSynthese extends Operation {
  constructor () { super('GetSynthese') }

  async run () { 
    try {
      const session = stores.session
      const args = { token: session.authToken }
      const ret = await post(this, 'GetSynthese', args)
      const s = await compile(ret.rowSynthese)
      session.setSynthese(s)
      return this.finOK(s)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetEspaces : Obtient tous les espaces
- `token` : éléments d'authentification du compte.
Retour:
- espaces : array de row espaces
*/
export class GetEspaces extends Operation {
  constructor () { super('GetEspaces') }

  async run () {
    try {
      const session = stores.session
      const args = { token: session.authToken }
      const ret = await post(this, 'GetEspaces', args)
      return this.finOK(ret.espaces)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* `GetNotifC` : obtention de la notification d'un compte
- `token` : jeton d'authentification du compte de **l'administrateur**
- `id` : id du compte dont on cherche la notification
Réservée au comptable et aux délégués de la partition du compte
Retour:
- notif
*/
export class GetNotifC extends Operation {
  constructor () { super('GetNotifC') }

  async run (id, idp) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id}
      const ret = await post(this, 'GetNotifC', args)
      let notif = null
      if (ret.notif) {
        const cleP = RegCles.get(idp)
        if (cleP) notif = Notification.decrypt(ret.notif, cleP)
      }
      session.notifC = notif
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetPartition: 'Obtention d\'une partition' *********
args.token donne les éléments d'authentification du compte Comptable.
args.id
Retour:
- rowPartition
*/
export class GetPartition extends Operation {
  constructor () { super('GetPartition') }

  async run (id) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, id }
      const ret = await post(this, 'GetPartition', args)
      const p = await compile(ret.rowPartition)
      if (p) session.setPartition(p)
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

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

  async run (optionA, nbmi) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, optionA, nbmi }
      await post(this, 'SetEspaceOptionA', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*   OP_SetEspaceDlvat: 'Changement de la date limite de vie des comptes "O" par l\'administrateur',
- token : jeton d'authentification de l'administrateur
- ns : id de l'espace notifié.
- dlvat: aaaammjj,
Retour: rien
*/
export class SetEspaceDlvat extends Operation {
  constructor () { super('SetEspaceDlvat') }

  async run (ns, dlvat) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ns, dlvat }
      await post(this, 'SetEspaceDlvat', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_InitTachesGC: 'Initialisation des tâches du GC',
- token : jeton d'authentification de l'administrateur
Retour: [nx nc]
- nx : nombre de tâches existantes
- nc : nombre de tâches créées
*/
export class InitTachesGC extends Operation {
  constructor() { super('InitTachesGC') }

  async run() {
    try {
      const session = stores.session
      const args = { token: session.authToken }
      const ret = await post(this, 'InitTachesGC', args)
      return this.finOK(ret.nxnc)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* `CreationEspace` : création d'un nouvel espace
- token : jeton d'authentification du compte de **l'administrateur**
- org : code de l'organisation
- TC : PBKFD de la phrase de sponsoring du Comptable par l'AT
- hTC : hash de TC
Retour: rien

Traitement ssi si: 
- soit espace n'existe pas, 
- soit espace existe et a un `hTC` : re-création avec une nouvelle phrase de sponsoring.

Création des rows espace, synthese
- génération de la `cleE` de l'espace: -> `cleET` (par TC) et `cleES` (par clé système).
- stocke dans l'espace: `hTC cleES cleET`. Il est _à demi_ créé, son Comptable n'a pas encore crée son compte.
*/
export class CreationEspace extends Operation {
  constructor() { super('CreationEspace') }

  async run(org, phrase) {
    try {
      const session = stores.session

      const args = {
        token: session.authToken,
        org: org,
        TC: phrase.pcb,
        hTC: phrase.hpsc,
      }
      await post(this, 'CreationEspace', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_MajSponsEspace : 'Changement de la phrase de contact du Comptable'
- token : jeton d'authentification du compte de **l'administrateur**
- ns : numéro de l'espace
- org : code de l'organisation
- TC : PBKFD de la phrase de sponsoring du Comptable par l'AT
- hTC : hash de TC
Retour: rien
*/
export class MajSponsEspace extends Operation {
  constructor() { super('MajSponsEspace') }

  async run(org, phrase) {
    try {
      const session = stores.session

      const args = {
        token: session.authToken,
        org: org,
        TC: phrase.pcb,
        hTC: phrase.hpsc,
      }
      await post(this, 'MajSponsEspace', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* `CreationComptable` : création du comptable d'un nouvel espace
- token : jeton d'authentification du compte à créer
- org : code de l'organisation
- idp : ID de l partition primitive
- hTC : hash du PBKFD de la phrase de sponsoring du Comptable
- hXR : hash du PBKFD de la phrase secrète réduite
- hXC : hash du PBKFD de la phrase secrète complète
- pub: clé RSA publique du Comptable
- privK: clé RSA privée du Comptable cryptée par la clé K
- clePK: clé P de la partition 1 cryptée par la clé K du Comptable
- cleEK: clé E cryptée par la clé K
- cleAP: clé A du Comptable cryptée par la clé de la partition
- cleAK: clé A du Comptable cryptée par la clé K du Comptable
- cleKXC: clé K du Comptable cryptée par XC du Comptable (PBKFD de la phrase secrète complète).
- clePA: cle P de la partition cryptée par la clé A du Comptable
- ck: {cleP, code} cryptés par la clé K du Comptable. 
  - `cleP` : clé P de la partition.
  - `code` : code / commentaire court de convenance attribué par le Comptable
*/
export class CreationComptable extends Operation {
  constructor() { super('CreationComptable') }

  async run(org, phrase, cleE, hTC) { // cleE: clé de l'espace pour lire les rapports générés sur le serveur
    try {
      const session = stores.session

      const cleP = Cles.partition() // clé de la partition
      const idp = Cles.id(cleP)
      const cleK = random(32) // clé K du Comptable
      const cleA = Cles.comptable() // clé A de l'avatar Comptable
      const kp = await genKeyPair()

      const tp = {cleP: cleP, code: $t('nomPartitionPrimitive')}

      const args = {
        token: session.authToken,
        org: org,
        hTC,
        idp,
        hXR: phrase.hps1,
        hXC: phrase.hpsc,
        pub: kp.publicKey,
        privK: await crypter(cleK, kp.privateKey),
        cleEK: await crypter(cleK, cleE),
        clePK: await crypter(cleK, cleP),
        cleAP: await crypter(cleP, cleA, 1),
        cleAK: await crypter(cleK, cleA),
        cleKXC: await crypter(phrase.pcb, cleK),
        clePA: await crypter(Cles.comptable(), cleP),
        // `{ cleP, code }` crypté par la clé K du comptable
        ck: await crypter(cleK, new Uint8Array(encode(tp)))
      }
      await post(this, 'CreationComptable', args)
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
- `htK txK` : hashtag et texte attribué par le sponsor au sponsorisé
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
      const spht = $t('sponsorise')
      const args = { 
        token: session.authToken, 
        id: session.avatarId,
        hYR: arg.pc.hps1,
        hYC: arg.pc.hpsc,
        psK: await crypter(session.clek, arg.pc.phrase),
        YCK: await crypter(session.clek, arg.pc.pcb),
        cleAYC : await crypter(arg.pc.pcb, cleA),
        nomYC: await crypter(arg.pc.pcb, arg.nom),
        txK: await crypter(session.clek, gzipB(arg.nom)),
        htK: await crypter(session.clek, spht),
        cvA: await cv.crypter(cleA),
        ardYC: await crypter(arg.pc.pcb, arg.mot),
        dconf: arg.dconf,
        don: arg.don
      }
      args.quotas = arg.quotas
      if (arg.partitionId) { // compte O
        const cleP = RegCles.get(arg.partitionId)
        args.partitionId = arg.partitionId
        args.del = arg.del
        args.clePYC = await crypter(arg.pc.pcb, cleP)
        args.cleAP = await crypter(cleP, cleAC, 1)
      }
      await post(this, 'AjoutSponsoring', args)
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
  - idg: idE et idI sont co-membres du groupe idg (idI a accès aux membres)
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

  async run (idI, idE, mode, hZC, txt, urgence) {
    try {
      const session = stores.session
      const aSt =  stores.avatar
      const pSt = stores.people

      const cc = random(32)
      const pub = await this.getPub(idE)
      const cleAI = RegCles.get(idI)
      const cleAE = RegCles.get(idE)
      const y = gzipB(txt)
      const txtc = await crypter(cc, y)
      const args = { token: session.authToken, idI, idE, mode, hZC, urgence: urgence || false }
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

/* OP_MutChat: Ajout ou suppression d\'une demande de mutation sur un chat 
  id: { t: 'ida' }, // id de l'avatar du chat (principal)
  ids: { t: 'ids' },  // ids du chat
  mut: { t: 'int', min: 0, max: 2 } // type de demande - 1 muter en O, 2 muter en A
*/
export class MutChat extends Operation {
  constructor () { super('MutChat') }

  async run (chat, mut) {
    try {
      const session = stores.session
      const args = { 
        token: session.authToken, 
        id: chat.id, 
        ids: chat.ids,
        mut: mut
      }
      await post(this, 'MutChat', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*  OP_MajChat: 'Mise à jour d\'un "chat".'
- `token` : éléments d'authentification du compte.
- id, ids: id du chat
- t: texte gzippé crypté par la clé C du chat (null si suppression)
- dh : 0 ou date-heure de l'item du chat à supprimer
- don : montant du don de I à E
Retour:
- disp: true si E a disparu (pas de maj faite)*/
export class MajChat extends Operation {
  constructor () { super('MajChat') }

  async run (chat, txt, dh, don, urgence) {
    try {
      const session = stores.session
      const args = { 
        token: session.authToken, 
        id: chat.id, 
        ids: chat.ids,
        t: txt ? await crypter(chat.clec, gzipB(txt)) : null,
        dh: dh || 0,
        urgence: urgence || false,
        don: don
      }
      const ret = await post(this, 'MajChat', args)
      return this.finOK(ret.disp)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_MajLectChat: 'Mise à jour de la date-heure de lecture d\'un "chat".'
- `token` : éléments d'authentification du compte.
- id, ids: id du chat
*/
export class MajLectChat extends Operation {
  constructor () { super('MajLectChat') }

  async run (chat, lstIm) {
    try {
      const session = stores.session
      const args = { 
        token: session.authToken, 
        id: chat.id, 
        ids: chat.ids
      }
      if (lstIm) args.lstIm = lstIm
      await post(this, 'MajLectChat', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_MajLectChatgr: 'Mise à jour de la date-heure de lecture d\'un "chat".'
- `token` : éléments d'authentification du compte.
- idg: id du groupe
- lstIm: liste des im des membres du groupe du compte ayant lu le chat
*/
export class MajLectChatgr extends Operation {
  constructor () { super('MajLectChatgr') }

  async run (idg, lstIm) {
    try {
      const session = stores.session
      const args = { token: session.authToken, idg, lstIm }
      await post(this, 'MajLectChatgr', args)
      this.finOK()
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

/* OP_SetEspaceQuotas : 'Déclaration des quotas globaux de l\'espace par l\'administrateur technique',
- `token` : jeton d'authentification du compte de **l'administrateur**
- `ns` : id de l'espace notifié.
- `quotas` : quotas globaux

Retour: rien
*/
export class SetEspaceQuotas extends Operation {
  constructor () { super('SetEspaceNprof') }

  async run (org, quotas) {
    try {
      const session = stores.session
      const args = { token: session.authToken, org, quotas}
      await post(this, 'SetEspaceQuotas', args)
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

  async run (ntf, org) {
    try {
      const session = stores.session
      const args = { token: session.authToken, org, ntf}
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
      const hZR = p.hps1
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
      const hZR = p ? p.hps1 : null
      const hZC = p ? p.hpsc : null
      const args = { token: session.authToken, id, pcK, hZR, hZC, cleAZC }
      await post(this, 'ChangementPC', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* StatutChatE: Statut du contact d'un chat
  ids: { t: 'ida' } // ids = chat
Retour: { cpt, idp, del }
- cpt: true si avatar principal
- idp: id de la partition si compte "0", 
- del: true si delégué
*/
export class StatutChatE extends Operation {
  constructor () { super('StatutChatE') }

  async run (ids) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ids }
      const ret = await post(this, 'StatutChatE', args)
      return this.finOK(ret.statut)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_RafraichirCvsAv: 'Rafraichissement des CVs des chats de l\'avatar'
- token : jeton d'authentification du compte de **l'administrateur**
- id : id de l'avatar
- lch : liste des chats. { ids, idE, vcv }
- lmb : liste des membres: { id, im, ida, vcv}
Retour: [nc, nv]
- `nc`: nombre de CV mises à jour
- `nv` : nombre de chats existants
EXC:
- 8001: avatar disparu
*/
export class RafraichirCvsAv extends Operation {
  constructor () { super('RafraichirCvsAv') }

  async run (id, membres) {
    try {
      const session = stores.session
      const aSt = stores.avatar
      const gSt = stores.groupe
      const lch = []
      const e = aSt.getElt(id)
      if (e) for(const [ids, ch] of e.chats) 
        lch.push({ ids, idE: ch.idE, vcv: ch.vcv })
      const lmb = []
      if (membres) {
        for(const idg of session.compte.idGroupes(id)) {
          const e = gSt.egr(idg)
          if (e) {
            for(const [im, mb] of e.membres)
              lmb.push({ id: idg, im: im, vcv: mb.vcv, ida: mb.ida})
          }
        }
      }
      const args = { token: session.authToken, id, lch, lmb }
      const ret = await post(this, 'RafraichirCvsAv', args)
      return this.finOK(ret.ncnv)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
      await this.finKO(e)
    }
  }
}

/* OP_RafraichirCvsGr: 'Rafraichissement des CVs des membres d\'un grouper'
- token : jeton d'authentification du compte de **l'administrateur**
- idg : id du groupe
- lmb : liste des membres: { id, im, ida, vcv}
Retour: [nc, nv]
- `nc`: nombre de CV mises à jour
- `nv` : nombre de chats existants
Exception générique:
- 8002: groupe disparu
*/
export class RafraichirCvsGr extends Operation {
  constructor () { super('RafraichirCvsGr') }

  async run () {
    try {
      const session = stores.session
      const idg = session.groupeId
      const gSt = stores.groupe
      const lmb = []
      const e = gSt.egr(idg)
      if (e) {
        for(const [im, mb] of e.membres)
          lmb.push({ id: idg, im: im, vcv: mb.vcv, ida: mb.ida})
      }
      const args = { token: session.authToken, idg, lmb }
      const ret = await post(this, 'RafraichirCvsGr', args)
      return this.finOK(ret.ncnv)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
      await this.finKO(e)
    }
  }
}

/* OP_SetQuotas: 'Fixation des quotas d'un compte dans sa partition ou comme compte A'
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
- `tpK` : map des partitions cryptée par la clé K du Comptable `[ {cleP, code }]`. Son index est le numéro de la partition.
  - `cleP` : clé P de la partition.
  - `code` : code / commentaire court de convenance attribué par le Comptable

- token: éléments d'authentification du compte.
- idp : ID de la partition
- itemK: {cleP, code} crypté par la clé K du Comptable.
- quotas: { qc, qn, qv }
Retour:
*/
export class NouvellePartition extends Operation {
  constructor () { super('NouvellePartition') }

  async run (code, q) { // q: [qc, q1, q2]
    try {
      const session = stores.session
      const cleP = Cles.partition()
      const args = { 
        token: session.authToken, 
        itemK: await crypter(session.clek, new Uint8Array(encode({cleP, code}))),
        quotas: { qc: q.qc, qn: q.qn, qv: q.qv },
        idp: Cles.id(cleP)
      }
      await post(this, 'NouvellePartition', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SupprPartition: 'Création d\'une nouvelle partition' *******
Dans Comptes : **Comptable seulement:**
- `tpK` : table des partitions cryptée par la clé K du Comptable `[ {cleP, code }]`. Son index est le numéro de la partition.
  - `cleP` : clé P de la partition.
  - `code` : code / commentaire court de convenance attribué par le Comptable

- token: éléments d'authentification du compte.
- n : numéro de partition
Retour:
*/
export class SupprPartition extends Operation {
  constructor () { super('SupprPartition') }

  async run (idp) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, idp }
      await post(this, 'SupprPartition', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*  OP_MuterCompteAauto: Auto mutation du compte O en compte A
Mutation d'un compte `c` O de la partition `p` en compte A
- augmente `syntheses.qtA`.
- diminue `partition[p].mcpt[c].q` ce qui se répercute sur `syntheses.tsp[p].qt`.
- bloqué si l'augmentation de `syntheses.qtA` fait dépasser `syntheses.qA`.
  
  quotas: { t: 'q' } // quotas: { qc, qn, qv }   
*/
export class MuterCompteAauto extends Operation {
  constructor () { super('MuterCompteA') }

  async run (q) { // id du compte à muter, pc: phrase de contact
    try {
      const session = stores.session
      const args = { 
        token: session.authToken, 
        quotas: { qc: q.qc, qn: q.qn, qv: q.qv}
      }
      await post(this, 'MuterCompteAauto', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*  OP_MuterCompteA: 'Mutation du compte O en compte A' ************
- token: éléments d'authentification du compte.
- id : id du compte devenant A
- ids : ids du chat du compte demandeur (Comptable / Délégué)
- quotas: { qc, qn, qv }
- t : texte (crypté) de l'item à ajouter au chat
Retour:
*/
export class MuterCompteA extends Operation {
  constructor () { super('MuterCompteA') }

  async run (chat, q, txt) { // id du compte à muter, pc: phrase de contact
    try {
      const session = stores.session
      const args = { 
        token: session.authToken, 
        id: chat.idE,
        t: txt ? await crypter(chat.clec, gzipB(txt)) : null,
        quotas: { qc: q.qc, qn: q.qn, qv: q.qv},
        ids: chat.ids
      }
      await post(this, 'MuterCompteA', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*  OP_MuterCompteO: 'Mutation d\'un compte A en compte O' ************
- token: éléments d'authentification du compte.
- id : id du compte devenant O
- quotas: { qc, qn, qv }
- cleAP : clé A du compte cryptée par la clé P de la partition
- clePK : clé de la nouvelle partition cryptée par la clé publique du compte
- ids : ids du chat du compte demandeur (Comptable / Délégué)
- t : texte (crypté) de l'item à ajouter au chat
Retour:
*/
export class MuterCompteO extends Operation {
  constructor () { super('MuterCompteO') }

  async run (chat, q, txt) { // id du compte, id nouvelle partition
    try {
      const id = chat.idE
      const session = stores.session
      const idp = session.compte.idp
      const cleA = RegCles.get(id)
      const cleP = RegCles.get(idp)
      const cleAP = await crypter(cleP, cleA, 1)
      const pub = await this.getPub(id)
      const clePK = await crypterRSA(pub, cleP)
      const args = {
        token: session.authToken,
        id, cleAP, clePK, 
        quotas: { qc: q.qc, qn: q.qn, qv: q.qv},
        t: txt ? await crypter(chat.clec, gzipB(txt)) : null,
        ids: chat.ids
      }
      await post(this, 'MuterCompteO', args)
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

  async run (id, idp, ntf) { // id du compte, id nouvelle partition
    try {
      const session = stores.session
      const cleA = RegCles.get(id)
      const cleP = RegCles.get(idp)
      const cleAP = await crypter(cleP, cleA, 1)
      const notif = ntf ? await ntf.crypt(cleP) : null
      const pub = await this.getPub(id)
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
  constructor () { super('DeleguePartition') }

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
      const args = { token: session.authToken, idp, quotas}
      await post(this, 'SetQuotasPart', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetQuotasA: 'Mise à jour des quotas pour les comptes A'
- token: éléments d'authentification du compte.
- quotas: {qc, qn, qv}
Retour:
*/
export class SetQuotasA extends Operation {
  constructor () { super('SetQuotasA') }

  async run (quotas) {
    try {
      const session = stores.session
      const args = { token: session.authToken, quotas}
      await post(this, 'SetQuotasA', args)
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

  async run (idp, code) {
    try {
      const session = stores.session
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
      const cle = RegCles.get(cv1.id)
      const cv = await cv1.crypter(cle)
      const args = { token: session.authToken, cv }
      await post(this, 'MajCv', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetCv : 'Obtention de la carte de visite d\'un avatar ou d\'un groupe.',
- token : jeton d'authentification du compte
- id : id du people
- r : A quel titre le PEOPLE id est contact du compte ?
  { del: true } : parce que idp est délégué
  { avch } : parce qu'il a un chat avec l'avatar avch du compte
  { idg, imp, ida, ima } : parce qu'il est membre d'indice imp du groupe idg
    dont le compte a un avatar ida / ima ayant accès aux membres
- r : A quel titre le GROUPE id est visible du compte ?
  { ida, ima }:  parce que l'avatar ida indice ima dans le groupe id a accès aux membres
Retour:
- cv: si trouvée
*/
export class GetCv extends Operation {
  constructor () { super('GetCv') }

  async run (id) {
    try {
      let cv = null
      const session = stores.session
      const args = { token: session.authToken, id }
      const gSt = stores.groupe
      const pSt = stores.people

      if (ID.estGroupe(id)) {
        const egr = gSt.egr(id)
        if (egr) {
          const r = egr.groupe ? egr.groupe.idaImaAM : { ida: 0, ima: 0 }
          if (r.ida && r.ima) args.r = r
        }
      } else {
        args.r = pSt.whyPeople(id)
      }

      if (args.r) {
        const ret = await post(this, 'GetCv', args)
        if (ret.cv) {
          const cle = RegCles.get(id)
          cv = (await CV.set(ret.cv, cle)).store()
        }
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
      const idg = Cles.id(cleg)
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
- cleGA : clé G du groupe cryptée par la clé A du contact
Retour:
EXC: 
- 8002: groupe disparu
- 8001: avatar disparu
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
        cleAG: await crypter(cleg, cleA),
        cleGA: await crypter(cleA, cleg)
      }
      await post(this, 'NouveauContact', args)
      return this.finOK(0)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
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
EXC:
- 8002: groupe disparu
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
      return this.finOK(0)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
      await this.finKO(e)
    }
  }
}

/* OP_AnnulerContact: 'Annulation du statut de contact d\'un groupe par un avatar' **********
- token donne les éléments d'authentification du compte.
- idg : id du groupe
- ida : id de l'avatar demandant l'annulation.
- ln : true Inscription en liste noire
Retour:
EXC: 
- 8002: groupe disparu
*/
export class AnnulerContact extends Operation {
  constructor () { super('AnnulerContact') }

  async run (idg, ida, ln) {
    try {
      const session = stores.session
      const args = { token: session.authToken, idg, ida, ln }
      await post(this, 'AnnulerContact', args)
      return this.finOK(0)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
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
EXC: 
- 8002: groupe disparu
- 8001: avatar disparu
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
        msgG: await crypter(cleg, gzipB(msg), 1)
      }
      await post(this, 'InvitationGroupe', args)
      return this.finOK(0)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
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
- txK: texte à attacher à compti/idg s'il n'y en a pas
Retour:
EXC: 
- 8002: groupe disparu
- 8001: avatar disparu
*/
export class AcceptInvitation extends Operation {
  constructor () { super('AcceptInvitation') }

  async run (cas, inv, iam, ian, msg) { //
    try {
      const session = stores.session
      const cleg = RegCles.get(inv.idg)
      let txK = null

      if (session.compti.mc.has(inv.idg)) {
        const cv = session.getCV(inv.idg)
        txK = await crypter(session.clek, gzipB(cv.nomC))
      }

      const args = { token: session.authToken, 
        idg: inv.idg, 
        idm: inv.ida,
        cas, iam, ian,
        txK,
        cleGK: await crypter(session.clek, cleg),
        msgG: await crypter(cleg, gzipB(msg))
      }
      await post(this, 'AcceptInvitation', args)
      return this.finOK(0)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
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
EXC: 
- 8002: groupe disparu
- 8001: avatar disparu
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
      return this.finOK(0)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
      await this.finKO(e)
    }
  }
}

/* OP_RadierMembre: 'Oubli d\'un membre d\'un groupe' **************
- token donne les éléments d'authentification du compte.
- idg : id du groupe
- idm : id du membre
- cleGA: cle G du groupe cryptée par la clé du membre 
- rad: 1-redevient contact, 2-radiation, 3-radiation + ln
Retour:
EXC: 
- 8002: groupe disparu
- 8001: avatar disparu
*/
export class RadierMembre extends Operation {
  constructor () { super('RadierMembre') }

  async run (idm, rad) {
    try {
      const session = stores.session
      const cleg = RegCles.get(session.groupeId)
      const clea = RegCles.get(idm)
      const cleGA = await crypter(clea, cleg)

      const args = { 
        token: session.authToken, 
        idg: session.groupeId,
        cleGA,
        idm, 
        rad 
      }
      await post(this, 'RadierMembre', args)
      return this.finOK(0)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
      await this.finKO(e)
    }
  }
}

/* OP_ItemChatgr: 'Ajout ou effacement d\'un item au chat du groupe' *************
- token donne les éléments d'authentification du compte.
- idg : id du groupe
- idaut: id du membre auteur du texte
- dh: date-heure de l'item effacé
- msgG: texte de l'item
Retour:
EXC: 
- 8002: groupe disparu
*/
export class ItemChatgr extends Operation {
  constructor () { super('ItemChatgr') }

  async run (idaut, dh, msg) {
    try {
      const session = stores.session
      const cleg = RegCles.get(session.groupeId)

      const args = { 
        token: session.authToken, 
        idg: session.groupeId,
        msgG: msg ? await crypter(cleg, gzipB(msg)) : null,
        idaut: idaut || '',
        dh: dh || 0 
      }
      await post(this, 'ItemChatgr', args)
      return this.finOK(0)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
      await this.finKO(e)
    }
  }
}

/* OP_HebGroupe: 'Gestion de l\'hébergement et des quotas d\'un grouper'
- token : jeton d'authentification du compte de **l'administrateur**
- idg : id du groupe
- nvHeb: id de l'avatar nouvel hébergeur
- action
  AGac1: 'Je prends l\'hébergement à mon compte',
  AGac2: 'Je cesse d\'héberger ce groupe',
  AGac3: 'Je reprends l\'hébergement de ce groupe par un autre de mes avatars',
  AGac4: 'Je met à jour les nombres de notes et volumes de fichiers maximum attribués au groupe',
- qn : nombre maximum de notes
- qv : volume maximum des fichiers
Retour:
Exception générique:
- 8001: avatar disparu
- 8002: groupe disparu
*/
export class HebGroupe extends Operation {
  constructor () { super('HebGroupe') }

  async run (action, nvHeb, qn, qv) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, 
        idg: session.groupeId,
        nvHeb, action, qn, qv
      }
      const ret = await post(this, 'HebGroupe', args)
      return this.finOK(ret.ncnv)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
      await this.finKO(e)
    }
  }
}

/* OP_SupprAvatar: 'Suppression d\'un avatar'
- token : jeton d'authentification du compte de **l'administrateur**
- id : id de l'avatar
Retour:
Exception générique:
- 8001: avatar disparu
*/
export class SupprAvatar extends Operation {
  constructor () { super('SupprAvatar') }

  async run (id) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, id }
      await post(this, 'SupprAvatar', args)
      return this.finOK(0)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
      await this.finKO(e)
    }
  }
}

/* OP_SupprCompte: 'Suppression d\'un compte'
- token : jeton d'authentification du compte de **l'administrateur**
Retour:
Exception générique:
- 8001: avatar disparu
*/
export class SupprCompte extends Operation {
  constructor () { super('SupprCompte') }

  async run (id) { 
    try {
      const session = stores.session
      const args = { token: session.authToken }
      await post(this, 'SupprCompte', args)
      return this.finOK(0)
    } catch (e) {
      if (isAppExc(e) && (e.code === 8001 || e.code === 8002)) return e.code - 8000
      await this.finKO(e)
    }
  }
}

/* OP_DownloadStatC: 'Téléchargement d\'un fichier statistique comptable mensuel'
args.token: éléments d'authentification du compte.
args.org : pour admin seulement
args.mr : mois relatif 0 à 11
*/
export class DownloadStatC extends Operation {
  constructor () { super('DownloadStatC') }

  async run (org, mr, cleES) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, mr }
      let ret
      if (!org) {
        args.org = org
        ret =  await post(this, 'ComptaStatA', args)
      } else {
        ret =  await post(this, 'ComptaStatC', args)
      }
      let buf, buf2
      try { 
        buf = await getData(ret.getUrl) 
      } catch (e) { 
        return this.finOK({ err: 1, msg: e.message })
      }
      try {
        buf2 = await decrypter(cleES, buf)
      } catch (e) { 
        return this.finOK({ err: 2 })
      }
      const blob = new Blob([buf2], { type: 'text/csv' })
      return this.finOK({ blob, creation: ret.creation || false, mois: ret.mois })
    } catch (e) {
      this.finKO(e)
    }
  }
}

/* OP_DownloadStatC2: 'Téléchargement d\'un fichier statistique comptable mensuel déjà calculé'
export class DownloadStatC2 extends Operation {
  constructor () { super('DownloadStatC2') }

  async run (org, mois, cs, cleES) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, org, mois, cs }
      const ret =  await post(this, 'GetUrlStat', args)
      let buf, buf2
      try { 
        buf = await getData(ret.getUrl) 
      } catch (e) { 
        return this.finOK({ err: 1, msg: e.message })
      }
      try {
        buf2 = await decrypter(cleES, buf)
      } catch (e) { 
        return this.finOK({ err: 2 })
      }
      const blob = new Blob([buf2], { type: 'text/csv' })
      return this.finOK({ blob })
    } catch (e) {
      this.finKO(e)
    }
  }
}
*/

/* OP_TicketsStat: 'Téléchargements en CSV de la liste des tickets d\'un mois'
args.token: éléments d'authentification du compte.
args.org
args.mr : mois relatif demandé
*/
export class TicketsStat extends Operation {
  constructor () { super('TicketStat') }

  async run (mr) { 
    try {
      const session = stores.session
      const cleES = session.compte.cleE
      const args = { token: session.authToken, org: session.org, mr }
      const ret =  await post(this, 'TicketsStat', args)
      let buf = null, buf2 = null
      try { 
        buf = await getData(ret.getUrl) 
      } catch (e) { 
        return this.finOK({ err: 1, msg: e.message })
      }
      try {
        buf2 = await decrypter(cleES, buf)
      } catch (e) { 
        return this.finOK({ err: 2 })
      }
      const blob = new Blob([buf2], { type: 'text/csv' })
      return this.finOK({ blob, creation: ret.creation || false, mois: ret.mois })
    } catch (e) {
      this.finKO(e)
    }
  }
}

/* OP_NouvelleNote: 'Création d\'une nouvelle note' ***************
- token: éléments d'authentification du compte
- id : de la note
- ida : pour une note de groupe, id de son avatar auteur
- exclu : auteur est exclusif
- pid, pids : identifiant du parent pour une note rattachée
- t : texte crypté
Retour: rien
*/
export class NouvelleNote extends Operation {
  constructor () { super('NouvelleNote') }

  async run (id, txt, ida, exclu, pid, pids) {
    try {
      const session = stores.session
      const cle = !ID.estGroupe(id) ? session.clek : RegCles.get(id)
      const t = txt ? await crypter(cle, gzipB(txt)) : null
      const args = { token: session.authToken, id, t, ida, exclu, pid, pids }
      await post(this, 'NouvelleNote', args)
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_RattNote: 'Gestion du rattachement d\'une note à une autre' ********
- token: éléments d'authentification du compte.
- id ids: identifiant de la note
- ref : [id, ids] : racine ou note de rattachemnt
Retour: rien
*/
export class RattNote extends Operation {
  constructor () { super('RattNote') }

  async run (id, ids, pid, pids) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, ids, pid, pids }
      await post(this, 'RattNote', args)
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_MajNote: 'Mise à jour du texte d\'une note' ******
- token: éléments d'authentification du compte.
- id ids: identifiant de la note (dont celle du groupe pour un note de groupe)
- t : nouveau texte encrypté
- aut : id de l'auteur de la note pour un groupe
Retour:
*/
export class MajNote extends Operation {
  constructor () { super('MajNote') }

  async run (id, ids, ida, texte) {
    try {
      const session = stores.session
      const cle = !ID.estGroupe(id) ? session.clek : RegCles.get(id)
      const t = texte ? await crypter(cle, gzipB(texte)) : null
      const args = { token: session.authToken, id, ids, t, ida}
      await post(this, 'MajNote', args)
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_HTNote: 'Changement des hashtags attachés à une note par un compte' ******
- token: éléments d'authentification du compte.
- id ids: identifiant de la note
- htK : ht personels
- htG : hashtags du groupe
Retour: rien
*/
export class HTNote extends Operation {
  constructor () { super('McNote') }

  async run (note, ht, htg) {
    try {
      const session = stores.session
      const htK = ht ? await crypter(session.clek, ht) : null
      const htG = htg ? await crypter(note.cle, htg) : null
      const args = { 
        token: session.authToken, 
        id: note.id, ids: note.ids, htK, htG
      }
      await post(this, 'HTNote', args)
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_ExcluNote: 'Changement de l\'attribution de l\'exclusivité d\'écriture d\'une note'
- token: éléments d'authentification du compte.
- id ids: identifiant de la note
- ida: id de l'avatar prenant l'exclusivité
Retour: rien
*/
export class ExcluNote extends Operation {
  constructor () { super('ExcluNote') }

  async run (id, ids, ida) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, ids, ida }
      await post(this, 'ExcluNote', args)
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_DownloadFichier: 'Téléchargement d\'un fichier attaché à une note'
Download fichier / getUrl
GetUrlNf : retourne l'URL de get d'un fichier
- token: éléments d'authentification du compte.
- id ids : id de la note.
- idf : id du fichier.
Retour:
- url : url de get
*/
export class DownloadFichier extends Operation {
  constructor () { super('DownloadFichier') }

  async run (note, idf) { 
    try {
      const session = stores.session
      const faSt = stores.ficav
      const args = { token: session.authToken, id: note.id, ids: note.ids, idf }
      const ret =  await post(this, 'GetUrlNf', args)
      const buf = await getData(ret.url)
      if (session.synchro) faSt.putDataEnCache(idf, buf)
      return this.finOK(buf || null)
    } catch (e) {
      this.finKO(e)
    }
  }
}

/* OP_NouveauFichier: 'Enregistrement d\'un nouveau fichier attaché à une note'
*/
export class NouveauFichier extends Operation {
  constructor () { super('NouveauFichier') }

  async run (note, ida, fic, lidf) {
    // lidf : liste des idf des fichiers à supprimer
    try {
      const id = note.id
      const ids = note.ids
      const session = stores.session
      const faSt = stores.ficav
      const ui = stores.ui
      const buf = fic.u8
      delete fic.u8

      ui.setEtf(2)
      /* PutUrlNf : retourne l'URL de put d'un fichier d'une note ******
      id: { t: 'idag' }, // id de la note (avatar ou groupe)
      ids: { t: 'ids' }, // ids de la note
      ida: { t: 'ida', n: null } // pour une note de groupe, id de l'auteur de l'enregistrement
      Retour:
      - idf : identifiant du fichier
      - url : url à passer sur le PUT de son contenu
      Remarque: l'excès de volume pour un groupe et un compte, ainsi que le volume 
      descendant seront décomptés à la validation de l'upload
      */
      const args = { token: session.authToken, id, ids, ida, lg: fic.lg, lidf }
      const ret = await post(this, 'PutUrlNf', args)
      const url = ret.url
      fic.idf = ret.idf
      // Transfert effectif du fichier (si pas d'exception de volume sur putUrl)
      const er = await putData(url, buf)
      if (er) throw new AppExc(E_WS, 5, [er])
      ui.setEtf(3)

      /* validerUpload ****************************************
      token: éléments d'authentification du compte.
      id: { t: 'idag' }, // id de la note (avatar ou groupe)
      ids: { t: 'ids' }, // ids de la note
      fic: { t: 'fic' }, // { idf, lg, ficN }
      aut: { t: 'ida', n: true }, // id de l'auteur (pour une note de groupe)
      lidf: { t: 'lidf', n: true } // liste des idf fichiers de la note à supprimer
      */
      const ficN = await crypter(note.cle, new Uint8Array(encode(fic)))
      const args2 = { token: session.authToken, id, ids,
        fic: { idf: fic.idf, lg: fic.lg, ficN },
        lidf, ida }
      await post(this, 'ValiderUpload', args2)
      if (session.synchro) faSt.putDataEnCache(fic.idf, buf)
      ui.setEtf(4)
      // await sleep(1000)
      return this.finOK(true)
    } catch (e) {
      try {
        await this.finKO(e)
      } catch(e2) {
        return false
      }
    }
  }
}


/* OP_SupprNote: 'Suppression d\'une note'  ******
- token: éléments d'authentification du compte.
- id ids: identifiant de la note
Retour: aucun
*/
export class SupprNote extends Operation {
  constructor () { super('SupprNote') }

  async run () {
    try {
      const session = stores.session
      const nSt = stores.note
      const n = nSt.note
      const args = { token: session.authToken, id: n.id, ids: n.ids }
      await post(this, 'SupprNote', args)
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SupprFichier: 'Suppression d\'un fichier attaché à une note'
- token: éléments d'authentification du compte.
- id, ids : de la note
- idf : id du fichier
- aut: id de l'auteur (pour une note de groupe)
Retour: aucun
*/
export class SupprFichier extends Operation {
  constructor () { super('SupprFichier') }

  async run (note, idf, ida) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, id: note.id, ids: note.ids, idf, ida }
      await post(this, 'SupprFichier', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*****************************************
GetTaches : retourne la liste des tâches en cours
args.token: éléments d'authentification du compte.
args.ns : 
  - null: toutes
  - '' : GC
  - 'x' : du ns x
*/
export class GetTaches extends Operation {
  constructor () { super('GetTaches') }

  async run (ns) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ns }
      const ret = await post(this, 'GetTaches', args)
      return this.finOK(ret.taches)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*****************************************
DelTache : suppression d'une tâche
args.token: éléments d'authentification du compte.
args.op ns id ids : 
*/
export class DelTache extends Operation {
  constructor () { super('DelTache') }

  async run (t) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, op: t.op, ns: t.ns, id: t.id, ids: t.ids }
      await post(this, 'DelTache', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*****************************************
GoTache : lancement immédiat d'une tâche
args.token: éléments d'authentification du compte.
args.op ns id ids : 
*/
export class GoTache extends Operation {
  constructor () { super('GoTache') }

  async run (t) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, op: t.op, ns: t.ns, id: t.id, ids: t.ids }
      await post(this, 'GoTache', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}
