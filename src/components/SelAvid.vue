<template>
<sel-genx v-model="cav" :options="options" :titre="$t('SAVtit')"/>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SelGenx from './SelGenx.vue'

import stores from '../stores/stores.mjs'

const props = defineProps({ 
  aucun: Boolean
})

const cav = ref()
const session = stores.session

if (session.avatarId) {
  cav.value = { 
    label: session.getCV(session.avatarId).nom, 
    value: session.avatarId 
  }
} else if (props.aucun) {
  cav.value = { label: '-', value: '' }
} else {
  cav.value = { 
    label: session.getCV(session.compteId).nom, 
    value: session.compteId 
  }
}

const options = computed(() => {
  const l = []
  session.compte.mav.forEach(id => { 
    l.push({ label: session.getCV(id).nom, value: id }) 
  })
  const cid = session.avatarId
  l.sort((a,b) => { return a.value === cid ? - 1 : (b.value === cid ? 1 : 
    (a.label < b.label ? -1 : (b.label > a.label ? 1 : 0)))})
  if (props.aucun) l.unshift({ label: '-', value: 0 })
  return l
})

watch(cav, (ap) => { 
  session.setAvatarId(ap.value) 
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
