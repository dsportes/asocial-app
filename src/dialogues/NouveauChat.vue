<template> <!-- BtnCond incorporés -->
<q-dialog v-model="ui.d[idc].CCouvrir" persistent>
  <q-card :class="styp('sm')">
  <q-toolbar class="tbs">
    <btn-cond color="warning" icon="close" @ok="ui.fD"/>
    <q-toolbar-title class="titre-lg full-size text-center">{{$t('CChtit')}}</q-toolbar-title>
    <bouton-help page="page1"/>
  </q-toolbar>
  <q-card-section v-if="step===1">
    <phrase-contact @ok="ok" :orgext="session.org" declaration/>
    <div v-if="diag" class="q-ma-sm q-pa-xs bg-yellow-3 text-negative text-bold">{{diag}}</div>
  </q-card-section>
  <q-card-section v-if="step===2">
    <apercu-genx :id="nvIdE || idE"/>
    <div class="q-mt-md q-mb-sm titre-md">{{$t('CHech1')}}</div>
    <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
  </q-card-section>
  <q-card-actions v-if="step===2" align="right">
    <btn-cond flat :label="$t('renoncer')" icon="close" @ok="ui.fD"/>
    <btn-cond color="warning" icon="check" @ok="creer" class="q-ml-sm"
      :label="$t('valider')"
      :disable="!txt.length"
      :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
  </q-card-actions>
</q-card>

</q-dialog>
</template>

<script setup>
import { ref } from 'vue'

import stores from '../stores/stores.mjs'
import { styp, $t } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { GetAvatarPC, NouveauChat } from '../app/operations4.mjs'
import PhraseContact from '../components/PhraseContact.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import EditeurMd from '../components/EditeurMd.vue'
import BtnCond from '../components/BtnCond.vue'

const props = defineProps({ 
  /* Le chat PEUT être créé en tant que: 
  0:par phrase de contact, 1:comptable, 2:délégué, idg:co-membre du groupe */
  mode: Number,
  idI: String, // avatar du compte
  idE: String, // avater externe, co-membre d'un groupe ou délégué ou à contacter
  idc: Number, // idc d'ouverture du dialogue
  urgence: Boolean
})

const aSt = stores.avatar
const session = stores.session
const ui = stores.ui

const step = ref(props.mode ? 2 : 1)
const diag = ref('')
const txt = ref('')
const nvIdE = ref('')
const hZC = ref('')

async function ok (p) {
  hZC.value = p.hpsc
  nvIdE.value = await new GetAvatarPC().run(p)
  if (!nvIdE.value) {
    diag.value = $t('CChnopc')
    return
  }
  if (session.compte.mav.has(nvIdE.value)) {
    diag.value = $t('CChself')
    return
  }
  step.value = 2
}

async function creer () {
  await new NouveauChat()
    .run(props.idI, nvIdE.value || props.idE, props.mode, hZC.value, txt.value, props.urgence)
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
@import '../css/input.sass'
</style>
