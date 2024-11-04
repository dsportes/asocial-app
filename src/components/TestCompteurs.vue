<template>
<div>
  <div class="row q-gutter-sm items-center">
    <btn-cond class="q-pa-sm" v-for="(s, idx) in steps" :key="idx" :label="'<' + idx + '>'" @ok="move(idx)"/>
  </div>
  <panel-compta v-if="done" :c="steps[idx].cpt" :solde="steps[idx].solde || 0"/>
</div>
</template>

<script setup>
import { ref, computed } from 'vue'

import PanelCompta from './PanelCompta.vue'
import { Compteurs } from '../app/api.mjs'
import BtnCond from './BtnCond.vue'

const steps = ref([
  { 
    d: '04 Nov 2024 10:00:00 GMT',
    qv: { qc: 2, qn: 1, qv: 1, nn: 5, nc: 8, ng: 2, v: 12345 },
    conso: null,
    solde: 0
  },
  { 
    d: '05 Nov 2024 10:00:00 GMT',
    qv: null,
    conso: null,
    solde: 0
  },
  { 
    d: '05 Nov 2024 10:30:00 GMT',
    qv: null,
    conso: { nl: 10, ne: 5, vd: 0, vm: 0 },
    solde: 0
  }
])

const done = ref(false)
const idx = ref(0)

function move (i) { idx.value = i }

for(let i = 0; i < steps.value.length; i++) {
  const s = steps.value[i]
  const dh = Date.parse(s.d)
  s.cpt = new Compteurs(i === 0 ? null : steps.value[i-1].serial, s.qv, s.conso, dh)
  if (s.estA !== undefined) s.cpt.setA(s.estA)
  console.log(new Date(dh).toISOString())
  s.serial = s.cpt.serial
  s.cpt.print()
}
idx.value = steps.value.length - 1
done.value = true

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>