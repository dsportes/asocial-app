<template>
  <q-page class="q-pa-sm">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <q-btn class="q-my-sm" size="md" flat dense color="primary" 
      :label="$t('PGnv')" @click="ouvrirnt"/>

    <div v-if="!avStore.ptLtFT.length" class="titre-lg text-italic">
      {{$t('PGvide', [gSt.listeGr.size])}}
    </div>

    <div v-if="gSt.listeGrFT.size">
      <div v-for="(e, idx) in gSt.listeGrFT" :key="e.groupe.id">
        <div class="row items-start">
          <q-btn flat icon="navigate_next" size="lg" class="col-auto q-mr-sm"
            :color="e.groupe.id === session.groupeId ? 'warning' : 'primary'" @click="courant(e)"/>
          <apercu-groupe class="q-my-sm" :eltg="e" :idx="idx" edit/>
        </div>
      </div>
    </div>

  </q-page>
</template>

<script>
import { toRef } from 'vue'
import stores from '../stores/stores.mjs'

export default {
  name: 'PageGroupes',

  props: { tous: Boolean },

  computed: {
  },

  methods: {
    async courant (elt) {
      this.session.setGroupeId(elt.groupe.id)
      this.ui.setPage('groupe')
    }
  },

  data () {
    return {
    }
  },

  setup (props) {
    const gSt = stores.groupe
    const tous = toRef(props, 'tous')
    stores.filtre.filtre.groupes.tous = tous.value || false
    return {
      ui: stores.ui,
      session: stores.session,
      gst
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
