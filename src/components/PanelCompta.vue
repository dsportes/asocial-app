<template>
  <div class="q-pa-sm full-width">
    <div class="titre-lg text-italic q-mt-sm q-mb-sm bordb">
      {{$t('PCPabo')}} - {{dhcool(dh)}}
    </div>

    <div class="largeur30 column maauto q-my-sm">
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-3 text-center">{{libm(0)}}</div>
        <div class="col-3 text-center">{{libm(1)}}</div>
        <div class="col-3 text-center">{{libm(2)}}</div>
        <div class="col-3 text-center">{{libm(3)}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-3 font-mono text-center">{{mon(120, 2)}}</div>
        <div class="col-3 font-mono text-center">{{mon(20, 2)}}</div>
        <div class="col-3 font-mono text-center">{{mon(3520, 2)}}</div>
        <div class="col-3 font-mono text-center">{{mon(1.045, 2)}}</div>
      </div>
    </div>

    <div class="q-ml-md titre-lg text-italic q-mt-sm q-mb-sm bordb">{{$t('PCPabo1')}}</div>
    <div class="largeur40 column maauto">
      <div :class="dkli(1) + ' row items-center full-width text-bold text-italic'">
        <div class="col-4">{{$t('PCPdet')}}</div>
        <div class="col-4 font-mono text-center">{{$t('PCPactuel')}}</div>
        <div class="col-4 font-mono text-center row justify-between items-center">
          <mois-m v-model.number="idm" :dh="dh"/>
          <span class="q-ml-sm">{{$t(('PCPmoy'))}}</span>
        </div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPabo')}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
      </div>
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPutil')}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPnbno')}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
      </div>
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPnbch')}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPnbgr')}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
      </div>
    </div>

    <div class="q-ml-md titre-lg text-italic q-mt-md q-mb-sm bordb">{{$t('PCPabo2')}}</div>
    <div class="largeur40 column maauto">
      <div :class="dkli(1) + ' row items-center full-width text-bold text-italic'">
        <div class="col-4"/>
        <div class="col-4 font-mono text-center">{{$t('PCPactuel')}}</div>
        <div class="col-4 font-mono text-center row justify-between items-center">
          <mois-m v-model.number="idm" :dh="dh"/>
          <span class="q-ml-sm">{{$t(('PCPmoy'))}}</span>
        </div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPabo')}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
      </div>
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPutil')}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPv2')}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
        <div class="col-4 font-mono text-center">{{0}}</div>
      </div>
    </div>

    <q-separator size="sm" color="orange" class="q-my-sm"/>

    <div class="titre-lg text-italic q-mt-sm q-mb-sm bordb">
      {{$t('PCPconso')}}
    </div>

    <div class="largeur30 column maauto q-my-sm">
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-3 text-center">{{libm(0)}}</div>
        <div class="col-3 text-center">{{libm(1)}}</div>
        <div class="col-3 text-center">{{libm(2)}}</div>
        <div class="col-3 text-center">{{libm(3)}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-3 font-mono text-center">{{mon(120, 2)}}</div>
        <div class="col-3 font-mono text-center">{{mon(20, 2)}}</div>
        <div class="col-3 font-mono text-center">{{mon(3520, 2)}}</div>
        <div class="col-3 font-mono text-center">{{mon(1.045, 2)}}</div>
      </div>
    </div>

    <q-separator size="sm" color="orange" class="q-my-sm"/>

    <div class="titre-lg text-italic q-mt-sm q-mb-sm bordb">
      {{$t('PCPrecap')}}
    </div>

    <div class="q-ml-md largeur40 column maauto q-my-sm">
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-2 text-center">{{libm(0)}}</div>
        <div class="col-2 text-center">{{libm(1)}}</div>
        <div class="col-2 text-center">{{libm(2)}}</div>
        <div class="col-2 text-center">{{libm(3)}}</div>
        <div class="col-2 text-center">{{libm(4)}}</div>
        <div class="col-2 text-center">{{libm(5)}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-2 font-mono text-center">{{mon(120)}}</div>
        <div class="col-2 font-mono text-center">{{mon(20)}}</div>
        <div class="col-2 font-mono text-center">{{mon(3520)}}</div>
        <div class="col-2 font-mono text-center">{{mon(1.045)}}</div>
        <div class="col-2 font-mono text-center">{{mon(20)}}</div>
        <div class="col-2 font-mono text-center">{{mon(3520)}}</div>
      </div>
        <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-2 text-center">{{libm(6)}}</div>
        <div class="col-2 text-center">{{libm(7)}}</div>
        <div class="col-2 text-center">{{libm(8)}}</div>
        <div class="col-2 text-center">{{libm(9)}}</div>
        <div class="col-2 text-center">{{libm(10)}}</div>
        <div class="col-2 text-center">{{libm(11)}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-2 font-mono text-center">{{mon(120)}}</div>
        <div class="col-2 font-mono text-center">{{mon(20)}}</div>
        <div class="col-2 font-mono text-center">{{mon(3520)}}</div>
        <div class="col-2 font-mono text-center">{{mon(1.045)}}</div>
        <div class="col-2 font-mono text-center">{{mon(20)}}</div>
        <div class="col-2 font-mono text-center">{{mon(3520)}}</div>
      </div>
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-2 text-center">{{libm(12)}}</div>
        <div class="col-2 text-center">{{libm(13)}}</div>
        <div class="col-2 text-center">{{libm(14)}}</div>
        <div class="col-2 text-center">{{libm(15)}}</div>
        <div class="col-2 text-center">{{libm(16)}}</div>
        <div class="col-2 text-center">{{libm(17)}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-2 font-mono text-center">{{mon(120)}}</div>
        <div class="col-2 font-mono text-center">{{mon(20)}}</div>
        <div class="col-2 font-mono text-center">{{mon(3520)}}</div>
        <div class="col-2 font-mono text-center">{{mon(1.045)}}</div>
        <div class="col-2 font-mono text-center">{{mon(20)}}</div>
        <div class="col-2 font-mono text-center">{{mon(3520)}}</div>
      </div>
    </div>

  </div>
</template>

<script>
import { ref } from 'vue'
import { UNITEV1, UNITEV2, AMJ, Compteurs } from '../app/api.mjs'
import { dhcool, edqt, mon, nbn, edvol, dkli, $t } from '../app/util.mjs'
import { MD } from '../app/modele.mjs'
import MoisM from './MoisM.vue'


export default ({
  name: 'PanelCompta',

  props: { },

  components: { MoisM },

  computed: {
  },

  data () {
    return {
      idm: 0
    }
  },

  methods: {
  },

  setup () {
    const dh = Date.now() // + (5 * 30 * 86400000)
    const [ax, mx] = AMJ.am(dh)

    function libm (idm) {
      const x = mx - idm
      const m = x <= 0 ? 12 + x : x
      return $t('mois' + m)
    }

    return {
      MD, dh, edqt, mon, nbn, edvol, dhcool, dkli, libm
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bordb
  border-bottom: 1px solid $grey-5
</style>
