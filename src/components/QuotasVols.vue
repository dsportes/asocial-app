<template>
  <div>
    <div class="row items-center">
      <span class="text-italic titre-md">{{$t('QVab1')}}</span>
      <span class="q-ml-md fs-md font-mono text-bold">{{'[' + vols.q1 + '] ' + nbn(q1n)}}</span>
      <span v-if="!noutil" class="fs-md font-mono text-italic q-ml-md">{{$t('QVut', [pc1])}}</span>
    </div>
    <div class="row items-center">
      <span class="text-italic titre-md">{{$t('QVab2')}}</span>
      <span class="q-ml-md fs-md font-mono text-bold">{{'[' + vols.q2 + '] ' + edvol(q2v)}}</span>
      <span v-if="!noutil" class="fs-md text-italic font-mono q-ml-md">{{$t('QVut', [pc2])}}</span>
    </div>
    <div v-if="vols.qc" class="row items-center">
      <span class="text-italic titre-md">{{$t('QVplc')}}</span>
      <span class="q-ml-md fs-md font-mono text-bold">{{'[' + vols.qc + '] ' + mon(vols.qc)}}</span>
    </div>
  </div>
</template>

<script>
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { edvol, edqt, nbn, mon } from '../app/util.mjs'

export default {
  name: 'QuotasVols',

  props: { 
    noutil: Boolean, // sans % utilisation
    vols: Object,
    /* {v1 v2 q1 q2 qc} si estA: qc == 0 */
  },

  computed: {
    q1n () { return this.vols.q1 * UNITEV1 },
    q2v () { return this.vols.q2 * UNITEV2 },
    pc1 () { return Math.round(this.vols.v1 * 100 / (this.q1n)) },
    pc2 () { return Math.round(this.vols.v2 * 100 / (this.q2v)) },
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup (props) {
    return {
      edvol, edqt, nbn, mon
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btn1
  padding: 1px !important
  width: 1.5rem !important
.larg
  width: 11rem
.bdg
  max-height: 1rem
.infoc
  background-color: $blue-grey-3
  border-radius: 5px
  padding: 2px
  color: black
.infof
  background-color: $blue-grey-9
  border-radius: 5px
  padding: 2px
  color: white
</style>
