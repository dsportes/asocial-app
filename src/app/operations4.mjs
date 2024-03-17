import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { Operation } from './synchro.mjs'
import { afficherDiag, $t, random, gzipB, setTrigramme, getTrigramme } from './util.mjs'
import { idb, IDBbuffer } from './db.mjs'
import { DataSync, appexc, ID, Rds, Cles, AMJ } from './api.mjs'
import { post } from './net.mjs'
import { CV, compile, RegCles } from './modele.mjs'
import { crypter, genKeyPair, crypterRSA } from './webcrypto.mjs'

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
- cleE : clé de l'espace
- clePK: clé P de la partition 1 cryptée par la clé K du Comptable
- cleAP: clé A du Comptable cryptée par la clé de la partition
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
      const cleE = Cles.espace() // clé de l'espace
      const cleA = Cles.comptable() // clé A de l'avatar Comptable
      const kp = await genKeyPair()

      const args = {
        token: session.authToken,
        ns: ns,
        org: org,
        hXR: phrase.hps1,
        hXC: phrase.hpsc,
        pub: kp.publicKey,
        privK: await crypter(cleK, kp.privateKey),
        cleE: Cles.espace(), // clé de l'espace
        cleEK: await crypter(cleK, cleE),
        clePK: await crypter(cleK, cleP),
        cleAP: await crypter(cleP, cleA, 1),
        cleAK: await crypter(cleK, cleA),
        cleKXC: await crypter(phrase.pcb, cleK),
        clePA: await crypter(Cles.comptable(), cleP),
        // `{ cleP, code }` crypté par la clé K du comptable
        ck: await crypter(cleK, 
          new Uint8Array(encode({ cleP, code: config.nomPartitionPrimitive })))
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
- hYR : hash du PNKFD de la phrase de sponsoring réduite
- `psK` : texte de la phrase de sponsoring cryptée par la clé K du sponsor.
- `YCK` : PBKFD de la phrase de sponsoring cryptée par la clé K du sponsor.
- `cleAYC` : clé A du sponsor crypté par le PBKFD de la phrase complète de sponsoring.
- `partitionId`: id de la partition si compte 0    
- `cleAP` : clé A du COMPTE sponsor crypté par la clé P de la partition.
  Permet au serveur de vérifier que le compte est vraiement de cette partition
  et est délégué.
- `clePYC` : clé P de sa partition (si c'est un compte "O") cryptée par le PBKFD 
  de la phrase complète de sponsoring (donne l'id de la partition).
- `nomYC` : nom du sponsorisé, crypté par le PBKFD de la phrase complète de sponsoring.
- `cvA` : `{ v, photo, info }` du sponsor, textes cryptés par sa cle A.
- `ardYC` : ardoise de bienvenue du sponsor / réponse du sponsorisé cryptée par le PBKFD de la phrase de sponsoring.

- `quotas` : `[qc, q1, q2]` pour un compte O, quotas attribués par le sponsor.
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
      const cv = stores.people.getCV(session.avatarId)
      const args = { 
        token: session.authToken, 
        id: session.avatarId,
        hYR: arg.pc.hps1,
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
