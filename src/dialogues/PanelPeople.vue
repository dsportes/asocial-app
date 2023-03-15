<template>
<q-layout container view="hHh lpR fFf" :class="sty" style="width:80vw">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtit', [p.na.nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-card style="min-height:50vh" class="q-pa-sm">
      <apercu-people :id=id />
    </q-card>
  </q-page-container>
</q-layout>
</template>
<script>

import { toRef, ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuPeople from '../components/ApercuPeople.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
// import { IDCOMPTABLE } from '../app/api.mjs'
// import { afficherDiag } from '../app/util.mjs'
// import { getNg } from '../app/modele.mjs'

export default {
  name: 'PanelPeople',
  components: { ApercuPeople, BoutonHelp },

  props: { id: Number, close: Function },

  computed: {
  },

  watch: {
  },
  
  data () {
    return {
    }
  },

  methods: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    fermer () { if (this.close) this.close() }
  },

  setup (props) {
    const ui = stores.ui
    const id = toRef(props, 'id')
    const session = stores.session
    const pStore = stores.people

    const p = ref(pStore.getPeople(id.value))
    return {
      session,
      p
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bord2p
  border-radius: 3px
  border: 2px solid $warning
  font-weight: bold
  padding: 1px 3px
.ptim
  font-variant: small-caps
.menu
  min-width: 15rem
  padding: 3px
  border-radius: 3px
  border: 1px solid $grey-5
</style>
