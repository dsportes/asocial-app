<template>
  <div class="titre-md">
    <div v-if="noutil">
      <div>{{$t('QVabo1s', [edqt(vols.q1), nbn(q1n)])}}</div>
      <div>{{$t('QVabo2s', [edqt(vols.q2), edvol(q2v)])}}</div>
    </div>
    <div v-else>
      <div>{{$t('QVabo1', [edqt(vols.q1), nbn(q1n), pc1])}}</div>
      <div>{{$t('QVabo2', [edqt(vols.q2), edvol(q2v), pc2])}}</div>
    </div>
    <div v-if="vols.qc">
      {{$t('QVplc', [edqt(vols.qc), mon(vols.qc)])}}
    </div>
  </div>
</template>

<script>
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { edvol, edqt, nbn, mon } from '../app/util.mjs'

export default {
  name: 'QuotasVols2',

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
