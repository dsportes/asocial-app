<template>
<span class="row items-center">
  <q-btn size="sm" icon="chevron_left" color="primary" :disable="idm===0" @click="plus"/>
  <span class="larg font-mono fs-md text-center">{{lib}}</span>
  <q-btn size="sm" icon="chevron_right" color="primary" :disable="idm===3" @click="moins"/>
</span>
</template>

<script>

import { ref, toRef, watch } from 'vue'
import { AMJ } from '../app/api.mjs'
import { $t } from '../app/util.mjs'

export default ({
  name: 'MoisM',

  emits: ['update:modelValue'],

  props: { 
    modelValue: Number,
    dh: Number
  },

  computed: {
  },

  setup (props, context) {
    const im = toRef(props, 'modelValue')
    const idm = ref(im.value)
    const dh = toRef(props, 'dh')
    const [ax, mx] = AMJ.am(dh.value)
    const lib = ref('')
    const m = ref(0)

    function mc () {
      const x = mx - idm.value
      m.value = x <= 0 ? 12 + x : x
      lib.value = $t('mois' + m.value)
    }

    mc ()

    watch(() => im.value, (ap, av) => {
        idm.value = ap
        mc()
      }
    )

    function plus () {
      if (idm.value === 0) return
      idm.value = idm.value - 1
      mc()
      context.emit('update:modelValue', idm.value)
    }

    function moins () {
      if (idm.value === 3) return
      idm.value = idm.value + 1
      mc()
      context.emit('update:modelValue', idm.value)
    }

    return {
      lib, plus, moins, idm
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.larg
  width: 5rem
</style>
