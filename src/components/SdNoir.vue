<template>
  <vue-showdown class="markdown-body mdclair" :markdown="texte" :key="texte" flavor="github" :options="{ emoji: true }" />
</template>

<script setup>
import { VueShowdown } from 'vue-showdown'

const props = defineProps({ 
  texte: String
})
</script>

<style lang="css" scoped>
.markdown-body {
  font-family:  "Ubuntu Sans" !important;
  background-color: transparent !important;
  color: black !important;
  line-height: 1.4rem;
  font-size: 0.9rem;
  font-weight: 200;
}
@import 'github-markdown-css/github-markdown-light.css'
</style>

<style lang="sass">
p
  font-weight: 400 !important
.mdclair pre
  background-color: #DDDDDD !important
.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5
  font-family: Comfortaa
  font-weight: 200
h1, h2, h2, h3, h4, h5, h6 
  color: $mdtitre !important
h1
  font-size: 1.5em !important
h2
  font-size: 1.3em !important
h3
  font-size: 1.15em !important
a
 color: $positive !important
</style>
