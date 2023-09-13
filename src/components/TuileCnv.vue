<template>
  <div :class="(occupation ? 'w3' : 'w2') + ' column'">
    <div class="bg-primary text-white text-bold titre-md text-center">{{$t('TUt' + type)}}</div>
    <div class="bord row items-center">
      <div v-if="type==='qc'" :class="(occupation ? 'col-6' : 'col-7') + ' column items-center justify-center'">
        <div class='font-mono fs-sm'>[{{src.qc}}]</div>
        <div class='font-mono fs-md'>{{mon(src.qc * UNITEV0)}}</div>
      </div>
      <div v-if="type==='q1'" :class="(occupation ? 'col-6' : 'col-7') + ' column items-center justify-center'">
        <div class='font-mono text-center fs-sm'>[{{src.q1}}]</div>
        <div class='font-mono text-center fs-md'>{{nbn(src.q1 * UNITEV1)}}</div>
      </div>
      <div v-if="type==='q2'" :class="(occupation ? 'col-6' : 'col-7') + ' column items-center justify-center'">
        <div class='font-mono text-center fs-sm'>[{{src.q2}}]</div>
        <div class='font-mono text-center fs-md'>{{edvol(src.q2 * UNITEV2)}}</div>
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
import { toRef } from 'vue'
import { UNITEV0, UNITEV1, UNITEV2 } from '../app/api.mjs'
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
    caff () { return this.type === 'qc' ? this.src.pcac : (this.type === 'q1' ? this.src.pca1 : this.src.pca2 )},
    cuti () { return this.type === 'qc' ? this.src.pcca : (this.type === 'q1' ? this.src.pcv1 : this.src.pcv2 )},
  },

  data () { return {
    aff: this.caff(),
    uti: this.cuti()
  }},

  setup (props) {
    const src = toRef(props, 'src')
    return {
      edvol, mon, nbn, UNITEV0, UNITEV1, UNITEV2
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-left: 1px solid $grey-5
  border-right: 1px solid $grey-5
  border-bottom: 1px solid $grey-5
  height: 4rem
.w2
  width: 8rem
.w3
  width: 12rem
</style>
