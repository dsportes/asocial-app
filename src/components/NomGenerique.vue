<template>
<!-- @update:modelValue="(newValue) => $emit('update:modelValue', newValue)" -->
  <div>
    <q-input dense counter v-model="val"
      :label="label || ''"
      :rules="[r1,r2]" 
      :maxlength="max"
      :placeholder="placeholder || ''"
      @keydown.enter.prevent="ok"
      type="text">
      <template v-slot:append>
        <span :class="val.length === 0 ? 'disabled' : ''">
          <q-icon name="cancel" class="cursor-pointer"  @click="val=''"/>
        </span>
        <btn-cond class="q-ml-xs" icon="check" rounded :disable="nomko" @click="ok"/>
      </template>
      <template v-slot:hint>
        <span>{{$t('PPminmax', [min, max])}}</span>
        <span class="q-px-sm text-negative bg-yellow text-bold">{{interdits}}</span>
        <span class="q-ml-sm">{{$t('PPci')}}</span>
      </template>
    </q-input>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

import { interdits, regInt } from '../app/api.mjs'
import { $t } from '../app/util.mjs'
import BtnCond from './BtnCond.vue'

const props = defineProps({ 
  label: String,
  lgmax: Number,
  lgmin: Number,
  modelValue: String,
  placeholder: String
})

const min = ref(props.lgmin || 0)
const max = ref(props.lgmax || 32)

const model = defineModel({ type: String })
const val = ref(model.value)

const r2 = (val) => val.length < min.value || val.length > max.value ? $t('NAe1') : true
const r1 = (val) => regInt.test(val) ? $t('NAe2') : true
const oknom = computed(() => r2(val.value === true && r1(val.value === true)))

function ok () { if (oknom.value) model.value = val.value }

</script>

<style lang="sass" scoped>
@import '../css/input.sass'
::v-deep(.q-field__bottom)
  font-size: 0.9rem
  color: inherit !important
  font-style: italic
  bottom: 5px !important
::v-deep(.q-field__native)
  font-size: 1rem
  font-family: "Roboto Mono"

</style>
