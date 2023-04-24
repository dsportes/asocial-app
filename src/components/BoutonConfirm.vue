<template>
  <q-input style="width:14rem" dense outlined standout="bg-warning text-white" :disable="!actif" v-model="text" 
    :label="actif ? $t('confirm', [code]) : $t('rienconf')" />  
</template>
<script>

import { toRef, ref } from 'vue'
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
    }
  },

  methods: {
  },
  
  setup () {
    const text = ref('')
    const code = ref('' + random(1))
    return {
      text,
      code
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
