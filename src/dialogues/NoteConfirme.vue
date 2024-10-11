<template>
<q-card :class="styp('sm')">
  <q-toolbar class="bg-secondary text-white">
    <btn-cond color="warning" icon="close" @ok="ui.fD"/>
    <q-toolbar-title class="titre-lg full-width text-center">
      {{$t('NCF' + op)}}
    </q-toolbar-title>
    <bouton-help :page="'CF' + op"/>
  </q-toolbar>

  <div v-if="session.editDiag" class="q-ma-sm q-pa-xs text-center text-bold titre-md bg-yellow-5 text-warning">
    {{session.editDiag}}
  </div>

  <div v-if="msg" class="q-ma-sm" >
    <div class="q-my-sm q-pa-xs text-bold titre-md bg-yellow-5 text-warning">{{$t('NCFm0')}}</div>
    <div class="q-ml-sm titre-md">{{msg}}</div>
  </div>

  <div class="q-my-md row justify-center items-center q-gutter-md">
    <q-btn class="q-pa-xs btn" size="md" dense :label="$t('renoncer')" color="primary" @click="ui.fD"/>
    <bouton-confirm v-if="!session.dialog && !msg" actif :confirmer="noteSuppr"/>
  </div>

</q-card>
</template>

<script setup>
import { ref } from 'vue'

import stores from '../stores/stores.mjs'
import { $t, styp } from '../app/util.mjs'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import { SupprNote } from '../app/operations4.mjs'

const session = stores.session
const ui = stores.ui
const aSt = stores.avatar
const nSt = stores.note

const props = defineProps({ 
  op: String // suppr arch react
})

const msg = ref('')

async function noteSuppr () {
  ui.fD()
  await new SupprNote().run(props.op)
}

if (nSt.estGr) {
  const s = nSt.egr.groupe.avcAuteurs()
  if (!s.size) { 
    msg.value = $t('NCFm1')
  } else {
    // retourne { avc: true/false, nom } ou null s'il n'y a pas d'exclusivité
    const xav = nSt.mbExclu
    if (xav) {
      if (!xav.avc && !nSt.egr.estAnim) 
        msg.value = $t('NCFm2', [xav.nom])
    }
  }
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btn
  max-height: 1.5rem
</style>
