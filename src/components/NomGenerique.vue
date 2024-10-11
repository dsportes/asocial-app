<template>
<!-- @update:modelValue="(newValue) => $emit('update:modelValue', newValue)" -->
  <div>
    <q-input dense counter v-model="model" type="text"
      :label="label || ''" :maxlength="max" :placeholder="placeholder || ''">
      <template v-slot:append>
        <span :class="model.length === 0 ? 'disabled' : ''">
          <q-icon name="cancel" class="cursor-pointer"  @click="model=''"/>
        </span>
      </template>
      <template v-slot:hint>
        <span>{{$t('PPminmax', [max])}}</span>
        <span class="q-px-sm text-negative bg-yellow text-bold">{{interdits}}</span>
        <span class="q-ml-sm">{{$t('PPci')}}</span>
      </template>
    </q-input>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import { $t, normNom, interdits } from '../app/util.mjs'

const props = defineProps({ 
  label: String,
  lgmax: Number,
  placeholder: String
})

const max = ref(props.lgmax || 16)

const model = defineModel({ 
  type: String
})
model.value = model.value ? normNom(model.value, max.value) : ''

watch(model, (ap) => {
  const n = normNom(ap, max.value)
  if (n !== ap) model.value = n
})

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
