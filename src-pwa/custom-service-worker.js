/* eslint-env serviceworker */

/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config file > pwa > workboxMode is set to "InjectManifest"
 */

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'

self.skipWaiting()
clientsClaim()
const mf = self.__WB_MANIFEST
console.log('Dans SW-1js b')
console.log('WB_MANIFEST >>>>>>>')
mf.forEach(x => {
  console.log('WB_MANIFEST: ' + x.url)
})
console.log('WB_MANIFEST <<<<<<<')

// Use with precache injection

if (process.env.PROD) {
  console.log('precacheAndRoute')
  precacheAndRoute(mf)
}

cleanupOutdatedCaches()

// Non-SSR fallbacks to index.html
// Production SSR fallbacks to offline.html (except for dev)
/*
if (process.env.MODE !== 'ssr' || process.env.PROD) {
  registerRoute(
    new NavigationRoute(
      createHandlerBoundToURL(process.env.PWA_FALLBACK_HTML),
      { denylist: [new RegExp(process.env.PWA_SERVICE_WORKER_REGEX), /workbox-(.)*\.js$/] }
    )
  )
}
*/

import { decode } from '@msgpack/msgpack'

const local = {}

const b64ToU8 = base64String => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

const broadcast = new BroadcastChannel('channel-pubsub')

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.text() : null
  let obj
  try {
    obj = payload ? decode(b64ToU8(payload)) : {}
  } catch (e) {
    console.log('msgPush: ' + e.toString())
  }
  if (obj) {
    if (!obj.sw) {
      // console.log('SW à traiter:' + (obj ? JSON.stringify(obj) : '???'))
      broadcast.postMessage(obj)
    } else {
      console.log('Futur traitement:' + (obj ? JSON.stringify(obj) : '???'))
    }
  }
})

/* Il est possible de récupérer la configuration services.json dans le SW
- par ajout d'un listener 'install' qui charge le fichier
  et fait différer l'actiivation effective après le chargement
- par récupération de la subscription lors de l'activation

self.addEventListener('install', event => {
  console.log('Install dans custom-service-worker')
  event.waitUntil(new Promise(async (resolve, reject) => {
    const resp = await fetch('/services.json')
    if (resp) {
      local.data = await resp.json()
      // console.log('services.json chargé')
      resolve()
    } else reject()
  }))
})

self.addEventListener('activate', async event => {
  let subscription = await self.registration.pushManager.getSubscription() // déjà faite ?
  if (!subscription) subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64ToU8(local.data.vapid_public_key)
    })
  local.subscription = subscription
  local.subJSON = JSON.stringify(subscription)
  // console.log('Subscription dans SW: ' + local.subJSON)
})
*/

/* On peut appeler une fonction du SW depuis une app Web */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FROM_APP') {
    console.log('Appel depuis app:' + JSON.stringify(event.data.payload))
  }
})
