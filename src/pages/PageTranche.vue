<template>
  <q-page>
    <detail-tribu :ligne="ligne" :henrem="10"/>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import DetailTribu from '../components/DetailTribu.vue'

export default {
  name: 'PageTranche',
  components: { DetailTribu },

  props: { },

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
    const aSt = stores.avatar
    const ligne = ref(aSt.tribuC.synth)

    return {
      session, aSt,
      ligne
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
