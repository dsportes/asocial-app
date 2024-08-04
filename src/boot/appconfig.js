import { boot } from 'quasar/wrappers'
const pako = require('pako')

import { setRequiredModules } from '../app/util.mjs'
import { Tarif } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
import { config } from '../app/config.mjs'
// import { toto } from '/testSW.js'

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

  cfg.broadcast = new BroadcastChannel('channel-123')
  cfg.broadcast.onmessage = (event) => {
    if (event.data && event.data.type === 'MSG_ID') {
      // console.log('Reçu: ', event.data.payload)
      stores.session.msgPush(event.data.payload)
    }
  }

  Tarif.tarifs = cfg.tarifs
  
  cfg.search = window.location.search.replace('?', '')

  if (process.env.DEVSRV) {
    cfg.opsrv = 'http://' + process.env.DEVSRV + '/op/'
    cfg.wssrv = 'ws://' + process.env.DEVSRV + '/ws/'
  } else {
    const srv = process.env.SRV ? process.env.SRV : window.location.host
    cfg.opsrv = 'https://' + srv + '/op/'
    cfg.wssrv = 'wss://' + srv + '/ws/'
  }
  console.log('OPSRV: ' + cfg.opsrv)
  console.log('WSSRV: ' + cfg.wssrv)

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
  cfg.iconComptable = require('../assets/police.jpg')
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
