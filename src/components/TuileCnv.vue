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

<script setup>
import { ref, computed } from 'vue'

import { UNITEN, UNITEV } from '../app/api.mjs'
import { edvol, mon } from '../app/util.mjs'

const props = defineProps({ 
  src: Object, // {qc qn qv ac an av c n v}
  occupation: Boolean, // si true c n v sont interprétés comme "occupation / utilisation"
  type: String, //'qc': limite coûts, 'qn' 'qv'
})

const uti = computed(() => props.type === 'qc' ? props.src.pcc : (props.type === 'qn' ? props.src.pcn : props.src.pcv) )
const aff = computed(() => props.type === 'qc' ? props.src.pcac : (props.type === 'qn' ? props.src.pcan : props.src.pcav))

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.w2b
  width: 16rem
</style>
