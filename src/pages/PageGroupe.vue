<template>
<q-page>
  <!-- Tab "groupe" -------------------------------------------------->
  <div v-if="ui.pagetab==='groupe'" class="q-pa-sm largeur40 maauto">
    <apercu-groupe class="q-my-sm" :eg="gSt.egrC" :idx="0" :mapmc="mapmc"/>
  </div>

  <!-- Tab "membres" -------------------------------------------------->
  <div v-if="ui.pagetab==='membres'" class="q-pa-sm largeur40 maauto">
    <div v-if="!gSt.pgLm.length" class="titre-lg text-italic">
      {{$t('PGnope')}}</div>
    <div v-if="gSt.pgLm.length && !gSt.pgLmFT.length" class="titre-lg text-italic">
      {{$t('PGnomb', [gSt.pgLm.length])}}</div>

    <!--
      props: { 
        mb: Object,
        eg: Object,
        mapmc: Object,
        idx: Number, 
        people: Boolean,
        nopanel: Boolean // Ne pas mettre le bouton menant à PanelMembre
      },
    -->
    <apercu-membre v-for="(m, idx) of gSt.pgLmFT" :key="idx"
      class="q-my-lg" :mb="m" :eg="gSt.egrC" :mapmc="mapmc" people :idx="idx"/>
  </div>

</q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuMembre from '../components/ApercuMembre.vue'
import ApercuGroupe from '../components/ApercuGroupe.vue'
import { Motscles } from '../app/modele.mjs'

export default {
  name: 'PageGroupe',

  components: { ApercuMembre, ApercuGroupe },

  computed: {
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const gSt = stores.groupe
    const fStore = stores.filtre

    const mapmc = ref(Motscles.mapMC(true, 0))
    fStore.contexte.groupes.mapmc = mapmc.value
    fStore.contexte.groupes.groupeId = 0

    return {
      ui,
      session,
      mapmc,
      gSt
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
