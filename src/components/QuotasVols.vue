<template>
<div>
  <div v-if="label" class="titre-md full-width">{{label}}</div>
  <div class="row titre-md q-my-xs text-italic full-width">
    <div :class="col4 + ' '">{{$t('CQqn')}}</div>
    <div :class="col4 + ' '">{{$t('CQqv')}}</div>
    <div v-if="vols.qc !== undefined" :class="col4 + ' '">{{$t('CQqc')}}</div>
  </div>
  <div class="row full-width font-mono">
    <div :class="col4 + ' b row justify-around'">
      <div>[{{vols.qn}}]</div>
      <div>{{qnn}}</div>
      <div v-if="anv">{{pcn}}%</div>
      <div class="text-bold">{{mon(abo[1], 3)}}</div>
    </div>
    <div :class="col4 + ' b row justify-around'">
      <div>[{{vols.qv}}]</div>
      <div>{{edvol(qvv)}}</div>
      <div v-if="anv">{{pcv}}%</div>
      <div class="text-bold">{{mon(abo[2], 3)}}</div>
    </div>
    <div v-if="vols.qc !== undefined" :class="col4 + ' b row justify-around'">
      <div>{{mon(vols.qc, 3)}}</div>
      <div v-if="acj" class="text-bold">{{mon(vols.cjm, 3)}}</div>
      <div v-if="acj">{{pcc}}%</div>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed } from 'vue'

import { Tarif, UNITEN, UNITEV } from '../app/api.mjs'
import { edvol, mon} from '../app/util.mjs'

const props = defineProps({
  vols: Object, // {qn qv qc v nn nc ng cjm}
  label: String
})

const abo = computed(() => Tarif.abo(props.vols))
const qnn = computed(() => props.vols.qn * UNITEN)
const qvv = computed(() => props.vols.qv * UNITEV)
const anv = computed(() => props.vols.nn !== undefined && props.vols.nc !== undefined && props.vols.ng !== undefined && props.vols.v !== undefined)
const acj = computed(() => props.vols.cjm !== undefined)
const nn = computed(() => anv.value ? props.vols.nn + props.vols.nc + props.vols.ng : 0)
const pcn = computed(() => {
  if (!anv.value) return ''
  const x = qnn.value ? Math.round(nn.value * 100 / (qnn.value)) : 999
  return x <= 999 ? x : 999
})
const pcv = computed(() => {
  if (!anv.value) return ''
  const x = qvv.value ? Math.round(props.vols.v * 100 / (qvv.value)) : 999
  return x <= 999 ? x : 999
})
const pcc = computed(() => {
  if (!acj.value) return ''
  const x = props.vols.qc ? Math.round(props.vols.cjm * 100 / props.vols.qc) : 999
  return x <= 999 ? x : 999
})

const col4 = computed(() => props.vols.qc === undefined ? 'col-6 text-center ' : 'col-4 text-center ')
const col3 = computed(() => anv.value ? 'col-3 text-center ' : 'col-3 text-center ')
const col6 = computed(() => acj.value ? 'col-4 text-center ' : 'col-12 text-center ')

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.b
  border: 1px solid $primary
.b2
  border-left: 1px solid transparent
  border-right: 1px solid transparent
</style>
