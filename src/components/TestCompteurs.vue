<template>
<div>
  <div class="row q-gutter-md q-mb-lg">
    <input v-model.number="startStep"
      :label="'stop à 1...' + steps.length"
      type="number"
      filled
      style="max-width: 10rem"
    />
    <btn-cond label="start" @ok="start"/>
    <btn-cond v-if="nextStep > 0 && nextStep < steps.length" :label="'next=' + nextStep" @ok="next"/>
    <div>{{dhs}}</div>
  </div>
  <panel-compta v-if="nextStep" :c="c" :solde="nextStep -1"/>
</div>
</template>

<script setup>
import { ref, computed } from 'vue'

import PanelCompta from './PanelCompta.vue'
import { Compteurs } from '../app/api.mjs'
import BtnCond from './BtnCond.vue'

const c = ref()
const solde = ref(0)
const dhs = ref(0)
const nextStep = ref(0)
const startStep = ref(1)

function start () {
  for(let n = 0; n < startStep.value; n++) std(n)
  nextStep.value = startStep.value
}

function next () {
  std(nextStep.value)
  nextStep.value++
}

function std (i) {
  const s = steps.value[i]
  const dh = Date.parse(s.d)
  dhs.value = new Date(dh).toISOString()
  c.value = new Compteurs(i === 0 ? null : serial[i-1], s.qv, s.conso, dh)
  if (s.estA !== undefined) c.value.setA(s.estA)
  console.log(dhs.value)
  c.value.print()
  serial[i] = c.value.serial
}

const steps = ref([
  { 
    d: '04 Nov 2024 10:00:00 GMT',
    qv: { qc: 2, qn: 1, qv: 1, nn: 0, nc: 0, ng: 0, v: 0 },
    conso: null,
    solde: 0
  },
  { 
    d: '04 Nov 2024 10:30:00 GMT',
    qv: null,
    conso: { nl: 10, ne: 5, vd: 0, vm: 0 },
    solde: 0
  }
])

const serial = new Array(steps.value.length)

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>