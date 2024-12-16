<template>
<q-dialog v-model="model" position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp(size || 'md')">
    <q-header elevated class="tbs">
      <q-toolbar>
        <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{titre}}</q-toolbar-title>
        <bouton-help v-if="help" :page="help"/>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <slot/>
    </q-page-container>
  </q-layout>
</q-dialog>
</template>

<script setup>
import stores from '../stores/stores.mjs'
import BtnCond from '../components/BtnCond.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { styp } from '../app/util.mjs'

const model = defineModel({
})

const props = defineProps({
  titre: String, // titre de la top bar
  size: String, // md si absent
  help: String  // code de loa page d'aide s'il y en a une
})

const ui = stores.ui

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
