<template>
  <div :class="dkli(idx)">
    <stats-tribus :stats="esp.stats" :org="esp.org" :ns="esp.id" :profil="esp.t"/>
    <apercu-notif class="q-mt-sm" :notif="esp.notif" :nom="esp.org"
    :idx="idx" :ns="esp.id"/>
  </div>
</template>

<script>
import { toRef } from 'vue'
import stores from '../stores/stores.mjs'
import StatsTribus from './StatsTribus.vue'
import ApercuNotif from './ApercuNotif.vue'

export default {
  name: 'ApercuEspace',

  props: { esp: Object, idx: Number },

  components: { StatsTribus, ApercuNotif },

  computed: {
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
  },

  data () {
    return {
    }
  },

  setup (props) {
    const e = toRef(props, 'esp')
    return {
      ui: stores.ui,
      session: stores.session
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
