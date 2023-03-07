<template>
  <q-page>
    <apercu-tribu class="q-my-sm" :id="session.tribuCId || session.tribuId" :idx="0" :edit="ed"/>
  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import ApercuTribu from '../components/ApercuTribu.vue'

export default {
  name: 'PageTribu',

  components : { ApercuTribu },

  computed: {
    ed () { return this.session.estComptable || this.session.estSponsor }
  },

  methods: {
  },

  data () {
    return {
    }
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
