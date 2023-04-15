<template>
  <div class="row q-gutter-md">
    <div class="column larg">
      <div class="row justify-between items-center">
        <div>
          <span class='titre-md q-mr-sm text-italic'>V1:</span>
          <span class="fs-md text-bold font-mono q-mr-sm">{{'[' + vols.q1 + '] ' + edv1}}</span>
        </div>
        <div v-if="pc1 > 0.95" class="bdg fs-sm font-mono text-bold text-negative bg-yellow-8">{{pce1}}</div>
        <div v-else class="bdg fs-sm font-mono">{{pce1}}</div>
      </div>
      <q-linear-progress :value="pc1 > 1 ? 1 : pc1" size="5px" color="negative"/>
    </div>
    <div class="column larg">
      <div class="row justify-between items-center">
        <div>
          <span class='titre-md q-mr-sm text-italic'>V2:</span>
          <span class="fs-md text-bold font-mono q-mr-sm">{{'[' + vols.q2 + '] ' + edv2}}</span>
        </div>
        <div v-if="pc2 > 0.95" class="bdg fs-sm font-mono text-bold text-negative bg-yellow-8">{{pce1}}</div>
        <div v-else class="bdg fs-sm font-mono">{{pce2}}</div>
      </div>
      <q-linear-progress :value="pc2 > 1 ? 1 : pc2" size="5px" color="negative"/>
    </div>
  </div>
</template>

<script>
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { edvol } from '../app/util.mjs'

export default {
  name: 'QuotasVols',

  props: { 
    vols: Object // {v1 v2 q1 q2} OU {a1 a2 q1 q2}
  },

  computed: {
    edv1 () { return edvol(this.vols.q1 * UNITEV1) },
    edv2 () { return edvol(this.vols.q2 * UNITEV2) },
    q1 () { const v = this.vols; return v.q1 + ' - ' + edvol(v.q1 * UNITEV1) },
    q2 () { const v = this.vols; return v.q2 + ' - ' + edvol(v.q2 * UNITEV2) },
    pc1 () { const v = this.vols; 
      return v.a1 === undefined ? (v.v1 / (v.q1 * UNITEV1)) : (v.a1 / v.q1) 
    },
    pc2 () { const v = this.vols; 
      return v.a1 === undefined ? (v.v2 / (v.q2 * UNITEV2)) : (v.a2 / v.q2) 
    },
    pce1 () { return Math.round(this.pc1 * 100) + '%' },
    pce2 () { return Math.round(this.pc2 * 100) + '%' }
  },

  methods: {
  },

  data () {
    return {
      edvol: edvol
    }
  },

  setup (props) {
    return {
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.larg
  width: 10rem
.bdg
  max-height: 1rem
</style>
