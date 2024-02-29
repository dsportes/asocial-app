
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

