<template>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="tbs">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t(nSt.note.deGroupe ? 'PNOngr' : 'PNOnper', [nom])}}
      </q-toolbar-title>
      <btn-cond icon="check" :label="$t('valider')" cond="cEdit"
        :disable="!xap"  @ok="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="session.cEdit" inset class="full-width msg">{{session.cEdit}}</q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs">
      <node-parent />

      <q-separator class="q-my-sm" color="orange"/>

      <liste-auts class="q-my-sm"/>

      <div class="spsm"> <!-- Bloc "perdre" -->
        <div v-if="xav">
          <div class="text-italic titre-md text-bold">{{$t('PNOext2')}}</div>
          <apercu-genx class="q-my-md" :id="xav.ida" :im="xav.im"/>
          <btn-cond v-if="xav.avc" icon="close" cond="cEdit"
            :label="$t('PNOperdre1')" @ok="perdre"/>
          <btn-cond v-if="!xav.avc && anim" icon="close" cond="cEdit"
            :label="$t('PNOperdre2')" @ok="perdre"/>
        </div>
        <div v-else class="text-italic titre-md text-bold">{{$t('PNOext1')}}</div>
      </div>

      <div v-if="!amb" class="q-my-md msg">{{$t('PNOamb')}}</div>

      <div :class="'q-my-md ' + (peutTr ? '' : 'msg')">{{$t('PNOpeut')}}</div>

      <div class="q-mt-md">
        <span class="titre-lg text-italic text-center">{{$t('PNOlex')}}</span>
        <bouton-bulle idtext="BULLEexclu"/>
      </div>

      <div class="spsm q-mt-sm" style="max-height:40vh;overflow-y:auto">
        <div v-for="(e, idx) in lst" :key="idx" 
          :class="dkli(idx) + ' q-mt-xs row cursor-pointer bord' + (xap && (e.im === xap.im) ? '2' : '1')"
          @click="selmb(e)">
          <div class="col-2 text-center">#{{e.im}}</div>
          <div class="col-10">{{e.nom}}</div>
        </div>
      </div>

      <q-separator color="orange" class="q-my-sm"/>

      <apercu-genx v-if="xap" class="q-my-md" :id="xap.ida" :im="xap.im"/>

    </q-page>
  </q-page-container>
</q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'

import stores from '../stores/stores.mjs'
import { dkli, styp } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ListeAuts from '../components/ListeAuts.vue'
import BoutonBulle from '../components/BoutonBulle.vue'
import BtnCond from '../components/BtnCond.vue'
import NodeParent from '../components/NodeParent.vue'
import { ExcluNote } from '../app/operations4.mjs'

const ui = stores.ui
const session = stores.session
const nSt = stores.note 
const gSt = stores.groupe 
const pSt = stores.people
const aSt = stores.avatar

const xap = ref(null)

const nom = computed(() => pSt.nom(nSt.note.id))
const mav = computed(() => session.compte.mav)

const egr = computed(() => gSt.egr(nSt.note.id))
const groupe = computed(() => egr.value.groupe)
const amb = computed(() => session.compte.ambano(groupe.value)[0])
const anim = computed(() => egr.value.estAnim)
const xav = computed(() => nSt.mbExclu) // retourne { avc: true/false, ida, im, cv } ou null s'il n'y a pas d'exclusivité

const peutTr = computed(() => !xav.value || anim.value || (xav.value && mav.value.has(xav.value.ida)))

/* Pour une note de groupe, liste des {im, na, nom} des membres 
aptes à recevoir l'exclusivité, sauf celui actuel */
const lst = computed(() => nSt.lstImNa)

function selmb (e) {
  xap.value = e
}

async function valider () {
  const n = nSt.note
  const ida = xap.value ? xap.value.ida : null
  await new ExcluNote().run(n.id, n.ids, ida)
  xap.value = null
}

async function perdre () {
  xap.value = null
  await valider()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 2px solid transparent
.bord2
  border: 2px solid var(--q-warning)
</style>
