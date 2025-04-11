<template>
<div>
  <div class="q-ml-md column q-gutter-sm">
    <btn-cond v-for="av in lav" :key="av.id"
      no-caps cond="cEdit" color="primary"
      :label="av.nom" icon="control_point" @ok="okav(av.id)"/>

    <btn-cond v-if="!estAv" no-caps color="secondary"
      :label="nom" icon="control_point"  @ok="okgr"/>
  </div>

  <q-dialog v-model="ui.d[idc].NNnotenouvelle" position="left" persistent>
    <note-nouvelle
      :estgr="estgr" 
      :groupe="estgr ? groupe : null" 
      :avatar="avatarx" 
      :notep="nSt.node.note"/>
  </q-dialog>
</div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import NoteNouvelle from '../panels/NoteNouvelle.vue'
import { afficherDiag, $t } from '../app/util.mjs'
import BtnCond from './BtnCond.vue'

const props = defineProps({ node: Object })

const model = defineModel({ String })

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const session = stores.session
const aSt = stores.avatar
const gSt = stores.groupe
const nSt = stores.note

const avatarx = ref(null)
const estgr = ref(false)

nSt.setCourant(props.node.ids)
model.value = props.node.ids

const n = ref(nSt.node)
const t = ref(n.value.type)
const estAv = ref(t.value === 1 || t.value === 4 )
const id = ref(n.value.id )
const groupe = ref(estAv.value ? null : gSt.egr(id.value).groupe )
const avatar = ref(estAv.value ? aSt.getElt(id.value).avatar : null )
const nom = ref(session.getCV(id.value).nom )
const lav = ref(estAv.value ? [{ nom: nom.value, id: id.value}] : session.compte.lstAvatars )

const diagGr = computed(() => groupe.value && !groupe.value.aUnAccesEcrNote ? 'PNOroEcr' : '')

async function okgr () {
  if (diagGr.value) {
    await afficherDiag($t(diagGr.value))
    return
  }
  estgr.value = true
  ui.oD('NNnotenouvelle', idc)
}

async function okav (id) {
  avatarx.value = aSt.getElt(id).avatar
  estgr.value = false
  ui.oD('NNnotenouvelle', idc)
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
