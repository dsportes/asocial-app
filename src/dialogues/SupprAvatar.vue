<template>
<div class="bs" style="width:80vw">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
      <q-toolbar-title v-if="avid!==0" class="titre-lg full-width text-center">{{$t('SAVtit', [na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-else class="titre-lg full-width text-center text-bold bg-yellow-5 text-negative">
        {{$t('SAVtit2', [na.nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page :class="dkli">

    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { ref, toRef } from 'vue'
import { MD, getNg } from '../app/modele.mjs'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'

export default ({
  name: 'SupprAvatar',

  props: { avid: Number },

  components: { BoutonHelp },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' }
  },

  data () {
    return {
    }
  },

  watch: {
  },

  methods: {
  },

  setup (props) {
    const session = stores.session
    const avid = toRef(props, 'avid')
    const na = ref(getNg(avid.value ? avid.value : session.compteId))
    const aSt = stores.avatar

    return {
      MD, aSt, na
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.q-btn
  padding: 0 !important
</style>
