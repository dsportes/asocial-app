<template>
  <div :class="(occupation ? 'w3b' : 'w2b') + ' row items-start'">

    <div class="titre-md text-italic col-6">{{$t('TUt' + type)}}</div>

    <div class="col-6 row items-center bordgris">
      <div v-if="type==='qc'" :class="(occupation ? 'col-6' : 'col-7') + ' column items-center justify-center'">
        <div class='font-mono fs-sm'>[{{src.q.qc}}]</div>
        <div class='font-mono fs-md'>{{mon(src.q.qc)}}</div>
      </div>
      <div v-if="type==='qn'" :class="(occupation ? 'col-6' : 'col-7') + ' column items-center justify-center'">
        <div class='font-mono text-center fs-sm'>[{{src.q.qn}}]</div>
        <div class='font-mono text-center fs-md'>{{nbn(src.q.qn * UNITEN)}}</div>
      </div>
      <div v-if="type==='qv'" :class="(occupation ? 'col-6' : 'col-7') + ' column items-center justify-center'">
        <div class='font-mono text-center fs-sm'>[{{src.q.qv}}]</div>
        <div class='font-mono text-center fs-md'>{{edvol(src.q.qv * UNITEV)}}</div>
      </div>
      <div :class="(occupation ? 'col-3' : 'col-5') + ' column items-center'">
        <div class='fs-sm text-italic text-center'>{{$t('TUaff')}}</div>
        <q-knob show-value font-size="0.8rem" v-model="aff"
          size="30px" :thickness="0.22" color="primary" track-color="grey-5">
          {{aff}}%
        </q-knob>
      </div>
      <div v-if="occupation" class="col-3 column items-center">
        <div class='fs-sm text-italic'>{{$t('TUuti')}}</div>
        <q-knob show-value font-size="0.8rem" v-model="uti"
          size="30px" :thickness="0.22" color="secondary" track-color="grey-5">
          {{uti}}%
        </q-knob>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

import { UNITEN, UNITEV } from '../app/api.mjs'
import { edvol, mon, nbn } from '../app/util.mjs'

const props = defineProps({ 
  src: Object, // {qc qn qv ac an av c n v}
  occupation: Boolean, // si true c n v sont interprétés comme "occupation / utilisation"
  type: String, //'qc': limite coûts, 'qn' 'qv'
})

const uti = computed(() => props.type === 'qc' ? props.src.pcc : (props.type === 'qn' ? props.src.pcn : props.src.pcv))
const aff = computed(() => props.type === 'qc' ? props.src.pcac : (props.type === 'qn' ? props.src.pcan : props.src.pcav))

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.w2b
  width: 21rem
.w3b
  width: 24rem
</style>
