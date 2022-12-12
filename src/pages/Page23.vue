<template>
  <q-page class="column">
    <div class="titre-lg text-center">Groupes de l'avatar courant</div>
  </q-page>
</template>

<script>
// import { watch, computed } from 'vue'
import stores from '../stores/stores.mjs'

export default {
  name: 'Page10',

  components: {  },

  methods: {
  },

  setup () {
    const session = stores.session

    return {
      session
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>

