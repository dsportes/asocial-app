<template>
  <q-input style="width:14rem" :class="'bord999' + (actif ? 2 : 1)"
    dense outlined standout="bg-warning text-white" :disable="!actif" v-model="text" 
    :label="actif ? $t('confirm', [code]) : $t('rienconf')" />  
</template>

<script setup>
import { ref, watch } from 'vue'

import { random } from '../app/util.mjs'

const props = defineProps({ 
  actif: Boolean, 
  confirmer: Function 
})

const text = ref('')
const code = ref('' + random(1))

watch(props.actif, (ap, av) => {
  code.value = '' + random(1)
  text.value = ''
})

watch(text, (ap, av) => {
  if (ap === code.value) {
    text.value = ''
    props.confirmer()
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
