<template>
  <q-card-section class="q-pt-none fs-md">
    <div v-if="!groupe" class="titre-md text-italic">{{$t('CQabo')}}</div>
    <div :class="'q-pa-xs bord'  + (mv.err ? 'ko' : 'ok')">
      <div class="row items-center">
        <div class="col-5 titre-md mh">{{$t(groupe ? 'nbnotes' : 'nbnnncng')}}</div>
        <q-select class="col-2" v-model="qns" :options="options" :disable="lecture" dense options-dense/>
        <q-input class="col-2 q-px-sm" v-model.number="mv.qn" type="number" :disable="lecture" dense/>
        <span :class="'col-2 text-center fs-sm' + ((mv.qn > mv.maxn || mv.qn < mv.minn) ? ' text-warning' : '')">
          {{mv.minn + '...' + mv.maxn}}</span>
        <q-btn class="col-1" dense icon="undo" size="sm" color="warning" @click="undo1"/>
      </div>
      <div class="q-ml-md font-mono">{{ed1(mv.qn)}} {{$t(groupe ? 'nbnotes' : 'nbnnncng')}}</div>
      <div v-if="quotas.n" :class="'q-mt-xs fnt-mono q-pa-xs ' + st(pcn)">{{$t('CQtxut', [pcn])}}</div>
      
      <q-separator color="orange" class="q-my-sm q-mx-md"/>

      <div class="q-mt-md row items-center">
        <div class="col-5 titre-md">{{$t('volv2')}}</div>
        <q-select class="col-2" v-model="qvs" :options="options" :disable="lecture" dense options-dense/>
        <q-input class="col-2 q-px-sm" v-model.number="mv.qv" type="number" :disable="lecture" dense/>
        <span :class="'col-2 text-center fs-sm' + ((mv.qv > mv.maxv || mv.qv < mv.minv) ? ' text-warning' : '')">
          {{mv.minv + '...' + mv.maxv}}</span>
        <btn-cond class="col-1" icon="undo" size="sm" color="warning" @ok="undo2"/>
      </div>
      <div class="q-ml-md font-mono">{{ed2(mv.qv, 0, 'B')}}</div>
      <div v-if="quotas.v" :class="'q-mt-xs fnt-mono q-pa-xs ' + st(pcv)">{{$t('CQtxut', [pcv])}}</div>
    </div>

    <div v-if="!groupe && quotas.qc !== 0">
      <div class="q-mt-md titre-md text-italic">{{$t('CQconso')}}</div>
      <div class="titre-sm text-italic">{{$t('CQclec')}}</div>
      <div :class="'q-pa-xs bord' + (mv.err ? 'ko' : 'ok')">
        <div class="row items-center">
          <div class="col-5 titre-md mh">{{$t('CQcu')}}</div>
          <q-select class="col-2" v-model="qcs" :options="options" :disable="lecture" dense options-dense/>
          <q-input class="col-2 q-px-sm" v-model.number="mv.qc" type="number" :disable="lecture" dense/>
          <span :class="'col-2 text-center fs-sm' + ((mv.qc > mv.maxc || mv.qc < mv.minc) ? ' text-warning' : '')">
            {{mv.minc + '...' + mv.maxc}}</span>
          <btn-cond class="col-1" icon="undo" size="sm" color="warning" @ok="undoc"/>
        </div>
        <div class="q-ml-md font-mono">{{edc(mv.qc)}}</div>
      </div>
    </div>

  </q-card-section>
</template>
<script>
import { edvol, edqt, mon } from '../app/util.mjs'
import { ref, toRef, watch } from 'vue'
import stores from '../stores/stores.mjs'
import { UNITEV, UNITEN } from '../app/api.mjs'
import BtnCond from './BtnCond.vue'

export default {
  name: 'ChoixQuotas',
  props: { 
    quotas: Object, // { qn, qv, qc, minn, minv, maxn, maxv, minc, maxc, err}
    lecture: Boolean,
    groupe: Boolean
  },

  components: { BtnCond },

  computed: {
    pcn () { return this.quotas.qn ? Math.floor(this.quotas.n * 100 / (this.quotas.qn * UNITEN)) : 999 },
    pcv () { return this.quotas.qv ? Math.floor(this.quotas.v * 100 / (this.quotas.qv * UNITEV)) : 999 }
  },

  data () {
    return {
    }
  },

  methods: {
    st (pc) { return pc < 80 ? 'fs-md' : 
      (pc < 100 ? 'bg-yellow-3 fs-lg text-bold text-negative' : 
      'bg-yellow-3 fs-xl text-bold text-negative')
    },
    ed1 (v) { return edqt(v * UNITEN) },
    ed2 (v) { return edvol(v * UNITEV) },
    edc (v) { return mon(v) }
  },

  setup (props, context) {
    const lecture = toRef(props, 'lecture')
    const mv = toRef(props, 'quotas')

    function mx () { mv.value.err = 
      (mv.value.qn < mv.value.minn) || (mv.value.qn > mv.value.maxn) ||
      (mv.value.qv < mv.value.minv) || (mv.value.qv > mv.value.maxv) ||
      (mv.value.qc < mv.value.minc) || (mv.value.qc > mv.value.maxc)
    }

    const qni = mv.value.qn // valeurs initiales
    const qvi = mv.value.qv
    const qci = mv.value.qc
    mx()

    function undo1 () {
      mv.value.qn = qni
      mx()
    }

    function undo2 () {
      mv.value.qv = qvi
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

    const qns = ref(code(mv.value.qn))
    const qvs = ref(code(mv.value.qv))
    const qcs = ref(code(mv.value.qc))

    watch(mv.value, (ap, av) => {
      mx()
      const y1 = code(ap.qn)
      if (qns.value !== y1) qns.value = y1
      const y2 = code(ap.qv)
      if (qvs.value !== y2) qvs.value = y2
      const yc = code(ap.qc)
      if (qcs.value !== yc) qcs.value = yc
      changer()
    })

    watch(qns, (ap, av) => {
      const x = lq[ap]
      if (x !== undefined && mv.value.qn !== x) mv.value.qn = x
    })

    watch(qvs, (ap, av) => {
      const x = lq[ap]
      if (x !== undefined && mv.value.qv !== x) mv.value.qv = x
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
      qns, qvs, qcs
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
