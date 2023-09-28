<template>
    <div class="column full-width">
      <div>{{$t('PCPprefa' + c.cumref[0], [dhcool(c.cumref[1]), c.cumref[2]])}}</div>

      <div :class="dkli(1) + ' row items-center full-width q-mt-sm'">
        <div class="col-3 text-center">{{$t('PCPabc')}}</div>
        <div class="col-3 text-center">{{$t('PCPdb')}}</div>
        <div class="col-3 text-center">{{$t('PCPcr')}}</div>
        <div class="col-3 text-center">{{$t('PCPsl')}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-3 font-mono text-center">{{mon(c.cumulAbo, 2) + ' + ' + mon(c.cumulConso, 2)}}</div>
        <div class="col-3 font-mono text-center">{{mon(c.cumulCouts, 2)}}</div>
        <div class="col-3 font-mono text-center">{{mon(total)}}</div>
        <div :class="'col-3 font-mono text-center ' + alsolde">{{mon(total - c.cumulCouts, 2)}}</div>
      </div>

      <div v-if="nbj > 2" class="titre-md q-my-sm">{{$t('PCPcouv', [nbj])}}</div>

    </div>
</template>

<script>
import { dhcool, mon, dkli } from '../app/util.mjs'

export default {
  name: 'PanelDeta',

  props: { 
    total: Number, c: Object
  },

  computed: {
    nbj () { return this.c.nbj(this.total) },
    alsolde () {
      const x = ' bg-yellow-3 text-bold text-'
      return this.nbj <= 0 ? x + 'negative' : (this.nbj < 60 ? x + 'warning' : '')
    },
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup (props) {
    return {
      dhcool, mon, dkli
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
