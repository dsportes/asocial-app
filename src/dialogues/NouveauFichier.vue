<template>
<q-layout container view="hHh lpR fFf" :class="styp('md')" style="height:70vh">
  <q-header elevated class="tbs">
    <q-toolbar>
      <btn-cond color="warning" icon="close" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{nom ? $t('PNFnv') : $t('PNFnvr', [nom])}}
      </q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs">
      <q-stepper v-model="step" vertical color="primary" animated>
        <q-step :name="1" :title="$t('PNFnv1')" icon="attach_file" :done="step > 1">
          <div class="column items-center">
            <btn-cond color="warning" :label="$t('PNFnv2')" @ok="selFic"/>
            <div class="q-my-sm msg">{{$t('PNFnv2b')}}</div>
            <q-file class="full-width q-ma-xs" rounded outlined v-model="fileList" :label="$t('PNFnv3')"
              max-file-size="50000000" max-file="1"/>
            <div v-if="fic.lg" class="font-mono fs-sm">{{fic.nom}} - {{fic.type}} - {{fic.lg}}o</div>
          </div>
          <q-stepper-navigation class="row q-gutter-md justify-end">
            <btn-cond flat @ok="ui.fD" color="warning" :label="$t('renoncer')" class="q-ml-sm" />
            <btn-cond flat @ok="step=2" :disable="!fic.lg" :label="$t('continuer')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="2" :title="$t('PNFnv4')" icon="mode_edit" :done="step > 2">
          <div class="q-my-sm font-mono fs-md">{{fic.type}} - {{fic.lg}}o</div>
          <nom-generique v-model="nfic" :label="$t('PNFnv7')" />
          <nom-generique v-model="info" :label="$t('PNFnv8')"/>
          <q-stepper-navigation class="row q-gutter-md justify-end">
            <btn-cond flat @ok="ui.fD" color="warning" :label="$t('renoncer')" class="q-ml-sm" />
            <btn-cond flat @ok="step=1" :label="$t('precedent')" class="q-ml-sm" />
            <btn-cond flat @ok="step=3" :disable="!nfic" :label="$t('continuer')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="3" :title="$t('PNFrevsuppr')" icon="check" :done="step > 3">
          <div v-if="lstfic.length" class="titre-md text-italic text-bold">
            {{$t('PNFnv13')}}</div>
          <div v-else class="titre-md text-italic text-bold">
            {{$t('PNFnv13b')}}</div>

          <div v-if="lstfic.length">
            <q-toggle v-model="revx" class="q-mt-md" :label="$t('PNFrevx')"/>
            <div class="lst q-mt-xs full-width">
              <div v-for="(f, idx) in lstfic" :key="f.idf">
                <div v-if="!revx || f.nom === nom" 
                  :class="'row cursor-pointer items-center ' + sty(idx)" @click="clickFic(f)">
                  <q-checkbox class="col-1" v-model="f.sel" dense disable/>
                  <div class="col-4">{{f.nom}}</div>
                  <div class="col-2">{{f.info}}</div>
                  <div class="col-2 font-mono text-center">{{edvol(f.lg)}}</div>
                  <div class="col-3 font-mono text-center">{{dhcool(f.dh)}}</div>
                </div>
              </div>
            </div>

            <div v-if="volsupp > fic.lg" class="q-mt-md texte-italic">
              {{$t('PNFnv14r', [edvol(volsupp - fic.lg), edvol(fic.lg), edvol(volsupp)])}}</div>
            <div v-if="volsupp <= fic.lg" class="q-mt-md texte-italic">
              {{$t('PNFnv14a', [edvol(fic.lg - volsupp), edvol(fic.lg), edvol(volsupp)])}}</div>
          </div>
          
          <div v-if="vcpt === 1" class="q-mt-md texte-italic">{{$t('PNOvcpt1')}}</div>
          <div v-if="vgr === 1" class="q-mt-md texte-italic">{{$t('PNOvgr1')}}</div>
          <div v-if="alRed" class="q-mt-md msg full-width">
            <div>{{$t('PNOred')}}</div>
            <div v-if="vcpt === 2" class="q-ml-md">{{$t('PNOvcpt2')}}</div>
            <div v-if="vgr === 2" class="q-ml-md">{{$t('PNOvgr2')}}</div>
            <div v-if="pasheb" class="q-ml-md">{{$t('PNOpasheb')}}</div>
          </div>

          <q-stepper-navigation class="row q-gutter-md justify-end">
            <btn-cond flat @ok="ui.fD" color="warning" :label="$t('renoncer')" class="q-ml-sm" />
            <btn-cond flat @ok="step=2" color="primary" :label="$t('precedent')" class="q-ml-sm" />
            <btn-cond :disable="!valide || alRed || ui.etf !== 0" icon="check" :label="$t('valider')" 
              color="warning" @ok="valider" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="4" :title="$t('PNFnv15')" icon="check" :done="step > 4">
          <div v-for="(item, idx) in etapes" :key="idx" class="row no-wrap items-start">
            <q-icon class="col-1" size="sm" :name="ui.etf > idx + 1 ? 'done' : 'arrow_right'"/>
            <div class="col-11">{{item}}</div>
          </div>
          <q-stepper-navigation>
            <btn-cond flat @ok="ui.fD" color="primary" label="Vu" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
    </q-page>
  </q-page-container>
</q-layout>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

import stores from '../stores/stores.mjs'
import { $t, edvol, dhcool, readFile, styp, sty, dkli, trapex, dhstring } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import { NouveauFichier } from '../app/operations4.mjs'
import NomGenerique from '../components/NomGenerique.vue'
import { isAppExc, ID } from '../app/api.mjs'

const ui = stores.ui
const nSt = stores.note
const aSt = stores.avatar 
const gSt = stores.groupe 
const session = stores.session
const ppSt = stores.pp 

const props = defineProps({ 
  note: Object,
  nom: String, // nom du fichier pour une nouvelle révision
  aut: String,  // pour un groupe, avatar "auteur"
  pasheb: Boolean
})

const fic = ref({ nom: '', info: '', lg: 0, type: '', u8: null })
const revx = ref(true)
const nfic = ref(props.nom || '')
const step = ref(1)
const etapes = ref([$t('PNFnvs0'), $t('PNFnvs1'), $t('PNFnvs2')])
const fileList = ref(null)
const idf = ref(null)
const sidf = ref(null)
const lstfic = ref([])
const volsupp = ref(0)
const info = ref('')

const estGr = computed(() =>  ID.estGroupe(props.note.id) )
const egr = computed(() =>  estGr.value ? gSt.egr(props.note.id) : null )
const groupe = computed(() =>  egr.value ? egr.value.groupe : null)

const valide = computed(() =>  fic.value.lg && nfic.value)
const ccFic = computed(() =>   [ppSt.modecc, ppSt.ccfic] )
const vx = computed(() =>  (fic.value.lg || 0) - volsupp.value)
// volume fichier du compte (si hébergeur pour un groupe)
const vcpt = computed(() =>  !groupe.value || (groupe.value && !groupe.value.cptEstHeb) ? 0 : session.compte.alVol(vx.value))
const vgr = computed(() =>  !groupe.value ? 0 : groupe.value.alVol(vx.value))
const alRed = computed(() =>  (volsupp.value || 0) < (fic.value.lg || 0)
  && (vcpt.value === 2 || vgr.value === 2 || props.pasheb))


watch(fileList, async (file) => {
  try {
    if (file) {
      const { size, name, type, u8 } = await readFile(file, true)
      const i = name.lastIndexOf('.')
      const n = i == -1 ? name : name.substring(0, i)
      fic.value.nom = props.nom || n
      fic.value.info = ''
      fic.value.lg = size
      fic.value.type = type
      fic.value.u8 = u8
    }
  } catch (e) { trapex (e, resetFic)}
})

watch(step, (s) => {
  if (s === 1) { fileList.value = null; resetFic(); return }
  if (s === 2) { 
    nfic.value = props.nom || fic.value.nom
    info.value = fic.value.info
  }
  if (s === 3) {
    revx.value = true
    sidf.value = new Set()
    volsupp.value = 0
    getLstfic()
    ui.setEtf(0)
  }
})

watch(ccFic, ([modecc, f], av) => {
  if (!modecc) { // fichier copié
    fic.value.nom = f.nom
    fic.value.info = f.info
    fic.value.lg = f.lg
    fic.value.type = f.type
    fic.value.u8 = f.u8
    step.value = 2
  }
})

async function valider () {
  step.value = 4
  ui.setEtf(0)
  const nf = await props.note.nouvFic(
    nfic.value, 
    info.value || '',
    fic.value.lg, 
    fic.value.type, 
    fic.value.u8
  )

  ui.etf = 1
  const ida = props.aut <= '1' ? null : props.aut
  const res = await new NouveauFichier()
    .run(props.note, ida, nf, Array.from(sidf.value))
  if (!isAppExc(res))
    ui.setFichiercree(nf.nom)
  else {
    step.value = 1
  }
}

function getLstfic () {
  lstfic.value = []
  for (const [idf, f] of props.note.mfa)
    lstfic.value.push({ sel: false, idf, nom: f.nom, info: f.info, lg: f.lg, dh: f.dh })
  lstfic.value.sort((a, b) => { return a.nom < b.nom ? -1 : (a.nom > b.nom ? 1 :
    (a.dh < b.dh ? 1 : (a.dh === b.dh ? 0 : -1)))})
}

function clickFic (f) {
  if (f.sel) { f.sel = false; sidf.value.delete(f.idf); volsupp.value -= f.lg }
  else { f.sel = true; sidf.value.add(f.idf); volsupp.value += f.lg }
}

function resetFic () { 
  fic.value.nom = ''; fic.value.info = ''; fic.value.lg = 0; fic.value.type = ''; fic.value.u8 = null
}

function selFic () {
  ppSt.modecc = true
  ppSt.tab = 'fichiers'
  ppSt.ccfic = null
  ui.oD('pressepapier', 'a')
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.lst
  height: 8rem
  overflow-y: scroll
  border: 1px solid $grey-5
  padding: 3px
  border-radius: 5px
.bordt
  border-top: 1px solid $grey-5
</style>
