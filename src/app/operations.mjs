import stores from '../stores/stores.mjs'
import { encode, decode } from '@msgpack/msgpack'

import { AppExc, appexc, AMJ } from './api.mjs'
import { $t, hash } from './util.mjs'
import { crypter } from './webcrypto.mjs'
import { post } from './net.mjs'
import { GenDoc, NomAvatar, NomTribu, Avatar, Compta, Chat, Tribu, Tribu2, getNg, setNg, getCle, compile} from './modele.mjs'
import { genKeyPair, decrypter } from './webcrypto.mjs'
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
args.lmbs: array des [idg, im] des membres où dupliquer cette Cv
args.lchats: array des [id, ids] des chats où dupliquer cette Cv
args.ltribus: array des id des tribu dont l'avatar est sponsor et où duppliquer la CV
*/
export class MajCv extends OperationUI {
  constructor () { super($t('OPmcv')) }

  async run (avatar, photo, info) {
    try {
      const session = stores.session
      while (true) {
        const lmbs = [] // TODO
        const lchats = [] // TODO
        const ltribus = [] // TODO
        const v = avatar.v + 1
        const cva = await crypter(getCle(avatar.id), new Uint8Array(encode({v, photo, info})))
        const args = { token: session.authToken, id: avatar.id, v, cva, lmbs, lchats, ltribus }
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
      const { id, napc } = ret.idnapc
      if (id) {
        try {
          const x = decode(await decrypter(p.clex, napc))
          const na = new NomAvatar(x[0], x[1])
          res = { id, na }
        } catch (e) {
          res = { id, na: null }
        }
      } else {
        res = {id: 0, na: null }
      }
      this.finOK()
      return res
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
*/
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

/* Réactivation d'un chat *********************************
naI, naE : na du chat
Retour: objet chat, enregistré en store et IDB
*/
export class ReactivationChat extends OperationUI {
  constructor () { super($t('OPreactch')) }

  async run (naI, naE) {
    try {
      setNg(naI)
      setNg(naE)
      let chat
      const session = stores.session
      const avStore =  stores.avatar
      const pStore = stores.people

      const idI = naI.id
      const idE = naE.id
      const idsI = await Chat.getIds(naI, naE)
      const idsE = await Chat.getIds(naE, naI)

      let txt
      let dh
      /* Lecture d'un Chat (E) **********************
      args.token: éléments d'authentification du compte.
      args.id ids : id du chat
      args.v : version détenue en session
      Retour:
      disparu: true si l'avatar E a disparu
      rowChat: chat s'il existe
      */
      const args = { token: session.authToken, id: idE, ids: idsE, v: 0 }
      const ret = this.tr(await post(this, 'GetChat', args))
      if (ret.disparu) {
        pStore.setDisparu(idE)
        return this.finOK([true, null])
      }

      if (ret.rowChat) {
        const chatE = await compile(ret.rowChat)
        txt = chatE.txt
        dh = chatE.dh
      } else {
        dh = new Date().getTime()
        txt = ''
      }

      { 
        // On écrit le chat, avec un texte vide s'il n'avait pas été trouvé
        const args = { token: session.authToken }
        args.idI = idI
        args.idE = idE
        args.idsI = idsI
        args.idsE = idsE  
        args.contI = await Chat.getContc(naI, naE, dh, txt)
        args.contE = await Chat.getContc(naE, naI, dh, txt)
        const ret = this.tr(await post(this, 'SetChats', args))
        chat = await compile(ret.rowChatI)
        avStore.setChat(chat)
      }
      return this.finOK([false, chat])
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Charger, quand nécessaire, les cartes de visite des chats d'un avatar *********************************
args.token: éléments d'authentification du compte.
args.mcv : cle: id, valeur: version détenue en session (ou 0)
Retour:
rowCvs: liste des row Cv { _nom: 'cvs', id, _data_ }
  _data_ : cva {v, photo, info} cryptée par la clé de son avatar
*/
export class ChargerCvs extends OperationUI {
  constructor () { super($t('OPccv')) }

  async run () {
    try {
      const session = stores.session
      const id = session.avatarId
      const pStore = stores.people
      const avStore = stores.avatar

      const chats = avStore.getChats(id)
      const mcv = {}
      chats.forEach(c => { mcv[c.naE.id] = 0 })
      for (const x in mcv) {
        const idp = parseInt(x)
        const cv = pStore.getCv(idp)
        if (cv) mcv[id] = cv.v
      }
      const args = { token: session.authToken, mcv }
      const ret = this.tr(await post(this, 'ChargerCvs', args))
      let n = 0
      if (ret.rowCvs) for(const row of ret.rowCvs) {
        const obj = await compile(row)
        const na = getNg(obj.id)
        pStore.setCv(na, obj.cv)
        n++
      }
      return this.finOK(n, true)
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
      const na = new NomAvatar(nom, 1)
      const rowAvatar = await Avatar.primaireRow(na)

      const rowVersion = {
        id: na.id,
        v: 1,
        iv: GenDoc._iv(na.id, 1),
        dlv: AMJ.amjUtcPlusNbj(AMJ.amjUtc(), stores.config.limitesjour.dlv)
      }
      const _data_ = new Uint8Array(encode(rowVersion))
      rowVersion._data_ = _data_
      rowVersion._nom = 'versions'

      const mavk = await session.compta.ajoutAvatarMavk(na)
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
      const ret = this.tr(await post(this, 'SetAttributTribu', args))
      this.finOK()
      return ret
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
  constructor () { super($t('OPnvtr')) }

  async run (id, na, attr, val, val2, exq) {
    try {
      const session = stores.session
      const hrnd = hash(na.rnd)
      const args = { token: session.authToken, id, hrnd, attr, 
        val, val2: val2 || 0, exq: exq || false }
      this.tr(await post(this, 'SetAttributTribu2', args))
      this.finOK()
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
Retour:
- rowtribu: row de la tribu
- rowTribu2
*/
export class GetTribu extends OperationUI {
  constructor () { super($t('OPtrib')) }

  async run (id) {
    try {
      const session = stores.session
      const args = { token: session.authToken, id, tribu2: true}
      const ret = this.tr(await post(this, 'GetTribu', args))
      const tribu = await compile(ret.rowTribu)
      const tribu2 = await compile(ret.rowTribu2)
      return this.finOK([tribu, tribu2], true)
    } catch (e) {
      await this.finKO(e)
    }
  }
}



/*************************************************************************************************
Recherche les "people" d'ids donnés dans lids
- en inscrit un en people s'il n'y est pas
- si sa CV est manquante, va la chercher
*/
export class GetCVs extends OperationUI {
  constructor () { super($t('OPccv')) }

  async run (lids) { // l2: set des ids des CV requises
    try {
      const session = stores.session
      const people = stores.people
      const l2 = []
      lids.forEach(id => {
        const cv = people.getCv(id)
        if (!cv) l2.push(id)
      })

      if (l2.length && session.accesNet) {
        const args = { sessionId: session.sessionId, v: 0, l1: [], l2 }
        const ret = this.tr(await post(this, 'm1', 'chargerCVs', args))
        const m = await compile(ret.rowItems)
        for (const pk in m.cv) {
          const cv = m.cv[pk]
          people.newPeople(cv.id, true)
          people.setCv(cv)
        }
      }
      this.finOK(null, true) // silencieux
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/* Creation nouvel avatar ****************************************
- sessionId,
- clePub,
- idc: numéro du compte
- vcav: version du compte avant (ne doit pas avoir changé),
- mack: map des avatars dans le compte
- rowAvatar: du nouvel avatar
- rowCompta: du nouvel avatar
- forfaits: prélevés sur l'avatar primitif
- idPrimitif: id de l'avatar primitif du compte sur lequel les forfaits sont prélevés
Retour :
- sessionId
- dh
- statut : 0:OK, 1:retry (version compte ayant évolué)
X_SRV, '26-Forfait V1 insuffisant pour l\'attribution souhaitée au nouvel avatar'
X_SRV, '27-Forfait V2 insuffisant pour l\'attribution souhaitée au nouvel avatar'
A_SRV, '06-Compte non trouvé'
*/
export class CreationAvatar extends OperationUI {
  constructor () { super($t('OPnav')) }

  async run (nom, forfaits) { // argument : nom du nouvel avatar, forfaits attribués
    const session = stores.session
    let n = 1
    try {
      while (true) {
        const nomAvatar = new NomAvatar(nom, 1)
        const kpav = await genKeyPair()

        const compte = session.compte
        const mack = await compte.ajoutAvatar(nomAvatar, kpav)

        const avatar = new Avatar().nouveau(nomAvatar.id)
        const rowAvatar = await avatar.toRow()

        const compta = new Compta().nouveau(nomAvatar.id, 0)
        const rowCompta = await compta.toRow()

        const args = { sessionId: session.sessionId, idc: compte.id, vcav: compte.v, clePub: kpav.publicKey, mack, rowAvatar, rowCompta, forfaits }
        const ret = this.tr(await post(this, 'm1', 'creationAvatar', args))
        if (ret.statut === 1) {
          stores.ui.afficherMessage($t('OPiter', [n++]))
          await sleep(2000)
        } else {
          break
        }
      }
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/******************************************************/
export class GetCompta extends OperationUI {
  constructor () { super($t('OPxco')) }

  async run (id) {
    try {
      const args = { sessionId: stores.session.sessionId, id }
      const ret = this.tr(await post(this, 'm1', 'getCompta', args))
      const r = await compileToMap(ret.rowItems)
      this.finOK()
      return r.compta[id]
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/******************************************************
Maj des informations et réserves tribu
*/
export class InforesTribu extends OperationUI {
  constructor () { super($t('OPmtr')) }

  async run (tribu, info, reserves) {
    try {
      const datak = info ? await tribu.getDatak(info) : null
      const args = { sessionId: stores.session.sessionId, idt: tribu.id, datak, reserves }
      this.tr(await post(this, 'm1', 'inforesTribu', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/***********************************
Maj d'un blocage
args:
- sessionId
- id : id de la tribu ou de la compta (compte)
- datat : blocage crypté par la clé de la tribu
*/
export class EnregBlocage extends OperationUI {
  constructor () { super($t('OPbtc')) }

  async run (id, clet, bloc) { // natc: na de la tribu OU du compte
    try {
      const datat = bloc ? await crypter(clet, new Uint8Array(encode(bloc))) : null
      const args = { sessionId: stores.session.sessionId, id, datat }
      this.tr(await post(this, 'm1', 'enregBlocage', args))
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}
