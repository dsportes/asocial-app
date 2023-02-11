<template>
  <q-card class="q-ma-xs moyennelargeur fs-md">
    <q-card-section class="column items-center">
      <div class="titre-lg text-center">{{$t('APAtit', [estpar ? $t('APApa') : $t('APAfi')])}}</div>
    </q-card-section>

    <q-card-section>
      <q-stepper v-model="step" vertical color="primary" animated>
        <q-step :name="1" :title="$t('APApp')" icon="settings" :done="step > 1">
          <div>{{$t('APAtr', [nomTribu])}}</div>
          <div>{{$t('APAnc')}} : <span class="font-mono q-pl-md">{{couple.nomIs}}</span></div>
          <div>{{$t('APAnpa')}} : <span class="font-mono q-pl-md">{{couple.nomEs}}</span></div>
          <div>{{$t('APAqdc')}} :
            <span class="font-mono q-pl-md">v1: {{ed1(datactc.forfaits[0])}}</span>
            <span class="font-mono q-pl-lg">v2: {{ed2(datactc.forfaits[1])}}</span>
          </div>
          <div class="t1" v-if="valid">{{$t('APAval')}} : <span class="sp1">{{$t('jour', valid, { count: valid })}}</span></div>
          <show-html class="full-width height-6 border1" :texte="couple.ard" />
          <q-stepper-navigation>
            <q-btn flat @click="fermer()" color="primary" :label="$t('renoncer')" class="q-ml-sm" />
            <q-btn flat @click="step=5" color="primary" :label="$t('refuser')" class="q-ml-sm" />
            <q-btn flat @click="step=2" color="warning" :label="$t('continuer')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="2" :title="$t('APAps')" icon="settings" :done="step > 2">
          <div class="fs-sm q-py-sm">{{$t('APAps2')}}</div>
          <phrase-secrete :init-val="ps" class="q-ma-xs" v-on:ok-ps="okps" verif icon-valider="check" label-valider="continuer"></phrase-secrete>
          <q-stepper-navigation>
            <q-btn flat @click="fermer()" color="primary" :label="$t('renoncer')" class="q-ml-sm" />
            <q-btn flat @click="refuser()" color="primary" :label="$t('refuser')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="3" :title="$t('APAess')" icon="settings" :done="step > 3" >
          <div v-if="couple.stE===1">{{$t('APAesp')}} :<br>
            <span class="font-mono q-pl-md">Maximum v1: {{ed1(couple.mx10)}}</span><br>
            <span class="font-mono q-pl-md">Maximum v2: {{ed2(couple.mx20)}}</span>
          </div>
          <div v-else>{{$t('APAnos')}}</div>
          <div class="titre-md text-warning">{{$t('APAnos2')}}</div>
          <choix-quotas v-model="max" :f1="couple.mx10 || 1" :f2="couple.mx20 || 1"/>
          <div v-if="couple.npiE===1">{{$t('APAper')}}</div>
          <div v-if="couple.npiE===0">{{$t('APAper2')}}</div>
          <div style="margin-left:-0.8rem" class="text-primary">
            <q-toggle v-model="npi" size="md" :color="npi ? 'warning' : 'primary'"
              :label="npi ? $t('APAper4') : $t('APAper3')"/>
          </div>
          <q-stepper-navigation>
            <q-btn flat @click="step = 2" color="primary" :label="$t('precedent')" class="q-ml-sm" />
            <q-btn flat @click="step = 4" color="primary" :label="$t('suivant')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="4" :title="$t('APAmer')" icon="check" :done="step > 3" >
          <editeur-md class="full-width height-8" v-model="texte" :texte="textedef" editable modetxt hors-session/>
          <q-stepper-navigation>
            <q-btn flat @click="step=1" color="primary" :label="$t('corriger')" class="q-ml-sm" />
            <q-btn flat @click="fermer()" color="primary" :label="$t('renoncer')" class="q-ml-sm" />
            <q-btn flat @click="step=5" color="primary" :label="$t('refuser')" class="q-ml-sm" />
            <q-btn @click="confirmer" color="warning" :label="$t('APAconf')" icon="check" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

        <q-step :name="5" :title="$t('APAdec')" icon="check" :done="step > 6" >
          <editeur-md class="full-width height-8" v-model="texte" :texte="couple.ard" editable modetxt hors-session/>
          <q-stepper-navigation>
            <q-btn flat @click="step=1" color="primary" :label="$t('corriger')" class="q-ml-sm" />
            <q-btn flat @click="fermer()" color="primary" :label="$t('renoncer')" class="q-ml-sm" />
            <q-btn flat @click="refuser()" color="warning" :label="$t('APAdec2')" class="q-ml-sm" />
          </q-stepper-navigation>
        </q-step>

      </q-stepper>
    </q-card-section>
  </q-card>
</template>

<script>
import PhraseSecrete from '../components/PhraseSecrete.vue'
import EditeurMd from '../components/EditeurMd.vue'
import ShowHtml from '../components/ShowHtml.vue'
import { AcceptationParrainage, RefusParrainage } from '../app/connexion.mjs'
import { getJourJ, edvol } from '../app/util.mjs'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'

export default ({
  name: 'AcceptParrain',

  props: { couple: Object, phch: Number, close: Function, clepubc: Object, datactc: Object },
  /*
  `datactc` :
  - `cc` : clé du couple (donne son id).
  - `nom` : nom de A1 pour première vérification immédiate en session que la phrase est a priori bien destinée à cet avatar. Le nom de A1 figure dans le nom du couple après celui de A0.
  - Pour un parrainage seulement
    - `nct` : `[nom, rnd]` nom complet de la tribu.
    - `parrain` : true si parrain
    - `forfaits` : `[f1, f2]` forfaits attribués par le parrain.
  - Pour une rencontre seulement
    - `idt` : id de la tribu de A0 SEULEMENT SI A0 en est parrain.
  */

  components: { PhraseSecrete, EditeurMd, ShowHtml, ChoixQuotas },

  computed: {
    estpar () { return this.datactc && this.datactc.parrain },
    nomTribu () { return this.datactc ? this.datactc.nct[0] : '' },
    textedef () { return this.$t('merci', [this.couple.nomEs + ',\n\n' + this.couple.ard]) },
    valid () { return this.couple.dlv - this.jourJ},
  },

  data () {
    return {
      isPwd: false,
      jourJ: getJourJ(),
      max: [1, 1],
      step: 1,
      ps: null,
      apsf: false,
      texte: '',
      npi: false
    }
  },

  methods: {
    ed1 (f) { return edvol(f * UNITEV1) },
    ed2 (f) { return edvol(f * UNITEV2) },
    fermer () {
      this.razps()
      this.texte = ''
      this.apsf = false
      this.step = 1
      this.isPwd = false
      this.ps = null
      if (this.close) this.close()
    },
    razps () {
      if (this.ps) {
        this.ps.debut = ''
        this.ps.fin = ''
      }
    },
    okps (ps) {
      if (ps) {
        this.ps = ps
        this.step = 3
      }
    },
    async confirmer () {
      const arg = { ps: this.ps, ard: this.texte, phch: this.phch, max: this.max, estpar: this.estpar, clepubc: this.clepubc, npi: this.npi }
      this.razps()
      await new AcceptationParrainage().run(this.couple, this.datactc, arg)
      this.fermer()
    },
    async refuser () {
      this.razps()
      await new RefusParrainage().run(this.couple, this.phch, this.texte)
      this.fermer()
    }
  },

  setup () {
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.border1
  border: 1px solid grey
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
