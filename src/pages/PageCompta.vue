<template>
<q-page>
  <panel-compta v-if="ui.pagetab==='compta'" class="spmd q-pa-sm"/>

  <panel-credits v-if="ui.pagetab==='credits'"/>

  <div v-if="ui.pagetab==='notif' && session.compta" class="spmd q-pa-sm">

    <div class="row q-my-md items-center q-ml-sm">
      <notif-icon class="col-auto" :niv="session.ntfIco"/>
      <div class="q-ml-sm titre-lg">{{$t('ANlong' + session.ntfIco)}}</div>
    </div>

    <div class="row q-mt-lg items-center">
      <div class="colauto"><n3-icon :niv="nnbj"/></div>
      <div class="col titre-md">{{$t('PCPnbj', [nbj])}}</div>
    </div>

    <div class="row q-mt-sm items-center">
      <div class="colauto"><n3-icon :niv="npcn"/></div>
      <div class="col titre-md">
        {{$t('PCPqn', [(c.qv.qn * UNITEN), pc.pcn, c.qv.nn, c.qv.nc, c.qv.ng])}}</div>
    </div>
    <div v-if="npcn===3" :class="al">{{$t('ANlong2a')}}</div>

    <div class="row q-my-sm items-center">
      <div class="colauto"><n3-icon :niv="npcv"/></div>
      <div class="col titre-md">
        {{$t('PCPqv', [edvol(c.qv.qv * UNITEV), pc.pcv, c.qv.v])}}</div>
    </div>
    <div v-if="npcv===3" :class="al">{{$t('ANlong2b')}}</div>

    <div v-if="session.compte.estA" class="row q-mt-sm items-center">
      <div class="colauto"><n3-icon :niv="nnj"/></div>
      <div class="col titre-md">{{$t('PCPsolde', [s, nj])}}</div>
    </div>
    <div v-if="session.compte.estA && nnj===3" :class="al">{{$t('ANlong5')}}</div>

    <div v-if="!session.compte.estA" class="row q-mt-sm items-center">
      <div class="colauto"><n3-icon :niv="npcc"/></div>
      <div class="col titre-md">{{$t('PCPqcal', [c.qv.qc, pc.pcc])}}</div>
    </div>
    <div v-if="!session.compte.estA && npcc===2" :class="al">{{$t('ANlong7')}}</div>
    <div v-if="!session.compte.estA && npcc===3" :class="al">{{$t('ANlong8')}}</div>

    <q-separator color="orange" class="q-mt-md"/>
    <div class="row q-my-sm items-start">
      <div class="colauto"><n3-icon :niv="session.espace.notifE ? session.espace.notifE.nr : 0"/></div>
      <apercu-notif class="q-ml-sm col" :idx="0" :type="0" 
        :cible="session.ns" :notif="session.espace.notifE"/>
    </div>

    <div v-if="!session.compte.estA">
      <q-separator color="orange" class="q-mt-md"/>
      <div class="row q-my-sm items-start">
        <div class="colauto"><n3-icon :niv="session.notifP ? session.notifP.nr : 0"/></div>
        <apercu-notif class="q-ml-sm col" :idx="1" :type="1" :cible="session.compte.idp" :notif="session.notifP"/>
      </div>
      <q-separator color="orange" class="q-mt-md"/>
      <div class="row q-my-sm items-start">
        <div class="colauto"><n3-icon :niv="session.compte.notif ? session.compte.notif.nr : 0"/></div>
        <apercu-notif  class="q-ml-sm col" :idx="2" :type="2" 
          :cible="session.compteId" :notif="session.compte.notif"/>
      </div>
    </div>
  </div>

  <div v-if="ui.pagetab==='chats'" class="spmd q-pa-sm">
    <div class="titre-lg text-italic text-center q-py-md">
      {{$t('CPTtitch' + (session.estA ? 'A' : 'O'))}}
    </div>

    <btn-cond class="q-my-sm" cond="cUrgence"
      :label="$t('CVraf')" @ok="rafCvs"/>

    <q-card v-for="(e, idx) in lurg" :key="e.id">
      <div :class="'q-my-sm q-px-sm ' + dkli(idx)">
        <apercu-genx :id="e.id" :del="e.del" :idx="idx" />
        <micro-chat :id-e="e.id" :id-i="session.compteId" :del="e.del" urgence/>
      </div>
    </q-card>
  </div>

</q-page>
</template>

<script setup>

import { computed, ref, onMounted } from 'vue'

import stores from '../stores/stores.mjs'
import PanelCompta from '../components/PanelCompta.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import PanelCredits from '../components/PanelCredits.vue'
import MicroChat from '../components/MicroChat.vue'
import BtnCond from '../components/BtnCond.vue'
import { $t, dkli, edvol, afficher8000 } from '../app/util.mjs'
import N3Icon from '../components/N3Icon.vue'
import NotifIcon from '../components/NotifIcon.vue'
import { ID, UNITEN, UNITEV } from '../app/api.mjs'
import { RafraichirCvsAv } from '../app/operations4.mjs'
import { GetPartition } from '../app/synchro.mjs'

const al = 'titre-md text-italic bg-yellow-3 text-negative text-bold q-mb-xs q-ml-xl'

const session = stores.session
const ui = stores.ui

if (session.accesNet) onMounted( async () => { 
  await session.reloadCompta() 
  if (!session.estA) await new GetPartition().run(session.partition.id)
})

const nbj = computed(() => session.compte.nbj)
const nnbj = computed(() => nbj.value > 40 ? 1 : (nbj.value > 10 ? 2 : 3))

const c = computed(() => session.compta.compteurs)
const s = computed(() =>session.compta.solde)
const pc = computed(() => c.value.pourcents)
const npcn = computed(() => pc.value.pcn < 80 ? 1 : (pc.value.pcn <= 90 ? 2 : 3))
const npcv = computed(() => pc.value.pcv < 80 ? 1 : (pc.value.pcv <= 90 ? 2 : 3))
const npcc = computed(() => pc.value.pcc < 80 ? 1 : (pc.value.pcc <= 90 ? 2 : 3))
const nj = computed(() => c.value.nbj(session.compta.solde))
const nnj = computed(() => nj.value > 40 ? 1 : (nj.value > 10 ? 2 : 3))
const lurg = computed(() => {
  const p = session.partition
  if (!p) return [{ del: true, id: ID.duComptable() }]
  const l = []
  for (const id in p.mcpt) {
    const e = p.mcpt[id]
    if (id !== session.compteId && e.del)
      l.push({ del: e.del, id: id })
  }
  return l
})
    
async function rafCvs () {
  let nc = 0, nv = 0
  for (const id of session.compte.mav) {
    const r = await new RafraichirCvsAv().run(id)
    if (typeof r ==='number') {
      await afficher8000(r, id, 0)
      continue
    }
    const [x, y] = r
    nc += x; nv += y
  }
  stores.ui.afficherMessage($t('CVraf2', [nc, nv]), false)
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.rld
  position: absolute
  top: -24px
  left: 0
</style>
