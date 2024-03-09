<template>
  <q-card-section :class="'q-mx-sm q-pt-none fs-md bord' + (mv.err ? 'ko' : 'ok')">
    <div v-if="!groupe" class="titre-md text-italic">{{$t('CQabo')}}</div>
    <div class="q-ml-md row  items-center">
      <div class="col-5 titre-md mh">{{$t(groupe ? 'nbnotes' : 'nbnnncng')}}</div>
      <q-select class="col-2" v-model="q1s" :options="options" :disable="lecture" dense options-dense/>
      <q-input class="col-2 q-px-sm" v-model.number="mv.q1" type="number" :disable="lecture" dense/>
      <span :class="'col-2 text-center fs-sm' + ((mv.q1 > mv.max1 || mv.q1 < mv.min1) ? ' text-warning' : '')">
        {{mv.min1 + '...' + mv.max1}}</span>
      <q-btn class="col-1" dense icon="undo" size="sm" color="warning" @click="undo1"/>
    </div>
    <div class="q-ml-md font-mono">{{ed1(mv.q1)}} {{$t(groupe ? 'notes' : 'unnncng')}}</div>
    <div class="q-ml-md q-mt-md row items-center">
      <div class="col-5 titre-md">{{$t('volv2')}}</div>
      <q-select class="col-2" v-model="q2s" :options="options" :disable="lecture" dense options-dense/>
      <q-input class="col-2 q-px-sm" v-model.number="mv.q2" type="number" :disable="lecture" dense/>
      <span :class="'col-2 text-center fs-sm' + ((mv.q2 > mv.max2 || mv.q2 < mv.min2) ? ' text-warning' : '')">
        {{mv.min2 + '...' + mv.max2}}</span>
      <q-btn class="col-1" dense icon="undo" size="sm" color="warning" @click="undo2"/>
    </div>
    <div class="q-ml-md font-mono">{{ed2(mv.q2, 0, 'B')}}</div>

    <div v-if="!groupe">
      <q-separator color="orange" class="q-my-md"/>

      <div class="titre-md text-italic">{{$t('CQconso')}}</div>
      <div class="titre-sm text-italic">{{$t('CQclec')}}</div>
      <div class="q-ml-md row  items-center">
        <div class="col-5 titre-md mh">{{$t('CQcu')}}</div>
        <q-select class="col-2" v-model="qcs" :options="options" :disable="lecture" dense options-dense/>
        <q-input class="col-2 q-px-sm" v-model.number="mv.qc" type="number" :disable="lecture" dense/>
        <span :class="'col-2 text-center fs-sm' + ((mv.qc > mv.maxc || mv.qc < mv.minc) ? ' text-warning' : '')">
          {{mv.minc + '...' + mv.maxc}}</span>
        <q-btn class="col-1" dense icon="undo" size="sm" color="warning" @click="undoc"/>
      </div>
      <div class="q-ml-md font-mono">{{edc(mv.qc)}}</div>
    </div>

  </q-card-section>
</template>
<script>
import { edvol, edqt, mon } from '../app/util.mjs'
import { ref, toRef, watch } from 'vue'
import stores from '../stores/stores.mjs'
import { UNITEV, UNITEN } from '../app/api.mjs'

export default {
  name: 'ChoixQuotas',
  props: { 
    quotas: Object, // { q1, q2, qc, min1, min2, max1, max2, minc, maxc, err}
    lecture: Boolean,
    groupe: Boolean
  },

  data () {
    return {
    }
  },

  methods: {
    ed1 (v) { return edqt(v * UNITEN) },
    ed2 (v) { return edvol(v * UNITEV) },
    edc (v) { return mon(v) }
  },

  setup (props, context) {
    const lecture = toRef(props, 'lecture')
    const mv = toRef(props, 'quotas')

    function mx () { mv.value.err = 
      (mv.value.q1 < mv.value.min1) || (mv.value.q1 > mv.value.max1) ||
      (mv.value.q2 < mv.value.min2) || (mv.value.q2 > mv.value.max2) ||
      (mv.value.qc < mv.value.minc) || (mv.value.qc > mv.value.maxc)
    }

    const q1i = mv.value.q1 // valeurs initiales
    const q2i = mv.value.q2
    const qci = mv.value.qc
    mx()

    function undo1 () {
      mv.value.q1 = q1i
      mx()
    }

    function undo2 () {
      mv.value.q2 = q2i
      mx()
    }

    function undoc () {
      mv.value.qc = qci
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
    const qcs = ref(code(mv.value.qc))

    watch(mv.value, (ap, av) => {
      mx()
      const y1 = code(ap.q1)
      if (q1s.value !== y1) q1s.value = y1
      const y2 = code(ap.q2)
      if (q2s.value !== y2) q2s.value = y2
      const yc = code(ap.qc)
      if (qcs.value !== yc) qcs.value = yc
      changer()
    })

    watch(q1s, (ap, av) => {
      const x = lq[ap]
      if (x !== undefined && mv.value.q1 !== x) mv.value.q1 = x
    })

    watch(q2s, (ap, av) => {
      const x = lq[ap]
      if (x !== undefined && mv.value.q2 !== x) mv.value.q2 = x
    })

    watch(qcs, (ap, av) => {
      const x = lq[ap]
      if (x && mv.value.qc !== x) mv.value.qc = x
    })

    function changer () {
      if (!lecture.value) context.emit('change')
    }

    return {
      undo1, undo2, undoc,
      options,
      mv,
      q1s, q2s, qcs
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
.mh
  max-height: 1.2rem
  overflow-y: hidden
</style>
