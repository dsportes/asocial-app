<template>
  <span>{{mb}}</span>
  <q-btn v-if="btn" class="q-ml-lg" dense round padding="none" size="md" icon="open_in_new" 
    color="primary" @click="detailMb"/>
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
</style>
