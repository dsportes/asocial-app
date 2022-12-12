import stores from '../stores/stores.mjs'

import { OperationWS } from './operations.mjs'
import { CacheSync, compileToCache, delSecret, setSecret, setCv } from './modele.mjs'
import { $t, dhstring, getBlocage } from './util.mjs'
import { post } from './net.mjs'
import { commitRows, gestionFichierSync } from './db.mjs'
import { appexc } from './api.mjs'

/** OpBufS : utilisé seulment en syncro ************/
class OpBufS {
  constructor () {
    this.lmaj = [] // objets à modifier / insérer en IDB
    this.lsuppr = [] // objets (du moins {table id (id2))} à supprimer de IDB
    this.lav = new Set() // set des ids des avatars à purger
    this.lcc = new Set() // set des ids des couples à purger
    this.lcc2 = new Set() // set des Ids des couples n'accédant plus aux secrets à purger
    this.lgr = new Set() // set des ids des groupes à purger

    this.mapSec = {} // pour traitement final des fichiers locaux
  }

  putIDB (obj) { this.lmaj.push(obj) }
  supprIDB (obj) { this.lsuppr.push(obj) } // obj : {table, id, (sid2)}
}

/* traiteQueue ***********************************************************************
Traitement des synchronisations reçues en queue invoquée dans l'opération ProcessQueue()
- Principes généraux :
  - tout objet de version inférieure à celle détenue est ignoré
  - la mise à jour de store/db ne s'effectue qu'à la fin en une séquence sans wait
    de manière à ne laisser voir aux vues QUE des états cohérents respectant les frontières des
    transactions du serveur (et dans l'ordre d'éxécution)
  - la mise à jour d'IDB ne s'effectue qu'à la fin en une seule transaction (même raison)
  - la mise à jour du répertoire est au fil de l'eau, il n'est jamais incohérent et n'a pas de suppressions
    les suppressions logiques x de chaque entrée indiquent, soit une entrée disparue, soit une entrée n'étant plus référencée
    Pour celles non référencées, à la fin les objets courants "avatar groupe couple membre secret" sont mis à null
    afin de permettre aux vues de tenir compte de leurs "pseudo" disparitions (suppression de leur dernière référence)
- Phase 0 : compilation du compte : le répertoire a ainsi la liste des avatars avec leurs clés
- Phase 1 : compilation des avatars : le répertoire a ainsi la liste des groupes et couples avec leurs clés
- Phase 2 : détection des avatars disparus et ajoutés, détection des couples et groupes disparus et ajoutés
- Phase 3 : récupération des manquants depuis le serveur et abonnements
*/

export class ProcessQueue extends OperationWS {
  constructor () { super($t('OPsync')) }

  /* Désabonnements des avatars / groupes / couples / cvs non référencées
  */
  async desabonnements (setAv, setGr, setCp, setCv) {
    this.tr(await post(this, 'm1', 'desabonnements', {
      sessionId: data.sessionId,
      lav: Array.from(setAv),
      lgr: Array.from(setGr),
      lcp: Array.from(setCp),
      lcv: Array.from(setCv)
    }))
  }
  
  /************************************
  Remplit TOUJOURS les Set (non null):
  - this.avatarIds: la nouvelle liste des avatars (peut ne pas avoir changée)
  - this.avatarIdsP: ceux en plus
  - this.avatarIdsM: ceux en moins
  Pour les comptes NON comptables :
  - this.tribuIds: la nouvelle liste d'UNE tribu
  - this.tribuIdsM: celle en moins
  - this.tribuIdsP: celle en moins
  */
  async traitementDuCompte () {
    if (this.cache.compte) {
      this.avatarIdsP = new Set()
      this.avatarIdsM = new Set()

      if (!this.session.estComptable) {
        this.tribuIdsM = new Set()
        this.tribuIdsP = new Set()
        const idt = this.cache.compte.nat.id
        if (idt !== this.session.compte.nat.id) {
          // changement de tribu
          const args = { sessionId: this.sessionId, id: idt }
          const ret = this.tr(await post(this, 'm1', 'chargerTribus', args))
          await compileToCache(ret.rowItems, this.cache)
          this.tribuIds = new Set([idt])
          this.tribuIdsM.add(this.session.compte.nat.id)
          this.tribuIdsP.add(idt)
        } else {
          this.tribuIds = new Set([this.session.compte.nat.id])
        }
      }

      // calcul des avatars actuels, en plus et en moins
      const avAvatarIds = this.cache.getCompte(true).avatarIds() // ancienne liste des ids des avatars
      this.avatarIds = this.cache.getCompte().avatarIds() // actuels
      this.avatarIds.forEach(id => { if (!avAvatarIds.has(id)) this.avatarIdsP.add(id) })
      avAvatarIds.forEach(id => { if (!this.avatarIds.has(id)) this.avatarIdsM.add(id) })
  
      // s'il y a des avatars en plus, les charger, eux, leurs comptas et secrets
      for(const id of this.avatarIdsP) {
        const args = { sessionId: this.sessionId, id: id }
        const ret = this.tr(await post(this, 'm1', 'chargerAS', args))
        await compileToCache(ret.rowItems, this.cache)
      }
    } else {
      // liste nouvelle des avatars = liste ancienne
      this.avatarIds = this.cache.getCompte(true).avatarIds()
      this.tribuIds = new Set([this.session.compte.nat.id])
      this.tribuIdsM = new Set()
      this.tribuIdsP = new Set()
    }
  }

  /* Remplit les Set (désormais non null) :
    this.groupeIds: la nouvelle liste des groupes
    this.coupleIds: la nouvelle liste des couples
    this.groupeIdsP: ceux en plus / en moins
    this.coupleIdsP 
    this.groupeIdsM
    this.coupleIdsM
    this.couple2IdsM: couples ne recevant plus de secrets
  */
  async traitementCouplesGroupes () {
    this.groupeIds = new Set()
    this.coupleIds = new Set()
    this.groupeIdsP = new Set()
    this.coupleIdsP = new Set()
    this.groupeIdsM = new Set()
    this.coupleIdsM = new Set()
    this.couple2IdsM = new Set() 

    // ancienne liste des ids des avatars
    const avAvatarIds = this.cache.getCompte(true).avatarIds()
    const avGroupeIds = new Set()
    const avCoupleIds = new Set()

    avAvatarIds.forEach(id => {
      const x = this.cache.getAvatar(id, true)
      x.groupeIds(avGroupeIds)
      x.coupleIds(avCoupleIds)
    })
   
    // calcul des nouvelles listes de groupes et couples
    this.avatarIds.forEach(id => {
      const x = this.cache.getAvatar(id)
      x.groupeIds(this.groupeIds)
      x.coupleIds(this.coupleIds)
    })

    // calcul des groupes et couples en plus et en moins
    this.groupeIds.forEach(id => { if (!avGroupeIds.has(id)) this.groupeIdsP.add(id) })
    avGroupeIds.forEach(id => { if (!this.groupeIds.has(id)) this.groupeIdsM.add(id) })
    this.coupleIds.forEach(id => { if (!avCoupleIds.has(id)) this.coupleIdsP.add(id) })
    avCoupleIds.forEach(id => { if (!this.coupleIds.has(id)) this.coupleIdsM.add(id) })

    // s'il y a des couples en plus, les charger, eux et leurs secrets
    for(const id of this.coupleIdsP) {
      const args = { sessionId: this.sessionId, id: id }
      const ret = this.tr(await post(this, 'm1', 'chargerCS', args))
      await compileToCache(ret.rowItems, this.cache)
    }

    // s'il y a des groupes en plus, les charger, eux, leurs membres et leurs secrets
    for(const id of this.groupeIdsP) {
      const args = { sessionId: this.sessionId, id: id }
      const ret = this.tr(await post(this, 'm1', 'chargerGMS', args))
      await compileToCache(ret.rowItems, this.cache)
    }

    /* Désabonnements des disparus / non référencés (les Moins) */
    if (this.avatarIdsM.size || this.groupeIdsM.size || this.coupleIdsM.size) {
      await this.desabonnements(this.avatarIdsM, this.groupeIdsM, this.coupleIdsM, null)
    }

    /* Il y a des couples qui ont changé de statut
    - soit recevaient des secrets et n'en reçoivent plus
    - soit n'en recevaient pas et en reçoivent désormais
    */
    for (const [pk, cp] in this.cache.couples) { // cp : "nouveau" couple
      const avant = this.cache.getCouple(cp.id, true)
      if (avant && avant.stI === 1 && cp.stI !== 1) {
        // les secrets de cp sont en trop
        this.couple2IdsM.add(cp.id) // pour purge du store
        this.buf.lcc2.add(cp.id) // pour purge de IDB
      }
      if (!avant || (avant && avant.stI === 0 && cp.stI === 1)) {
        // les secrets de cp sont manquants
        const args = { sessionId: this.sessionId, id: cp.id }
        const ret = this.tr(await post(this, 'm1', 'chargerS', args))
        await compileToCache(ret.rowItems, this.cache)
      }
    }
  }
  /*******************************************************************************/
  async run (q) {
    try {
      this.session = stores.session
      this.sessionId = this.session.sessionId
      this.dh = 0
      this.cache = new CacheSync()
      this.buf = new OpBufS()

      // concaténation des syncList reçus et stackées dans items
      const items = []
      q.forEach(syncList => {
        if (syncList.rowItems) syncList.rowItems.forEach((rowItem) => { items.push(rowItem) })
      })
      if (stores.config.debug) console.log(`Synchro - ${dhstring(new Date())} -  ${items.length} items`)

      await compileToCache(items, this.cache)

      this.avatarIds = null // nouvelle liste des avatars (peut ne pas avoir changée)
      this.avatarIdsP = null // ceux en plus
      this.avatarIdsM = null // ceux en moins
    
      this.groupeIds = null // la nouvelle liste des groupes
      this.coupleIds = null // la nouvelle liste des couples
      this.groupeIdsP = null // groupes en plus / en moins
      this.coupleIdsP = null // couples en plus
      this.groupeIdsM = null // groupes en moins
      this.coupleIdsM = null // couples en moins
      this.couple2IdsM = null // couples ne recevant plus de secrets

      this.tribuIds = null // nouvelle liste des ids des tribus
      /* Pour le comptable il ne peut y avoir que des plus
      Pour les autres un plus et un moins en cas de changement de tribu*/
      this.tribuIdsP = null // tribus en plus
      this.tribuIdsM = null // tribus en moins

      this.parrainIds = null // nouvelle liste des ids des parrains des / de la tribus
      this.parrainIdsM = null // parrains en plus
      this.parrainIdsP = null // parrains en moins

      /************************************
      Remplit TOUJOURS les Set (désormais non null):
      - this.avatarIds : la nouvelle liste des avatars (peut ne pas avoir changée)
      - this.avatarIdsP : ceux en plus
      - this.avatarIdsM : ceux en moins
      Pour les comptes NON comptables :
      - this.tribuIds: la nouvelle liste d'UNE tribu
      - this.tribuIdsM: celle en moins
      - this.tribuIdsP: celle en moins
      */
      await this.traitementDuCompte()

      if (this.cache.avatars.size || (this.avatarIdsP && this.avatarIdsP.size)
        || (this.avatarIdsM && this.avatarIdsM.size)) {
        /* Remplit les Set désormais non null :
          this.groupeIds: la nouvelle liste des groupes
          this.coupleIds: la nouvelle liste des couples
          this.groupeIdsP: ceux en plus / en moins
          this.coupleIdsP 
          this.groupeIdsM
          this.coupleIdsM
          this.couple2IdsM: couples ne recevant plus de secrets
        */
        await this.traitementCouplesGroupes()
      }

      /* 
      Pour le comptable SEULEMENT (pour les autres ça a été fait dans traitementDuCompte())
      Calcul des tribus nouvelles et en plus (il n'y en a pas en moins)
      */
      if (this.session.estComptable && this.cache.tribus.size) {
        const tribu = stores.tribu
        this.tribuIds = new Set()
        this.tribuIdsP = new Set()
        this.tribuIdsM = new Set()
        tribu.getIds.forEach(id => { this.tribuIds.add(id) })
        for (const [pk, obj] of this.cache.tribus) {
          if (!tribu.getTribu(obj.id)) this.tribuIdsP.add(obj.id)
          this.tribuIds.add(obj.id)
        }
      }

      /*
      Calcul de la liste des parrains 
      - this.parrainIds: la nouvelle liste
      - this.parrainIdsP: ceux en plus
      - this.parrainIdsM: ceux en moins
      tribuIds contient la nouvelle liste des tribus et a été replie :
      - pour le comptable juste ci-dessus
      - pour les autres à détection du changement de tribu dans traitementDuCompte()
      */
      if (this.cache.tribus.size) { // changement d'une tribu ou de la tribu dans le compte
        const avParrainIds = new Set() // ancienne liste de parrains
        this.parrainIds = new Set() // nouvelle liste de parrains
        this.parrainIdsM = new Set() // parrains en moins
        this.parrainIdsP = new Set() // parrains en plus
        const stt = stores.tribu

        stt.getIds.forEach(id => { 
          const t = stt.getTribu(id)
          t.idParrains(avParrainIds)
        })
  
        this.tribuIds.forEach(id => {
          const t = this.cache.getTribu(id)
          t.idParrains(this.parrainIds)
        })
        this.parrainIds.forEach(id => { if (!avParrainIds.has(id)) this.parrainIdsP.add(id) })
        avParrainIds.forEach(id => { if (!this.parrainIds.has(id)) this.parrainIdsM.add(id) })
      }

      /* Préparation des suppressions de masse de IDB */
      if (this.avatarIdsM && this.avatarIdsM.size) this.buf.lav = Array.from(this.avatarIdsM)
      if (this.groupeIdsM && this.groupeIdsM.size) this.buf.lgr = Array.from(this.groupeIdsM)
      if (this.coupleIdsM && this.coupleIdsM.size) this.buf.lcc = Array.from(this.coupleIdsM)

      /* cv manquantes:
      - des avatars ajoutés
      - des groupes ajoutés
      - des membres mis à jour
      - des couples mis à jour
      - des parrains de la / des tribus mises à jour / ajoutées
      */
      this.cvsP = new Set()
      if (this.avatarIdsP) {
        this.avatarIdsP.forEach(id => { this.cvsP.add(id) })
      }
      if (this.groupeIdsP) {
        this.groupeIdsP.forEach(id => { this.cvsP.add(id) })
      }
      if (this.cache.membres) {
        this.cache.membres.forEach(membre => { this.cvsP.add(membre.namb.id) })
      }
      if (this.cache.couples) {
        this.cache.couples.forEach(couple => { const x = couple.idE;  if (x) this.cvsP.add(x) })
      }
      if (this.parrainIdsP) { 
        this.parrainIdsP.forEach(id => { this.cvsP.add(id) }) 
      }

      if (this.cvsP.size) {
        const l2 = Array.from(this.cvsP)
        const args = { sessionId: this.sessionId, v : 0, l1 : [], l2 }
        const ret = this.tr(await post(this, 'm1', 'chargerCVs', args))
        await compileToCache(ret.rowItems, this.cache)
      }

      /* 
      Toutes les cv manquantes chargées et abonnées
      Détection des membres et couples "disparus" :
      - une CV est mise à jour avec x != 0
      - on récupère les membres et contacts associés à cette CV
      et on fait inscrire leur statut à disparu
      */
      const people = stores.people
      for(const [id, cv] of this.cache.cvs) {
        if (!cv.x) continue
        const lm = people.getMbIds(id)
        for(const mid of lm) {
          const args = { sessionId: this.sessionId, id: mid[0], im: mid[1] }
          const ret = this.tr(await post(this, 'm1', 'membreDisparu', args))
          await compileToCache(ret.rowItems, this.cache)
        }
        const lc = people.getCpIds(id)
        for(const idc of lc) {
          const c = this.cache.getCouple(idc)
          const args = { sessionId: this.sessionId, id: idc, idx: c.avc ? 1 : 0 }
          const ret = this.tr(await post(this, 'm1', 'coupleDisparu', args))
          await compileToCache(ret.rowItems, this.cache)
        }
      }

      /* Mise à jour IDB *************************************************/
      if (this.session.synchro) {
        if (this.cache.compte) this.buf.putIDB(this.cache.compte)
        if (this.cache.prefs) this.buf.putIDB(this.cache.prefs)

        for (const [pk, obj] of this.cache.tribus) this.buf.putIDB(obj)
        for (const [pk, obj] of this.cache.avatars) this.buf.putIDB(obj)
        for (const [pk, obj] of this.cache.groupes) {
          if (!obj.estZombi) {
            this.buf.putIDB(obj)
          } else {
            this.buf.supprIDB({ table: 'groupe', id: obj.id })
            this.buf.lgr.add(obj.id)
          }
        }
        for (const [pk, obj] of this.cache.couples) this.buf.putIDB(obj)
        for (const [pk, obj] of this.cache.membres) this.buf.putIDB(obj)
        for (const [pk, obj] of this.cache.secrets) {
          if (obj.suppr) {
            this.buf.supprIDB(obj) // mais supprimé de IDB
          } else {
            this.buf.putIDB(obj)
          }
        }
        for (const [pk, obj] of this.cache.cvs) this.buf.putIDB(obj)
        for (const [pk, obj] of this.cache.tribus) this.buf.putIDB(obj)
        await commitRows(this.buf)
      }

      /* SANS AWAIT mise à jour des stores en une fois *******************
      AFIN qu'ils soient consistents entre eux */
      {
        if (this.cache.compte) this.session.setCompte(this.cache.compte)
        if (this.cache.prefs) this.session.setPrefs(this.cache.prefs)
        for (const [pk, obj] of this.cache.avatars) stores.avatar.setAvatar(obj)
        for (const [pk, obj] of this.cache.groupes) {
          if (!obj.estZombi) {
            stores.groupe.setGroupe(obj)
          } else {
            stores.groupe.delGroupe(obj.id)
          }
        }
        for (const [pk, obj] of this.cache.couples) stores.couple.setCouple(obj)
        for (const [pk, obj] of this.cache.membres) stores.groupe.setMembre(obj)
        for (const [pk, obj] of this.cache.secrets) {
          if (obj.suppr) {
            delSecret(obj.id, obj.ns)
          } else {
            if (this.session.synchro) this.buf.mapSec[obj.pk] = obj
            setSecret(obj)
          }
        }
        for (const [pk, obj] of this.cache.cvs) setCv(obj)
        for (const [pk, obj] of this.cache.tribus) stores.tribu.setTribu(obj)

        if (this.avatarIdsM) for (const id of this.avatarIdsM) stores.avatar.del(id)
        if (this.groupeIdsM) for (const id of this.groupeIdsM) stores.groupe.del(id)
        if (this.coupleIdsM) for (const id of this.coupleIdsM) stores.couple.del(id)
        if (this.couple2IdsM) for (const id of this.couple2IdsM) stores.couple.delSecrets(id)
        /* gestion de l'indicateur "parrain" dans les CV */
        const c = this.session.compte
        const pst = stores.people
        if (this.parrainIdsP) {
          this.parrainIdsP.forEach(id => {
            if (!c.estAc(id)) pst.setParrain(id, true)
          })
        }
        if (this.parrainIdsM) {
          this.parrainIdsM.forEach(id => {
            if (!c.estAc(id)) pst.setParrain(id, false)
          })
        }
      }

      /*******************************************************************
      A la fin, sur des stores committés :
      - opérations pour retirer les groupes zombis des références dans les avatars
      - traitement des invitgr et invitcp
      - traitement des fichiers accessibles en avion
      - si changement de blocage, pop-up avec reconnexion
      */
      const zombis = new Set()
      for (const [id, gr] of this.cache.groupes) {
        if (gr.estZombi) this.zombis.add(gr.id)
      }
      if (zombis.size) await this.groupesZombis(zombis)

      // Invitgr : post de traitement pour maj de la liste des groupes dans l'avatar invité
      if (this.cache.invitgrs.size) {
        const lst = []
        for (const [pk, obj] of this.cache.invitgrs) lst.push(obj)
        await this.traitInvitGr(lst)
      }

      // Invitcp : post de traitement pour maj de la liste des couples dans l'avatar invité
      if (this.cache.invitcps.size) {
        const lst = []
        for (const [pk, obj] of this.cache.invitcps) lst.push(obj)
        await this.traitInvitCp(lst)
      }

      if (this.session.synchro) await gestionFichierSync(this.buf.mapSec)

      if (!this.session.estComptable) {
        const tribuCpt = this.cache.tribu // si changée
        const comptaCpt = this.cache.comptas.get(this.session.compte.id) // si changée
        if (tribuCpt || comptaCpt) await getBlocage(tribuCpt, comptaCpt, true)
      }

      if (this.session.synchro) this.session.sessionSync.setDhSync(this.dh || new Date().getTime())
    } catch (e) {
      await stores.ui.afficherExc(appexc(e))
    }
  }
}
