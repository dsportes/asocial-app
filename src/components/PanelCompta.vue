<template>
  <div class="q-pa-sm full-width">
    <q-expansion-item switch-toggle-side default-opened dense
      header-class="titre-md text-bold bg-primary text-white"
      :label="$t('PCPsyn') + ' - ' + dhcool(c.dh)">
    <div class="largeur40 column maauto q-my-sm">
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-4 text-center"></div>
        <div class="col-2 text-center">{{libm(0)}}</div>
        <div class="col-2 text-center">{{libm(1)}}</div>
        <div class="col-2 text-center">{{libm(2)}}</div>
        <div class="col-2 text-center">{{libm(3)}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 text-italic">{{$t('PCPabcs')}}</div>
        <div class="col-2 font-mono text-center">{{mon(120, 2)}}</div>
        <div class="col-2 font-mono text-center">{{mon(20, 2)}}</div>
        <div class="col-2 font-mono text-center">{{mon(3520, 2)}}</div>
        <div class="col-2 font-mono text-center">{{mon(1.045, 2)}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 text-italic">{{$t('PCPabo')}}</div>
        <div class="col-2 font-mono text-center">{{mon(120, 2)}}</div>
        <div class="col-2 font-mono text-center">{{mon(20, 2)}}</div>
        <div class="col-2 font-mono text-center">{{mon(3520, 2)}}</div>
        <div class="col-2 font-mono text-center">{{mon(1.045, 2)}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 text-italic">{{$t('PCPconso')}}</div>
        <div class="col-2 font-mono text-center">{{mon(120, 2)}}</div>
        <div class="col-2 font-mono text-center">{{mon(20, 2)}}</div>
        <div class="col-2 font-mono text-center">{{mon(3520, 2)}}</div>
        <div class="col-2 font-mono text-center">{{mon(1.045, 2)}}</div>
      </div>
    </div>
  </q-expansion-item>
  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense group="trgroup"
    header-class="titre-md text-bold bg-primary text-white"
    :label="$t('PCPabo1')">
    <div class="largeur40 column maauto q-my-sm">
      <div :class="dkli(1) + ' row items-center full-width text-bold text-italic'">
        <div class="col-4">{{$t('PCPdet')}}</div>
        <div class="col-4 font-mono text-center">{{$t('PCPactuel')}}</div>
        <div class="col-4 font-mono text-center row justify-between items-center">
          <mois-m v-model.number="idm" :dh="c.dh"/>
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
  </q-expansion-item>
  <q-separator/>
  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense group="trgroup"
    header-class="titre-md text-bold bg-primary text-white"
    :label="$t('PCPabo2')">
    <div class="largeur40 column maauto q-my-sm">
      <div :class="dkli(1) + ' row items-center full-width text-bold text-italic'">
        <div class="col-4"/>
        <div class="col-4 font-mono text-center">{{$t('PCPactuel')}}</div>
        <div class="col-4 font-mono text-center row justify-between items-center">
          <mois-m v-model.number="idm" :dh="c.dh"/>
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
  </q-expansion-item>
  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense group="trgroup"
    header-class="titre-md text-bold bg-primary text-white"
    :label="$t('PCPcconso')">
    <div class="largeur40 column maauto q-my-sm">
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-4 text-center"></div>
        <div class="col-2 text-center">{{libm(0)}}</div>
        <div class="col-2 text-center">{{libm(1)}}</div>
        <div class="col-2 text-center">{{libm(2)}}</div>
        <div class="col-2 text-center">{{libm(3)}}</div>
      </div>
      <div class="row items-center full-width bordb">
        <div class="col-4 text-italic">{{$t('PCPconso')}}</div>
        <div class="col-2 font-mono text-center">{{mon(120, 2)}}</div>
        <div class="col-2 font-mono text-center">{{mon(20, 2)}}</div>
        <div class="col-2 font-mono text-center">{{mon(3520, 2)}}</div>
        <div class="col-2 font-mono text-center">{{mon(1.045, 2)}}</div>
      </div>
      <div class="row items-center full-width fs-sm">
        <div class="col-4 text-right text-italic">{{$t('PCPlec')}}</div>
        <div class="col-2 font-mono text-center">{{nbn(1500)}}</div>
        <div class="col-2 font-mono text-center">{{nbn(1500)}}</div>
        <div class="col-2 font-mono text-center">{{nbn(1500)}}</div>
        <div class="col-2 font-mono text-center">{{nbn(1500)}}</div>
      </div>
      <div class="row items-center full-width fs-sm bordb">
        <div class="col-4 text-right text-italic">{{$t('PCPecr')}}</div>
        <div class="col-2 font-mono text-center">{{nbn(600)}}</div>
        <div class="col-2 font-mono text-center">{{nbn(600)}}</div>
        <div class="col-2 font-mono text-center">{{nbn(600)}}</div>
        <div class="col-2 font-mono text-center">{{nbn(600)}}</div>
      </div>
      <div class="row items-center full-width fs-sm">
        <div class="col-4 text-right text-italic">{{$t('PCPvd')}}</div>
        <div class="col-2 font-mono text-center">{{edvol(120000)}}</div>
        <div class="col-2 font-mono text-center">{{edvol(120000)}}</div>
        <div class="col-2 font-mono text-center">{{edvol(120000)}}</div>
        <div class="col-2 font-mono text-center">{{edvol(120000)}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width fs-sm'">
        <div class="col-4 text-right text-italic">{{$t('PCPvm')}}</div>
        <div class="col-2 font-mono text-center">{{edvol(12000)}}</div>
        <div class="col-2 font-mono text-center">{{edvol(12000)}}</div>
        <div class="col-2 font-mono text-center">{{edvol(12000)}}</div>
        <div class="col-2 font-mono text-center">{{edvol(1200)}}</div>
      </div>
    </div>

    <div class="titre-md q-my-sm">
      {{$t('PCPpref' + c.debref[0], [dhcool(c.debref[1])])}}
    </div>

    <div v-if="!c.estA" class="'titre-md q-mt-sm">
      <span>{{$t('PCPconso2M', [mon(c.conso2M)])}}</span>
      <span :class="alconso">{{$t('PCPlim', [txconso])}}</span>
    </div>
    <div v-if="!c.estA" :class="'titre-md q-mb-sm'">
      {{$t('PCPqc', [mon(c.qv.qc)])}}
    </div>

    <div v-if="c.decouvert" class="titre-md q-my-sm">
      <div v-if="c.estA">{{$t('PCPdeca', [dhcool(c.decouvert[1]), mon(c.dec)])}}</div>
      <div v-else>{{$t('PCPdeco', [dhcool(c.decouvert[1]), c.dec])}}</div>
    </div>

  </q-expansion-item>
  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense group="trgroup"
    header-class="titre-md text-bold bg-primary text-white"
    :label="$t('PCPrecap')">
    <div class="largeur40 column maauto q-mb-sm">
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
  </q-expansion-item>
  <q-separator size="3px"/>

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
    txconso () { return Math.floor(c.conso2M * 100 / c.qv.qc )},
    alconso () {
      if (this.txconso < 80) return ''
      return ' bg-yellow-3 text-bold ' + (this.txconso > 100 ? 'negative' : 'warning')
    }

  },

  data () {
    return {
      idm: 0
    }
  },

  methods: {
  },

  setup () {
    const aSt = stores.avatar
    const c = ref(aSt.compta.compteurs)

    function libm (idm) {
      const [ax, mx] = AMJ.am(c.value.dh)
      const x = mx - idm
      const m = x <= 0 ? 12 + x : x
      return $t('mois' + m)
    }

    return {
      aSt, c,
      MD, edqt, mon, nbn, edvol, dhcool, dkli, libm
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bordb
  border-bottom: 1px solid $grey-5
</style>
