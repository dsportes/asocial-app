/*
 * This file (which will be your service worker)
 * is picked up by the build system ONLY if
 * quasar.config.js > pwa > workboxPluginMode is set to "InjectManifest"
 */

// import { precacheAndRoute } from 'workbox-precaching'

// Use with precache injection
// precacheAndRoute(self.__WB_MANIFEST)

const broadcast = new BroadcastChannel('channel-123')

console.log('Dans mon SW')

self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.text() : 'no payload'
  broadcast.postMessage({ type: 'MSG_ID', payload: payload})
})
