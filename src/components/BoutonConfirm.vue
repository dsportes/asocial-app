<template>
  <q-input style="width:14rem" :class="'bord999' + (actif ? 2 : 1)"
    dense outlined standout="bg-warning text-white" :disable="!actif" v-model="text" 
    :label="actif ? $t('confirm', [code]) : $t('rienconf')" />  
</template>
<script>

import { ref } from 'vue'
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
.bord9991
  border: 4px solid transparent
.bord9992
  border: 4px solid $warning
  border-radius: 5px
</style>
