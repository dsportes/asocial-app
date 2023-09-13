<template>
  <div class="w3 column">
    <div class="bg-primary text-white text-bold titre-md text-center">{{$t('TUntf')}}</div>
    <div class="bord column">
      <div class="row full-width">
        <div class="col-6"> </div>
        <div class="col-2 text-italic text-center fs-sm">{{$t('TUsim')}}</div>
        <div class="col-2 text-italic text-center fs-sm">{{$t('TUlec')}}</div>
        <div class="col-2 text-italic text-center fs-sm">{{$t('TUmin')}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-6 text-italic">{{$t('TUtr' + (total ? 'b' : ''))}}</div>
        <div class="col-2 font-mono text-center fs-md">{{src.ntr0 || '-'}}</div>
        <div :class="cw(src.ntr1)">{{src.ntr1 || '-'}}</div>
        <div :class="cn(src.ntr2)">{{src.ntr2 || '-'}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-6 text-italic">{{$t('TUco')}}</div>
        <div class="col-2 font-mono text-center fs-md">{{src.nco0 || '-'}}</div>
        <div :class="cw(src.nco1)">{{src.nco1 || '-'}}</div>
        <div :class="cn(src.nco2)">{{src.nco2 || '-'}}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { toRef } from 'vue'

export default {
  name: 'TuileNotif',

  props: { 
    src: Object, // {ntr0, ntr1, ntr2, nco0, nco1, nco2}
    total: Boolean
  },

  computed: {
  },

  methods: {
    cw (v) { return 'col-2 text-center font-mono ' + (v ? 'bg-yellow-3 text-bold text-warning' : '')},
    cn (v) { return 'col-2 text-center font-mono ' + (v ? 'bg-yellow-3 text-bold text-negative' : '')},
  },

  data () { return {
  }},

  setup (props) {
    const src = toRef(props, 'src')
    return {
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-left: 1px solid $grey-5
  border-right: 1px solid $grey-5
  border-bottom: 1px solid $grey-5
  overflow-y: hidden
  height: 4rem
.w2
  width: 8rem
.w3
  width: 12rem
</style>
