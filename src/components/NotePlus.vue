<template>
<span>
  <span v-if="!estAv">
    <btn-cond v-if="lav.length > 1" class="q-mr-xs" no-caps 
      :label="$t('NPLnote', [lav[0].nom])" 
      icon="control_point" color="primary" size="md" padding="none"
      icon-right="expand_more">
      <q-menu anchor="bottom left" self="top left" max-height="10rem" 
        max-width="10rem">
        <q-list class="tbs titre-md q-py-xs">
          <q-item v-for="av in lav" :key="av.id" clickable v-close-popup
            @click="selAv(av.id)">
            {{av.nom}}
          </q-item>
        </q-list>
      </q-menu>
    </btn-cond>
    <btn-cond v-else class="q-mr-xs" no-caps cond="cEdit" color="primary"
      :label="lav[0].nom" icon="control_point" @ok="selAv(lav[0].id)"/>

    <btn-cond class="q-mr-xs" no-caps cond="cEdit" color="secondary"
      :label="$t('NPLnote', [nom])" icon="control_point"  @ok="okgr"/>
  </span>

  <btn-cond v-else class="q-mr-xs" no-caps cond="cEdit"
    :label="$t('NPLnote', [nom])" icon="control_point" color="primary" @ok="okav"/>

  <q-dialog v-model="ui.d[idc].NNnotenouvelle" position="left" persistent>
    <note-nouvelle
      :estgr="estgr" 
      :groupe="estgr ? groupe : null" 
      :avatar="avatarx" 
      :notep="nSt.node.note"/>
  </q-dialog>
</span>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import NoteNouvelle from '../panels/NoteNouvelle.vue'
import { afficherDiag, $t } from '../app/util.mjs'
import BtnCond from './BtnCond.vue'

// const props = defineProps({ selected: String })

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const session = stores.session
const aSt = stores.avatar
const gSt = stores.groupe
const nSt = stores.note

const avatarx = ref(null)
const estgr = ref(false)

const n = computed(() => nSt.node)
const t = computed(() => n.value.type)
const estAv = computed(() => t.value === 1 || t.value === 4 )
const id = computed(() => n.value.id )
const groupe = computed(() => estAv.value ? null : gSt.egr(id.value).groupe )
const avatar = computed(() => estAv.value ? aSt.getElt(id.value).avatar : null )
const lav = computed(() => session.compte.lstAvatars )
const nom = computed(() => { const cv = session.getCV(id.value); return estAv.value ? cv.nom : cv.nomC })

const diagGr = computed(() => groupe.value && !groupe.value.aUnAccesEcrNote ? 'PNOroEcr' : '')

async function okgr () {
  if (diagGr.value) {
    await afficherDiag($t(diagGr.value))
    return
  }
  estgr.value = true
  ui.oD('NNnotenouvelle', idc)
}

async function okav () {
  estgr.value = false
  avatarx.value = aSt.getElt(id.value).avatar
  ui.oD('NNnotenouvelle', idc)
}

async function selAv (id) {
  if (session.cEdit) {
    await afficherDiag($t(session.cEdit))
    return
  }
  avatarx.value = aSt.getElt(id).avatar
  estgr.value = false
  ui.oD('NNnotenouvelle', idc)
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
