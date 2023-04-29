<template>
<div class="bord1">
  <div class="titre-lg text-center">{{$t('STtit', [ns, stats.ntr, dh])}}</div>
  <div class="row bord2">
    <div class="col-6 q-pa-xs titre-md text-center">{{$t('STl1')}}</div>
    <div class="col-3 q-pa-xs bord3 fs-md font-mono text-center">{{e1(stats.q1)}}</div>
    <div class="col-3 q-pa-xs fs-md font-mono text-center">{{e1(stats.q2)}}</div>
  </div>
  <div class="row bord2">
    <div class="col-6 q-pa-xs titre-md text-center">{{$t('STl2')}}</div>
    <div class="col-3 q-pa-xs bord3 fs-md font-mono text-center">{{e1(stats.a1)}}</div>
    <div class="col-3 q-pa-xs fs-md font-mono text-center">{{e1(stats.a2)}}</div>
  </div>
  <div class="row bord2">
    <div class="col-6 q-pa-xs titre-md text-center">{{$t('STl3')}}</div>
    <div class="col-3 q-pa-xs bord3 fs-md font-mono text-center">{{stats.nbc}}</div>
    <div class="col-3 q-pa-xs fs-md font-mono text-center">{{stats.nbsp}}</div>
  </div>
  <div class="row bord2">
    <div class="col-6 q-pa-xs titre-md text-center">{{$t('STl4')}}</div>
    <div class="col-3 q-pa-xs bord3 fs-md font-mono text-center">{{stats.ncoS}}</div>
    <div class="col-3 q-pa-xs fs-md font-mono text-center">{{stats.ncoB}}</div>
  </div>
</div>
</template>

<script>
import stores from '../stores/stores.mjs'
import { edvol, dhcool } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'

export default {
  name: 'StatsTribus',

  props: { stats: Object, ns: Number },
  /*
  - 'ntr' : nombre de tribus
  - `a1 a2` : sommes des quotas attribués aux comptes de la tribu.
  - `q1 q2` : quotas actuels de la tribu
  - `nbc` : nombre de comptes.
  - `nbsp` : nombre de sponsors.
  - `ncoS` : nombres de comptes ayant une notification simple.
  - `ncoB` : nombres de comptes ayant une notification bloquante.
  */

  computed: {
    dh () { return this.stats.dh ? dhcool(this.stats.dh) : ''}
  },

  methods: {
    e1 (v) { return v + ' ' + edvol(v * UNITEV1) },
    e2 (v) { return v + ' ' + edvol(v * UNITEV2) },
  },

  data () {
    return {
    }
  },

  setup () {
    return {
      session: stores.session
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 2px solid $grey-5
.bord2
  border-top: 1px solid $grey-2
.bord3
  border-left: 1px solid $grey-2
  border-right: 1px solid $grey-2
</style>
