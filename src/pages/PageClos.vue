<template>
  <q-page class="column align-start items-center">
    <!-- Application close par l'administrateur -->
    <q-card v-if="session.excKO && session.excKO.code === 9999" class="q-mt-lg spsm column justify-center">
      <div class="text-center">
        <span class="titre-lg">{{$t('ECclos', [session.org])}}</span>
        <bouton-bulle class="q-mr-md fs-md" icon="report_problem" idtext="BULLEclos"/>
      </div>
      <div class="q-mt-md q-mb-sm text-center text-italic titre-md">
        {{$t('ECmi', [dhcool(session.excKO.args[1])])}}
      </div>
      <div v-if="session.excKO.stack">
        <q-input class="font-mono fs-xs" type="text" readonly outlined dense v-model="session.excKO.stack"/>
      </div>
      <show-html class="bord" zoom maxh="10rem" :texte="session.excKO.args[0]"/>
      <btn-cond class="q-mt-lg text-center" flat size="lg"
        color="warning" :label="$t('jailu')" @ok="deconnex"/>
    </q-card>

    <!-- Compte disparu en cours de session, chgt phrase ou résiliation -->
    <q-card v-if="session.excKO && session.excKO.code === 8998" class="q-mt-lg spsm column justify-center">
      <div class="text-center titre-lg titre-italic">
        {{$t('compteKO', [session.compteId, pSt.getCV(session.compteId).nom])}}
      </div>
      <btn-cond class="q-mt-lg text-center" flat size="lg"
        color="warning" :label="$t('jailu')" @ok="deconnex"/>
    </q-card>

    <!-- Toute exception survenue en synchronisation -->
    <q-card v-if="session.excKO && session.excKO.code < 9900 && session.excKO.code !== 8998" 
      class="q-mt-lg spsm column justify-center">
      <div class="text-center titre-lg titre-italic">{{$t('sessionKO')}}</div>
      <div class="text-center titre-sm q-my-md q-mx-md" v-html="html(session.excKO)"/>
      <div v-if="session.excKO.stack">
        <q-input class="font-mono fs-xs" type="text" readonly outlined dense v-model="session.excKO.stack"/>
      </div>
      <btn-cond class="q-mt-lg text-center" flat size="lg"
        color="warning" :label="$t('jailu')" @ok="deconnex"/>
    </q-card>
  </q-page>
</template>

<script setup>
import stores from '../stores/stores.mjs'
import BoutonBulle from '../components/BoutonBulle.vue'
import { dhcool, html } from '../app/util.mjs'
import { deconnexion } from '../app/synchro.mjs'
import ShowHtml from '../components/ShowHtml.vue'
import BtnCond from '../components/BtnCond.vue'

const session = stores.session
const pSt = stores.people

async function deconnex() { await deconnexion() }

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
