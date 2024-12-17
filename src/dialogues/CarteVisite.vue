<template>
  <q-card :class="styp('md')">
    <q-toolbar class="tbs">
      <btn-cond color="warning" icon="close" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CVtit')}}</q-toolbar-title>
      <bouton-help page="cv_maj"/>
    </q-toolbar>
    <div class="marginauto q-pa-md">
      <span class='titre-lg'>{{ncv.nom}}</span>
      <span class='q-mx-md fs-sm font-mono'>[{{ncv.id}}]</span>
    </div>
    <q-separator />
    <q-card-section class="row justify-between">
      <img  class="classeph q-mr-sm" :src="ncv.ph" :width="taillephoto.width" :height="taillephoto.height"/>
      <div class="row q-gutter-sm">
        <btn-cond icon="mode_edit" :label="$t('CVcph')" @ok="setEnEdition" />
        <btn-cond :disable="!modifph" icon="undo" :label="$t('CVgph')" @ok="undoph" />
      </div>
    </q-card-section>
    <q-separator />
    <!-- v-if="enEdition" -->
    <q-card-section v-if="enEdition">
      <div class="q-mb-sm column justify-center">
        <q-file v-model="fileList" :label="$t('CVcph')" accept=".jpg, .jpeg, .png" max-file-size="4000000" max-file="1"/>
        <div class="row justify-center q-gutter-sm">
          <q-toggle v-model="silence" color="primary" dense class="col-auto" :label="$t('CVsil')" />
          <btn-cond flat :disable="camOn" :label="$t('CVdwc')" @ok="startCam" />
          <btn-cond flat :disable="!camOn" :label="$t('CVawc')" @ok="stopCam" />
          <btn-cond flat :disable="camOn" icon="flip_camera_ios" @ok="flipCam" />
        </div>
        <div class="full-width self-center text-center q-my-sm">
          <btn-cond :flat="!camOn" :disable="!camOn" size="lg" color="accent"
            :label="$t('CVpph')" @ok="snapCam" />
        </div>
        <div class="row justify-center q-gutter-sm">
          <btn-cond icon="check" :disable="!file.b64" color="warning" :label="$t('CVtop')" @ok="phok" />
          <btn-cond icon="undo" :label="$t('CVmav')" @ok="undoph" />
        </div>
      </div>
      <div class="column items-center" style="width:100%">
        <div>
          <video ref="webcam" autoplay playsinline width="240" height="180" :class="camOn ? '' : 'd-none'"></video>
          <canvas ref="canvas" class="d-none"></canvas>
          <audio ref="sound" :src="clic" preload = "auto"></audio>
          <div v-if="!camOn" class="camoff">{{$t('CVoff')}}</div>
        </div>
        <div class=" q-py-md"> <!--  -->
          <cropper ref="crop" class="cropper"
            :src="file.b64"
            :stencil-props="{aspectRatio:1/1}"
            :canvas="taillephoto"></cropper>
        </div>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section>
      <editeur-md ref="md" :texte="cv.tx" v-model="ncv.tx"
        editable modetxt mh="10rem"></editeur-md>
    </q-card-section>
    <q-separator />
    <q-card-actions align="right" class="q-gutter-sm">
      <btn-cond v-if="!modif" flat icon="undo" color="primary" :label="$t('fermer')" @ok="undogen" />
      <btn-cond v-else flat icon="undo" :label="$t('renoncer')" @ok="undogen" />
      <btn-cond :disable="!modif" icon="check" :label="$t('valider')" @ok="valider" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

import Webcam from 'webcam-easy'
import { Cropper } from 'vue-advanced-cropper'

import stores from '../stores/stores.mjs'
import { styp, readFile } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'
import { CV } from '../app/modele.mjs'
import { ID } from '../app/api.mjs'
import { MajCv } from '../app/operations4.mjs'

import BoutonHelp from '../components/BoutonHelp.vue'
import EditeurMd from '../components/EditeurMd.vue'

const taillephoto = { height: 32, width: 32 }

const props = defineProps({
  cv: Object
})

const crop = ref()
const webcam = ref()
const sound = ref()
const canvas = ref()
const md = ref()

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const config = stores.config
const clic = stores.config.cliccamera
const ncv = ref(new CV(props.cv.id, props.cv.v, props.cv.photo, props.cv.tx))

const sty = computed(() => this.$q.dark.isActive ? 'sombre' : 'clair')
const modif = computed(() => ncv.value.tx !== props.cv.tx || modifph.value)
const modifph = computed(() => ncv.value.ph !== props.cv.ph)

const silence = ref(false)
const enEdition = ref(false)
const fileList = ref(null)
const file = ref({ b64: '' })
const cam = ref(null)
const camOn = ref(false)

function setEnEdition () {
  enEdition.value = true
}

watch(fileList, async (filex) => {
  if (filex) {
    file.value = await readFile(filex)
  }
})

function undogen () {
  undoph()
  ncv.value.tx = props.cv.tx
  ui.fD()
}

async function valider () {
  await new MajCv().run(ncv.value)
  ui.fD()
  ui.fD()
}

function undoph () {
  enEdition.value = false
  ncv.value.ph = props.cv.photo
  stopCam()
}

function phok () {
  // eslint-disable-next-line no-unused-vars
  const { coordinates, canvas } = crop.value.getResult()
  ncv.value.ph = canvas.toDataURL()
  enEdition.value = false
  stopCam()
}

function startCam () {
  if (!cam.value) {
    cam.value = new Webcam(webcam.value, 'user', canvas.value, 
      silence.value ? null : sound.value)
  }
  cam.value.start()
  camOn.value = true
}

function stopCam () {
  if (cam.value) {
    cam.value.stop()
  }
  camOn.value = false
}

function snapCam () {
  if (camOn.value) {
    const x = cam.value.snap()
    file.value.type = x.substring(x.indexOf(':') + 1, x.indexOf(';'))
    file.value.b64 = x
  }
}

function flipCam () {
  if (!camOn.value) cam.value.flip()
}

</script>
<style lang="css">
@import '../css/cropper.css'
</style>

<style lang="sass">
@import '../css/app.sass'

.classeph
  border-radius: $tphradius
  border: 1px solid grey
.d-none
  display: none
.camoff
  width: 160px
  height: 120px
  text-align: center
  padding-top: 45px
  border: 1px solid grey
.cropper
  height: 180px
  width: 240px
  background: #DDD
</style>
