<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <q-select v-model="val" dense options-dense :options="options" :label="$t('FItri')" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import stores from "../stores/stores.mjs"
import { dkli } from '../app/util.mjs'

const props = defineProps({ nom: String, nbOptions: Number, idx: Number })

const st = stores.filtre
const x = st.tri[props.nom]
const val = ref()
const options = []
for(let i = 0; i < props.nbOptions; i++){
  options.push({ value: i, label: $t('TRI' + props.nom + i)})
}
val.value = options[x || 0]

watch(val, (ap) => { 
  st.setTri(props.nom, ap)
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
