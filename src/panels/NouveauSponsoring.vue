<template>
<q-dialog v-model="ui.d.NSnvsp" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">{{$t('NPtit')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page :class="dkli(0)">
      <q-stepper v-model="step" vertical color="primary" animated>
        <q-step :name="0" :title="$t('NPprof')" icon="settings" :done="step > 0">
          <div v-if="session.accepteA" class="q-my-sm">
            <q-option-group :options="optionsOA" type="radio" dense v-model="optA" />
          </div>
          <div class="bordt q-my-sm">
            <q-option-group :options="optionsSP" type="radio" dense v-model="optSP" />
          </div>
          <q-stepper-navigation>
            <q-btn flat @click="step = 1" color="primary"
              :label="$t('suivant')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="1" :title="$t('NPphr')" icon="settings" :done="step > 1">
          <span class="fs-sm q-py-sm">{{$t('NPnpc')}}</span>
          <div ref="step1">
            <phrase-contact @ok="crypterphrase" :orgext="session.org"/>
          </div>
          <q-stepper-navigation>
            <q-btn flat @click="step = 0" color="primary"
              :label="$t('precedent')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="2" :title="$t('NPavp')" icon="settings" :done="step > 3" >
          <div ref="step2">
            <nom-avatar class="q-ma-xs" v-on:ok-nom="oknom" verif icon-valider="check" :label-valider="$t('suivant')"></nom-avatar>
          </div>
          <q-stepper-navigation>
            <q-btn flat @click="step = 1" color="primary" :label="$t('precedent')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="3" :title="$t('NPmot')" icon="settings" :done="step > 3" >
          <div ref="step3">
            <editeur-md :texte="mot1" v-model="mot" editable modetxt mh="10rem"/>
          </div>
          <div v-if="diagmot" class="fs-sm text-warning">{{$t('NP10s', [mot.length])}}</div>
          <q-stepper-navigation>
            <q-btn flat @click="step = 2" color="primary" :label="$t('precedent')" class="q-ml-sm" />
            <q-btn flat @click="okmot" color="primary" :label="$t('suivant')" 
              :disable="mot.length<10" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step v-if="optA === 0" :name="4" :title="$t('NPquo1')" icon="settings" :done="step > 4" >
          <choix-quotas :quotas="quotas"/>
          <q-stepper-navigation>
            <q-btn flat @click="step = 3" color="primary" :label="$t('precedent')" class="q-ml-sm" />
            <q-btn flat @click="step = 5" :disable="quotas.err"
              color="primary" :label="$t('suivant')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="5" :title="$t('NPconf')" icon="check" :done="step > 6" >
          <div class="titre-md">{{$t('NPphr')}} : <span class="font-mono q-pl-md">{{pc.phrase}}</span></div>
          <div class="titre-md">{{$t('NPnav')}} : <span class="font-mono q-pl-md">{{nom}}</span></div>
          <div class="titre-md">{{$t('NPmotc')}} : <span class="font-mono q-pl-md">{{mot}}</span></div>
          <div v-if="optA === 0">
            <div class="titre-md">{{$t('compteO')}}</div>
            <quotasVols class="q-ml-md" :vols="quotas" noutil/>
          </div>
          <div v-else class="text-warning titre-md">{{$t('compteA')}}</div>
          <div v-if="estSponsor" class="text-warning titre-md">{{$t('NPcp')}}</div>
          <q-stepper-navigation>
            <q-btn flat @click="corriger" color="primary" :label="$t('corriger')" class="q-ml-sm" />
            <q-btn @click="confirmer" color="warning" :label="$t('confirmer')" icon="check" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

      </q-stepper>
    </q-page>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script>
import { ref, toRef, onMounted } from 'vue'
import NomAvatar from '../components/NomAvatar.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import EditeurMd from '../components/EditeurMd.vue'
import { styp, edvol, afficherDiag, dkli, $t } from '../app/util.mjs'
import { Sponsoring } from '../app/modele.mjs'
import { UNITEV1, UNITEV2, AMJ, limitesjour } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import PhraseContact from '../components/PhraseContact.vue'
import QuotasVols from '../components/QuotasVols.vue'
import { AjoutSponsoring, ExistePhrase } from '../app/operations.mjs'

export default ({
  name: 'NouveauSponsoring',

  /* La tribu est nécessaire pour une action du Comptable
  qui lui peut choisir la tribu du sponsorisé */
  props: { tribu: Object },

  components: { PhraseContact, ChoixQuotas, NomAvatar, EditeurMd, BoutonHelp, QuotasVols },

  computed: {
    estSponsor () { return this.optSP === 1 },
  },

  data () {
    return {
      isPwd: false,
      max: [],
      nom: '',
      phrase: '',
      npi: false,
      pc: null,
      mot: '',
      diagmot: false
    }
  },

  watch: {
    mot (ap, av) {
      this.diagmot = ap.length < 10 || ap.length > 140
    },
    step (ap) {
      if (ap === 0) {
        this.optA = this.optionsOA[0].value
        this.optSP = this.optionsSP[0].value
        return
      }
      if (ap === 1) {
        setTimeout(() => {
          const elt = this.step1.querySelector('input')
          elt.focus()
        }, 50)
        return
      }
      if (ap === 2) {
        setTimeout(() => {
          const elt = this.step2.querySelector('input')
          if (elt) elt.focus()
        }, 500)
        return
      }
      if (ap === 3) {
        setTimeout(() => {
          const elt = this.step3.querySelector('textarea')
          if (elt) elt.focus()
        }, 500)
        return
      }
    }
  },

  methods: {
    ed1 (f) { return edvol(f * UNITEV1) },
    ed2 (f) { return edvol(f * UNITEV2) },
    async crypterphrase (pc) {
      if (await new ExistePhrase().run(pc.hps1, 2)) {
        await afficherDiag(this.$t('existe'))
        return
      }
      this.pc = pc
      this.step = 2
    },
    oknom (nom) {
      if (nom) {
        this.nom = nom
        this.mot1 = this.$t('NPbj', [this.nom])
        this.step = 3
      }
    },
    okmot () {
      if (this.mot.length > 0) {
        this.mot = this.mot.substring(0, 140)
        this.step = this.optA === 0 ? 4 : 5
      }
    },
    async confirmer () {
      // async nouveauRow (phrase, dlv, nom, sp, quotas, ard) {
      const q = this.optA === 0 ? [this.quotas.qc, this.quotas.q1, this.quotas.q2] : [0, 1, 1]
      const dlv = AMJ.amjUtcPlusNbj(AMJ.amjUtc(), this.limj)
      // (phrase, dlv, nom, cletX, clet, sp, quotas, ard)
      const row = await Sponsoring.nouveauRow(this.pc, dlv, this.nom, 
        this.optA === 0 ? this.tribu.cletX : null, 
        this.optA === 0 ? this.tribu.clet : null, 
        this.estSponsor, q, this.mot)
      try {
        await new AjoutSponsoring().run(row)
        this.ui.fD()
      } catch {}
    },
    corriger () {
      this.step = this.optA === 0 ? 4 : 5
    }
  },

  setup (props) {
    const ui = stores.ui
    const limj = limitesjour.sponsoring
    const step1 = ref(null)
    const step2 = ref(null)
    const step3 = ref(null)
    const step = ref()
    const optionsOA = [
      { label: $t('compteO'), value: 0 },
      { label: $t('compteA'), value: 1, color: 'warning' }
    ]
    const optA = ref(null)
    const optionsSP = [
      { label: $t('compteST'), value: 0 },
      { label: $t('compteSP'), value: 1, color: 'warning' }
    ]
    const optSP = ref(null)

    const tribu = toRef(props, 'tribu')
    const quotas = ref(null)
    const cpt = tribu.value.synth
    quotas.value = { qc: 1, q1: 1, q2: 1, 
      max1: cpt.q1 > cpt.a1 ? cpt.q1 - cpt.a1 : 0, 
      max2: cpt.q2 > cpt.a2 ? cpt.q2 - cpt.a2 : 0,
      maxc: cpt.qc > cpt.ac ? cpt.qc - cpt.ac : 0,
      min1: 1, min2: 0, minc: 1 }

    onMounted(() => {
      step.value = 0
    })

    return {
      ui, dkli, styp,
      nct: tribu.value.na,
      limj,
      step,
      step1,
      step2,
      step3,
      optionsOA, optA, optionsSP, optSP,
      session: stores.session,
      quotas
    }
  }
})
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
</style>

<style lang="sass">
.bordt
  border-top: 1px solid $grey-5
.q-stepper--vertical
  padding: 4px !important
.q-stepper--bordered
  border: none
.q-stepper__tab
  padding: 2px 0 !important
.q-stepper__step-inner
  padding: 0px 2px 2px 18px !important
.q-stepper__nav
  padding: 0 !important
</style>
