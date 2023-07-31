<template>
  <div>
    <div class="q-mt-sm titre-md text-bold">
      <span v-if="ntf.niv<2">{{$t('ANlon' + ntf.niv)}}</span>
      <span v-if="ntf.niv===2" class="text-warning bg-yellow-3">{{$t('ANlon' + ntf.niv)}}</span>
      <span v-if="ntf.niv>2" class="text-negative bg-yellow-5">{{$t('ANlon' + ntf.niv)}}</span>
    </div>
    <div v-if="ntf.niv>1 && ntf.niv<5" class="q-my-xs titre-md text-bold text-italic">
      <div>{{$t('ANlong' + ntf.niv)}}</div>
      <div v-if='ntf.niv === 3 || ntf.niv === 4'>{{$t('ANlong6')}}</div>
    </div>

    <div style="height:4rem">
    <div v-if="ntf.n3 > 0" class="titre-md">
      ✔ {{$t('ANlon3') + ' ' + $t('ANle', [edd(ntf.jbl), ntf.n3])}}</div>
    <div v-if="ntf.n4 > 0" class="titre-md">
      ✔ {{$t('ANlon4') + ' ' + $t('ANle', [edd(ntf.d4), ntf.n4])}}</div>
    <div v-if="ntf.n5 > 0" class="titre-md">
      ✔ {{$t('ANlon5') + ' ' + $t('ANle', [edd(ntf.d5), ntf.n5])}}</div>
    </div>
  </div>
</template>

<script>
import { AMJ } from '../app/api.mjs'

export default {
  name: 'DetailNotif',

  props: { ntf: Object },

  computed: {
  },

  methods: {
    edd (d) { return AMJ.editDeAmj(d, true) },
  },

  data () {
    return {
    }
  },

  setup () {
    return {
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
