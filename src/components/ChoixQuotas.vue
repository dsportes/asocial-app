<template>
  <q-card-section :class="'q-mx-sm q-pt-none fs-md bord' + (mv.err ? 'ko' : 'ok')">
    <div class="row  items-center">
      <div class="col-5 titre-md">{{$t('CQt1', [ed1(mv.q1)])}}</div>
      <q-select class="col-2" v-model="q1s" :options="options" :disable="lecture" dense options-dense/>
      <q-input class="col-2 q-px-sm" v-model.number="mv.q1" type="number" :disable="lecture" dense/>
      <span :class="'col-2 text-center fs-sm' + ((mv.q1 > mv.max1 || mv.q1 < mv.min1) ? ' text-warning' : '')">
        {{mv.min1 + '...' + mv.max1}}</span>
      <q-btn class="col-1" dense icon="undo" size="sm" color="warning" @click="undo1"/>
    </div>
    <div class="row items-center">
      <div class="col-5 titre-md">{{$t('CQt2', [ed2(mv.q2)])}}</div>
      <q-select class="col-2" v-model="q2s" :options="options" :disable="lecture" dense options-dense/>
      <q-input class="col-2 q-px-sm" v-model.number="mv.q2" type="number" :disable="lecture" dense/>
      <span :class="'col-2 text-center fs-sm' + ((mv.q2 > mv.max2 || mv.q2 < mv.min2) ? ' text-warning' : '')">
        {{mv.min2 + '...' + mv.max2}}</span>
      <q-btn class="col-1" dense icon="undo" size="sm" color="warning" @click="undo2"/>
    </div>
  </q-card-section>
</template>
<script>
import { edvol } from '../app/util.mjs'
import { ref, toRef, watch } from 'vue'
import stores from '../stores/stores.mjs'
import { UNITEV2, UNITEV1 } from '../app/api.mjs'

export default {
  name: 'ChoixQuotas',
  props: { 
    quotas: Object, // { q1, q2, min1, min2, max1, max2, err}
    lecture: Boolean
  },

  data () {
    return {
    }
  },

  methods: {
    ed1 (v) { return edvol(v * UNITEV1) },
    ed2 (v) { return edvol(v * UNITEV2) }
  },

  setup (props, context) {
    const lecture = toRef(props, 'lecture')
    const mv = toRef(props, 'quotas')

    function mx () { mv.value.err = 
      (mv.value.q1 > mv.value.max1) || (mv.value.q2 > mv.value.max2) ||
      (mv.value.q1 < mv.value.min2) || (mv.value.q2 < mv.value.min2) 
    }

    const q1i = mv.value.q1 // valeurs initiales
    const q2i = mv.value.q2
    mx()

    function undo1 () {
      mv.value.q1 = q1i
      mx()
    }

    function undo2 () {
      mv.value.q2 = q2i
      mx()
    }

    const lq = stores.config.quotas
    const vals = []
    const options = []
    for (const code in lq) vals.push(lq[code])
    vals.sort((a,b) => { return a < b ? -1 : (a === b ? 0 : 1) })
    vals.forEach(v => options.push(code(v)))

    function code (v) {
      for (const q in lq) if (lq[q] === v) return q
      return ''
    }

    const q1s = ref(code(mv.value.q1))
    const q2s = ref(code(mv.value.q2))

    watch(mv.value, (ap, av) => {
      mx()
      const y1 = code(ap.q1)
      if (q1s.value !== y1) q1s.value = y1
      const y2 = code(ap.q2)
      if (q2s.value !== y2) q2s.value = y2
      changer()
    })

    watch(q1s, (ap, av) => {
      const x = lq[ap]
      if (x && mv.value.q1 !== x) mv.value.q1 = x
    })

    watch(q2s, (ap, av) => {
      const x = lq[ap]
      if (x && mv.value.q2 !== x) mv.value.q2 = x
    })

    function changer () {
      if (!lecture.value) context.emit('change')
    }

    return {
      undo1,
      undo2,
      options,
      mv,
      q1s,
      q2s
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/input.sass'
.bordok
  border: 1px solid $green-5
.bordko
  border: 1px solid $warning
.q-btn
  padding: 0 !important
  max-height: 1.5rem
  max-width: 1.5rem
</style>
