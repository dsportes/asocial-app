import { boot } from 'quasar/wrappers'
const pako = require('pako')

import { setRequiredModules } from '../app/util.mjs'

import stores from '../stores/stores.mjs'
import { aidetm } from '../app/help.mjs'
import { config } from '../app/config.mjs'

export default boot(async ({ app /* Vue */ }) => {
  const cfg = {}
  for(const x in config) cfg[x] = config[x]

  cfg.build = process.env.BUILD
  cfg.debug = process.env.DEBUGGING
  cfg.dev = process.env.DEV
  cfg.opsrv = process.env.OPSRV
  cfg.wssrv = process.env.WSSRV
  console.log('debug:' + cfg.debug + ' dev:' + cfg.dev + ' build:' + cfg.build)
  console.log('opsrv: ' + cfg.opsrv + ' --- wssrv: ' + cfg.wssrv)

  cfg.aide = {}
  for(const p in aidetm) {
    const e = aidetm[p]
    const x = {}
    for(const lg in e.titre) {
      try {
        x[lg] = require('../assets/help/' + p + '_' + lg + '.md').default
      } catch (e) { }
    }
    cfg.aide[p] = x
  }
  
  cfg.locales = []
  cfg.localeOptions.forEach(t => {cfg.locales.push(t.value)})

  const mc = cfg['motscles']
  cfg.motsclesloc = {}
  cfg.locales.forEach(l => { 
    const lmc = {}
    cfg.motsclesloc[l] = lmc
    for (const idx in mc) {
      const e = mc[idx]
      let val = e[l]
      if (!val) val = e[cfg.locale]
      if (val) lmc[idx] = val
    }
  })

  cfg.logo = require('../assets/logo.png')
  cfg.cliccamera = require('../assets/cliccamera.b64').default
  cfg.iconAvatar = require('../assets/avatar.jpg')
  cfg.iconGroupe = require('../assets/groupe.jpg')
  cfg.iconSuperman = require('../assets/superman.jpg')

  stores.config.setConfig(cfg)

  setRequiredModules({ pako: pako })
})
