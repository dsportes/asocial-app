<template>
<q-layout container view="hHh lpR fFf" :class="sty + bcf" style="width:80vw">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
      <q-toolbar-title v-if="mb" class="titre-lg text-center q-mx-sm">{{$t('PMGtit', [mb.na.nomc, eg.groupe.na.nomc])}}</q-toolbar-title>
      <q-toolbar-title v-else class="titre-lg text-center q-mx-sm">{{$t('PMGtit1')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-card>
      <apercu-membre class="q-pa-sm" v-if="eg && mb"
        :eg="eg" :mb="mb" :idx="0" :mapmc="mapmc" :people="people" nopanel/>
      <q-toolbar class="bg-secondary text-white">
        <q-toolbar-title v-if="eg" class="titre-lg text-center q-mx-sm">{{$t('PMGtit3', [eg.groupe.na.nomc])}}</q-toolbar-title>
        <q-toolbar-title v-else class="titre-lg text-center q-mx-sm">{{$t('PMGtit2')}}</q-toolbar-title>
      </q-toolbar>
      <apercu-groupe class="q-pa-sm" v-if="eg" :eg="eg" :idx="0" :mapmc="mapmc" />
    </q-card>
  </q-page-container>

</q-layout>
</template>
<script>

import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuGroupe from '../components/ApercuGroupe.vue'
import ApercuMembre from '../components/ApercuMembre.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { MD, Motscles } from '../app/modele.mjs'

export default {
  name: 'PanelPeople',
  components: { ApercuGroupe, BoutonHelp, ApercuMembre },

  props: { },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre ' : 'clair ' },
    bcf () { return this.$q.dark.isActive ? ' bordfonce' : ' bordclair' },
  },

  watch: {
  },
  
  data () {
    return {
    }
  },

  methods: {
  },

  setup () {
    const gSt = stores.groupe
    const session = stores.session
    const ui = stores.ui

    const mapmc = ref(Motscles.mapMC(true, 0))
    const eg = ref(gSt.egrC)
    const mb = ref(gSt.membreC)
    if (eg.value && !eg.value.groupe.ast[session.membreId]) mb.value = null
    const people = ref(mb.value ? !mb.value.estAc : false)

    return {
      MD,
      ui,
      mapmc,
      eg,
      mb,
      people
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
