<template>
  <div class="q-pa-xs">
    <div class="row items-center" style="position:relative">
      <bouton-bulle idtext="quotas" class="bb"/>
      <div class="col-5 row items-center">
        <div class="titre-md mh">{{$t('CQnbdocs', model.qn * UNITEN)}}</div>
        <div v-if="model.n && model.qn > 0" :class="'font-mono q-ml-sm ' + st(pcn)">[{{pcn}}%]</div>
      </div>

      <q-input class="col-3 text-center" dense v-model.number="model.qn" type="number" :disable="lecture"/>

      <div class="col-4 row items-center justify-start q-pl-sm">
        <btn-cond v-if="!lecture" :disable="model.qn === qni" 
          class="q-ml-sm" icon="undo" size="sm" color="warning" @click="undo1"/>
        <div :class="'q-px-xs ' + stmx(model.qn, model.minn, model.maxn)">{{model.minn + '...' + model.maxn}}</div>
      </div>
    </div>

    <div class="row items-center">
      <div class="col-5 row items-center">
        <div class="titre-md mh">{{ed2(model.qv) + ' ' + $t('CQvolfics')}}</div>
        <div v-if="model.n && model.qv > 0" :class="'font-mono q-ml-sm ' + st(pcv)">[{{pcv}}%]</div>
      </div>

      <q-input class="col-3 text-center" dense v-model.number="model.qv" type="number" :disable="lecture"/>

      <div class="col-4 row items-center justify-start q-pl-sm">
        <btn-cond v-if="!lecture" :disable="model.qv === qvi" 
          class="q-ml-sm" icon="undo" size="sm" color="warning" @click="undo2"/>
        <div :class="'q-px-xs ' + stmx(model.qv, model.minv, model.maxv)">{{model.minv + '...' + model.maxv}}</div>
      </div>
    </div>

    <div v-if="!groupe" class="row items-center">
      <div class="col-5 row items-center">
        <div class="titre-md mh">{{edc(model.qc) + ' ' + $t('CQconsocalc')}}</div>
      </div>

      <q-input class="col-3 text-center" dense v-model.number="model.qc" type="number" :disable="lecture"/>

      <div class="col-4 row items-center justify-start q-pl-sm">
        <btn-cond v-if="!lecture" :disable="model.qc === qci" 
          class="q-ml-sm" icon="undo" size="sm" color="warning" @click="undoc"/>
        <div :class="'q-px-xs ' + stmx(model.qc, model.minc, model.maxc)">{{model.minc + '...' + model.maxc}}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { edvol, mon } from '../app/util.mjs'
import { UNITEV, UNITEN } from '../app/api.mjs'
import BtnCond from './BtnCond.vue'
import BoutonBulle from './BoutonBulle.vue'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const props = defineProps({ 
  lecture: Boolean,
  groupe: Boolean
})

const model = defineModel({ type: Object }) // quotas

const qni = model.value.qn // valeurs initiales
const qvi = model.value.qv
const qci = model.value.qc

const pcn = computed(() => model.value.qn ? Math.floor(model.value.n * 100 / (model.value.qn * UNITEN)) : 999)
const pcv = computed(() => model.value.qv ? Math.floor(model.value.v * 100 / (model.value.qv * UNITEV)) : 999)
const err = computed(() =>
  (model.value.qn < model.value.minn) || (model.value.qn > model.value.maxn) ||
  (model.value.qv < model.value.minv) || (model.value.qv > model.value.maxv) ||
  (model.value.qc < model.value.minc) || (model.value.qc > model.value.maxc)
)
const chg = computed(() => model.value.qn !== qni || model.value.qv !== qvi || model.value.qc !== qci )

watch(err, () => { model.value.err = err.value})
watch(chg, () => { model.value.chg = chg.value})

const st = (pc) => pc < 80 ? 'fs-md' : 
  (pc < 100 ? 'bg-yellow-3 fs-lg text-bold text-negative' : 'bg-yellow-3 fs-xl text-bold text-negative')
const stmx = (v, min, max) => v < min || v > max ? 'bg-yellow-3 fs-md text-bold text-negative' :''
const ed2 = (v) => edvol(v * UNITEV)
const edc = (v) => mon(v)

function undo1 () { model.value.qn = qni }
function undo2 () { model.value.qv = qvi }
function undoc () { model.value.qc = qci }

</script>

<style lang="sass" scoped>
@import '../css/input2.sass'
.bordok
  border: 1px solid $green-5
.bordko
  border: 1px solid $warning
.mh
  max-height: 1.2rem
  overflow-y: hidden
.bb
  position: absolute
  top: 0
  right: 0
</style>
