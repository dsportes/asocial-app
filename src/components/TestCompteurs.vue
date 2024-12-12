<template>
<div>
  <div class="row q-gutter-sm items-center">
    <btn-cond class="q-pa-sm" v-for="(s, idx) in steps" :key="idx" :label="'<' + idx + '>'" @ok="move(idx)"/>
  </div>
  <panel-compta v-if="done" :c="steps[idx].cpt"/>
</div>
</template>

<script setup>
import { ref, computed } from 'vue'

import PanelCompta from './PanelCompta.vue'
import { Compteurs } from '../app/api.mjs'
import BtnCond from './BtnCond.vue'
import { dhstring } from '../app/util.mjs'

const steps = ref([
  { 
    d: '04 Nov 2024 10:00:00 UTC',
    qv: { qc: 8, qn: 8, qv: 4, nn: 0, nc: 0, ng: 0, v: 0 },
    conso: { nl: 200, ne: 100, vd: 0, vm: 0 },
    dbcr: 5,
    idp: 'abcd'
  },
  { 
    d: '05 Nov 2024 10:00:00 UTC',
    qv: { qc: 8, qn: 8, qv: 4, nn: 100, nc: 80, ng: 20, v: 100000000 },
    conso: { nl: 50, ne: 10, vd: 0, vm: 0 },
    dbcr: 0
  },
  { 
    d: '10 Nov 2024 10:00:00 UTC',
    qv: { qc: 8, qn: 8, qv: 4, nn: 100, nc: 80, ng: 20, v: 100000000 },
    conso: { nl: 200, ne: 100, vd: 0, vm: 0 },
    dbcr: 0
  },
  { 
    d: '2 Dec 2024 10:30:00 UTC',
    qv: { qc: 4, qn: 1, qv: 1, nn: 100, nc: 80, ng: 20, v: 80000000 },
    conso: { nl: 200, ne: 100, vd: 0, vm: 0 },
    dbcr:100
  },
  { 
    d: '1 Sept 2025 10:30:00 UTC',
    qv: { qc: 4, qn: 1, qv: 1, nn: 100, nc: 80, ng: 20, v: 80000000 },
    conso: { nl: 200, ne: 100, vd: 0, vm: 0 },
    dbcr: 0
  }
])

const steps2 = ref([
  { 
    d: '04 Nov 2024 10:00:00 UTC',
    qv: { qc: 8, qn: 8, qv: 4, nn: 0, nc: 0, ng: 0, v: 0 },
    conso: null,
    dbcr: 1,
    idp: '',
    dbcr: 1
  },
  { 
    d: '05 Nov 2024 10:00:00 UTC',
    qv: { qc: 8, qn: 8, qv: 4, nn: 100, nc: 80, ng: 20, v: 100000000 },
    conso: { nl: 1000, ne: 500, vd: 100000000, vm: 200000000 },
    dbcr: 0
  },
  { 
    d: '02 Jan 2025 10:30:00 GMT',
    qv: { qc: 4, qn: 1, qv: 1, nn: 100, nc: 80, ng: 20, v: 80000000 },
    conso: null,
    dbcr: 0
  },
  { 
    d: '31 Jan 2025 23:59:59 UTC',
    qv: { qc: 4, qn: 1, qv: 1, nn: 100, nc: 80, ng: 20, v: 80000000 },
    conso: null,
    dbcr: 0
  },
  { 
    d: '01 Feb 2025 00:00:00 UTC',
    qv: { qc: 4, qn: 1, qv: 1, nn: 100, nc: 80, ng: 20, v: 80000000 },
    conso: null,
    dbcr: 0
  },
  { 
    d: '02 Jun 2025 10:30:00 UTC',
    qv: null,
    conso: { nl: 1000, ne: 500, vd: 100000000, vm: 200000000 },
    idp: 'abcd',
    dbcr: -5
  },
  { 
    d: '02 Jul 2025 10:30:00 UTC',
    qv: null,
    conso: null,
    dbcr: 80
  }
])

const done = ref(false)
const idx = ref(0)

function move (i) { idx.value = i }

for(let i = 0; i < steps.value.length; i++) {
  // constructor (serial, qv, conso, chgA, dbcr, dh)
  const s = steps.value[i]
  s.cpt = new Compteurs(i === 0 ? null : 
    steps.value[i-1].serial, s.qv, s.conso, s.idp, s.dbcr, Date.parse(s.d))
  s.serial = s.cpt.serial
  s.cpt.print()
}
idx.value = steps.value.length - 1
done.value = true

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>