<template>
  <div v-if="p">
    <div class="row q-mt-xs q-mb-lg">
      <btn-cond class="col-auto q-mr-sm self-start" icon="refresh" @ok="reload()"/>
      <q-expansion-item v-if="session.estDelegue || session.estComptable"
        class="col" header-class="tbp" 
        switch-toggle-side expand-separator dense>
        <template v-slot:header>
          <div class="full-width titre-md text-bold">{{$t('TUpart', [session.codePart(p.id)])}}</div>
        </template>
        <div>
          <quotas-vols class="q-my-sm" :vols="session.partition.q"/>
          <div class="row items-end">
            <div class="col-4 trc">{{$t('PEnbde')}}</div>
            <div class="col-1 trc text-center">{{$t('PEnbdec')}}</div>
            <div class="col-1 trc text-center">{{$t('PEnbded')}}</div>
            <synth-hdrs class="col-6" v-model="igp"/>
          </div>
          <synth-ligne :igp="igp" :idx="0" :lg="lg"/>

          <apercu-notif class="q-my-sm" :editable="session.estComptable || session.estDelegue"
            :notif="ntfp" :type="1" :cible="p.id"/>
        </div>
      </q-expansion-item>
      <div v-else class="col p-px-xs fs-md tbp q-my-xs">{{$t('TUpart', [session.codePart(p.id)])}}</div>
    </div>

    <q-toolbar class="tbs">
      <q-toolbar-title class="titre-md q-ma-xs">{{$t('PTtit' + (session.pow === 4 ? '1' : '2'))}}</q-toolbar-title>          
      <btn-cond v-if="session.estDelegue || session.estComptable" cond="cEdit"
        :label="$t('PTnvc')" @ok="ui.oD('NSnvsp', idc)"/>
    </q-toolbar>

    <div v-for="(c, idx) in ptLcFT" :key="c.id" class="spmd q-my-xs">
      <q-expansion-item dense switch-toggle-side group="g1" :class="dkli(idx)" 
        @click="selCpt(c)">
        <template v-slot:header>
          <div class="row full-width items-center justify-between">
            <div class="row items-center">
              <!--img class="photomax" :src="c.cv.photo" /-->
              <div class="titre-md q-ml-sm">{{c.cv.nomC}}
                <span v-if="session.compteId === c.id" class="q-ml-sm">[{{$t('moi')}}]</span>
                <span v-if="c.del" class="q-ml-sm">[{{$t('delegue')}}]</span>
              </div>
              <q-icon size="md" v-if="c.notif" :name="ico(c)"
                :class="'q-ml-md ' + tclr(c) + ' ' + bgclr(c)"/>
            </div>
            
            <!--btn-cond v-if="session.compteId !== c.id" class="q-ml-md" icon="open_in_new"
              stop @ok="voirpage(c)"/-->
          </div>
        </template>

        <div class="q-ml-lg">
          <apercu-genx v-if="(session.compteId !== c.id)" :id="c.id" :idx="idx" :del="c.del"/>

          <barre-people :id="c.id" />

          <apercu-notif class="q-my-xs" 
            :editable="session.estComptable || !ID.estComptable(c)"
            :notif="c.notif" :type="2" :idx="idx" :cible="c.id"/>

          <div v-if="session.estComptable || !ID.estComptable(c)" class="q-my-sm row">
            <quotas-vols class="col" :vols="c.q" />
            <btn-cond class="col-auto q-ml-sm self-start"
              cond="cUrgence" icon="settings" round @ok="editerq(c)"/>
          </div>
          
        </div>
      </q-expansion-item>
    </div>

    <!-- Dialogue de création d'un nouveau sponsoring -->
    <q-dialog v-if="ui.d[idc] && ui.d[idc].NSnvsp" v-model="ui.d[idc].NSnvsp" position="left" persistent>
      <nouveau-sponsoring/>
    </q-dialog>
    
    <!-- Dialogue de mise à jour des quotas du compte -->
    <dial-std1 v-if="m1" v-model="m1" :titre="$t('PTqu')"
      warning :disable="quotas.err || !quotas.chg" cond="cEdit" :okfn="validerq">
      <choix-quotas class="q-pa-sm" v-model="quotas"/>
    </dial-std1>
    
  </div>
  <div v-else class="titre-lg text-italic full-width text-center">{{$t('TUnopart')}}</div>

</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { dkli } from '../app/util.mjs'
import { ID } from '../app/api.mjs'
import BtnCond from '../components/BtnCond.vue'
import SynthHdrs from '../components/SynthHdrs.vue'
import SynthLigne from '../components/SynthLigne.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import QuotasVols from '../components/QuotasVols.vue'
import NouveauSponsoring from '../panels/NouveauSponsoring.vue'
import BarrePeople from '../components/BarrePeople.vue'
import DialStd1 from '../dialogues/DialStd1.vue'
import { GetNotifC, GetPartition, SetQuotas, GetCompta } from '../app/operations4.mjs'
import { styp } from '../app/util.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const m1 = computed(() => ui.d[idc].PTedq)

const ic = ['check', 'report', 'alarm_on', 'lock']
const txt = ['green-3', 'green-5', 'warning', 'negative']
const bg = ['none', 'none', 'yellow-1', 'yellow-5']

const session = stores.session
const aSt = stores.avatar
const pSt = stores.people
const cfg = stores.config
const fSt = stores.filtre

async function reload () {
  if (session.accesNet && !session.estA) 
    await new GetPartition().run(session.partition.id)
}

onMounted(async () => {
  await reload()
})

const quotas = ref({})

const igp = ref(0)

const p = computed(() => session.partition)
const ntfp = computed(() => session.notifPX(p.value.id))
const lg = computed(() => session.partition ? session.partition.synth : {})

const ptLc = computed(() => {
  const p = session.partition
  const t = []
  if (p) for (const id in p.mcpt) {
    const e = p.mcpt[id]
    const cv = session.getCV(e.id)
    t.push( { ...e, cv} )
  }
  return t
})

const ptLcF = computed(() => {
  const f = fSt.filtre.partition
  if (!f) return ptLc.value
  const r = []
  for (const c of ptLc.value) {
    if (f.avecsp && !c.del) continue
    if (f.nomc && !c.cv.nom.startsWith(f.nomc)) continue
    /* 
    - `mcpt` : map (object) des comptes attachés à la partition. 
      - _clé_: id du compte.
      - _valeur_: `{ id, nr, del, q }`
        - `nr`: niveau de restriction de la notification de niveau _compte_ (0 s'il n'y en a pas, 1 (sans restriction), 2 ou 3).
        - `notif`: notification du compte cryptée par la clé P de la partition (redonde celle dans compte).            - `del`: `true` si c'est un délégué.
        - `q` : `qc qn qv c2m nn nc ng v` extraits du document `comptas` du compte.
          - `c2m` est le compteur `conso2M` de compteurs, montant moyen _mensualisé_ de consommation de calcul observé sur M/M-1 (observé à `dhic`). 

        Ajout à q :
        - pcc : pourcentage d'utilisation de la consommation journalière c2m / qc
        - pcn : pourcentage d'utilisation effective de qn : nn + nc ng / qn
        - pcv : pourcentage d'utilisation effective de qc : v / qv
    */
    if (f.notif && c.nr === 0) continue
    if (f.notif && c.nr < f.notif) continue
    r.push(c)
  }
  return r
})

const ptLcFT = computed(() => {
  const lcF = ptLcF.value
  const f = fSt.tri.partition

  /*
  TRIpartition1: 'Quota nb notes, chats ↑',
  TRIpartition2: 'Quota nb notes, chats ↓',
  TRIpartition3: 'Quota fichiers des notes ↑',
  TRIpartition4: 'Quota fichiers des notes ↓',
  TRIpartition5: '% util. quota nb notes... ↑',
  TRIpartition6: '% util. quota nb notes... ↓',
  TRIpartition7: '% util. quota fichiers ↑',
  TRIpartition8: '% util. quota fichiers ↓'
  */
  function vf (x) {
    if (f === 0) return 0
    return f === 1 || f === 2 ? x.q.qn 
      : (f === 3 || f === 4 ? x.q.qv 
      : (f === 5 || f === 6 ? x.pcn : x.pcv))
  }

  const ctm = (f % 2) === 1 ? 1 : -1
  function comp (x, y) {
    const nx = x.cv.nom
    const n1 = (x.del ? '1' : '2') + (nx.startsWith('#') ? '2' : '1') + nx
    const ny = y.cv.nom
    const n2 = (y.del ? '1' : '2') + (ny.startsWith('#') ? '2' : '1') + ny
     const a = vf(x)
    const b = vf(y)
    return a > b ? ctm : (a < b ? -ctm : (n1 < n2 ? -1 : (n1 > n2 ? 1 : 0))) 
  }
  const r = [...lcF]
  r.sort(comp)
  return r
})

watch(ptLcFT, (ap) => {ui.fmsg(ap.length)})

const ico = (c) => ic[c.notif.nr || 0]
const tclr = (c) => 'text-' + txt[c.notif.nr || 0]
const bgclr = (c) => 'bg-' + bg[c.notif.nr || 0]

async function selCpt (c) {
  session.setPeopleId(c.id)
}

/*
function voirpage (c) { 
  session.setPeopleId(c.id)
  ui.oD('detailspeople', 'a')
}
*/

async function editerq (c) {
  quotas.value = await session.getQuotasP(c.q)
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
.trc
  font-weight: bold
  font-style: italic
  text-decoration: underline
  cursor: pointer
  color: var(--q-primary)
</style>
