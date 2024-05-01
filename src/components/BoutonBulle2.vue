<template>
  <q-btn class="q-mx-xs" size="md" padding="none"
    :icon="icon || 'info'" :label="label">
    <q-popup-proxy ref="qpp">
      <q-banner class="bord bordgris" @click="hide">
        <template v-slot:avatar>
          <q-icon :name="icon || 'info'" size="sm" color="primary" />
        </template>
        <sd-nb :texte="texte"/>
      </q-banner>
    </q-popup-proxy>
  </q-btn>
</template>
<script>

import { ref } from 'vue'
import SdNb from './SdNb.vue'

export default ({
  name: 'BoutonBulle2',

  components: { SdNb },

  props: { icon: String, label: String, texte: String },

  computed: {
  },

  methods: {
    hide () {
      this.qpp.hide()
    }
  },
  
  setup () {
    const qpp = ref(null)
    return {
      qpp
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-radius: 5px
  padding: 3px !important
</style>
