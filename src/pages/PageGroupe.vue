<template>
  <q-page>

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
    return {
      ui: stores.ui,
      session: stores.session
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
