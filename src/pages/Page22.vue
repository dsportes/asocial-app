<template>
  <q-page class="column">
    <div class="titre-lg text-center">{{$t('P22tit', [na.nomc])}}</div>
  </q-page>
</template>

<script>
// import { watch, computed } from 'vue'
import stores from '../stores/stores.mjs'
import { getNg } from '../app/modele.mjs'

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Page22',

  components: {  },

  computed: {
    av () { return this.session.avC },
    na () { return getNg(av.id) }
  },

  methods: {
  },

  setup () {
    return {
      session: stores.session,
      ui: stores.ui
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>

