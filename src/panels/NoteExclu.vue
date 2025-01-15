<template>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="tbs">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t(nSt.note.deGroupe ? 'PNOngr' : 'PNOnper', [nom])}}
      </q-toolbar-title>
      <bouton-help page="note-exclu"/>
    </q-toolbar>
    <q-toolbar v-if="session.cEdit" inset class="full-width msg">{{session.cEdit}}</q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs spsm">
      <node-parent class="q-my-md"/>

      <liste-auts class="q-my-md"/>

      <div v-if="xav">
        <div class="text-italic titre-lg text-bold q-my-md">{{$t('PNOext2')}}</div>
        <apercu-genx class="q-my-md" :id="xav.ida" :im="xav.im"/>
      </div>
      <div v-else class="text-italic titre-lg text-bold q-my-md">{{$t('PNOext1')}}</div>

      <div v-if="peutSuppr" class="q-my-md"> <!-- Bloc "perdre" -->
        <div class="row items-center q-mt-md q-gutter-sm justify-end items-center">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond v-if="xav.avc" icon="close" cond="cEdit"
            :label="$t('PNOperdre1')" @ok="perdre"/>
          <btn-cond v-if="!xav.avc && anim" icon="close" cond="cEdit"
            :label="$t('PNOperdre2')" @ok="perdre"/>
        </div>
      </div>

      <div v-if="!amb" class="q-my-md msg">{{$t('PNOamb')}}</div>

      <div class="q-my-sm row q-gutter-sm">
        <span class="titre-md text-italic">{{$t('plusinfo')}}</span>
        <bouton-bulle idtext="BULLEexclu"/>
      </div>

      <div v-if="lst && lst.length" class="q-my-sm">
        <div class="titre-lg text-italic text-center">{{$t('PNOlex')}}</div>

        <div class="q-mt-sm bordt">
          <div v-for="(e, idx) in lst" :key="idx" 
            :class="dkli(idx) + ' q-mt-xs row cursor-pointer hov bord' + (xap && (e.im === xap.im) ? '2' : '1')"
            @click="selmb(e)">
            <div class="col-2 text-center">#{{e.im}}</div>
            <div class="col-10">{{e.nom}}</div>
          </div>
        </div>

        <apercu-genx v-if="xap" class="q-my-md" :id="xap.ida" :im="xap.im"/>

        <div v-if="xap" class="row items-center q-mt-md q-gutter-sm justify-end items-center">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="check" :label="$t('PNOattr')" cond="cEdit" @ok="valider"/>
        </div>
      </div>
      <div v-else class="titre-lg text-italic q-my-sm">{{$t('PNOnlex' + (xav ? '2' : '1'))}}</div>
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
const nbAuts = computed(() => nSt.nbAuts)
// retourne { avc: true/false, ida, im, cv } ou null s'il n'y a pas d'exclusivité
const xav = computed(() => nSt.mbExclu) 

const peutSuppr = computed(() => xav.value && (anim.value || mav.value.has(xav.value.ida)))

/*
const peutPrendre = computed(() => anim.value || (!xav.value && nbAuts.value.avc))
const peutDonner = computed(() => anim.value || (xav.value && mav.value.has(xav.value.ida)))
*/

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
.hov:hover
  background: var(--q-primary) !important
.bord1
  border: 1px solid transparent
.bord2
  border: 1px solid var(--q-warning)
.bordt
  height: 20vh
  overflow-y: auto
  padding: 5px
  border: 1px solid $grey-5
  border-radius: 8px
.info
  margin: 5px
  padding: 5px
  border: 1px solid var(--q-warning)
  border-radius: 8px
</style>
