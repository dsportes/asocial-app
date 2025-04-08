<template>
  <div class="fs-md">
    <div class="titre-lg q-mb-md">{{$t('NAph0')}}</div>
    <div class="q-my-sm">
      <div class="text-italic titre-sm">{{$t('NAw1')}}</div>
      <div>
        <span class="q-px-sm text-negative bg-yellow text-bold">{{interdits}}</span>
        <span class="q-ml-sm">{{$t('NAw2')}}</span>
      </div>
    </div>
    <q-input dense counter v-model="nom" :label="groupe ? $t('NAng') : $t('NAna')">
      <template v-slot:append>
        <span :class="nom.length === 0 ? 'disabled' : ''">
          <q-icon name="cancel" class="cursor-pointer"  @click="nom=''"/>
        </span>
      </template>
    </q-input>
    <div class="text-negative fs-sm text-bold h1">{{model.err}}</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import { $t, interdits, regInt } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'

const min = 6
const max = 24

const props = defineProps({
  groupe: Boolean
})

const model = defineModel({ type: Object })

const err = (val) => val.length < min || val.length > max ? $t('NAe1', [min, max])
  : (regInt.test(val) ? $t('NAe2') : '')

const nom = ref('')
model.value.err = err(nom.value)

watch (nom, (val, av) => {
  model.value.err = err(val)
  model.value.nom = val
})

</script>

<style lang="sass" scoped>
@import '../css/input.sass'
.h1
  height: 1.2rem
  position: relative
  top: -1.2rem
</style>
