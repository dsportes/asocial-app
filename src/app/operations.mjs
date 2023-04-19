import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'

import { AppExc, appexc, AMJ } from './api.mjs'
import { $t, rnd6 } from './util.mjs'
import { crypter } from './webcrypto.mjs'
import { post } from './net.mjs'
import { GenDoc, NomAvatar, NomTribu, NomGroupe, Avatar, Chat, 
  Groupe, Membre, Tribu, Tribu2, getNg, setNg, getCle, compile} from './modele.mjs'
import { decrypter, crypterRSA, genKeyPair } from './webcrypto.mjs'
import { commitRows } from './db.mjs'

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
    const exc = appexc(e)
    const session = stores.session
    const ui = stores.ui
    // if (exc.code === 5001) session.phrase = null
    session.finOp()
    ui.afficherMessage($t('OPko', [this.nom]), true)
    await ui.afficherExc(exc)
    return exc
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
      await this.finKO(e)
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
      await this.finKO(e)
    }
  }
}

/* Maj de la carte de visite d'un avatar ******************************************
args.token
args.id : id de l'avatar dont la Cv est mise à jour
args.v: version de l'avatar incluse dans la Cv. Si elle a changé sur le serveur, retour OK false (boucle sur la requête)
args.cva: {v, photo, info} crypté par la clé de l'avatar
SI C'EST LE COMPTE, pour dupliquer la CV
args.idTr: id de sa tribu (où dupliquer la CV)
args.hrnd: clé d'entrée de la map mbtr
*/
export class MajCv extends OperationUI {
  constructor () { super($t('OPmcv')) }

  async run (avatar, photo, info) {
    try {
      const session = stores.session
      const aSt = stores.avatar
      while (true) {
        let idTr = 0, hrnd = 0
        const compta = aSt.compta
        if (compta.id === avatar.id) {
          idTr = compta.idt
          hrnd = avatar.na.hrnd
        }
        const v = avatar.v + 1
        const cva = await crypter(getCle(avatar.id), new Uint8Array(encode({v, photo, info})))
        const args = { token: session.authToken, id: avatar.id, v, cva, idTr, hrnd }
        const ret = this.tr(await post(this, 'MajCv', args))
        if (ret.OK) break
        await sleep(500)
      }
      this.finOK()
    } catch (e) {
      await this.finKO(e)
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
        if (ret.OK) break
        await sleep(500)
      }
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}


/** Changement de phrase secrete ****************************************************
args.token: éléments d'authentification du compte.
args.hps1: dans compta, `hps1` : hash du PBKFD de la ligne 1 de la phrase secrète du compte.
args.shay: SHA du SHA de X (PBKFD de la phrase secrète).
args.pcbh : hash de la cle X (hash du PBKFD de la phrase complète).
args.kx: clé K cryptée par la phrase secrète
*/
export class ChangementPS extends OperationUI {
  constructor () { super($t('OPcps')) }

  async run (ps) {
    try {
      const session = stores.session
      const kx = await crypter(ps.pcb, session.clek)
      const args = { token: session.authToken, hps1: ps.dpbh, pcbh: ps.pcbh, shay: ps.shay, kx }
      this.tr(await post(this, 'ChangementPS', args))
      session.chgps(ps)
      if (session.synchro) commitRows(new IDBbuffer(), true)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
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
      await this.finKO(e)
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

  async run (p) { // p: objet PhraseContact
    try {
      const session = stores.session
      let res
      const args = { token: session.authToken, hpc: p.phch }
      const ret = this.tr(await post(this, 'GetAvatarPC', args))
      if (ret.cvnpac) {
        try {
          const { cv, napc } = ret.cvnapc
          const x = decode(await decrypter(p.clex, napc))
          const na = new NomAvatar(x[0], x[1])
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
  constructor () { super($t('OPcsp')) }

  async run (ids) {
    try {
      const ret = this.tr(await post(this, 'ChercherSponsoring', { ids }))
      this.finOK()
      return ret
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Set chats ***********************************************************
L'un ou l'autre des chats I et E peuvent ne pas exister :
- ils sont créés avec des mots clés vide
Les cartes de visite des deux côtés sont mises à jour.

Si I n'a pas de chat, il lui faut d'abord en obtenir le contenu éventuel connu de E
- il doit en effet en crypter le contenu avant SetChats

args.token: éléments d'authentification du compte.
args.idI : id (côté compte)
args.idE : id (côté de l'autre)
args.idsI : ids du chat
args.idsE : ids du chat
args.contI : contenu crypté côté compte
args.contE : contenu crypté côté autre
Retour:
rowChatI

export class SetChats extends OperationUI {
  constructor () { super($t('OPmajtch')) }

  async run (chat, txt) {
    try {
      const session = stores.session
      const dh = new Date().getTime()
      const args = { token: session.authToken }
      args.idI = chat.naI.id
      args.idE = chat.naE.id
      args.idsI = await Chat.getIds(chat.naI, chat.naE)
      args.idsE = await Chat.getIds(chat.naE, chat.naI)
      
      args.contI = await Chat.getContc(chat.naI, chat.naE, dh, txt)
      args.contE = await Chat.getContc(chat.naE, chat.naI, dh, txt)
      const ret = this.tr(await post(this, 'SetChats', args))
      return this.finOK(ret)
    } catch (e) {
      await this.finKO(e)
    }
  }
}
*/

/* Changer les mots clés d'un chat *********************************
args.token: éléments d'authentification du compte.
args.mc : u8 des mots clés
args.id ids : id du chat
Retour:
*/
export class MajMotsclesChat extends OperationUI {
  constructor () { super($t('OPmajtch')) }

  async run (id, ids, mc) {
    try {
      const session = stores.session
      const dh = new Date().getTime()
      const args = { token: session.authToken, id, ids, mc }
      const ret = this.tr(await post(this, 'MajMotsclesChat', args))
      this.finOK()
      return ret
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Supprimer un chat ******************************
args.token: éléments d'authentification du compte.
args.idI : id (côté compte)
args.idE : id (côté de l'autre)
args.idsI : ids du chat
args.idsE : ids du chat
Retour:
*/
export class SupprimerChat extends OperationUI {
  constructor () { super($t('OPreactch')) }

  async run (naI, naE) {
    try {
      const args = { token: stores.session.authToken }
      args.idI = naI.id
      args.idE = naE.id
      args.idsI = await Chat.getIds(naI, naE)
      args.idsE = await Chat.getIds(naE, naI) 
      this.tr(await post(this, 'SupprimerChat', args))
      this.finOK()
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

      setNg(naI)
      setNg(naE)
      const cc = random(32)
      const pubE = await aSt.getPub(naE.id)
      const ccPE = await crypterRSA(pubE, cc)
      const ccKI = await crypter(session.clek, cc)
      const dh = new Date().getTime()
      const contcI = await Chat.getContc(naE, dh, txt, cc)
      const contcE = await Chat.getContc(naI, dh, txt, cc)

      const idI = naI.id
      const idE = naE.id
      const idsI = await Chat.getIds(naI, naE)
      const idsE = await Chat.getIds(naE, naI)

      const args = { token: session.authToken, idI, idsI, idE, idsE, ccKI, ccPE, contcI, contcE }
      const ret = this.tr(await post(this, 'NouveauChat', args))
      const st = ret.st
      let chat
      if (st !== 0) {
        chat = await compile(ret.rowChat)
        aSt.setChat(chat)
      }
      return this.finOK([st, chat])
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* MAJ Chat **********************
args.token: éléments d'authentification du compte.
args.idI idsI : id du chat, côté interne
args.idE idsE : id du chat côté externe
args.ccKI : clé cc cryptée par la clé K du compte de I.
  Seulement si en session la clé cc était cryptée par la clé publique
args.seq : numéro de séquence à partir duquel contc a été créé
args.contcI : contenu du chat I crypté par la clé cc
args.contcE : contenu du chat E crypté par la clé cc
Retour:
st: 
  1 : chat créé avec le contenu contc
  2 : le chat existant a un contenu plus récent que celui sur lequel était basé contc. Retour de chatI
rowChat:
*/
export class MajChat extends OperationUI {
  constructor () { super($t('OPmajch')) }

  async run (naI, naE, txt, chat) {
    try {
      const session = stores.session
      const aSt =  stores.avatar

      setNg(naI)
      setNg(naE)
      const ccKI = chat.ccK ? await crypter(session.clek, chat.cc) : null
      const dh = new Date().getTime()
      const contcI = await Chat.getContc(naE, dh, txt, chat.cc)
      const contcE = await Chat.getContc(naI, dh, txt, chat.cc)
      const seq = chat.seq

      const idI = naI.id
      const idE = naE.id
      const idsI = await Chat.getIds(naI, naE)
      const idsE = await Chat.getIds(naE, naI)

      const args = { token: session.authToken, idI, idsI, idE, idsE, ccKI, seq, contcI, contcE }
      const ret = this.tr(await post(this, 'MajChat', args))
      const st = ret.st
      const ch = await compile(ret.rowChat)
      aSt.setChat(ch)
      return this.finOK([st, ch])
    } catch (e) {
      await this.finKO(e)
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
      const id = session.avatarId
      const pSt = stores.people
      const aSt = stores.avatar
      const gSt = stores.groupe

      const toutes = [] // toutes les cibles
      if (!id) {
        pSt.peopleIds.forEach(idE => { 
          const exp = pSt.exportPourCv(idE)
          if (exp) toutes.push(exp)
        })
      } else if (id % 10 <= 1) {
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
        const ret = this.tr(await post(this, 'RafraichirCvs', args))
        nr += ret.nbrech
      }

      return this.finOK([nt, nr], true)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Nouvel avatar *********************************
args.token: éléments d'authentification du compte.
args.rowAvatar : row du nouvel avatar
args.rowVersion : row de le la version de l'avatar
args.mavk: mavk de comta incluant le nouvel avatar
Retour:
*/
export class NouvelAvatar extends OperationUI {
  constructor () { super($t('OPmajtch')) }

  async run (nom) {
    try {
      const session = stores.session
      const aSt = stores.avatar

      const na = new NomAvatar(nom, 1)

      const { publicKey, privateKey } = await genKeyPair()

      const rowAvatar = await Avatar.primaireRow(na, publicKey, privateKey)

      const rowVersion = {
        id: na.id,
        v: 1,
        iv: GenDoc._iv(na.id, 1),
        dlv: AMJ.amjUtcPlusNbj(AMJ.amjUtc(), stores.config.limitesjour.dlv)
      }
      const _data_ = new Uint8Array(encode(rowVersion))
      rowVersion._data_ = _data_
      rowVersion._nom = 'versions'

      const mavk = await aSt.compta.ajoutAvatarMavk(na)
      const args = { token: session.authToken, rowAvatar, rowVersion, mavk }
      const ret = this.tr(await post(this, 'NouvelAvatar', args))
      this.finOK()
      return ret
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Nouvelle tribu *********************************
args.token: éléments d'authentification du compte.
args.rowTribu : row de la nouvelle tribu
Retour:
*/
export class NouvelleTribu extends OperationUI {
  constructor () { super($t('OPnvtr')) }

  async run (nom, q1, q2) {
    try {
      const session = stores.session
      const nt = new NomTribu(nom)
      const rowTribu = await Tribu.nouvelleRow(nt, q1, q2)
      const rowTribu2 = await Tribu2.nouvelleRow(nt)
      const args = { token: session.authToken, rowTribu, rowTribu2 }
      const ret = this.tr(await post(this, 'NouvelleTribu', args))
      this.finOK()
      return ret
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Set d'un attribut d'une tribu *********************************
  - `infok` : commentaire privé du comptable crypté par la clé K du comptable.
  - `notifco` : notification du comptable à la tribu (cryptée par la clé de la tribu).
  - `notifsp` : notification d'un sponsor à la tribu (cryptée par la clé de la tribu).
  - `blocaget` : blocage crypté par la clé de la tribu.
args.token: éléments d'authentification du compte.
args.id : id de la tribu
args.attr: nom de l'attribut
args.val: valeur de l'attribut
Retour:
*/
export class SetAttributTribu extends OperationUI {
  constructor () { super($t('OPnvtr')) }

  async run (id, attr, val) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, attr, val }
      this.tr(await post(this, 'SetAttributTribu', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Set des quotas d'une tribu *********************************
args.token: éléments d'authentification du compte.
args.id : id de la tribu
args.q1 args.q2 : quotas
Retour:
*/
export class SetQuotasTribu extends OperationUI {
  constructor () { super($t('OPqtr')) }

  async run (id, q1, q2) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, q1, q2 }
      this.tr(await post(this, 'SetQuotasTribu', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Set d'un attribut QUI IMPACTE tribu de l'entrée d'un compte d'une tribu2 - PAS la CV *******
  - `sp` : si `true` / présent, c'est un sponsor.
  - `blocage` : blocage de niveau compte, crypté par la clé de la tribu.
  - 'gco gsp' : gravités des notifco et notifsp.
  - `notifco` : notification du comptable au compte (cryptée par la clé de la tribu).
  - `notifsp` : notification d'un sponsor au compte (cryptée par la clé de la tribu).
  - quotas: `[q1, q2]` : quotas du compte (redondance dans l'attribut `compteurs` de `compta`)
args.token: éléments d'authentification du compte.
args.id : id de la tribu
args.hrnd: id de l'élément du compte dans mbtr
args.attr: nom de l'attribut
args.val: valeur de l'attribut
args.val2: valeur de l'attribut "gco / gsp"
args.exq: lever une exception en cas dépassement des quotas de la tribu
Retour:
*/
export class SetAttributTribu2 extends OperationUI {
  constructor () { super($t('OPmajtr')) }

  async run (id, na, attr, val, val2, exq) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, hrnd: na.hrnd, attr, 
        val, val2: val2 || 0, exq: exq || false }
      this.tr(await post(this, 'SetAttributTribu2', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Changer un compte de tribu *********************************
args.token: éléments d'authentification du compte.
args.id : id du compte qui change de tribu
args.trIdav : id de la tribu quittée
args.trIdap : id de la tribu intégrée
args.hrnd : clé de l'entrée du compte dans mbtr de sa tribu2
args.mbtr : entrée mbtr dans sa nouvelle tribu
Sur Compta:
args.nctk : `[nom, clé]` de la tribu crypté par la clé CV du compte.
args.nctkc : `[nom, clé]` de la tribu crypté par la clé K **du Comptable**: 
args.napt: `[nom, clé]` de l'avatar principal du compte crypté par la clé de la tribu.
Retour:
*/
export class ChangerTribu extends OperationUI {
  constructor () { super($t('OPchtr')) }

  async run (na, nvTrid) { // na du compte, 
    try {
      const session = stores.session
      const aSt = stores.avatar
      const naTrap = getNg(nvTrid)
      const tribu2 = session.tribuCId ? aSt.tribu2C : aSt.tribu2

      /*
      - `mbtr` : map des comptes de la tribu:
      - _clé_ : id pseudo aléatoire, hash de la clé `rnd` du compte.
        Dans l'objet c'est l'id du compte
      - _valeur_ :
        - `na` : `[nom, rnd]` du membre crypté par la clé de la tribu.
        - `sp` : si `true` / présent, c'est un sponsor.
        - `q1 q2` : quotas du compte (redondance dans l'attribut `compteurs` de `compta`)
        - `blocage` : blocage de niveau compte, crypté par la clé de la tribu.
        - 'gco gsp' : gravités des notifco et notifsp (true / false).
        - `notifco` : notification du comptable au compte (cryptée par la clé de la tribu).
        - `notifsp` : notification d'un sponsor au compte (cryptée par la clé de la tribu).
        - `cv` : `{v, photo, info}`, carte de visite du compte cryptée par _sa_ clé (le `rnd` ci-dessus).
      */
      const m = tribu2.mbtr[na.id]
      const napt = await crypter(naTrap.rnd, new Uint8Array(encode([na.nom, na.rnd])))
      const mnv = { 
        na: napt,
        sp: m.sp,
        q1: m.q1,
        q2: m.q2,
        gco: m.gco || 0,
        gsp: m.gsp || 0,
        cv: m.cv || null
      }
      if (m.blocage) mnv.blocage = await crypter(naTrap.rnd, m.blocage.encode())
      if (m.notifco) mnv.notifco = await crypter(naTrap.rnd, new Uint8Array(encode(m.notifco)))
      if (m.notifsp) mnv.notifsp = await crypter(naTrap.rnd, new Uint8Array(encode(m.notifsp)))
      const mbtr = new Uint8Array(encode(mnv))

      const trbuf = new Uint8Array(encode([naTrap.nom, naTrap.rnd]))
      const nctk = await crypter(na.rnd, trbuf)
      const nctkc = await crypter(session.clek, trbuf)

      const args = { token: session.authToken, 
        id: na.id,
        trIdav: tribu2.id,
        trIdap: nvTrid,
        hrnd: na.hrnd, 
        mbtr, nctk, nctkc, napt
      }
      const ret = this.tr(await post(this, 'ChangerTribu', args))
      const t = await compile(ret.rowTribu)
      const t2 = await compile(ret.rowTribu2)
      return this.finOK([t, t2])
    } catch (e) {
      await this.finKO(e)
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
      const dhvu = await crypter(session.clek, '' + (new Date().getTime()))
      const args = { token: session.authToken, dhvu }
      this.tr(await post(this, 'SetDhvuCompta', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Get "compteurs" d'une compta *********************************
args.token: éléments d'authentification du compte.
args.id : id de la compta
Retour:
- compteurs : objet compteurs de cette compta
*/
export class GetCompteursCompta extends OperationUI {
  constructor () { super($t('OPdhvu')) }

  async run (id) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id }
      const ret = this.tr(await post(this, 'GetCompteursCompta', args))
      return this.finOK(ret.compteurs, true)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Get Tribu et Tribu2 *********************************
args.token: éléments d'authentification du compte.
args.id : id de la tribu
args.tribu2 : true si retourner tribu2 avec
args.setC: déclarer la tribu courante
Retour:
- rowtribu: row de la tribu
- rowTribu2
*/
export class GetTribu extends OperationUI {
  constructor () { super($t('OPtrib')) }

  async run (id, setC) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, tribu2: true, setC: setC || false}
      const ret = this.tr(await post(this, 'GetTribu', args))
      const tribu = await compile(ret.rowTribu)
      const tribu2 = await compile(ret.rowTribu2)
      return this.finOK([tribu, tribu2], true)
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Set notification générale *****************************************************
args.token donne les éléments d'authentification du compte.
args.notifG : l'objet notification { txt, dh, g }
Retour:
*/
export class SetNotifG extends OperationUI {
  constructor () { super($t('OPnotif')) }

  async run (notifG) {
    try {
      const session = stores.session
      const args = { token: session.authToken, notifG}
      this.tr(await post(this, 'SetNotifG', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Nouveau groupe *****************************************************
args.token donne les éléments d'authentification du compte.
args.rowGroupe : le groupe créé
args.rowMembre : le membre
args.id: id de l'avatar créateur
args.quotas : [q1, q2] attribué au groupe
args.ni: numéro d'invitation de son créateur (clé dans lgrk)
args.avgr: élément de lgrk dans l'avatar créateur
Retour:
*/
export class NouveauGroupe extends OperationUI {
  constructor () { super($t('OPnvgr')) }

  async run (nom, ferme, quotas) { // quotas: [q1, q2]
    try {
      const session = stores.session
      const nag = new NomGroupe(nom)
      const rowGroupe = await Groupe.rowNouveauGroupe(nag, ferme)
      setNg(nag)
      const na = getNg(session.avatarId)
      const ni = rnd6()
      // En UTC la division d'une date est multiple de 86400000
      const tjourJ = (AMJ.tDeAmjUtc(this.auj) / 86400000) + stores.config.limitesjour.dlv
      const tdlv = ((Math.floor(tjourJ / 10) + 1) * 10) + 10
      const dlv = AMJ.amjUtcDeT(tdlv * 86400000)

      const rowMembre = await Membre.rowNouveauMembre (nag, na, 1, ni, 1, dlv)
      const avgr = await crypter(session.clek, new Uint8Array(encode([nag.nom, nag.rnd, 1])))
      const args = { token: session.authToken, rowGroupe, rowMembre, id: session.avatarId,
        quotas: [quotas.q1, quotas.q2], ni, avgr, abPlus: [nag.id]}
      this.tr(await post(this, 'NouveauGroupe', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Changement des mots clés d'un compte ******************************************
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
      await this.finKO(e)
    }
  }
}
