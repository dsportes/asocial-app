import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

import stores from './stores.mjs'
import { pubsub } from '../app/net.mjs'
import { HBINSECONDS } from '../app/api.mjs'
import { SyncFull } from '../app/synchro.mjs'
import { sleep } from '../app/util.mjs'

export const useHbStore = defineStore('hb', () => {
  const session = stores.session
  const config = stores.config

  const nhb = ref(0) // numéro de heartbeat dans la connexion
  const dhhb = ref(0) // date-heure du dernier heartbeat de la connexion
  const pubsubTO = ref(null)
  const statusHB = ref(false)
  const nbRetry = ref(0)

  function reset () {
    nhb.value = 0
    dhhb.value = 0
    statusHB.value = false
  }

  // Retour de sync : numéro de heartbeat connu de PUBSUB pour cette session
  function setNhb (nhbx) {
    statusHB.value = nhbx === nhb.value
  }

  async function startHB () {
    if (session.avion) return
    if (pubsubTO.value) clearTimeout(pubsubTO.value)
    if (config.permission) {
      nhb.value++
      const ret = await pubsub('heartbeat', { org: session.org, sid: session.sessionId, nhb: nhb.value })
      if (ret === nhb.value - 1) {
        statusHB.value = true
        pubsubTO.value = setTimeout(async () => {
          await startHB()
        }, HBINSECONDS * 1000)
      } else {
        statusHB.value = false
        nhb.value = 0
      }
    }
  }

  async function stopHB () {
    if (session.avion || !session.ok) return
    if (pubsubTO.value) clearTimeout(pubsubTO.value)
    await pubsub('heartbeat', { org: session.org, sid: session.sessionId, nhb: 0 })
    statusHB.value = false
    nhb.value = 0
  }

  async function pingHB () {
    if (session.avion) return false
    try {
      const ret = await pubsub('ping', { })
      if (ret !== 'OK') { statusHB.value = false; return false }
      return true
    } catch (e) {
      statusHB.value = false
      return false
    }
  }

  async function retry () {
    nbRetry.value = 1
    while(!statusHB.value && session.ok && !session.avion) {
      if (await pingHB()) {
        await new SyncFull().run()
        setTimeout(async () => {
          await hb.startHB()
        }, 500)
        break
      }
      await sleep(2000)
      nbRetry.value++
    }
    nbRetry.value = 0
  }

  watch(statusHB, (ap) => {
    if (ap || !session.ok || session.avion) { nbRetry.value = 0; return }
    setTimeout(async () => {
      await retry()
    }, 5)
  })

  return { statusHB, nbRetry, setNhb, reset, startHB, stopHB, pingHB }
})