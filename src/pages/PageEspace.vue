<template>
  <q-page v-if="session.synthese" class="column q-pa-xs">
    <div class="q-mb-sm">
      <div class="titre-md">{{$t('PEstm')}}</div>
      <div class="row q-gutter-sm q-mb-sm">
        <btn-cond class="self-start b1" label="M" @ok="dlstat(0)"/>
        <btn-cond class="self-start b1" label="M-1" @ok="dlstat(1)"/>
        <btn-cond class="self-start b1" label="M-2" @ok="dlstat(2)"/>
        <btn-cond class="self-start b1" label="M-3" @ok="dlstat(3)"/>
        <saisie-mois v-model="mois" :dmax="maxdl" :dmin="mindl" :dinit="maxdl"
          @ok="dlstat2" icon="download" :label="$t('ESdlc')"/>
      </div>
    </div>
    
    <div class="q-mb-sm row justify-start" style="height:1.8rem;overflow:hidden">
      <div class="titre-md q-mx-sm">{{$t('ESnbmi')}}</div>
      <q-select class="col-auto items-start items-start text-bold bg-primary text-white titre-lg q-pl-sm" 
        standout style="position:relative;top:-8px;"
        :disable="session.pow !== 2"
        v-model.number="nbmi" :options="optionsNbmi" dense />
    </div>

    <div class="q-mb-sm">
      <q-toggle v-model="optionA" :label="$t('PTopt')" />
    </div>

    <div class="text-center q-mb-sm">
      <btn-cond cond="cUrgence" icon="add" :label="$t('PTnv')" @ok="ovnvPart"/>
    </div>

    <q-separator color="orange" class="q-my-sm"/>

    <div class="q-my-sm">
      <div class="row">
        <span class="titre-md q-mr-md">{{$t('ESquotas')}}</span>
      </div>
      <quotas-vols class="q-ml-md" noutil :vols="session.espace.quotas"/>
    </div>

    <div class="q-my-sm">
      <div class="row">
        <span class="titre-md q-mr-md">{{$t('PIqa')}}</span>
        <btn-cond round icon="edit"  @ok="editerqA()"/>
      </div>
      <quotas-vols class="q-ml-md" noutil :vols="session.synthese.qA"/>
    </div>

    <div class="q-my-sm">
      <div class="row">
        <span class="titre-md">{{$t('PIqo')}}</span>
      </div>
      <quotas-vols class="q-ml-md" noutil :vols="session.synthese.tsp['0'].q"/>
    </div>

    <div v-if="synth.length">
    <div class="q-mx-xs" 
      v-for="(lg, idx) in synth" :key="lg.id">
      <q-expansion-item v-if="idx === 0 || session.pow === 2"
        switch-toggle-side expand-separator dense group="trgroup">
        <template v-slot:header>
          <div :class="dkli(idx) + ' row full-width'">
            <div class="col-3 fs-md">
              <span v-if="lg.id === '0'">{{$t('total')}}</span>
              <span v-else>{{session.codePart(lg.id)}}</span>
            </div>
            <div class="col-3">
              {{$t('PEnbc', lg.nbc, { count: lg.nbc })}}, {{$t('PEnbd', lg.nbd, { count: lg.nbd })}}
            </div>
            <div class="col-1 font-mono fs-sm text-center">{{lg.q.qc}}<br/>{{lg.pcac}}%</div>
            <div class="col-1 font-mono fs-sm text-center">{{lg.q.qn}}<br/> {{lg.pcan}}%</div>
            <div class="col-1 font-mono fs-sm text-center">{{lg.q.qv}}<br/> {{lg.pcav}}%</div>
            <div class="col-2 text-right">
              <q-icon v-if="lg.ntf[0] + lg.ntfp[0] !== 0" name="info" color="primary" size="xs" />
              <q-icon v-else name="check" color="grey-5" size="xs" />
              <q-icon v-if="lg.ntf[1] + lg.ntfp[1] !== 0" class="bg-yellow-3" name="warning_amber" color="warning" size="xs" />
              <q-icon v-else name="check" color="grey-5" size="xs" />
              <q-icon v-if="lg.ntf[2] + lg.ntfp[2]" class="bg-yellow-5" name="lock" color="negative" size="xs" />
              <q-icon v-else name="check" color="grey-5" size="xs" />
            </div>
            <div class="col-1 text-right">
              <btn-cond v-if="lg.id !== '0'" round icon="open_in_new" stop @ok="pagePartition(lg)"/>
            </div>
          </div>
        </template>
        <div :class="dkli(idx) + 'q-ml-xl q-mb-lg'">
          <div class="row q-gutter-sm justify-center">
            <tuile-cnv type="qc" :src="lg"/>
            <tuile-cnv type="qn" :src="lg"/>
            <tuile-cnv type="qv" :src="lg"/>
            <tuile-notif :src="lg" :total="idx === 0"/>
          </div>
          
          <div v-if="idx !== 0" class="q-my-xs">
            <apercu-notif class="q-ma-sm" :editable="session.pow > 1 && session.pow < 4" 
              :notif="session.mnotifP.get(lg.id)" 
              :type="1" :cible="lg.id" :idx="1"/>
          </div>
          
          <div v-if="session.pow === 2 && idx !== 0" class="row q-mt-xs q-gutter-xs justify-center">
            <btn-cond icon="edit" cond="cUrgence" :label="$t('PEedn')" @ok="editer(lg)"/>
            <btn-cond cond="cUrgence" icon="settings" :label="$t('PEabo')" @ok="editerqP(lg)"/>
            <btn-cond :disable="lg.nbc > 0" cond="cUrgence" icon="close" color="warning"
              :label="$t('supprimer')" @ok="supprimer(lg)"/>
          </div>
        </div>
      </q-expansion-item>
    </div>
    </div>

    <!-- Edition du code d'une partition -->
    <q-dialog v-model="ui.d[idc].PEedcom" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTinfo')}}</q-toolbar-title>
        </q-toolbar>
        <div class="q-ma-sm">
          <q-input v-model="code" clearable :placeholder="$t('PTinfoph')">
            <template v-slot:append>
              <btn-cond icon="check" :label="$t('ok')" @ok="valider" color="warning"/>
            </template>
            <template v-slot:hint>{{$t('PTinfoh')}}</template>
          </q-input>
        </div>
      </q-card>
    </q-dialog>

    <!-- Dialogue de mise à jour des quotas des comptes A -->
    <q-dialog v-model="ui.d[idc].PEedqA" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTquta')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" v-model="quotasA" />
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond :disable="quotasA.err || !quotasA.chg" icon="check" cond="cUrgence"
            :label="$t('ok')" @ok="validerqA"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de mise à jour des quotas de la partition -->
    <q-dialog v-model="ui.d[idc].PEedqP" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTqutp', [session.codePart(ligne.id)])}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" v-model="quotasP" />
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond :disable="quotasP.err || !quotasP.chg" icon="check" cond="cUrgence"
            :label="$t('ok')" @ok="validerqP"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de création d'une nouvelle partition -->
    <q-dialog v-model="ui.d[idc].PEnt" persistent>
      <q-card :class="styp('sm')">
        <div class="titre-lg q-my-sm">{{$t('PTnv')}}</div>
        <div class="q-pa-sm">
          <q-input v-model="nom" clearable :placeholder="$t('PTinfoph')">
            <template v-slot:hint>{{$t('PTinfoh')}}</template>
          </q-input>
        </div>
        <choix-quotas v-model="quotasP" />
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="add" :disable="!nom || quotasP.err" 
            :label="$t('valider')" @ok="creer"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

import { saveAs } from 'file-saver'
import stores from '../stores/stores.mjs'
import BtnCond from '../components/BtnCond.vue'
import SaisieMois from '../components/SaisieMois.vue'
import TuileCnv from '../components/TuileCnv.vue'
import TuileNotif from '../components/TuileNotif.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import QuotasVols from '../components/QuotasVols.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import { dkli, styp, $t, afficherDiag } from '../app/util.mjs'
import { ID, AMJ } from '../app/api.mjs'
import { GetSynthese, GetPartition, SetEspaceOptionA, NouvellePartition, SetQuotasPart, SetQuotasA,
  SetCodePart, SupprPartition, DownloadStatC, DownloadStatC2 } from '../app/operations4.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

async function refreshSynth () {
  await new GetSynthese().run()
}

onMounted(async () => {
  await refreshSynth()
})

const fx = [['id', 1], 
  ['ntr2', 1], ['ntr2', -1],
  ['nco2', 1], ['nco2', -1],
  ['q1', 1], ['q1', -1],
  ['q2', 1], ['q2', -1],
  ['pca1', 1], ['pca1', -1],
  ['pca2', 1], ['pca2', -1],
  ['pcv1', 1], ['pcv1', -1],
  ['pcv2', 1], ['pcv2', -1],
  ['nbc', 1], ['nbc', -1]
]
const optionsNbmi = [3, 6, 12, 18, 24]

const aSt = stores.avatar
const fSt = stores.filtre
const session = stores.session

const mois = ref(Math.floor(session.auj / 100))
const nom = ref('')
const quotasP = ref(null)
const quotasA = ref(null)
const code = ref('')
const ligne = ref(null)
const nbmi = ref(session.espace ? session.espace.nbmi : 12)
const optionA = ref(session.espace ? (session.espace.opt ? true : false) : false)

const maxdl = computed(() => { 
  const m = AMJ.djMoisN(AMJ.amjUtc(), -1)
  return Math.floor(m / 100)
})
const mindl = computed(() => Math.floor(session.espace.dcreation / 100))
const synth = computed(() => {
  if (!session.synthese) return []
  const l = []
  const tsp = session.synthese.tsp
  for (const id in tsp) l.push(tsp[id])
  const fv = fSt.tri.espace
  const f = fv ? fv.value : 0
  const ct = { f: fx[f][0], m: fx[f][1] }
  l.sort((x, y) => {
    if (!x.id) return -1
    if (!y.id) return 1
    const a = x[ct.f]
    const b = y[ct.f]
    return a > b ? ct.m : (a < b ? -ct.m : 0) 
  })
  return l
})
const optesp = computed(() => session.espace ? (session.espace.opt ? true : false) : false)
const nbmiesp = computed(() => session.espace ? session.espace.nbmi : 12)

watch(optesp, (ap) => { optionA.value = ap })
watch(nbmiesp, (ap) => { nbmi.value = session.espace ? session.espace.nbmi : 12 })
watch(optionA, async (ap) => {
  if (session.espace && ((session.espace.opt ? true : false) !== ap))
    await new SetEspaceOptionA().run(ap ? 1 : 0, null)
  })
watch(nbmi, async (ap) => {
  if (session.espace && session.espace.nbmi !== ap) 
    new SetEspaceOptionA().run(null, ap)
  })

async function dlstat (mr) {
  const cleES = session.compte.cleE
  const { err, blob, creation, mois } = 
    await new DownloadStatC().run(session.espace.org, mr, cleES)
  const nf = session.espace.org + '-C_' + mois
  if (!err) {
    saveAs(blob, nf)
    await afficherDiag($t('PEsd', [nf]))
  } else {
    await afficherDiag($t('PEnd' + err))
  }
}

async function dlstat2 () {
  const cleES = session.compte.cleE
  const { err, blob } = await new DownloadStatC2()
    .run(session.espace.org, parseInt(mois.value), 'C', cleES)
  const nf = session.espace.org + '-C_' + mois.value
  if (!err) {
    saveAs(blob, nf)
    await afficherDiag($t('PEsd', [nf]))
  } else {
    await afficherDiag($t('PEnd' + err))
  }
}

async function ovnvPart () { 
  nom.value = ''
  quotasP.value = { 
    qc: 1, qn: 1, qv: 1, 
    minc: 0, minn: 0, minv: 0,
    maxc: 9999, maxn: 9999, maxv: 9999, 
    n: 0, v: 0,
    err: false
  }
  ui.oD('PEnt', idc)
}

async function creer () {
  await new NouvellePartition().run(nom.value || '', quotasP.value)
  await refreshSynth()
  ui.fD()
}

async function supprimer (lg) {
  await new SupprPartition().run(lg.id)
  await refreshSynth()
  ui.fD()
}

async function lgCourante (lg) {
  ligne.value = lg
  if (!session.partition || session.partition.id !== lg.id)
    await new GetPartition().run(lg.id)
}

async function pagePartition (lg) { // Comptable seulement
  await lgCourante(lg)
  ui.setPage('partition')
}

async function editer (lg) {
  await lgCourante(lg)
  code.value = session.compte.mcode.get(ligne.value.id)
  ui.oD('PEedcom', idc)
}

async function valider () {
  await new SetCodePart().run(ligne.value.id, code.value)
  ui.fD()
}

/*
  espace.quotas : quotas de l'espace fixés par l'AT
  synth.qa : quotas réservés aux comptes A
  synth.tsp['0'] : somme des quotas des partitions
  ligne.value.q: quotas actuellement attribués à la partition
*/
async function editerqP (lg) {
  await lgCourante(lg)
  const q = ligne.value.q // quotas actuels de la partition
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

async function editerqA () {
  const synth = session.synthese 
  const q = synth.qA // quotas actuels réservés aux comptes "A"
  const qpt = synth.tsp['0'].q
  const qe = session.espace.quotas
  const rqn = qe.qn - qpt.qn + q.qn
  const maxn = rqn < 0 ? q.qn : rqn
  const rqv = qe.qv - qpt.qv + q.qv
  const maxv = rqv < 0 ? q.qv : rqv
  const rqc = qe.qc - qpt.qc + q.qc
  const maxc = rqc < 0 ? q.qc : rqc
  quotasA.value = { 
    qc: q.qc, qn: q.qn, qv: q.qv,
    minc: 0, minn: 0, minv: 0,
    maxc, maxn, maxv,
    err: ''
  }
  ui.oD('PEedqA', idc)
}

async function validerqA () {
  await new SetQuotasA().run(quotasA.value)
  await refreshSynth()
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.w10
  width: 10rem
.b1
  width: 4rem
</style>
