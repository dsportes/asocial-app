<template>
<span class="row items-center">
  <btn-cond icon="chevron_left" round :disable="courant" @ok="plus"/>
  <span class="larg font-mono fs-md text-center">{{$t('mois' + im) + ' ' + aa}}</span>
  <btn-cond icon="chevron_right" round :disable="dernier" @ok="moins"/>
</span>
</template>

<script setup>
import { computed } from 'vue'

import BtnCond from './BtnCond.vue'

const im = defineModel({ 
  type: Number
})

const props = defineProps({ 
  imd: Number,
  aaaa: Number
})

const courant = computed(() => im.value === props.imd)
const dernier = computed(() => { let i = props.imd + 1; if (i === 13) i = 1; return im.value === i})
const aa = computed(() => im.value <= props.imd ? props.aaaa : props.aaaa - 1)

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
  width: 8rem
</style>
