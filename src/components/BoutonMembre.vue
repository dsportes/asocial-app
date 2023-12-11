<template>
  <q-btn v-if="btn" class="btn2" dense size="md" no-caps icon-right="open_in_new" 
    :label="mb" @click="detailMb"/>
  <span v-else>{{mb}}</span>
</template>

<script>
import stores from '../stores/stores.mjs'

export default ({
  name: 'BoutonMembre',

  components: { },

  props: { 
    eg: Object, // Objet entrée groupe
    im: Number,  // indice du membre
    btn: Boolean // afficher un bouton
  },

  computed: {
    mb () {
      const an = this.eg.groupe.estAnim(this.im)
      const m = this.eg.membres.get(this.im)
      const na1 = m ? m.na : null
      const na2 = this.aSt.compte.naDeIdgIm(this.eg.groupe.id, this.im)
      const na = na1 || na2
      const x = !na ? ('#' + this.im) : (na.nomc + (na2 ? ' [' + this.$t('moi') + ']': ''))
      return  x + (an ? ' - ' + this.$t('animateur') : '')
    }
  },

  methods: {
    detailMb () {
      this.session.groupeId = this.eg.groupe.id
      this.session.setMembreId(this.im)
      this.ui.oD('PMdetailsmembre')
    }
  },
  
  setup (props) {
    const aSt = stores.avatar
    const session = stores.session
    const ui = stores.ui
    return {
      session, aSt, ui
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
