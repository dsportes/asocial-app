import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'

import { ID, AppExc, appexc, E_WS, E_BRK, E_BRO, AMJ, Compteurs, limitesjour } from './api.mjs'
import { $t, sleep} from './util.mjs'
import { crypter } from './webcrypto.mjs'
import { post, putData, getData } from './net.mjs'
import { Versions, NomGenerique, Avatar, Chat, Compta, Note, Ticket, Notification,
  Groupe, Membre, Tribu, Chatgr, getNg, getCle, compile, setClet} from './modele.mjs'
import { decrypter, crypterRSA, genKeyPair, random, decrypterRaw } from './webcrypto.mjs'
import { commitRows, IDBbuffer } from './db.mjs'

/* Opération générique ******************************************/
export class Operation {
  constructor (nomop) { this.nom = nomop }

  get label () { 
    // console.log('label', 'OP_' + this.nom)
    return $t('OP_' + this.nom) 
  }

  BRK () { }

  tr (ret) {
    if (!this.dh) this.dh = 0
    if (this.dh < ret.dh) this.dh = ret.dh
    return ret
  }

}

export class OperationUI extends Operation {
  constructor (nomop) {
    super(nomop)
    stores.session.startOp(this)
    this.cancelToken = null
    this.break = false
    this.nbretry = 0
  }

  async retry () {
    if (this.nbretry++ > 5) 
      throw new AppExc(E_BRO, 21, [this.label])
    if (this.retry > 1) await sleep((this.retry * 300))
    return true
  }

  BRK () { 
    if (this.break) 
      throw new AppExc(E_BRK, 0)
  }

  stop () {
    if (this.cancelToken) {
      this.cancelToken.cancel('break')
      this.cancelToken = null
    }
    this.break = true
  }

  finOK (res, silence) {
    const session = stores.session
    session.setDh(this.dh)
    session.finOp()
    if (!silence) stores.ui.afficherMessage($t('OPok', [this.nom]), false)
    return res
  }

  async finKO (e) {
    const session = stores.session
    const ui = stores.ui
    const exc = appexc(e)
    session.finOp()
    if (exc.code === 1001 || exc.code === 1002) {
      const texte = exc.args[0]
      const dh = exc.args[1]
      const nr = exc.code % 10
      const notif = new Notification({nr, dh, texte, idSource: 0})
      session.setNotifE(notif)
      if (nr === 2) {
        ui.setPage('clos')
        return
      }
    } else {
      ui.afficherMessage($t('OPko', [this.nom]), true)
      await ui.afficherExc(exc)
      throw(exc)
    }
  }
}

/* Abonnement / désabonnement à la tranche courante ************************
args.token: éléments d'authentification du compte.
args.id : id de la tribu - Si 0 désabonnement
Retour:
- rowtribu: row de la tribu
*/
export class AboTribuC extends OperationUI {
  constructor () { super('AboTribuC') }

  async run (id) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id }
      this.tr(await post(this, 'AboTribuC', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Changement des mots clés et mémo attachés à un contact ou groupe ********************************
*/
export class McMemo extends OperationUI {
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

/* Test d\'existence d\'une phrase de connexion / contact / sponsoring ******
args.ids : hash de la phrase de contact / de connexion
args.t :
  - 1 : phrase de connexion(hps1 de compta)
  - 2 : phrase de sponsoring (ids)
  - 3 : phrase de contact (hpc d'avatar)
Retour:
- existe : true si le hash de la phrase existe
*/
export class ExistePhrase extends OperationUI {
  constructor () { super('ExistePhrase') }

  async run (hps1, t) {
    try {
      const session = stores.session
      const args = { token: session.authToken, hps1: hps1, t }
      const ret = this.tr(await post(this, 'ExistePhrase', args))
      const ex = ret.existe || false
      return this.finOK(ex)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Changement des mots clés d\'un compte  ************************
*/
export class MotsclesCompte extends OperationUI {
  constructor () { super('MotsclesCompte') }

  async run (mmc) {
    try {
      const session = stores.session
      const mck = await crypter(session.clek, new Uint8Array(encode(mmc)))
      const args = { token: session.authToken, mck }
      this.tr(await post(this, 'MotsclesCompte', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Mise à jour de la carte de visite d\'un avatar ******************************************
args.token
args.id : id de l'avatar dont la Cv est mise à jour
args.v: version de versions de l'avatar incluse dans la Cv. Si elle a changé sur le serveur, retour OK false (boucle sur la requête)
args.cva: {v, photo, info} crypté par la clé de l'avatar
Retour:
- KO : true s'il faut boucler sur la requête. 
La version de l'avatar figure DANS cva, qu'il faut 
recrypter si ce n'était pas la bonne.
*/
export class MajCv extends OperationUI {
  constructor () { super('MajCv') }

  async run (avatar, photo, info) {
    try {
      const session = stores.session
      while (await this.retry()) {
        const v = Versions.get(avatar.id).v + 1
        const cva = await crypter(getCle(avatar.id), 
          new Uint8Array(encode({v, photo, info})))
        const args = { token: session.authToken, id: avatar.id, v, cva }
        const ret = this.tr(await post(this, 'MajCv', args))
        if (!ret.KO) break
      }
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Mise à jour de la carte de visite d\'un groupe ******************************************
args.token: éléments d'authentification du compte.
args.id : id du groupe dont la Cv est mise à jour
args.v: version du groupe incluse dans la Cv. Si elle a changé sur le serveur, retour OK false (boucle sur la requête)
args.cvg: {v, photo, info} crypté par la clé du groupe
*/
export class MajCvGr extends OperationUI {
  constructor () { super('MajCvGr') }

  async run (groupe, photo, info) {
    try {
      const session = stores.session
      while (await this.retry()) {
        const v = groupe.v + 1
        const cvg = await crypter(getCle(groupe.id), new Uint8Array(encode({v, photo, info})))
        const args = { token: session.authToken, id: groupe.id, v, cvg }
        const ret = this.tr(await post(this, 'MajCvGr', args))
        if (!ret.KO) break
      }
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
export class ChangementPS extends OperationUI {
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

/** Changement de la phrase de contact d\'un avatar *************************
args.token: éléments d'authentification du compte.
args.id: de l'avatar
args.hpc: hash de la phrase de contact (SUPPRESSION si null)
args.napc: na de l'avatar crypté par le PBKFD de la phrase
args.pck: phrase de contact cryptée par la clé K du compte
*/
export class ChangementPC extends OperationUI {
  constructor () { super('ChangementPC') }

  async run (na, p) {
    try {
      const session = stores.session
      const pck = p ? await crypter(session.clek, p.phrase) : null
      const napc = p ? await crypter(p.pcb, new Uint8Array(encode([na.nom, na.rnd]))) : null
      const hpc = p ? ((session.ns * d14) + p.hps1) : 0
      const args = { token: session.authToken, id: na.id, hpc, napc, pck }
      this.tr(await post(this, 'ChangementPC', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/** Récupération d\'un avatar par sa phrase de contact *******
args.token: éléments d'authentification du compte.
args.hpc: hash de la phrase de contact
Retour: idnapc : {id, napc}
- id : id de l'avatar ayant ce hash de phrase de contact (0 si aucun)
- napc : na de l'avatar ayant cette phrase de contact crypté par le PBKFD de cette phrase

Retour: idnapc: {id, napc}
- id : id de l'avatar ayant ce hash de phrase de contact (0 si aucun)
- napc : na de l'avatar ayant cette phrase de contact décrypté 
  par le PBKFD de cette phrase OU null si non décryptable
*/
export class GetAvatarPC extends OperationUI {
  constructor () { super('GetAvatarPC') }

  async run (p) { // p: objet Phrase
    try {
      const session = stores.session
      let res
      const hpc = (session.ns * d14) + p.hps1
      const args = { token: session.authToken, hpc }
      const ret = this.tr(await post(this, 'GetAvatarPC', args))
      if (ret.cvnapc) {
        try {
          const { cv, napc } = ret.cvnapc
          const x = decode(await decrypter(p.pcb, napc))
          const na = NomGenerique.from(x)
          res = { cv, na }
        } catch (e) {
          res = { }
        }
      } else {
        res = { }
      }
      return this.finOK(res)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/** Création d\'un sponsoring ****************************************************
POST:
- `token` : éléments d'authentification du comptable / compte sponsor de sa tribu.
- `rowSponsoring` : row Sponsoring, SANS la version (qui est calculée par le serveur).
- `credits`: nouveau credits du compte si non null
- `v`: version de compta si credits

Retour:
- KO: true - si régression de version de compta
*/
export class AjoutSponsoring extends OperationUI {
  constructor () { super('AjoutSponsoring') }

  async run (row, don) {
    try {
      const session = stores.session
      const aSt = stores.avatar
      while (await this.retry()) {
        const compta = aSt.compta
        const credits = don ? await aSt.compta.debitDon(don) : null
        const args = { token: session.authToken, rowSponsoring: row, credits, v: compta.v }
        const ret = this.tr(await post(this, 'AjoutSponsoring', args))
        if (!ret.KO) break
      }
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/** Chercher Sponsoring ****************************************************
args.token: éléments d'authentification du compte.
args.rowSponsoring : row Sponsoring, sans la version
Retour:
*/
export class ChercherSponsoring extends OperationUI {
  constructor () { super('ChercherSponsoring') }

  async run (org, hps1) {
    try {
      const ret = this.tr(await post(this, 'ChercherSponsoring', { org, hps1 }))
      return this.finOK(ret)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Mise en état "passif" d\'un chat
Nombre de chat - 1, items vidé
POST:
- `token` : éléments d'authentification du compte.
- `id ids` : id du chat

Assertions sur le row `Chats` et la `Versions` de l'avatar id.
*/
export class PassifChat extends OperationUI {
  constructor () { super('PassifChat') }

  async run (chat) {
    try {
      const session = stores.session
      const args = { 
        token: session.authToken, 
        idI: chat.naI.id, 
        idsI: await Chat.getIds(chat.naI, chat.naE),
        idE: chat.naE.id,
        idsE: await Chat.getIds(chat.naE, chat.naI)
      }
      const ret = this.tr(await post(this, 'PassifChat', args))
      const disp = ret.disp
      return this.finOK(disp)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Nouveau chat *********************************
args.token: éléments d'authentification du compte.
args.idI idsI : id du chat, côté interne
args.idE idsE : id du chat côté externe
args.ccKI : clé cc cryptée par la clé K du compte de I
args.ccPE ! clé cc cryptée par la clé publique de l'avatar E
args.contc : contenu du chat crypté par la clé cc
args.naccI: na de I crypté par la clé du chat
args.naccE: na de I crypté par la clé du chat
args.txt1: texte crypté par la clé cc
args.lgtxt1: lg du texte
Retour:
- `st` : 
  0 : E a disparu. rowChat absent
  1 : chat créé avec l'item txt1. rowChat a le chat I créé avec le texte txt1.
  2 : le chat était déjà créé: rowChat est le chat I SANS le texte txt1.
- `rowChat` : row du chat I.

*/
export class NouveauChat extends OperationUI {
  constructor () { super('NouveauChat') }

  async run (naI, naE, txt) {
    try {
      const session = stores.session
      const aSt =  stores.avatar

      const cc = random(32)
      const pubE = await aSt.getPub(naE.id)

      const args = { 
        token: session.authToken, 
        idI : naI.id,
        idsI : await Chat.getIds(naI, naE),
        idE : naE.id, 
        idsE : await Chat.getIds(naE, naI), 
        ccKI : await crypter(session.clek, cc), 
        ccPE : await crypterRSA(pubE, cc),
        naccI : await crypter(cc, encode([naI.nom, naI.rnd])),
        naccE : await crypter(cc, encode([naE.nom, naE.rnd])),
        txt1 : await Chat.getTxtCC(cc, txt),
        lgtxt1 : txt ? txt.length : 0
      }
      const ret = this.tr(await post(this, 'NouveauChat', args))
      let st = ret.st
      let chat
      if (st !== 0) {
        chat = await compile(ret.rowChat)
        if (st === 2) { // éxistait déjà
          if (chat.ccK) args.ccKI = chat.ccK
          delete args.ccPE
          delete args.naccI
          delete args.naccE
          args.txt1 = await Chat.getTxtCC(txt, chat.cc)
          const ret = this.tr(await post(this, 'MajChat', args))
          st = ret.st
          if (st !== 0) chat = await compile(ret.rowChat)
        }
        aSt.setChat(chat)
      }
      return this.finOK([st, chat])
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
export class MajChat extends OperationUI {
  constructor () { super('MajChat') }

  async run (naI, naE, txt, dh, chat, don) {
    try {
      const session = stores.session
      const aSt =  stores.avatar
      let ret
      while (await this.retry()) {
        const args = { 
          token: session.authToken, 
          idI: naI.id, 
          idsI: await Chat.getIds(naI, naE), 
          idE: naE.id, 
          idsE: await Chat.getIds(naE, naI), 
          ccKI: chat.ccK ? await crypter(session.clek, chat.cc) : null, 
          txt1: txt ? await Chat.getTxtCC(chat.cc, txt) : null,
          lgtxt1: txt ? txt.length : 0,
          dh: dh || 0
        }
        if (don) {
          const compta = aSt.compta
          args.credits = await compta.debitDon(don)
          const pubE = await aSt.getPub(args.idE)
          const ec = encode(don)
          args.crDon = await crypterRSA(pubE, ec)
          args.v = compta.v
        }
        ret = this.tr(await post(this, 'MajChat', args))
        if (!ret.KO) break
      }
      const disp = ret.disp
      const ch = await compile(ret.rowChat)
      aSt.setChat(ch)
      return this.finOK(disp)
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

Si st === 1:
- `quotas`: {qc, q2, q1}
- `trib`: { 
  idT: id courte du compte crypté par la clé de la tribu,
  idt: id de la tribu, 
  cletX: cle de la tribu cryptée par la clé K du comptable,
  cletK: cle de la tribu cryptée par la clé K du compte ou sa clé RSA.
}

Retour:
*/
export class MuterCompte extends OperationUI {
  constructor () { super('MuterCompte') }

  async run (id, st, chat, txt, quotas, trib) {
    try {
      const session = stores.session
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
        lgtxt1: txt.length
      }
      if (st === 1) args.quotas = quotas
      args.trib = trib
      
      this.tr(await post(this, 'MuterCompte', args))
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_RafraichirCvs: 'Rafraîchissement des cartes de visite' ***************************
args.token: éléments d'authentification du compte.
args.cibles : array de  { idE, vcv, lch: [[idI, idsI, idsE] ...], lmb: [[idg, im] ...] }
Retour: les chats et membres de la cible sont mis à jour
*/
export class RafraichirCvs extends OperationUI {
  constructor () { super('RafraichirCvs') }

  async run (id) { // id: 0-tous people, id d'avatar:chats de id, id de groupe: membres du groupe
    try {
      const session = stores.session
      const pSt = stores.people
      const aSt = stores.avatar
      const gSt = stores.groupe

      const toutes = [] // toutes les cibles
      if (!id) {
        pSt.peopleIds.forEach(idE => { 
          const exp = pSt.exportPourCv(idE)
          if (exp) toutes.push(exp)
        })
      } else if (ID.estAvatar(id)) {
        aSt.getChatIdEs(id).forEach(idE => { 
          const exp = pSt.exportPourCv(idE)
          if (exp) toutes.push(exp)
        })
      } else {
        gSt.getMembreIdEs(id).forEach(idE => { 
          const exp = pSt.exportPourCv(idE)
          if (exp) toutes.push(exp)
        })
      }
      const nt = toutes.length
      let next = 0
      let nr = 0
      while (next < toutes.length) {
        const cibles = []
        for (let i = 0; i < 10 && next < toutes.length; i++, next++) cibles.push(toutes[next])
        const args = { token: session.authToken, cibles }
        if (session.estFige) args.estFige = true
        const ret = this.tr(await post(this, 'RafraichirCvs', args))
        nr += ret.nbrech
      }

      return this.finOK([nt, nr], true)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*OP_NouvelAvatar: 'Création d\'un nouvel avatar du compte' **********************
args.token: éléments d'authentification du compte.
args.rowAvatar : row du nouvel avatar
args.rowVersion : row de le la version de l'avatar
args.kx args.vx: entrée dans mavk de compta pour le nouvel avatar
Retour:
*/
export class NouvelAvatar extends OperationUI {
  constructor () { super('NouvelAvatar') }

  async run (nom) {
    try {
      const session = stores.session

      const na = NomGenerique.avatar(nom)

      const { publicKey, privateKey } = await genKeyPair()

      const rowAvatar = await Avatar.primaireRow(na, publicKey, privateKey)

      const rowVersion = {
        id: na.id,
        v: 1,
        dlv: AMJ.amjUtcPlusNbj(AMJ.amjUtc(), limitesjour.dlv)
      }
      const _data_ = new Uint8Array(encode(rowVersion))
      rowVersion._data_ = _data_
      rowVersion._nom = 'versions'

      const kx = await Avatar.mavkK(na.id)
      const vx = await Avatar.mavkKV(na)
      if (session.fsSync) await session.fsSync.setAvatar(na.id)
      const args = { token: session.authToken, rowAvatar, 
        rowVersion, kx, vx, abPlus: [na.id] }
      this.tr(await post(this, 'NouvelAvatar', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_NouvelleTribu: 'Création d\'une nouvelle tranche de quotas' *******
args.token: éléments d'authentification du compte.
args.rowTribu : row de la nouvelle tribu
args.idc: id du comptable
args atrItem : item à insérer dans Compta en dernière position
Retour:
- OK : false si l'index dans rowTribu.id (poids faible) n'est pas égal à la longueur
de Compta.atr (conflit d'attribution)
*/
export class NouvelleTribu extends OperationUI {
  constructor () { super('NouvelleTribu') }

  async run (info, q) { // q: [qc, q1, q2]
    try {
      const session = stores.session
      const aSt = stores.avatar
      let ret
      while (await this.retry()) {
        const idx = aSt.compta.atr.length

        const clet = Tribu.genCle(idx) // enregistre la clé
        const idt = Tribu.id(clet)
        setClet(clet, idt)
        const rowTribu = await Tribu.nouvelle(idt, q)

        const atrItem = await Compta.atrItem(clet, info, q)
        const args = { token: session.authToken, rowTribu, atrItem }
        ret = this.tr(await post(this, 'NouvelleTribu', args))
        if (!ret.KO) break
      }
      this.finOK(ret)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetNotifGg: 'Inscription d\'une notification générale' ***********************
args.token donne les éléments d'authentification du compte.
args.ns
args.notif
Retour:
*/
export class SetNotifG extends OperationUI {
  constructor () { super('SetNotifG') }

  async run (notifG, ns) {
    try {
      const session = stores.session
      const naComptable = NomGenerique.comptable()
      if (!notifG) notifG = new Notification({})
      else notifG.dh = Date.now()
      const notif = await crypter(naComptable.rnd, notifG.serial)
      const args = { token: session.authToken, ns, notif}
      const ret = this.tr(await post(this, 'SetNotifG', args))
      if (ret.rowEspace && session.estAdmin) {
        // PageAdmin : update liste espace
        const esp = await compile(ret.rowEspace)
        session.setEspace(esp, true)
      }
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetNotifT: 'Inscription / mise à jour de la notification d\'une tranche de quotas'
POST:
- `token` : éléments d'authentification du compte.
- `id` : id de la tribu
- `notif` : notification cryptée par la clé de la tribu.
- `stn`: statut de notif 0:simple 1 2 9:aucune notif

Assertion sur l'existence du row `Tribus` de la tribu.
*/
export class SetNotifT extends OperationUI {
  constructor () { super('SetNotifT') }

  async run (notifT, idt) {
    try {
      const session = stores.session
      if (!notifT) notifT = new Notification({})
      else notifT.dh = Date.now()
      const stn = notifT.stn
      const cle = getCle(idt)
      const notif = await crypter(cle, notifT.serial)
      const args = { token: session.authToken, id: idt, notif, stn }
      this.tr(await post(this, 'SetNotifT', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetNotifC: 'Inscription / mise à jour de la notification d\'un compte'
POST:
- `token` : éléments d'authentification du compte.
- `id` : id de la tribu
- `idc` : id du compte
- `notif` : notification du compte cryptée par la clé de la tribu
- `stn` : 0:simple 1:lecture 2:mi,imal, 9:aucune

Assertion sur l'existence du row `Tribus` de la tribu et `Comptas` du compte.
*/
export class SetNotifC extends OperationUI {
  constructor () { super('SetNotifC') }

  async run (notifC, idt, idc) { // id de la tribu, id du compte cible, notif
    try {
      const session = stores.session
      if (!notifC) notifC = new Notification({})
      else notifC.dh = Date.now()
      const stn = notifC.stn
      const cle = getCle(idt)
      const notif = await crypter(cle, notifC.serial)
      const args = { token: session.authToken, id: idt, idc, notif, stn }
      this.tr(await post(this, 'SetNotifC', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*   OP_SetAtrItemComptable: 'Mise à jour des quotas d\'une tranche de quotas'
args.token: éléments d'authentification du compte.
args.id : id de la tribu
args.idc: id du comptable
args.atrItem: élément de atr {clet, info, q1, q2} cryptés par sa clé K
args.quotas: [q1, q2] ]si changement des quotas, sinon null
Retour:
*/
export class SetAtrItemComptable extends OperationUI {
  constructor () { super('SetAtrItemComptable') }

  async run (id, info, quotas) {
    try {
      const session = stores.session
      const aSt = stores.avatar
      const c = aSt.compta
      const a = c.atr[ID.court(id)]
      const atrItem = await Compta.atrItem(a.clet, info ? info : a.info, quotas ? quotas : a.q)
      const args = { token: session.authToken, id, idc: c.id, atrItem, quotas}
      this.tr(await post(this, 'SetAtrItemComptable', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetSponsor: 'Changement pour un compte de son statut de sponsor de sa tranche de quotas'
args.token: éléments d'authentification du compte.
args.idt : id de la tribu
args.idc: id du compte
args.nasp: na du compte crypté par la cle de la tribu
args.estSp: true si sponsor
Retour:
*/
export class SetSponsor extends OperationUI {
  constructor () { super('SetSponsor') }

  async run (idt, na, estSp) { // na du compte, true/false sponsor
    try {
      const session = stores.session
      let nasp = null
      if (idt && estSp) {
        const cle = getCle(idt)
        nasp = await crypter(cle, new Uint8Array(encode(na.anr)))
      }
      const args = { token: session.authToken, idt, idc: na.id, nasp, estSp }
      this.tr(await post(this, 'SetSponsor', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetQuotas: 'Fixation des quotas dùn compte dans sa tranche de quotas'
args.token: éléments d'authentification du compte.
args.idt : id de la tribu
args.idc: id du compte
args.q1 args.q2 : quotas
Retour:
*/
export class SetQuotas extends OperationUI {
  constructor () { super('SetQuotas') }

  async run (id, idc, q) {
    try {
      const session = stores.session
      const args = { token: session.authToken, idt: id, idc, q }
      this.tr(await post(this, 'SetQuotas', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/*  OP_ChangerTribu: 'Transfert d\'un compte dans une autre tranche de quotas' ************
args.token: éléments d'authentification du compte.
args.id : id du compte qui change de tribu
args.idtAv : id de la tribu quittée
args.idtAp : id de la tribu intégrée
args.idT : id court du compte crypté par la clé de la nouvelle tribu.
args.nasp : si sponsor `[nom, cle]` crypté par la cle de la nouvelle tribu.
args.stn : statut de la notification 0, 1, 2
args.notif`: notification de niveau compte cryptée par la clé de la nouvelle tribu.

Sur Compta:
args.cletX : clé de la tribu cryptée par la clé K du comptable.
args.cletK : clé de la tribu cryptée par la clé K du compte : 
  si cette clé a une longueur de 256, elle est cryptée par la clé publique RSA du compte 
  (en cas de changement de tribu forcé par le comptable).
Retour:
- rowTribu (nouvelle)
*/
export class ChangerTribu extends OperationUI {
  constructor () { super('ChangerTribu') }

  async run (args) {
    try {
      const session = stores.session
      args.token = session.authToken
      const ret = this.tr(await post(this, 'ChangerTribu', args))
      const t = await compile(ret.rowTribu)
      return this.finOK(t)
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
export class SetDhvuCompta extends OperationUI {
  constructor () { super('OPdhvu') }

  async run () {
    try {
      const session = stores.session
      const dhvu = await crypter(session.clek, '' + (Date.now()))
      const args = { token: session.authToken, dhvu }
      this.tr(await post(this, 'SetDhvuCompta', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetCompteursCompta: 'Obtention des compteurs d\'abonnement / consomation d\'un compte'
(autre que celle du compte de la session)
Pour le comptable (tous comptes), un sponsor (comptes de sa tribu)
args.token: éléments d'authentification du compte.
args.id : id de la compta
Retour:
- compteurs : objet compteurs de cette compta
- cletX: clé de sa tribu cryptée par la clé K du comptable
- it : indice du compte dans sa tribu
*/
export class GetCompteursCompta extends OperationUI {
  constructor () { super('GetCompteursCompta') }

  async run (id) { // id d'un compte
    try {
      const session = stores.session
      const aSt = stores.avatar
      const args = { token: session.authToken, id }
      const ret = this.tr(await post(this, 'GetCompteursCompta', args))
      const cpt = new Compteurs(ret.compteurs)
      cpt.it = ret.it
      cpt.clet = !session.estComptable ? null : await decrypter(session.clek, ret.cletX)
      if (!cpt.clet) {
        const [t, i, e] = aSt.getTribuDeCompte(id)
        if (t) cpt.clet = t.clet
      }
      cpt.id = id
      cpt.sp = ret.sp
      aSt.setccCpt(cpt)
      return this.finOK(cpt)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_GetTribu: 'Obtention d\'une tranche de quotas' ************
args.token: éléments d'authentification du compte.
args.id : id de la tribu
args.setC: déclarer la tribu courante
Retour:
- rowtribu: row de la tribu
*/
export class GetTribu extends OperationUI {
  constructor () { super('GetTribu') }

  async run (id, setC) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, setC: setC || false}
      const ret = this.tr(await post(this, 'GetTribu', args))
      const tribu = await compile(ret.rowTribu)
      return this.finOK(tribu)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_SetEspaceT: 'Attribution d\'un profil à l\'espace' ******************
args.token donne les éléments d'authentification du compte.
args.ns
args.t
Retour:
*/
export class SetEspaceT extends OperationUI {
  constructor () { super('SetEspaceT') }

  async run (ns, t) {
    try {
      const session = stores.session
      const args = { token: session.authToken, ns, t}
      const ret = this.tr(await post(this, 'SetEspaceT', args))
      if (ret.rowEspace && !session.ns) {
        // PageAdmin : update liste espace
        const esp = await compile(ret.rowEspace)
        session.setEspace(esp, true)
      }
      this.finOK()
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
export class NouveauGroupe extends OperationUI {
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

/* Changement des mots clés d'un groupe ******************************************
args.token donne les éléments d'authentification du compte.
args.mcg : map des mots clés cryptée par la clé du groupe
args.idg : id du groupe
Retour:
*/
export class MotsclesGroupe extends OperationUI {
  constructor () { super('MotsclesGroupe') }

  async run (mmc, nag) {
    try {
      const session = stores.session
      const mcg = await crypter(nag.rnd, new Uint8Array(encode(mmc)))
      const args = { token: session.authToken, mcg, idg: nag.id }
      this.tr(await post(this, 'MotsclesGroupe', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
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
export class InvitationFiche extends OperationUI {
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
export class HebGroupe extends OperationUI {
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
export class NouveauMembre extends OperationUI {
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
export class MajDroitsMembre extends OperationUI {
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
export class OublierMembre extends OperationUI {
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
export class ModeSimple extends OperationUI {
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
export class ItemChatgr extends OperationUI {
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
export class InvitationGroupe extends OperationUI {
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
export class AcceptInvitation extends OperationUI {
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
export class NouvelleNote extends OperationUI {
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
export class NoteOpx extends OperationUI {
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
export class MajNote extends OperationUI {
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
export class ExcluNote extends OperationUI {
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
export class McNote extends OperationUI {
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
export class RattNote extends OperationUI {
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

/* OP_ChargerCvs: 'Chargement des cartes de visite plus récentes que celles détenues en session'
args.token: éléments d'authentification du compte.
args.mcv : cle: id, valeur: version détenue en session (ou 0)
Retour:
rowCvs: liste des row Cv { _nom: 'cvs', id, _data_ }
  _data_ : cva {v, photo, info} cryptée par la clé de son avatar
*/
export class ChargerCvs extends OperationUI {
  constructor () { super('ChargerCvs') }

  async run (id) {
    try {
      const session = stores.session
      const pSt = stores.people
      const mcv = { }
      mcv[id] = 0
      const args = { token: session.authToken, id, mcv }
      const ret = this.tr(await post(this, 'ChargerCvs', args))
      let cv = null
      if (ret.rowCvs && ret.rowCvs.length > 0) {
        cv = await compile(ret.rowCvs[0])
        if (cv && cv.cv) pSt.setCv(getNg(id), cv.cv)
      }
      return this.finOK(cv ? cv.cv : null)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_NouveauFichier: 'Enregistrement d\'un nouveau fichier attaché à une note'
*/
export class NouveauFichier extends OperationUI {
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
args.idc : id du compte demandeur
args.vt : volume du fichier (pour compta des volumes v2 transférés)
*/

export class DownloadFichier extends OperationUI {
  constructor () { super('DownloadFichier') }

  async run (note, idf) { 
    try {
      const session = stores.session
      const vt = note.mfa.get(idf).lg
      const idc = session.compteId
      const args = { token: session.authToken, id: note.id, idf, idc, vt }
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

/* OP_SupprFichier: 'Suppression d\'un fichier attaché à une note'
args.id, ids : de la note
args.idh : id de l'hébergeur pour une note groupe
args.idf : identifiant du fichier à supprimer
args.aut: im de l'auteur (pour une note de groupe)
Retour: aucun
*/
export class SupprFichier extends OperationUI {
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
export class SupprAvatar extends OperationUI {
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
export class GC extends OperationUI {
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

/* OP_GetCheckpoint: 'Obtention du rapport d\'exécution du dernier traitement de nettoyage quotidien'
*/
export class GetCheckpoint extends OperationUI {
  constructor () { super('GetCheckpoint') }

  async run () { 
    try {
      const ret = this.tr(await post(this, 'GetCheckpoint', {}))
      return this.finOK(ret.checkpoint)
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
export class GetSynthese extends OperationUI {
  constructor () { super('GetSynthese') }

  async run (ns) { 
    try {
      const aSt = stores.avatar
      const session = stores.session
      const args = { token: session.authToken, ns }
      const ret = this.tr(await post(this, 'GetSynthese', args))
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
export class ForceDlv extends OperationUI {
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
export class SetEspaceOptionA extends OperationUI {
  constructor () { super('SetEspaceOptionA') }

  async run (optionA) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ns: session.ns, optionA }
      this.tr(await post(this, 'SetEspaceOptionA', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_PlusTicket: 'Génération d\'un ticket de crédit'
et ajout du ticket au Comptable
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- `credits` : credits crypté par la clé K du compte
- `rowTicket` : nouveau row tickets pour le Comptable

Retour: rien
*/
export class PlusTicket extends OperationUI {
  constructor () { super('PlusTicket') }

  async run (ma, refa, ids) { 
    try {
      const session = stores.session
      const aSt = stores.avatar

      while (await this.retry()) {
        const compta = aSt.compta
        const { rowTicket, ticket } = Ticket.nouveauRow(ids, ma, refa)
        const credits = await compta.creditsSetTk(ticket)

        const args = { token: session.authToken, rowTicket, credits, v: compta.v }
        const ret = this.tr(await post(this, 'PlusTicket', args))
        if (!ret.KO) break
      }
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_MoinsTicket: 'Suppression d\'un ticket de crédit'
et retrait (zombi) du ticket du Comptable
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- `credits` : credits crypté par la clé K du compte
- `ids` : ticket à enlever

Retour: rien
*/
export class MoinsTicket extends OperationUI {
  constructor () { super('MoinsTicket') }

  async run (ids) { 
    try {
      const session = stores.session
      const aSt = stores.avatar

      while (await this.retry()) {
        const compta = aSt.compta
        const credits = await compta.creditsUnsetTk(ids)

        const args = { token: session.authToken, credits, ids }
        const ret = this.tr(await post(this, 'MoinsTicket', args))
        if (!ret.KO) break
      }
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_RafraichirTickets: 'Obtention des nouveaux tickets réceptionnés par le Comptable'
et incorporation au solde le cas échéant
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- `mtk` : map des tickets. clé: ids, valeur: version détenue en session

Retour: 
- rowTickets: liste des rows des tickets ayant changé
*/
/* `MajCredits` : mise a jour du crédits d'un compte A
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- `credits` : credits crypté par la clé K du compte
- `dhdons`: array des dh des dons incorporés

Retour: rien
*/
export class RafraichirTickets extends OperationUI {
  constructor () { super('RafraichirTickets') }

  async run () { 
    try {
      const session = stores.session
      const aSt = stores.avatar
      let nb = 0

      while (await this.retry()) {
        const compta = aSt.compta
        const mtk = compta.mtk
        const args1 = { token: session.authToken, mtk }
        const ret1 = this.tr(await post(this, 'RafraichirTickets', args1))
        nb = 0
        let m = null
        if (ret1.rowTickets) {
          nb = ret1.rowTickets.length
          m = new Map()
          for(const row of ret1.rowTickets) 
            m.set(row.ids, await compile(row))
        }
        const credits = await compta.majCredits(m)
        if (!credits) break
        const args2 = { token: session.authToken, credits, v: compta.v }
        const ret2 = this.tr(await post(this, 'MajCredits', args2))
        if (!ret2.KO) break
      }
      return this.finOK(nb)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_RafraichirDons: 'Recalcul du solde du compte après réception de nouveaux dons'
et n'ont pas encore été intégrés (compta.dons !== null)
*/
export class RafraichirDons extends OperationUI {
  constructor () { super('RafraichirDons') }

  async run () { 
    try {
      const session = stores.session
      const aSt = stores.avatar
      while (await this.retry()) {
        const compta = aSt.compta
        if (!compta.dons) break
        const credits = await compta.majCredits()
        if (!credits) break
        const args2 = { token: session.authToken, credits, v: compta.v }
        const ret2 = this.tr(await post(this, 'MajCredits', args2))
        if (!ret2.KO) break
      }
      return this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_EstAutonome: 'Vérification que le bénéficiaire envisagé d\'un don est bien un compte autonome'
indique si l'avatar donné en argument est 
l'avatar principal d'un compte autonome
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- `id` : id de l'avatar

Retour: 
- `estA`: true si avatar principal d'un compte autonome
*/
export class EstAutonome extends OperationUI {
  constructor () { super('EstAutonome') }

  async run (id) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, id }
      const ret = this.tr(await post(this, 'EstAutonome', args))
      return this.finOK(ret.st)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* OP_ReceptionTicket: 'Réception d\'un ticket par le Comptable'
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- `ids` : du ticket
- `mc` : montant reçu
- `refc` : référence du Comptable

Retour: rien
*/
export class ReceptionTicket extends OperationUI {
  constructor () { super('ReceptionTicket') }

  async run (ids, mc, refc) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ids, mc, refc }
      this.tr(await post(this, 'ReceptionTicket', args))
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
export class TestRSA extends OperationUI {
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
export class CrypterRaw extends OperationUI {
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
