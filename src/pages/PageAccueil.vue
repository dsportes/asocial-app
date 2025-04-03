<template>
<div class="spsm fs-md column items-center">
  <div class="q-mb-md column items-start">
    <q-checkbox v-model="session.deconAuto" :label="$t('PNCdeconAuto')"/>
    <q-checkbox v-model="session.acceptNotif" :label="$t('PNCchntf')"/>
  </div>

  <q-toolbar class="full-width tbp row justify-between">
    <q-tabs  class="col titre-md" v-model="loctab" inline-label no-caps>
      <q-tab name="menu" :label="$t('MLAmenu')" @click="loctab='menu'"/>
      <q-tab name="icones" :label="$t('MLAicones')" @click="locatab='icones'"/>
    </q-tabs>
  </q-toolbar>

  <div v-if="loctab === 'icones'" class="column justify-center q-mx-sm">
    <div class="btn2">
      <bouton-langue :label="$t('langue')"/>
    </div>

    <!-- Dark ou clair -->
    <div class="btn2" @click="tgdark">
      <btn-cond icon="contrast"/>
      <span class="q-ml-xs">{{$t('clairfonce')}}</span>
    </div>

    <!-- Outils et tests -->
    <div class="btn2" @click="ui.oD('outilsTests', 'a')">
      <btn-cond icon="settings"/>
      <span class="q-ml-xs">{{$t('MLAout')}}</span>
    </div>

    <div v-if="!session.avion && !session.estAdmin" class="btn2" @click="ui.oD('sync', 'a')">
      <btn-cond :color="session.statusPushIC.c" :icon="session.statusPushIC.ic"/>
      <span class="q-ml-xs">{{$t('MLAnotif')}}</span>
    </div>

    <!-- Presse papier -->
    <div v-if="!session.hasAR || session.estComptable"
      class="btn2" @click="ui.oD('pressepapier', 'a')">
      <btn-cond icon="content_paste"/>
      <span class="q-ml-xs">{{$t('MLApp')}}</span>
    </div>

    <q-separator/>

    <!-- Alertes -->
    <div class="btn2 row items-center" @click="clickAlertes">
      <icon-alerte
        :alire="session.alire && (session.nivAlerte !== 0)" :niv="session.nivAlerte"/>
      <span class="q-ml-xs">{{$t('PNCntf')}}</span>
    </div>

    <!-- Abonnement -->
    <div class="btn2 row items-center" @click="clickAbo">
      <icon-alerte :niv="session.nivAlerteCpt"/>
      <span class="q-ml-xs">{{$t('PNCabo')}}</span>
    </div>

    <!-- credits -->
    <div class="btn2 row items-center" @click="clickCred">
      <icon-alerte :niv="session.nivAlerteSN"/>
      <span class="q-ml-xs">{{$t('PNCcre')}}
        <q-badge v-if="session.estComptable && aSt.nbTkAtt" color="primary" rounded>{{aSt.nbTkAtt}}</q-badge>
      </span>
    </div>

    <!-- Chats d'urgence -->
    <div v-if="!session.estComptable" class="btn2 row items-center" @click="clickChats">
      <btn-cond icon="chat"/>
      <span class="q-ml-xs">{{$t('PNCurg')}}</span>
    </div>
  </div>

  <div v-if="loctab === 'menu'" class="q-mx-sm q-my-sm">
    <menu-accueil/>
  </div>
</div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'

import stores from '../stores/stores.mjs'
import BoutonLangue from '../components/BoutonLangue.vue'
import IconAlerte from '../components/IconAlerte.vue'
import MenuAccueil from '../components/MenuAccueil.vue'
import BtnCond from '../components/BtnCond.vue'

const $q = useQuasar()
const ui = stores.ui
const session = stores.session
const aSt = stores.avatar

const loctab = ref('menu')
const pccl = computed(() => aSt.compta.pc < 80 ? 'bg-transparent' : (aSt.compta.pc < 100 ? 'bg-yellow-3' : 'bg-negative'))

function tgdark () { $q.dark.toggle() }
function clickAlertes () { ui.setPage('compta', 'alertes')}
function clickChats () { ui.setPage('compta', 'chats')}
function clickAbo () { ui.setPage('compta', 'compta')}
function clickCred () { ui.setPage('compta', 'credits')}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.btn2
  width: 13rem
  height: 2rem
  overflow: hidden
  margin: 3px
  cursor: pointer
  border: 1px solid transparent
.btn2:hover
  border-color: $grey-5
</style>

