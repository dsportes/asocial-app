import stores from '../stores/stores.mjs'
import { encode } from '@msgpack/msgpack'

import { ID, AppExc, E_WS, AMJ, limitesjour, d14 } from './api.mjs'
import { crypter } from './webcrypto.mjs'
import { post, putData, getData } from './net.mjs'
import { NomGenerique, Avatar, Chat, Compta, Note,
  Groupe, Membre, Chatgr, getNg, getCle, compile } from './modele.mjs'
import { crypterRSA } from './webcrypto.mjs'
import { commitRows, IDBbuffer } from './db.mjs'
import { Operation } from './synchro.mjs'

/* Changement des mots clés et mémo attachés à un contact ou groupe ********************************
*/
export class McMemo extends Operation {
  constructor () { super('McMemo') }

  async run (id, mc, memo) {
    try {
      const session = stores.session
      const [idk, mmk] = await Avatar.genMcMemo(id, mc, memo)
      const args = { token: session.authToken, idk, mmk }
      this.tr(await post(this, 'McMemo', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/** Changement de la phrase secrete de connexion du compte ********************
args.token: éléments d'authentification du compte.
args.hps1: hash du PBKFD de la phrase secrète réduite du compte.
args.hpsc: hash du PBKFD de la phrase secrète complète.
args.kx: clé K cryptée par la phrase secrète
*/
export class ChangementPS extends Operation {
  constructor () { super('ChangementPS') }

  async run (ps) {
    try {
      const session = stores.session
      const hps1 = (session.ns * d14) + ps.hps1
      const kx = await crypter(ps.pcb, session.clek)
      const args = { token: session.authToken, hps1: hps1, hpsc: ps.hpsc, kx }
      this.tr(await post(this, 'ChangementPS', args))
      session.chgps(ps)
      if (session.synchro) commitRows(new IDBbuffer(), true)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_MuterCompte: 'Mutation dy type d\'un compte'
POST:
- `token` : éléments d'authentification du compte.
- 'id': id du compte à muter
- 'st': type actuel: 1: A, 2: 0
- `idI idsI` : id du chat, côté _interne_.
- `idE idsE` : id du chat, côté _externe_.
- `txt1` : texte à ajouter crypté par la clé cc du chat.
- `lgtxt1` : longueur du texte

- `dlv`: nouvelle dlv
- `lavLmb`: liste des avatars et membres

Si st === 1: mutation de A en O
- `quotas`: {qc, q2, q1}
- `trib`: { 
  idT: id courte du compte crypté par la clé de la tribu,
  idt: id de la tribu, 
  cletX: cle de la tribu cryptée par la clé K du comptable,
  cletK: cle de la tribu cryptée par la clé K du compte ou sa clé RSA.
}

Retour:
*/
export class MuterCompte extends Operation {
  constructor () { super('MuterCompte') }

  async run (id, st, chat, txt, quotas, trib, compteurs) {
    try {
      const session = stores.session
      const aSt = stores.avatar
      const compte = aSt.compte
      const naI = chat.naI
      const naE = chat.naE

      const args = { 
        token: session.authToken,
        id,
        st,
        idI: naI.id, 
        idsI: await Chat.getIds(naI, naE), 
        idE: naE.id, 
        idsE: await Chat.getIds(naE, naI), 
        txt1: await Chat.getTxtCC(chat.cc, txt),
        lgtxt1: txt.length,
        lavLmb: compte.lavLmb
      }

      if (st === 1) { // A devient O
        args.quotas = quotas
        args.dlv = Compta.dlvO()
        args.trib = trib
      } else { // O devient A
        args.dlv = Compta.dlvAinit(compteurs)
      }

      this.tr(await post(this, 'MuterCompte', args))
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_NouveauGroupe: 'Création d\'un nouveau groupe' ********
args.token donne les éléments d'authentification du compte.
args.rowGroupe : le groupe créé
args.rowMembre : le membre
args.id: id de l'avatar créateur
args.quotas : [q1, q2] attribué au groupe
args.npgk: clé dans mpg du compte (hash du cryptage par la clé K du compte de `idg / idav`)
args.empgk: élément de mpg dans le compte de l'avatar créateur
Retour:
*/
export class NouveauGroupe extends Operation {
  constructor () { super('NouveauGroupe') }

  async run (nom, unanime, quotas) { // quotas: [q1, q2]
    try {
      const session = stores.session
      const aSt = stores.avatar
      const nag = NomGenerique.groupe(nom)
      const na = getNg(session.avatarId)
      const avatar = aSt.getAvatar(na.id)
      const rowGroupe = await Groupe.rowNouveauGroupe(nag, na, unanime)
      
      /*
      - `mpgk` : map des participations aux groupes des avatars du compte.
        - _clé_: `npgk`. hash du cryptage par la clé K du compte de `idg / idav`. Cette identification permet au serveur de supprimer une entrée de la map sans disposer de la clé K. `idg`: id courte du groupe, `idav`: id courte de l'avatar.
        - _valeur_: `{nomg, cleg, im, idav}` cryptée par la clé K.
          - `nomg`: nom du groupe,
          - `cleg`: clé du groupe,
          - `im`: indice du membre dans la table `flags / anag` du groupe.
          - `idav` : id (court) de l'avatar.
      */
      const e = { nomg: nag.nom, cleg: nag.rnd, im: 1, idav: na.id }
      const npgk = await Groupe.getNpgk(nag, na)
      const empgk = await crypter(session.clek, new Uint8Array(encode(e))) 

      const rowMembre = await Membre.rowNouveauMembre (nag, na, 1, avatar.cv || null, true)

      const args = { 
        token: session.authToken, 
        rowGroupe, rowMembre, 
        id: session.avatarId,
        quotas: [quotas.q1, quotas.q2], 
        npgk, empgk, 
        abPlus: [nag.id]
      }
      this.tr(await post(this, 'NouveauGroupe', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_InvitationFiche: 'Récupération des informations d\'invitation à un groupe' ******
args.token donne les éléments d'authentification du compte.
args.idg : id du groupe
args.ids: indice du membre invité
args.ivpar : indice du membre invitant
args.dh: date-heure de l'item de chat d'invitation
Retour:
- rowMembre : avec un champ supplémentaire ext : { flags, cvg, invs: map, chatg }
  chatg: texte du chat crypté par la clé du groupe
  invs : clé: im, valeur: { cva, nag }
*/
export class InvitationFiche extends Operation {
  constructor () { super('InvitationFiche') }

  async run (idg, ids, na) {
    try {
      const session = stores.session
      const gSt = stores.groupe
      const invit = gSt.getInvit(idg, na.id)
      const args = { token: session.authToken, idg, ids }
      if (invit) {
        args.ivpar = invit.ivpar
        args.dh = invit.dh
      }
      const ret = this.tr(await post(this, 'InvitationFiche', args))
      const mb = await compile(ret.rowMembre)
      return this.finOK(mb)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_HebGroupe: 'Gestion / transfert d\'hébergement d\'un groupe' **********
args.token donne les éléments d'authentification du compte.
args.action : 1 à 5
args.idg : id du groupe
args.idd : (3) id du compte de départ en cas de transfert
args.idhg : id du compte d'arrivée en cas de transfert CRYPTE par la clé du groupe
args.imh : im du nouvel hébergeur
args.q1, q2 : nouveau quotas
args.dfh: date de fin d'hébergement
args.action :
  AGac1: 'Je prends l\'hébergement à mon compte',
  AGac2: 'Je cesse d\'héberger ce groupe',
  AGac3: 'Je reprends l\'hébergement de ce groupe par un autre de mes avatars',
  AGac4: 'Je met à jour les quotas maximum attribués au groupe',
  AGac5: 'Je reprends l\'hébergement à mon compte, je suis animateur et l\hébergeur actuel ne l\'est pas',

Prise hébergement (1)
- les volumes v1 et v2 sont lus sur la version du groupe
- les volumes (pas les quotas) sont augmentés sur compta a
- sur la version du groupe, q1 et q2 sont mis à jour
- sur le groupe, idhg / imh mis à jour
Fin d'hébergement (2):
- les volumes v1 et v2 sont lus sur la version du groupe
- les volumes (pas les quotas) sont diminués sur la compta du compte
- sur le groupe :
  - dfh : date du jour + N jours
  - idhg, imh : 0
Transfert dans le même compte (3):
- sur le groupe, imh est mis à jour
- sur la version du groupe, q1 et q2 sont mis à jour
Changement de quotas (4):
- les volumes et quotas sur compta a sont inchangés
- sur la version du groupe, q1 et q2 sont mis à jour
Transfert (5):
- les volumes v1 et v2 sont lus sur la version du groupe
- les volumes (pas les quotas) sont diminués sur compta d
- les volumes (pas les quotas) sont augmentés sur compta a
- sur la version du groupe, q1 et q2 sont mis à jour
- sur le groupe, idhg / imh mis à jour
Retour:
*/
export class HebGroupe extends Operation {
  constructor () { super('HebGroupe') }

  async run (action, groupe, imh, q1, q2) {
    try {
      const session = stores.session
      const dfh = action !== 2 ? 0 : AMJ.amjUtcPlusNbj(AMJ.amjUtc(), limitesjour.groupenonheb)
      const args = { 
        token: session.authToken, 
        action, 
        imh, 
        q1, q2, 
        idg: groupe.id, 
        idhg: await Groupe.toIdhg(groupe.na.rnd),
        idd: groupe.idh,
        dfh
      }
      this.tr(await post(this, 'HebGroupe', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Nouveau membre (contact) *******************************************
args.token donne les éléments d'authentification du compte.
args.id : id du contact
args.idg : id du groupe
args.im: soit l'indice de l'avatar dans ast/nag s'il avait déjà participé, soit ast.length
args.nag: hash du rnd du membre crypté par le rnd du groupe. Permet de vérifier l'absence de doublons.
args.rowMembre
- vérification que le slot est libre
- insertion du row membre, maj groupe
Retour:
- KO : si l'indice im est déjà attribué
*/
export class NouveauMembre extends Operation {
  constructor () { super('NouveauMembre') }

  async run (gr, im, na, cv) {
    try {
      const session = stores.session
      const rowMembre = await Membre.rowNouveauMembre(gr.na, na, im, cv, false)
      const nag = await Groupe.getNag(gr.na, na)
      const args = { token: session.authToken, 
        id: na.id,
        idg: gr.id,
        nag, im, rowMembre
      }
      const ret = this.tr(await post(this, 'NouveauMembre', args))
      return this.finOK(!ret.KO)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_MajDroitsMembre: 'Mise à jour des droits d\'un membre sur un groupe' *******
args.token donne les éléments d'authentification du compte.
args.idg : id du groupe
args.ids : ids du membre
args.nvflags : nouveau flags. Peuvent changer PA DM DN DE AM AN
Retour:
*/
export class MajDroitsMembre extends Operation {
  constructor () { super('MajDroitsMembre') }

  async run (idg, ids, nvflags) {
    try {
      const session = stores.session
      const args = { token: session.authToken, idg, ids, nvflags }
      this.tr(await post(this, 'MajDroitsMembre', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_OublierMembre: 'Oubli d\'un membre d\'un groupe' **************
args.token donne les éléments d'authentification du compte.
args.idg : id du groupe
args.ids : ids du membre
args.npgk : entrée dans la table mpg
args.cas : 
  - 1 : (moi) retour en simple contact
  - 2 : (moi) m'oublier
  - 3 : (moi) m'oublier définitivement
  - 4 : oublier le membre (qui est simple contact pas invité)
  - 5 : oublier définitivement le membre
Retour:
*/
export class OublierMembre extends Operation {
  constructor () { super('OublierMembre') }

  async run (ng, na, ids, cas) {
    try {
      const session = stores.session
      const npgk = await Groupe.getNpgk(ng.id, na.id)
      const args = { token: session.authToken, idg: ng.id, npgk, ids, cas }
      this.tr(await post(this, 'OublierMembre', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_ModeSimple: 'Demande de retour au mode simple d\'invitation à un groupe' **********
args.token donne les éléments d'authentification du compte.
args.id : id du groupe
args.ids : ids du membre demandant le retour au mode simple.
  Si 0, mode unanime.
Retour:
*/
export class ModeSimple extends Operation {
  constructor () { super('ModeSimple') }

  async run (id, ids) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, ids }
      this.tr(await post(this, 'ModeSimple', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_ItemChatgr: 'Ajout d\'un item de dialogue à un "chat" de groupe' *************************
args.token: éléments d'authentification du compte.
args.chatit : row de la note
args.idg: id du groupe
args.im args.dh : pour une suppression
Retour: rien
*/
export class ItemChatgr extends Operation {
  constructor () { super('ItemChatgr') }

  async run (idg, im, dh, txt) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, idg }
      if (!dh) {
        const ng = getNg(idg)
        args.chatit = await Chatgr.getItem(ng.rnd, im, txt || '')
      } else {
        args.im = im
        args.dh = dh
      }
      this.tr(await post(this, 'ItemChatgr', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_InvitationGroupe: 'Invitation à un groupe' **********
args.token donne les éléments d'authentification du compte.
args.op : opération demandée: 
  1: invit std, 2: modif invit std, 3: suppr invit std, 
  4: vote pour, 5: vote contre, 6: suppr invit una 
args.idg : id du groupe
args.ids: indice du membre invité
args.idm: id de l'avatar du membre invité
args.im: indice de l'animateur invitant
args.flags: flags PA DM DN DE de l'invité
args.ni: numéro d'invitation pour l'avatar invité, clé dans la map invits
args.invit: élément dans la map invits {nomg, cleg, im, ivpar, dh}` cryptée par la clé publique RSA de l'avatar.
args.chatit: item de chat du groupe (mot de bienvenue)
Retour:
*/
export class InvitationGroupe extends Operation {
  constructor () { super('InvitationGroupe') }

  async run (op, gr, mb, ivpar, flags, ard) { 
      /* op:
      1: invit std, 2: modif invit std, 3: suppr invit std, 
      4: vote pour, 5: vote contre, 6: suppr invit una 

      - `invits`: maps des invitations en cours de l'avatar:
      - _clé_: `ni`, numéro d'invitation. hash du cryptage par la clé du groupe de la clé _inversée_ de l'avatar. Ceci permet à un animateur du groupe de détruire l'entrée.
      - _valeur_: `{nomg, cleg, im}` cryptée par la clé publique RSA de l'avatar.
        - `nomg`: nom du groupe,
        - `cleg`: clé du groupe,
        - `im`: indice du membre invité dans la table `flags / anag` du groupe.
        - `ivpar` : indice du membre invitant
        - `dh` : date-heure d'invitation (et de l'item du chat correspondant)
      */
    try {
      const session = stores.session
      const aSt = stores.avatar

      const dh = Date.now()
      const x = { nomg: gr.na.nom, cleg: gr.na.rnd, im: mb.ids, ivpar, dh }
      const pub = await aSt.getPub(mb.na.id)
      const invit = await crypterRSA(pub, new Uint8Array(encode(x)))
      const chatit = ard ? await Chatgr.getItem(gr.na.rnd, ivpar, ard, dh) : null
      const args = { token: session.authToken, 
        op,
        idg: gr.id, 
        ids: mb.ids,
        idm: mb.na.id,
        im: ivpar,
        flags,
        ni: await Groupe.getNi(gr.na, mb.na),
        invit,
        chatit
      }
      const ret = this.tr(await post(this, 'InvitationGroupe', args))
      return this.finOK(ret.code || 0)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_AcceptInvitation: 'Acceptation d\'une invitation à un groupe' *************
args.token donne les éléments d'authentification du compte.
args.idg : id du groupe
args.ids: indice du membre invité
args.id: id de l'avatar invité
args.nag: nag du membre (pour liste noire)
args.ni: numéro d'invitation (pour maj avatar)
args.npgk: cle de l'entrée dans mpgk du compte (pour maj mpgk)
args.epgk: entrée dans mpgk du compte
args.cas: 1: acceptation, 2: refus, 3: refus et oubli, 4: refus et liste noire
args.iam: true si accès membre
args.ian: true si accès note
args.ardg: ardoise du membre cryptée par la clé du groupe
args.chatit: item de chat (copie de l'ardoise)
Retour:
*/
export class AcceptInvitation extends Operation {
  constructor () { super('AcceptInvitation') }

  async run (cas, na, ng, im, chattxt, iam, ian) {
    try {
      const session = stores.session
      const aSt = stores.avatar
      const av = aSt.getAvatar(na.id)
      const ni = await Groupe.getNi(ng, na)
      const epgk = await av.getEpgk(ni)
      const chatit = chattxt ? await Chatgr.getItem(ng.rnd, im, chattxt) : null

      const args = { token: session.authToken, 
        idg: ng.id, 
        ids: im,
        id: na.id,
        nag: await Groupe.getNag(ng, na),
        npgk: await Groupe.getNpgk(ng.id, na.id),
        cas, iam, ian, ni, epgk,
        chatit
      }
      const ret = this.tr(await post(this, 'AcceptInvitation', args))
      return this.finOK(ret.disparu)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_NouvelleNote: 'Création d\'une nouvelle note' ***************
args.token: éléments d'authentification du compte.
args.rowNote : row de la note
args.idc: id du compte (note avatar) ou de l'hébergeur (note groupe)
Retour: rien
*/
export class NouvelleNote extends Operation {
  constructor () { super('NouvelleNote') }

  /* 
  id: groupe ou avatar
  txt: texte de la note
  im: indice du membre auteur
  exclu: pour un groupe true si im a demandé un e exclusivité d'auteur
  ref: référence de la note parent [rid, rids, rnom]
  idc: id du compte de l'auteur ou de l'hébergeur pour une note de groupe
  */
  async run (id, txt, im, exclu, ref, idc) {
    try {
      const session = stores.session

      const rowNote = await Note.toRowNouveau(id, txt, im, exclu, ref)
      const args = { token: session.authToken, rowNote : rowNote, idc }
      this.tr(await post(this, 'NouvelleNote', args))
      return this.finOK((rowNote.id + '/' + rowNote.ids))
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_NoteOpx: 'Suppression d\'une note'  ******
args.token: éléments d'authentification du compte.
op: 'suppr'
args.id ids: identifiant de la note (dont celle du groupe pour un note de groupe)
args.idc : compta à qui imputer le volume
  - pour une note personelle, id du compte de l'avatar
  - pour une note de groupe : id du "compte" de l'hébergeur du groupe
Retour:
*/
export class NoteOpx extends Operation {
  constructor () { super('NoteOpx') }

  async run (op) {
    try {
      const session = stores.session
      const nSt = stores.note
    const n = nSt.note
      const args = { token: session.authToken, id: n.id, ids: n.ids }
      if (op === 'suppr') {
        const egr = nSt.egr
        const idh = egr && egr.groupe.idh ? egr.groupe.idh : 0
        args.idc = idh || session.compteId
        this.tr(await post(this, 'SupprNote', args))
      } else {
        args.p = op === 'arch' ? 1 : 0
        this.tr(await post(this, 'ProtNote', args))
      }
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_MajNote: 'Mise à jour du texte d\'une note' ******
args.token: éléments d'authentification du compte.
args.id ids: identifiant de la note (dont celle du groupe pour un note de groupe)
args.txts : nouveau texte encrypté
args.im : auteur de la note pour un groupe
Retour:
*/
export class MajNote extends Operation {
  constructor () { super('MajNote') }

  async run (id, ids, aut, texte) {
    try {
      const session = stores.session
      const cle = Note.clen(id)
      const txts = await Note.toRowTxt(cle, texte)
      const args = { token: session.authToken, id, ids, txts, aut}
      this.tr(await post(this, 'MajNote', args))
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_ExcluNote: 'Changement de l\'attribution de l\'exclusivité d\'écriture d\'une note'
args.token: éléments d'authentification du compte.
args.id ids: identifiant de la note
args.im : 0 / im
Retour: rien
*/
export class ExcluNote extends Operation {
  constructor () { super('ExcluNote') }

  async run (id, ids, im) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, ids, im }
      this.tr(await post(this, 'ExcluNote', args))
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_McNote: 'Changement des mots clés attachés à une note par un compte' ******
args.token: éléments d'authentification du compte.
args.id ids: identifiant de la note
args.hgc: si mc perso d'une note de groupe, id dans la map mc
args.mc: mots clés perso
args.mc0: mots clés du groupe
Retour: rien
*/
export class McNote extends Operation {
  constructor () { super('McNote') }

  async run (note, mc, mc0) {
    try {
      const session = stores.session
      const args = { 
        token: session.authToken, 
        id: note.id, ids: note.ids, hgc: note.hgc, 
        mc, mc0 }
      this.tr(await post(this, 'McNote', args))
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_RattNote: 'Gestion du rattachement d\'une note à une autre' ********
args.token: éléments d'authentification du compte.
args.id ids: identifiant de la note
args.ref : [rid, rids, rnom] crypté par la clé de la note. Référence d'une autre note
Retour: rien
*/
export class RattNote extends Operation {
  constructor () { super('RattNote') }

  async run (id, ids, rid, rids, refn) {
    try {
      const session = stores.session
      const cle = ID.estGroupe(id) ? getCle(id) : session.clek
      const ref = rid === 0 ? null : await crypter(cle, new Uint8Array(encode([rid, rids, refn])))
      const args = { token: session.authToken, id, ids, ref }
      this.tr(await post(this, 'RattNote', args))
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_NouveauFichier: 'Enregistrement d\'un nouveau fichier attaché à une note'
*/
export class NouveauFichier extends Operation {
  constructor () { super('NouveauFichier') }

  async run (note, aut, fic, lidf, dv2) {
    // lidf : liste des idf des fichiers à supprimer
    try {
      const id = note.id
      const ids = note.ids
      const session = stores.session
      const ui = stores.ui
      const avnSt = stores.avnote
      const gSt = stores.groupe
      const idh = ID.estGroupe(id) ? gSt.getGroupe(id).idh : session.compteId
      const buf = fic.u8
      delete fic.u8
      const idf = fic.idf
      delete fic.idf
      if (session.synchro) {
        // on garde buf pour éviter de le recharger du serveur si le nom est disponible en mode avion
        const avn = avnSt.getAvnote(id, ids)
        if (avn && avn.mnom[fic.nom])
          avnSt.dernierFichierCharge = { idf, data: buf }
      }

      ui.setEtf(2)
      /* Put URL ****************************************
      args.token: éléments d'authentification du compte.
      args.id : id de la note
      args.idh : id de l'hébergeur pour une note groupe
      args.dv2 : variation de volume v2
      args.idf : identifiant du fichier
      Retour:
      - url : url à passer sur le PUT de son contenu
      */
      const args = { token: session.authToken, id, idh, idf, dv2 }
      const ret = this.tr(await post(this, 'PutUrl', args))
      const url = ret.putUrl

      // Transfert effectif du fichier (si pas d'exception de volume sur putUrl)
      const er = await putData(url, buf)
      if (er) throw new AppExc(E_WS, 5, [er])
      ui.setEtf(3)

      /* validerUpload ****************************************
      args.token: éléments d'authentification du compte.
      args.id, ids : de la note
      args.idh : id de l'hébergeur pour une note groupe
      args.aut: im de l'auteur (pour une note de groupe)
      args.idf : identifiant du fichier
      args.emap : entrée (de clé idf) de la map des fichiers attachés [lg, data]
      args.lidf : liste des fichiers à supprimer
      La variation de volume v2 est calculée sous contrôle transactionnel
      en relisant mafs (dont les lg).
      Retour: aucun
      */
      const emap = await note.toRowMfa(fic) // [lg, x]
      const args2 = { token: session.authToken, id, ids, idf, idh, emap, lidf, aut }
      this.tr(await post(this, 'ValiderUpload', args2))
      ui.setEtf(4)
      // await sleep(1000)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_DownloadFichier: 'Téléchargement d\'un fichier attaché à une note'
Download fichier / getUrl
GetUrl : retourne l'URL de get d'un fichier
Comme c'est un GET, les arguments sont en string (et pas en number)
args.token: éléments d'authentification du compte.
args.id : id de la note
args.idf : id du fichier
args.vt : volume du fichier (pour compta des volumes v2 transférés)
*/
export class DownloadFichier extends Operation {
  constructor () { super('DownloadFichier') }

  async run (note, idf) { 
    try {
      const session = stores.session
      const vt = note.mfa.get(idf).lg
      const args = { token: session.authToken, id: note.id, idf, vt }
      const ret =  this.tr(await post(this, 'GetUrl', args))
      if (!ret) return null
      const url = ret.getUrl
      const buf = await getData(url)
      return this.finOK(buf || null)
    } catch (e) {
      this.finKO(e)
    }
  }
}

/* OP_TicketsStat: 'Enregistre en storage la liste des tickets de M-3 désormais invariables'
args.token: éléments d'authentification du compte.
args.org
*/
export class TicketsStat extends Operation {
  constructor () { super('TicketStat') }

  async run () { 
    /*
    try {
      const session = stores.session
      const aSt = stores.avatar
      const args = { token: session.authToken, org: session.org }
      const ret =  this.tr(await post(this, 'TicketsStat', args))
      let buf = null
      try { 
        buf = await getData(ret.getUrl) 
      } catch (e) { 
        return this.finOK({ err: 1 })
      }
      try {
        buf = await decrypterRaw (aSt.compte.priv, null, buf)
      } catch (e) { 
        return this.finOK({ err: 2 })
      }
      const blob = new Blob([buf], { type: 'text/csv' })
      return this.finOK({ blob, creation: ret.creation || false, mois: ret.mois })
    } catch (e) {
      this.finKO(e)
    }
    */
  }
}


/* OP_DownloadStatC: 'Téléchargement d\'un fichier statistique comptable mensuel'
ComptaStat (org, mr)
args.token: éléments d'authentification du compte.
args.org
args.mr : mois relatif 1 2 ou 3
*/
export class DownloadStatC extends Operation {
  constructor () { super('DownloadStatC') }

  async run (org, mr) { 
    try {
      const session = stores.session
      const aSt = stores.avatar
      const args = { token: session.authToken, org, mr }
      const ret =  this.tr(await post(this, 'ComptaStat', args))
      let buf = null
      try { 
        buf = await getData(ret.getUrl) 
      } catch (e) { 
        return this.finOK({ err: 1 })
      }
      try {
        buf = await decrypterRaw (aSt.compte.priv, null, buf)
      } catch (e) { 
        return this.finOK({ err: 2 })
      }
      const blob = new Blob([buf], { type: 'text/csv' })
      return this.finOK({ blob, creation: ret.creation || false, mois: ret.mois })
    } catch (e) {
      this.finKO(e)
    }
  }
}

/* OP_DownloadStatC2: 'Téléchargement d\'un fichier statistique comptable mensuel déjà calculé'
*/
export class DownloadStatC2 extends Operation {
  constructor () { super('DownloadStatC2') }

  async run (ns, mois, cs) { 
    try {
      const session = stores.session
      const aSt = stores.avatar
      const args = { token: session.authToken, ns, mois, cs }
      const ret =  this.tr(await post(this, 'GetUrlStat', args))
      let appKey = null
      let priv = null
      let buf = null
      try { 
        buf = await getData(ret.getUrl) 
      } catch (e) { 
        return this.finOK({ err: 1 })
      }
      if (session.estAdmin) {
        appKey = ret.appKey
      } else {
        priv = aSt.compte.priv
      }
      try {
        buf = await decrypterRaw (priv, appKey, buf)
      } catch (e) { 
        return this.finOK({ err: 2 })
      }
      const blob = new Blob([buf], { type: 'text/csv' })
      return this.finOK({ blob })
    } catch (e) {
      this.finKO(e)
    }
  }
}


/* OP_SupprFichier: 'Suppression d\'un fichier attaché à une note'
args.id, ids : de la note
args.idh : id de l'hébergeur pour une note groupe
args.idf : identifiant du fichier à supprimer
args.aut: im de l'auteur (pour une note de groupe)
Retour: aucun
*/
export class SupprFichier extends Operation {
  constructor () { super('SupprFichier') }

  async run (note, idf, aut) { 
    try {
      const session = stores.session
      const gSt = stores.groupe
      const idh = ID.estGroupe(note.id) ? gSt.getGroupe(note.id).idh : session.compteId
      const args = { token: session.authToken, id: note.id, ids: note.ids, idf, idh, aut }
      this.tr(await post(this, 'SupprFichier', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SupprAvatar: 'Suppression d\'un avatar du compte' **********
args.token: éléments d'authentification du compte.
args.id : id de l'avatar
args.va : version de l'avatar
args.idc : id du compte - si égal à id, suppression du compte
args.idk : cet id crypté par la clé K du compte. Clé de la map mavk dans compta
args.chats : liste des id / ids des chats externes à traiter
args.spons : liste des ids des sponsorings à purger
args.dfh : date de fin d'hébergement des groupes
args.grps : liste des items groupes à traiter.
  - idg : id du groupe
  - vg : version du groupe
  - im : ids du membre (correspondant à l'avatar)
  - suppr : true si le groupe est à supprimer
Suppression de compte seulement
args.idt: id de la tribu du compte
args.it: indice du compte dans act de tribu, pour suppression de cette entrée
Suppression d'avatar seulement
args.dv1: réduction du volume v1 du compte (notes avatar et notes des groupes hébergés)
args.dv2
Retour: OK
- true : suprresion OK
- false : retry requis, les versions des groupes et/ou avatar ont chnagé
*/
export class SupprAvatar extends Operation {
  constructor () { super('SupprAvatar') }

  async run (args) { 
    try {
      const session = stores.session
      args.token = session.authToken
      const ret = this.tr(await post(this, 'SupprAvatar', args))
      return this.finOK(ret.KO ? false : true)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GC: 'Déclenchement du nettoyage quotidien' *******/
export class GC extends Operation {
  constructor () { super('GC') }

  async run (nomop) { 
    try {
      const ret = this.tr(await post(this, nomop, {}))
      return this.finOK(ret)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*  OP_GetSingletons: 'Obtention des rapports d\'exécution des traitements périodiques',
*/
export class GetSingletons extends Operation {
  constructor () { super('GetSingletons') }

  async run () { 
    try {
      const ret = this.tr(await post(this, 'GetSingletons', {}))
      return this.finOK(ret.singletons)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetSynthese: 'Obtention de la synthèse de l\'espace' *********
args.token donne les éléments d'authentification du compte.
args.ns
Retour:
- rowSynthse
*/
export class GetSynthese extends Operation {
  constructor () { super('GetSynthese') }

  async run (ns) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ns }
      const ret = await post(this, 'GetSynthese', args)
      const s = await compile(ret.rowSynthese)
      aSt.setSynthese(s)
      return this.finOK(s)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* ForceDlv **********************************************
Force des dlv / dfh pour tester.
args.token donne les éléments d'authentification du compte.
args.lop : liste d'opérations [op, id, ids, date]
  - op:1 : dlv de versions id
  - op:2 : dfh de groupes id
  - op:3 : dlv de membrs id / ids
Retour:
*/
export class ForceDlv extends Operation {
  constructor () { super('ForceDlv') }

  async run (lop) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, lop }
      this.tr(await post(this, 'ForceDlv', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetEspaceOptionA: 'Changement de l\'option A de l\'espace'
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- `ns` : id de l'espace notifié.
- `optionA` : 0 1 2.

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
      this.tr(await post(this, 'SetEspaceOptionA', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetVersionsDlvat: 'Obtention de la liste des avatars contraints par la DLV fixée par l\'administrteur technique',
POST:
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- `ns` : id de l'espace
- dlvat: aamm,
Retour:
- lids: array des id
*/
export class GetVersionsDlvat extends Operation {
  constructor () { super('GetVersionsDlvat') }

  async run (dlvat) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ns: session.ns, dlvat }
      const ret = this.tr(await post(this, 'GetVersionsDlvat', args))
      return this.finOK(ret.lids)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetMembresDlvat: 'Obtention de la liste des membres contraints par la DLV fixée par l\'administrteur technique',
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- `ns` : id de l'espace
- dlvat: aamm,
Retour:
- lidids: array des [id, ids]
*/
export class GetMembresDlvat extends Operation {
  constructor () { super('GetMembresDlvat') }

  async run (dlvat) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ns: session.ns, dlvat }
      const ret = this.tr(await post(this, 'GetMembresDlvat', args))
      return this.finOK(ret.lidids)
    } catch (e) {
      await this.finKO(e)
    }
  }
}
 
/* OP_ChangeAvDlvat: 'Changement de DLV pour une liste d\'avatars'
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- dlvat: aamm,
- lids: array des id
*/
export class ChangeAvDlvat extends Operation {
  constructor () { super('ChangeAvDlvat') }

  async run (dlvat, lids) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, lids, dlvat }
      this.tr(await post(this, 'ChangeAvDlvat', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_ChangeMbDlvat: 'Changement de DLV pour une liste de membres'
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- dlvat: aamm,
- lidids: array des [id, ids]
*/
export class ChangeMbDlvat extends Operation {
  constructor () { super('ChangeMbDlvat') }

  async run (dlvat, lidids) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, lidids, dlvat }
      this.tr(await post(this, 'ChangeMbDlvat', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_TestRSA: 'Test encryption RSA'
args.token
args.id
args.data
Retour:
- data: args.data crypré RSA par la clé publique de l'avatar
*/
export class TestRSA extends Operation {
  constructor () { super('TestRSA') }

  async run (id, data) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, id, data }
      const ret = this.tr(await post(this, 'TestRSA', args))
      return this.finOK(ret.data)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_CrypterRaw: 'Test d\'encryptage serveur d\'un buffer long',
Le serveur créé un binaire dont,
- les 256 premiers bytes crypte en RSA, la clé AES, IV et l'indicateur gz
- les suivants sont le texte du buffer long crypté par la clé AES générée.
args.token
args.id
args.data
args.gz
Retour:
- data: "fichier" binaire auto-décryptable en ayant la clé privée RSA
OU la clé du site
*/
export class CrypterRaw extends Operation {
  constructor () { super('CrypterRaw') }

  async run (id, data, gz, clesite) { 
    try {
      const session = stores.session
      const aSt = stores.avatar
      const args = { token: session.authToken, id, data, gz }
      const ret = this.tr(await post(this, 'CrypterRaw', args))
      const priv = clesite ? null : aSt.getAvatar(id).priv
      const res = await decrypterRaw(priv, clesite, ret.data, gz)
      return this.finOK(res)
    } catch (e) {
      await this.finKO(e)
    }
  }
}
