<template>
<div>
  <q-toolbar class="row justify-between">
    <q-btn class="col-auto q-mr-md" dense size="md" color="warning" 
      icon="check" :label="$t('jailu')" @click="vuclose()"/>
    <q-tabs  class="col" v-model="tab" inline-label outside-arrows mobile-arrows no-caps>
      <q-tab name="notif" :label="$t('PNCntf')" @click="tab='notif'"/>
      <q-tab name="compta" :label="$t('PNCesp')" @click="tab='compta'"/>
      <q-tab name="chats" :label="$t('PNCchats')" @click="tab='chats'"/>
    </q-tabs>
  </q-toolbar>

  <panel-compta v-if="tab==='compta'" style="margin:0 auto" :c="session.compta.compteurs"/>

  <div v-if="tab==='notif'" class="q-pa-sm">
    <div v-if="c.pc1 >= 100" class="q-my-sm q-mx-sm bg-yellow-3 text-negative text-bold q-pa-sm titre-md">
      <div class="titre-md">{{$t('CPTal1a', [c.pc1])}}</div>
      <div>{{$t('CPTal1b')}}</div>
    </div>

    <div v-if="c.pc2 >= 100" class="q-my-sm q-mx-sm bg-yellow-3 text-negative text-bold q-pa-sm titre-md">
      <div class="titre-md">{{$t('CPTal2a', [c.pc2])}}</div>
      <div>{{$t('CPTal2b')}}</div>
    </div>

    <q-separator v-if="(c.pc2 >= 100) || (c.pc1 >= 100)" class="q-my-md"/>

    <synthese-blocage v-if="blTr || blCo" :blTr="blTr" :blCo="blCo"/>
    <div v-else class="titre-lg text-italic">{{$t('CPTnbloc')}}</div>

    <q-separator class="q-my-md"/>

    <div>
      <apercu-notif edit />
      <q-separator class="q-my-sm"/>
    </div>

    <div v-if="ntfTrCo">
      <apercu-notif :src="tr" />
      <q-separator class="q-my-sm"/>
    </div>

    <div v-if="ntfTrSp">
      <apercu-notif :src="tr" sponsor/>
      <q-separator class="q-my-sm"/>
    </div>

    <div v-if="ntfCoCo">
      <apercu-notif :src="et2" />
      <q-separator class="q-my-sm"/>
    </div>

    <div v-if="ntfCoSp">
      <apercu-notif :src="et2" sponsor/>
      <q-separator class="q-my-sm"/>
    </div>

  </div>

  <div v-if="tab==='chats'">

  </div>
</div>
</template>

<script>

import { ref } from 'vue'

import stores from '../stores/stores.mjs'
import PanelCompta from '../components/PanelCompta.vue'
import SyntheseBlocage from '../components/SyntheseBlocage.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import { SetDhvuCompta } from '../app/operations.mjs'

export default {
  name: 'PageCompta',

  components: { PanelCompta, SyntheseBlocage, ApercuNotif },

  computed: {
    c () { return this.session.compta.compteurs },
    tr () { return this.avStore.tribu },
    et2 () { return this.avStore.tribu2.mbtr[this.session.compteId] },
    blTr () { return this.tr.blocage || null },
    blCo () { return this.et2.blocage || null },
    ntfTrCo () { return this.tr.notifco || null },
    ntfTrSp () { return this.tr.notifsp || null },
    ntfCoCo () { return this.et2.notifco || null },
    ntfCoSp () { return this.et2.notifsp || null }
  },

  data () {
    return {
    }
  },

  methods: {
    async vuclose () {
      if (this.session.accesNet) {
        await new SetDhvuCompta().run()
      }
      this.ui.setPage('accueil')
    }
  },

  setup () {
    const session = stores.session
    const avStore = stores.avatar
    const ui = stores.ui
    const tab = ref()
    tab.value = ui.pagetab || 'notif'
    return {
      session,
      ui,
      avStore,
      tab
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-btn
  padding: 0 3px !important
</style>
