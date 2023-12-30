<template>
<q-dialog v-model="ui.d.PMdetailsmembre" full-height position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
      <q-toolbar-title v-if="mb" class="titre-lg text-center q-mx-sm">{{$t('PMGtit', [mb.na.nomc, eg.groupe.na.nomc])}}</q-toolbar-title>
      <q-toolbar-title v-else class="titre-lg text-center q-mx-sm">{{$t('PMGtit1')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-card>
      <apercu-genx class="q-pa-sm q-mb-sm" v-if="eg" :id="eg.groupe.id"/>
      <apercu-membre v-if="eg && mb" :im="session.membreId" :na="mb.na"
        :eg="eg" :mb="mb" :idx="0" :mapmc="mapmc" :people="people" ouvert/>
    </q-card>
  </q-page-container>

</q-layout>
</q-dialog>
</template>
<script>

import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { Motscles } from '../app/modele.mjs'
import { styp } from '../app/util.mjs'

import BoutonHelp from '../components/BoutonHelp.vue'

// Niveau 5
import ApercuGenx from '../components/ApercuGenx.vue'

// Niveau 7
import ApercuMembre from '../components/ApercuMembre.vue'

export default {
  name: 'PanelMembre',
  components: { BoutonHelp, ApercuGenx, ApercuMembre },

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
    const aSt = stores.avatar
    const session = stores.session
    const ui = stores.ui

    const mapmc = ref()
    const eg = ref()
    const amb = ref()
    const mb = ref()
    const people = ref()

    function init () {
      mapmc.value = Motscles.mapMC(true, 0)
      eg.value = gSt.egrC
      amb.value = gSt.ambano[0]
      mb.value = eg.value && amb.value ?  gSt.membreC : null
      people.value = mb.value ? !mb.value.estAc : false
    }

    session.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setGroupeId' || name === 'setMembreId') init()
      })
    })

    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setCompte') init()
      })
    })

    init()
    
    return {
      ui, session, styp,
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
