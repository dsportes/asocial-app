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
        <q-step v-if="!estA" :name="0" :title="$t('NPprof')" icon="settings" :done="step > 0">
          <div class="q-my-sm">
            <q-option-group :options="optionsOSA" type="radio" dense v-model="optOSA" />
          </div>
          <div v-if="optOSA === 2">
            <q-checkbox class="titre-md text-bold" size="md" dense 
              left-label v-model="dconf" :label="$t('CHcdon')" />
          </div>
          <q-stepper-navigation>
            <q-btn flat @click="step = 2" :label="$t('suivant')"
              color="primary" padding="none" dense size="md"/>
          </q-stepper-navigation>
        </q-step>

        <q-step v-if="estA" :name="1" :title="$t('NPprof')" icon="settings" :done="step > 1">
          <div class="q-my-sm">
            <q-option-group :options="optionsDon" type="radio" dense v-model="optDon" />
          </div>
          <q-stepper-navigation>
            <q-btn flat @click="setDon" :label="$t('suivant')"
              color="primary" padding="none" dense size="md"/>
          </q-stepper-navigation>
        </q-step>

        <q-step :name="2" :title="$t('NPphr')" icon="settings" :done="step > 2">
          <span class="titre-sm q-py-sm">{{$t('NPnpc')}}</span>
          <div ref="step2">
            <phrase-contact @ok="crypterphrase" :orgext="session.org" 
              :init-val="pc && pc.phrase ? pc.phrase : ''"/>
          </div>
          <q-stepper-navigation>
            <q-btn :label="$t('precedent')" @click="step = estA ? 1 : 0"
              flat  color="primary" padding="none" dense size="md"/>
            <!--q-btn flat @click="step = 3" color="primary" padding="none" dense size="md"
              :label="$t('suivant')" :disable="!pc || !pc.phrase"
              class="q-ml-sm"/-->
          </q-stepper-navigation>
        </q-step>

        <q-step :name="3" :title="$t('NPavp')" icon="settings" :done="step > 3" >
          <div ref="step3">
            <nom-avatar class="q-ma-xs" v-on:ok-nom="oknom" verif :init-val="nom || ''"
              icon-valider="check" :label-valider="$t('suivant')"></nom-avatar>
          </div>
          <q-stepper-navigation>
            <q-btn flat @click="step = 2" color="primary" padding="none" dense size="md"
            :label="$t('precedent')"/>
          </q-stepper-navigation>
        </q-step>

        <q-step :name="4" :title="$t('NPmot')" icon="settings" :done="step > 4" >
          <div ref="step4">
            <editeur-md :texte="mot1" v-model="mot" editable modetxt mh="10rem"/>
          </div>
          <div v-if="diagmot" class="fs-sm text-warning">{{$t('NP10s', [mot.length])}}</div>
          <q-stepper-navigation>
            <q-btn flat @click="step = 3" color="primary" padding="none" dense size="md"
              :label="$t('precedent')"/>
            <q-btn flat @click="okmot" color="primary" padding="none" dense size="md"
              :label="$t('suivant')" 
              :disable="mot.length<10" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step v-if="!estAutonome" :name="5" :title="$t('NPquo1')" icon="settings" :done="step > 5" >
          <choix-quotas :quotas="quotas"/>
          <q-stepper-navigation>
            <q-btn flat @click="step = 4" color="primary" padding="none" dense size="md"
              :label="$t('precedent')" />
            <q-btn flat @click="step = 6" :disable="quotas.err"
              color="primary" padding="none" dense size="md"
              :label="$t('suivant')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="6" :title="$t('NPconf')" icon="check" :done="step > 6" >
          <div class="titre-md">{{$t('NPphr')}} : <span class="font-mono q-pl-md">{{pc.phrase}}</span></div>
          <div class="titre-md">{{$t('NPnav')}} : <span class="font-mono q-pl-md">{{nom}}</span></div>
          <div class="titre-md">{{$t('NPmotc')}} : <span class="font-mono q-pl-md">{{mot}}</span></div>
          <div v-if="!estAutonome">
            <div class="titre-md">{{$t(estDelegue ? 'compteS' : 'compteO')}}</div>
            <quotasVols class="q-ml-md" :vols="quotas" noutil/>
          </div>
          <div v-else class="text-warning titre-md">
            <span>{{$t('compteA')}}</span>
            <span v-if="don" class="q-ml-sm">{{$t('NPdon2', [don])}}</span>
            <span v-if="dconf" class="q-ml-sm">{{$t('conf')}}</span>
          </div>
          <q-stepper-navigation class="row items-center q-gutter-sm q-mt-md">
            <q-btn flat @click="step = this.estAutonome ? 4 : 5" color="primary" padding="xs" dense size="md"
              :label="$t('corriger')"/>
            <q-btn @click="confirmer" color="warning" padding="xs" dense size="md"
              :label="$t('confirmer')" icon="check" />
          </q-stepper-navigation>
        </q-step>

      </q-stepper>
    </q-page>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script>
import { ref, toRef } from 'vue'
import NomAvatar from '../components/NomAvatar.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import EditeurMd from '../components/EditeurMd.vue'
import { styp, edvol, afficherDiag, dkli, $t } from '../app/util.mjs'
import { Sponsoring } from '../app/modele.mjs'
import { UNITEN, UNITEV, AMJ, limitesjour, d14 } from '../app/api.mjs'
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
    estDelegue () { return this.optOSA === 1 },
    estAutonome () { return this.optOSA === 2}
  },

  data () {
    return {
      isPwd: false,
      max: [],
      nom: '',
      npi: false,
      pc: null,
      mot: '',
      don: 0,
      dconf: false,
      diagmot: false
    }
  },

  watch: {
    mot (ap, av) {
      this.diagmot = ap.length < 10 || ap.length > 140
    },
    step (ap) {
      if (ap === 2) {
        setTimeout(() => {
          const elt = this.step2.querySelector('input')
          elt.focus()
        }, 50)
        return
      }
      if (ap === 3) {
        setTimeout(() => {
          const elt = this.step3.querySelector('input')
          if (elt) elt.focus()
        }, 500)
        return
      }
      if (ap === 4) {
        setTimeout(() => {
          const s = this.step4
          const elt = s ? s.querySelector('textarea') : null
          if (elt) elt.focus()
        }, 500)
        return
      }
    }
  },

  methods: {
    ed1 (f) { return edvol(f * UNITEN) },
    ed2 (f) { return edvol(f * UNITEV) },
    async crypterphrase (pc) {
      const hps1 = (this.session.ns * d14) + pc.hps1
      if (await new ExistePhrase().run(hps1, 2)) {
        await afficherDiag(this.$t('existe'))
        return
      }
      this.pc = pc
      this.step = 3
    },
    async setDon () {
      const credits = this.aSt.compta.credits
      const total = credits && credits.total ? credits.total : 0
      this.don = this.optDon
      if (total - this.don <= 0) {
        await afficherDiag($t('NPcred', [total, this.don]))
        return
      }
      this.step = 2
    },
    oknom (nom) {
      if (nom) {
        this.nom = nom
        this.mot1 = this.mot || this.$t('NPbj', [this.nom])
        this.step = 4
      }
    },
    okmot () {
      if (this.mot.length > 0) {
        this.mot = this.mot.substring(0, 140)
        this.step = this.estAutonome ? 6 : 5
      }
    },
    async confirmer () {
      // async nouveauRow (phrase, dlv, nom, sp, quotas, ard) {
      const q = this.estAutonome ? [0, 1, 1] : [this.quotas.qc, this.quotas.q1, this.quotas.q2]
      const dlv = AMJ.amjUtcPlusNbj(AMJ.amjUtc(), this.limj)
      // (phrase, dlv, nom, cletX, clet, sp, quotas, ard)
      const row = await Sponsoring.nouveauRow(this.pc, dlv, this.nom, 
        this.estAutonome ? null : this.tribu.cletX, 
        this.estAutonome ? null : this.tribu.clet, 
        this.estDelegue, q, this.mot, this.don, this.dconf)
      try {
        await new AjoutSponsoring().run(row, this.don)
        this.ui.fD()
      } catch {}
    }
  },

  setup (props) {
    const cfg = stores.config
    const ui = stores.ui
    const session = stores.session
    const accepteA = session.espace.opt > 0
    const aSt = stores.avatar
    const c = aSt.compta
    const estA = ref(c.estA)
    const estS = ref(c.sp)

    const limj = limitesjour.sponsoring
    const step4 = ref(null)
    const step2 = ref(null)
    const step3 = ref(null)
    const step = ref(0)
    const optionsOSA = [
      { label: $t('compteO'), value: 0 },
      { label: $t('compteS'), value: 1 }
    ]
    const optOSA = ref(0)
    const optionsDon = [ ]
    for (const d of cfg.dons) optionsDon.push({ label: $t('don', [d]), value: d})

    const optDon = ref(0)

    const quotas = ref(null)

    if (estA.value) {
      step.value = 1
      optOSA.value = 2
      optDon.value = optionsDon[0].value
    } else {
      step.value = 0
      if (accepteA) optionsOSA.push({ label: $t('compteA'), value: 2 })
      optOSA.value = 0
      const tribu = toRef(props, 'tribu')
      const cpt = tribu.value.synth
      quotas.value = { qc: 1, q1: 1, q2: 1, 
        max1: cpt.q1 > cpt.a1 ? cpt.q1 - cpt.a1 : 0, 
        max2: cpt.q2 > cpt.a2 ? cpt.q2 - cpt.a2 : 0,
        maxc: cpt.qc > cpt.ac ? cpt.qc - cpt.ac : 0,
        min1: 1, min2: 0, minc: 1 }
    }

    return {
      ui, dkli, styp, aSt,
      limj,
      step,
      step4,
      step2,
      step3,
      optionsOSA, optOSA, estA, estS, optionsDon, optDon,
      session: stores.session,
      quotas
    }
  }
  /*
  .q-stepper--vertical
    padding: 8px 0px !important
  */
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
.q-stepper--bordered
  border: none
.q-stepper__tab
  padding: 10px 0 !important
.q-stepper__step-inner
  padding: 0px 2px 2px 18px !important
.q-stepper__nav
  padding: 5px 0 !important
</style>
