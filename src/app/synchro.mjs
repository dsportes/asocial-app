import { afficherDiag } from './util.mjs'
import { idb, openIDB, deleteIDB } from './db.mjs'
import { OperationUI } from './operations.mjs'

class Queue {
  constructor () {
    this.dataSync = null // dataSync courant de la session. Maj au retour de Sync

    this.job = null // traitement en cours

    // version des rds arrivés et pas encore traités
    this.compte = { rds: 0, row: null }
    this.compta = { rds: 0, row: null }
    this.espace = { rds: 0, row: null }
    this.partition = { rds: 0, row: null }
    this.avatars = new Map() // cle: rds, valeur: version
    this.groupes = new Map()
  }

  postResp (r) {
    if (this.compta.v > v) return // la dernière version est à obtenir
    this.compta.v = v
    this.rowCompta = row || null
    this.reveil()
  }

  setRows (rows) { // Arrivée de rows versions
    if (rows) rows.forEach(row => {
      const nom = Rds.typeS(row.rds)
      switch (nom) {
      case 'comptes' : {
        if (this.compte.v < row.v) { this.compte.v = row.v; this.compte.row = null }
        break
      }
      case 'comptas' : {
        if (this.compta.v < row.v) { this.compta.v = row.v; this.compta.row = null }
        break
      }
      case 'espaces' : {
        if (this.espace < row.v) { this.espace.v = row.v; this.espace.row = null }
        break
      }
      case 'partitions' : {
        if (this.partition < row.v) { this.partition.v = row.v; this.partition.row = null }
        break
      }
      case 'avatars' : {
        const x = this.avatars.get(row.rds)
        if (!x || x < row.v) this.avatars.set(row.rds, row.v)
        break
      }
      case 'groupes' : {
        const x = this.groupes.get(row.rds)
        if (!x || x < row.v) this.groupes.set(row.rds, row.v)
        break
      }
      }
      this.reveil()
    })
  }

  get CCEPtodo () {
    return this.compte.v || this.compta.v || this.espace.v || this.partition.v
  }

  reveil () {
    if (this.job || !stores.session.ok) return
    if (this.CCEPtodo) {
      this.job = new Job(1)
      const ccep = {
        compte: { ...this.compte },
        compta: { ...this.compta },
        espace: { ...this.espace },
        partition: { ...this.partition }
      }
      setTimeout(() => this.job.doCcep(ccep), 5)
      return
    }
    if (this.this.avatars.size) {
      this.job = new Job(2)
      for (const [rds, v] of this.avatars) {
        setTimeout(() => this.job.doAvatar(rds, v), 5)
        break
      }
      return
    }
    if (this.this.groupes.size) {
      this.job = new Job(3)
      for (const [rds, v] of this.groupes) {
        setTimeout(() => this.job.doGroupe(rds, v), 5)
        break
      }
      return
    }
  }

  finJob () {
    this.job = null
    this.reveil()
  }

  finAv (rds, v) {
    const x = this.avatars.get(rds)
    if (x && x.v <= v) this.avatars.delete(rds)
    this.finJob()
  }

  finGr (rds, v) {
    const x = this.groupes.get(rds)
    if (x && x.v <= v) this.avatars.delete(rds)
    this.finJob()
  }

  finCcep (ccep) {
    if (this.ccep.compte.v <= ccep.compte.v) this.ccep.compte.v = { v: 0, row: null }
    if (this.ccep.compta.v <= ccep.compta.v) this.ccep.compta.v = { v: 0, row: null }
    if (this.ccep.espace.v <= ccep.espace.v) this.ccep.espace.v = { v: 0, row: null }
    if (this.ccep.partition.v <= ccep.partition.v) this.ccep.partition.v = { v: 0, row: null }
    this.finJob()
  }
}
export const syncQueue = new Queue()

class Job {
  // type: 1:CCEP 2:avatar 3:groupe
  constructor (type) { this.type = type }

  async doCcep(ccep) {
    // TODO
    syncQueue.finCcep(ccep)
  }

  async doAvatar(rds, v) {
    // TODO
    syncQueue.finAv(rds, v)
  }

  async doGroupe(rds, v) {
    // TODO
    syncQueue.finGr(rds, v)
  }

}

/* Déconnexion, reconexion, commexion *************************************************/
/* garderMode : si true, garder le mode */
export function deconnexion(garderMode) {
  const ui = stores.ui
  // ui.setPage('null')
  const session = stores.session
  const mode = session.mode
  const org = session.org

  if (session.accesIdb) closeIDB()
  if (session.accesNet) {
    if (session.fsSync) session.fsSync.close(); else closeWS()
  }
  stores.reset() // Y compris session
  if (garderMode) session.setMode(mode)
  session.org = org
  SyncQueue.reset()
  ui.setPage('login')
}

export async function reconnexion() {
  const session = stores.session
  const phrase = session.phrase
  deconnexion(true)
  await connexion(phrase)
}

/* Connexion depuis PageLogin ou reconnexion *****************************/
export async function connexion(phrase, razdb) {
  if (!phrase) return
  const session = stores.session
  await session.initSession(phrase)

  if (session.avion) 
    await connexionAvion(phrase)
  else {
    if (razdb && session.synchro && session.nombase)
      await deleteIDB(session.nombase)
    try { await new ConnexionSynchroIncognito().run() } catch (e) { /* */ }
  }
}

/* Connexion à un compte en mode avion *************************************************/
export async function connexionAvion(phrase) {
  if (!session.nombase) { // nom base pas trouvé en localStorage de clé lsk
    await afficherDiag($t('OPmsg1'))
    deconnexion(true)
    return
  }
  try {
    await openIDB()
  } catch (e) {
    await afficherDiag($t('OPmsg2', [e.message]))
    deconnexion()
    return
  }
  if (!await idb.getBoot()) { // false si KO - init compteId et clek
    await afficherDiag($t('OPmsg3'))
    deconnexion()
    return
  }
  // compteId et clek sont fixées
  // TODO suite
}

/* Connexion à un compte en mode synchro ou incognito *********************************/
export class ConnexionSynchroIncognito extends OperationUI {
  constructor() { super('ConnexionCompte') }

  async run() {
    try {
      this.auj = AMJ.amjUtc()
      this.buf = new IDBbuffer()
      this.dh = 0

      const session = stores.session
      const aSt = stores.avatar
      const gSt = stores.groupe

      this.finOK()
    } catch (e) {
      stores.ui.setPage('login')
      await this.finKO(e)
    }
  }
}

/*   OP_AcceptationSponsoring: 'Acceptation d\'un sponsoring et création d\'un nouveau compte'
POST:
- `token` : éléments d'authentification du compte à créer
- `rowCompta` : row du compte à créer.
- `rowAvatar` : row de son avatar principal.
- `rowVersion` : row de avatar en création.
- `idt` : id de sa tribu. 0 SI compte A
- `ids` : ids du sponsoring, hash de sa phrase de reconnaissance qui permet de retrouver le sponsoring.
- `rowChatI` : row chat _interne_ pour le compte en création donnant le message de remerciement au sponsor.
- `rowChatE` : row chat _externe_ pour le sponsor avec le même message. La version est obtenue par le serveur.
- `ardx` : texte de l'ardoise du sponsoring à mettre à jour (avec statut 2 accepté), copie du texte du chat échangé.
- `act`: élément de la map act de sa tribu. null SI compte A

Retour: rows permettant d'initialiser la session avec le nouveau compte qui se trouvera ainsi connecté.
- `rowTribu`
- `rowChat` : le chat _interne_, celui concernant le compte.
- `credentials` : données d'authentification permettant à la session d'accéder au serveur de données Firestore.
- `rowEspace` : row de l'espace, informations générales / statistiques de l'espace et présence de la notification générale éventuelle.

Exceptions:
- `F_SRV, 8` : il n'y a pas de sponsoring ayant ids comme hash de phrase de connexion.
- `F_SRV, 9` : le sponsoring a déjà été accepté ou refusé ou est hors limite.

Assertions:
- existence du row `Tribus`,
- existence du row `Versions` du compte sponsor.
- existence du row `Avatars` du sponsorisé.
- existence du row `Espaces`.
*/
export class AcceptationSponsoring extends OperationUI {
  constructor() { super('AcceptationSponsoring') }

  async run(sp, ardx, txt1, txt2, ps, don, dconf) {
    /* sp : objet Sponsoring
    - id ids : identifiant
    - `ard`: ardoise.
    - 'dlv': 
    - 'sp': est sponsor
    - `na` : du sponsor P.
    - `cv` : du sponsor P.
    - `naf` : na attribué au filleul.
    - 'cletX' : cle de sa tribu cryptée par clé K du comptable
    - `clet` : cle de sa tribu. 0 pour compte A
    - 'don' : don du sponsor
    - 'dconf' : confidentialité requise par le sponsor
    ardx : texte du sponsorisé crypté par la cleX du sponsoring
    txt1 : texte du sponsor
    txt2 : texte du sponsorisé
    ps : phrase secrète du nouveau compte
    don : montant du don
    dconf: si true le sponsorisé refuse le chat
    */
    try {
      // LE COMPTE EST CELUI DU FILLEUL
      const session = stores.session
      session.setOrg(sp.org)
      await session.initSession(ps)
      session.setIdCleK(sp.id, random(32)) 

      this.auj = AMJ.amjUtc()
      this.buf = new IDBbuffer()
      this.dh = 0

      // TODO
      // await crypter(ps.pcb, session.clek)
      const aSt = stores.avatar

      const rowEspace = await new GetEspace().run()
      let espace = await compile(rowEspace)
      session.setEspace(espace)

      /* Réenregistrement dans repertoire des na créé en PageLogin */
      NomGenerique.from(sp.na.anr)
      NomGenerique.from(sp.naf.anr)
      const idt = sp.clet ? setClet(sp.clet) : 0

      session.setCompteId(sp.naf.id)
      session.setTribuId(idt)
      session.setAvatarId(session.compteId)

      const aChat = sp.clet || (!sp.clet && !sp.dconf && !dconf)

      const { publicKey, privateKey } = await genKeyPair()

      // !!! dans rowCompta: it (indice du compte dans sa tribu) N'EST PAS inscrit
      // (na, clet, cletX, q1, q2, estSponsor, phrase, nc) - le filleul a 1 chat en ligne
      let { dlv, rowCompta } = await Compta.row(sp.naf, sp.clet, sp.cletX, sp.quotas, sp.sp, session.ns, ps, 1, don)
      // session.clek est fixée

      if (dlv < session.auj) throw new AppException(F_BRO, 13)

      const rowAvatar = await Avatar.primaireRow(sp.naf, publicKey, privateKey)
      const rowVersion = { id: sp.naf.id, v: 1, dlv: dlv }
      const _data_ = new Uint8Array(encode(rowVersion))
      rowVersion._data_ = _data_
      rowVersion._nom = 'versions'

      /* Element de act de tribu du nouveau compte
      - `idT` : id court du compte crypté par la clé de la tribu.
      - `sp` : est sponsor ou non.
      - `stn` : statut de la notification _du compte_: _aucune simple bloquante_
      - `qc q1 q2` : quotas attribués.
      - `ca v1 v2` : volumes **approximatifs** effectivement utilisés
      */
      let act = null
      if (sp.clet) act = {
        idT: await crypter(sp.clet, '' + ID.court(sp.naf.id)),
        nasp: sp.sp ? await crypter(sp.clet, new Uint8Array(encode(sp.naf.anr))) : null,
        notif: null,
        stn: 0,
        qc: sp.quotas[0],
        q1: sp.quotas[1],
        q2: sp.quotas[2],
        ca: 0,
        v1: 0,
        v2: 0
      }

      // chatI : chat pour le compte, chatE : chat pour son sponsor
      const naI = sp.naf
      const naE = sp.na
      const cc = random(32)
      const pubE = await aSt.getPub(sp.na.id)
      if (!pubE) throw new AppExc(F_BRO, 7)

      const args = !aChat ? {
        token: session.authToken, 
        rowCompta, rowAvatar, rowVersion,
        ids: sp.ids,
        ardx, idt, act,
        abPlus: [idt, sp.naf.id],
        idI: 0
      } : { 
        token: session.authToken, 
        rowCompta, rowAvatar, rowVersion,
        ids: sp.ids,
        ardx, idt, act,
        abPlus: [idt, sp.naf.id],

        idI : naI.id,
        idsI : await Chat.getIds(naI, naE),
        idE : naE.id, 
        idsE : await Chat.getIds(naE, naI), 
        ccKI : await crypter(session.clek, cc), 
        ccPE : await crypterRSA(pubE, cc),
        naccI : await crypter(cc, encode([naI.nom, naI.rnd])),
        naccE : await crypter(cc, encode([naE.nom, naE.rnd])),
        txt1 : await Chat.getTxtCC(cc, txt1),
        lgtxt1 : txt1.length,
        txt2 : await Chat.getTxtCC(cc, txt2),
        lgtxt2 : txt2.length
      }

      const ret = this.tr(await post(this, 'AcceptationSponsoring', args))
      // Retourne: credentials, rowTribu

      espace = await compile(ret.rowEspace)
      session.setEspace(espace)
      session.setOrg(espace.org)
      if (session.estClos) {
        this.ui.setPage('clos')
        this.finOK()
      }

      if (session.fsSync && ret.credentials) {
        await session.fsSync.open(ret.credentials, ret.fsEmulator || 0)
      }

      const rowTribu = ret.rowTribu
      const rowChat = ret.rowChat
      rowCompta = ret.rowCompta
      
      // Le compte vient d'être créé, clek est enregistrée par la création de rowCompta
      const compta = await compile(rowCompta)
      const avatar = await compile(rowAvatar)
      const tribu = rowTribu ? await compile(rowTribu) : null

      aSt.setCompte(avatar, compta, tribu)

      if (rowChat) {
        const chat = await compile(rowChat)
        aSt.setChat(chat)
      }

      Versions.reset()
      Versions.set(session.compteId, { v: 1 })

      if (session.synchro) {
        try {
          await session.setNombase()
          await openIDB()
          // setTrigramme(session.nombase, avatar.na.nomc)
          setTrigramme(session.nombase, await getTrigramme())
          lectureSessionSyncIdb()
          // Finalisation en une seule fois de l'écriture du nouvel état en IDB
          this.buf.putIDB(rowCompta)
          this.buf.putIDB(rowAvatar)
          this.buf.putIDB(rowChatI)
          if (rowTribu) this.buf.putIDB(rowTribu)
          await this.buf.commitIDB(true, true) // MAJ compte.id / cle K et versions
          await session.sessionSync.setConnexion(this.dh)
        } catch (e) {
          session.mode = 2
          await afficherDiag(this.$t('LOGnoidb'))
        }
      }

      if (session.fsSync) {
        /* sql, le serveur a enregistré d'office à la connexion l'abonnement 
        au compte et à sa tribu
        mais en fs c'est à faire explicitement en session */
        await session.fsSync.setCompte(session.compteId)
        if (rowTribu) await session.fsSync.setTribu(session.tribuId)
      }

      console.log('Connexion compte : ' + session.compteId)
      session.setStatus(2)
      stores.ui.setPage('accueil')
      setTimeout(() => {
        SyncQueue.traiterQueue()
        Demon.start()
      }, 50)
      this.finOK()
    } catch (e) {
      await this.finKO(e)
    }
  }
}
