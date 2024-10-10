<template>
<div>
  <q-btn v-if="!estAv && lna" dense class="q-mr-xs" no-caps 
    :label="$t('NPLnote', [lna[0].nom])" 
    icon="control_point" color="primary" size="md" padding="none"
    icon-right="expand_more">
    <q-menu anchor="bottom left" self="top left" max-height="10rem" 
      max-width="10rem">
      <q-list class="bg-secondary titre-md text-white q-py-xs">
        <q-item v-for="na in lna" :key="na.id" clickable v-close-popup
          @click="selNa(na.id)">
          {{na.nom}}
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>

  <q-btn v-if="estAv" dense class="q-mr-xs" no-caps 
    :label="$t('NPLnote', [nom])" 
    icon="control_point" color="primary" @click="ok(false)" padding="none" size="md"/>

  <q-btn v-if="!estAv" dense class="q-mr-xs" no-caps 
    :label="$t('NPLnote', [nom])" 
    icon="control_point" color="orange" @click="ok(true)" padding="none" size="md"/>

  <q-dialog v-model="ui.d[idc].NNnotenouvelle" full-height position="left" persistent>
    <note-nouvelle
      :estgr="estgr" 
      :groupe="estgr ? groupe : null" 
      :avatar="avatarx || (estgr ? null : aSt.getElt(id).avatar)" 
      :notep="nSt.node.note"/>
  </q-dialog>
</div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import NoteNouvelle from '../panels/NoteNouvelle.vue'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const session = stores.session
const aSt = stores.avatar
const gSt = stores.groupe
const nSt = stores.note

const props = defineProps({ 
  k1: String
})

const avatarx = ref(null)
const estgr = ref(false)

const n = computed(() => nSt.node) // OK: est réévalué quand nSt.node change
const t = computed(() => n.value.type)
const estAv = computed(() => t.value === 1 || t.value === 4 )
const id = computed(() => n.value.id )
const groupe = computed(() => estAv.value ? null : gSt.egr(id.value).groupe )
const avatar = computed(() => estAv.value ? aSt.getElt(id.value).avatar : null )
const lna = computed(() => { const l = session.compte.lstAvatars; return l.length > 1 ? l : null })
const nom = computed(() => { const cv = session.getCV(id.value); return estAv.value ? cv.nom : cv.nomC })

function ok (gr) {
  estgr.value = gr
  ui.oD('NNnotenouvelle', idc)
}

function selNa (id) {
  avatarx.value = aSt.getElt(id).avatar
  ok(false)
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
