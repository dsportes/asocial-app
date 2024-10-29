<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <q-btn padding="1px 1px" dense no-caps flat :label="$t('FInotif', [$t('gravite' + val)])">
    <q-menu anchor="bottom left" self="top left">
      <q-list style="min-width: 50px">
        <q-item clickable v-close-popup @click="val=0">
          <span class="fs-md text-italic">{{$t('gravite0')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=1">
          <span class="fs-md text-italic">{{$t('gravite1')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=2">
          <span class="fs-md text-italic">{{$t('gravite2')}}</span>
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
const val = ref(x && x.notif ? x.notif : 0)

watch(val, (ap) => { 
  st.setFiltre(props.nom, 'notif', ap)
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
