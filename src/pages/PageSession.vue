<template>
  <q-page class="column spmd">
    <div v-if="session.ok" class="q-my-md">
      <div class="text-italic titre-lg">{{$t('ISst', [st, mo])}}</div>

      <div class="titre-md text-italic q-mt-md">{{$t('ISconso', [mon(couts[4], 4)])}}</div>
      <div class="row items-center">
        <div class="col-4 text-center text-italic">{{$t('PCPlec')}}</div>
        <div class="col-4 text-center font-mono">{{session.consocumul.nl}}</div>
        <div class="col-4 text-center font-mono">{{mon(couts[0], 4)}}</div>
      </div>
      <div class="row items-center">
        <div class="col-4 text-center text-italic">{{$t('PCPecr')}}</div>
        <div class="col-4 text-center font-mono">{{session.consocumul.ne}}</div>
        <div class="col-4 text-center font-mono">{{mon(couts[1], 4)}}</div>
      </div>
      <div class="row items-center">
        <div class="col-4 text-center text-italic">{{$t('PCPvd')}}</div>
        <div class="col-4 text-center font-mono">{{edvol(session.consocumul.vd)}}</div>
        <div class="col-4 text-center font-mono">{{mon(couts[2], 4)}}</div>
      </div>
      <div class="row items-center">
        <div class="col-4 text-center text-italic">{{$t('PCPvm')}}</div>
        <div class="col-4 text-center font-mono">{{edvol(session.consocumul.vm)}}</div>
        <div class="col-4 text-center font-mono">{{mon(couts[3], 4)}}</div>
      </div>
    </div>

    <q-expansion-item v-if="session.status" group="etc" class="full-width" switch-toggle-side default-opened
      header-class="expansion-header-class-1 titre-md tbp" 
      :label="$t('RStit', [nc])">
      <rapport-synchro class="q-ma-sm"/>
    </q-expansion-item>
    <q-separator/>

  </q-page>
</template>

<script setup>
import { computed } from 'vue'

import RapportSynchro from '../components/RapportSynchro.vue'
import stores from '../stores/stores.mjs'
import { edvol, mon, $t } from '../app/util.mjs'
import { Tarif } from '../app/api.mjs'

const session = stores.session

const nc = computed(() => session.getCV(session.compteId).nom )
const couts = computed(() => Tarif.evalConso2(session.consocumul))
const st = computed(() => $t('ISst' + (session.status < 2 ? session.status : 2)))
const mo = computed(() => session.synchro ? $t('sync') : (session.avion ? $t('avion') : 'incognito'))

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.ma-qcard-section
  padding: 3px !important
</style>

