<template>
  <q-btn v-if="btn && !lab" class="btn1" dense size="md" icon="open_in_new" color="primary" 
    @click="detailMb"/>
  <q-btn v-if="btn && lab" class="btn2" dense size="md" no-caps icon-right="open_in_new" 
    :label="mb" @click="detailMb"/>
  <span v-if="lab && !btn">{{mb}}</span>

  <panel-membre v-if="ui.d.PMdetailsmembre"/>
</template>

<script>
import stores from '../stores/stores.mjs'
import PanelMembre from '../dialogues/PanelMembre.vue'

export default ({
  name: 'BoutonMembre',

  components: { PanelMembre },

  props: { 
    eg: Object, // Objet entrée groupe
    im: Number,  // indice du membre
    lab: Boolean, // afficher le label (nom)
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
      this.ui.oD('PMdetailsmembre')
      this.session.groupeId = this.eg.groupe.id
      this.session.setMembreId(this.im)
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
