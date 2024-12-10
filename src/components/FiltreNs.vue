<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <q-input dense counter v-model="val" :label="$t('FI' + prop)" type="text">
      <template v-slot:append>
        <span :class="val.length !== 1 ? 'disabled' : ''">
          <q-icon name="cancel" class="cursor-pointer"  @click="val=''"/>
        </span>
      </template>
    </q-input>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import stores from "../stores/stores.mjs"
import { dkli } from '../app/util.mjs'

const props = defineProps({ nom: String, prop: String, idx: Number })

const st = stores.filtre
const x = st.filtre[props.nom]
const val = ref(x && x[props.prop] ? x[props.prop] : '')

watch(val, (ap) => { 
  st.setFiltre(props.nom, props.prop, ap)
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
