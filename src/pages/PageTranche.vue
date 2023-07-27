<template>
  <q-page class="column">
    <!--div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div-->

    <div class="sep2"/>

    <div class="titre-lg text-italic">Liste des sponsors et des comptes</div>
    
    <q-page-sticky position="top-left" :class="dkli(0) + ' box'" :offset="pow === 1 ? [0,25] : [0,0]">
      <div class="column" style="width:100vw">
      <div class="q-pa-xs largeur40" style="overflow:auto;height:12.5rem">
        <detail-tribu class="q-pa-xs" :ligne="ligne" :henrem="10"/>
        <q-toolbar class="full-width bg-secondary text-white">
          <q-toolbar-title class="titre-md q-ma-xs">{{$t('ESltr')}}</q-toolbar-title>          
          <q-btn v-if="pow===2" size="md" dense color="primary" 
            :label="$t('PTnv')" @click="ouvrirnt"/>
        </q-toolbar>
      </div>
      </div>
    </q-page-sticky>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import DetailTribu from '../components/DetailTribu.vue'

export default {
  name: 'PageTranche',
  components: { DetailTribu },

  props: { },

  computed: {
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
  },

  data () {
    return {
    }
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const ligne = ref(aSt.tribuC.synth)
    const pow = session.pow

    return {
      session, aSt, pow,
      ligne
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.sep2
  margin-top: 13rem
</style>
