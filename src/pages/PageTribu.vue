<template>
  <q-page>
    <apercu-tribu class="q-my-sm" :id="session.tribuCId || session.tribuId" :idx="0"/>
  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import ApercuTribu from '../components/ApercuTribu.vue'

export default {
  name: 'PageTribu',

  components : { ApercuTribu },

  computed: {
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
