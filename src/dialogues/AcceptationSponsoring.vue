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
    <q-page>
      <div :class="'titre-md text-' + clr(sp)">{{$t('NPst' + sp.st, [dhcool(sp.dh)])}}</div>
      <div class="titre-md">{{$t('NPphr')}}
        <span class="q-ml-sm font-mono text-bold fs-md">{{pc.phrase}}</span>
      </div>
      <div class="titre-md">{{$t('NPdlv')}}
        <span class="q-ml-sm font-mono text-bold fs-md">{{dlved(sp)}}</span>
      </div>
      <div class="titre-md">{{$t('NPnom')}}
        <span class="text-bold font-mono q-px-md">{{sp.naf.nom}}</span>
      </div>

      <div class="col-auto column items-center q-mr-sm">
        <img class="photomax" :src="sp.na.photoDef" />
      </div>
      <div class="col">
        <div>
          <span class="text-bold fs-md q-mr-sm">{{sp.na.nom}}</span> 
          <span class="text-bold fs-sm font-mono q-mr-sm">#{{na.id}}</span> 
        </div>
        <show-html v-if="info" class="q-my-xs bord" :idx="idx" 
          zoom maxh="4rem" :texte="info"/>
        <div v-else class="text-italic">{{$t('FAnocv')}}</div>
      </div>

      <div class="titre-md">{{$t('NPtribu')}}
        <span class="text-bold font-mono q-px-md">{{sp.nct.nom}}</span>
        <span v-if="sp.descr.sp" class="text-italic q-px-md">{{$t('NPspons')}}</span>
      </div>
      <div class="titre-md">{{$t('NPquo')}} :
        <span class="font-mono q-pl-md">v1: {{ed1(sp.quotas[0])}}</span>
        <span class="font-mono q-pl-lg">v2: {{ed2(sp.quotas[1])}}</span>
      </div>
      <div class="titre-md q-mt-xs">{{$t('NPmot')}}</div>
      <show-html class="q-mb-xs bord" zoom maxh="4rem" :texte="sp.ard"/>
<!--
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
  -->
    </q-page>
  </q-page-container>
</q-layout>
</template>

<script>
import PhraseSecrete from '../components/PhraseSecrete.vue'
import EditeurMd from '../components/EditeurMd.vue'
import ShowHtml from '../components/ShowHtml.vue'
import { AcceptationParrainage, RefusParrainage } from '../app/connexion.mjs'
import { getJourJ, edvol } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'

export default ({
  name: 'AcceptationSponsoring',

  props: { sp: Object, pc: Object, close: Function, clepubc: Object },
  /*
  pc : object Phrase (?)
  clepubc : clé publique du comptable
  sp : objet Sponsoring décodé
    - `ard`: ardoise.
    - 'dlv': 
    - `na` : du sponsor P.
    - `cv` : du sponsor P.
    - `naf` : na attribué au filleul.
    - `nct` : de sa tribu.
    - `sp` : vrai si le filleul est lui-même sponsor (créé par le Comptable, le seul qui peut le faire).
    - `quotas` : `[v1, v2]` quotas attribués par le parrain.
  */

  components: { /* PhraseSecrete, EditeurMd, */ ShowHtml },

  computed: {
    estpar () { return this.sp.sp },
    nomTribu () { return this.sp.nct[0] || '' },
    textedef () { return this.$t('merci', [this.sp.na[0] + ',\n\n' + this.ard]) },
    valid () { return this.sp.dlv},
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
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
    dlved (sp) { 
      return new DateJour(sp.dlv).aaaammjj
    },
    clr (sp) { return ['primary', 'warning', 'green-5', 'negative'][sp.st] },
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
