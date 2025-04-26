import { boot } from 'quasar/wrappers'

import stores from '../stores/stores.mjs'
import { config } from '../app/config.mjs'
import { ID } from '../app/api.mjs'
import { res } from '../app/util.mjs'

export default boot(async ({ app /* Vue */ }) => {
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

  cfg.iconAvatar = await res('icons/avatar.jpg')
  cfg.iconGroupe = await res('icons/groupe.jpg')
  cfg.iconSuperman = await res('icons/superman.jpg')
  cfg.iconComptable = await res('icons/police.jpg')

  cfg.cliccamera = await res('sounds/cliccamera.mp3')
  cfg.beep = await res('sounds/beep.mp3')

  cfg.planHelp = await res('help/a_plan.json')

  await stores.config.setConfig(cfg)

  stores.hb.nextHB(true)
})
