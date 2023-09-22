<template>
  <div class="q-pa-sm full-width">
    <q-expansion-item switch-toggle-side default-opened dense
      header-class="titre-md text-bold bg-primary text-white"
      :label="$t('PCPsyn') + ' - ' + dhcool(c.dh)">
    <div class="largeur40 column maauto q-my-sm">
      <div class="titre-md q-my-sm">
        {{$t('PCPpcum' + c.cumref[0], [dhcool(c.cumref[1]), c.cumref[2]])}}
      </div>

      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-4 text-center"></div>
        <div class="col-4 text-center">{{$t('PCPactuel')}}</div>
        <div class="col-4 row justify-center">
          <mois-m v-model.number="idm" :dh="c.dh"/>
        </div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 text-italic">{{$t('PCPabcs')}}</div>
        <div class="col-4 font-mono text-center">{{mon(c.cumulCouts, 2)}}</div>
        <div class="col-4 font-mono text-center">{{exM ? mon(aboM + consoM, 2) : '-'}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 text-italic">{{$t('PCPabo')}}</div>
        <div class="col-4 font-mono text-center">{{mon(c.cumulAbo, 2)}}</div>
        <div class="col-4 font-mono text-center">{{exM ? mon(aboM, 2) : '-'}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 text-italic">{{$t('PCPconso')}}</div>
        <div class="col-4 font-mono text-center">{{mon(c.cumulConso, 2)}}</div>
        <div class="col-4 font-mono text-center">{{exM ? mon(consoM, 2) : '-'}}</div>
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
        <div class="col-4 font-mono text-center row justify-around items-center">
          <mois-m v-model.number="idm" :dh="c.dh"/>
          <span class="q-ml-sm">{{$t(('PCPmoy'))}}</span>
        </div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPabo')}}</div>
        <div class="col-4 font-mono text-center">{{c.qv.q1}}</div>
        <div class="col-4 font-mono text-center">{{exM ? q1M : '-'}}</div>
      </div>
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPutil')}}</div>
        <div class="col-4 font-mono text-center">{{pcutq1 + '%'}}</div>
        <div class="col-4 font-mono text-center">{{exM ? (pcutq1M + '%') : '-'}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPnbno')}}</div>
        <div class="col-4 font-mono text-center">{{c.qv.nn}}</div>
        <div class="col-4 font-mono text-center">{{exM ? nnM : '-'}}</div>
      </div>
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPnbch')}}</div>
        <div class="col-4 font-mono text-center">{{c.qv.nc}}</div>
        <div class="col-4 font-mono text-center">{{exM ? ncM : '-'}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPnbgr')}}</div>
        <div class="col-4 font-mono text-center">{{c.qv.ng}}</div>
        <div class="col-4 font-mono text-center">{{exM ? ngM : '-'}}</div>
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
        <div class="col-4 font-mono text-center row justify-around items-center">
          <mois-m v-model.number="idm" :dh="c.dh"/>
          <span class="q-ml-sm">{{$t(('PCPmoy'))}}</span>
        </div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPabo')}}</div>
        <div class="col-4 font-mono text-center">{{edvol(c.qv.q2 * UNITEV2)}}</div>
        <div class="col-4 font-mono text-center">{{exM ? edvol(q2M) : '-'}}</div>
      </div>
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPutil')}}</div>
        <div class="col-4 font-mono text-center">{{pcutq2 + '%'}}</div>
        <div class="col-4 font-mono text-center">{{exM ? (pcutq2M + '%') : '-'}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPv2')}}</div>
        <div class="col-4 font-mono text-center">{{c.qv.v2}}</div>
        <div class="col-4 font-mono text-center">{{exM ? v2M : '-'}}</div>
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
        <div class="col-2 font-mono text-center">{{ex(0) ? mon(conso(0), 2) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(1) ? mon(conso(1), 2) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(2) ? mon(conso(2), 2) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(3) ? mon(conso(3), 2) : '-'}}</div>
      </div>
      <div class="row items-center full-width fs-sm">
        <div class="col-4 text-right text-italic">{{$t('PCPlec')}}</div>
        <div class="col-2 font-mono text-center">{{ex(0) ? nbn(nl(0)) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(1) ? nbn(nl(1)) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(2) ? nbn(nl(2)) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(3) ? nbn(nl(3)) : '-'}}</div>
      </div>
      <div class="row items-center full-width fs-sm bordb">
        <div class="col-4 text-right text-italic">{{$t('PCPecr')}}</div>
        <div class="col-2 font-mono text-center">{{ex(0) ? nbn(ne(0)) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(1) ? nbn(ne(1)) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(2) ? nbn(ne(2)) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(3) ? nbn(ne(3)) : '-'}}</div>
      </div>
      <div class="row items-center full-width fs-sm">
        <div class="col-4 text-right text-italic">{{$t('PCPvd')}}</div>
        <div class="col-2 font-mono text-center">{{ex(0) ? edvol(vd(0)) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(1) ? edvol(vd(1)) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(2) ? edvol(vd(2)) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(3) ? edvol(vd(3)) : '-'}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width fs-sm'">
        <div class="col-4 text-right text-italic">{{$t('PCPvm')}}</div>
        <div class="col-2 font-mono text-center">{{ex(0) ? edvol(vm(0)) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(1) ? edvol(vm(1)) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(2) ? edvol(vm(2)) : '-'}}</div>
        <div class="col-2 font-mono text-center">{{ex(3) ? edvol(vm(3)) : '-'}}</div>
      </div>

      <div v-if="!c.estA">
        <div class="titre-md q-my-md">
          <div>{{$t('PCPprefc' + c.debref[0], [dhcool(c.debref[1]), mon(c.conso2B, 2)], libm(1))}}</div>
          <div :class="alconso">{{$t('PCPcmoy', [mon(c.conso2M, 2), txconso, mon(c.qv.qc), libm(1)])}}</div>
        </div>
      </div>

      <div v-if="c.estA" class="column maauto q-my-sm full-width">
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
          <div class="col-3 font-mono text-center">{{mon(cr)}}</div>
          <div :class="'col-3 font-mono text-center ' + alsolde">{{mon(cr - c.cumulCouts, 2)}}</div>
        </div>

        <div v-if="nbj > 2" class="titre-md q-my-sm">{{$t('PCPcouv', [nbj])}}</div>
      </div>

      <div v-if="c.decouvert" class="titre-md q-my-sm">
        <div v-if="c.estA">{{$t('PCPdeca', [dhcool(c.decouvert[1]), mon(c.dec)])}}</div>
        <div v-else>{{$t('PCPdeco', [dhcool(c.decouvert[1]), c.dec])}}</div>
      </div>
    </div>
  </q-expansion-item>
  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense group="trgroup"
    header-class="titre-md text-bold bg-primary text-white"
    :label="$t('PCPrecap')">
    <div class="largeur40 column maauto q-mb-sm">
      <div :class="dkli(1) + ' row items-center full-width'">
        <div v-for="(n, m) in 6" :key="n" class="col-2 text-center">
          {{libm(m)}}
        </div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div v-for="(n, m) in 6" :key="n" class="col-2 text-center">
          {{em(m) ? mon(c.mm[m], 2) : '-'}}
        </div>
      </div>
      <div v-if="em(6)" :class="dkli(1) + ' row items-center full-width'">
        <div v-for="(n, m) in 6" :key="n" class="col-2 text-center">
          {{libm(m + 6)}}
        </div>
      </div>
      <div v-if="em(6)" :class="dkli(0) + ' row items-center full-width'">
        <div v-for="(n, m) in 6" :key="n" class="col-2 text-center">
          {{em(m + 6) ? mon(c.mm[m + 6], 2) : '-'}}
        </div>
      </div>
      <div v-if="em(12)" :class="dkli(1) + ' row items-center full-width'">
        <div v-for="(n, m) in 6" :key="n" class="col-2 text-center">
          {{libm(m + 12)}}
        </div>
      </div>
      <div v-if="em(12)" :class="dkli(0) + ' row items-center full-width'">
        <div v-for="(n, m) in 6" :key="n" class="col-2 text-center">
          {{em(m + 12) ? mon(c.mm[m + 12], 2) : '-'}}
        </div>
      </div>
    </div>
  </q-expansion-item>
  <q-separator size="3px"/>

  </div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { UNITEV1, UNITEV2, AMJ, Compteurs } from '../app/api.mjs'
import { dhcool, edqt, mon, nbn, edvol, dkli, $t } from '../app/util.mjs'
import { MD } from '../app/modele.mjs'
import MoisM from './MoisM.vue'

export default ({
  name: 'PanelCompta',

  props: { },

  components: { MoisM },

  computed: {
    exM () { return this.c.vd[this.idm][Compteurs.MS] !== 0 },
    q2M () { return this.c.vd[this.idm][Compteurs.Q2] * UNITEV2 },
    v2M () { return this.c.vd[this.idm][Compteurs.V2 + Compteurs.X2]},
    pcutq2M () { return Math.round(this.v2M * 100 / this.q2M)},
    pcutq2 () { return Math.round(this.c.v2 * 100 / (this.c.qv.q2 * UNITEV2)) },

    q1M () { return this.c.vd[this.idm][Compteurs.Q1] * UNITEV1},
    nnM () { return this.c.vd[this.idm][Compteurs.NN + Compteurs.X2]},
    ncM () { return this.c.vd[this.idm][Compteurs.NC + Compteurs.X2]},
    ngM () { return this.c.vd[this.idm][Compteurs.NG + Compteurs.X2]},
    pcutq1M () { return Math.round((this.nnM + this. ncM + this.ngM) * 100 / this.q1M)},
    pcutq1 () { return Math.round(this.c.v1 * 100 / (this.c.qv.q1 * UNITEV1)) },

    aboM () { return this.c.vd[this.idm][Compteurs.CA] },
    consoM () {  return this.c.vd[this.idm][Compteurs.CC] },
    cr () { 
      const x = this.aSt.compta.credits
      return x ? x.total : 8
    },
    nbj () { return this.c.nbj(this.cr) },
    txconso () { return this.c.pourcents.pcc },
    alconso () {
      if (this.txconso < 80) return ''
      return ' bg-yellow-3 text-bold text-' + (this.txconso > 100 ? 'negative' : 'warning')
    },
    alsolde () {
      const x = ' bg-yellow-3 text-bold text-'
      return this.nbj <= 0 ? x + 'negative' : (this.nbj < 60 ? x + 'warning' : '')
    }
  },

  data () {
    return {
      idm: 0
    }
  },

  methods: {
    ex (m) { return this.c.vd[m][Compteurs.MS] !== 0  },
    conso (m) { return this.c.vd[m][Compteurs.CC] },
    nl (m) { return this.c.vd[m][Compteurs.X1 + Compteurs.NL] },
    ne (m) { return this.c.vd[m][Compteurs.X1 + Compteurs.NE] },
    vm (m) { return this.c.vd[m][Compteurs.X1 + Compteurs.VM] },
    vd (m) { return this.c.vd[m][Compteurs.X1 + Compteurs.VD] },
    em (m) { return this.c.mm[m] !== 0  }
  },

  setup () {
    const aSt = stores.avatar
    const c = ref(aSt.compta.compteurs)
    // c.value.qv.qc = 0

    function libm (idm) {
      const [ax, mx] = AMJ.am(c.value.dh)
      const x = mx - idm
      const m = x <= 0 ? 12 + x : x
      return $t('mois' + m)
    }

    return {
      aSt, c,
      MD, edqt, mon, nbn, edvol, dhcool, dkli, libm, UNITEV1, UNITEV2
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bordb
  border-bottom: 1px solid $grey-5
</style>
