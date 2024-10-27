<template>
  <div :class="'q-pa-xs full-width ' + dkli()">
    <div class="fs-md text-italic">{{$t('FIavgrt')}}</div>
    <btn-cond no-caps flat :label="tit" icon-right="expand_more">
    <q-menu anchor="bottom left" self="top left" max-height="10rem" 
      max-width="20rem">
      <q-list class="bg-secondary text-white">
        <q-item clickable v-close-popup @click="val=null">
          <span class="fs-md">{{$t('FItavgr')}}</span>
        </q-item>
        <q-separator/>
        <q-item v-for="na in la" :key="na.id" clickable 
          v-close-popup @click="val=na">
          <span class="fs-md">{{na.nom}}</span>
        </q-item>
        <q-separator/>
        <q-item v-for="ng in lg" :key="ng.id" clickable 
          v-close-popup @click="val=ng">
          <span class="fs-md">{{ng.nom}}</span>
        </q-item>
      </q-list>
    </q-menu>
    </btn-cond>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

import stores from "../stores/stores.mjs"
import { dkli, $t } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

const props = defineProps({ nom: String, idx: Number })

const fSt = stores.filtre
const aSt = stores.avatar
const gSt = stores.groupe
const val = ref(null)
const la = ref(aSt.naAvatars)
const lg = ref(gSt.ngGroupes)

const tit = computed(() => {
  if (!val.value) return $t('FItavgr')
  return ID.estGroupe(val.value.id) ? $t('groupe', [val.value.nom]) : $t('avatar', [val.value.nom])
})

watch(val, (na) => { 
  fSt.setFiltre(props.nom, 'avgr', na ? na.id : '')
  const b = na && ID.estGroupe(na.id)
  if (!fSt.mcgroupe === b) fSt.setMcgroupe(b)
})

</script>

<style lang="css">
.q-item { padding: 2px 5px !important; min-height: 0 !important; }
</style>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
