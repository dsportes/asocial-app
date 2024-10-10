<template>
<span class="row items-center">
  <q-btn size="md" icon="chevron_left" color="primary" padding="none" round
    :disable="idm===0" @click="plus"/>
  <span class="larg font-mono fs-md text-center">{{lib}}</span>
  <q-btn size="md" icon="chevron_right" color="primary" padding="none" round
    :disable="idm===3" @click="moins"/>
</span>
</template>

<script setup>
import { ref, toRef, watch } from 'vue'

import { AMJ } from '../app/api.mjs'
import { $t } from '../app/util.mjs'

const im = defineModel({ 
  type: Number
})
const idm = ref(im.value)

const props = defineProps({ 
  dh: Number
})

const [ax, mx] = AMJ.am(props.dh)
const lib = ref('')
const m = ref(0)

function mc () {
  const x = mx - idm.value
  m.value = x <= 0 ? 12 + x : x
  lib.value = $t('mois' + m.value)
}

mc ()

watch(im, (ap, av) => {
  idm.value = ap
  mc()
})

function plus () {
  if (idm.value === 0) return
  idm.value = idm.value - 1
  mc()
  im.value = idm.value
}

function moins () {
  if (idm.value === 3) return
  idm.value = idm.value + 1
  mc()
  im.value = idm.value
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.larg
  width: 5rem
</style>
