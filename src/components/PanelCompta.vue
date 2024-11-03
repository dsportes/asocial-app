<template>
<div class="spmd q-pa-sm">
<div v-if="session.compta && c">
  <q-btn label="print" @click="c.print()"/>
  <q-expansion-item switch-toggle-side default-opened dense
      header-class="titre-md text-bold bg-primary text-white"
      :label="$t('PCPsyn') + ' - ' + dhcool(c.dh)">
    <div class="spmd column q-my-sm">
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
        <div class="col-4 font-mono text-center">{{mon(c.cumulCouts, 4)}}</div>
        <div class="col-4 font-mono text-center">{{exM ? mon(aboM + consoM, 4) : '-'}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 text-italic">{{$t('PCPabo')}}</div>
        <div class="col-4 font-mono text-center">{{mon(c.cumulAbo, 4)}}</div>
        <div class="col-4 font-mono text-center">{{exM ? mon(aboM, 4) : '-'}}</div>
      </div>
      <div class="row items-center full-width">
        <div class="col-4 text-italic">{{$t('PCPconso')}}</div>
        <div class="col-4 font-mono text-center">{{mon(c.cumulConso, 4)}}</div>
        <div class="col-4 font-mono text-center">{{exM ? mon(consoM, 4) : '-'}}</div>
      </div>
    </div>
  </q-expansion-item>
  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense group="trgroup"
    :header-class="hcabo1" :icon="icoabo1" :label="$t('PCPabo1')">
    <div class="spmd column q-my-sm">
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
        <div class="col-4 font-mono text-center bg-secondary text-white text-bold">
          {{(c.qv.qn * UNITEN) + ' [' + c.qv.qn + ']'}}</div>
        <div class="col-4 font-mono text-center">{{exM ? q1M.toPrecision(6) : '-'}}</div>
      </div>
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPutil')}}</div>
        <div class="col-4 font-mono text-center">{{pcutq1 + '%'}}</div>
        <div class="col-4 font-mono text-center">{{exM ? (pcutq1M + '%') : '-'}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPnbno')}}</div>
        <div class="col-4 font-mono text-center">{{c.qv.nn}}</div>
        <div class="col-4 font-mono text-center">{{exM ? nnM.toPrecision(4) : '-'}}</div>
      </div>
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPnbch')}}</div>
        <div class="col-4 font-mono text-center">{{c.qv.nc}}</div>
        <div class="col-4 font-mono text-center">{{exM ? ncM.toPrecision(4) : '-'}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPnbgr')}}</div>
        <div class="col-4 font-mono text-center">{{c.qv.ng}}</div>
        <div class="col-4 font-mono text-center">{{exM ? ngM.toPrecision(4) : '-'}}</div>
      </div>
    </div>
  </q-expansion-item>
  <q-separator/>
  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense group="trgroup"
    :header-class="hcabo2" :icon="icoabo2" :label="$t('PCPabo2')">
    <div class="spmd column q-my-sm">
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
        <div class="col-4 font-mono text-center bg-secondary text-white text-bold">
          {{edvol(c.qv.qv * UNITEV) + ' [' + c.qv.qv + ']'}}</div>
        <div class="col-4 font-mono text-center">{{exM ? edvol(q2M) : '-'}}</div>
      </div>
      <div :class="dkli(1) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPutil')}}</div>
        <div class="col-4 font-mono text-center">{{pcutq2 + '%'}}</div>
        <div class="col-4 font-mono text-center">{{exM ? (pcutq2M + '%') : '-'}}</div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div class="col-4">{{$t('PCPv2')}}</div>
        <div class="col-4 font-mono text-center">{{c.qv.v}}</div>
        <div class="col-4 font-mono text-center">{{exM ? v2M : '-'}}</div>
      </div>
    </div>
  </q-expansion-item>
  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense group="trgroup"
    :header-class="hcconso" :icon="icoconso" :label="$t('PCPcconso')">
    <div class="spmd column q-my-sm">
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

      <div v-if="!estA">
        <div class="titre-md q-my-md">
          <div class="q-pa-xs bg-secondary text-white text-bold">{{$t('PCPplaf', [mon(c.qv.qc)])}}</div>
          <div>{{$t('PCPprefc' + c.debref[0], [dhcool(c.debref[1]), mon(c.conso2B, 2)], libm(1))}}</div>
          <div :class="alconso">{{$t('PCPcmoy', [mon(c.conso2M, 2), txconso, mon(c.qv.qc), libm(1)])}}</div>
        </div>
      </div>

      <div v-if="estA" class="column q-my-sm full-width">
        <panel-deta :c="c" :total="session.compta.solde"/>
      </div>
    </div>
  </q-expansion-item>
  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense group="trgroup"
    header-class="titre-md text-bold bg-primary text-white"
    :label="$t('PCPrecap')">
    <div class="spmd column q-mb-sm">
      <div :class="dkli(1) + ' row items-center full-width'">
        <div v-for="(n, m) in 6" :key="n" class="col-2 text-center text-italic text-orange">
          {{libm(m)}}
        </div>
      </div>
      <div :class="dkli(0) + ' row items-center full-width'">
        <div v-for="(n, m) in 6" :key="n" class="col-2 text-center font-mono q-mb-sm">
          {{em(m) ? mon(c.mm[m], 2) : '-'}}
        </div>
      </div>
      <div v-if="em(6)" :class="dkli(1) + ' row items-center full-width'">
        <div v-for="(n, m) in 6" :key="n" class="col-2 text-center text-italic text-orange">
          {{libm(m + 6)}}
        </div>
      </div>
      <div v-if="em(6)" :class="dkli(0) + ' row items-center full-width'">
        <div v-for="(n, m) in 6" :key="n" class="col-2 text-center font-mono q-mb-sm">
          {{em(m + 6) ? mon(c.mm[m + 6], 2) : '-'}}
        </div>
      </div>
      <div v-if="em(12)" :class="dkli(1) + ' row items-center full-width'">
        <div v-for="(n, m) in 6" :key="n" class="col-2 text-center text-italic text-orange">
          {{libm(m + 12)}}
        </div>
      </div>
      <div v-if="em(12)" :class="dkli(0) + ' row items-center full-width'">
        <div v-for="(n, m) in 6" :key="n" class="col-2 text-center font-mono q-mb-sm">
          {{em(m + 12) ? mon(c.mm[m + 12], 2) : '-'}}
        </div>
      </div>
    </div>
  </q-expansion-item>
  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense group="trgroup"
    header-class="titre-md text-bold bg-primary text-white"
    :label="$t('PCPtarifs')">
    <div class="spmd column q-mb-sm q-pa-xs">
      <div class="text-italic titre-md q-my-sm">{{$t('PCPcent')}}</div>

      <div class="q-ml-md q-my-sm">
        <div v-for="u in cu" :key="u" class="row fs-md full-width">
          <div class="col-1">{{u}}</div>
          <div class="col-11">{{$t('PCPt' + u)}}</div>
        </div>
      </div>

      <div class="row fs-md q-mt-sm" :class="dkli(1)">
        <div class="col-2 text-italic text-bold text-orange">{{$t('PCPaamm')}}</div>
        <div class="col-10 row text-italic text-center text-bold text-orange">
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
</div>
</template>

<script setup>
import { ref, computed } from 'vue'

import stores from '../stores/stores.mjs'
import { UNITEN, UNITEV, AMJ, Compteurs, Tarif } from '../app/api.mjs'
import { $t, dhcool, mon, nbn, edvol, dkli } from '../app/util.mjs'
import MoisM from './MoisM.vue'
import PanelDeta from '../components/PanelDeta.vue'

const ui = stores.ui
const session = stores.session

const tarifs = Tarif.tarifs
const cu = ['AN', 'AF', 'lec', 'ecr', 'mon', 'des']

const idm = ref(0)

const c = computed(() => session.compta.compteurs)
const estA = computed(() => session.compta.estA)
const icoabo1 = computed(() => abo1w.value ? 'report' : (abo1n.value ? 'lock': 'check'))
const icoabo2 = computed(() => abo2w.value ? 'report' : (abo2n.value ? 'lock': 'check'))
const icoconso = computed(() => consow.value ? 'report' : (conson.value ? 'lock': 'check'))
const hcabo1 = computed(() => abo1w.value ? 'titre-md text-bold text-white bg-warning'
      : (abo1n.value ? 'titre-md text-bold text-white bg-negative' : 'titre-md text-bold text-white bg-primary'))
const hcabo2 = computed(() => abo2w.value ? 'titre-md text-bold text-white bg-warning'
      : (abo2n.value ? 'titre-md text-bold text-white bg-negative' : 'titre-md text-bold text-white bg-primary'))
const hcconso = computed(() => consow.value ? 'titre-md text-bold text-white bg-warning'
      : (conson.value ? 'titre-md text-bold text-white bg-negative' : 'titre-md text-bold text-white bg-primary'))
const abo1w = computed(() => pcutq1.value > 90 && pcutq1.value < 100)
const abo1n = computed(() => pcutq1.value > 100)
const abo2w = computed(() => pcutq2.value > 90 && pcutq2.value < 100)
const abo2n = computed(() => pcutq1.value > 100)
const consow = computed(() => (estA.value && (nbj.value > 0 && nbj.value < 60)) ||
        (!estA.value && (txconso.value > 80 && txconso.value < 100)))
const conson = computed(() => (estA.value && nbj.value <= 0) ||
        (!estA.value && txconso.value > 100))
const exM = computed(() => c.value.vd[idm.value][Compteurs.MS] !== 0)
const q2M = computed(() => c.value.vd[idm.value][Compteurs.QV] * UNITEV)
const v2M = computed(() => c.value.vd[idm.value][Compteurs.V + Compteurs.X2])
const pcutq2M = computed(() => Math.round(v2M.value * 100 / q2M.value))
const pcutq2 = computed(() => Math.round(c.value.qv.v * 100 / (c.value.qv.qv * UNITEV)))

const q1M = computed(() => c.value.vd[idm.value][Compteurs.QN] * UNITEN)
const nnM = computed(() => c.value.vd[idm.value][Compteurs.NN  + Compteurs.X1 + Compteurs.X2])
const ncM = computed(() => c.value.vd[idm.value][Compteurs.NC + Compteurs.X1 + Compteurs.X2])
const ngM = computed(() => c.value.vd[idm.value][Compteurs.NG  + Compteurs.X1 + Compteurs.X2])
const pcutq1M = computed(() => Math.round((nnM.value + ncM.value + ngM.value) * 100 / q1M.value))
const pcutq1 = computed(() => Math.round((c.value.qv.nn + c.value.qv.nc + c.value.qv.ng) * 100 / (c.value.qv.qn * UNITEN)))

const aboM = computed(() => c.value.vd[idm.value][Compteurs.CA])
const consoM = computed(() => c.value.vd[idm.value][Compteurs.CC])
const nbj = computed(() => c.value.nbj(session.compta.solde))
const txconso = computed(() => c.value.pourcents.pcc)
const alconso = computed(() => txconso.value < 80 ? '' 
  : (' bg-yellow-3 text-bold text-' + (txconso.value > 100 ? 'negative' : 'warning')))

const ex = (m) => c.value.vd[m][Compteurs.MS] !== 0
const conso = (m) => c.value.vd[m][Compteurs.CC]
const nl = (m) => c.value.vd[m][Compteurs.X1 + Compteurs.NL]
const ne = (m) => c.value.vd[m][Compteurs.X1 + Compteurs.NE]
const vm = (m) => c.value.vd[m][Compteurs.X1 + Compteurs.VM]
const vd = (m) => c.value.vd[m][Compteurs.X1 + Compteurs.VD]
const em = (m) => c.value.mm[m] !== 0

function libm (idm) {
  const [ax, mx] = AMJ.am(c.value.dh)
  const x = mx - idm
  const m = x <= 0 ? 12 + x : x
  return $t('mois' + m)
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bordb
  border-bottom: 1px solid $grey-5
</style>
