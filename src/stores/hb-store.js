import { ref, watch, computed } from 'vue'
import { defineStore } from 'pinia'

import stores from './stores.mjs'
import { pubsub } from '../app/net.mjs'
// import { HBINSECONDS } from '../app/api.mjs'
import { SyncFull } from '../app/synchro.mjs'
// import { sleep } from '../app/util.mjs'

const court = 5000
const long = 120000
const trace = false

export const useHbStore = defineStore('hb', () => {
  const session = stores.session
  const config = stores.config

  const iterTO = ref(0) // itération sur l'envoi de hb

  const statusHB = ref(false)

  const nhb = ref(0) // numéro de heartbeat dans la connexion
  const sessionId = ref(null) // Id de la session en cours CONNUE par hb
  const dhhb = ref(0) // date-heure du dernier heartbeat de la connexion
  
  const nbRetry = ref(0)

  // session NON prête
  // ou avec accès au serveur bloqué / avion
  // ou absence de droit à web push
  const KO = computed(() => !session.ok || !session.accesNetNf || !config.permission)

  /* Principe général
  - le HB tourne tout le temps, se relance en permanence depuis le boot
  - s'il n'a rien à faire (inter-session) ne fait rien mais se relance
  */

  function nextHB (boot) { // démon lancé au boot et à chaque exécution
    // évite un éventuel doublon de démon
    if (iterTO.value) clearTimeout(iterTO.value)
    iterTO.value = setTimeout(doHB, 
      boot ? 1 : (nbRetry.value ? nbRetry.value === 1 ? 1 : court : long))
  }

  async function doHB () {
    if (KO.value) { nextHB(); return }
    dhhb.value = Date.now()

    if (nbRetry.value) {
      if (session.sessionId === sessionId.value) {
        // On tente un retry
        if (await pingHB()) {
          nbRetry.value = 0
          await new SyncFull().run()
          if (trace) console.log('statusHB ', statusHB.value, ' nhb=' + nhb.value, ' retry=' + nbRetry.value, new Date(dhhb.value).toISOString())
        } else nbRetry.value++
        nextHB()
        return
      }
    }
    let nhbx = 0
    if (session.sessionId !== sessionId.value) {
      // le dernier hb concernait une session précédente
      sessionId.value = session.sessionId
      nhbx = 1
    } else {
      // c'est toujours la même session
      nhbx = nhb.value + 1
    }
    const ret = await pubsub('heartbeat', { org: session.org, sid: sessionId.value, nhb: nhbx })
    nhb.value = nhbx
    statusHB.value = ret === nhbx - 1
    // cas "normal" : le nouvel hb est de la même session et en séquence
    // cas "erreur" : perte de hb, pas en séquence
    if (statusHB.value) nbRetry.value = 0
    else nbRetry.value++
    if (trace) console.log('heartbeat ', statusHB.value, ' nhb=' + nhb.value, ' retry=' + nbRetry.value, new Date(dhhb.value).toTimeString())
    nextHB()
  }

  // Retour d'op : numéro de heartbeat connu de PUBSUB pour cette session
  // arg: { sessionId, nhb }
  function retOP (arg) {
    statusHB.value = arg.sessionId === sessionId.value && arg.nhb === nhb.value
    if (!statusHB.value) {
      nbRetry.value++
      nextHB()
    }
    if (trace) console.log('retOP ' + arg.op, statusHB.value, ' nhb=' + nhb.value, ' retry=' + nbRetry.value, new Date(dhhb.value).toTimeString())
  }

  // Connexion
  function connex () {
    sessionId.value = session.sessionId
    nhb.value = 0
  }

  // Déconnexion explicite : informer PUBSUB
  async function stopHB () {
    if (KO.value) return
    await pubsub('heartbeat', { org: session.org, sid: session.sessionId, nhb: 0 })
    statusHB.value = false
    sessionId.value = null
    nhb.value = 0
    if (trace) console.log('stopHB ', statusHB.value, ' nhb=' + nhb.value, ' retry=' + nbRetry.value, new Date(Date.now()).toTimeString())
  }

  async function pingHB () {
    if (session.avion) return false
    try {
      const ret = await pubsub('ping', { })
      statusHB.value = ret === 'OK'
    } catch (e) {
      statusHB.value = false
      nbRetry.value++
    }
    if (trace) console.log('pingHB ', statusHB.value, ' nhb=' + nhb.value, ' retry=' + nbRetry.value, new Date(Date.now()).toTimeString())
    nextHB()
    return statusHB.value
  }

  /*
  function reset () {
    nhb.value = 0
    dhhb.value = 0
    statusHB.value = false
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

  async function retry () {
    nbRetry.value = 1
    while(!statusHB.value && session.ok && !session.avion) {
      if (await pingHB()) {
        await new SyncFull().run()
        setTimeout(async () => {
          await startHB()
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
  */

  return { nhb, statusHB, nbRetry, connex, retOP, nextHB, stopHB, pingHB }
})