<template>
  <saisie-mois v-model="dlvat" 
    :dmax="maxdlvat" :dmin="mindlvat" :dinit="initdlvat"
    @ok="cfDlvat" icon="check" :label="$t('ESdlvat')"/>

    <!-- Changement d'une dlvat -->
  <q-dialog v-model="ui.d[idc].PEdlvat" persistent>
    <q-card :class="styp('sm')">
      <q-toolbar class="bg-secondary text-white">
        <btn-cond color="warning" icon="close" @ok="fin"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTdlvat')}}</q-toolbar-title>
      </q-toolbar>
      <q-card-section class="q-ma-sm">
        <div class="q-my-md colmun">
          <div class="titre-md text-center">{{$t('PTdlvatx')}}</div>
          <div class="titre-md text-center">{{$t('PTdlvata', [AMJ.editDeAmj(espace.dlvat)])}}</div>
          <div class="titre-md text-center">{{$t('PTdlvatf', [AMJ.editDeAmj(dlv)])}}</div>
        </div>
      </q-card-section>

      <q-card-actions vertical align="right">
        <bouton-confirm class="q-my-md maauto" actif :confirmer="chgDlvat"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { AMJ } from '../app/api.mjs'
import SaisieMois from './SaisieMois.vue'
import BoutonConfirm from './BoutonConfirm.vue'
import { SetEspaceDlvat } from '../app/operations4.mjs'
import { styp } from '../app/util.mjs'
import BtnCond from './BtnCond.vue'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const emit = defineEmits(['close' ])

const props = defineProps({ 
  espace: Object
})

const dlvat = ref(0) // dlvat saisie
const dlv = ref(0) // Dernier jour du mois de la dlv saisie

const mindlvat = computed(() => Math.floor(AMJ.amjUtc() / 100))
const initdlvat = computed(() => props.espace.dlvat ? Math.floor(props.espace.dlvat / 100) : mindlvat.value)
const maxdlvat = computed(() => Math.floor(AMJ.max / 100))

function cfDlvat () {
  dlv.value = AMJ.djMois((dlvat.value * 100) + 1)
  ui.oD('PEdlvat', idc)
}

async function chgDlvat () {
  await new SetEspaceDlvat().run(props.espace.ns, dlv.value)
  ui.fD()
  emit('close', true)
}

function fin () {
  ui.fD()
  emit('close', false)
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
