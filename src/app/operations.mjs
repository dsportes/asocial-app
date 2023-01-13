import stores from '../stores/stores.mjs'

import { AppExc, appexc } from './api.mjs'
import { $t, hash, tru8, u8ToHex, getJourJ, getTrigramme, setTrigramme, getBlocage } from './util.mjs'
import { random, crypter } from './webcrypto.mjs'
import { post } from './net.mjs'
import { compileToMap, NomAvatar, Avatar, Compta, getNg, Couple, Contact, setCv, SessionSync } from './modele.mjs'
import { genKeyPair } from './webcrypto.mjs'
import { openIDB, deleteIDB, saveListeCvIds, commitRows } from './db.mjs'

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
  */
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

  /* Obtention des invitGr du compte et traitement de régularisation ***********************************/
  async getInvitGrs (compte) {
    const session = stores.session
    const ids = compte.avatarIds()
    const ret = this.tr(await post(this, 'm1', 'chargerInvitGr', { sessionId: session.sessionId, ids: Array.from(ids) }))
    const lstInvitGr = []
    const m = await compileToMap(ret.rowItems)
    if (m.invitgr) for (const pk in m.invitgr) lstInvitGr.push(m.invitgr[pk])
    await this.traitInvitGr(lstInvitGr)
  }

  /* Traitement des invitGr, appel de régularisation ********************************/
  async traitInvitGr (lstInvitGr) {
    const session = stores.session
    for (let i = 0; i < lstInvitGr.length; i++) {
      const iv = lstInvitGr[i]
      const args = { sessionId: session.sessionId, id: iv.id, idg: iv.idg, ni: iv.ni, datak: iv.datak }
      this.tr(await post(this, 'm1', 'regulGr', args))
    }
  }

  /* Obtention des invitCp du compte et traitement de régularisation ***********************************/
  async getInvitCps (compte) {
    const session = stores.session
    const ids = compte.avatarIds()
    const ret = this.tr(await post(this, 'm1', 'chargerInvitCp', { sessionId: session.sessionId, ids: Array.from(ids) }))
    const lstInvitCp = []
    const m = await compileToMap(ret.rowItems)
    if (m.invitcp) for (const pk in m.invitcp) lstInvitCp.push(m.invitcp[pk])
    await this.traitInvitCp(lstInvitCp)
  }

  /* Traitement des invitCp, appel de régularisation ********************************/
  async traitInvitCp (lstInvitCp) {
    const session = stores.session
    for (let i = 0; i < lstInvitCp.length; i++) {
      const iv = lstInvitCp[i]
      const args = { sessionId: session.sessionId, id: iv.id, idc: iv.idc, ni: iv.ni, datak: iv.datak }
      this.tr(await post(this, 'm1', 'regulCp', args))
    }
  }

}

export class OperationWS extends Operation {
  constructor (nomop) { super(nomop) }
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

  /* Charge depuis le serveurs les Ccv requises :
  - soit postérieures à v
  - soit sans contrainte de version
  */
  async chargerCv (l1, l2, v) { // utiles : set des avatars utiles
    const session = stores.session
    const chg = {}
    if (l1.length || l2.length) {
      const args = { sessionId: session.sessionId, v, l1, l2 }
      const ret = this.tr(await post(this, 'm1', 'chargerCVs', args))
      const m = await compileToMap(ret.rowItems)
      if (m.cv) for(const pk in m.cv) chg[pk] = m.cv[pk]
    }
    return chg
  }

  /*
  1) Après création du compte comptable
  2) Après acceptation d'un parrainage (compte est celui créé)
  */
  async postCreation (ret) {
    this.session = stores.session

    this.session.clepubc = ret.clepubc
    tru8('Pub Comptable data.clepubc', ret.clepubc)

    const mapRows = await compileToMap(ret.rowItems)

    const compte = mapRows.compte['1']
    this.session.setCompte(compte)
    this.session.estComptable = compte.estComptable
    this.session.nombase = await compte.getNombase()

    const prefs = mapRows.prefs['1']
    this.session.setPrefs(prefs)

    const avatar = mapRows.avatar[compte.id]
    stores.avatar.setAvatar(avatar)

    const compta = mapRows.compta[compte.id]
    stores.avatar.setCompta(compta)

    const lmaj = [compte, compta, prefs, avatar]

    const lstcv = new Set()
    let tribu = null
    let couple = null
    let vcv = 0 // version des CV la plus récente

    if (!compte.estComptable) {
      tribu = mapRows.tribu[compte.nat.id]
      stores.tribu.setTribu(tribu)
      lmaj.push(tribu)

      const x = Object.values(mapRows.couple)
      couple = x[0]
      stores.couple.setCouple(couple)
      lmaj.push(couple)
    }

    if (compte.estComptable) {
      this.session.blocage = 0
    } else {
      getBlocage(tribu, compta)
    }

    // Récupération et traitement de la CV du parrain
    if (couple) lstcv.add(couple.naE.id)
    if (tribu) tribu.idParrains(lstcv)

    if (!compte.estComptable) {
      const chg = await this.chargerCv([], Array.from(lstcv), 0)
      const peopleSt = stores.people
      for (const id in chg) {
        const cv = chg[id]
        const na = getNg(cv.id)
        if (cv.v > vcv) vcv = cv.v
        peopleSt.newPeople(na)
        setCv(cv)
        lmaj.push(cv)
        peopleSt.setParrain(cv.id, true)
      }
    }

    // création de la base IDB et chargement des rows compte avatar ...
    if (this.session.synchro) { // synchronisé : IL FAUT OUVRIR IDB (et écrire dedans)
      this.BRK()
      // A revoir
      try {
        await openIDB()
      } catch (e) {
        await deleteIDB()
        throw e
      }
      localStorage.setItem(lskey, this.session.nombase)
      const trig = await getTrigramme()
      setTrigramme(this.session.nombase, this.session.reseau, trig)

      if (lstcv.size) await saveListeCvIds(vcv, lstcv)
      await commitRows({ lmaj, lsuppr: [] })
      this.session.sessionSync = new SessionSync()
      await this.session.sessionSync.setConnexion(this.dh)
    }

    console.log('Connexion compte : ' + compte.id)
    this.finOK()
    stores.ui.goto11()
  }
}


/* echoTexte **************************************************/
export class EchoTexte extends OperationUI {
  constructor () { super($t('OPecho')) }

  async run (texte, to) {
    try {
      const r = await post(null, 'm1', 'echoTexte', { texte, to })
      console.log('Echo : ' + r.texte)
      return this.finOK(r)
    } catch (e) {
      return await this.finKO(e)
    }
  }
}

/* erreurFonc *******************************************/
export class ErreurFonc extends OperationUI {
  constructor () { super($t('OPerreurFonc')) }

  async run (detail, to) {
    try {
      const r = await post(null, 'm1', 'erreurFonc', { detail, to })
      return this.finOK(r)
    } catch (e) {
      return await this.finKO(e)
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
Changement de phrase secrete
args:
- sessionId
- id: du compte
- dpbh
- pcbh
- kx
*/
export class ChangementPS extends OperationUI {
  constructor () { super($t('OPcps')) }

  async run (ps) {
    try {
      const session = stores.session
      const c = session.compte
      const avdpbh = c.dpbh // AVANT changement
      const kx = await c.nouvKx(ps)
      const args = { sessionId: session.sessionId, id: c.id, dpbh: ps.dpbh, pcbh: ps.pcbh, kx }
      const ret = await post(this, 'm1', 'changementPS', args)
      session.phrase = ps
      const r = await this.compileToMap(ret.rowItems)
      session.compte = r.compte['1']
      const apdpbh = r.dpbh
      if (session.synchro) {
        let lsk = session.reseau + '-' + avdpbh
        localStorage.removeItem(lsk)
        const nb = await r.compte.getNombase()
        lsk = session.reseau + '-' + apdpbh
        localStorage.setItem(lsk, nb)
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
      const datat = bloc ? await crypter(clet, encode(bloc)) : null
      const args = { sessionId: stores.session.sessionId, id, datat }
      await post(this, 'm1', 'enregBlocage', args)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}
