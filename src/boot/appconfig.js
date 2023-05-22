import { boot } from 'quasar/wrappers'
import axios from 'axios'
const pako = require('pako')

import { setRequiredModules } from '../app/util.mjs'

import stores from '../stores/stores.mjs'

async function getJsonPub (path) {
  try {
    return (await axios.get(path)).data
  } catch (e) {
    return null
  }
}

export default boot(async ({ app /* Vue */ }) => {
  const cfg = require('../assets/config/app-config.json')
  cfg.help = await getJsonPub('help/help.json')

  cfg.logo = require('../assets/config/logo.png')
  cfg.cliccamera = require('../assets/cliccamera.b64').default
  cfg.iconAvatar = require('../assets/avatar.jpg')
  cfg.iconGroupe = require('../assets/groupe.jpg')
  cfg.iconContact = require('../assets/contact.jpg')
  cfg.iconDisparu = require('../assets/disparu.jpg')
  cfg.iconSuperman = require('../assets/superman.jpg')

  cfg.build = process.env.BUILD
  cfg.debug = process.env.DEBUGGING
  cfg.dev = process.env.DEV

  // cfg.urlserveur = process.env.DEV ? process.env.DEV_SERVEUR : window.location.host
  cfg.urlserveur = process.env.DEV_SERVEUR
  const i = cfg.urlserveur.indexOf(':')
  cfg.urlwss = 'wss' + cfg.urlserveur.substring(i) + '/ws/'
  console.log('urlserveur: ' + cfg.urlserveur + ' --- urlwss: ' + cfg.urlwss + ' --- build: ' + cfg.build)

  stores.config.setConfig(cfg)

  setRequiredModules({ pako: pako })
})
