<template>
  <div :class="'q-pa-xs full-width ' + dkli(idx)">
    <q-option-group v-model="val" dense :options="options" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import stores from "../stores/stores.mjs"
import { dkli, $t } from '../app/util.mjs'

const props = defineProps({ nom: String, idx: Number })

const st = stores.filtre
const x = st.filtre[props.nom]
const val = ref(x.rac || 0)
const options = [
  { label: $t('rac0'), value: 0 },
  { label: $t('rac1'), value: 1 },
  { label: $t('rac2'), value: 2 }
]

watch(val, (ap) => { 
  st.setFiltre(props.nom, 'rac', ap)
})

</script>

<style lang="css">
.q-item { padding: 2px 5px !important; min-height: 0 !important; }
</style>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
