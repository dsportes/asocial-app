<template>
  <div>
    <q-input dense counter v-model="val"
      :label="label || ''"
      :rules="[r1,r2]" 
      :maxlength="max"
      :placeholder="placeholder || ''"
      :suffix="suffix || ''"
      @keydown.enter.prevent="ok" type="text">
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
import { ref, toRef, watch } from 'vue'
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
    initVal: String,
    suffix: String
  },

  data () {
    return {
      interdits: interdits
    }
  },
  methods: {
    r2 (val) { return val.length < this.min || val.length > this.max ? this.$t('NAe1') : true },
    r1 (val) { return regInt.test(val) ? this.$t('NAe2') : true }
  },

  setup (props, context) {
    const iVal = toRef(props, 'initVal')
    const initVal = ref((iVal.value || ''))
    const val = ref(initVal.value || '')
    const lgmin = toRef(props, 'lgmin')
    const lgmax = toRef(props, 'lgmax')
    const min = ref(lgmin.value || 0)
    const max = ref(lgmax.value || 32)
    /* const sfx = toRef(props, 'suffix')
    console.log('suffix=' + sfx.value) */

    function ok () {
      context.emit('update:modelValue', val.value)
    }

    watch(val, (ap, av) => { ok()})

    watch(initVal, (ap, av) => { 
      val.value = ap
    })

    return {
      val, min, max, ok
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/input.sass'
::v-deep(.q-field__bottom)
  font-size: 0.9rem
  color: $warning
  font-style: italic
  bottom: 5px !important
::v-deep(.q-field__native)
  font-size: 1rem
  font-family: "Roboto Mono"
  /* color: #1B5E20 !important */
::v-deep(.q-field--dark .q-field__native)
  /* color: #388E3C !important */

</style>
