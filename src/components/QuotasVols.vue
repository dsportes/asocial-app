<template>
  <div class="row q-gutter-md">
    <div class="titre-md mh">{{$t('CQnbdocs', qnn)}}</div>
    <div class="titre-md mh">{{edvol(qvv) + ' ' + $t('CQvolfics')}}</div>
    <div v-if="!groupe" class="titre-md mh">{{mon(vols.qc) + ' ' + $t('CQconsocalc')}}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

import { UNITEN, UNITEV } from '../app/api.mjs'
import { edvol, nbn, mon } from '../app/util.mjs'

const props = defineProps({ 
  noutil: Boolean, // sans % utilisation
  vols: Object, // {qn qv qc v n}
  groupe: Boolean
})

const qnn= computed(() => props.vols.qn * UNITEN)
const qvv= computed(() => props.vols.qv * UNITEV)
const nn= computed(() => (props.vols.nn || 0) + (props.vols.nc || 0) + (props.vols.ng || 0))
const pcn= computed(() => this.qnn ? Math.round(nn.value * 100 / (this.qnn)) : 0)
const pcv= computed(() => qvv.value ? Math.round(props.vols.v * 100 / (qvv.value)) : 0)

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
