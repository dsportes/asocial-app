<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <q-checkbox v-model="val" class="cb" :label="$t('FInonlus')" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import stores from "../stores/stores.mjs"
import { dkli } from '../app/util.mjs'

const props = defineProps({ nom: String, idx: Number })

const st = stores.filtre
const x = st.filtre[props.nom]
const val = ref(x && x.nonlus ? x.nonlus : false)

watch(val, (ap) => { 
  st.setFiltre(props.nom, 'nonlus', ap === true ? true : false) 
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.cb
  position: relative
  left: -10px
</style>
