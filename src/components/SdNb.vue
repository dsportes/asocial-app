<template>
<div>
  <sd-noir v-if="!$q.dark.isActive" :texte="texte"/>
  <sd-blanc v-else :texte="texte"/>
</div>
</template>

<script setup>
import SdNoir from './SdNoir.vue'
import SdBlanc from './SdBlanc.vue'

const props = defineProps({ 
  texte: String, 
  idx: Number // ???
})
</script>

<style lang="sass" scoped>
</style>
