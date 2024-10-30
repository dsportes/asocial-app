import { AppExc, appexc } from './api.mjs'
import { $t } from './util.mjs'
import stores from '../stores/stores.mjs'
import { post } from '../app/net.mjs'

/* Opération générique ******************************************/
export class Operation {
  constructor (nomop) { 
    this.nom = nomop 
    this.modeSync = this.nom.startsWith('Sync')
    if (!this.modeSync) {
      stores.session.startOp(this)
      this.cancelToken = null
      this.break = false
      this.nbretry = 0
    }
  }

  async getPub (id, org) {
    try {
      if (org) {
        const ret = await post(null, 'GetPubOrg', { id, org })
        return ret.pub
      } else {
        const session = stores.session
        const args = { token: session.authToken, id }
        const ret = await post(null, 'GetPub', args)
        return ret.pub
      }
    } catch (e) {
      throw appexc(e)
    }
  }

  get label () { 
    // console.log('label', 'OP_' + this.nom)
    return $t('OP_' + this.nom) 
  }

  //Utilisé dans PlusTicket
  async retry () {
    if (this.modeSync) return
    if (this.nbretry++ > 5) 
      throw new AppExc(E_BRO, 21, [this.label])
    if (this.retry > 1) await sleep((this.retry * 300))
    return true
  }

  BRK () { 
    if (this.modeSync) return
    if (this.break) throw new AppExc(E_BRK, 0)
  }

  stop () {
    if (this.modeSync) return
    if (this.cancelToken) {
      this.cancelToken.cancel('break')
      this.cancelToken = null
    }
    this.break = true
  }

  finOK (res, silence) {
    if (!this.modeSync) {
      const session = stores.session
      session.finOp()
      // if (!silence) stores.ui.afficherMessage($t('OPok', [this.label]), false)
    }
    return res
  }

  async finKO (e) {
    const session = stores.session
    const exc = appexc(e)
    if (this.modeSync || ( exc.code > 8990 && exc.code < 9000)) {
      // en mode Sync toutes les exceptions sont "tueuses"
      session.setExcKO(exc)
      session.finOp()
      stores.ui.setPage('clos') 
      return
    }

    session.finOp()
    const ui = stores.ui
    ui.afficherMessage($t('OPko', [this.label]), true)
    await ui.afficherExc(exc)
    throw exc
  }
}
