<template>
<div>
  <sd-blanc v-if="(this.idx === undefined || this.idx % 2 === 0) && $q.dark.isActive" :texte="texte"/>
  <sd-noir v-if="(this.idx === undefined || this.idx % 2 === 0) && !$q.dark.isActive" :texte="texte"/>
</div>
</template>
<script>
import SdNoir from './SdNoir.vue'
import SdBlanc from './SdBlanc.vue'

export default ({
  name: 'SdNb',

  components: { SdNoir, SdBlanc },

  props: { 
    texte: String, 
    idx: Number
  }
})
</script>

<style lang="sass" scoped>
</style>
