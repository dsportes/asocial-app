<template>
<div>
  <div class="titre-lg text-italic q-mb-sm">{{$t('mois' + mm) + ' ' + aaaa + $t('nbjours', [nbj])}}</div>
  <div class="titre-md">{{$t('PCPqmn', [p0(v[VQN])])}}</div>
  <div class="titre-md text-italic q-ml-md">{{$t('PCPnbdoc', [p0(nbdoc), p0(v[VNN]), p0(v[VNC]), p0(v[VNG])])}}</div>
  <div class="titre-md">{{$t('PCPqmv', [pv(v[VQV]), pv(v[VV])])}}</div>
  <div class="titre-md">{{$t('PCPqmc', [p2(v[VQC]), p2(v[VCC])])}}</div>
  <div class="titre-md q-mt-sm">{{$t('PCPcabo', [p2(v[VAC]), p2(v[VAF])])}}</div>
  <div class="titre-md">{{$t('PCPccon', [p2(v[VCC]), p2(v[VCF])])}}</div>
  <div class="titre-md text-italic q-ml-md">{{$t('PCPnlne', [p0(v[VNL], p0(v[VNE]))])}}</div>
  <div class="titre-md text-italic q-ml-md">{{$t('PCPcrdb', [p0(v[VCR], p0(v[VDB]))])}}</div>
  <div class="titre-md q-mt-md">{{$t('PCPsoldes', [p2(v[VS]), p2(sap)])}}</div>
</div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { MSPARJOUR, VMS, VQN, VQV, VQC, VNN, VNC, VNG, VV, VAC, VAF, VCC, VCF, VCR, VDB, VS } from '../app/api.mjs'

const props = defineProps({
  v: Array, // Vecteur vd du moid
  aaaa: Number, // année
  mm: Number // numéro de mois
})

const nbj = computed(() => { 
  const x = Math.floor(props.v[VMS] / MSPARJOUR)
  return x < 1 ? '<1' : x
})
const nbdoc = computed(() => props.v[VNN] + props.v[VNC] + props.v[VNG])
const sap = computed(() => props.v[VS] + props.v[VCR] - props.v[VDB] - props.v[VAF] - props.v[VCF])

const p0 = (x) => x === 0 ? '0' : (x < 1 ? '<1' : Math.round(x))
const p2 = (x) => x === 0 ? '0' : (x < 0.01 ? '<0,01' : x.toPrecision(2))
const p4 = (x) => x === 0 ? '0' : (x < 0.0001 ? '<0,0001' : x.toPrecision(4))
const pv = (x) => x === 0 ? '0' : (x < 1 ? '<1B' : edvol(x))

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
