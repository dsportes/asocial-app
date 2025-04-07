/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config.js > pwa > workboxPluginMode is set to "InjectManifest"
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

/* Use with precache injection
L'utilisation du precaching a provoqué des bouclages de rechargement de la page
Toutefois la variable mf ci-dessous est requise:
webpack cherche le string qui figure après self...
et se plante si ne le trouve pas.
En conséquence webpack installe, au build, une liste de fichiers qui
n'est pas utilisée en runtime.
*/
// import { precacheAndRoute } from 'workbox-precaching'
const mf = self.__WB_MANIFEST
// precacheAndRoute(mf)

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
