<template>
<q-dialog v-model="ui.d.a.detailspeople" full-height position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtit', [session.getCV(id).nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-card class="q-pa-sm">
      <apercu-genx :id="id" nodet/>

      <barre-people v-if="session.estComptable || session.estDelegue" :id="id"/>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <!--div class="titre-md text-italic y-mb-sm">{{$t('PPchats')}}</div-->

      <chats-avec :id-e="id" :del="del"/>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPgroupes')}}</div>

      <div v-for="idg in pSt.peC.sgr" :key="idg">
        <div class="q-my-sm row q-gutter-sm">
          <span class="fs-md col">{{session.getCV(idg).nomc}} - {{$t('AMm' + stmb(idg))}}</span>
          <btn-cond class="col-auto" size="sm" icon-right="open_in_new"
            :label="$t('PGvg')" @ok="voirgr(idg)"/>
        </div>
      </div>

    </q-card>
  
  </q-page-container>

</q-layout>
</q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BarrePeople from '../components/BarrePeople.vue'
import ChatsAvec from '../components/ChatsAvec.vue'
import BtnCond from '../components/BtnCond.vue'
import { styp } from '../app/util.mjs'

const session = stores.session
const pSt = stores.people
const gSt = stores.groupe
const ui = stores.ui

const id = computed(() => session.peopleId)
const del = computed(() => { 
  const p = session.partition
  return p && p.estDel(id.value)
})

const gr = (idg) => { const e = gSt.egr(idg); return e ? e.groupe : null }
const im = (idg) => { const g = gr.value(idg); return g ? g.tid[id.value] : 0 }
const stmb = (idg) => { const im = im.value(idg); return im ? g.statutMajeur(im) : 0 }

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
