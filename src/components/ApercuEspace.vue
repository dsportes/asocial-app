<template>
  <div :class="dkli(idx)">
    <stats-tribus :stats="esp.stats" :ns="esp.id"/>
    <apercu-notif :notif="esp.notif" :idx="idx"/>
  </div>
</template>

<script>
import stores from '../stores/stores.mjs'
import StatsTribus from './StatsTribus.vue'

export default {
  name: 'ApercuEspace',

  props: { esp: Object, idx: Number },

  components: { StatsTribus },

  computed: {
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
  },

  data () {
    return {
    }
  },

  setup () {
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
