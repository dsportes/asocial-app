import stores from '../stores/stores.mjs'
import { encode } from '@msgpack/msgpack'

import { ID, AppExc, E_WS } from './api.mjs'
import { crypter } from './webcrypto.mjs'
import { post, putData, getData } from './net.mjs'
import { Chat, Compta, Note, getCle } from './modele.mjs'
import { Operation } from './synchro.mjs'

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
