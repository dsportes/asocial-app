/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config.js > pwa > workboxPluginMode is set to "InjectManifest"
 */

import { decode } from '@msgpack/msgpack'

const mf = self.__WB_MANIFEST

const local = {}

const b64ToU8 = base64String => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

import { precacheAndRoute } from 'workbox-precaching'

// Use with precache injection
// precacheAndRoute(mf)

const broadcast = new BroadcastChannel('channel-pubsub')

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.text() : ''
  let obj
  try {
    obj = payload ? decode(b64ToU8(payload)) : {}
    // console.log('SW à traiter:' + (obj ? JSON.stringify(obj) : '???'))
  } catch (e) {
    console.log('msgPush: ' + e.toString())
  }
  if (obj && obj.sessionId)
    broadcast.postMessage(obj)
  else {
    console.log('Futur traitement:' + (obj ? JSON.stringify(obj) : '???'))
  }
})

self.addEventListener('install', event => {
  console.log('Install dans custom-service-worker')
  event.waitUntil(new Promise(async (resolve, reject) => {
    const resp = await fetch('/services.json')
    if (resp) {
      local.data = await resp.json()
      console.log('services.json chargé')
      resolve()
    } else reject()
  }))
})

self.addEventListener('activate', async event => {
  if (local.data)
    console.log('Prêt')
  let subscription = await self.registration.pushManager.getSubscription() // déjà faite ?
  if (!subscription) subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: b64ToU8(local.data.vapid_public_key)
    })
  local.subscription = subscription
  local.subJSON = JSON.stringify(subscription)
  console.log('Dans SW: ' + local.subJSON)
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FROM_APP') {
    console.log(event.data.payload)
  }
})
