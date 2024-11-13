<template>
<span class="row items-center">
  <btn-cond icon="chevron_left" round :disable="courant" @ok="plus"/>
  <span class="larg font-mono fs-md text-center">{{$t('mois' + im)}}</span>
  <btn-cond icon="chevron_right" round :disable="dernier" @ok="moins"/>
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
  imd: Number
})

const courant = computed(() => im.value === imd.value)
const dernier = computed(() => { let i = imd.value + 1; if (i === 13) i = 1; return im.value === i})

function plus () {
  let i = im.value + 1
  im.value = i === 13 ? 1 : i
}

function moins () {
  let i = im.value - 1
  im.value = i === 0 ? 12 : i
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.larg
  width: 5rem
</style>
