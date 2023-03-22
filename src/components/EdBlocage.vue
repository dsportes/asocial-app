<template>
  <q-card class="petitelargeur">
    <q-toolbar class="bg-secondary text-white">
      <q-btn dense size="md" color="warning" icon="close" @click="closebl"/>
      <q-toolbar-title class="column justify-center">
        <div class="titre-lg text-center">{{$t(bloc.dh ? 'SBdet' : 'SBnv', [na.nom])}}</div>
        <div v-if="cas===1" class="titre-md text-center text-italic">{{$t('SBtrib', [naTr.nom])}}</div>
      </q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>

    <synthese-blocage v-if="cas === 1" :bl-tr="blTr" :bl-co="bloc"/>
    <synthese-blocage v-if="cas === 2" :bl-tr="null" :bl-co="bloc"/>
    <synthese-blocage v-if="cas === 3" :bl-tr="bloc" :bl-co="null"/>

    <q-card-section v-if="edit">
      <q-separator/>
      <div v-if="bloc.dh" class="row items-center">
        <span class="titre-md text-italc">{{$t('SBreset')}}</span>
        <q-btn class="q-ml-md" color="primary" size="sm" icon="check" @click="reset()"/>
      </div>
      <div :class="'q-mt-sm text-italic fs-md ' + (err ? 'text-warning bg-yellow-3' : '')">{{$t('SBdiag')}}</div>
      <q-input dense clearable class="inp1 q-my-sm" v-model.number="nja" type="number" :label="$t('SBnja')">
      </q-input>
      <q-input dense clearable class="inp1 q-my-sm" v-model.number="njl" type="number" :label="$t('SBnjl')">
      </q-input>
    </q-card-section>
    <div v-if="edit" class="row items-center justify-around q-mb-md">
      <q-btn class="q-mt-sm" 
        icon="check" :label="$t('renoncer')" color="warning" @click="closebl"/>
      <q-btn class="q-mt-sm" :disabled="err"
        icon="check" :label="$t('valider')" color="primary" @click="valider"/>
      <q-btn v-if="bloc.dh" class="q-my-sm" :disabled="err"
        icon="close" :label="$t('SBdel')" color="warning" @click="supprimer"/>
    </div>
  </q-card>
</template>

<script>

import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import SyntheseBlocage from './SyntheseBlocage.vue'
import BoutonHelp from './BoutonHelp.vue'
import { crypter } from '../app/webcrypto.mjs'
import { SetAttributTribu, SetAttributTribu2 } from '../app/operations.mjs'
import { AMJ } from '../app/api.mjs'

export default {
  name: 'EdBlocage',

  components: { SyntheseBlocage, BoutonHelp },

  /*
   1) blTr et blCo : édition de blCo, vue de synthèse avec le blocage tribu blTr
   2) blCo: édition de blCo, IL N'Y A PAS de blocage tribu
   3) blTr: édition de blTr seul, IL N'Y A PAS de blocage compte
   naCompte : pour enregistrer le blocage dans Tribu2 dans l'entrée du compte
  */
  props: { blTr: Object, blCo: Object, 
    naTr: Object, // na de la tribu bloquée OU de la tribu du compte bloqué
    naCo: Object, // na du compte (blCo est présent et c'est le blocage "compte" qui est édité)
    edit: Boolean, close: Function },

  computed: {
    err () { return this.bloc.nja < 0 || this.bloc.njl < 0 || (this.bloc.nja + this.bloc.njl >= 365) }
  },

  watch: {
    nja (ap) {
      this.bloc.nja = ap || 0
      this.bloc.recalculBloc()
    },
    njl (ap) {
      this.bloc.njl = ap || 0
      this.bloc.recalculBloc()
    }
  },

  data () {
    return {
    }
  },

  methods: {
    reset () {
      this.bloc.jib = AMJ.amjUtc()
      this.bloc.recalculBloc()
    },
    async valider () {
      this.bloc.dh = new Date().getTime()
      const buf = this.bloc.encode()
      const val = await crypter(this.naTr.rnd, buf)
      if (this.blCo) {
        await new SetAttributTribu2().run(this.naTr.id, this.naCo, 'blocaget', val)
      } else {
        await new SetAttributTribu().run(this.naTr.id, 'blocaget', val)
      }
      // console.log(JSON.stringify(this.bloc))
      this.closebl()
    },
    async supprimer () {
      console.log(JSON.stringify(this.bloc))
    },
    closebl () { if (this.close) this.close()}
  },

  setup (props) {
    const session = stores.session
    const blCo = toRef(props, 'blCo')
    const blTr = toRef(props, 'blTr')
    const naCo = toRef(props, 'naCo')
    const naTr = toRef(props, 'naTr')
    const cas = ref(blCo.value ? (blTr.value ? 1 : 2) : 3)
    const na = ref(blCo.value ? naCo.value : naTr.value)
    const cl  = cas.value !== 1 ? blCo.value.clone() : blTr.value.clone()
    const bloc = ref(cl)
    const nja = ref(bloc.value.nja)
    const njl = ref(bloc.value.njl)

    return {
      session,
      nja,
      njl,
      cas,
      na,
      bloc
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.inp1
  width: 15rem
</style>
