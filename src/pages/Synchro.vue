<template>
  <q-page>
    <rapport-synchro/>
  </q-page>
</template>

<script>
import RapportSynchro from '../components/RapportSynchro.vue'

export default {
  name: 'Sync',

  components: { RapportSynchro }

}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>

