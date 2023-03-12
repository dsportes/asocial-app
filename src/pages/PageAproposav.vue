<template>
<q-page class="column items-center q-pa-md">

  <q-card class="largeur40 fs-md">
    <fiche-avatar edit :na="session.avC.na"/>
  </q-card>

</q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import FicheAvatar from '../components/FicheAvatar.vue'

export default {
  name: 'PageAproposav',

  components: { FicheAvatar },

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
