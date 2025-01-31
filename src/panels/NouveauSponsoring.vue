<template>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="tbs">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">{{$t('NPtit')}}</q-toolbar-title>
      <bouton-help page="sponsoring_d"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
  <div class="spsm q-my-sm q-pa-sm">
    <q-stepper v-model="step" vertical color="primary" animated>
      <q-step v-if="!session.estA" :name="0" :title="$t('NPprof')" icon="settings" :done="step > 0">
        <div class="q-my-sm">
          <q-option-group :options="optionsOSA" type="radio" dense v-model="optOSA" />
        </div>
        <div>
          <q-checkbox class="titre-md text-bold" size="md" dense 
            left-label v-model="dconf" :label="$t('CHconfid')" />
        </div>
        <q-stepper-navigation>
          <btn-cond flat @ok="step = 1" icon="arrow_downward" :label="$t('suivant')"/>
        </q-stepper-navigation>
      </q-step>

      <q-step :name="1" :title="$t('NPpdon')" icon="settings" :done="step > 1">
        <div class="q-my-sm">
          <q-option-group :options="optionsDon" type="radio" dense v-model="optDon" />
        </div>
        <div v-if="diagDon" class="msg text-bold">{{diagDon}}</div>
        <q-stepper-navigation>
          <btn-cond flat @ok="step = 0" class="q-mr-md" 
            icon="arrow_upward" :label="$t('precedent')"/>
          <btn-cond flat @ok="setDon" :disable="diagDon !== ''" 
            icon="arrow_downward"  :label="$t('suivant')"/>
        </q-stepper-navigation>
      </q-step>

      <q-step :name="2" :title="$t('NPphr')" icon="settings" :done="step > 2">
        <span class="titre-sm q-py-sm">{{$t('NPnpc')}}</span>
        <div ref="step2">
          <phrase-contact @ok="crypterphrase" :orgext="session.org" 
            :init-val="pc && pc.phrase ? pc.phrase : ''"/>
        </div>
        <q-stepper-navigation>
          <btn-cond @ok="step = 1" flat icon="arrow_upward" :label="$t('precedent')"/>
        </q-stepper-navigation>
      </q-step>

      <q-step :name="3" :title="$t('NPavp')" icon="settings" :done="step > 3" >
        <div ref="step3">
          <nom-avatar class="q-ma-xs" @ok-nom="oknom" verif :init-val="nom || ''"
            icon-valider="check" :label-valider="$t('suivant')"></nom-avatar>
        </div>
        <q-stepper-navigation>
          <btn-cond flat @ok="step = 2" icon="arrow_upward" :label="$t('precedent')"/>
        </q-stepper-navigation>
      </q-step>

      <q-step :name="4" :title="$t('NPmot')" icon="settings" :done="step > 4" >
        <div ref="step4">
          <editeur-md :texte="mot1" v-model="mot" editable modetxt mh="10rem"/>
        </div>
        <div v-if="motko" class="fs-sm text-warning">{{$t('NP10s', [mot.length])}}</div>
        <q-stepper-navigation>
          <btn-cond flat @ok="step = 3" icon="arrow_upward" class="q-mr-md" :label="$t('precedent')"/>
          <btn-cond flat @ok="okmot" icon="arrow_downward" :label="$t('suivant')" 
            :disable="motko" class="q-ml-sm" />
        </q-stepper-navigation>
      </q-step>

      <q-step :name="5" :title="$t('NPquo1')" icon="settings" :done="step > 5" >
        <choix-quotas v-model="quotas"/>
        <q-stepper-navigation>
          <btn-cond flat @ok="step = 4" icon="arrow_upward" class="q-mr-md" :label="$t('precedent')" />
          <btn-cond flat @ok="step = 6" icon="arrow_downward" :disable="quotas.err !== ''"
            :label="$t('suivant')" class="q-ml-sm" />
        </q-stepper-navigation>
      </q-step>

      <q-step :name="6" :title="$t('NPconf')" icon="check" :done="step > 6">
        <div class="column q-gutter-sm">
          <div class="titre-md">{{$t('NPphr')}} : <span class="font-mono q-pl-md">{{pc.phrase}}</span></div>
          <div class="titre-md">{{$t('NPnav')}} : <span class="font-mono q-pl-md">{{nom}}</span></div>
          <div class="titre-md">{{$t('NPmotc')}} : <span class="font-mono q-pl-md">{{mot}}</span></div>
          <div v-if="estAutonome" class=" titre-md">{{$t('compteA')}}</div>
          <div v-else class="titre-md">{{$t(estDelegue ? 'compteD' : 'compteO', [partition.id])}}</div>
          <quotas-vols class="q-ml-md" :vols="quotas"/>
          <div v-if="dconf" class="titre-md">{{$t('conf')}}</div>
          <div v-if="don" class="titre-md">{{$t('NPdon2', [don])}}</div>
        </div>
        <q-stepper-navigation>
          <btn-cond flat @ok="step = 5" icon="arrow_upward" class="q-mr-md" :label="$t('corriger')"/>
          <btn-cond @ok="confirmer" color="warning" icon="check" :label="$t('confirmer')" 
            cond="cEdit"/>
        </q-stepper-navigation>
      </q-step>

    </q-stepper>
  </div>
  </q-page-container>
</q-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

import NomAvatar from '../components/NomAvatar.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import EditeurMd from '../components/EditeurMd.vue'
import { styp, edvol, afficherDiag, dkli, $t } from '../app/util.mjs'
import { ID, UNITEN, UNITEV } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import PhraseContact from '../components/PhraseContact.vue'
import QuotasVols from '../components/QuotasVols.vue'
import { GetSynthese, GetCompta, AjoutSponsoring, ExistePhrase } from '../app/operations4.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const cfg = stores.config
const session = stores.session
const partition = session.partition

const solde = ref(0)

onMounted (async () => {
  await new GetSynthese().run()
  await session.reloadCompta()
  solde.value = session.compta.compteurs.soldeCourant
})

const optionsOSA = session.estDelegue || session.estComptable ? [
  { label: $t('compteO', [partition ? session.codePart(partition.id) : '']), value: 0 },
  { label: $t('compteD', [partition ? session.codePart(partition.id) : '']), value: 1 }
] : []
if (session.espace.opt) optionsOSA.push({ label: $t('compteA'), value: 2 })

const isPwd = ref(false)
const max = ref([])
const nom = ref('')
const npi = ref(false)
const pc = ref(null)
const mot = ref('')
const mot1 = ref('')
const don = ref(0)
const dconf = ref(false)
const quotas = ref(null)
const step4 = ref(null)
const step2 = ref(null)
const step3 = ref(null)
const step = ref(0)
const optOSA = ref(optionsOSA[0].value)

const optionsDon = ref([ { label: $t('pasdon'), value: 0}])
for (const d of cfg.dons) optionsDon.value.push({ label: $t('don', [d]), value: d})
const optDon = ref(optionsDon.value[0].value)

const estDelegue = computed(() => optOSA.value === 1)
const estAutonome = computed(() => optOSA.value === 2)
const motko = computed(() => mot.value.length < 10 || mot.value.length > 140)

const ed1 = (f) => edvol(f * UNITEN)
const ed2 = (f) => edvol(f * UNITEV)

watch(step, async (ap) => {
  if (ap === 2) {
    setTimeout(() => {
      const elt = step2.value.querySelector('input')
      elt.focus()
    }, 50)
    return
  }
  if (ap === 3) {
    setTimeout(() => {
      const elt = step3.value.querySelector('input')
      if (elt) elt.focus()
    }, 500)
    return
  }
  if (ap === 4) {
    setTimeout(() => {
      const s = step4.value
      const elt = s ? s.querySelector('textarea') : null
      if (elt) elt.focus()
    }, 500)
    return
  }
  if (ap === 5) {
    setQuotas()
    return
  }
})

async function crypterphrase (p) {
  if (await new ExistePhrase().run(p.hps1, 2)) {
    await afficherDiag($t('existe'))
    return
  }
  pc.value = p
  step.value = 3
}

const diagDon = computed(() => optDon.value && (solde.value - optDon.value <= 2) ?
  $t('NPcred', [solde.value, optDon.value]) : '' )

async function setDon () {
  don.value = optDon.value
  step.value = 2
}

function oknom (n) {
  if (n) {
    nom.value = n
    if (!mot.value) mot.value = $t('NPbj', [n])
    mot1.value = mot.value
    step.value = 4
  }
}

function okmot () {
  if (mot.value.length > 0) {
    mot.value = mot.value.substring(0, 140)
    step.value = 5
  }
}

async function setQuotas () {
  const qm = cfg.quotasMaxC
  let maxn, maxv, maxc
  if (estAutonome.value) {
    const synth = session.synthese
    const qA = synth.qA
    const qtA = synth.qtA
    maxn = qA.qn - qtA.qn
    maxv = qA.qv - qtA.qv
    maxc = qm[2]
  } else {
    const s = partition.synth
    maxn = s.q.qn - s.qt.qn
    maxv = s.q.qv - s.qt.qv
    maxc = s.q.qc - s.qt.qc
  }
  if (maxn > qm[0]) maxn = qm[0]
  if (maxv > qm[1]) maxv = qm[1]
  if (maxc > qm[2]) maxc = qm[2]
  quotas.value = { qn: 0, qv: 0, qc: 0, minn: 0, minv: 0, minc: 0, maxn, maxv, maxc, err: null }
}

async function confirmer () {
  const q = { qc : quotas.value.qc, qn: quotas.value.qn, qv: quotas.value.qv }
  try {
    const args = {
      pc: pc.value,
      nom: nom.value,
      estAutonome: estAutonome.value,
      del: estDelegue.value,
      quotas : q,
      mot: mot.value,
      don: don.value, 
      dconf: dconf.value
    }
    if (!estAutonome.value) args.partitionId = partition.id
    await new AjoutSponsoring().run(args)
    ui.fD()
  } catch {}
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
@import '../css/input.sass'
.ta
  margin: 0
  border-top: 1px solid $grey-5
  border-bottom: 1px solid $grey-5
  overflow-y: auto
.q-dialog__inner
  padding: 0 !important
.bordt
  border-top: 1px solid $grey-5
</style>
