<template>
<q-page>
  <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

  <!-- Tab "groupe" -------------------------------------------------->
  <div v-if="ui.pagetab==='groupe' && gSt.egrC" class="q-pa-sm largeur40 maauto">
    <apercu-groupe class="q-my-sm" :eg="gSt.egrC" :idx="0" :mapmc="mapmc"/>
  </div>

  <!-- Tab "membres" -------------------------------------------------->
  <div v-if="ui.pagetab==='membres' && gSt.egrC" class="q-pa-sm largeur40 maauto">
    <div v-if="amb">
      <div v-if="!gSt.pgLm.length" class="titre-lg text-italic">
        {{$t('PGnope')}}</div>
      <div v-if="gSt.pgLm.length && !gSt.pgLmFT.length" class="titre-lg text-italic">
        {{$t('PGnomb', [gSt.pgLm.length])}}</div>
      <apercu-membre v-for="(m, idx) of gSt.pgLmFT" :key="m.na.id"
        class="q-my-lg" :mb="m" :im="m.ids" :idav="m.na.id" :eg="gSt.egrC"
        :mapmc="mapmc" people :idx="idx"/>
    </div>
    <div v-else class="titre-lg text-italic">{{$t('PGnoamb')}}</div>
  </div>

</q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuMembre from '../components/ApercuMembre.vue'
import ApercuGroupe from '../components/ApercuGroupe.vue'
import { Motscles } from '../app/modele.mjs'

export default {
  name: 'PageGroupe',

  components: { ApercuMembre, ApercuGroupe },

  computed: {
    amb () { return this.gSt.ambano[0] }
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const gSt = stores.groupe
    const fStore = stores.filtre

    const grIdAv = stores.session.groupeId // Id du groupe courant A L'ENTREE dans la page

    session.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setGroupeId') {
          if (args !== grIdAv) ui.setPage('groupes')
        }
      })
    })

    const mapmc = ref(Motscles.mapMC(true, 0))
    fStore.setContexte('groupes', { mapmc: mapmc.value, groupeId : 0})

    return {
      ui,
      session,
      mapmc,
      gSt
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
</style>
