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
    <synthese-blocage :bl-tr="blTr && !blTr.fake ? blTr : null" :bl-co="blCo"/>
    <q-card-section v-if="edit">
      <q-separator/>
      <div v-if="bloc.dh">
        <span class="titre-md text-italc">{{$t('SBreset')}}</span>
        <q-btn color="primay" size="md" class="q-ml-md" icon="check" @click="reset"/>
      </div>
      <div :class="'q-mt-sm text-italic fs-md ' + (err ? 'text-warning bg-yellow-3' : '')">{{$t('SBdiag')}}</div>
      <q-input dense class="inp1 q-my-sm" v-model="nja" type="number" :label="$t('SBnja')"/>
      <q-input dense class="inp1 q-my-sm" v-model="njl" type="number" :label="$t('SBnjl')"/>
    </q-card-section>
    <div v-if="edit" class="column items-center">
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
import { SetAttributTribu } from '../app/operations.mjs'

export default {
  name: 'EdBlocage',

  components: { SyntheseBlocage, BoutonHelp },

  /*
   1) blTr et blCo : édition de blCo,
      vue de synthèse avec le blocage tribu blTr
   2) blTr.fake et blCo: édition de blCo,
      IL N'Y A Pas de blocage tribu
   3) blTr (sans blCo): édition de blTr seul
  */
  props: { blTr: Object, blCo: Object, naTr: Object, naCo: Object, edit: Boolean, close: Function },

  computed: {
    err () { return this.bloc.nja < 0 || this.bloc.njl < 0 || (this.bloc.nja + this.bloc.njl >= 365) }
  },

  watch: {
    nja (ap) {
      this.bloc.nja = parseInt(ap)
      this.bloc.recalculBloc()
    },
    njl (ap) {
      this.bloc.njl = parseInt(ap)
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
      const buf = this.bloc.encode()
      const val = await crypter(this.na.rnd, buf)
      await new SetAttributTribu().run(this.na.id, 'blocaget', val)
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
    const cas = ref(blCo.value ? (blTr.value && blTr.value.fake ? 2 : 1) : 3)
    const na = ref(blCo.value ? naCo.value : naTr.value)
    const bloc = ref(blCo.value || blTr.value)
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
