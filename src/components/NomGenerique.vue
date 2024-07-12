<template>
  <div>
    <q-input dense counter v-model="val"
      :label="label || ''"
      :rules="[r1,r2]" 
      :maxlength="max"
      :placeholder="placeholder || ''"
      :suffix="suffix || ''"
      @update:modelValue="(newValue) => $emit('update:modelValue', newValue)"
      @keydown.enter.prevent="ok"
      type="text">
      <template v-slot:append>
        <span :class="val.length === 0 ? 'disabled' : ''">
          <q-icon name="cancel" class="cursor-pointer"  @click="val=''"/>
        </span>
      </template>
      <template v-slot:hint>
        <span>{{$t('PPminmax', [min, max])}}</span>
        <span class="q-px-sm text-negative bg-yellow text-bold">{{interdits}}</span>
        <span class="q-ml-sm">{{$t('PPci')}}</span>
      </template>
    </q-input>
  </div>
</template>
<script>
import { ref, toRef } from 'vue'
import { interdits, regInt } from '../app/api.mjs'

export default {
  name: 'NomGenerique',

  emits: ['update:modelValue' ],

  props: { 
    label: String,
    lgmax: Number,
    lgmin: Number,
    modelValue: String,
    placeholder: String,
    suffix: String,
    initVal: String
  },

  data () {
    return {
    }
  },

  methods: {
    r2 (val) { return val.length < this.min || val.length > this.max ? this.$t('NAe1') : true },
    r1 (val) { return regInt.test(val) ? this.$t('NAe2') : true }
  },

  setup (props, context) {
    const val = toRef(props, 'modelValue')
    const iVal = toRef(props, 'initVal')
    if (iVal.value) val.value = iVal.value
    const lgmin = toRef(props, 'lgmin')
    const lgmax = toRef(props, 'lgmax')
    const min = ref(lgmin.value || 0)
    const max = ref(lgmax.value || 32)

    function ok () { context.emit('update:modelValue', val.value) }

    return {
      val, min, max, ok, interdits
    }
  }
}
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
