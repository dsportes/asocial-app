<template>
  <vue-showdown class="markdown-body mdclair" :markdown="texte" :key="texte" flavor="github" :options="{ emoji: true }" />
</template>
<script>
import { VueShowdown } from 'vue-showdown'
export default ({
  name: 'SdLight',

  components: { VueShowdown },

  props: { texte: String }

})
</script>

<style lang="css" scoped>
.markdown-body {
  font-family:  Calibri-Light !important;
  background-color: #FDFDFD !important;
  color: #1D1D1D !important;
  line-height: 1.2rem;
}
@import 'github-markdown-css/github-markdown-light.css'
</style>

<style lang="sass">
.mdclair pre
  background-color: #DDDDDD !important
.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4, .markdown-body h5
  font-family: Comfortaa
</style>
