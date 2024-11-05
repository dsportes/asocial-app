<template>
<span class="row items-center">
  <btn-cond icon="chevron_left" round :disable="im===0" @ok="im--"/>
  <span class="larg font-mono fs-md text-center">{{lib}}</span>
  <btn-cond icon="chevron_right" round :disable="im===3" @ok="im++"/>
</span>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

import { AMJ } from '../app/api.mjs'
import { $t, dhstring } from '../app/util.mjs'
import BtnCond from './BtnCond.vue'

const im = defineModel({ 
  type: Number
})

const props = defineProps({ 
  dh: Number
})

const mx = computed(() => AMJ.am(props.dh)[1])

const lib = computed(() => { 
  const x = mx.value - im.value
  return $t('mois' + (x <= 0 ? 12 + x : x))
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.larg
  width: 5rem
</style>
