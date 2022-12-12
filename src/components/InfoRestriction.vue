<template>
  <div v-if="cas" :class="cl" @click="clic">{{$t('IR' + cas)}}</div>
</template>

<script>
import stores from '../stores/stores.mjs'

export default ({
  name: 'InfoRestriction',
  props: { niveau: Number, cnx: Boolean },
  computed: {
    cl () { return 'text-bold bg-yellow-6 text-negative q-px-xs fs-sm' + (this.cas > 0 && this.cas < 4 ? ' cursor-pointer' : '') },
    cas () {
      if (this.cnx && this.session.avion) return 4
      if (this.session.blocage >= this.niveau) return this.session.blocage - 1
      return 0
    }
  },
  methods: {
    clic () { if (this.cas > 0 && this.cas < 4) this.session.infoBlocage = true }
  },

  data () {
    return {
    }
  },

  setup () {
    return {
      session: stores.session
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
