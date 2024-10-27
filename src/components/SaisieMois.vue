<template>
<span class="row justify-start">
  <span class="column items-end q-mr-sm">
    <span class="titre-md">{{label}}</span>
    <span :class="(err ? 'text-right text-bold text-negative bg-yellow-5' : '') + ' font-mono fs-xs q-py-none q-px-xs q-mx-sm'">
      {{min}}...{{max}}
    </span>
  </span>
  <span class="row" style="overflow:hidden;height:2rem">
    <q-input class="font-mono text-bold fs-md q-mr-xs" v-model="aa" dense
      style="width:3rem;position:relative;top:-9px;" prefix="20"/>
    <q-select class="font-mono text-bold fs-md" v-model="mm" dense :options="mois"
      style="width:2.5rem;position:relative;top:-9px;"/>
  </span>
  <btn-cond class="self-start q-ml-sm" color="warning"
    :icon="icon" round @ok="ok" :disable="err"/>
</span>
</template>

<script setup>
import { ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import { AMJ } from '../app/api.mjs'

const props = defineProps({ 
  dmin: Number, 
  dmax: Number, 
  dinit: Number, 
  icon: String, 
  label: String
})

const emit = defineEmits(['ok'])

const session = stores.session
const [a1, m1, j1] = AMJ.aaaammjj(session.auj)
const aa = ref(a1 % 100)
const mm = ref(m1)
const mois = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
const err = ref(false)

if (props.dinit) {
  const a = Math.round(props.dinit / 100)
  const m = props.dinit % 100
  if (a >= 2000 && a <= 2099 && m >= 1 && m <= 12) {
    aa.value = ('' + (a % 100)).padStart(2, '0')
    mm.value = ('' + m).padStart(2, '0')
  }
}

const min = props.dmin || 200001
const max = props.dmax || 209912

const dloc = defineModel({type: Number})

function ok () { 
  emit('ok', dloc.value)
}

function check () { 
  err.value = dloc.value < min || dloc.value > max 
}

function dx () { 
  dloc.value = ((parseInt(aa.value) + 2000) * 100) + parseInt(mm.value)
}

watch(aa, (ap, av) => {
  dx()
  check()
})

watch(mm, (ap, av) => {
  dx()
  check()
})

dx()
check()
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
