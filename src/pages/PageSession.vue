<template>
  <q-page>
    <rapport-synchro/>
  </q-page>
</template>

<script>
import RapportSynchro from '../components/RapportSynchro.vue'

export default {
  name: 'PageSession',

  components: { RapportSynchro }

}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>

