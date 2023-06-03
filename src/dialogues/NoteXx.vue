<template>
<div class="bs" style="width:80vw">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">{{$t('NPtit')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page :class="dkli">
      <div v-if="er" class="column justify-center largeur30 ma-auto q-my-lg q-mx-sm">
        <div class="titre-md q-my-lg q-mx-sm">{{$t('PNOer' + er)}}</div>
        <q-btn color="primary" flat :label="$t('jailu')" @click="MD.fD"/>
      </div>

      <div v-else class="q-pa-sm">
        <div>TODO</div>

      </div>
    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'
import { afficherDiag } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'

export default {
  name: 'NoteXx',

  components: { BoutonHelp },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup () {
    const ui = stores.ui
    const session = stores.session
    const nSt = stores.note
    const er = ref(0)

    return {
      ui, session, nSt,
      er,
      MD
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
