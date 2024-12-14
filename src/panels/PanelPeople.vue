<template>
<q-dialog v-model="ui.d.a.detailspeople" position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="tbs">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtit', [session.getCV(id).nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <div class="q-pa-sm">
      <apercu-genx :id="id" nodet :del="del"/>

      <div class="row q-gutter-sm items-center">
        <btn-cond v-if="comptaVis" cond="cUrgence" :label="$t('PPcompta')" @ok="voirCompta"/>
      </div>
      
      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <chats-avec :id-e="id" :del="del"/>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPgroupes')}}</div>

      <div v-for="idg in sgr" :key="idg">
        <div class="q-my-sm row q-gutter-sm">
          <span class="fs-md col">{{session.getCV(idg).nomc}} - {{$t('AMm' + stmb(idg))}}</span>
          <btn-cond class="col-auto" size="sm" icon-right="open_in_new"
            :label="$t('PGvg')" @ok="voirgr(idg)"/>
        </div>
      </div>

    </div>
  
  </q-page-container>

  <!-- Affichage des compteurs de compta du compte "courant"-->
  <q-dialog v-model="ui.d[idc].BPcptdial" position="left" persistent>
    <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated class="tbs">
        <q-toolbar>
          <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">
            {{$t('PTcompta', [cv.nomC])}}</q-toolbar-title>
        </q-toolbar>
      </q-header>
      <q-page-container>
        <q-card>
          <panel-compta style="margin:0 auto" :c="session.compta.compteurs"/>
        </q-card>
      </q-page-container>
    </q-layout>
  </q-dialog>

</q-layout>
</q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BarrePeople from '../components/BarrePeople.vue'
import ChatsAvec from '../components/ChatsAvec.vue'
import BtnCond from '../components/BtnCond.vue'
import PanelCompta from '../components/PanelCompta.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import MicroChat from '../components/MicroChat.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import EditeurMd from '../components/EditeurMd.vue'
import PhraseContact from '../components/PhraseContact.vue'
import { styp, $t } from '../app/util.mjs'
import { GetCompta, GetComptaQv, GetAvatarPC, MuterCompteO, GetSynthese, GetPartition } from '../app/operations4.mjs'


const session = stores.session
const cfg = stores.config
const pSt = stores.people
const gSt = stores.groupe
const aSt = stores.avatar
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const id = computed(() => session.peopleId)
const cv = computed(() => session.getCV(id.value) )
const deMaPart = computed(() => !session.eltPart(id.value).fake)
const comptaVis = computed(() => id.value !== session.sessionId && 
  session.estComptable || (session.estDelegue && deMaPart.value))
const sgr = computed(() => pSt.getSgr(id.value))
const compta = ref(null)
const cf = ref(false)

// const chat = computed(() => aSt.getChatIdIE(session.compteId, id.value))

const del = computed(() => { 
  const p = session.partition
  return p && p.estDel(id.value)
})

if (session.estComptable || (session.estDelegue && deMaPart.value)) onMounted(async () => {
    compta.value = await new GetCompta().run(id.value)
})

async function voirCompta () { // comptable OU délégué
  // if (compta.value) compta.value = await new GetCompta().run(id.value)
  ui.oD('BPcptdial', idc)
}

const gr = (idg) => { const e = gSt.egr(idg); return e ? e.groupe : null }
const im = (idg) => { const g = gr.value(idg); return g ? g.tid[id.value] : 0 }
const stmb = (idg) => { const i = im.value(idg); return i ? g.statutMajeur(i) : 0 }

function voirgr (idg) {
  session.setGroupeId(idg)
  session.setMembreId(im.value(idg))
  ui.setPage('groupe', 'membres')
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.q-card__section
  padding: 2px !important
</style>
