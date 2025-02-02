<template>
  <div class="q-pa-xs">
    <div class="row items-center" style="position:relative">
      <bouton-bulle idtext="BULLEquotas" class="bb"/>
      <div class="col-5 row items-center">
        <div class="titre-md mh">{{$t('CQnbdocs', qn * UNITEN)}}</div>
        <div v-if="model.n" :class="'font-mono q-ml-sm ' + st(pcn)">[{{model.n}} {{pcn}}%]</div>
      </div>

      <q-input class="col-3 text-center" dense v-model.number="qn" type="number" :disable="lecture"/>

      <div class="col-4 row items-center justify-start q-pl-sm">
        <btn-cond v-if="!lecture" :disable="qn === qni" 
          class="q-ml-sm" icon="undo" size="sm" color="warning" @ok="undo1"/>
        <div :class="'q-px-xs ' + stmx(qn, model.minn || 0, model.maxn || mx)">
          {{(model.minn || 0) + '...' + (model.maxn || mx)}}</div>
      </div>
    </div>

    <div class="row items-center">
      <div class="col-5 row items-center">
        <div class="titre-md mh">{{ed2(qv) + ' ' + $t('CQvolfics')}}</div>
        <div v-if="model.v" :class="'font-mono q-ml-sm ' + st(pcv)">[{{edvol(model.v)}} {{pcv}}%]</div>
      </div>

      <q-input class="col-3 text-center" dense v-model.number="qv" type="number" :disable="lecture"/>

      <div class="col-4 row items-center justify-start q-pl-sm">
        <btn-cond v-if="!lecture" :disable="qv === qvi" 
          class="q-ml-sm" icon="undo" size="sm" color="warning" @ok="undo2"/>
        <div :class="'q-px-xs ' + stmx(qv, model.minv || 0, model.maxv || mx)">
          {{(model.minv || 0) + '...' + (model.maxv || mx)}}</div>
      </div>
    </div>

    <div v-if="!groupe" class="row items-center">
      <div class="col-5 row items-center">
        <div class="titre-md mh">{{edc(qc) + ' ' + $t('CQconsocalc')}}</div>
      </div>

      <q-input class="col-3 text-center" dense v-model.number="qc" type="number" :disable="lecture"/>

      <div class="col-4 row items-center justify-start q-pl-sm">
        <btn-cond v-if="!lecture" :disable="qc === qci" 
          class="q-ml-sm" icon="undo" size="sm" color="warning" @ok="undoc"/>
        <div :class="'q-px-xs ' + stmx(qc, model.minc || 0, model.maxc || mx)">
          {{(model.minc || 0) + '...' + (model.maxc || mx)}}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, computed, onUnmounted, ref } from 'vue'

import stores from '../stores/stores.mjs'
import { edvol, mon } from '../app/util.mjs'
import { UNITEV, UNITEN } from '../app/api.mjs'
import BtnCond from './BtnCond.vue'
import BoutonBulle from './BoutonBulle.vue'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const props = defineProps({ 
  lecture: Boolean,
  groupe: Boolean // Ne présente pas de qc (groupe et quotas des comptes A)
})
const mx = 999999

const model = defineModel({ type: Object }) // quotas

const qni = model.value.qn || 0 // valeurs initiales
const qvi = model.value.qv || 0
const qci = model.value.qc || 0
const qn = ref(qni)
const qv = ref(qvi)
const qc = ref(qci)

const pc = (n, q, u) => {
  const nx = n || 0
  if (nx === 0) return 0
  if (!q) return 999
  return Math.floor(nx * 100 / (q * u))
}

const pcn = computed(() => pc(model.value.n, qn.value, UNITEN))
const pcv = computed(() => pc(model.value.v, qv.value, UNITEV))
const err = computed(() => {
  if (qn.value < (model.value.minn || 0)) return 'minn'
  if (qn.value > (model.value.maxn || mx)) return 'maxn'
  if (qv.value < (model.value.minv || 0)) return 'minv'
  if (qv.value > (model.value.maxv || mx)) return 'maxv'
  if (qc.value < (model.value.minc || 0)) return 'minc'
  if (qc.value > (model.value.maxc || mx)) return 'maxc'
  return ''
})

const chg = computed(() => qn.value !== qni || qv.value !== qvi || qc.value !== qci )

const setModel = () => {
  const m = { ...model.value }
  m.qn = qn.value
  m.qv = qv.value
  m.qc = qc.value
  m.err = err.value
  m.chg = chg.value
  model.value = m
}

if (err.value) setModel()

watch(qn, (ap, av) => { setModel() })
watch(qv, () => { setModel() })
watch(qc, () => { setModel() })

const st = (pc) => pc < 80 ? 'fs-md' : 
  (pc < 100 ? 'bg-yellow-3 fs-md text-black' : 'bg-yellow-3 fs-md text-bold text-negative')
const stmx = (v, min, max) => v < min || v > max ? 'bg-yellow-3 fs-md text-bold text-negative' :''
const ed2 = (v) => v ? edvol(v * UNITEV) : '0B'
const edc = (v) => mon(v)

function undo1 () { qn.value = qni }
function undo2 () { qv.value = qvi }
function undoc () { qc.value = qci }

</script>

<style lang="sass" scoped>
@import '../css/input2.sass'
.bordok
  border: 1px solid var(--q-positive)
.bordko
  border: 1px solid var(--q-warning)
.mh
  max-height: 1.2rem
  overflow-y: hidden
.bb
  position: absolute
  top: 0
  right: 0
</style>
