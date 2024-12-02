<template>
<div>
  <div class="row items-center justify-between">
    <btn-cond icon="chevron_left" round :disable="igp <= 0" @ok="moins"/>
    <span class="text-bold fs-md text-center">{{lbl[igp]}}</span>
    <btn-cond icon="chevron_right" round :disable="igp >= 4" @ok="plus"/>
  </div>
  <div class="row items-center">
    <span v-for="j in 4" :key="j" class="col-3 trc fs-md text-center"
      @click="clc('' + igp + '' + (j - 1))">
      {{lbls(j - 1)}}
    </span>
  </div>
</div>
</template>

<script setup>
import { computed } from 'vue'

import BtnCond from './BtnCond.vue'
import { $t } from '../app/util.mjs'

const igp = defineModel({ // Index du groupe de propriété (0..4)
  type: Number
})

const props = defineProps({
  clc: Function // clic de tri
})

const lbl = []
for (let i = 0; i < 5; i++) lbl.push($t('GRC' + i))

const lbls = (j) => $t('GRC' + igp.value + j)

function plus () {
  if (igp.value !== 5) igp.value++
}

function moins () {
  if (igp.value !== 0) igp.value--
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.larg
  width: 8rem
.trc
  font-weight: bold
  font-style: italic
  text-decoration: underline
  cursor: pointer
  color: $primary
</style>
