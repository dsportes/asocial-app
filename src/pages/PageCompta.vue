<template>
<q-page class="column items-center q-pa-md">

  <panel-compta :c="session.compta.compteurs"/>

</q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import PanelCompta from '../components/PanelCompta.vue'

export default {
  name: 'PageCompta',

  components: { PanelCompta },

  data () {
    return {
    }
  },

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
.q-card__section
  padding: 0 !important
</style>
