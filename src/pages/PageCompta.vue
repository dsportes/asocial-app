<template>
<q-page class="column">
  <div class="row justify-center items-center q-mt-sm q-mb-md">
    <div class="titre-lg text-italic q-mr-xl">
      <span v-if="ui.pagetab !== 'chats'">{{$t('PCPtab' + ui.pagetab)}}</span>
      <span v-else>{{$t('CPTtitch' + (session.estA ? 'A' : 'O'))}}</span>
    </div>
    <bouton-help :page="'compta_' + ui.pagetab"/>
  </div>

  <panel-compta v-if="ui.pagetab==='compta' && session.compta" :c="session.compta.compteurs"/>

  <panel-credits v-if="ui.pagetab==='credits'"/>

  <panel-alertes v-if="ui.pagetab==='alertes' && session.compta"/>

  <div v-if="ui.pagetab==='chats'" class="spmd q-pa-sm">

    <btn-cond class="q-my-sm" cond="cUrgence"
      :label="$t('CVraf')" @ok="rafCvs"/>

    <q-card v-for="(e, idx) in lurg" :key="e.id">
      <div :class="'q-my-sm q-px-sm ' + dkli(idx)">
        <apercu-genx :id="e.id" :del="e.del" :idx="idx" urgence/>
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
import PanelAlertes from '../components/PanelAlertes.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import { $t, dkli, afficher8000 } from '../app/util.mjs'
import { ID, UNITEN, UNITEV, AMJ } from '../app/api.mjs'
import { RafraichirCvsAv, GetPartition } from '../app/operations4.mjs'

const al = 'titre-md text-italic bg-yellow-3 text-negative text-bold q-mb-xs q-ml-xl'

const session = stores.session
const pSt = stores.people
const ui = stores.ui

if (session.accesNet) onMounted( async () => { 
  await session.reloadCompta() 
  if (!session.estA) await new GetPartition().run(session.partition.id)
})

/*
const nbj = computed(() => session.nbj)
const nnbj = computed(() => nbj.value > 40 ? 1 : (nbj.value > 10 ? 2 : 3))

const s = computed(() =>session.compta.solde)
const pc = computed(() => c.value.pourcents)
const npcn = computed(() => pc.value.pcn < 80 ? 1 : (pc.value.pcn <= 90 ? 2 : 3))
const npcv = computed(() => pc.value.pcv < 80 ? 1 : (pc.value.pcv <= 90 ? 2 : 3))
const npcc = computed(() => pc.value.pcc < 80 ? 1 : (pc.value.pcc <= 90 ? 2 : 3))
const nj = computed(() => c.value.nbj(session.compta.solde))
const nnj = computed(() => nj.value > 40 ? 1 : (nj.value > 10 ? 2 : 3))
*/
const lurg = computed(() => {
  const p = session.partition
  const l = []
  if (!session.estComptable) l.push({ del: true, id: ID.duComptable() })
  if (!p) return l
  for (const id in p.mcpt) {
    const e = p.mcpt[id]
    if (!ID.estComptable(id) && pSt.estPeople(id) && id !== session.compteId && e.del)
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
.bh
  position: absolute
  top: 0
  right: -24px
</style>
