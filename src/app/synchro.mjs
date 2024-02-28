
class Queue {
  constructor () {
    this.job = null // traitement en cours

    // version des rds arrivés et pas encore traités
    this.compte = 0
    this.compta = 0
    this.rowCompta = null // pour compta, le post a retourné un row
    this.espace = 0
    this.partition = 0
    this.avatars = new Map() // cle: rds, valeur: version
    this.groupes = new Map()
  }

  setCompta (v, row) {
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
        if (this.compte < row.v) this.compte = row.v
        break
      }
      case 'comptas' : {
        if (this.compta < row.v) {
          this.compta = row.v
          this.rowCompta = null
        }
        break
      }
      case 'espaces' : {
        if (this.espace < row.v) this.espace = row.v
        break
      }
      case 'partitions' : {
        if (this.partition < row.v) this.partition = row.v
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
    return this.compte || this.compta || this.espace || this.partition
  }

  reveil () {
    if (this.job || !stores.session.ok) return
    if (this.CCEPtodo) {
      this.job = new Job(1)
      setTimeout(() => this.job.doCcep(this.compte, this.compta, this.rowCompta, this.espace, this.partition), 5)
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

}
export const syncQueue = new Queue()

class Job {
  // type: 1:CCEP 2:avatar 3:groupe
  constructor (type) { this.type = type }

  async doCcep(vcompte, vcompta, rowCompta, vespace, vpartition) {
    // TODO
    syncQueue.finJob()
  }

  async doAvatar(rds, v) {
    // TODO
    syncQueue.finJob()
  }

  async doAvgroupeatar(rds, v) {
    // TODO
    syncQueue.finJob()
  }

}