<template>
  <q-card class="q-pa-xs fs-md largeur40">
    <q-toolbar class="bg-secondary text-white">
      <q-toolbar-title class="titre-md q-ml-sm">{{$t('SYtit')}}</q-toolbar-title>
      <q-btn v-if="close" dense size="md" color="warning" icon="close" 
        @click="ui.rapportSynchroMenu = false"/>
    </q-toolbar>
    <q-card-section style="q-mt-md max-height:70vh;overflow:auto">
      <div v-for="item in syncitem.liste" :key="item.k" class="row no-wrap items-start">
        <q-icon class="col-1" size="sm" :name="item.st ? 'done' : 'arrow_right'"/>
        <div class="col-11">{{$t(item.label, item.args)}}</div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import stores from '../stores/stores.mjs'

export default ({
  name: 'RapportSynchro',

  props: { close: Boolean },

  setup () {
    return {
      session: stores.session,
      ui: stores.ui,
      syncitem: stores.syncitem
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
