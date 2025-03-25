<template>
<div v-if="!estAvc">
  <div v-if="chDuC.length">
    <div class="row">
      <div class="text-italic text-bold titre-md q-mr-sm">{{$t('CAVtit')}}</div>
      <div v-for="e in chDuC" :key="e.id">
        <span class="q-mr-md bord">
          <span class="fs-md q-mr-sm">{{e.nom}}</span>
          <btn-cond v-if="e.ch" round icon="open_in_new" 
            :cond="urgence ? 'cUrgence' : 'cVisu'" @ok="ouvrirChat(e.ch)"/>
          <btn-cond v-else round icon="add" color="warning" 
            :cond="urgence ? 'cUrgence' : 'cEdit'" @ok="creerChat()"/>
        </span>
      </div>
    </div>
  </div>
  <div v-else class="text-italic text-bold titre-md q-mr-sm">{{$t('CAVtit2')}}</div>

  <nouveau-chat v-if="ui.d[idc] && ui.d[idc].CCouvrir" 
    :idc="idc" :idI="session.compteId" :idE="idE" :mode="2" :urgence="urgence"/>

  <q-dialog v-model="ui.d[idc].CAACouvrir" position="left" persistent>
    <apercu-chat :id="chat.id" :ids="chat.ids" :urgence="urgence"/>
  </q-dialog>

</div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import stores from '../stores/stores.mjs'
import { RegCles } from '../app/modele.mjs'
import NouveauChat from '../dialogues/NouveauChat.vue'
import ApercuChat from '../panels/ApercuChat.vue'
import BtnCond from './BtnCond.vue'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const aSt = stores.avatar
const pSt = stores.people
const session = stores.session

const props = defineProps({ 
  idE: String, 
  /* Quand idE est délégué de la partition du compte. 
  Si le compte n'a pas de chat, le bouton de création propose la création */
  del: Boolean,
  urgence: Boolean // true si invoqué depuis tab URGENCE
})

const estAvc = computed(() => session.compte.mav.has(props.idE))
const chDuC = computed(() => aSt.chatsDuCompte(props.idE, props.del))

const chat = ref(null)

function ouvrirChat (ch) {
  chat.value = ch
  ui.oD('CAACouvrir', idc)
}

function creerChat () {
  ui.oD('CCouvrir', idc)
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 5px
</style>
