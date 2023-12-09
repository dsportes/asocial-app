<template>
<div>
  <div v-if="gSt.invits.size" class="petitelargeur maauto">
    <div class="titre-md text-italic bg-primary text-white q-mt-md text-center">{{$t('ICtit')}}</div>
    <div v-for="[k, inv] of gSt.invits" :key="k" 
      class="q-mx-md row invs" @click="ouvaccinv(inv)">
      <div class="col-6">{{inv.na.nom}}</div>
      <div class="col-6">{{inv.ng.nom}}</div>
    </div>
  </div>

  <!-- Acceptation de l'invitation -->
  <invitation-acceptation v-if="ui.d.IAaccinvit" :idg="inv.ng.id" :im="inv.im" :na="inv.na"/>

</div>
</template>
<script>

import stores from '../stores/stores.mjs'
import { FLAGS } from '../app/api.mjs'
import InvitationAcceptation from './InvitationAcceptation.vue'

export default ({
  name: 'InvitationsEncours',

  components: { InvitationAcceptation },

  props: { },

  computed: {
  },

  data () { return {
    inv: null,
  }},

  methods: {
    async ouvaccinv (inv) {
      if (!await this.session.edit()) return
      this.inv = inv
      this.ui.oD('IAaccinvit')
    }
  },
  
  setup () {
    const session = stores.session
    const ui = stores.ui
    const gSt = stores.groupe

    return {
      session, ui, gSt, FLAGS
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.invs:hover
  background-color: $secondary
  color: white
  cursor: pointer
</style>
