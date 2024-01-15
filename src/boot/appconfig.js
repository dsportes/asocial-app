import { boot } from 'quasar/wrappers'
const pako = require('pako')
import { setRequiredModules } from '../app/util.mjs'

import stores from '../stores/stores.mjs'
import { aidetm } from '../app/help.mjs'
import { config } from '../app/config.mjs'
import { fromByteArray } from '../app/base64.mjs'


const encoder = new TextEncoder('utf-8')

export function getImgUrl (name) {
  try {
    if (name.endsWith('.svg')) {
      const x = require('../assets/images/' + name.replace('.svg', '.txt')).default
      if (!x) return require('../assets/defaut.png')
      return 'data:image/svg+xml;base64,' + fromByteArray(encoder.encode(x))
    }
    const x = require('../assets/images/' + name)
    if (x) return x
    return require('../assets/defaut.png')
  } catch (e) { 
    return require('../assets/defaut.png')
  }
}

export default boot(async ({ app /* Vue */ }) => {
  const cfg = {}
  for(const x in config) cfg[x] = config[x]

  console.log('debug:' + (cfg.DEBUG ? true : false) +
    ' dev:' + (cfg.DEV ? true : false) + ' build:' + cfg.BUILD)

  cfg.search = window.location.search.replace('?', '')

  const h = window.location.host
  cfg.srv = config.SRV ? config.SRV : h
  console.log('SRV depuis ' + (config.SRV ? ' config: ': 'location: ') + cfg.srv)

  cfg.opsrv = config.OPSRV ? config.OPSRV : ('https://' + cfg.srv + '/op/')
  cfg.wssrv = config.WSSRV ? config.WSSRV : ('wss://' + cfg.srv + '/ws/')
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
  // const b64 = getImgUrl('logo.svg')
  // console.log('started')
})
