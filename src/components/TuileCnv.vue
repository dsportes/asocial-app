<template>
  <div :class="(occupation ? 'w3b' : 'w2b') + ' row items-start'">

    <div class="titre-md text-italic col-6">{{$t('TUt' + type)}}</div>

    <div class="col-6 row items-center bordgris">
      <div v-if="type==='qc'" :class="(occupation ? 'col-6' : 'col-7') + ' column items-center justify-center'">
        <div class='font-mono fs-sm'>[{{src.qc}}]</div>
        <div class='font-mono fs-md'>{{mon(src.qc)}}</div>
      </div>
      <div v-if="type==='q1'" :class="(occupation ? 'col-6' : 'col-7') + ' column items-center justify-center'">
        <div class='font-mono text-center fs-sm'>[{{src.q1}}]</div>
        <div class='font-mono text-center fs-md'>{{nbn(src.q1 * UNITEN)}}</div>
      </div>
      <div v-if="type==='q2'" :class="(occupation ? 'col-6' : 'col-7') + ' column items-center justify-center'">
        <div class='font-mono text-center fs-sm'>[{{src.q2}}]</div>
        <div class='font-mono text-center fs-md'>{{edvol(src.q2 * UNITEV)}}</div>
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

<script>
import { toRef, ref, watch } from 'vue'
import { UNITEN, UNITEV } from '../app/api.mjs'
import { edvol, mon, nbn } from '../app/util.mjs'

export default {
  name: 'TuileCnv',

  props: { 
    src: Object, // {qc q1 q2 ac a1 a2 ca v1 v2}
    occupation: Boolean, // si true ca v1 v2 sont interprétés comme "occupation / utilisation"
    type: String, //'qc': limite coûts, 'q1' 'q2'
  },

  computed: {
  },

  methods: {
  },

  data () { return {
  }},

  setup (props) {
    const src = toRef(props, 'src')
    const type = toRef(props, 'type')

    function faff (v) {
      return type.value === 'qc' ? v.pcac : (type.value === 'q1' ? v.pca1 : v.pca2) 
    }
    function futi (v) {
      return type.value === 'qc' ? v.pcca : (type.value === 'q1' ? v.pcv1 : v.pcv2) 
    }

    const uti = ref(futi(src.value))
    const aff = ref(faff(src.value))

    watch(() => src.value, (ap, av) => {
        uti.value = futi(ap)
        aff.value = faff(ap)
      }
    )

    return {
      uti, aff,
      edvol, mon, nbn, UNITEN, UNITEV
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.w2b
  width: 21rem
.w3b
  width: 24rem
</style>
