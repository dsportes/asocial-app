import stores from '../stores/stores.mjs'

import { AppExc, appexc } from './api.mjs'
import { $t, hash, tru8, u8ToHex, getJourJ, getTrigramme, setTrigramme } from './util.mjs'
import { random, crypter } from './webcrypto.mjs'
import { post } from './net.mjs'
import { NomAvatar, Avatar, Compta, getNg, SessionSync } from './modele.mjs'
import { genKeyPair } from './webcrypto.mjs'
import { openIDB, deleteIDB, commitRows } from './db.mjs'

/* Opération générique ******************************************/
export class Operation {
  constructor (nomop) { this.nom = nomop }

  BRK () { }

  tr (ret) {
    if (!this.dh) this.dh = 0
    const t = Math.floor(ret.dh / 1000)
    if (this.dh < t) this.dh = t
    return ret
  }

  /* 
  Retrait des groupes détectés zombis
  des listes des groupes accédés par les avatars du compte

  async groupesZombis (lgr) {
    if (lgr.size) {
      const session = stores.session
      const avatar = stores.avatar
      for (const id of session.compte.avatarIds()) {
        const a = avatar.get(id)
        for (const idg of a.groupeIds()) {
          if (lgr.has(idg)) {
            const args = { sessionId: session.sessionId, id: a.id, ni: a.ni(idg) }
            this.tr(await post(this, 'm1', 'supprAccesGrAv', args))
          }
        }
      }
    }
  }
  */
}

export class OperationUI extends Operation {
  constructor (nomop) {
    super(nomop)
    stores.session.opencours = this
    this.cancelToken = null
    this.break = false
  }

  BRK () { if (this.break) throw new AppExc(E_BRK, 0) }

  stop () {
    if (this.cancelToken) {
      this.cancelToken.cancel('break')
      this.cancelToken = null
    }
    this.break = true
  }

  finOK (res, silence) {
    const session = stores.session
    session.opencours = null
    if (!silence) stores.ui.afficherMessage($t('OPok', [this.nom]), false)
    return res
  }

  async finKO (e) {
    const exc = appexc(e)
    const session = stores.session
    const ui = stores.ui
    // if (exc.code === 5001) session.phrase = null
    session.opencours = null
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
      const ret = this.tr(await post(this, 'MemoCompte', args))
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
      const ret = this.tr(await post(this, 'MotsclesCompte', args))
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
      await post(this, 'ChangementPS', args)
      session.chgps(ps)
      if (session.synchro) commitRows(new IDBbuffer(), true)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/******************************************************
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
        const ret = await post(this, 'm1', 'chargerCVs', args)
        const m = await compileToMap(ret.rowItems)
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
        const nomAvatar = new NomAvatar(nom) // nouveau
        const kpav = await genKeyPair()

        const compte = session.compte
        const mack = await compte.ajoutAvatar(nomAvatar, kpav)

        const avatar = new Avatar().nouveau(nomAvatar.id)
        const rowAvatar = await avatar.toRow()

        const compta = new Compta().nouveau(nomAvatar.id, 0)
        const rowCompta = await compta.toRow()

        const args = { sessionId: session.sessionId, idc: compte.id, vcav: compte.v, clePub: kpav.publicKey, mack, rowAvatar, rowCompta, forfaits }
        const ret = await post(this, 'm1', 'creationAvatar', args)
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

/******************************************************
Mise à jour d'une préférence d'un compte
X_SRV, '06-Compte non trouvé. Ne devrait pas arriver (bug probable)'
*/
export class PrefCompte extends OperationUI {
  constructor () { super($t('OPmpr')) }

  async run (code, datak) {
    const session = stores.session
    try {
      const args = {
        sessionId: session.sessionId, 
        id: session.compte.id, 
        code: code, 
        datak: datak
      }
      await post(this, 'm1', 'prefCompte', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/***********************************
Get parrain / tribu d'uncompte, pour le comptable seulement
args:
- sessionId
- id : id du compte
Retourne:
result.parrain : 1 si parrain
result.nctk : nom complet `[nom, rnd]` de la tribu cryptée par la clé K.
*/
export class GetTribuCompte extends OperationUI {
  constructor () { super($t('OPxtn')) }

  async run (id) {
    try {
      const args = { sessionId: stores.session.sessionId, id }
      const ret = await post(this, 'm1', 'getTribuCompte', args)
      this.finOK()
      return [ret.parrain, ret.nctk]
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
      const ret = await post(this, 'm1', 'getCompta', args)
      const r = await compileToMap(ret.rowItems)
      this.finOK()
      return r.compta[id]
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/******************************************************
Mise à jour d'une carte de visite
A_SRV, '07-Carte de visite non trouvée'
*/
export class MajCv extends OperationUI {
  constructor () {
    super($t('OPmcv'))
  }

  async run (cv) {
    try {
      const cvc = await cv.toRow()
      const args = { sessionId: stores.session.sessionId, id: cv.id, cv: cvc }
      await post(this, 'm1', 'majCV', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}

/******************************************************************
Parrainage :
arg :
  - sessionId: data.sessionId,
  - rowCouple
  - rowContact
  - id: id de l'avatar
  - ni: clé d'accès à lcck de l'avatar
  - datak : clé cc cryptée par la clé k
  - sec : true si avatar accède aux secrets du contact
*/

export class NouveauParrainage extends OperationUI {
  constructor () {
    super($t('OPpnc'))
  }

  async run (arg) {
    /* Arg
    nat: this.session.estComptable ? this.naTribu : this.session.compte.nat,
    phch: this.pc.phch, // le hash de la clex (integer)
    pp: this.pc.phrase, // phrase de parrainage (string)
    clex: this.pc.clex, // PBKFD de pp (u8)
    id: this.session.id,
    max: this.max,
    forfaits: this.forfaits,
    parrain: this.estParrain,
    nomf: this.nom, // nom du filleul (string)
    mot: this.mot,
    npi: this.npi
    */
    try {
      /* `lcck` : map : de avatar
          - _clé_ : `ni`, numéro pseudo aléatoire. Hash de (`cc` en hexa suivi de `0` ou `1`).
          - _valeur_ : clé `cc` cryptée par la clé K de l'avatar cible. Le hash d'une clé d'un couple donne son id.
      */
     const session = stores.session
      const cc = random(32) // clé du couple
      const ni = hash(u8ToHex(cc) + '0')
      const datak = await crypter(session.clek, cc)
      const nap = getNg(arg.id) // na de l'avatar créateur
      const naf = new NomAvatar(arg.nomf) // na de l'avatar du filleul
      const dlv = getJourJ() + stores.config.limitesjour.parrainage

      const couple = new Couple().nouveauP(nap, naf, cc, arg.mot, arg.pp, arg.max, dlv, arg.npi)
      couple.mc0 = new Uint8Array([252])
      couple.mc1 = new Uint8Array([253])
      const rowCouple = await couple.toRow()

      const nct = [arg.nat.nom, arg.nat.rnd]
      const contact = await new Contact().nouveau(arg.phch, arg.clex, dlv, cc, [naf.nom, naf.rnd], 0, nct, arg.parrain, arg.forfaits)
      const rowContact = contact.toRow()

      const args = { sessionId: session.sessionId, rowCouple, rowContact, ni, datak, id: nap.id, sec: arg.max[0] > 0 }
      await post(this, 'm1', 'nouveauParrainage', args)
      return this.finOK()
    } catch (e) {
      return await this.finKO(e)
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
      await post(this, 'm1', 'inforesTribu', args)
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
      await post(this, 'm1', 'enregBlocage', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}
