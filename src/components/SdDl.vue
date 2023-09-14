<template>
<div>
  <sd-dark v-if="idxu && $q.dark.isActive" :texte="texte"/>
  <sd-dark1 v-if="idxp && $q.dark.isActive" :texte="texte"/>
  <sd-light v-if="idxu && !$q.dark.isActive" :texte="texte"/>
  <sd-light1 v-if="idxi && !$q.dark.isActive" :texte="texte"/>
</div>
</template>
<script>
import SdLight from './SdLight.vue'
import SdDark from './SdDark.vue'
import SdLight1 from './SdLight1.vue'
import SdDark1 from './SdDark1.vue'

export default ({
  name: 'SdDl',

  components: { SdDark, SdLight, SdDark1, SdLight1 },

  props: { 
    texte: String, 
    idx: Number
  },

  computed: {
    idxu () { return this.idx === undefined },
    idxp () { return this.idx !== undefined && this.idx % 2 === 0 },
    idxi () { return this.idx !== undefined && this.idx % 2 !== 0 }
  },

  data () {
    return {
    }
  },

  methods: {
  },

  setup () {
    return {
    }
  }
})
</script>

<style lang="sass" scoped>
</style>
