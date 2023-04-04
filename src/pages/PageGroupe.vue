<template>
<q-page>
  <div v-if="ui.pagetab==='groupe'" class="q-pa-sm">
    <apercu-groupe class="q-my-sm" :eltg="gSt.egrC" :idx="0"/>
  </div>

  <div v-if="ui.pagetab==='membres'" class="q-pa-sm">
    <div v-if="!gSt.pgLm.length" class="titre-lg text-italic">
      {{$t('PGnope')}}</div>
    <div v-if="gSt.pgLm.length && !gSt.pgLmFT.length" class="titre-lg text-italic">
      {{$t('PGnomb', [gSt.pgLm.length])}}</div>

    <apercu-membrepe v-for="(m, idx) of gSt.pgLmFT" :key="idx"
      class="q-my-sm" :mb="m" :idx="idx"/>
  </div>

  <!-- Dialogue d'édition de la carte de visite -->
  <q-dialog v-model="editCv" persistent>
    <carte-visite :photo-init="eg.groupe.photo || photoDef" :info-init="eg.groupe.info" :na="eg.groupe.na"
      :close="closeCV" @ok="cvchangee"/>
  </q-dialog>

</q-page>
</template>

<script>
import stores from '../stores/stores.mjs'

export default {
  name: 'PageGroupe',

  computed: {
  },

  methods: {
    // Fonctions d'édition des éléments du groupe (boutons dans "apercu")
    async edit (cible) {
      if (!await this.session.edit()) return
      switch (cible) {
        case 'cv' : return await editerCV()
        case 'quotas' : return await editerQuotas()
        case 'vote' : return await editerVote()
        case 'heb' : return await editerHeb()
      }
    },
    async editerCV () { 
      if (!this.gSt.compteEstAnim(this.eg.groupe.id) ) {
        await afficherDiag(this.$t('PGnoan'))
        return
      }
      this.editCV = true
    },
    closeCV () { this.editCV = false },
    async cvchangee () {
      // TODO
    },
    async editerQuotas() {
      // TODO
    },
    async editerVote() { 
      // TODO
    },
    async editerHeb() { 
      // TODO
    },
  },

  data () {
    return {
      editCV: false
    }
  },

  setup () {
    const session = stores.session
    const gS = stores.groupe
    return {
      ui: stores.ui,
      session,
      gS
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
