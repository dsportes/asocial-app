<template>
<div class="spmd q-pa-sm">
  <q-btn round size="sm" class="btr" icon="print" @click="c.print()"/>

  <q-expansion-item switch-toggle-side default-opened dense group="somegroup"
      header-class="btbp">
    <template v-slot:header>
      <div class="full-width row justify-between items-center">
        <div class="titre-md text-bold">{{$t('PCPsynth', [dhcool(c.dh, true)])}}</div>
        <bouton-help page="compta_synth"/>
      </div>
    </template>
    <div class="spmd q-my-sm justify-center">
      <div class="text-italic">
        {{$t('PCPref' + tref, [dhcool(c.dh0, true), tref > 2 ? dhcool(c.dhP, true) : ''])}}
      </div>

      <div class="row q-mt-sm">
        <div class="col-8 titre-lg">{{$t('PCPabo1')}}</div>
        <div class="col-2 text-center font-mono"></div>
        <div class="col-2 text-right font-mono text-bold fs-lg">{{p2(cqn + cqv)}}c</div>
      </div>
      <div class="row fs-md q-mt-xs">
        <div class="q-pl-md col-8">{{$t('PCPaboqn')}}</div>
        <div class="col-2 text-center font-mono">{{qv.qn * UNITEN}} [{{c.qv.qn}}]</div>
        <div class="col-2 text-right font-mono">{{p2(cqn)}}c</div>
      </div>
      <div class="row fs-md q-mt-xs">
        <div class="q-pl-lg col-8">{{$t('PCPnbdoc2', [qv.nn, qv.nc, qv.ng])}}</div>
        <div class="col-2 text-center font-mono">{{nbdoc}}</div>
        <div :class="'col-1 text-center font-mono ' + pccl(nbdoc, qv.qn * UNITEN)">{{pced(nbdoc, qv.qn * UNITEN)}}</div>
        <div class="col-1"></div>
      </div>

      <div class="row fs-md q-mt-sm">
        <div class="q-pl-md col-8">{{$t('PCPaboqv')}}</div>
        <div class="col-2 text-center font-mono">{{edvol(qv.qv * UNITEV)}} [{{qv.qv}}]</div>
        <div class="col-2 text-right">{{p2(cqv)}}c</div>
      </div>
      <div class="row fs-md q-mt-xs">
        <div class="q-pl-lg col-8">{{$t('PCPvolf')}}</div>
        <div class="col-2 text-center font-mono">{{edvol(qv.v)}}</div>
        <div :class="'col-1 text-center font-mono ' + pccl(qv.v, qv.qv * UNITEV)">{{pced(qv.v, qv.qv * UNITEV)}}</div>
        <div class="col-1"></div>
      </div>

      <div :class="'row fs-md q-mt-sm ' + dkli(1)">
        <div class="col-8 titre-lg">{{$t('PCPqcal')}}</div>
        <div class="col-2 text-center font-mono">{{qv.qc}}c</div>
        <div class="col-2"></div>
      </div>
      <div :class="'row fs-md q-py-xs ' + dkli(1)">
        <div class="q-pl-md col-8">{{$t('PCPmoyc')}}</div>
        <div class="col-2 text-center font-mono">{{p2(qv.cjm * 30)}}c</div>
        <div :class="'col-1 text-center font-mono ' + pccl(qv.cjm * 30, qv.qc)">{{pced(qv.cjm * 30, qv.qc)}}</div>
        <div class="col-1"></div>
      </div>

      <div class="row fs-md q-mt-sm">
        <div class="col-8 titre-lg">{{$t('PCPsoldac')}}</div>
        <div class="col-2"></div>
        <div class="col-2 text-right">
          <span :class="'font-mono text-bold fs-lg ' + (sc < 0 ? 'p100' : '')">{{mon(sc, 2)}}</span>
        </div>
      </div>

      <div v-if="c.estA && sc > 0" class="q-my-md">
        <span class="titre-md text-italic">{{$t('PCPnbjn')}}</span>
        <span :class="'q-ml-sm font-mono fs-lg' + (njec < 30 ? ' pc100' : '')">{{$t('dansjours', njec, {count: njec})}}</span>
      </div>

      <div v-if="sc < 0" class="q-my-md">
        <span class="titre-md text-italic">{{$t('PCPsneg', [dhcool(c.ddsn, false, true)])}}</span>
      </div>
    </div>
  </q-expansion-item>

  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense group="somegroup"
      header-class="tbp">
    <template v-slot:header>
      <div class="full-width row justify-between items-center">
        <div class="titre-md text-bold">{{$t('PCPdet')}}</div>
        <bouton-help page="compta_detail"/>
      </div>
    </template>
    <div class="splg column q-my-sm items-center">
      <mois-m v-model.number="im" :imd="c.mm" :aaaa="c.aaaa"/>
      <ligne-compteur class="full-width" :v="c.vd[im - 1]" :mm="im" :aaaa="aaaa"/>
    </div>
  </q-expansion-item>

  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense group="somegroup"
      header-class="tbp">
    <template v-slot:header>
      <div class="full-width row justify-between items-center">
        <div class="titre-md text-bold">{{$t('PCPtarifs')}}</div>
        <bouton-help page="compta_tarifs"/>
      </div>
    </template>
    <div class="spmd column q-mb-sm q-pa-xs items-center">
      <div class="text-italic titre-md q-my-sm">{{$t('PCPcent')}}</div>

      <mois-m v-model.number="im" :imd="c.mm" :aaaa="c.aaaa"/>

      <div class="q-ml-md q-my-sm">
        <div v-for="(nom, idx) in cuf" :key="nom">
          <div :class="'row fs-md full-width ' + dkli(idx)">
            <div class="col-2 font-mono text-bold text-center">{{mon(cu[idx],2)}}</div>
            <div class="col-10">{{$t('PCPt' + nom)}}</div>
          </div>
        </div>
      </div>
    </div>
  </q-expansion-item>
</div>
</template>

<script setup>
import { ref, computed } from 'vue'

import stores from '../stores/stores.mjs'
import { Tarif, UNITEN, UNITEV } from '../app/api.mjs'
import { $t, mon, dhcool, dkli, edvol } from '../app/util.mjs'
import MoisM from './MoisM.vue'
import LigneCompteur from './LigneCompteur.vue'
import BoutonHelp from './BoutonHelp.vue'

const props = defineProps({
  c: Object
})

const session = stores.session

const tref = computed(() => props.c.dhP === props.c.dh0 ? (props.c.estA ? 1 : 0) : (props.c.estA ? 3 : 2 ))

const im = ref(props.c.mm)
const aaaa = computed(() => {
  let a = props.c.aaaa
  const m = props.c.mm
  return im.value <= m && im.value > 0 ? a : a - 1
})

const cu = computed(() => Tarif.cu(aaaa.value, im.value))

const cuf = ['AN', 'AF', 'lec', 'ecr', 'mon', 'des']

const cuj = computed(() => Tarif.cu(props.c.aaaa, props.c.mm))

const qv = computed(() => props.c.qv )
const cqn = computed(() => qv.value.qn * cuj.value[0])
const cqv = computed(() => qv.value.qv * cuj.value[1])
const nbdoc = computed(() => qv.value.nn + qv.value.nc + qv.value.ng)
const sc = computed(() => props.c.soldeCourant)
const njec = computed(() => props.c.njec )

const p0 = (x) => x === 0 ? '0' : (x < 1 ? '<1' : Math.round(x))
const p2 = (x) => x === 0 ? '0' : (x < 0.01 ? '<0,01' : x.toPrecision(2))
const p4 = (x) => x === 0 ? '0' : (x < 0.0001 ? '<0,0001' : x.toPrecision(4))
const p5 = (x) => x === 0 ? '0' : (x < 0.0001 ? '<0,0001' : x.toPrecision(5))
const pv = (x) => x === 0 ? '0B' : (x < 1 ? '<1B' : edvol(x))
const p2s = (x) => x < 0 ? '-' + p2(-x) : p2(x)
const p4s = (x) => x < 0 ? '-' + p4(-x) : p4(x)
const p5s = (x) => x < 0 ? '-' + p5(-x) : p5(x)

const pc = (x, y) => y === 0 ? 999 : (x * 100) / y
const pced = (x, y) => { const q = pc(x, y)
  return q >= 999 ? '?' : (q === 0 ? '0%' : (q < 1 ? '<1%' : Math.round(q) + '%'))
}
const pccl = (x, y) => { const q = pc(x, y)
  return q >= 999 ? '' : (q >= 100 ? ' p100 ' : (q >= 80 ? ' p80 ' : ''))
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btr
  position: absolute
  top: -25px
  z-index: 10000
  right: 0
.p80
  padding: 0 3px
  border: 1px solid $warning
  color: black
  background-color: $yellow-5
.p100
  padding: 0 3px
  font-weight: bold
  border: 2px solid $negative
  color: black
  background-color: $yellow-5
</style>
