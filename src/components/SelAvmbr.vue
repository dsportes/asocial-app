<template>
<sel-genx v-model="cav" :options="options" :titre="$t('SAVtit')"/>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import SelGenx from './SelGenx.vue'
import stores from '../stores/stores.mjs'

const props = defineProps({ 
  acnote: Number, // 1: accès en lecture, 2: accès en écriture
  acmbr: Boolean 
})

const model = defineModel({type: String})

const session = stores.session
const gSt = stores.groupe

function setOptions () {
  const g = gSt.egrC.groupe
  const l = []
  session.compte.mav.forEach(ida => { 
    const im = g.mmb.get(ida)
    if (im) {
      if ((props.acmbr && g.accesMembre(im)) 
        || (props.acnote && ((g.accesNote2(im) >= props.acnote))))
          l.push({ label: session.getCV(ida).nom, value: ida })
    }
  })
  const cid = session.avatarId
  l.sort((a,b) => { return a.value === cid ? - 1 : (b.value === cid ? 1 : 
    (a.label < b.label ? -1 : (b.label > a.label ? 1 : 0)))})
  return l
}

const options = ref(setOptions())
const cav = ref(options.value.length > 0 ? options.value[0] : { label: '?', value: ''})
model.value = cav.value.value

watch(cav, (ap) => { 
  model.value = ap.value
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
