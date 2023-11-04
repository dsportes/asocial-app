import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'

import { ID, AppExc, appexc, E_WS, AMJ, Compteurs, limitesjour } from './api.mjs'
import { $t, hash, inverse, sleep} from './util.mjs'
import { crypter } from './webcrypto.mjs'
import { post, putData, getData } from './net.mjs'
import { NomGenerique, Avatar, Chat, Compta, Note, Ticket,
  Groupe, Membre, Tribu, getNg, getCle, compile, setClet} from './modele.mjs'
import { decrypter, crypterRSA, genKeyPair, random } from './webcrypto.mjs'
import { commitRows, IDBbuffer } from './db.mjs'

/* Opération générique ******************************************/
export class Operation {
  constructor (nomop) { this.nom = nomop }

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
      return exc
    }
  }
}

/* Abonnement / désabonnement de la tribu courante ************************
args.token: éléments d'authentification du compte.
args.id : id de la tribu - Si 0 désabonnement
Retour:
- rowtribu: row de la tribu
*/
export class AboTribuC extends OperationUI {
  constructor () { super($t('OPabo')) }

  async run (idt) {
    try {
      const session = stores.session
      const args = { token: session.authToken, idt }
      this.tr(await post(this, 'AboTribuC', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Changement du memo d'un compte ******************************************
*/
export class MemoCompte extends OperationUI {
  constructor () { super($t('OPmemo')) }

  async run (memok) {
    try {
      const session = stores.session
      const args = { token: session.authToken, memok }
      this.tr(await post(this, 'MemoCompte', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Recherche hash de phrase ******
args.ids : hash de la phrase de contact / de connexion
args.t :
  - 1 : phrase de connexion(hps1 de compta)
  - 2 : phrase de sponsoring (ids)
  - 3 : phrase de contact (hpc d'avatar)
Retour:
- existe : true si le hash de la phrase existe
*/
export class ExistePhrase extends OperationUI {
  constructor () { super($t('OPphex')) }

  async run (hash, t) {
    try {
      const session = stores.session
      const args = { token: session.authToken, ids: hash, t }
      const ret = this.tr(await post(this, 'ExistePhrase', args))
      const ex = ret.existe || false
      return this.finOK(ex)
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Changement des mots clés d'un compte ******************************************
*/
export class MotsclesCompte extends OperationUI {
  constructor () { super($t('OPmotscles')) }

  async run (mck) {
    try {
      const session = stores.session
      const args = { token: session.authToken, mck }
      this.tr(await post(this, 'MotsclesCompte', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Maj de la carte de visite d'un avatar ******************************************
args.token
args.id : id de l'avatar dont la Cv est mise à jour
args.v: version de l'avatar incluse dans la Cv. Si elle a changé sur le serveur, retour OK false (boucle sur la requête)
args.cva: {v, photo, info} crypté par la clé de l'avatar
Retour:
- KO : true s'il faut boucler sur la requête. 
La version de l'avatar figure DANS cva, qu'il faut 
recrypter si ce n'était pas la bonne.
*/
export class MajCv extends OperationUI {
  constructor () { super($t('OPmcv')) }

  async run (avatar, photo, info) {
    try {
      const session = stores.session
      const aSt = stores.avatar
      while (true) {
        const v = avatar.v + 1
        const cva = await crypter(getCle(avatar.id), new Uint8Array(encode({v, photo, info})))
        const args = { token: session.authToken, id: avatar.id, v, cva }
        const ret = this.tr(await post(this, 'MajCv', args))
        if (!ret.KO) break
        await sleep(500)
      }
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Maj de la carte de visite d'un groupe ******************************************
args.token: éléments d'authentification du compte.
args.id : id du groupe dont la Cv est mise à jour
args.v: version du groupe incluse dans la Cv. Si elle a changé sur le serveur, retour OK false (boucle sur la requête)
args.cvg: {v, photo, info} crypté par la clé du groupe
*/
export class MajCvGr extends OperationUI {
  constructor () { super($t('OPmcv')) }

  async run (groupe, photo, info) {
    try {
      const session = stores.session
      while (true) {
        const v = groupe.v + 1
        const cvg = await crypter(getCle(groupe.id), new Uint8Array(encode({v, photo, info})))
        const args = { token: session.authToken, id: avatar.id, v, cvg }
        const ret = this.tr(await post(this, 'MajCvGr', args))
        if (!ret.KO) break
        await sleep(500)
      }
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}


/** Changement de phrase secrete ****************************************************
args.token: éléments d'authentification du compte.
args.hps1: dans compta, `hps1` : hash du PBKFD de la ligne 1 de la phrase secrète du compte.
args.shay: SHA du SHA de X (PBKFD de la phrase secrète).
args.kx: clé K cryptée par la phrase secrète
*/
export class ChangementPS extends OperationUI {
  constructor () { super($t('OPcps')) }

  async run (ps) {
    try {
      const session = stores.session
      const kx = await crypter(ps.pcb, session.clek)
      const args = { token: session.authToken, hps1: ps.hps1, shay: ps.shay, kx }
      this.tr(await post(this, 'ChangementPS', args))
      session.chgps(ps)
      if (session.synchro) commitRows(new IDBbuffer(), true)
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/** Changement de phrase sz contact ****************************************************
args.token: éléments d'authentification du compte.
args.id: de l'avatar
args.hpc: hash de la phrase de contact (SUPPRESSION si null)
args.napc: na de l'avatar crypté par le PBKFD de la phrase
args.pck: phrase de contact cryptée par la clé K du compte
*/
export class ChangementPC extends OperationUI {
  constructor () { super($t('OPcpc')) }

  async run (na, p) {
    try {
      const session = stores.session
      const pck = p ? await crypter(session.clek, p.phrase) : null
      const napc = p ? await crypter(p.clex, new Uint8Array(encode([na.nom, na.rnd]))) : null
      const args = { token: session.authToken, id: na.id, hpc: p ? p.phch : null, napc, pck }
      this.tr(await post(this, 'ChangementPC', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/** Récupération de l'avatar ayant une phrase de contact donnée *******
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
  constructor () { super($t('OPcpc')) }

  async run (p) { // p: objet Phrase
    try {
      const session = stores.session
      let res
      const args = { token: session.authToken, hpc: p.phch }
      const ret = this.tr(await post(this, 'GetAvatarPC', args))
      if (ret.cvnapc) {
        try {
          const { cv, napc } = ret.cvnapc
          const x = decode(await decrypter(p.clex, napc))
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
      return await this.finKO(e)
    }
  }
}

/** Ajout Sponsoring ****************************************************
args.token: éléments d'authentification du compte.
args.rowSponsoring : row Sponsoring, sans la version
Retour:
*/
export class AjoutSponsoring extends OperationUI {
  constructor () { super($t('OPcsp')) }

  async run (row) {
    try {
      const session = stores.session
      const args = { token: session.authToken, rowSponsoring: row }
      this.tr(await post(this, 'AjoutSponsoring', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/** Chercher Sponsoring ****************************************************
args.token: éléments d'authentification du compte.
args.rowSponsoring : row Sponsoring, sans la version
Retour:
*/
export class ChercherSponsoring extends OperationUI {
  constructor () { super($t('OPcsp')) }

  async run (ids) {
    try {
      const ret = this.tr(await post(this, 'ChercherSponsoring', { ids }))
      this.finOK()
      return ret
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* `PassifChat` : rend le chat passif, nombre de chat - 1, items vidé
POST:
- `token` : éléments d'authentification du compte.
- `id ids` : id du chat

Assertions sur le row `Chats` et la `Versions` de l'avatar id.
*/export class PassifChat extends OperationUI {
  constructor () { super($t('OPpassifch')) }

  async run (id, ids) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, ids }
      const ret = this.tr(await post(this, 'PassifChat', args))
      this.finOK()
      return ret
    } catch (e) {
      return await this.finKO(e)
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
Retour:
st: 
  0 : E a disparu
  1 : chat créé avec le contenu contc
  2 : le chat était déjà créé, retour de chatI avec le contenu qui existait
rowChat: chat I créé (sauf st = 0)
*/
export class NouveauChat extends OperationUI {
  constructor () { super($t('OPnvch')) }

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
        txt1 : await Chat.getTxtCC(txt, cc),
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
      return await this.finKO(e)
    }
  }
}

/* `MajChat` : mise à jour d'un Chat
POST:
- `token` : éléments d'authentification du compte.
- `idI idsI` : id du chat, côté _interne_.
- `idE idsE` : id du chat, côté _externe_.
- `ccKI` : clé cc du chat cryptée par la clé K du compte de I. _Seulement_ si en session la clé cc était cryptée par la clé publique de I.
- `txt1` : texte à ajouter crypté par la clé cc du chat.
- `lgtxt1` : longueur du texte
- `dh` : date-heure du chat dont le texte est à annuler.
Retour:
- `st` :
  0 : E a disparu, chat zombi.
  1 : chat mis à jour.
- `rowChat` : row du chat I.

Assertions sur l'existence du row `Avatars` de l'avatar I, sa `Versions`, et le cas échéant la `Versions` de l'avatar E (quand il existe).
*/
export class MajChat extends OperationUI {
  constructor () { super($t('OPmajch')) }

  async run (naI, naE, txt, dh, chat) {
    try {
      const session = stores.session
      const aSt =  stores.avatar

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
      const ret = this.tr(await post(this, 'MajChat', args))
      const st = ret.st
      const ch = await compile(ret.rowChat)
      aSt.setChat(ch)
      return this.finOK([st, ch])
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Rafraîchir les CV, quand nécessaire *********************************
args.token: éléments d'authentification du compte.
args.cibles : array de  { idE, vcv, lch: [[idI, idsI, idsE] ...], lmb: [[idg, im] ...] }
Retour: les chats et membres de la cible sont mis à jour
*/
export class RafraichirCvs extends OperationUI {
  constructor () { super($t('OPccv')) }

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
      return await this.finKO(e)
    }
  }
}

/* Nouvel avatar *********************************
args.token: éléments d'authentification du compte.
args.rowAvatar : row du nouvel avatar
args.rowVersion : row de le la version de l'avatar
args.kx args.vx: entrée dans mavk de compta pour le nouvel avatar
Retour:
*/
export class NouvelAvatar extends OperationUI {
  constructor () { super($t('OPmajtch')) }

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

      const kx = await Avatar.mavkK(na.id, session.clek)
      const vx = await Avatar.mavkKV(na, session.clek)
      if (session.fsSync) await session.fsSync.setAvatar(na.id)
      const args = { token: session.authToken, rowAvatar, 
        rowVersion, kx, vx, abPlus: [na.id] }
      this.tr(await post(this, 'NouvelAvatar', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Nouvelle tribu *********************************
args.token: éléments d'authentification du compte.
args.rowTribu : row de la nouvelle tribu
args.idc: id du comptable
args atrItem : item à insérer dans Compta en dernière position
Retour:
- OK : false si l'index dans rowTribu.id (poids faible) n'est pas égal à la longueur
de Compta.atr (conflit d'attribution)
*/
export class NouvelleTribu extends OperationUI {
  constructor () { super($t('OPnvtr')) }

  async run (info, q) { // q: [qc, q1, q2]
    try {
      const session = stores.session
      const aSt = stores.avatar
      let ret
      while (true) {
        const idx = aSt.compta.atr.length

        const clet = Tribu.genCle(idx) // enregistre la clé
        const idt = Tribu.id(clet)
        setClet(clet, idt)
        const rowTribu = await Tribu.nouvelle(idt, q)

        const atrItem = await Compta.atrItem(clet, info, q)
        const args = { token: session.authToken, rowTribu, atrItem }
        ret = this.tr(await post(this, 'NouvelleTribu', args))
        if (!ret.KO) break
        await sleep(2000)
      }
      this.finOK(ret)
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* `SetNotifT` : notification de la tribu
POST:
- `token` : éléments d'authentification du compte.
- `id` : id de la tribu
- `notif` : notification cryptée par la clé de la tribu.
- `stn`: statut de notif 0:simple 1 2 9:aucune notif

Assertion sur l'existence du row `Tribus` de la tribu.
*/
export class SetNotifT extends OperationUI {
  constructor () { super($t('OPntftr')) }

  async run (id, notifT) {
    try {
      const session = stores.session
      let notif = null
      if (notifT ) {
        notifT.dh = Date.now()
        const cle = getCle(id)
        notif = await crypter(cle, notifT.serial)
      }
      let stn = 9
      if (notifT.texte) {
        if (notifT.nr === 0) stn = 0
        else if (notifT.nr === 3) stn = 1
        else stn = 4
      }
      const args = { token: session.authToken, id, notif, stn }
      this.tr(await post(this, 'SetNotifT', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* SetAtrItemComptable : Set des quotas OU de l'info d'une tribu
args.token: éléments d'authentification du compte.
args.id : id de la tribu
args.idc: id du comptable
args.atrItem: élément de atr {clet, info, q1, q2} cryptés par sa clé K
args.quotas: [q1, q2] ]si changement des quotas, sinon null
Retour:
*/
export class SetAtrItemComptable extends OperationUI {
  constructor () { super($t('OPqtr')) }

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
      return await this.finKO(e)
    }
  }
}

/* `SetNotifC` : notification d'un compte d'une tribu
POST:
- `token` : éléments d'authentification du compte.
- `id` : id de la tribu
- `idc` : id du compte
- `notif` : notification du compte cryptée par la clé de la tribu
- `stn` : 0:simple 1:lecture 2:mi,imal, 9:aucune

Assertion sur l'existence du row `Tribus` de la tribu et `Comptas` du compte.
*/
export class SetNotifC extends OperationUI {
  constructor () { super($t('OPntfco')) }

  async run (id, idc, notifC) { // id de la tribu, id du compte cible, notif
    try {
      const session = stores.session
      if (notifC) notifC.dh = Date.now()
      const cle = getCle(id)
      let stn = 9
      if (notifC.texte) {
        if (notifC.nr === 0) stn = 0
        else if (notifC.nr === 3) stn = 1
        else stn = 4
      }
      const notif = notifC ? await crypter(cle, notifC.serial) : null
      const args = { token: session.authToken, id, idc, notif, stn }
      this.tr(await post(this, 'SetNotifC', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Set sponsor dans tribu / compte
args.token: éléments d'authentification du compte.
args.idt : id de la tribu
args.idc: id du compte
args.nasp: na du compte crypté par la cle de la tribu
Retour:
*/
export class SetSponsor extends OperationUI {
  constructor () { super($t('OPmajtr')) }

  async run (idt, na, estSp) { // id de la tribu, na du compte, true/false sponsor
    try {
      const session = stores.session
      const cle = getCle(idt)
      const nasp = estSp ? await crypter(cle, new Uint8Array(encode(na.anr))) : null
      const args = { token: session.authToken, idt, idc: na.id, nasp }
      this.tr(await post(this, 'SetSponsor', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Set des quotas dans tribu / compte
args.token: éléments d'authentification du compte.
args.idt : id de la tribu
args.idc: id du compte
args.q1 args.q2 : quotas
Retour:
*/
export class SetQuotas extends OperationUI {
  constructor () { super($t('OPmajtr')) }

  async run (id, idc, q) {
    try {
      const session = stores.session
      const args = { token: session.authToken, idt: id, idc, q }
      this.tr(await post(this, 'SetQuotas', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Changer un compte de tribu *********************************
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
  constructor () { super($t('OPchtr')) }

  async run (args) {
    try {
      const session = stores.session
      args.token = session.authToken
      const ret = this.tr(await post(this, 'ChangerTribu', args))
      const t = await compile(ret.rowTribu)
      return this.finOK(t)
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Set du dhvu d'une compta *********************************
args.token: éléments d'authentification du compte.
args.dhvu : dhvu cryptée par la clé K
Retour:
*/
export class SetDhvuCompta extends OperationUI {
  constructor () { super($t('OPdhvu')) }

  async run () {
    try {
      const session = stores.session
      const dhvu = await crypter(session.clek, '' + (Date.now()))
      const args = { token: session.authToken, dhvu }
      this.tr(await post(this, 'SetDhvuCompta', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Résumé d'une compta (autre que celle du compte de la session)
Pour le comptable (tous comptes), un sponsor (comptes de sa tribu)
args.token: éléments d'authentification du compte.
args.id : id de la compta
Retour:
- compteurs : objet compteurs de cette compta
- cletX: clé de sa tribu cryptée par la clé K du comptable
- it : indice du compte dans sa tribu
*/
export class GetCompteursCompta extends OperationUI {
  constructor () { super($t('OPdhvu')) }

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
      return await this.finKO(e)
    }
  }
}

/* Get Tribu *********************************
args.token: éléments d'authentification du compte.
args.id : id de la tribu
args.setC: déclarer la tribu courante
Retour:
- rowtribu: row de la tribu
*/
export class GetTribu extends OperationUI {
  constructor () { super($t('OPtrib')) }

  async run (id, setC) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, setC: setC || false}
      const ret = this.tr(await post(this, 'GetTribu', args))
      const tribu = await compile(ret.rowTribu)
      return this.finOK(tribu)
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Set notification générale *****************************************************
args.token donne les éléments d'authentification du compte.
args.ns
args.notif
Retour:
*/
export class SetNotifG extends OperationUI {
  constructor () { super($t('OPntfg')) }

  async run (notifG, ns) {
    try {
      const session = stores.session
      const naComptable = NomGenerique.comptable()
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
      return await this.finKO(e)
    }
  }
}

/* Set t de l'espace par le Comptable ******************
args.token donne les éléments d'authentification du compte.
args.ns
args.t
Retour:
*/
export class SetEspaceT extends OperationUI {
  constructor () { super($t('OPprf')) }

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
      return await this.finKO(e)
    }
  }
}

/* Nouveau groupe *****************************************************
args.token donne les éléments d'authentification du compte.
args.rowGroupe : le groupe créé
args.rowMembre : le membre
args.id: id de l'avatar créateur
args.quotas : [q1, q2] attribué au groupe
args.kegr: clé dans lgrk. Hash du rnd inverse du groupe crypté par le rnd de l'avatar.
args.egr: élément de lgrk dans l'avatar créateur
Retour:
*/
export class NouveauGroupe extends OperationUI {
  constructor () { super($t('OPnvgr')) }

  async run (nom, unanime, quotas) { // quotas: [q1, q2]
    try {
      const session = stores.session
      const nag = NomGenerique.groupe(nom)
      const na = getNg(session.avatarId)
      const rowGroupe = await Groupe.rowNouveauGroupe(nag, na, unanime)
      
      const kegr = hash(await crypter(nag.rnd, inverse(na.rnd), 1))
      const egr = await crypter(session.clek, new Uint8Array(encode([nag.nom, nag.rnd, 1])))

      // En UTC la division d'une date est multiple de 86400000
      const tjourJ = (AMJ.tDeAmjUtc(this.auj) / 86400000) + limitesjour.dlv
      const tdlv = ((Math.floor(tjourJ / 10) + 1) * 10) + 10
      const dlv = AMJ.amjUtcDeT(tdlv * 86400000)

      const rowMembre = await Membre.rowNouveauMembre (nag, na, 1, dlv)

      const args = { token: session.authToken, rowGroupe, rowMembre, id: session.avatarId,
        quotas: [quotas.q1, quotas.q2], kegr, egr, abPlus: [nag.id]}
      this.tr(await post(this, 'NouveauGroupe', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
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
  constructor () { super($t('OPmotsclesgr')) }

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

/* Maj de l'ardoise du groupe *****************************************************
args.token donne les éléments d'authentification du compte.
args.ardg : texte de l'ardoise crypté par la clé du groupe
args.idg : id du groupe
Retour:
*/
export class ArdoiseGroupe extends OperationUI {
  constructor () { super($t('OPardgr')) }

  async run (ard, nag) {
    try {
      const session = stores.session
      const ardg = await crypter(nag.rnd, ard || '')
      const args = { token: session.authToken, ardg, idg: nag.id }
      this.tr(await post(this, 'ArdoiseGroupe', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Hébergement d'un groupe *****************************************************
args.token donne les éléments d'authentification du compte.
args.t : 1: chg quotas, 2: prise d'hébergement, 3: transfert d'hébergement
args.idd : (3) id du compte de départ en cas de transfert
args.ida : id du compte (d'arrivée en cas de prise / transfert)
args.idg : id du groupe
args.idhg : (2, 3) id du compte d'arrivée en cas de transfert CRYPTE par la clé du groupe
args.q1, q2 :
1-Cas changement de quotas :
- les volumes et quotas sur compta a sont inchangés
- sur la version du groupe, q1 et q2 sont mis à jour
2-Prise hébergement
- les volumes v1 et v2 sont pris sur le groupe
- les volumes (pas les quotas) sont augmentés sur compta a
- sur la version du groupe, q1 et q2 sont mis à jour
- sur le groupe, idhg est mis à jour
3-Cas de transfert :
- les volumes v1 et v2 sont pris sur le groupe
- les volumes (pas les quotas) sont diminués sur compta d
- les volumes (pas les quotas) sont augmentés sur compta a
- sur la version du groupe, q1 et q2 sont mis à jour
- sur le groupe, idhg est mis à jour
Retour:
*/
export class HebGroupe extends OperationUI {
  constructor () { super($t('OPhebgr')) }

  async run (t, nag, imh, idd, q1, q2) {
    try {
      const session = stores.session
      const args = { token: session.authToken, t, imh, q1, q2, idg: nag.id, ida: session.compteId }
      if (t > 1) { // prise et transfert heb
        args.idhg = await Groupe.toIdhg(nag.rnd)
        if (t === 2) args.idd = idd
      }
      this.tr(await post(this, 'HebGroupe', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Fin d'ébergement d'un groupe *****************************************************
args.token donne les éléments d'authentification du compte.
args.id : id du compte
args.idg : id du groupe
args.dfh : date de fin d'hébergement
Traitement :
- les volumes v1 et v2 sont pris sur le groupe
- les volumes (pas les quotas) sont diminués sur la compta du compte
- sur le groupe :
  - dfh : date du jour + N jours
  - idhg, imh : 0
Retour:
*/
export class FinHebGroupe extends OperationUI {
  constructor () { super($t('OPfhebgr')) }

  async run (idg) {
    try {
      const session = stores.session
      const cfg = stores.config
      const args = { token: session.authToken, 
        id: session.compteId,
        idg,
        dfh: AMJ.amjUtcPlusNbj(AMJ.amjUtc(), limitesjour.groupenonheb)
      }
      this.tr(await post(this, 'FinHebGroupe', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Nouveau membre (contact) *******************************************
args.token donne les éléments d'authentification du compte.
args.id : id du contact
args.idg : id du groupe
args.im: soit l'indice de l'avatar dans ast/nig s'il avait déjà participé, soit ast.length
args.nig: hash du rnd du membre crypté par le rnd du groupe. Permet de vérifier l'absence de doublons.
args.ardg: texte de l'ardoise du groupe crypté par la clé du groupe. 
  Si null, le texte actuel est inchangé.
args.rowMembre
- vérification que le statut ast n'existe pas
- insertion du row membre, maj groupe
Retour:
- KO : si l'indice im est déjà attribué (opérations concurrentes)
*/
export class NouveauMembre extends OperationUI {
  constructor () { super($t('OPnvmb')) }

  async run (na, gr, cv, ard) {
    try {
      const session = stores.session
      while (true) {
        const nig = hash(await crypter(gr.na.rnd, na.rnd, 1))
        let im = 0
        for(let i = 1; i < gr.ast.length; i++) { 
          if (gr.nag[im] === nig) { im = i; break }
        }
        if (!im) im = gr.ast.length

        const rowMembre = await Membre.rowNouveauMembre(gr.na, na, im, 0, cv)
        const args = { token: session.authToken, 
          id: na.id,
          idg: gr.id,
          ardg: ard === null ? null : await crypter(gr.na.rnd, ard),
          nig, im, rowMembre
        }
        const ret = this.tr(await post(this, 'NouveauMembre', args))
        if (!ret.KO) break
        await sleep(500)
      }
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Maj du commentaire d'un membre *******************************************
args.token donne les éléments d'authentification du compte.
args.id : id du groupe
args.ids : ids du groupe
args.infok
Retour:
*/
export class MajInfoMembre extends OperationUI {
  constructor () { super($t('OPinfmb')) }

  async run (id, ids, info) {
    try {
      const session = stores.session
      const args = { token: session.authToken, 
        id,
        ids,
        infok: await crypter(session.clek, info)
      }
      this.tr(await post(this, 'MajInfoMembre', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Maj des mots clés d'un membre *******************************************
args.token donne les éléments d'authentification du compte.
args.id : id du groupe
args.ids : ids du groupe
args.mc
Retour:
*/
export class MajMCMembre extends OperationUI {
  constructor () { super($t('OPmcmb')) }

  async run (id, ids, mc) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, ids, mc }
      this.tr(await post(this, 'MajMCMembre', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Mode simple / unanime d'un groupe *******************************************
args.token donne les éléments d'authentification du compte.
args.id : id du groupe
args.ids : ids du membre demandant le retour au mode simple.
  Si 0, mode unanime.
Retour:
*/
export class ModeSimple extends OperationUI {
  constructor () { super($t('OPmcmb')) }

  async run (id, ids) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, ids }
      this.tr(await post(this, 'ModeSimple', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Changement de statut d'un membre d'un groupe
args.token donne les éléments d'authentification du compte.
args.id: id du groupe 
args.ids: ids du membre cible
args.ida: id de l'avatar du membre cible
args.idc: id du COMPTE de ida, en cas de fin d'hébergement par résiliation / oubli
args.ima: ids (imdice membre) du demandeur de l'opération
args.idh: id du compte hébergeur
args.kegr: clé du membre dans lgrk. Hash du rnd inverse de l'avatar crypté par le rnd du groupe.
args.egr: élément du groupe dans lgrk de l'avatar invité 
  (invitations seulement). Crypté par la clé RSA publique de l'avatar
args.laa: 0:lecteur, 1:auteur, 2:animateur
args.ardg: ardoise du membre cryptée par la clé du groupe.
args.dlv: pour les acceptations d'invitation
args.fn: fonction à appliquer
  0 - maj de l'ardoise seulement, rien d'autre ne change
  1 - invitation
  2 - modification d'invitation
  3 - acceptation d'invitation
  4 - refus d'invitation
  5 - modification du rôle laa (actif)
  6 - résiliation
  7 - oubli
Retour: code (d'anomalie)
1 - situation inchangée, c'était déjà l'état actuel
2 - changement de laa impossible, membre non actif
3 - refus d'invitation impossible, le membre n'est pas invité
4 - acceptation d'invitation impossible, le membre n'est pas invité
5 - modification d'invitation impossible, le membre n'est pas invité
7 - le membre est actif, invitation impossible
8 - le membre a disparu, opération impossible
*/
export class StatutMembre extends OperationUI {
  constructor () { super($t('OPstmb')) }

  /* 
  gr: groupe
  mb: membre
  fn: fonction à appliquer
  laa: lecteur, auteur, animateur
  ard: texte de l'ardoise, false s'il n'a pas changé, null s'il est effacé
  */
  async run (gr, mb, fn, laa, ard) {
    try {
      const session = stores.session
      const gSt = stores.groupe
      const aSt = stores.avatar
      const mbac = gSt.membreAcGc
      let egr = null // élément de lgrk dans l'avatar ida invité crypté par sa RSA

      const x = [gr.na.nom, gr.na.rnd, mb.ids]
      if (fn == 1) { // invitation
        const pubE = await aSt.getPub(mb.na.id)
        egr = await crypterRSA(pubE, new Uint8Array(encode(x)))
      } else if (fn === 3) { // acceptation
        egr = await crypter(session.clek, new Uint8Array(encode(x)))
      }
      const kegr = hash(await crypter(gr.na.rnd, inverse(mb.na.rnd), 1))
      const ardg = !ard ? null : await crypter(gr.na.rnd, ard)

      // En UTC la division d'une date est multiple de 86400000
      const tjourJ = (AMJ.tDeAmjUtc(session.dateJourConnx) / 86400000) + limitesjour.dlv
      const tdlv = ((Math.floor(tjourJ / 10) + 1) * 10) + 10
      const dlv = AMJ.amjUtcDeT(tdlv * 86400000) // pour acceptation d'invitation
      
      const args = { token: session.authToken, 
        id: gr.id, 
        ids: mb.ids,
        ida: mb.na.id,
        ima: mbac ? mbac.ids : 0,
        idh: gr.idh,
        egr, kegr, laa, ardg, dlv, fn
      }
      const ret = this.tr(await post(this, 'StatutMembre', args))
      return this.finOK(ret.code || 0)
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Nouvelle Note *************************************************
args.token: éléments d'authentification du compte.
args.rowNote : row de la note
args.idc: id du compte (note avatar) ou de l'hébergeur (note groupe)
Retour: rien
*/
export class NouvelleNote extends OperationUI {
  constructor () { super($t('OPcsc')) }

  /* 
  id: groupe ou avatar
  txt: texte de la note
  im: indice du membre auteur
  nbj: durée de vie si la note est temporaire, 0 pour une permanente
  p: true si la note est protégée en écriture
  exclu: pour un groupe true si im a demandé un e exclusivité d'auteur
  ref: référence de la note parent [rid, rids, rnom]
  idh: id du compte de l'auteur ou de l'hébergeur pour une note de groupe
  */
  async run (id, txt, im, nbj, p, exclu, ref, idc) {
    try {
      const session = stores.session

      const rowNote = await Note.toRowNouveau(id, txt, im, nbj, p, exclu, ref)
      const args = { token: session.authToken, rowNote : rowNote, idc }
      this.tr(await post(this, 'NouvelleNote', args))
      return this.finOK((rowNote.id + '/' + rowNote.ids))
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Supprimer la note ******
args.token: éléments d'authentification du compte.
args.id ids: identifiant de la note (dont celle du groupe pour un note de groupe)
args.idc : compta à qui imputer le volume
  - pour une note personelle, id du compte de l'avatar
  - pour une note de groupe : id du "compte" de l'hébergeur idhg du groupe
Retour:
*/
export class SupprNote extends OperationUI {
  constructor () { super($t('OPssc')) }

  async run (id, ids, idc) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, ids, idc }
      this.tr(await post(this, 'SupprNote', args))
      return this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Maj d'une note ******
args.token: éléments d'authentification du compte.
args.id ids: identifiant de la note (dont celle du groupe pour un note de groupe)
args.txts : nouveau texte encrypté
args.v1 : volume du texte de la note
args.prot : protégé en écriture
args.idc : compta à qui imputer le volume
  - pour une note personelle, id du compte de l'avatar
  - pour une note de groupe : id du "compte" de l'hébergeur idhg du groupe
Retour:
*/
export class MajNote extends OperationUI {
  constructor () { super($t('OPssc')) }

  async run (id, ids, im, auts, texte, prot, idc) {
    try {
      const session = stores.session
      const v1 = texte.length
      const cle = Note.clen(id)
      const txts = await Note.toRowTxt(cle, texte, im, auts)
      const args = { token: session.authToken, id, ids, txts, v1, prot, idc }
      this.tr(await post(this, 'MajNote', args))
      return this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Note temporaire / permanente *************************************************
args.token: éléments d'authentification du compte.
args.id ids: identifiant de la note
args.st : aaaammjj ou 99999999
Retour: rien
*/
export class TempNote extends OperationUI {
  constructor () { super($t('OPssc')) }

  async run (id, ids, nbj) {
    try {
      const session = stores.session
      const st = nbj !== 99999999 ? AMJ.amjUtcPlusNbj(session.dateJourConnx, nbj) : 99999999
      const args = { token: session.authToken, id, ids, st }
      this.tr(await post(this, 'TempNote', args))
      return this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Protéger une note contre l'écriture *************************************************
args.token: éléments d'authentification du compte.
args.id ids: identifiant de la note
args.p : 0 / 1
Retour: rien
*/
export class ProtNote extends OperationUI {
  constructor () { super($t('OPprot')) }

  async run (id, ids, p) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, ids, p }
      this.tr(await post(this, 'ProtNote', args))
      return this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Changer l'exclusivité d'écriture d'une note ***********************
args.token: éléments d'authentification du compte.
args.id ids: identifiant de la note
args.im : 0 / im
Retour: rien
*/
export class ExcluNote extends OperationUI {
  constructor () { super($t('OPexclu')) }

  async run (id, ids, im) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, ids, im }
      this.tr(await post(this, 'ExcluNote', args))
      return this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Changer les mots clés d'une note ***********************
args.token: éléments d'authentification du compte.
args.id ids: identifiant de la note
args.chg: Map de clé im et de value motsclés (Uint8Array)
Retour: rien
*/
export class McNote extends OperationUI {
  constructor () { super($t('OPmcn')) }

  async run (id, ids, chg) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, ids, chg }
      this.tr(await post(this, 'McNote', args))
      return this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Rattacher une note à une autre ou à une racine ***********************
args.token: éléments d'authentification du compte.
args.id ids: identifiant de la note
args.ref : [rid, rids, rnom] crypté par la clé de la note. Référence d'une autre note
Retour: rien
*/
export class RattNote extends OperationUI {
  constructor () { super($t('OPrattn')) }

  async run (id, ids, rid, rids, refn) {
    try {
      const session = stores.session
      const cle = ID.estGroupe(id) ? getCle(id) : session.clek
      const ref = rid === 0 ? null : await crypter(cle, new Uint8Array(encode([rid, rids, refn])))
      const args = { token: session.authToken, id, ids, ref }
      this.tr(await post(this, 'RattNote', args))
      return this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Charger les CVs dont les versions sont postérieures à celles détenues en session ******
args.token: éléments d'authentification du compte.
args.mcv : cle: id, valeur: version détenue en session (ou 0)
Retour:
rowCvs: liste des row Cv { _nom: 'cvs', id, _data_ }
  _data_ : cva {v, photo, info} cryptée par la clé de son avatar
*/
export class ChargerCvs extends OperationUI {
  constructor () { super($t('OPgetcv')) }

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
      return await this.finKO(e)
    }
  }
}

export class NouveauFichier extends OperationUI {
  constructor () { super($t('OPnvf')) }

  async run (note, fic, lidf, dv2) {
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
      args.idf : identifiant du fichier
      args.emap : entrée (de clé idf) de la map des fichiers attachés [lg, data]
      args.lidf : liste des fichiers à supprimer
      La variation de volume v2 est calculée sous contrôle transactionnel
      en relisant mafs (dont les lg).
      Retour: aucun
      */
      const emap = await note.toRowMfa(fic) // [lg, x]
      const args2 = { token: session.authToken, id, ids, idf, idh, emap, lidf }
      this.tr(await post(this, 'ValiderUpload', args2))
      ui.setEtf(4)
      // await sleep(1000)
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/******************************************************
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
  constructor () { super($t('OPtfa')) }

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
      await this.finKO(e)
    }
  }
}

/******************************************************
args.token: éléments d'authentification du compte.
args.id, ids : de la note
args.idh : id de l'hébergeur pour une note groupe
args.idf : identifiant du fichier à supprimer
Retour: aucun
*/
export class SupprFichier extends OperationUI {
  constructor () { super($t('OPsfa')) }

  async run (note, idf) { 
    try {
      const session = stores.session
      const gSt = stores.groupe
      const idh = ID.estGroupe(note.id) ? gSt.getGroupe(note.id).idh : session.compteId
      const args = { token: session.authToken, id: note.id, ids: note.ids, idf, idh }
      this.tr(await post(this, 'SupprFichier', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Supprimer un avatar ****************************************
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
  constructor () { super($t('OPsfa')) }

  async run (args) { 
    try {
      const session = stores.session
      args.token = session.authToken
      const ret = this.tr(await post(this, 'SupprAvatar', args))
      return this.finOK(ret.KO ? false : true)
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* Appels GCxxx ***********************************************/
export class GC extends OperationUI {
  constructor () { super('OPgc') }

  async run (nomop) { 
    try {
      const ret = this.tr(await post(this, nomop, {}))
      return this.finOK(ret)
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* GetCheckpoint ***********************************************/
export class GetCheckpoint extends OperationUI {
  constructor () { super('OPckpt') }

  async run () { 
    try {
      const ret = this.tr(await post(this, 'GetCheckpoint', {}))
      return this.finOK(ret.checkpoint)
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* GetSynthese **********************************************
args.token donne les éléments d'authentification du compte.
args.ns
Retour:
- rowSynthse
*/
export class GetSynthese extends OperationUI {
  constructor () { super('OPsynth') }

  async run (ns) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ns }
      const ret = this.tr(await post(this, 'GetSynthese', args))
      const s = await compile(ret.rowSynthese)
      return this.finOK(s)
    } catch (e) {
      return await this.finKO(e)
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
  constructor () { super('OPfdlv') }

  async run (lop) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, lop }
      this.tr(await post(this, 'ForceDlv', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/*`SetEspaceOptionA` : changement de l'option A par le Comptable
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
  constructor () { super('OPoptionA') }

  async run (optionA) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ns: session.ns, optionA }
      this.tr(await post(this, 'SetEspaceOptionA', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* `PlusTicket` : ajout d'un ticket à un compte A
et ajout du ticket au Comptable
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- `credits` : credits crypté par la clé K du compte
- `rowTicket` : nouveau row tickets pour le Comptable

Retour: rien
*/
export class PlusTicket extends OperationUI {
  constructor () { super('OPtkt') }

  async run (ma, refa, ids) { 
    try {
      const session = stores.session
      const aSt = stores.avatar

      const compta = aSt.compta
      const { rowTicket, ticket } = Ticket.nouveauRow(ids, ma, refa)
      const credits = await compta.creditsSetTk(ticket)

      const args = { token: session.authToken, rowTicket, credits }
      this.tr(await post(this, 'PlusTicket', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* `MoinsTicket` : retrait d'un ticket d'un compte A
et retrait (zombi) du ticket du Comptable
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- `credits` : credits crypté par la clé K du compte
- `ids` : ticket à enlever

Retour: rien
*/
export class MoinsTicket extends OperationUI {
  constructor () { super('OPtkt') }

  async run (ids) { 
    try {
      const session = stores.session
      const aSt = stores.avatar

      const compta = aSt.compta
      const credits = await compta.creditsUnsetTk(ids)

      const args = { token: session.authToken, credits, ids }
      this.tr(await post(this, 'MoinsTicket', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* `RafraichirTickets` : nouvelles versions des tickets cités
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

Retour: rien
*/
export class RafraichirTickets extends OperationUI {
  constructor () { super('OPtkt') }

  async run () { 
    try {
      const session = stores.session
      const aSt = stores.avatar

      const compta = aSt.compta
      const mtk = compta.mtk
      const args = { token: session.authToken, mtk }
      const ret = this.tr(await post(this, 'RafraichirTickets', args))
      let nb = 0
      if (ret.rowTickets) {
        nb = ret.rowTickets.length
        const m = new Map()
        for(const row of ret.rowTickets) 
          m.set(row.ids, await compile(row))
        const credits = await compta.majCredits(m)
        const args = { token: session.authToken, credits }
        this.tr(await post(this, 'MajCredits', args))
      }
      return this.finOK(nb)
    } catch (e) {
      return await this.finKO(e)
    }
  }
}


/* `ReceptionTicket` : réception d'un ticket par le Comptable
POST:
- `token` : jeton d'authentification du compte de **l'administrateur**
- `ids` : du ticket
- `mc` : montant reçu
- `refc` : référence du Comptable

Retour: rien
*/
export class ReceptionTicket extends OperationUI {
  constructor () { super('OPtkt') }

  async run (ids, mc, refc) { 
    try {
      const session = stores.session
      const args = { token: session.authToken, ids, mc, refc }
      this.tr(await post(this, 'ReceptionTicket', args))
      this.finOK()
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

