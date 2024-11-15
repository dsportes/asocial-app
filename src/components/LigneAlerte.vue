<template>
<div class="q-my-sm row items-start">
  <icon-alerte class="col-1 text-center" :niv="niv"/>
  <div class="col-10 column">
    <div class="titre-md">{{$t(code)}}</div>
    <slot></slot>
  </div>
  <bouton-help v-if="hlp" class="col-1" page="hlp"/>
</div>
</template>

<script setup>
import IconAlerte from './IconAlerte.vue'
import BoutonHelp from './BoutonHelp.vue'

const props = defineProps({
  niv: Number,
  code: String,
  hlp: String
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>