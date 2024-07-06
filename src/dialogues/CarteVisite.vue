<template>
<q-dialog v-model="ui.d.CVedition" persistent>
  <q-card :class="styp('md')">
    <q-toolbar class="bg-secondary text-white">
      <btn-cond color="warning" icon="close" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CVtit')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <div class="marginauto q-pa-md">
      <span class='titre-lg'>{{ncv.nom}}</span>
      <span class='q-mx-md fs-sm font-mono'>[{{ncv.id}}]</span>
    </div>
    <q-separator />
    <q-card-section class="row justify-start">
      <img  class="col-auto classeph q-mr-sm" :src="ncv.ph" :width="taillephoto.width" :height="taillephoto.height"/>
      <div class="col column jusitify-center">
        <btn-cond icon="mode_edit" :label="$t('CVcph')" @ok="enEdition=true" />
        <btn-cond :disable="!modifph" icon="undo" :label="$t('CVgph')" @ok="undoph" />
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section v-if="enEdition">
      <div class="q-mb-sm column justify-center">
        <q-file v-model="fileList" :label="$t('CVcph')" accept=".jpg, .jpeg, .png" max-file-size="4000000" max-file="1"/>
        <div class="row justify-center q-gutter-sm">
          <q-toggle v-model="silence" color="primary" dense class="col-auto" :label="$t('CVsil')" />
          <btn-cond flat :disable="camOn" :label="$t('CVdwc')" @ok="startCam" />
          <btn-cond flat :disable="!camOn" :label="$t('CVawc')" @ok="stopCam" />
          <btn-cond flat :disable="camOn" icon="flip_camera_ios" @ok="flipCam" />
        </div>
        <div class="row justify-center q-gutter-md">
          <btn-cond class="col" :flat="!camOn" :disable="!camOn" color="green-5"
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
          <audio ref="sound" :src="cliccamera()" preload = "auto"></audio>
          <div v-if="!camOn" class="camoff">{{$t('CVoff')}}</div>
        </div>
        <div class=" q-py-md">
          <cropper ref="cropper" class="cropper"
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
</q-dialog>
</template>

<script>
import Webcam from 'webcam-easy'
import { Cropper } from 'vue-advanced-cropper'

import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { styp, readFile } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'
import { CV } from '../app/modele.mjs'
import { ID } from '../app/api.mjs'
import { MajCv } from '../app/operations4.mjs'

import BoutonHelp from '../components/BoutonHelp.vue'
import EditeurMd from '../components/EditeurMd.vue'

const TPH = { height: 32, width: 32 }

export default ({
  name: 'CarteVisite',

  props: {
    cv: Object
  },

  components: {
    BoutonHelp, Cropper, EditeurMd, BtnCond
  },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    taillephoto () { return TPH },
    modif () {
      return this.ncv.tx !== this.cv.tx || this.modifph
    },
    modifph () {
      return this.ncv.ph !== this.cv.ph
    }
  },

  watch: {
    async fileList (file) {
      if (file) {
        this.file = await readFile(file)
        console.log('file')
      }
    }
  },

  data () {
    return {
      silence: false,
      enEdition: false,
      fileList: null,
      file: { b64: '' },
      cam: null,
      camOn: false
    }
  },

  methods: {
    undogen () {
      this.undoph()
      // this.md.undo()
      this.ncv.tx = this.cv.tx
      // this.$emit('ok', false)
      this.ui.fD()
    },
    async valider () {
      await new MajCv().run(this.ncv)
      this.ui.fD()
    },
    undoph () {
      this.enEdition = false
      this.ncv.ph = this.cv.photo
      this.stopCam()
    },
    phok () {
      // eslint-disable-next-line no-unused-vars
      const { coordinates, canvas } = this.cropper.getResult()
      this.ncv.ph = canvas.toDataURL()
      this.enEdition = false
      this.stopCam()
    },
    startCam () {
      if (!this.cam) {
        this.cam = new Webcam(this.webcam, 'user', this.canvas, 
          this.silence ? null : this.sound)
      }
      this.cam.start()
      this.camOn = true
    },
    stopCam () {
      if (this.cam) {
        this.cam.stop()
      }
      this.camOn = false
    },
    snapCam () {
      if (this.camOn) {
        const x = this.cam.snap()
        this.file.type = x.substring(x.indexOf(':') + 1, x.indexOf(';'))
        this.file.b64 = x
      }
    },
    flipCam () {
      if (!this.camOn) this.cam.flip()
    },
    cliccamera () {
      return this.clic
    }
  },

  setup (props) {
    const md = ref(null)
    const webcam = ref(null)
    const sound = ref(null)
    const cropper = ref(null)
    const canvas = ref(null)

    const ui = stores.ui
    const config = stores.config
    const clic = stores.config.cliccamera

    const cv = toRef(props, 'cv')
    const ncv = ref(new CV(cv.value.id, cv.value.v, cv.value.photo, cv.value.tx))

    return {
      ui, styp, config, clic, md, webcam, sound, cropper, canvas, ncv, ID,
      session: stores.session
    }
  }
})
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
