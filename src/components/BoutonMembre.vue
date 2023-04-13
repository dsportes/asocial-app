<template>
  <q-btn v-if="btn" class="btn1" dense size="md" icon="open_in_new" color="primary" 
    @click="detailMb"/>
  <q-btn v-else class="btn2" dense size="md" no-caps icon-right="open_in_new" 
    :label="mb" @click="detailMb"/>
</template>

<script>
import stores from '../stores/stores.mjs'

export default ({
  name: 'BoutonMembre',

  props: { 
    eg: Object, // Objet entrée groupe
    im: Number,  // indice du membre
    btn: Boolean // n'afficher que le bouton (sans le nom)
  },

  computed: {
    mb () {
      const m = this.eg.membres.get(this.im)
      return m.na.nomc + (m.estAC ? ' [' + $t('moi') + ']': '')
    }
  },

  methods: {
    detailMb (im) {
      this.ui.detailsmembre = true
      this.session.groupeId = this.eg.groupe.id
      this.session.setMembreId(this.im)
    }
  },
  
  setup (props) {
    return {
      session: stores.session,
      ui: stores.ui
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.btn1
  padding: 1px !important
.btn2
  padding: 0 2px !important
  border-bottom: 1px solid $primary
</style>
