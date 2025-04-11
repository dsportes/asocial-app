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
      <canvas ref="canvas" :width="imgsz" :height="imgsz" class="d-none"></canvas>
      <div v-if="fic.thn" class="row justify-center">
        <img class="q-my-sm bordimg" :width="imgsz" :height="imgsz" :src="fic.thn"/>
      </div>

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
            <btn-cond flat icon="undo" @ok="ui.fD" color="warning" :label="$t('renoncer')" class="q-ml-sm" />
            <btn-cond flat icon="arrow_downward" @ok="step=2" :disable="!fic.lg" :label="$t('continuer')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="2" :title="$t('PNFnv4')" icon="mode_edit" :done="step > 2">
          <div class="q-my-sm font-mono fs-md">{{fic.type}} - {{fic.lg}}o</div>
          <nom-generique v-model="nfic" :label="$t('PNFnv7')" :lgmax="50"/>
          <nom-generique v-model="info" :label="$t('PNFnv8')" :lgmax="50"/>
          <q-stepper-navigation class="row q-gutter-md justify-end">
            <btn-cond flat icon="undo" @ok="ui.fD" color="warning" :label="$t('renoncer')" class="q-ml-sm" />
            <btn-cond flat icon="arrow_upward" @ok="step=1" :label="$t('precedent')" class="q-ml-sm" />
            <btn-cond flat icon="arrow_downward" @ok="step=3" :disable="!nfic" :label="$t('continuer')" class="q-ml-sm" />
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
                  :class="'row items-center ' + sty(idx)">
                  <q-checkbox class="col-1" v-model="f.sel" dense/>
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
            <btn-cond flat icon="undo" @ok="ui.fD" color="warning" :label="$t('renoncer')" class="q-ml-sm" />
            <btn-cond flat icon="arrow_upward" @ok="step=2" color="primary" :label="$t('precedent')" class="q-ml-sm" />
            <btn-cond :disable="!valide || alRed || ui.etf !== 0" icon="check" :label="$t('valider')" 
              color="warning" @ok="valider" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="4" :title="$t('PNFnv15')" icon="check" :done="step > 4">
          <div v-if="errTrf" class="q-ma-md titre-lg msg text-center text-bold">{{$t('PNOerrtrf')}}</div>
          <div v-else v-for="(item, idx) in etapes" :key="idx" class="row no-wrap items-start">
            <q-icon class="col-1" size="sm" :name="ui.etf > idx + 1 ? 'done' : 'arrow_right'"/>
            <div class="col-11">{{item}}</div>
          </div>
          <q-stepper-navigation>
            <btn-cond flat @ok="ui.fD" color="primary" size="lg" label="Vu" class="q-ml-sm" />
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
import { $t, edvol, dhcool, readFile, styp, sty, trapex, dhstring, u8ToB64, afficherDiag } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import { NouveauFichier, PutUrlNf } from '../app/operations4.mjs'
import NomGenerique from '../components/NomGenerique.vue'
import { isAppExc, ID } from '../app/api.mjs'

const ui = stores.ui
const nSt = stores.note
const aSt = stores.avatar 
const gSt = stores.groupe 
const session = stores.session
const ppSt = stores.pp

const canvas = ref()
const thn = ref()

const imgsz = 96 // doit être multiple de 8

async function draw(fic) {
  if (!fic.value.type.startsWith('image/')) {
    delete fic.value.thn
    return
  }
  const png = fic.value.type.indexOf('png') !== -1
  const url = 'data:' + fic.value.type + ';base64,' + u8ToB64(fic.value.u8)
  console.log(url.length)
  const ctx = canvas.value.getContext('2d')
  const img = new Image()
  await new Promise(r => img.onload=r, img.src=url)
  const w = img.width
  const h = img.height
  const r = h > w ? imgsz / h : imgsz / w
  const h2 = h * r
  const w2 = w * r
  let x = 0, y =0
  if (h > w) x = (imgsz - w2) / 2
  else y = (imgsz - h2) / 2
  ctx.clearRect(0, 0, imgsz, imgsz)
  if (png) damier(ctx)
  if (h > w) {
    ctx.clearRect(0, 0, x, imgsz)
    ctx.clearRect(x + w2, 0, x, imgsz)
  }
  if (h < w) {
    ctx.clearRect(0, 0, imgsz, y)
    ctx.clearRect(0, y + h2, imgsz, y)
  }
  ctx.drawImage(img, x, y, w2, h2)
  fic.value.thn = canvas.value.toDataURL('image/jpeg')
  console.log(fic.value.thn.length)
}

function damier (ctx) {
  const n = imgsz / 8
  let g1 = true
  for (let i = 0; i < n; i++) {
    let g2 = !g1
    for (let j = 0; j < n; j++) {
      ctx.fillStyle = g2 ? 'grey' : 'white'
      ctx.fillRect(i * 8, j * 8, 8, 8)
      g2 = !g2
    }
    g1 = !g1
  }
}

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
const lstfic = ref([])
const volsupp = computed(() => {
  let v = 0
  if (lstfic.value && lstfic.value.length) lstfic.value.forEach(f => {if (f.sel) v += f.lg })
  return v
})
const info = ref('')

const errTrf = ref(false)

const estGr = computed(() =>  ID.estGroupe(props.note.id) )
const egr = computed(() =>  estGr.value ? gSt.egr(props.note.id) : null )
const groupe = computed(() =>  egr.value ? egr.value.groupe : null)

const valide = computed(() =>  fic.value.lg && nfic.value)
const ccFic = computed(() =>   [ppSt.modecc, ppSt.ccfic] )
const vx = computed(() =>  (fic.value.lg || 0) - volsupp.value)
// volume fichier du compte (si hébergeur pour un groupe)
const vcpt = computed(() =>  !groupe.value || (groupe.value && !groupe.value.cptEstHeb) ? 0 : session.alVolCpt(vx.value))
const vgr = computed(() =>  !groupe.value ? 0 : groupe.value.alVolGr(vx.value))
const alRed = computed(() =>  volsupp.value < (fic.value.lg || 0)
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
      await draw(fic)
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
    getLstfic()
    ui.setEtf(0)
  }
})

watch(ccFic, async ([modecc, f], av) => {
  if (!modecc) { // fichier copié
    fic.value.nom = f.nom
    fic.value.info = f.info
    fic.value.lg = f.lg
    fic.value.type = f.type
    fic.value.u8 = f.u8
    await draw(fic)
    step.value = 2
  }
})

async function valider () {
  step.value = 4
  errTrf.value = false
  ui.setEtf(0)
  const nf = await props.note.nouvFic(
    nfic.value, 
    info.value || '',
    fic.value.lg,
    fic.value.type, 
    fic.value.u8,
    fic.value.thn || false
  )
  const sidf = []
  if (lstfic.value && lstfic.value.length) lstfic.value.forEach(f => {if (f.sel) sidf.push(f.idf)})
  ui.etf = 1
  const ida = props.aut <= '1' ? null : props.aut

  const ret = await new PutUrlNf().run(props.note, ida, nf, sidf)
  if (nf.idf) {
    if (!await new NouveauFichier().run(props.note, ida, nf, sidf, ret)) { // ret est l'url
      errTrf.value = true
    }
  } else {
    afficherDiag($t('PNFe' + ret.code, [ret.n1, ret.n2]))
  }
}

function getLstfic () {
  lstfic.value.length = 0
  for (const [idf, f] of props.note.mfa)
    lstfic.value.push({ sel: false, idf, nom: f.nom, info: f.info, lg: f.lg, dh: f.dh })
  lstfic.value.sort((a, b) => { return a.nom < b.nom ? -1 : (a.nom > b.nom ? 1 :
    (a.dh < b.dh ? 1 : (a.dh === b.dh ? 0 : -1)))})
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
.bordimg
  border: 1px solid $grey-5
.d-none
  display: none
</style>
