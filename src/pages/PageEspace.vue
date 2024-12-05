<template>
  <q-page v-if="session.synthese" class="q-pa-xs">
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
    <q-separator color="orange" class="q-mt-sm"/>
    <div v-if="session.synthese" style="position:relative;top:-20px">
      <filtre-nom class="w10" style="position:relative;top:30px" nom="espace" prop='code' :idx="0"/>
      <div class="row items-end">
        <div class="col-4 trc" @click="clc('code')">{{$t('PEnbde')}}</div>
        <div class="col-1 trc text-center" @click="clc('nbc')">{{$t('PEnbdec')}}</div>
        <div class="col-1 trc text-center" @click="clc('nbd')">{{$t('PEnbded')}}</div>
        <synth-hdrs class="col-6" v-model="igp" :clc="clc"/>
      </div>
      <synth-ligne :igp="igp" :idx="1" :lg="session.synthese.tsp[0]"/>
      <synth-ligne v-for="(lg, idx) in synth" :key="lg.id" :igp="igp" :idx="idx" :lg="lg"/>
    </div>

    <!-- Dialogue de mise à jour des quotas des comptes A -->
    <q-dialog v-model="ui.d[idc].PEedqA" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTquta')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas class="q-mt-sm" v-model="quotasA"/>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond :disable="quotasA.err || !quotasA.chg" icon="check" cond="cUrgence"
            :label="$t('ok')" @ok="validerqA"/>
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
          <btn-cond color="warning" icon="add" :disable="!nom || quotasP.err !== ''" 
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
import ChoixQuotas from '../components/ChoixQuotas.vue'
import QuotasVols from '../components/QuotasVols.vue'
import SynthHdrs from '../components/SynthHdrs.vue'
import SynthLigne from '../components/SynthLigne.vue'
import FiltreNom from '../components/FiltreNom.vue'
import { dkli, styp, $t, afficherDiag } from '../app/util.mjs'
import { ID, AMJ, UNITEN, UNITEV } from '../app/api.mjs'
import { Synthese } from '../app/modele.mjs'
import { GetSynthese, GetPartition, SetEspaceOptionA, NouvellePartition, SetQuotasA,
  DownloadStatC, DownloadStatC2 } from '../app/operations4.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

async function refreshSynth () {
  await new GetSynthese().run()
}

onMounted(async () => {
  await refreshSynth()
})

const optionsNbmi = [3, 6, 12, 18, 24]

const aSt = stores.avatar
const fSt = stores.filtre
const session = stores.session
const cfg = stores.config

const igp = ref(0)
const mois = ref(Math.floor(session.auj / 100))
const nom = ref('')
const quotasP = ref(null)
const quotasA = ref(null)
const nbmi = ref(session.espace ? session.espace.nbmi : 12)
const optionA = ref(session.espace ? (session.espace.opt ? true : false) : false)
const crTri = ref('code')
const asc = ref(true)

const clc = (n) => {
  if (n === crTri.value) asc.value = !asc.value
  else crTri.value = n
}

const maxdl = computed(() => { 
  const m = AMJ.djMoisN(AMJ.amjUtc(), -1)
  return Math.floor(m / 100)
})

const mindl = computed(() => Math.floor(session.espace.dcreation / 100))

const synth = computed(() => {
  if (!session.synthese) return []
  const f = fSt.filtre.espace
  const l = []
  const n = crTri.value
  const cd = asc.value ? 1 : -1
  const tsp = session.synthese.tsp
  for (const id in tsp) {
    if (id !== '0') {
      const lg = tsp[id]
      if (f.code) {
        const c = Synthese.pval(lg, 'code', session.compte)
        if (c.indexOf(f.code) === -1) continue
      }
      lg.x = Synthese.pval(lg, n, session.compte)
      l.push(lg)
    }
  }
  l.sort((x, y) => {
    return x.x > y.x ? cd : (x.x < y.x ? -cd : 0) 
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
  const qm = cfg.quotasMaxP
  const synth = session.synthese
  const q = synth.qA // quotas actuels réservés aux comptes "A"
  const qpt = synth.tsp['0'].q
  const qe = session.espace.quotas
  const rqn = qe.qn - qpt.qn
  let maxn = rqn < 0 ? 0 : rqn
  if (maxn > qm[0]) maxn = qm[0]
  const rqv = qe.qv - qpt.qv
  let maxv = rqv < 0 ? 0 : rqv
  if (maxv > qm[1]) maxv = qm[1]
  const rqc = qe.qc - qpt.qc
  let maxc = rqc < 0 ? 0 : rqc
  if (maxc > qm[2]) maxC = qm[2]
  quotasP.value = { 
    qc: 0, qn: 0, qv: 0,
    minc: 0, minn: 0, minv: 0,
    maxc, maxn, maxv,
    n: 0, v: 0,
    err: ''
  }
  ui.oD('PEnt', idc)
}

async function creer () {
  await new NouvellePartition().run(nom.value || '', quotasP.value)
  await refreshSynth()
  ui.fD()
}

async function editerqA () {
  const synth = session.synthese
  const qm = cfg.quotasMaxA
  const q = synth.qA // quotas actuels réservés aux comptes "A"
  const qpt = synth.tsp['0'].q
  const qe = session.espace.quotas
  const rqn = qe.qn - qpt.qn + q.qn
  let maxn = rqn < 0 ? q.qn : rqn
  if (maxn > qm[0]) maxn = qm[0]
  const rqv = qe.qv - qpt.qv + q.qv
  let maxv = rqv < 0 ? q.qv : rqv
  if (maxv > qm[1]) maxv = qm[1]
  quotasA.value = { 
    qc: 0, qn: q.qn, qv: q.qv,
    minc: 0, minn: 0, minv: 0,
    maxc: qm[2], maxn, maxv,
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
.trc
  font-weight: bold
  font-style: italic
  text-decoration: underline
  cursor: pointer
  color: $primary
.w10
  max-width: 10rem
</style>
