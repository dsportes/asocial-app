import { boot } from 'quasar/wrappers'

import stores from '../stores/stores.mjs'
import { config } from '../app/config.mjs'
import { ID } from '../app/api.mjs'
import { u8ToB64 } from '../app/util.mjs'

export async function getImgUrl (name) {
  try {
    const x = await res('../assets/help/' + name)
    return x ? x : await res('../assets/help/defaut.png')
  } catch (e) {
    return await res('../assets/help/defaut.png')
  }
}

export async function getMd (page, lang) {
  try {
    let x = await res('../assets/help/' + page + '_' + lang + '.md')
    if (x) return x
    if (lang !== 'fr-FR') x = await res('../assets/help/' + page + '_fr-FR.md')
    if (x) return x
    return await res('../assets/help/bientot_' + lang + '.md')
  } catch (e) {
    return await res('../assets/help/bientot_' + lang + '.md')
  }
}

const decoder = new TextDecoder('utf-8')

async function res (path, type) {
  const url = new URL(path, import.meta.url)
  const response = await fetch(url.pathname)
  if (!response.ok) return null
  const t = path.substring(path.lastIndexOf('.') + 1)
  if (t === 'json') return await response.json()
  const x = await response.bytes()
  if (t === 'md')
    return decoder.decode(x)
  if (t === 'jpg' || t === 'png')
    return 'data:image/' + t + ';base64,' + u8ToB64(x, true)
  if (t === 'bin')
    return 'data:audio/mpeg;base64,' + u8ToB64(x, true)
  return x
}

export default boot(async ({ app /* Vue */ }) => {

  const readme = await res('/README.md')
  const svc = await res('/services.json')

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

  cfg.iconAvatar = await res('../assets/avatar.jpg')
  cfg.iconGroupe = await res('../assets/groupe.jpg')
  cfg.iconSuperman = await res('../assets/superman.jpg')
  cfg.iconComptable = await res('../assets/police.jpg')

  /* N'importe quel binaire en .bin peut être chargé en dataURL:
  - son MIME est 'application/octet-stream'
  - pour le rendre utilisable il faut lui donner son 'vrai' type
  Ici cliccamera est un pur .mp3 audio/mpeg
  */
  cfg.cliccamera = await res('../assets/cliccamera.bin')
  cfg.beep = await res('../assets/beep.bin')

  cfg.planHelp = await res('../assets/help/_plan.json')

  await stores.config.setConfig(cfg)

  stores.hb.nextHB(true)
})
