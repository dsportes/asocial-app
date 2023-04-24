<template>
  <div class="row">
    <div class="row col-auto">
      <div class="font-mono fs-lg q-mx-sm">{{esp.id}}</div>
      <div class="font-mono fs-lg q-mx-sm">{{esp.t}}</div>
    </div>
    <div class="col column">
      <div class="text-italic">Pas de notification de l'administrateur</div>
      <div class="text-italic">Pas de notification du Comptable de l'espace</div>
    </div>
  </div>
</template>

<script>
import stores from '../stores/stores.mjs'

export default {
  name: 'ApercuEspace',

  props: { esp: Object, idx: Number },

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
