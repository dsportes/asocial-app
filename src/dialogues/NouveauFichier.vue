<template>
<div :class="dkli + ' bs dp40'" style="height:70vh">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">{{$t('PNFnv')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs column">
      <q-stepper v-model="step" vertical color="primary" animated>
        <q-step :name="1" :title="$t('PNFnv1')" icon="attach_file" :done="step > 1">
          <div class="column items-center">
            <q-btn color="warning" dense :label="$t('PNFnv2')" @click="selFic"/>
            <div class="q-my-sm q-px-xs titre-md bg-yellow-5 text-warning text-bold text-italic">{{$t('PNFnv2b')}}</div>
            <q-file class="full-width" v-model="fileList" :label="$t('PNFnv3')"
              max-file-size="50000000" max-file="1"/>
            <div v-if="fic.lg" class="font-mono fs-sm">{{fic.nom}} - {{fic.type}} - {{fic.lg}}o</div>
          </div>
          <q-stepper-navigation class="row q-gutter-md justify-end">
            <q-btn flat @click="MD.fD" color="warning" :label="$t('renoncer')" class="q-ml-sm" />
            <q-btn flat @click="step=2" :disable="!fic.lg" color="primary" :label="$t('continuer')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="2" :title="$t('PNFnv4')" icon="mode_edit" :done="step > 2">
          <div class="q-my-sm font-mono fs-md">{{fic.type}} - {{fic.lg}}o</div>
          <nom-generique v-model="nfic" :init-val="nfic" :label="$t('PNFnv7')" />
          <nom-generique class="q-mt-md" v-model="info" :label="$t('PNFnv8')"
            :suffix="sfx" :init-val="info"/>
          <q-stepper-navigation class="row q-gutter-md justify-end">
            <q-btn flat @click="MD.fD" color="warning" :label="$t('renoncer')" class="q-ml-sm" />
            <q-btn flat @click="step=1" color="primary" :label="$t('precedent')" class="q-ml-sm" />
            <q-btn flat @click="step=3" :disable="!nfic" color="primary" :label="$t('continuer')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="3" title="Versions antérieures à supprimer" icon="check" :done="step > 3">
          <div v-if="!lstfic.length" class="titre-md text-italic">{{$t('PNFnv11')}}
            <span class="font-mono q-mx-sm text-bold q-px-sm">{{nfic}}</span>
          </div>
          <div v-else class="titre-md text-italic">
            <span>{{$t('PNFnv12')}}</span>
            <span class="font-mono q-mx-sm text-bold q-px-sm">{{nfic}}</span>
            <br/>
            <span>{{$t('PNFnv13')}}</span>
          </div>
          <div v-if="lstfic.length" class="fs-md q-my-md">
            <div v-for="f in lstfic" :key="f.idf" class="row items-center">
              <q-checkbox class="col-1" v-model="f.sel" dense @click="calculvol" />
              <div class="col-5">{{f.info}}</div>
              <div class="col-2 font-mono">{{edvol(f.lg)}}</div>
              <div class="col-4 font-mono">{{dhcool(f.dh)}}</div>
            </div>
            <div class="q-mt-md texte-italic">{{$t('PNFnv14', [edvol(volsupp)])}}</div>
          </div>
          <q-stepper-navigation class="row q-gutter-md justify-end">
            <q-btn flat @click="MD.fD" color="warning" :label="$t('renoncer')" class="q-ml-sm" />
            <q-btn flat @click="step=2" color="primary" :label="$t('precedent')" class="q-ml-sm" />
            <q-btn :disable="!valide || ui.etf!==0" flat icon="check" :label="$t('valider')" color="warning" @click="valider" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="4" :title="$t('PNFnv15')" icon="check" :done="step > 4">
          <div v-for="(item, idx) in etapes" :key="idx" class="row no-wrap items-start">
            <q-icon class="col-1" size="sm" :name="ui.etf > idx + 1 ? 'done' : 'arrow_right'"/>
            <div class="col-11">{{item}}</div>
          </div>
          <q-stepper-navigation>
            <q-btn flat @click="MD.fD" color="primary" label="Vu" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>
      </q-stepper>
    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { reactive, toRef, ref } from 'vue'
import stores from '../stores/stores.mjs'
import { afficherDiag, edvol, dhcool, readFile, rnd6, suffixe } from '../app/util.mjs'
import { MD } from '../app/modele.mjs'
import { $t } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { NouveauFichier } from '../app/operations.mjs'
import NomGenerique from '../components/NomGenerique.vue'

export default {
  name: 'NouveauFichier',

  props: { nomfic: String },

  components: { BoutonHelp, NomGenerique },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    valide () { return this.fic.lg && this.nfic }
  },

  watch: {
    async fileList (file) {
      if (file) {
        const { size, name, type, u8 } = await readFile(file, true)
        this.fic.nom = this.nomfic || name
        this.fic.info = this.nomfic ? name : ''
        this.fic.lg = size
        this.fic.type = type
        this.fic.u8 = u8
      }
    },
    step (s) {
      if (s === 1) { this.fileList = null; this.resetFic(); return }
      if (s === 2) { 
        this.idf = rnd6()
        this.nfic = this.fic.nom
        this.sfx = '#' + suffixe(this.idf)
        this.info = this.fic.info || ''
      }
      if (s === 3) {
        this.getLstfic() 
      }
    }
  },

  data () {
    return {
      etapes: [this.$t('PNFnvs0'), this.$t('PNFnvs1'), this.$t('PNFnvs2')],
      fileList: null,
      idf: 0,
      lidf: [],
      lstfic: [],
      volsupp: 0,
      info: ''
    }
  },

  methods: {
    async valider () {
      this.lstfic.forEach(fic => { 
        if (fic.sel) this.lidf.push(fic.idf)
      })
      this.step = 4
      this.ui.etf = 0
      const fic = await this.nSt.note.nouvFic(
        this.idf, 
        this.nfic, 
        (this.info || '') + this.sfx,
        this.fic.lg, 
        this.fic.type, 
        this.fic.u8)
      const dv2 = fic.lg - this.nSt.note.volLidf(this.lidf)

      if (dv2 > 0) {
        let x = 0
        if (this.nSt.node.type === 4) {
          x = this.aSt.occV2 - dv2
          if (x < 0) {
            await afficherDiag($t('PNFnv15a', [-x]))
            MD.fD()
            return
          }
        } if (this.nSt.node.type === 5) {
          const eg = this.gSt.egr(nSt.note.id)
          x = (eg.objv.vols.q2 * UNITEV2) - eg.objv.vols.v2 - dv2
          if (x < 0) {
            await afficherDiag($t('PNFnv15b', [-x]))
            MD.fD()
            return
          }
        }
      }

      this.ui.etf = 1
      await new NouveauFichier().run(this.nSt.note, fic, this.lidf, dv2)
      this.ui.setFichiercree(fic.nom)
    },

    getLstfic () {
      this.lstfic = []
      this.volsupp = 0
      for (const [idf, fic] of this.nSt.note.mfa) {
        if (fic.nom === this.nomfic) {
          this.lstfic.push({ sel: false, idf, info: fic.info, lg: fic.lg, dh: fic.dh })
        }
      }
      this.lstfic.sort((a, b) => a.dh < b.dh ? 1 : (a.dh === b.dh ? 0 : -1))
    },

    calculvol () {
      this.volsupp = 0
      this.lidf = []
      this.lstfic.forEach(fic => { if (fic.sel) this.volsupp += fic.lg })
    }
  },

  setup (props) {
    const ui = stores.ui
    const nSt = stores.note
    const aSt = stores.avatar
    const gSt = stores.groupe
    const session = stores.session
    const ppSt = stores.pp

    const nomfic = toRef(props, 'nomfic')
    const nfic = ref(nomfic.value)
    const step = ref(1)

    const fic = reactive({ nom: '', info: '', lg: 0, type: '', u8: null })

    ppSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'copiercollerfic') {
          const f = args[0]
          // f : { nom: '', info: '', lg: 0, type: '', u8: null }
          if (f) {
            fic.nom = f.nom
            fic.info = f.info
            fic.lg = f.lg
            fic.type = f.type
            fic.u8 = f.u8
            step.value = 2
          }
        }
      })
    })

    function resetFic () { 
      fic.nom = ''; fic.info = ''; fic.lg = 0; fic.type = ''; fic.u8 = null
    }

    function selFic () {
      ppSt.modecc = true
      ppSt.tab = 'fichiers'
      ppSt.ccfic = null
      MD.oD('pressepapier')
    }

    ui.etf = 0

    return {
      nSt, aSt, gSt, ui, session, MD, edvol, dhcool,
      nfic,
      fic,
      step,
      resetFic,
      selFic
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
