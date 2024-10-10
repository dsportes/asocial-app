<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <q-select v-model="val" dense options-dense :options="options" 
      :label="$t('FI' + attr)" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import stores from "../stores/stores.mjs"
import { dkli, $t, edvol } from '../app/util.mjs'

const props = defineProps({ nom: String, attr: String, idx: Number })

const st = stores.filtre
const x = st.filtre[props.nom]
const val = ref()
const vols = {
  vf: [1000000, 10000000, 100000000, 1000000000]
}
const options = ref([])
options.value.push({ value: 0, label: $t('nolimite')})
for(const v of vols[props.attr]) 
  options.value.push({ value: v, label: '> ' + edvol(v)})

const vi = x && x[props.attr] ? x[props.attr] : 0
options.value.forEach(t => { if (t.value === vi) val.value = t})

watch(val, (ap) => { 
  st.setFiltre(props.nom, props.attr, ap.value || 0)
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
