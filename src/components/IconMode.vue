<template>
  <q-avatar class="cursor-pointer q-mr-xs" size="sm" square>
    <q-icon v-if="session.synchro" color="white" size="sm" name="cloud_sync"/>
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
