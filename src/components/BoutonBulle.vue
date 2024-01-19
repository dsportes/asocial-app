<template>
  <q-btn padding="none" size="md" text-color="grey-5" icon="info">
    <q-popup-proxy ref="qpp">
      <q-banner class="bord bordgris" @click="hide">
        <template v-slot:avatar>
          <q-icon :name="icon || 'info'" size="sm" color="primary" />
        </template>
        <sd-nb :texte="txt"/>
      </q-banner>
    </q-popup-proxy>
  </q-btn>
</template>
<script>

import { ref } from 'vue'
import SdNb from './SdNb.vue'

export default ({
  name: 'BoutonBulle',

  components: { SdNb },

  props: { icon: String, idtext: String },

  computed: {
    txt () {
      return this.idtext ? this.$t('BULLE' + this.idtext) : '???'
    }
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
