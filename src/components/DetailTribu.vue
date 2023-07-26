<template>
<div :class="'full-width ' + sty" :style="'height:' + henrem + 'rem;'">
  <div class="titre-lg text-italic text-bold q-mb-sm">
    <div v-if="!ligne.id">{{$t('DTtit1')}}</div>
    <div v-else>{{$t('DTtit0', [ID.court(ligne.id), ligne.info || ''])}}</div>
  </div>

  <div :style="'height:' + (henrem - 2) + 'rem;overflow-y:auto'">
    <apercu-notif v-if="ligne.notif"
      :notif="tribu.notif" :id-tribu="tribu.id" :idx="idx" nom=""/>
    <div v-else>
      <div v-if="ligne.ntr1">{{$t('DTnbncs', ligne.ntr1, {count: ligne.ntr1})}}</div>
      <div v-if="ligne.ntr2" class="text-bold bg-yellow-3 text-black">
        {{$t('DTnbncb', ligne.ntr2, {count: ligne.ntr2})}}</div>
    </div>
    <div v-if="ligne.nco1">{{$t('DTnbncs', ligne.nco1, {count: ligne.nco1})}}</div>
    <div v-if="ligne.nco2" class="text-bold bg-yellow-3 text-black">
      {{$t('DTnbncb', ligne.nco2, {count: ligne.nco2})}}</div>

    <div>{{$t('DTnbc', [ligne.nbc, ligne.nbsp])}}</div>
    <div>{{$t('DTv1', [ligne.q1, ed1(ligne.q1), ligne.pca1, ligne.pcv1])}}</div>
    <div>{{$t('DTv2', [ligne.q2, ed2(ligne.q2), ligne.pca2, ligne.pcv2])}}</div>

  </div>
</div>
</template>

<script>
import stores from '../stores/stores.mjs'
import { edvol } from '../app/util.mjs'
import { ID, UNITEV1, UNITEV2 } from '../app/api.mjs'
import ApercuNotif from './ApercuNotif.vue'

export default ({
  name: 'DetailTribu',
  props: { 
    henrem: Number,
    ligne: Object // SOIT une ligne de Synthese, SOIT Tribu.synth (qui PEUT avoir un notif)
  },

  components: { ApercuNotif },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre ' : 'clair ' }
  },

  data () { return {
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    ed1 (n) { return edvol(n * UNITEV1) },
    ed2 (n) { return edvol(n * UNITEV2) },
  },

  setup () {
    const aSt = stores.avatar
    const session = stores.session
    const pow = session.pow

    return {
      ID, aSt, session, pow
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.rond
  position: absolute
  top: -2px
  right: -2px
  border-radius: 6px
  width: 12px
  height: 12px
  background: $red-9
.bord
  border: 1px solid $grey-5
  border-radius: 5px
</style>
