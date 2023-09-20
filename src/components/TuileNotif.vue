<template>  
  <div :class="(occupation ? 'w3b' : 'w2b') + ' row items-start'">
    <div class="col-3 titre-md text-italic">{{$t('TUntft')}}</div>

    <div class="col-3 column bordr">
      <div class="row full-width">
        <div class="col-4 text-italic text-center fs-sm">{{$t('TUsim')}}</div>
        <div class="col-4 text-italic text-center fs-sm">{{$t('TUlec')}}</div>
        <div class="col-4 text-italic text-center fs-sm">{{$t('TUmin')}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 font-mono text-center fs-md">{{src.ntr0 || '-'}}</div>
        <div :class="cw(src.ntr1)">{{src.ntr1 || '-'}}</div>
        <div :class="cn(src.ntr2)">{{src.ntr2 || '-'}}</div>
      </div>
    </div>

    <div class="q-pl-sm col-3 titre-md text-italic">{{$t('TUntfc')}}</div>

    <div class="col-3 column bordr">
      <div class="row full-width">
        <div class="col-4 text-italic text-center fs-sm">{{$t('TUsim')}}</div>
        <div class="col-4 text-italic text-center fs-sm">{{$t('TUlec')}}</div>
        <div class="col-4 text-italic text-center fs-sm">{{$t('TUmin')}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 font-mono text-center fs-md">{{src.nco0 || '-'}}</div>
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
    occupation: Boolean, // grande largeur pour harmonisation TuileCnv
    total: Boolean
  },

  computed: {
  },

  methods: {
    cw (v) { return 'col-4 text-center font-mono ' + (v ? 'bg-yellow-3 text-bold text-warning' : '')},
    cn (v) { return 'col-4 text-center font-mono ' + (v ? 'bg-yellow-3 text-bold text-negative' : '')},
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
.bordr
  border-right: 1px solid $grey-5
.w2b
  width: 21rem
.w3b
  width: 24rem
</style>
