<template>
  <q-card class="shadow-8 q-pa-sm">

    <apercu-notif v-if="session.status>1" :notif="session.notifG" :na-cible="0"/>
    <apercu-notif v-if="session.ok" :notif="aSt.tribu.notif" :na-cible="session.naComptable"/>
    <apercu-notif v-if="session.ok" :notif="aSt.mbtr.notif" :na-cible="aSt.compte.na"/>

    <div style="height:2px;width:100%"/>

  </q-card>
</template>
<script>

import { toRef } from 'vue'
import ApercuNotif from './ApercuNotif.vue'
import { AMJ } from '../app/api.mjs'
import { getNg } from '../app/modele.mjs'

export default {
  name: 'SyntheseBlocage',

  props: { },

  components: { ApercuNotif },

  computed: {
  },

  data () { return {
  }},

  methods: {
  },

  setup (props) {
    const aSt = stores.avatar
    const session = stores.session
    return {
      aSt,
      session
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
