<template>
<sel-genx v-model="cav" :options="options" :titre="$t('SGRtit')"/>
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

if (session.groupeId) {
  cav.value = { 
    label: session.getCV(session.groupeId).nom, 
    value: session.groupeId 
  }
} else if (props.aucun) {
  cav.value = { label: '-', value: '' }
} else {
  const [gid] = session.compte.mpg.keys()
  if (gid) {
    session.setGroupeId(gid)
    cav.value = { 
      label: session.getCV(session.groupeId).nom, 
      value: session.groupeId 
    }
  } else cav.value = { label: '-', value: '' }
}

const options = computed(() => {
  const l = []
  session.compte.mpg.forEach((v, id) => { 
    l.push({ label: session.getCV(id).nom, value: id }) 
  })
  const cid = session.groupeId
  l.sort((a,b) => { return a.value === cid ? - 1 : (b.value === cid ? 1 : 
    (a.label < b.label ? -1 : (b.label > a.label ? 1 : 0)))})
  if (props.aucun) l.unshift({ label: '-', value: 0 })
  return l
})

watch(cav, (ap) => { session.setGroupeId(ap.value) })

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-item
  min-height: 20px !important
  padding: 3px 1rem !important
.bord9
  border: 2px solid $grey-5
  border-radius: 5px
</style>
