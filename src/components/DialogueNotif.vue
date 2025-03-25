<template>
  <q-card :class="styp('md')">
    <q-toolbar class="tbs">
      <btn-cond icon="close" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">{{$t('ANnot' + type)}}</q-toolbar-title>
      <bouton-help :page="'dial_majalerte' + type"/>
    </q-toolbar>
    <q-card-section class="q-my-sm q-mx-sm column">

    <div>
      <q-checkbox size="sm" v-model="restrloc"/>
      <span>{{$t('ANnr' + type + '2')}}</span>
    </div>
    <div>
      <q-checkbox size="md" v-model="restrbloc"/>
      <span>{{$t('ANnr' + type + '3')}}</span>
    </div>

    </q-card-section>
    <q-card-section class="q-my-sm q-mx-sm">
      <editeur-md mh="10rem" v-model="n.texte" :texte="ntf ? ntf.texte : ''" 
        editable modetxt/>
    </q-card-section>
    <q-card-actions align="right">
      <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
      <btn-cond class="q-ml-sm" color="warning" icon="delete" cond="cUrgence"
        :label="$t('supprimer')" :disable="!ntf.texte" @ok="valider(true)"/>
      <btn-cond class="q-ml-sm" icon="check" cond="cUrgence"
        :label="$t('valider')" :disable="!n.texte" @ok="valider(false)"/>
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

import stores from '../stores/stores.mjs'
import BoutonHelp from './BoutonHelp.vue'
import BtnCond from './BtnCond.vue'
import EditeurMd from './EditeurMd.vue'
import { styp } from '../app/util.mjs'
import { SetNotifE, SetNotifP, SetNotifC, GetSynthese, GetPartition } from '../app/operations4.mjs'
import { deconnexion } from '../app/synchro.mjs'
import { RegCles } from '../app/modele.mjs'

const props = defineProps({  
  type: Number,
  /* Type des notifications:
  - 0 : de l'espace - cible: org
  - 1 : d'une partition - cible: idPartition
  - 2 : d'un compte - cible: idCompte
  */
  ntf: Object,
  restr: Boolean,
  restrb: Boolean,
  cible: String
})

const session = stores.session
const ui = stores.ui

const n = ref(props.ntf.clone())
const restrloc = ref(props.restr || false)
const restrbloc = ref(props.restrb || false)

watch(restrloc, (ap) => { if (ap && restrbloc.value) restrbloc.value = false })
watch(restrbloc, (ap) => { if (ap && restrloc.value) restrloc.value = false })

async function valider (suppr) {
  if (!suppr) {
    n.value.nr = 1
    if (restrloc.value) n.value.nr = 2
    if (restrbloc.value) n.value.nr = 3
  } else {
    n.value.nr = 0
    n.value.texte = ''
  }
  if (props.type === 0) {
    await new SetNotifE().run(suppr ? null : n.value, props.cible)
    session.setOrg('admin')
    deconnexion(true)
  } else {
    if (props.type === 1) {
      const clep = RegCles.get(props.cible)
      const ntf = suppr ? null : await n.value.crypt(clep)
      await new SetNotifP().run(suppr ? null : ntf, props.cible)
      await new GetPartition().run(props.cible)
    } else {
      const idp = session.partition.id
      const clep = RegCles.get(idp)
      const ntf = suppr ? null : await n.value.crypt(clep)
      await new SetNotifC().run (suppr ? null : ntf, props.cible)
      await new GetPartition().run(idp)
    }
    await new GetSynthese().run()
  }
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 2px
.btn2
  max-height: 1.5rem
.q-item__section--avatar
  min-width: 0 !important
</style>
