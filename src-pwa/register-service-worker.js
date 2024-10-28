import { register } from 'register-service-worker'

import stores from '../src/stores/stores.mjs'

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

register(process.env.SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  async ready (registration) {
    console.log('Service worker is active.')
    await stores.config.setRegistration(registration)
  },

  registered (registration) {
    console.log('Service worker has been registered.')
  },

  cached (registration) {
    console.log('Content has been cached for offline use.')
  },

  updatefound (/* registration */) {
    console.log('New content is downloading.')
    try {
      stores.config.setSwev('updatefound')
    } catch (e) {
      console.log('swev 1', e.toString())
    }
  },

  updated (/* registration */) {
    console.log('New content is available; please refresh.')
    try {
      stores.config.setSwev('updated')
    } catch (e) {
      console.log('swev 2', e.toString())
    }
  },

  offline () {
    console.log('No internet connection found. App is running in offline mode.')
  },

  error (err) {
    console.error('Error during service worker registration:', err)
  }
})
