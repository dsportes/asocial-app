<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <q-checkbox v-model="val" class="cb" :label="$t('FIavecsp')" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import stores from "../stores/stores.mjs"
import { dkli } from '../app/util.mjs'

const props = defineProps({ nom: String, idx: Number })

const st = stores.filtre
const x = st.filtre[props.nom]
const val = ref(x && x.avecsp ? x.avecsp : false)

watch(val, (ap) => { 
  st.setFiltre(props.nom, 'avecsp', ap === true ? true : false) 
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.cb
  position: relative
  left: -10px
</style>
