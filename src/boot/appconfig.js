import { boot } from 'quasar/wrappers'
const pako = require('pako')

import { setRequiredModules } from '../app/util.mjs'
import { Tarif } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
import { config } from '../app/config.mjs'

export function getImgUrl (name) {
  try {
    const x = require('../assets/help/' + name)
    return x ? x : require('../assets/help/defaut.png')
  } catch (e) { 
    return require('../assets/help/defaut.png')
  }
}

export function getMd (page, lang) {
  try {
    let x = require('../assets/help/' + page + '_' + lang + '.md')
    if (x) return x
    if (lang !== 'fr-FR') x = require('../assets/help/' + page + '_fr-FR.md')
    if (x) return x
    return require('../assets/help/bientot_' + lang + '.md')
  } catch (e) { 
    return require('../assets/help/bientot_' + lang + '.md')
  }
}

export default boot(async ({ app /* Vue */ }) => {
  const cfg = {}
  for(const x in config) cfg[x] = config[x]

  console.log('debug:' + (cfg.DEBUG ? true : false) +
    ' dev:' + (cfg.DEV ? true : false) + ' build:' + cfg.BUILD)

  Tarif.tarifs = cfg.tarifs
  
  cfg.search = window.location.search.replace('?', '')

  cfg.host = window.location.host

  if (process.env.OPSRV) {
    cfg.opsrv = process.env.OPSRV
    console.log('OPSRV depuis ENV: ' + cfg.opsrv)
  } else {
    cfg.opsrv = 'https://' + cfg.host + '/op/'
    console.log('OPSRV depuis location.host: ' + cfg.opsrv)
  }

  if (config.hasWS) {
    if (process.env.WSSRV) {
      cfg.wssrv = process.env.WSSRV
      console.log('OPSRV depuis ENV: ' + cfg.wssrv)
    } else {
      cfg.wssrv = 'wss://' + cfg.host + '/ws/'
      console.log('WSSRV depuis location.host: ' + cfg.wssrv)
    }  
  }

  console.log('Mode silencieux: ' + (cfg['silence'] ? 'oui' : 'non'))

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
  cfg.iconAvatar = require('../assets/avatar.jpg')
  cfg.iconGroupe = require('../assets/groupe.jpg')
  cfg.iconSuperman = require('../assets/superman.jpg')
  cfg.logoSvg = require('../assets/logo.svg') // Taitement spécial Webpack (quasar.config.js)

  /* N'importe quel binaire en .bin peut être chargé en dataURL:
  - son MIME est 'application/octet-stream'
  - pour le rendre utilisable il faut lui donner son 'vrai' type
  Ici cliccamera est un pur .mp3
  */
  cfg.cliccamera = require('../assets/cliccamera.bin')
    .replace('application/octet-stream', 'audio/mpeg')
  cfg.beep = require('../assets/beep.bin')
    .replace('application/octet-stream', 'audio/mpeg')

  cfg.planHelp = require('../assets/help/_plan.json')

  stores.config.setConfig(cfg)

  setRequiredModules({ pako: pako })
})
