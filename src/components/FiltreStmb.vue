<template>
  <div :class="'q-pa-xs full-width ' + dkli(idx)">
    <q-btn no-caps flat :label="$t('FIstmb', [$t('stmb' + val)])">
    <q-menu anchor="bottom left" self="top left">
      <q-list style="min-width: 50px">
        <q-item clickable v-close-popup @click="val=0">
          <span class="fs-md text-italic">{{$t('stmb0')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=1">
          <span class="fs-md text-italic">{{$t('stmb1')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=2">
          <span class="fs-md text-italic">{{$t('stmb2')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=3">
          <span class="fs-md text-italic">{{$t('stmb3')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=4">
          <span class="fs-md text-italic">{{$t('stmb4')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=5">
          <span class="fs-md text-italic">{{$t('stmb5')}}</span>
        </q-item>
      </q-list>
    </q-menu>
    </q-btn>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import stores from "../stores/stores.mjs"
import { dkli } from '../app/util.mjs'

const props = defineProps({ nom: String, idx: Number })

const st = stores.filtre
const x = st.filtre[props.nom]
const val = ref(x && x.stmb ? x.stmb : 0)

watch(val, (ap) => { 
  st.setFiltre(props.nom, 'stmb', ap)
})

</script>

<style lang="css">
.q-item { padding: 2px 5px !important; min-height: 0 !important; }
</style>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
