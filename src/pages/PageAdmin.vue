<template>
  <q-page>
    <div class="titre-lg q-ma-lg text-center">Page d'Administration</div>
  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'

export default {
  name: 'PageAdmin',

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
