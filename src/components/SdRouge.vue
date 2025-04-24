<template>
  <vue-showdown class="markdown-body" :markdown="texte" :key="texte" flavor="github" :options="{ emoji: true }" />
</template>

<script setup>
import { VueShowdown } from 'vue-showdown'

const props = defineProps({
  texte: String
})

</script>

<style lang="css" scoped>
@import 'github-markdown-css/github-markdown-dark.css';

.markdown-body {
  font-family:  "Ubuntu Sans" !important;
  background-color: transparent !important;
  color: red !important;
  line-height: 1rem;
  font-size: 0.9rem;
  font-weight: 200;
}
</style>

<style lang="sass">
.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5
  font-family: Comfortaa
  font-weight: 400
</style>
