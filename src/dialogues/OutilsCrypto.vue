<template>
  <q-card class="moyennelargeur fs-md">
    <q-toolbar class="bg-secondary text-white">
      <bouton-help page="page1"/>
      <q-toolbar-title class="titre-lg q-ml-sm">{{$t('OCtit')}}</q-toolbar-title>
      <q-btn dense size="md" color="warning" icon="close" @click="ui.outilsCrypto = false"/>
    </q-toolbar>

    <q-card-section>
      <q-btn flat :label="$t('OCt1')" color="primary" @click="testEcho"/>
      <q-btn class="q-ml-sm" flat :label="$t('OCt2')" color="primary" @click="testErr"/>
    </q-card-section>
    <q-separator/>
    <q-card-section>
      <phrase-secrete v-on:ok-ps="okps" icon-valider="check" label-valider="OK"></phrase-secrete>
    </q-card-section>
    <q-card-section class="q-ma-xs">
      <div class='t1 q-mt-sm'>{{$t('OCh1')}}</div>
      <div class='t2'>{{ ps ? ps.dpbh : '?'}}</div>
      <div class='t1 q-mt-sm'>{{$t('OCcx')}}</div>
      <div class='t2'>{{ ps ? ps.pcb64 : '?' }}</div>
      <div class='t1 q-mt-sm'>{{$t('OChcx')}}</div>
      <div class='t2'>{{ ps ? ps.pcbh : '?' }}</div>
    </q-card-section>
  </q-card>
</template>

<script>
import stores from '../stores/stores.mjs'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { EchoTexte, ErreurFonc } from '../app/connexion.mjs'
import { afficherDiag } from '../app/util.mjs'

export default ({
  name: 'OutilsCrypto',

  components: { PhraseSecrete, BoutonHelp },

  data () {
    return {
      ps: null
    }
  },

  methods: {
    okps (ps) {
      this.ps = ps
    },
    async testErr () {
      await new ErreurFonc().run(this.$t('OCer'), 1)
    },
    async testEcho () {
      const texte = this.$t('OCt1')
      const to = 1
      const r = await new EchoTexte().run(texte, to)
      afficherDiag(this.$t('OCec', [texte, r, to]))
    }
  },

  setup () {
    return {
      session: stores.session,
      ui: stores.ui
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.t1
  font-style: italic
  color: $primary
.t2
  font-family: 'Roboto Mono'
.q-toolbar
  min-height: 0 !important
  padding: 0 !important
</style>
