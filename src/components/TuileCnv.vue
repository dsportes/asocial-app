<template>
  <div class="w2b">
    <div v-if="type==='qc'" class="row fs-md items-center bordgris">
      <span class='col-auto'>{{mon(src.q.qc)}}</span>
      <span class="q-ml-xs col">{{$t('CQconsocalc')}}</span>
      <span class='col-2 text-center font-mono'>{{src.q.qc}}</span>
      <span class='col-2 text-center font-mono'>{{aff}}%</span>
      <span class='col-2 text-center font-mono'>{{uti}}%</span>
    </div>

    <div v-if="type==='qn'" class="row fs-md items-center bordgris">
      <span class="q-ml-xs col">{{$t('CQnbdocs', src.q.qn * UNITEN)}}</span>
      <span class='col-2 text-center font-mono'>{{src.q.qn}}</span>
      <span class='col-2 text-center font-mono'>{{aff}}%</span>
      <span class='col-2 text-center font-mono'>{{uti}}%</span>
    </div>

    <div v-if="type==='qv'" class="row fs-md items-center bordgris">
      <span class='col-auto'>{{edvol(src.q.qv * UNITEV)}}</span>
      <span class="q-ml-xs col">{{$t('CQvolfics')}}</span>
      <span class='col-2 text-center font-mono'>{{src.q.qv}}</span>
      <span class='col-2 text-center font-mono'>{{aff}}%</span>
      <span class='col-2 text-center font-mono'>{{uti}}%</span>
    </div>
  </div>
</template>

<script>
import { UNITEN, UNITEV } from '../app/api.mjs'
import { edvol, mon, nbn } from '../app/util.mjs'

export default {
  name: 'TuileCnv',

  props: { 
    src: Object, // {qc qn qv ac an av c n v}
    occupation: Boolean, // si true c n v sont interprétés comme "occupation / utilisation"
    type: String, //'qc': limite coûts, 'qn' 'qv'
  },

  computed: {
    uti () { return this.type === 'qc' ? this.src.pcc : (this.type === 'qn' ? this.src.pcn : this.src.pcv) },
    aff () { return this.type === 'qc' ? this.src.pcac : (this.type === 'qn' ? this.src.pcan : this.src.pcav) }
  },

  methods: {
  },

  data () { return {
  }},

  setup () {
    return {
      edvol, mon, nbn, UNITEN, UNITEV
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.w2b
  width: 16rem
</style>
