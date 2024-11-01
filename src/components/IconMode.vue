<template>
  <q-avatar class="cursor-pointer q-mr-xs" size="sm" square>
    <img v-if="session.synchro" src="~assets/sync_saved_locally.svg">
    <img v-if="session.incognito" src="~assets/incognito_blanc.svg">
    <q-icon v-if="session.avion" color="white" size="sm" name="airplanemode_active"/>
  </q-avatar>
</template>

<script setup>
import stores from '../stores/stores.mjs'
const session = stores.session 
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
