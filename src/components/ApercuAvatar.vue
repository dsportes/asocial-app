<template>
  <q-card v-if="avatar" :class="dkli(idx)">
    <apercu-genx :id="idav" :idx="idx"/>

    <div class="q-mt-sm" v-if="avatar.pc">
      <div class="row justify-between">
        <div class="titre-md text-italic">{{$t('FApc')}}</div>
        <div>
          <btn-cond class="q-mr-xs" cond="cEdit" round icon="delete" 
            color="warning" @ok="supprPC"/>
          <btn-cond cond="cEdit" round icon="edit" @ok="editerpc"/>
        </div>
        </div>
      <div class="q-ml-lg font-mono fs-md text-bold">[{{avatar.pc}}]</div>
    </div>
    <div v-else class="row justify-between">
      <span class="titre-md text-italic">{{$t('FAnpc')}}</span>
      <btn-cond v-if="!ID.estComptable(idav)" cond="cEdit"
        round icon="edit" @ok="editerpc"/>
    </div>

    <!-- Dialogue d'édition de la phrase de contact -->
    <q-dialog v-model="ui.d[idc].AAeditionpc" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center">{{$t('FAphc')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <q-card-section class="q-pa-xs">
          <phrase-contact @ok="declPC" :init-val="avatar.pc || ''"
            declaration :orgext="session.org"/>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const $t = useI18n().t

import { computed, ref, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { ID } from '../app/api.mjs'
import { afficherDiag, dkli, styp } from '../app/util.mjs'
import { GetAvatarPC, ChangementPC } from '../app/operations4.mjs'
import { ExistePhrase } from '../app/synchro.mjs'

import BoutonHelp from './BoutonHelp.vue'
import ApercuGenx from './ApercuGenx.vue'
import PhraseContact from './PhraseContact.vue'
import BtnCond from './BtnCond.vue' 

const props = defineProps({ 
  idav: String, 
  idx: Number 
})

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const session = stores.session
const aSt = stores.avatar

const avatar = computed(() => { 
  const e = aSt.getElt(props.idav)
  return e ? e.avatar : null
})
const isPwd = ref(false)

async function editerpc () {
  session.setAvatarId(props.idav)
  ui.oD('AAeditionpc', idc)
}

async function declPC (pc) {
  if (!pc) return
  if (await new ExistePhrase().run(pc.hps1, 3)) {
    await afficherDiag($t('existe'))
    return
  }
  const id = await new GetAvatarPC().run(pc)
  if (id) {
    if (id === props.idav) {
      afficherDiag($t('FAerr1')) // déjà celle de l'avatar
      return
    }
    if (id === -1) {
      afficherDiag($t('FAerr3')) // trop proche d'une déjà utilisée par un autre avatar
      return
    }
    if (id !== props.idav) {
      afficherDiag($t('FAerr2')) // déjà exactement utilisée par un autre avatar
      return
    }
  }
  await new ChangementPC().run(avatar.value.id, pc)
  ui.fD()
}

async function supprPC () {
  await new ChangementPC().run(avatar.value.id)
  ui.fD()
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.q-btn
  padding: 0 !important
</style>
