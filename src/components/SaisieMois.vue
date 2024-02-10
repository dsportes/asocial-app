<template>
<span class="row justify-start">
  <span class="column items-end q-mr-sm">
    <span class="titre-md">{{label}}</span>
    <span :class="(err ? 'text-right text-bold text-negative bg-yellow-5' : '') + ' font-mono fs-xs q-py-none q-px-xs q-mx-sm'">
      {{min}}...{{max}}
    </span>
  </span>
  <span class="row" style="overflow:hidden;height:2rem">
    <q-input class="font-mono text-bold fs-md q-mr-xs" v-model="aa" dense
      style="width:3rem;position:relative;top:-9px;" prefix="20"/>
    <q-select class="font-mono text-bold fs-md" v-model="mm" dense :options="mois"
      style="width:2.5rem;position:relative;top:-9px;"/>
  </span>
  <q-btn class="self-start q-ml-sm" dense color="warning" padding="none" size="md" 
    :icon="icon" round @click="ok" :disable="err"/>
</span>
</template>

<script>
import { ref, toRef, watch } from 'vue'
import stores from '../stores/stores.mjs'
import { AMJ } from '../app/api.mjs'

export default ({
  name: 'SaisieMois',

  props: { dmin: Number, dmax: Number, dinit: Number, icon: String, label: String },

  components: { },

  emits: ['ok', 'update:modelValue'],

  computed: {
  },

  data () { return {
  }},

  methods: {
  },
  
  setup (props, context) {
    const session = stores.session
    const [a1, m1, j1] = AMJ.aaaammjj(session.auj)
    const aa = ref(a1 % 100)
    const mm = ref(m1)
    const mois = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
    const err = ref(false)

    const dinit = toRef(props, 'dinit')
    if (dinit.value) {
      const a = Math.round(dinit.value / 100)
      const m = dinit.value % 100
      if (a >= 2000 && a <= 2099 && m >= 1 && m <= 12) {
        aa.value = ('' + (a % 100)).padStart(2, '0')
        mm.value = ('' + m).padStart(2, '0')
      }
    }
    const dmin = toRef(props, 'dmin')
    const dmax = toRef(props, 'dmax')
    const min = dmin.value || 200001
    const max = dmax.value || 209912

    const dloc = ref()

    function ok () { 
      context.emit('ok', dloc.value)
    }

    function check () { 
      err.value = dloc.value < min || dloc.value > max 
    }

    function dx () { 
      dloc.value = ((parseInt(aa.value) + 2000) * 100) + parseInt(mm.value)
    }

    watch(aa, (ap, av) => {
      dx(); check(); if (!err.value) context.emit('update:modelValue', dloc.value)
    })

    watch(mm, (ap, av) => {
      dx(); check(); if (!err.value) context.emit('update:modelValue', dloc.value)
    })

    dx()
    check()

    return {
      aa, mm, err, mois, min, max, ok
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
