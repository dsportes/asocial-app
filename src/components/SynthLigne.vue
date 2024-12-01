<template>
<div>
  <div :class="dkli(idx) + ' row full-width items-center'">

    <div class="col-4 row items-center q-gutter-sm">
      <btn-cond v-if="lg.id !== '0'" round icon="more_vert" color="primary">
        <q-menu anchor="bottom left" self="top left" max-height="20rem" 
          max-width="32rem">
          <q-list class="q-py-xs bord1 bg-black text-white fs-md ">
            <q-item clickable v-close-popup  @click="editer" class="row items-center">
              <q-icon color="primary" size="md" name="open_in_new" />
              <span>{{$t('GRCzo')}}</span>
            </q-item>
            <q-item v-if="!session.cUrgence" clickable v-close-popup  
              @click="editer" class="row items-center">
              <q-icon color="primary" size="md" name="edit" />
              <span>{{$t('GRCed')}}</span>
            </q-item>
            <q-item v-if="!session.cUrgence" clickable v-close-popup  
              @click="editerqP" class="row items-center">
              <q-icon color="primary" size="md" name="settings" />
              <span>{{$t('GRCqu')}}</span>
            </q-item>
            <q-item v-if="!session.cUrgence" clickable v-close-popup  
              @click="editerAl" class="row items-center">
              <q-icon color="primary" size="md" name="warning" />
              <span>{{$t('GRCal')}}</span>
            </q-item>
            <q-item v-if="lg.nbc === 0 && !session.cUrgence" 
              clickable v-close-popup  @click="supprimer" class="row items-center">
              <q-icon color="warning" size="md" name="delete" />
              <span>{{$t('GRCsu')}}</span>
            </q-item>
          </q-list>
        </q-menu>
      </btn-cond>
      <div v-if="lg.id !== '0'" class="row items-center">
        <div class="titre-md text-bold">{{code}}</div>
        <div class="font-mono fs-sm">#{{lg.id}}</div>
      </div>
      <div v-else class="q-pl-lg text-italic titre-md text-bold">{{$t('total')}}</div>
    </div>

    <div class="col-1 font-mono fs-md text-center">{{lg.nbc}}</div>

    <div class="col-1 font-mono fs-md text-center">{{lg.nbd}}</div>

    <div class="col-6 row font-mono fs-md">
      <div class="col-3 text-center">0</div>
      <div class="col-3 text-center">0</div>
      <div class="col-3 text-center">0</div>
      <div class="col-3 text-center">0</div>
    </div>
  </div>

  <!-- Dialogue de mise à jour des quotas des comptes A -->
  <q-dialog v-model="ui.d[idc].PEedqP" persistent>
    <q-card :class="styp('sm')">
      <q-toolbar class="bg-secondary text-white">
        <btn-cond color="warning" icon="close" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqutp', [code])}}</q-toolbar-title>
      </q-toolbar>
      <choix-quotas class="q-mt-sm" v-model="quotasP" groupe/>
      <q-card-actions align="right" class="q-gutter-sm">
        <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond :disable="quotasP.err || !quotasP.chg" icon="check" cond="cUrgence"
          :label="$t('ok')" @ok="validerqP"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Edition du code d'une partition -->
  <q-dialog v-model="ui.d[idc].PEedcom" persistent>
    <q-card :class="styp('sm')">
      <q-toolbar class="bg-secondary text-white">
        <btn-cond color="warning" icon="close" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTinfo')}}</q-toolbar-title>
      </q-toolbar>
      <div class="q-ma-sm">
        <q-input v-model="nvcode" clearable :placeholder="$t('PTinfoph')">
          <template v-slot:append>
            <btn-cond icon="check" :label="$t('ok')" @ok="valider" color="warning"/>
          </template>
          <template v-slot:hint>{{$t('PTinfoh')}}</template>
        </q-input>
      </div>
    </q-card>
  </q-dialog>
</div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import { $t, dkli, styp } from '../app/util.mjs'
import stores from '../stores/stores.mjs'
import ChoixQuotas from './ChoixQuotas.vue'
import { GetPartition, SetQuotasPart, SetCodePart, SupprPartition } from '../app/operations4.mjs'
import BtnCond from './BtnCond.vue'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const session = stores.session

const props = defineProps({
  igp: Number, // Groupe de compteurs affiché (0..4)
  lg: Object, // ligne de synthèses
  idx: Number
})

const nvcode = ref('')
const quotasP = ref(null)
const code = computed(() => session.compte.mcode.get(props.lg.id))

async function lgCourante () {
  if (!session.partition || session.partition.id !== props.lg.id)
    await new GetPartition().run(props.lg.id)
}

async function supprimer () {
  await new SupprPartition().run(props.lg.id)
  await refreshSynth()
  ui.fD()
}

async function pagePartition () { // Comptable seulement
  await lgCourante()
  ui.setPage('partition')
}

async function editerAl () {
  await lgCourante()
  ui.oD('PEedcom', idc)
}

async function editer () {
  await lgCourante()
  nvcode.value = code.value
  ui.oD('PEedcom', idc)
}

async function valider () {
  await new SetCodePart().run(props.lg.id, nvcode.value)
  ui.fD()
}

/*
  espace.quotas : quotas de l'espace fixés par l'AT
  synth.qa : quotas réservés aux comptes A
  synth.tsp['0'] : somme des quotas des partitions
  ligne.value.q: quotas actuellement attribués à la partition
*/
async function editerqP () {
  await lgCourante()
  const q = props.lg.q // quotas actuels de la partition
  const synth = session.synthese 
  const qpt = synth.tsp['0'].q
  const qe = session.espace.quotas
  const rqn = qe.qn - qpt.qn + q.qn
  const maxn = rqn < 0 ? q.qn : rqn
  const rqv = qe.qv - qpt.qv + q.qv
  const maxv = rqv < 0 ? q.qv : rqv
  const rqc = qe.qc - qpt.qc + q.qc
  const maxc = rqc < 0 ? q.qc : rqc
  quotasP.value = { 
    qc: q.qc, qn: q.qn, qv: q.qv,
    minc: 0, minn: 0, minv: 0,
    maxc, maxn, maxv,
    err: ''
  }
  ui.oD('PEedqP', idc)
}

async function validerqP () {
  await new SetQuotasPart().run(ligne.value.id, quotasP.value)
  await refreshSynth()
  ui.fD()
}


</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
