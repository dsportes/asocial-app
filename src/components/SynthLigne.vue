<template>
<div>
  <div :class="dkli(idx) + ' row full-width items-start q-py-sm'">

    <div class="col-4 row items-start justify-between">
      <div class="col row q-gutter-xs items-start">
        <btn-cond v-if="lg.id !== '0' && ui.page !== 'partition'" size="sm" round icon="more_vert" color="primary">
          <q-menu anchor="bottom left" self="top left" max-height="20rem" 
            max-width="32rem">
            <q-list class="q-py-xs bord1 bg-black text-white fs-md ">
              <q-item clickable v-close-popup  @click="pagePartition" class="row items-center">
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
              <q-item v-if="ntfP" clickable v-close-popup  
                @click="editerNtf" class="row items-center">
                <q-icon color="primary" size="md" name="warning" />
                <span>{{$t('GRCaled')}}</span>
              </q-item>
              <q-item v-if="!ntfP" clickable v-close-popup  
                @click="creerNtf" class="row items-center">
                <q-icon color="primary" size="md" name="warning" />
                <span>{{$t('GRCalcr')}}</span>
              </q-item>
              <q-item v-if="lg.nbc === 0 && !session.cUrgence" 
                clickable v-close-popup  @click="supprimer" class="row items-center">
                <q-icon color="warning" size="md" name="delete" />
                <span>{{$t('GRCsu')}}</span>
              </q-item>
            </q-list>
          </q-menu>
        </btn-cond>
        <div v-else style="width:18px"/>
        <div v-if="lg.id !== '0'" class="titre-md text-bold">{{data.code}}</div>
        <div v-if="lg.id !== '0'" class="q-ml-md font-mono fs-sm">#{{data.id}}</div>
        <div v-if="lg.id === '0'" class="text-italic titre-md text-bold">{{$t('total')}}</div>
      </div>
      <div class="col-auto row items-start">
        <q-icon :name="ic[data.ip]" :color="clr[data.ip]" size="12px"/>
        <q-icon :name="ic[data.ic]" :color="clr[data.ic]" size="12px"/>
      </div>
    </div>

    <div class="col-1 font-mono fs-md text-center">{{data.nbc}}</div>

    <div class="col-1 font-mono fs-md text-center">{{data.nbd}}</div>

    <div class="col-6 row font-mono fs-md">
      <div v-for="j in 4" :key="'' + igp + '' + (j -1)" class="col-3 text-center">
        {{data['' + igp + '' + (j -1)]}}
      </div>
    </div>
  </div>

  <!-- Dialogue de mise à jour des quotas des comptes A -->
  <q-dialog v-model="ui.d[idc].PEedqP" persistent>
    <q-card :class="styp('sm')">
      <q-toolbar class="bg-secondary text-white">
        <btn-cond color="warning" icon="close" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqutp', [code])}}</q-toolbar-title>
      </q-toolbar>
      <choix-quotas class="q-mt-sm" v-model="quotasP"/>
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

  <!-- Dialogue de gestion d'alerte niveau partition -->
  <q-dialog v-model="ui.d[idc].DNdialoguenotif" persistent>
    <dialogue-notif :type="1" :cible="lg.id" :ntf="ntf" :restr="restr" :restrb="restrb"/>
  </q-dialog>

</div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import { $t, dkli, styp } from '../app/util.mjs'
import stores from '../stores/stores.mjs'
import ChoixQuotas from './ChoixQuotas.vue'
import DialogueNotif from './DialogueNotif.vue'
import { Notification, Synthese } from '../app/modele.mjs'
import { GetPartition, SetQuotasPart, SetCodePart, SupprPartition, GetSynthese } from '../app/operations4.mjs'
import BtnCond from './BtnCond.vue'

const ic = ['star', 'circle', 'change_history', 'square']
const clr = ['green-5', 'primary', 'warning', 'negative']

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const session = stores.session

const props = defineProps({
  igp: Number, // Groupe de compteurs affiché (0..4)
  lg: Object, // ligne de synthèses
  idx: Number
})

const nvcode = ref('')

const ntf = ref(null)
const restr = ref(false)
const restrb = ref(false)

const quotasP = ref(null)

const code = computed(() => session.compte.mcode ? session.compte.mcode.get(props.lg.id) : '')
const ntfP = computed(() => session.notifPX(props.lg.id))

async function refreshSynth () {
  await new GetSynthese().run()
  await new GetPartition().run(props.lg.id)
}

async function lgCourante () {
  if (!session.partition || session.partition.id !== props.lg.id)
    await new GetPartition().run(props.lg.id)
}

const data = computed(() => {
  const d = {}
  d.code = code.value
  d.id = props.lg.id
  d.nbc = props.lg.nbc
  d.nbd = props.lg.nbd
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 4; j++) {
      const ij = '' + i + '' + j
      d[ij] = Synthese.edval(props.lg, ij, session.compte)
    }
  }
  let n = props.lg.ntfp
  d.ip = n[2] ? 3 : (n[1] ? 2 : (n[0] ? 1 : 0))
  n = props.lg.ntf
  d.ic = n[2] ? 3 : (n[1] ? 2 : (n[0] ? 1 : 0))
  return d
})

async function editerNtf () {
  ntf.value = ntfP.value.clone()
  if (ntf.value.nr === 2) { restr.value = true; restrb.value = false }
  else if (ntf.value.nr === 3) { restr.value = false; restrb.value = true }
  else { restr.value = false; restrb.value = false }
  ui.oD('DNdialoguenotif', idc)
}

async function creerNtf () {
  ntf.value = new Notification({})
  ui.oD('DNdialoguenotif', idc)
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
  ui.oD('AlPart', idc)
}

async function editer () {
  await lgCourante()
  nvcode.value = code.value
  ui.oD('PEedcom', idc)
}

async function valider () {
  await new SetCodePart().run(props.lg.id, nvcode.value)
  ui.fD()
  await refreshSynth()
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
  const maxn = rqn < q.qn ? q.qn : rqn
  const rqv = qe.qv - qpt.qv + q.qv
  const maxv = rqv < q.qv ? q.qv : rqv
  const rqc = qe.qc - qpt.qc + q.qc
  const maxc = rqc < q.qc ? q.qc : rqc
  quotasP.value = { 
    qc: q.qc, qn: q.qn, qv: q.qv,
    minc: 0, minn: 0, minv: 0,
    maxc, maxn, maxv,
    err: ''
  }
  ui.oD('PEedqP', idc)
}

async function validerqP () {
  await new SetQuotasPart().run(props.lg.id, quotasP.value)
  await refreshSynth()
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
