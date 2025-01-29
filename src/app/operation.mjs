import { AppExc, appexc } from './api.mjs'
import { $t } from './util.mjs'
import stores from '../stores/stores.mjs'
import { post } from '../app/net.mjs'

/* Opération générique ******************************************/
export class Operation {
  constructor (nomop, modeSync) { 
    this.nom = nomop 
    this.modeSync = modeSync || false
    if (!modeSync) {
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
    await ui.afficherExc(exc)
    throw exc
  }
}
