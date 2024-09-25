<template>
  <div class="q-pa-xs">
    <div class="row items-center" style="position:relative">
      <bouton-bulle idtext="quotas" class="bb"/>
      <div class="col-6 row items-center">
        <div class="titre-md mh">{{$t('CQnbdocs', mv.qn * UNITEN)}}</div>
        <div v-if="quotas.n && mv.qn > 0" :class="'font-mono q-ml-sm ' + st(pcn)">[{{pcn}}%]</div>
      </div>

      <q-input class="col-2 w2 text-center" outlined dense v-model.number="mv.qn" type="number" :disable="lecture"/>

      <div class="col-4 row items-center justify-start">
        <div :class="'q-px-xs ' + stmx(mv.qn, mv.minn, mv.maxn)">{{mv.minn + '...' + mv.maxn}}</div>
        <btn-cond v-if="!lecture" :disable="mv.qn === qni" 
          class="q-ml-sm" icon="undo" size="sm" color="warning" @click="undo1"/>
      </div>
    </div>

    <div class="row items-center">
      <div class="col-6 row items-center">
        <div class="titre-md mh">{{ed2(mv.qv) + ' ' + $t('CQvolfics')}}</div>
        <div v-if="quotas.n && mv.qv > 0" :class="'font-mono q-ml-sm ' + st(pcv)">[{{pcv}}%]</div>
      </div>

      <q-input class="col-2 w2 text-center" outlined dense v-model.number="mv.qv" type="number" :disable="lecture"/>

      <div class="col-4 row items-center justify-start">
        <div :class="'q-px-xs ' + stmx(mv.qv, mv.minv, mv.maxv)">{{mv.minv + '...' + mv.maxv}}</div>
        <btn-cond v-if="!lecture" :disable="mv.qv === qvi" 
          class="q-ml-sm" icon="undo" size="sm" color="warning" @click="undo2"/>
      </div>
    </div>

    <div v-if="!groupe" class="row items-center">
      <div class="col-6 row items-center">
        <div class="titre-md mh">{{edc(mv.qc) + ' ' + $t('CQconsocalc')}}</div>
      </div>

      <q-input class="col-2 w2 text-center" outlined dense v-model.number="mv.qc" type="number" :disable="lecture"/>

      <div class="col-4 row items-center justify-start">
        <div :class="'q-px-xs ' + stmx(mv.qc, mv.minc, mv.maxc)">{{mv.minc + '...' + mv.maxc}}</div>
        <btn-cond v-if="!lecture" :disable="mv.qc === qci" 
          class="q-ml-sm" icon="undo" size="sm" color="warning" @click="undoc"/>
      </div>
    </div>
  </div>
</template>
<script>
import { edvol, mon } from '../app/util.mjs'
import { toRef, watch } from 'vue'
import { UNITEV, UNITEN } from '../app/api.mjs'
import BtnCond from './BtnCond.vue'
import BoutonBulle from './BoutonBulle.vue'

export default {
  name: 'ChoixQuotas',
  props: { 
    quotas: Object, // { qn, qv, qc, minn, minv, maxn, maxv, minc, maxc, err}
    lecture: Boolean,
    groupe: Boolean
  },

  components: { BtnCond, BoutonBulle },

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
    stmx (v, min, max) { return v < min || v > max ? 'bg-yellow-3 fs-md text-bold text-negative' :'' },
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
      mv.value.chg = mv.value.qn !== qni || mv.value.qv !== qvi || mv.value.qc !== qci
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

    watch(mv.value, (ap, av) => {
      mx()
      changer()
    })

    function changer () {
      if (!lecture.value) context.emit('change')
    }

    return {
      UNITEN, UNITEV,
      undo1, undo2, undoc,
      mv, qni, qvi, qci
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/input2.sass'
.bordok
  border: 1px solid $green-5
.bordko
  border: 1px solid $warning
.mh
  max-height: 1.2rem
  overflow-y: hidden
.wi
  width: 3rem
.bb
  position: absolute
  top: 0
  right: 0
</style>
