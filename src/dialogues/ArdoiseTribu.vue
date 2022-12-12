<template>
  <q-card class="moyennelargeur">
    <q-toolbar class="bg-secondary text-white">
      <bouton-help page="page1"/>
      <q-toolbar-title class="titre-md q-pl-sm">{{$t('ARDtit', [naTribu.nom, idCompte])}}</q-toolbar-title>
      <q-btn dense size="md" color="warning" icon="close" @click="ui.ardoiseTribu = false"/>
    </q-toolbar>

    <q-card-section>
      <div>To Do</div>
    </q-card-section>
  </q-card>
</template>

<script>
import { toRef } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { getNg } from '../app/modele.mjs'

export default ({
  name: 'ArdoiseTribu',
  components: { BoutonHelp },

  computed: {
    idCompte () { return this.naCompte ? this.naCompte.nomc : this.compta.id }
  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const compta = ui.ardoiseTCompta
    const naTribu = ui.ardoiseTNaTribu
    const naCompte = getNg(compta.id)
    return { 
      session,
      ui,
      compta,
      naTribu,
      naCompte
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
