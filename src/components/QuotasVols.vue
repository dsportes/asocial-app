<template>
  <div class="row q-gutter-md">
    <div class="titre-md mh">{{$t('CQnbdocs', qnn)}}</div>
    <div class="titre-md mh">{{edvol(qvv) + ' ' + $t('CQvolfics')}}</div>
    <div class="titre-md mh">{{mon(vols.qc) + ' ' + $t('CQconsocalc')}}</div>
  </div>
</template>

<script>
// import { toRef } from 'vue'
import { UNITEN, UNITEV } from '../app/api.mjs'
import { edvol, nbn, mon } from '../app/util.mjs'

export default {
  name: 'QuotasVols',

  props: { 
    noutil: Boolean, // sans % utilisation
    vols: Object, // {qn qv qc v n}
    groupe: Boolean
  },

  computed: {
    qnn () { return this.vols.qn * UNITEN },
    qvv () { return this.vols.qv * UNITEV },
    nn () { return (this.vols.nn || 0) + (this.vols.nc || 0) + (this.vols.ng || 0) },
    pcn () { return this.qnn ? Math.round(this.nn * 100 / (this.qnn)) : 0 },
    pcv () { return this.qvv ? Math.round(this.vols.v * 100 / (this.qvv)) : 0 },
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup (props) {
    // const vols = toRef(props, 'vols')
    return {
      edvol, nbn, mon
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
