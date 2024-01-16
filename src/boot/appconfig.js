import { boot } from 'quasar/wrappers'
const pako = require('pako')
import { setRequiredModules } from '../app/util.mjs'

import stores from '../stores/stores.mjs'
import { aidetm } from '../app/help.mjs'
import { config } from '../app/config.mjs'

// import { fromByteArray } from '../app/base64.mjs'
// const encoder = new TextEncoder('utf-8')

export function getImgUrl (name) {
  try {
    if (name.endsWith('.svg')) {
      /* 
      Pour un .svg le require retourne un texte [bla bla ="data:image ..."]
      Pourquoi ? alors qu'avec un txt on a son texte 
      */
      const n = name // .replace('.svg', '.txt')
      const x = require('../assets/help/' + n)
      if (!x) return require('../assets/help/defaut.png')
      const i = x.indexOf('data:image')
      return x.substring(i, x.length - 1)
      /* pour un txt, il faut le convertir en base64
      return 'data:image/svg+xml;base64,' + fromByteArray(encoder.encode(x))
      */
    }
    const x = require('../assets/help/' + name)
    if (x) return x
    return require('../assets/help/defaut.png')
  } catch (e) { 
    return require('../assets/help/defaut.png')
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
        const y = require('../assets/help/' + p + '_' + lg + '.md')
        x[lg] = y
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
  cfg.cliccamera = require('../assets/cliccamera.b64')
  cfg.iconAvatar = require('../assets/avatar.jpg')
  cfg.iconGroupe = require('../assets/groupe.jpg')
  cfg.iconSuperman = require('../assets/superman.jpg')

  stores.config.setConfig(cfg)

  setRequiredModules({ pako: pako })
})
