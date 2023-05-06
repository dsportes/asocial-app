<template>
  <q-card class="q-pa-sm">

    <div class="q-mt-sm titre-lg text-bold">
      <span v-if="niv<2">{{$t('ANlon' + niv)}}</span>
      <span v-if="niv===2" class="text-warning bg-yellow-3">{{$t('ANlon' + niv)}}</span>
      <span v-if="niv>2" class="text-negative bg-yellow-5">{{$t('ANlon' + niv)}}</span>
    </div>
    <div v-if="niv>1 && niv<5" class="q-my-xs titre-sm text-italic">{{$t('ANlong' + niv)}}</div>

    <div style="height:4rem">
    <div v-if="ntf.n3 > 0" class="q-ml-md titre-md">
      {{$t('ANlon3') + ' ' + $t('ANle', [edd(ntf.jbl), ntf.n3])}}</div>
    <div v-if="ntf.n4 > 0" class="q-ml-md titre-md">
      {{$t('ANlon4') + ' ' + $t('ANle', [edd(ntf.d4), ntf.n4])}}</div>
    <div v-if="ntf.n5 > 0" class="q-ml-md titre-md">
      {{$t('ANlon5') + ' ' + $t('ANle', [edd(ntf.d5), ntf.n5])}}</div>
    </div>

    <apercu-notif v-if="session.status>1" :notif="session.notifG"/>
    <apercu-notif v-if="session.ok" :notif="aSt.tribu.notif" :na-tribu="aSt.tribu.na" :na-cible="aSt.tribu.na"/>
    <apercu-notif v-if="session.ok" :notif="aSt.mbtr.notif" :na-tribu="aSt.tribu.na" :na-cible="aSt.compte.na"/>

    <div style="height:2px;width:100%"/>

  </q-card>
</template>
<script>

import { reactive } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuNotif from './ApercuNotif.vue'
import { AMJ } from '../app/api.mjs'

export default {
  name: 'SyntheseBlocage',

  props: { },

  components: { ApercuNotif },

  computed: {
    niv () { return this.session.niv },
  },

  data () { return {
  }},

  methods: {
    edd (d) { return AMJ.editDeAmj(d, true) },
  },

  setup (props) {
    const aSt = stores.avatar
    const session = stores.session

    const ntf = reactive({ n3: 0, n4: 0, n5: 0, d4: 0, d5: 0, jbl: 0 })

    function f0 (xg) {
      ntf.n3 = xg.n3 > 0 ? xg.n3 : 0
      ntf.n4 = xg.n4 > 0 ? xg.n4 : 0
      ntf.n5 = xg.n5 > 0 ? xg.n5 : 0
      ntf.d4 = xg.d4
      ntf.d5 = xg.d5
      ntf.jbl = xg.jbl
    }

    function f1 (xt) {
      if (xt.n3 > 0 && xt.n3 < ntf.n3) ntf.n3 = xt.n3
      if (xt.n4 > 0 && xt.n4 < ntf.n4) ntf.n4 = xt.n4
      if (xt.n5 > 0 && xt.n5 < ntf.n5) ntf.n5 = xt.n5
      if (xt.d4 > 0 && xt.d4 < ntf.d4) ntf.d4 = xt.d4
      if (xt.d5 > 0 && xt.d5 < ntf.d5) ntf.d5 = xt.d5
      if (xt.jbl > 0 && xt.jbl < ntf.jbl) ntf.jbl = xt.jbl
    }

    function setNtf() {
      if (session.notifG) f0(session.notifG)
      if (aSt.tribu.notif) f1(aSt.tribu.notif)
      if (aSt.mbtr.notif) f1(aSt.mbtr.notif)
    }

    session.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setBlocage') {
          setNtf()
        }
      })
    })

    setNtf()

    return {
      aSt,
      session,
      ntf
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
