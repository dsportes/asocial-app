<template>
  <div class="q-pa-sm dp40">
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
    :header-class="hcabo1" :icon="icoabo1" :label="$t('PCPabo1')">
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
    :header-class="hcabo2" :icon="icoabo2" :label="$t('PCPabo2')">
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
    :header-class="hcconso" :icon="icoconso" :label="$t('PCPcconso')">
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
        <panel-deta :c="c" :total="aSt.compta.credits.total"/>
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

  <q-expansion-item switch-toggle-side dense group="trgroup"
    header-class="titre-md text-bold bg-primary text-white"
    :label="$t('PCPtarifs')">
    <div class="largeur40 column maauto q-mb-sm q-pa-xs">
      <div class="text-italic titre-md q-my-sm">{{$t('PCPcent')}}</div>

      <div class="q-ml-md q-my-sm">
        <div v-for="u in cu" :key="u" class="row fs-md full-width">
          <div class="col-1">{{u}}</div>
          <div class="col-11">{{$t('PCPt' + u)}}</div>
        </div>
      </div>

      <div class="row fs-md q-mt-sm" :class="dkli(1)">
        <div class="col-2 text-italic">{{$t('PCPaamm')}}</div>
        <div class="col-10 row text-italic text-center">
          <div v-for="u in cu" :key="u" class="col-2">{{u}}</div>
        </div>
      </div>

      <div v-for="(t, ix) in tarifs" :key="t[0]" :class="dkli(ix) + ' q-my-xs'">
        <div class="row items-center q-my-xs fs-md">
          <div class="col-2">{{(''+t.am).substring(0,4) + '/' + (''+t.am).substring(4)}}</div>
          <div class="col-10 row">
            <div v-for="(i, idx) in 6" :key="i" 
              class="col-2 font-mono text-center">
              {{mon(t.cu[idx], 2)}}
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-expansion-item>
  </div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { UNITEV1, UNITEV2, AMJ, Compteurs, Tarif } from '../app/api.mjs'
import { dhcool, edqt, mon, nbn, edvol, dkli, $t } from '../app/util.mjs'
import MoisM from './MoisM.vue'
import PanelDeta from '../components/PanelDeta.vue'

export default ({
  name: 'PanelCompta',

  props: { },

  components: { MoisM, PanelDeta },

  computed: {
    icoabo1 () {
      if (this.abo1w) return 'report'
      else if (this.abo1n) return 'lock'
      else return 'check'
    },
    icoabo2 () {
      if (this.abo2w) return 'report'
      else if (this.abo2n) return 'lock'
      else return 'check'
    },
    icoconso () {
      if (this.consow) return 'report'
      else if (this.conson) return 'lock'
      else return 'check'
    },
    hcabo1 () {
      if (this.abo1w) return 'titre-md text-bold text-white bg-warning'
      else if (this.abo1n) return 'titre-md text-bold text-white bg-negative'
      else return 'titre-md text-bold text-white bg-primary'
    },
    hcabo2 () {
      if (this.abo2w) return 'titre-md text-bold text-white bg-warning'
      else if (this.abo2n) return 'titre-md text-bold text-white bg-negative'
      else return 'titre-md text-bold text-white bg-primary'
    },
    hcconso () {
      if (this.consow) return 'titre-md text-bold text-white bg-warning'
      else if (this.conson) return 'titre-md text-bold text-white bg-negative'
      else return 'titre-md text-bold text-white bg-primary'
    },
    abo1w () { return this.pcutq1 > 90 && this.pcutq1 < 100 },
    abo1n () { return this.pcutq1 > 100 },
    abo2w () { return this.pcutq2 > 90 && this.pcutq2 < 100 },
    abo2n () { return this.pcutq1 > 100 },
    consow () {
      return (this.c.estA && (this.nbj > 0 && this.nbj < 60)) ||
        (!this.c.estA && (this.txconso > 80 && this.txconso < 100))
    },
    conson () {
      return (this.c.estA && this.nbj <= 0) ||
        (!this.c.estA && this.txconso > 100)
    },

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
    nbj () { return this.c.nbj(this.aSt.compta.credits.total) },
    txconso () { return this.c.pourcents.pcc },
    alconso () {
      if (this.txconso < 80) return ''
      return ' bg-yellow-3 text-bold text-' + (this.txconso > 100 ? 'negative' : 'warning')
    },
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
    const cu = ['AN', 'AF', 'lec', 'ecr', 'mon', 'des']

    return {
      tarifs: Tarif.tarifs,
      aSt, c, cu,
      edqt, mon, nbn, edvol, dhcool, dkli, libm, UNITEV1, UNITEV2
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bordb
  border-bottom: 1px solid $grey-5
</style>
