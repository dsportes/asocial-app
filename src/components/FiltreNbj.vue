<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <q-select v-model="val" dense options-dense :options="options" :label="$t('FIjours')" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import stores from "../stores/stores.mjs"
import { dkli } from '../app/util.mjs'

const props = defineProps({ nom: String, idx: Number })

const st = stores.filtre
const x = st.filtre[props.nom]
const val = ref(x && x.nbj ? x.nbj : 9999)
const options = ref([1, 7, 30, 90, 9999])

watch(val, (ap) => { 
  st.setFiltre(props.nom, 'nbj', ap === 9999 ? 0 : ap)
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
