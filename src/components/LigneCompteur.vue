<template>
<div>
<div v-if="v[VMS] === 0" class="titre-lg q-my-md text-italic text-center">{{$t('PCPnoex')}}</div>
<div v-else>
  <div class="fs-md q-mt-xs text-italic q-mb-sm">{{$t('PCPnbjours', nbj, {count: nbj})}}</div>

  <div :class="'row q-mt-xs ' + dkli(1)">
    <div class="col-8">{{$t('PCPqmn')}}</div>
    <div class="col-2 font-mono text-center">{{p0(v[VQN] * UNITEN)}}</div>
    <div class="col-2 font-mono text-center">
      <span>{{p0(nbdoc)}}</span>
      <span :class="'q-ml-xs ' + pccl(nbdoc, v[VQN] * UNITEN)">{{pced(nbdoc, v[VQN] * UNITEN)}}</span>
    </div>
  </div>
  <div :class="'row ' + dkli(1)">
    <div class="col-8 text-italic q-ml-md">{{$t('PCPnbdoc', [p0(v[VNN]), p0(v[VNC]), p0(v[VNG])])}}</div>
    <div class="col-2"></div>
    <div class="col-2"></div>
  </div>
  <div :class="'row q-mt-xs ' + dkli(0)">
    <div class="col-8">{{$t('PCPqmv')}}</div>
    <div class="col-2 font-mono text-center">{{pv(v[VQV] * UNITEV)}}</div>
    <div class="col-2 font-mono text-center">
      <span>{{pv(v[VV])}}</span>
      <span :class="'q-ml-xs ' + pccl(v[VV], v[VQV] * UNITEV)">{{pced(v[VV], v[VQV] * UNITEV)}}</span>
    </div>
  </div>

  <div :class="'row q-mt-xs ' + dkli(1)">
    <div class="col-8">{{$t('PCPqmc')}}</div>
    <div class="col-2 font-mono text-center">{{p2(v[VQC])}}c</div>
    <div class="col-2 font-mono text-center">
      <span>{{p2(v[VCC])}}c</span>
      <span :class="'q-ml-xs ' + pccl(v[VCC], v[VQC])">{{pced(v[VCC], v[VQC])}}</span>
    </div>
  </div>

  <div :class="'row q-mt-xs ' + dkli(0)">
    <div class="col-8">{{$t('PCPcabo')}}</div>
    <div class="col-2 font-mono text-center">{{p2(v[VAC])}}c</div>
    <div class="col-2 font-mono text-center">{{p2(v[VAF])}}c</div>
  </div>

  <div :class="'row q-mt-xs ' + dkli(1)">
    <div class="col-8">{{$t('PCPccon')}}</div>
    <div class="col-2 font-mono text-center">{{p2(v[VCC])}}c</div>
    <div class="col-2 font-mono text-center">{{p2(v[VCF])}}c</div>
  </div>

  <div :class="'row q-mt-xs ' + dkli(0)">
    <div class="col-8">{{$t('PCPnlne')}}</div>
    <div class="col-2 font-mono text-center">{{p0(v[VNL])}}</div>
    <div class="col-2 font-mono text-center">{{p0(v[VNE])}}</div>
  </div>
  <div :class="'row ' + dkli(0)">
    <div class="col-8">{{$t('PCPvdvm')}}</div>
    <div class="col-2 font-mono text-center">{{pv(v[VVD])}}</div>
    <div class="col-2 font-mono text-center">{{pv(v[VVM])}}</div>
  </div>

  <div :class="'row q-mt-xs ' + dkli(1)">
    <div class="col-8">{{$t('PCPcrdb')}}</div>
    <div class="col-2 font-mono text-center">{{p0(v[VCR])}}c</div>
    <div class="col-2 font-mono text-center">{{p0(v[VDB])}}c</div>
  </div>
  <div :class="'row ' + dkli(1)">
    <div class="col-8">{{$t('PCPsoldes')}}</div>
    <div class="col-2 font-mono text-center">{{p5s(v[VS])}}c</div>
    <div :class="'col-2 font-mono text-center ' + (sap < 0 ? 'p100' : '')">{{p5s(sap)}}c</div>
  </div>
</div>
</div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MSPARJOUR, UNITEN, UNITEV, VMS, VQN, VQV, VQC, VNN, VNC, VNG, 
  VNL, VNE, VVD, VVM, VV, VAC, VAF, VCC, VCF, VCR, VDB, VS } from '../app/api.mjs'
import { edvol, dkli } from '../app/util.mjs'

const props = defineProps({
  v: Array, // Vecteur vd du moid
  aaaa: Number, // année
  mm: Number // numéro de mois
})

const nbj = computed(() => Math.floor(props.v[VMS] / MSPARJOUR))
const nbdoc = computed(() => props.v[VNN] + props.v[VNC] + props.v[VNG])
const sap = computed(() => props.v[VS] + props.v[VCR] - props.v[VDB] - props.v[VAF] - props.v[VCF])

const p0 = (x) => x === 0 ? '0' : (x < 1 ? '<1' : Math.round(x))
const p2 = (x) => x === 0 ? '0' : (x < 0.01 ? '<0,01' : x.toPrecision(2))
const p4 = (x) => x === 0 ? '0' : (x < 0.0001 ? '<0,0001' : x.toPrecision(4))
const p5 = (x) => x === 0 ? '0' : (x < 0.0001 ? '<0,0001' : x.toPrecision(5))
const pv = (x) => x === 0 ? '0B' : (x < 1 ? '<1B' : edvol(x))
const p2s = (x) => x < 0 ? '-' + p2(-x) : p2(x)
const p5s = (x) => x < 0 ? '-' + p5(-x) : p5(x)

const pc = (x, y) => y === 0 ? 999 : (x * 100) / y
const pced = (x, y) => { const q = pc(x, y)
  return q >= 999 ? '?' : (q === 0 ? '0%' : (q < 1 ? '<1%' : Math.round(q) + '%'))
}
const pccl = (x, y) => { const q = pc(x, y)
  return q >= 999 ? '' : (q >= 100 ? ' p100 ' : (q >= 80 ? ' p80 ' : ''))
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.p80
  padding: 0 3px
  border: 1px solid var(--q-warning)
  color: black
  background-color: $yellow-5
.p100
  padding: 0 3px
  font-weight: bold
  border: 2px solid var(--q-negative)
  color: black
  background-color: $yellow-5
</style>
