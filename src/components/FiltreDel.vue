<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <q-btn no-caps flat :label="$t('FIpart', [$t('roledel' + val)])">
    <q-menu anchor="bottom left" self="top left">
      <q-list style="min-width: 50px">
        <q-item clickable v-close-popup @click="val=0">
          <span class="fs-md text-italic">{{$t('roledel0')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=1">
          <span class="fs-md text-italic">{{$t('roledel1')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=2">
          <span class="fs-md text-italic">{{$t('roledel2')}}</span>
        </q-item>
      </q-list>
    </q-menu>
    </q-btn>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

import stores from "../stores/stores.mjs"
import { dkli, $t } from '../app/util.mjs'

const props = defineProps({ nom: String, idx: Number })

const st = stores.filtre
const x = st.filtre[props.nom]
const val = ref(x && x.rolepart ? x.rolepart : 0)

watch(val, (ap) => { 
  st.setFiltre(props.nom, 'rolepart', ap)
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
