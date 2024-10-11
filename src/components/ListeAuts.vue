<template>
  <div v-if="nb" class='row q-gutter-xs titre-sm'>
    <div>{{$t('PNOauts', nb)}}</div>
    <div class="row items-center q-gutter-xs">
      <div v-for="im in nSt.note.l" :key="im">
        <span class="bord cursor-pointer q-pa-xs">
          <span v-if="ida(im)" class="cursor-pointer" @click="openCv(im)">{{nomC(im)}}</span>
          <span v-else>#{{im}}</span>
        </span>
      </div>
      <div v-if="autAvc" class="msg">{{$t('PNOauts2')}}</div>
    </div>

    <q-dialog v-model="ui.d[idc].ACVouvrir" persistent>
      <apercu-cv :cv="cv"/>
    </q-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import ApercuCv from '../dialogues/ApercuCv.vue'

const cv = ref(null)

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const session = stores.session
const nSt = stores.note
const gSt = stores.groupe
const autAvc = ref(false)
const groupe = ref(null)

const egr = gSt.egr(nSt.note.id)
if (egr) {
  let b = false
  groupe.value = egr.groupe
  nSt.note.l.forEach(im => { if (session.compte.mav.has(egr.groupe.tid[im])) b = true })
  autAvc.value = b
}

const nb = computed(() => nSt.note.l.length)

const ida = (im) => groupe.value ? groupe.value.tid[im] : 0

const getCV = (im) => { 
  const id = ida(im)
  return id ? session.getCV(id) : null
}

const nomC = (im) => getCV(im).nomC

function openCv (im) {
  cv.value = getCv(im)
  ui.oD('ACVouvrir', idc)
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid $grey-5
  border-radius: 5px
</style>
