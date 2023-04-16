<template>
  <div class="row q-gutter-md">
    <div class="column larg">

      <div v-if="vols.q1" class="row justify-between items-center">
        <div>
          <q-btn class="btn1" dense color="secondary" label="Q1">
            <q-popup-proxy>
              <div :class="icf">
                <div class="titre-md text-bold">{{$t('PGq1', [vols.q1, edq1])}}</div>
                <div v-if="vx">{{$t('PGv1u', [edv1, pce1])}}</div>
                <div v-else>{{$t('PGv1a', [vols.a1, edv1, pce1])}}</div>
              </div>
            </q-popup-proxy>
          </q-btn>
          <span class="q-ml-sm fs-md text-bold font-mono">{{'[' + vols.q1 + '] ' + edq1}}</span>
        </div>
        <div v-if="pc1 > 0.95" class="q-mr-xs bdg fs-sm font-mono text-bold text-negative bg-yellow-8">{{vu ? '?' : pce1}}</div>
        <div v-else class="q-mr-xs bdg fs-sm font-mono">{{pce1}}</div>
      </div>

      <div v-else class="row justify-between items-center text-negative bg-yellow-8 text-bold">
        <div>
          <q-btn class="btn1" dense color="secondary" label="Q1">
            <q-popup-proxy>
              <div :class="icf">
                <div class="titre-md text-bold text-negative">{{$t('PGq10')}}</div>
                <div v-if="vx">{{$t('PGv1u0', [edv1])}}</div>
                <div v-else>{{$t('PGv1a0', [vols.a1, edv1])}}</div>
              </div>
            </q-popup-proxy>
          </q-btn>
          <span class='q-ml-sm fs-md text-bold font-mono'>[0]</span>
        </div>
        <div class="q-mr-xs fs-md text-bold font-mono">{{(vx ? '' : ('[' + vols.a1 + '] ')) + edv1}}</div>
      </div>

      <q-linear-progress :value="pc1 > 1 ? 1 : pc1" size="5px" color="negative"/>

    </div>

    <div class="column larg">

      <div v-if="vols.q2" class="row justify-between items-center">
        <div>
          <q-btn class="btn1" dense color="secondary" label="Q2">
            <q-popup-proxy>
              <div :class="icf">
                <div class="titre-md text-bold">{{$t('PGq2', [vols.q2, edq2])}}</div>
                <div v-if="vx">{{$t('PGv2u', [edv2, pce2])}}</div>
                <div v-else>{{$t('PGv2a', [vols.a2, edv2, pce2])}}</div>
              </div>
            </q-popup-proxy>
          </q-btn>
          <span class="q-ml-sm fs-md text-bold font-mono">{{'[' + vols.q2 + '] ' + edq2}}</span>
        </div>
        <div v-if="pc2 > 0.95" class="q-mr-xs bdg fs-sm font-mono text-bold text-negative bg-yellow-8">{{pce2}}</div>
        <div v-else class="q-mr-xs bdg fs-sm font-mono">{{pce2}}</div>
      </div>

      <div v-else class="row justify-between items-center text-negative bg-yellow-8 text-bold">
        <div>
          <q-btn class="btn1" dense color="secondary" label="Q2">
            <q-popup-proxy>
              <div :class="icf">
                <div class="titre-md text-bold text-negative">{{$t('PGq20')}}</div>
                <div v-if="vx">{{$t('PGv2u0', [edv2])}}</div>
                <div v-else>{{$t('PGv2a0', [vols.a2, edv2])}}</div>
              </div>
            </q-popup-proxy>
          </q-btn>
          <span class='q-ml-sm fs-md text-bold font-mono'>[0]</span>
        </div>
        <div class="q-mr-xs fs-md text-bold font-mono">{{(vx ? '' : ('[' + vols.a2 + '] ')) + edv2}}</div>
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
    vols: Object
    // {v1 v2 q1 q2} OU {a1 a2 q1 q2}
    // Si a1 est défini : a1 (a2) représente un quota attribué sinin v1 représente un volume occupé
  },

  computed: {
    icf () { return this.$q.dark.isActive ? ' infoc' : ' infof' },

    edv1 () { return this.vu ? '?' : edvol(this.vx ? this.vols.v1 : (this.vols.a1 * UNITEV1)) },
    edv2 () { return this.vu ? '?' : edvol(this.vx ? this.vols.v2 : (this.vols.a2 * UNITEV2)) },
    edq1 () { return edvol(this.vols.q1 * UNITEV1) },
    edq2 () { return edvol(this.vols.q2 * UNITEV2) },
    q1 () { const v = this.vols; return v.q1 + ' - ' + edvol(v.q1 * UNITEV1) },
    q2 () { const v = this.vols; return v.q2 + ' - ' + edvol(v.q2 * UNITEV2) },
    pc1 () { const v = this.vols;
      if (v.q1 === 0) return (this.vx ? v.v1 : v.a1) === 0 ? 0 : 999
      return this.vx ? (v.v1 / (v.q1 * UNITEV1)) : (v.a1 / v.q1) 
    },
    pc2 () { const v = this.vols; 
      if (v.q2 === 0) return (this.vx ? v.v2 : v.a2) === 0 ? 0 : 999
      return this.vx ? (v.v2 / (v.q2 * UNITEV2)) : (v.a2 / v.q2) 
    },
    pce1 () { return (this.vu && this.vx ? '?' : Math.round(this.pc1 * 100)) + '%' },
    pce2 () { return (this.vu && this.vx ? '?' : Math.round(this.pc2 * 100)) + '%' },
    vx () { return this.vols.a1 === undefined },
    vu () { return this.vols.v1 === undefined },
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
