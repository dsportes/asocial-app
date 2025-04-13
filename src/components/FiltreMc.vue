<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <div class="row justify-between">
      <btn-cond :label="$t('FI' + attr)" size="sm" @ok="ouvDial"/>
      <btn-cond icon="cancel" size="12px" round color="none"
        :disable="!src.size" @ok="raz"/>
    </div>
    <div class="row q-gutter-xs font-mono fs-sm text-italic mh1 q-pa-xs q-ml-sm">
      <span v-for="t in src" :key="t">{{t}}</span>
    </div>
    <q-dialog v-model="ui.d[idc].HTags" persistent>
      <hash-tags :src="src" okbtn @ok="htok" @ko="ui.fD()"/>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'

import stores from "../stores/stores.mjs"
import BtnCond from './BtnCond.vue'
import HashTags from './HashTags.vue'
import { dkli } from '../app/util.mjs'

const props = defineProps({ nom: String, attr: String, idx: Number })

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const st = stores.filtre
const s0 = new Set()
const x = st.filtre[props.nom]
const src = ref(x && x[props.attr] ? x[props.attr] : s0)

function ouvDial () {
  ui.oD('HTags', idc)
}

function raz() {
  src.value = s0
  st.setFiltre(props.nom, props.attr, new Set())
}

function htok (ht) {
  src.value = ht
  st.setFiltre(props.nom, props.attr, ht)
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.mh1
  height: 3rem
  overflow: hidden
</style>
