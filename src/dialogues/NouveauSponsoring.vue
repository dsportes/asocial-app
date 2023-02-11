<template>
<q-layout container view="hHh lpR fFf" :class="sty" style="width:80vw">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="close"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('NPtit')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>

    <q-card-section>
      <q-stepper v-model="step" vertical color="primary" animated>
        <q-step :name="1" :title="$t('NPphr')" icon="settings" :done="step > 1">
          <span class="fs-sm q-py-sm">{{$t('NPnpc')}}</span>
          <div ref="step1">
          <q-input dense v-model="phrase" :label="$t('NPphl')" counter :rules="[r1]" maxlength="32"
            @keydown.enter.prevent="crypterphrase" :type="isPwd ? 'password' : 'text'"
            :hint="$t('NPpe')">
            <template v-slot:append>
              <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
              <span :class="phrase.length === 0 ? 'disabled' : ''"><q-icon name="cancel" class="cursor-pointer"  @click="razphrase"/></span>
            </template>
          </q-input>
          </div>
          <div v-if="encours" class="fs-md text-italic text-primary">{{$t('NPcry')}}
            <q-spinner color="primary" size="2rem" :thickness="3" />
          </div>
        </q-step>

        <q-step :name="2" :title="$t('NPavp')" icon="settings" :done="step > 3" >
          <div ref="step2">
          <nom-avatar class="q-ma-xs" v-on:ok-nom="oknom" verif icon-valider="check" label-valider="Suivant"></nom-avatar>
          </div>
          <q-stepper-navigation>
            <q-btn flat @click="step = 2" color="primary" :label="$t('precedent')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="3" :title="$t('NPmot')" icon="settings" :done="step > 3" >
          <div ref="step3">
          <editeur-md :texte="mot1" v-model="mot" editable modetxt style="height:8rem"></editeur-md>
          </div>
          <div v-if="diagmot" class="fs-sm text-warning">{{$t('NP10s', [mot.length])}}</div>
          <q-stepper-navigation>
            <q-btn flat @click="step = 2" color="primary" :label="$t('precedent')" class="q-ml-sm" />
            <q-btn flat @click="okmot" color="primary" :label="$t('suivant')" :disable="mot.length<10" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="4" :title="$t('NPquo')" icon="settings" :done="step > 4" >
          <choix-quotas v-model="quotas" :f1="4" :f2="4"/>
          <div v-if="avParrain">
            <div style="margin-left:-0.8rem" class="text-primary">
              <q-toggle v-model="estParrain" size="md" :color="estParrain ? 'warning' : 'primary'"
                :label="estParrain ? $t('NPcpa') : $t('NPcsta')"/>
            </div>
          </div>
          <div style="margin-left:-0.8rem" class="text-primary">
            <q-toggle v-model="npi" size="md" :color="npi ? 'warning' : 'primary'"
              :label="npi ? $t('NPnpi') : $t('NPinv')"/>
          </div>
          <q-stepper-navigation>
            <q-btn flat @click="step = 3" color="primary" :label="$t('precedent')" class="q-ml-sm" />
            <q-btn flat @click="step = 5" color="primary" :label="$t('suivant')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="5" :title="$t('NPmax')" icon="settings" :done="step > 5" >
          <div class="titre-md text-warning">{{$t('NPzero')}}</div>
          <choix-quotas v-model="max" :f1="1" :f2="1"/>
          <q-stepper-navigation>
            <q-btn flat @click="step = 4" color="primary" :label="$t('precedent')" class="q-ml-sm" />
            <q-btn flat @click="step = 6" color="primary" :label="$t('suivant')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="6" :title="$t('NPconf')" icon="check" :done="step > 6" >
          <div>{{$t('NPphr')}} : <span class="font-mono q-pl-md">{{phrase}}</span></div>
          <div>{{$t('NPnav')}} : <span class="font-mono q-pl-md">{{nom}}</span></div>
          <div>{{$t('NPmotc')}} : <span class="font-mono q-pl-md">{{mot}}</span></div>
          <div>{{$t('NPquo')}} :<br>
            <span class="font-mono q-pl-md">v1: {{ed1(quotas[0])}}</span>
            <span class="font-mono q-pl-lg">v2: {{ed2(quotas[1])}}</span>
          </div>
          <div v-if="estParrain" class="text-warning">{{$t('NPcp')}}</div>
          <div>{{$t('NPmv')}} :<br>
            <span class="font-mono q-pl-md">v1: {{ed1(max[0])}}</span>
            <span class="font-mono q-pl-lg">v2: {{ed2(max[1])}}</span>
          </div>
          <q-stepper-navigation>
            <q-btn flat @click="corriger" color="primary" :label="$t('corriger')" class="q-ml-sm" />
            <q-btn @click="confirmer" color="warning" :label="$t('confirmer')" icon="check" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

      </q-stepper>
    </q-card-section>
  </q-page-container>
</q-layout>
</template>

<script>
import { ref, onMounted } from 'vue'
import NomAvatar from '../components/NomAvatar.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import EditeurMd from '../components/EditeurMd.vue'
import { edvol } from '../app/util.mjs'
import { PhraseContact } from '../app/modele.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'

export default ({
  name: 'NouveauSponsoring',

  /* La tribu est nécessaire pour une action du Comptable
  qui lui peut choisir la tribu du parrainé */
  props: { close: Function, naTribu: Object },

  components: { ChoixQuotas, NomAvatar, EditeurMd, BoutonHelp },

  computed: {
    dlclass () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    avParrain () { return this.session.avC.estParrain }
  },

  data () {
    return {
      isPwd: false,
      step: 1,
      quotas: [],
      max: [],
      nom: '',
      phrase: '',
      estParrain: false,
      npi: false,
      pc: null,
      mot: '',
      diagmot: false,
      encours: false
    }
  },

  watch: {
    mot (ap, av) {
      this.diagmot = ap.length < 10 || ap.length > 140
    },
    step (ap) {
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
    r1 (val) { return (val.length > 15 && val.length < 33) || this.$t('NP16') },
    crypterphrase () {
      if (!this.r1(this.phrase)) return
      this.encours = true
      this.pc = new PhraseContact()
      setTimeout(async () => {
        await this.pc.init(this.phrase)
        this.encours = false
        this.step = 2
      }, 1)
    },
    razphrase () {
      this.phrase = ''
      this.pc = null
      this.encours = false
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
        this.step = 4
      }
    },
    async confirmer () {
      // async nouveauRow (phrase, dlv, nom, sp, quotas, ard) {
      const row = Sponsoring.nouveauRow(this.pc, 0, this.nom, this.estParrain, this.quotas, this.mot)
      try {
        await new NouveauParrainage().run(row)
        this.close()
      } catch {}
    },
    corriger () {
      this.step = 1
    }
  },

  setup () {
    const step1 = ref(null)
    const step2 = ref(null)
    const step3 = ref(null)

    onMounted(() => {
      setTimeout(() => {
        const elt = step1.value.querySelector('input')
        elt.focus()
      }, 50)
    })

    return {
      step1,
      step2,
      step3,
      session: stores.session,
      ui: stores.ui
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
