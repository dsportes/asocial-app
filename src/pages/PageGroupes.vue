<template>
  <q-page class="q-pa-sm">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <q-btn class="q-my-sm" size="md" flat dense color="primary" 
      :label="$t('PGnv')" @click="ouvrirnt"/>

    <div class="petitelargeur q-my-sm">
      <div class="row">
        <div class="col-6"></div>
        <div class="col-3 fs-md text-italic text-center">V1</div>
        <div class="col-3 fs-md text-italic text-center">V2</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PGvut')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ed1(stats.groupes.v1)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ed2(stats.groupes.v2)}}</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PGvq')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ stats.groupes.q1 + ' / ' + edq1(stats.groupes.q1)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ stats.groupes.q2 + ' / ' + edq2(stats.groupes.q2)}}</div>
      </div>
    </div>

    <q-separator color="orange"/>
    <div v-if="!gSt.pgLgFT.length" class="titre-lg text-italic">
      {{$t('PGvide', [gSt.pgLg.size])}}
    </div>

    <div v-if="gSt.pgLgFT.size">
      <div v-for="(e, idx) in gSt.listeGrFT" :key="e.groupe.id">
        <div class="row items-start">
          <q-btn flat icon="navigate_next" size="lg" class="col-auto q-mr-sm"
            :color="e.groupe.id === session.groupeId ? 'warning' : 'primary'" @click="courant(e)"/>
          <apercu-groupe class="q-my-sm" :eltg="e" :idx="idx"/>
        </div>
      </div>
    </div>

  </q-page>
</template>

<script>
import { toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { edvol } from '../app/util.mjs'

export default {
  name: 'PageGroupes',

  props: { tous: Boolean },

  computed: {
  },

  methods: {
    edq1 (n) { return edvol(n * UNITEV1) },
    edq2 (n) { return edvol(n * UNITEV2) },
    ed1 (n) { return edvol(n) },
    ed2 (n) { return edvol(n) },

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
    const stats = stores.filtre.stats
    return {
      ui: stores.ui,
      session: stores.session,
      stats,
      gSt
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
