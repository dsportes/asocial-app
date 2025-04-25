import { boot } from 'quasar/wrappers'

import stores from '../stores/stores.mjs'
import { config } from '../app/config.mjs'
import { ID } from '../app/api.mjs'
import { res } from '../app/util.mjs'

export default boot(async ({ app /* Vue */ }) => {
  /*
  if('serviceWorker' in navigator) {
    console.log('Register de Daniel')
    navigator.serviceWorker.register('./sw.js')
  }
  */

  const readme = await res('README.md')
  const svc = await res('services.json')

  const cfg = { pageSessionId: ID.rnd(), nc: 0 }
  for(const x in config) cfg[x] = config[x]

  cfg.services = svc.services
  cfg.readme = readme || ''
  cfg.docsurls = svc.docsurls || { 'en-FR': 'http://localhost:4000' }
  cfg.vapid_public_key = svc.vapid_public_key || 'BC8J60JGGoZRHWJDrSbRih-0qi4Ug0LPbYsnft668oH56hqApUR0piwzZ_fsr0qGrkbOYSJ0lX1hPRTawQE88Ew'

  console.log('build:' + cfg.BUILD)

  cfg.search = window.location.search.replace('?', '')
  cfg.appurl = window.location.origin + window.location.pathname
  cfg.appbase = cfg.appurl.substring(0, cfg.appurl.lastIndexOf('/'))

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

  cfg.iconAvatar = await res('images/avatar.jpg')
  cfg.iconGroupe = await res('images/groupe.jpg')
  cfg.iconSuperman = await res('images/superman.jpg')
  cfg.iconComptable = await res('images/police.jpg')

  /* N'importe quel binaire en .bin peut être chargé en dataURL:
  - son MIME est 'application/octet-stream'
  - pour le rendre utilisable il faut lui donner son 'vrai' type
  Ici cliccamera est un pur .mp3 audio/mpeg
  */
  cfg.cliccamera = await res('images/cliccamera.bin')
  cfg.beep = await res('images/beep.bin')

  cfg.planHelp = await res('help/a_plan.json')

  await stores.config.setConfig(cfg)

  stores.hb.nextHB(true)
})
