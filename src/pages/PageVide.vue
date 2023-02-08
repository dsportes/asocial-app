<template>
  <q-page>
  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'

export default {
  name: 'PageCompte',

  computed: {
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup () {
    return {
      ui: stores.ui,
      session: stores.session
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
