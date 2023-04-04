<template>
  <q-input style="width:12rem" dense outlined standout="bg-warning text-white" :disable="!actif" v-model="text" 
    :label="actif ? $t('confirm', [code]) : $t('rienconf')" />  
</template>
<script>

import { random } from '../app/webcrypto.mjs'
export default ({
  name: 'BoutonConfirm',

  props: { actif: Boolean, confirmer: Function },

  computed: {
  },

  watch: {
    actif (ap, av) {
      this.code = '' + random(1)
      this.text = ''
    },
    text (ap, av) {
      if (ap === this.code) {
        this.text = ''
        this.confirmer()
      }
    }
  },

  data () {
    return {
      text: '',
      code: ''
    }
  },

  methods: {
  },
  
  setup () {
    return {
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
