<template>
<q-dialog v-model="ui.d[idc].CCouvrir" persistent>
  <q-card :class="styp('sm')">
  <q-toolbar class="tbs">
    <btn-cond color="warning" icon="close" @ok="ui.fD"/>
    <q-toolbar-title class="titre-lg full-size text-center">{{$t('CChtit')}}</q-toolbar-title>
    <bouton-help page="page1"/>
  </q-toolbar>
  <q-card-section>
    <div v-if="mode===0" class="row items-center">
      <phrase-contact class="col-10" v-model="phraseE" declaration/>
      <btn-cond class="col-1 text-right" icon="check" round
        :disable="phraseE.err !== ''"  @ok="getIdE"/>
      <q-spinner class="col-1 text-right" v-if="encours" color="primary"
        size="1.5rem" :thickness="8" />
    </div>
    <div v-if="nvIdE || idE">
      <apercu-genx :id="nvIdE || idE"/>
      <div class="q-mt-md q-mb-sm titre-md">{{$t('CHech1')}}</div>
      <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
    </div>
  </q-card-section>
  <q-card-actions align="right">
    <btn-cond flat :label="$t('renoncer')" icon="close" @ok="ui.fD"/>
    <btn-cond color="warning" icon="check" @ok="creer" class="q-ml-sm"
      :label="$t('valider')"
      :disable="(!nvIdE && !idE) || !txt.length"
      :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
  </q-card-actions>
</q-card>

</q-dialog>
</template>

<script setup>
import { ref } from 'vue'

import stores from '../stores/stores.mjs'
import { styp, $t, sleep, afficherDiag } from '../app/util.mjs'
import { Phrase } from '../app/modele.mjs'
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

const phraseE = ref({ phrase: '', err: '' })
const txt = ref('')
const encours = ref(false)
const nvIdE = ref('')
const hpsc = ref('')

async function getIdE () {
  encours.value = true
  const p = new Phrase()
  await p.init(phraseE.value.phrase)
  hpsc.value = p.hpsc
  // await sleep(5000)
  encours.value = false
  nvIdE.value = await new GetAvatarPC().run(p)
  if (!nvIdE.value) {
    await afficherDiag($t('CChnopc'))
    return
  }
  if (session.compte.mav.has(nvIdE.value)) {
    await afficherDiag($t('CChself'))
    return
  }
}

async function creer () {
  await new NouveauChat()
    .run(
      props.idI, 
      nvIdE.value || props.idE, 
      props.mode, 
      hpsc.value,
      txt.value, 
      props.urgence
    )
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
@import '../css/input.sass'
</style>
