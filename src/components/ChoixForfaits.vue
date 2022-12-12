<template>
  <q-card-section class="q-pt-none shadow-8 row justify-between fullwidth">
    <div class="col-6">
      <div class="titre-md">{{$t('CFOv1t', [ed1(f1n)])}}</div>
      <div class="row justify-around">
        <q-select class="col-5" v-model="f1c" :options="options1" :disable="lecture" dense options-dense/>
        <q-input class="col-5" v-model.number="f1n" type="number" :disable="lecture" dense :rules="[val => val >= 0 && val <= maxx || ('0 - ' + maxx)]"/>
      </div>
    </div>
    <div class="col-6">
      <div class="titre-md">{{$t('CFOv2f', [ed2(f2n)])}}</div>
      <div class="row justify-around">
        <q-select class="col-5" v-model="f2c" :options="options2" :disable="lecture" dense options-dense/>
        <q-input class="col-5" v-model.number="f2n" type="number" :disable="lecture" dense :rules="[val => val >= 0 && val <= maxx || ('0 - ' + maxx)]"/>
      </div>
    </div>
  </q-card-section>
  <q-card-section v-if="diag1 !== '' || diag2 !== ''">
    <div v-if="diag1 !== ''" class="text-warning text-bold">{{diag1}}</div>
    <div v-if="diag2 !== ''" class="text-warning text-bold">{{diag2}}</div>
  </q-card-section>
  <q-card-actions v-if="!lecture">
    <q-btn flat dense icon="undo" label="Annuler" @click="undo" :disable="!modif"/>
    <q-btn v-if="labelValider" flat dense color="warning" icon="check" :label="labelValider" @click="valider"
      :disable="!modif || diag1 !== '' || diag2 !== '' || err1 || err2"/>
  </q-card-actions>
</template>
<script>
import { edvol, $t } from '../app/util.mjs'
import { ref, toRef, watch } from 'vue'
import stores from '../stores/stores.mjs'
import { UNITEV2, UNITEV1 } from '../app/api.mjs'

export default {
  name: 'ChoixForfaits',
  emits: ['update:modelValue', 'valider'],
  props: { modelValue: Array, lecture: Boolean, labelValider: String, f1: Number, f2: Number, v1: Number, v2: Number, max: Number },

  data () {
    return {
    }
  },

  methods: {
    ed1 (v) { return this.err1 ? '' : edvol(v * UNITEV1) },
    ed2 (v) { return this.err2 ? '' : edvol(v * UNITEV2) }
  },

  setup (props, context) {
    const lf = stores.config.forfaits
    const lecture = toRef(props, 'lecture')
    const max = toRef(props, 'max')
    const maxx = ref(!max.value || max.value < 0 ? 255 : max.value)
    const options1 = []
    const options2 = []
    const f1 = toRef(props, 'f1') // valeurs sur l'élément
    const f2 = toRef(props, 'f2')
    const v1 = toRef(props, 'v1') // valeurs sur l'élément, volume min à couvrir
    const v2 = toRef(props, 'v2')

    const f1inp = ref(0) // valeurs avant édition
    const f2inp = ref(0)
    const f1c = ref(0) // valeurs courantes (code)
    const f2c = ref(0)
    const f1n = ref(0) // valeurs courantes (numérique)
    const f2n = ref(0)
    const modif = ref(false)
    const min1 = ref(0)
    const min2 = ref(0)
    const diag1 = ref('')
    const diag2 = ref('')
    const err1 = ref(false)
    const err2 = ref(false)

    function setOptions () {
      min1.value = v1.value ? Math.ceil(v1.value / UNITEV1) : 0
      min2.value = v2.value ? Math.ceil(v2.value / UNITEV2) : 0
      options1.length = 0; options1.push('')
      options2.length = 0; options2.push('')
      for (const f in lf) if (lf[f] >= min1.value) options1.push(f)
      for (const f in lf) if (lf[f] >= min2.value) options2.push(f)
    }

    function code (v) {
      for (const f in lf) if (lf[f] === v) return f
      return ''
    }

    function initState () {
      f1c.value = code(f1.value)
      f2c.value = code(f2.value)
      f1n.value = f1.value
      f2n.value = f2.value
      f1inp.value = f1.value
      f2inp.value = f2.value
      modif.value = achange()
    }

    watch(f1, (ap, av) => { // quand f1 d'entrée change, f1n ne change pas si en édition
      setOptions()
      // si f1n n'était PAS modifié, ni égal à la nouvelle valeur : alignement sur la nouvelle valeur
      if (f1n.value === f1inp.value && f1n.value !== ap) f1n.value = ap
      f1inp.value = ap
      modif.value = achange()
    })

    watch(f2, (ap, av) => { // quand f2 d'entrée change, f2n ne change pas si en édition
      setOptions()
      // si f1n n'était PAS modifié, ni égal à la nouvelle valeur : alignement sur la nouvelle valeur
      if (f2n.value === f2inp.value && f2n.value !== ap) f2n.value = ap
      f2inp.value = ap
      modif.value = achange()
    })

    watch(f1c, (ap, av) => {
      if (ap !== '' && lf[ap] !== f1n.value) f1n.value = lf[ap]
    })

    watch(f1n, (ap, av) => {
      modif.value = achange()
      const x = code(f1n.value)
      if (x !== f1c.value) f1c.value = x
      if (!lecture.value) context.emit('update:modelValue', [f1n.value, f2n.value])
      // console.log(f1n.value + ' / ' + f2n.value)
    })

    watch(f2c, (ap, av) => {
      if (ap !== '' && lf[ap] !== f2n.value) f2n.value = lf[ap]
    })

    watch(f2n, (ap, av) => {
      modif.value = achange()
      const x = code(ap)
      if (x !== f2c.value) f2c.value = x
      if (!lecture.value) context.emit('update:modelValue', [f1n.value, f2n.value])
      // console.log(f1n.value + ' / ' + f2n.value)
    })

    function valider () {
      // console.log(f1n.value + ' / ' + f2n.value)
      if (!lecture.value) context.emit('valider', [f1n.value, f2n.value])
    }

    function achange () {
      err1.value = f1n.value < 0 || f1n.value > maxx.value
      err2.value = f2n.value < 0 || f2n.value > maxx.value
      diag2.value = f1n.value < min1.value && !err1.value ? $t('CFOdiag1', [min1.value]) : ''
      diag2.value = f2n.value < min2.value && !err2.value ? $t('CFOdiag2', [min2.value])  : ''
      return f1n.value !== f1inp.value || f2n.value !== f2inp.value
    }

    function undo () {
      f1n.value = f1inp.value
      f2n.value = f2inp.value
    }

    setOptions()
    initState()

    return {
      maxx,
      undo,
      modif,
      valider,
      options1,
      options2,
      f1c,
      f2c,
      f1n,
      f2n,
      diag1,
      diag2,
      err1,
      err2
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/input.sass'
.w20
  width: 23rem
.w10
  width: 10rem
</style>
