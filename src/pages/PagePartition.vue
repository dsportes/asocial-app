<template>
<q-page>
  <div v-if="p" class="column">
    <q-expansion-item v-if="session.estDelegue || session.estComptable"
      class="q-ml-xl q-mt-xs q-mb-md" header-class="bg-primary text-white" 
      switch-toggle-side expand-separator dense>
      <template v-slot:header>
        <div class="full-width fs-md">{{$t('TUpart', [session.codePart(p.id)])}}</div>
      </template>
      <div class="q-ml-xl q-mb-lg splg">
        <div class="row justify-center q-gutter-sm">
          <tuile-cnv type="qc" :src="lg"/>
          <tuile-cnv type="qn" :src="lg"/>
          <tuile-cnv type="qv" :src="lg"/>
          <tuile-notif :src="lg"/>
        </div>
        <div class="q-my-xs">
          <apercu-notif :editable="session.estComptable || session.estDelegue"
            :notif="ntfp" :type="1" :cible="p.id"/>
        </div>
      </div>
    </q-expansion-item>

    <div v-else class="q-ml-xl p-px-xs fs-md bg-primary text-white q-my-xs">{{$t('TUpart', [session.codePart(p.id)])}}</div>

    <q-toolbar class="bg-secondary text-white">
      <q-toolbar-title class="titre-md q-ma-xs">{{$t('PTtit' + (session.pow === 4 ? '1' : '2'))}}</q-toolbar-title>          
      <btn-cond v-if="session.estDelegue || session.estComptable" cond="cEdit"
        :label="$t('PTnvc')" @ok="ui.oD('NSnvsp', idc)"/>
    </q-toolbar>

    <div v-for="(c, idx) in session.ptLcFT" :key="c.id" class="spmd q-my-xs">
      <q-expansion-item v-if="vis2(c)" dense switch-toggle-side group="g1" :class="dkli(idx)" @click="selCpt(c)">
        <template v-slot:header>
          <div class="row full-width items-center justify-between">
            <div class="row items-center">
              <img class="photomax" :src="c.cv.photo" />
              <div class="titre-md q-ml-sm">{{c.cv.nomC}}
                <span v-if="type(c)===1" class="q-ml-sm">[{{$t('moi')}}]</span>
                <span v-if="c.del" class="q-ml-sm">[{{$t('delegue')}}]</span>
              </div>
              <q-icon size="md" v-if="c.notif" :name="ico(c)"
                :class="'q-ml-md ' + tclr(c) + ' ' + bgclr(c)"/>
            </div>
            
            <btn-cond v-if="type(c)===2" class="q-ml-md" icon="open_in_new"
              stop @ok="voirpage(c)"/>
          </div>
        </template>

        <div class="q-ml-lg"> <!-- type(c)!==3 &&  -->
          <apercu-genx v-if="(session.compteId !== c.id)" :id="c.id" :idx="idx" :del="c.del"/>

          <barre-people v-if="session.estComptable || session.estDelegue" :id="c.id" part />

          <chats-avec v-if="session.compteId !== c.id" class="q-mt-xs" 
            :idE="c.id" :del="(session.estComptable || session.estDelegue) || c.del"/>

          <apercu-notif v-if="session.estDelegue || session.estComptable" class="q-my-xs" editable
            :notif="c.notif" :type="2" :idx="idx" :cible="c.id"/>

          <div v-if="vis(c)" class="q-my-sm row">
            <quotas-vols class="col" :vols="c.q" />
            <btn-cond v-if="session.pow < 4" class="col-auto q-ml-sm self-start"
              cond="cUrgence"
              icon="settings" round @ok="editerq(c)"/>
          </div>
          
        </div>
      </q-expansion-item>
    </div>

    <!-- Dialogue de création d'un nouveau sponsoring -->
    <nouveau-sponsoring v-if="idc && ui.d[idc].NSnvsp" :idc2="idc"/>
    
    <!-- Dialogue de mise à jour des quotas du compte -->
    <q-dialog v-model="ui.d[idc].PTedq" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" padding="xs" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqu')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" v-model="quotas"/>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="check" :disable="quotas.err || !quotas.chg" 
            :label="$t('valider')" @ok="validerq"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
  <div v-else class="titre-lg text-italic full-width text-center">{{$t('TUnopart')}}</div>

  <q-page-sticky position="top-left" :offset="[3, 3]">
    <q-btn size="md" color="primary" icon="refresh" padding="none" @click="reload()"/>
  </q-page-sticky>

</q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { dkli } from '../app/util.mjs'
import { ID } from '../app/api.mjs'
import BtnCond from '../components/BtnCond.vue'
import TuileCnv from '../components/TuileCnv.vue'
import TuileNotif from '../components/TuileNotif.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import QuotasVols from '../components/QuotasVols.vue'
import NouveauSponsoring from '../panels/NouveauSponsoring.vue'
import BarrePeople from '../components/BarrePeople.vue'
import ChatsAvec from '../components/ChatsAvec.vue'
import { SetQuotas } from '../app/operations4.mjs'
import { GetPartition, GetNotifC } from '../app/synchro.mjs'
import { styp } from '../app/util.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const ic = ['check', 'report', 'alarm_on', 'lock']
const txt = ['green-3', 'green-5', 'warning', 'negative']
const bg = ['none', 'none', 'yellow-1', 'yellow-5']

const session = stores.session
const aSt = stores.avatar
const pSt = stores.people
const cfg = stores.config

const quotas = ref({})

const p = computed(() => session.partition)
const ntfp = computed(() => session.notifPX(p.value.id))
const lg = computed(() => p.value ? p.value.synth : {})

async function reload () {
  if (session.accesNet && !session.estA) 
    await new GetPartition().run(session.partition.id)
}

const ico = (c) => ic[c.notif.nr || 0]
const tclr = (c) => 'text-' + txt[c.notif.nr || 0]
const bgclr = (c) => 'bg-' + bg[c.notif.nr || 0]
const vis = (c) => session.pow < 4 || (c.id === session.compteId)
const vis2 = (c) => session.pow < 4 || (c.del && (c.id !== session.compteId))

function type (c) {
  if (aSt.estAvatar(c.id)) return 1
  if (pSt.estPeople(c.id)) return 2
  return 3
}

async function selCpt (c) {
  session.setPeopleId(c.id)
  if (session.pow < 4) await new GetNotifC().run(session.peopleId)
}

function voirpage (c) { 
  session.setPeopleId(c.id)
  ui.oD('detailspeople', idc)
}

async function editerq (c) {
  // c.q : {qc qn qv c2m nn nc ng v} extraits du document `comptas` du compte.
  await new GetPartition().run(session.compte.idp)
  const s = session.partition.synth
  let maxn = s.q.qn - s.qt.qn + c.q.qn; 
  if (maxn <= 0) maxn = c.q.qn
  let maxc =s.q.qc - s.qt.qc + c.q.qc; if (maxc <= 0) maxc = c.q.qc
  let maxv = s.q.qv - s.qt.qv + c.q.qv; if (maxv <= 0) maxv = c.q.qv
  quotas.value = { 
    qn: c.q.qn, qv: c.q.qv, qc: c.q.qc, minn: 0, minv: 0, minc: 0,
    maxn, maxv, maxc,
    n: c.q.nn + c.q.nc + c.q.ng, v: c.q.v,
    err: ''
  }
  ui.oD('PTedq', idc)
}

async function validerq () {
  await new SetQuotas().run(session.peopleId, quotas.value)
  await reload()
  ui.fD()
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
