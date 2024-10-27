<template>
  <div :class="'q-pa-xs full-width ' + dkli(idx)">
    <btn-cond no-caps flat><div>{{$t('FIambno')}}<br>{{$t('ambno' + val)}}</div>
    <q-menu anchor="bottom left" self="top left">
      <q-list style="min-width: 50px">
        <q-item clickable v-close-popup @click="val=0">
          <span class="fs-md text-italic">{{$t('ambno0')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=1">
          <span class="fs-md text-italic">{{$t('ambno1')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=2">
          <span class="fs-md text-italic">{{$t('ambno2')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=3">
          <span class="fs-md text-italic">{{$t('ambno3')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=4">
          <span class="fs-md text-italic">{{$t('ambno4')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=5">
          <span class="fs-md text-italic">{{$t('ambno5')}}</span>
        </q-item>
      </q-list>
    </q-menu>
    </btn-cond>
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

watch(val, (ap) => { st.setFiltre(props.nom, 'ambno', ap)})

</script>

<style lang="css">
.q-item { padding: 2px 5px !important; min-height: 0 !important; }
</style>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
