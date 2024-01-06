<template>
<q-page>
  <!-- Tab "groupe" -------------------------------------------------->
  <div v-if="ui.pagetab==='groupe' && gSt.egrC" class="q-pa-sm spmd">
    <apercu-groupe class="q-my-sm" :eg="gSt.egrC" :idx="0"/>
  </div>

  <!-- Tab "membres" -------------------------------------------------->
  <div v-if="ui.pagetab==='membres' && gSt.egrC" class="q-pa-sm spmd">
    <div v-if="amb">
      <div v-if="!nb" class="titre-lg text-italic">
        {{$t('PGnope')}}</div>
      <div v-if="nb && !lst.length" class="titre-lg text-italic">
        {{$t('PGnomb', [nb])}}</div>
      <apercu-membre v-for="(e, idx) of lst" :key="e.im"
        class="q-my-lg" :mb="e.m" :im="e.im" :na="e.na" :eg="gSt.egrC"
        people :idx="idx"/>
    </div>
    <div v-else class="titre-lg text-italic">{{$t('PGnoamb')}}</div>
  </div>

</q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import ApercuMembre from '../components/ApercuMembre.vue'
import ApercuGroupe from '../components/ApercuGroupe.vue'

export default {
  name: 'PageGroupe',

  components: { ApercuMembre, ApercuGroupe },

  computed: {
    amb () { return this.gSt.ambano[0] },
    lst () { return this.gSt.pgLmFT[0] },
    nb () { return this.gSt.pgLmFT[1] }
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup () {
    return {
      ui: stores.ui,
      session: stores.session,
      gSt: stores.groupe
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
