<template>
<q-dialog v-model="ui.d.NFouvrir" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')" style="height:70vh">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <btn-cond color="warning" icon="close" @click="ui.fD"/>
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
            <btn-cond flat @ok="step=2" :disable="!fic.lg" color="primary" :label="$t('continuer')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="2" :title="$t('PNFnv4')" icon="mode_edit" :done="step > 2">
          <div class="q-my-sm font-mono fs-md">{{fic.type}} - {{fic.lg}}o</div>
          <nom-generique v-if="!nom" v-model="nfic" :init-val="nfic" :label="$t('PNFnv7')" />
          <nom-generique v-else v-model="info" :label="$t('PNFnv8')"/>
          <q-stepper-navigation class="row q-gutter-md justify-end">
            <q-btn flat @click="ui.fD" color="warning" :label="$t('renoncer')" class="q-ml-sm" />
            <q-btn flat @click="step=1" color="primary" :label="$t('precedent')" class="q-ml-sm" />
            <q-btn flat @click="step=3" :disable="!nfic" color="primary" :label="$t('continuer')" class="q-ml-sm" />
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
</q-dialog>
</template>

<script>
import stores from '../stores/stores.mjs'
import { edvol, dhcool, readFile } from '../app/util.mjs'
import { styp, sty, dkli, trapex, dhstring } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import { NouveauFichier } from '../app/operations4.mjs'
import NomGenerique from '../components/NomGenerique.vue'
import { isAppExc, ID } from '../app/api.mjs'

export default {
  name: 'NouveauFichier',

  props: { 
    note: Object,
    nom: String, // nom du fichier pour une nouvelle révision
    aut: Number,  // pour un groupe, avatar "auteur"
    pasheb: Boolean
  },

  components: { BoutonHelp, NomGenerique, BtnCond },

  computed: {
    estGr () { return ID.estGroupe(this.note.id) },
    egr () { return this.estGr ? this.gSt.egr(this.note.id) : null },
    groupe () { return this.egr ? egr.groupe : null},

    valide () { return this.fic.lg && this.nfic },
    ccFic () { return  [this.ppSt.modecc, this.ppSt.ccfic] },
    vx () { return (this.fic.lg || 0) - this.volsupp },
    // volume fichier du compte (si hébergeur pour un groupe)
    vcpt () { return !this.groupe || (this.groupe && !this.groupe.cptEstHeb) ? 0 : this.session.compte.alVol(this.vx) },
    vgr () { return !this.groupe ? 0 : this.groupe.alVol(this.vx) },
    alRed () { return (this.volsupp || 0) < (this.fic.lg || 0) 
      && (this.vcpt === 2 || this.vgr === 2 || this.pasheb) }
  },

  watch: {
    async fileList (file) {
      try {
        if (file) {
          const { size, name, type, u8 } = await readFile(file, true)
          const i = name.lastIndexOf('.')
          const n = i == -1 ? name : name.substring(0, i)
          this.fic.nom = this.nom || n
          this.fic.info = ''
          this.fic.lg = size
          this.fic.type = type
          this.fic.u8 = u8
        }
      } catch (e) { trapex (e, this.resetFic)}
    },

    step (s) {
      if (s === 1) { this.fileList = null; this.resetFic(); return }
      if (s === 2) { 
        this.nfic = this.nom || this.fic.nom
        this.info = this.fic.info
      }
      if (s === 3) {
        this.revx = true
        this.sidf = new Set()
        this.volsupp = 0
        this.getLstfic()
        this.ui.setEtf(0)
      }
    },

    ccFic ([modecc, f], av) {
      if (!modecc) { // fichier copié
        this.fic.nom = f.nom
        this.fic.info = f.info
        this.fic.lg = f.lg
        this.fic.type = f.type
        this.fic.u8 = f.u8
        this.step = 2
      }
    }
  },

  data () {
    return {
      revx: true,
      nfic: this.nom || '',
      fic: { nom: '', info: '', lg: 0, type: '', u8: null },
      step: 1,
      etapes: [this.$t('PNFnvs0'), this.$t('PNFnvs1'), this.$t('PNFnvs2')],
      fileList: null,
      idf: 0,
      sidf: null,
      lstfic: [],
      volsupp: 0,
      info: ''
    }
  },

  methods: {
    async valider () {
      this.step = 4
      this.ui.setEtf(0)
      const fic = await this.note.nouvFic(
        this.nfic, 
        this.info || '',
        this.fic.lg, 
        this.fic.type, 
        this.fic.u8
      )

      this.ui.etf = 1
      const res = await new NouveauFichier().run(this.note, this.aut, fic, Array.from(this.sidf))
      if (!isAppExc(res))
        this.ui.setFichiercree(fic.nom)
      else {
        this.step = 1
      }
    },

    getLstfic () {
      this.lstfic = []
      for (const [idf, f] of this.note.mfa)
        this.lstfic.push({ sel: false, idf, nom: f.nom, info: f.info, lg: f.lg, dh: f.dh })
      this.lstfic.sort((a, b) => { return a.nom < b.nom ? -1 : (a.nom > b.nom ? 1 :
        (a.dh < b.dh ? 1 : (a.dh === b.dh ? 0 : -1)))})
    },

    clickFic (f) {
      if (f.sel) { f.sel = false; this.sidf.delete(f.idf); this.volsupp -= f.lg }
      else { f.sel = true; this.sidf.add(f.idf); this.volsupp += f.lg }
    },

    resetFic () { 
      this.fic.nom = ''; this.fic.info = ''; this.fic.lg = 0; this.fic.type = ''; this.fic.u8 = null
    },

    selFic () {
      this.ppSt.modecc = true
      this.ppSt.tab = 'fichiers'
      this.ppSt.ccfic = null
      this.ui.oD('pressepapier')
    }

  },

  setup () {
    return {
      nSt: stores.note,
      aSt: stores.avatar, 
      gSt: stores.groupe, 
      ui: stores.ui,
      session: stores.session,
      ppSt: stores.pp, 
      edvol, dhcool, dkli, dhstring, styp, sty, ID
    }
  }
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
</style>
