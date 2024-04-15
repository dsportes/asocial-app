<template>
<div>
  <sd-noir v-if="idxPair || !$q.dark.isActive" :texte="texte"/>
  <sd-blanc v-else :texte="texte"/>
</div>
</template>
<script>
import SdNoir from './SdNoir.vue'
import SdBlanc from './SdBlanc.vue'

export default ({
  name: 'SdNb',

  components: { SdNoir, SdBlanc },

  computed: {
    idxPair () { return this.idx === undefined || this.idx % 2 === 0 }
  },

  props: { 
    texte: String, 
    idx: Number
  }
})
</script>

<style lang="sass" scoped>
</style>
