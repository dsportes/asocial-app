import { boot } from 'quasar/wrappers'
const pako = require('pako')
import { decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { config } from '../app/config.mjs'
import { ID } from '../app/api.mjs'
import { syncQueue } from '../app/synchro.mjs'
import { setRequiredModules, b64ToU8 } from '../app/util.mjs'
import { getRessource } from '../app/net.mjs'

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

async function msgPush (event) {
  if (event.data && event.data.type === 'pubsub') {
    try {
      const obj = decode(b64ToU8(event.data.payload))
      if (obj.sessionId === stores.session.sessionId)
        syncQueue.synchro(obj.trLog)
    } catch (e) {
      console.log('msgPush: ' + e.toString())
    }
  }
}

export default boot(async ({ app /* Vue */ }) => {
  // const svc = require('/public/services.json')
  const svc = await getRessource('services.json', 'json')
  const readme = await getRessource('README.md', 'text')

  const cfg = { pageSessionId: ID.rnd(), nc: 0 }
  for(const x in config) cfg[x] = config[x]

  cfg.services = svc.services
  cfg.readme = readme || ''
  cfg.docsurls = svc.docsurls || { 'en-FR': 'http://localhost:4000' }
  cfg.vapid_public_key = svc.vapid_public_key || 'BC8J60JGGoZRHWJDrSbRih-0qi4Ug0LPbYsnft668oH56hqApUR0piwzZ_fsr0qGrkbOYSJ0lX1hPRTawQE88Ew'

  /*
  const h = window.location.host
  let u = (urls.opurl === 'http' || urls.opurl === 'https') ?
    urls.opurl + '://' + h : urls.opurl
  cfg.OPURL = u + '/op/' 
  console.log('OPURL: ' + cfg.OPURL)

  u = (urls.pubsuburl === 'http' || urls.pubsuburl === 'https') ?
  urls.pubsuburl + '://' + h : urls.pubsuburl
    cfg.OPURL = u + '/op/' 
  console.log('OPURL: ' + cfg.OPURL)
  cfg.PUBSUBURL = u + '/pubsub/'
  console.log('PUBSUBURL: ' + cfg.PUBSUBURL)
  */

  console.log('build:' + cfg.BUILD)
  
  new BroadcastChannel('channel-pubsub').onmessage = msgPush
  
  cfg.search = window.location.search.replace('?', '')

  // console.log('Mode silencieux: ' + (cfg['silence'] ? 'oui' : 'non'))

  cfg.locales = []
  cfg.localeOptions.forEach(t => {cfg.locales.push(t.value)})

  const mc = cfg.motscles
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

  await stores.config.setConfig(cfg)

  setRequiredModules({ pako: pako })

  stores.hb.nextHB(true)
})
