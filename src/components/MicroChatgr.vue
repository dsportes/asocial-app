<template>
<div>
  <div class="relative-position">
    <div class="row justify-between items-center">
      <div>
        <q-icon v-if="nonlu" color="warning" rounded name="flag" size="md"/>
        <span class="titre-md text-bold">{{$t('CHgrp', [nomg])}}</span>
      </div>
      <btn-cond icon="chat" stop @ok="ouvrirChat()" round
        :cond="ui.urgence ? 'cUrgence' : 'cVisu'" />
    </div>
    <div class="q-mt-xs row justify-between items-center">
      <div class="text-italic fs-md">
        <span class="q-mr-sm">{{$t('CHnbit', chat.items.length, {count:chat.items.length} )}}</span>
      </div>
      <div v-if="chat.items.length" class="text-italic font-mono q-mr-sm">{{dhcool(chat.dh)}}</div>
    </div>
    <div v-if="chat.items.length" class="fs-md">{{chat.tit}}</div>
  </div>

  <dial-std2  v-model="m1" :titre="$t('CHGtit', [nomg])" help="chatgr">
    <apercu-chatgr />
  </dial-std2>

</div>
</template>
<script setup>
import { computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { dhcool } from '../app/util.mjs'
import ApercuChatgr from '../panels/ApercuChatgr.vue'
import DialStd2 from '../dialogues/DialStd2.vue'
import BtnCond from './BtnCond.vue'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const m1 = computed(() => ui.d[idc].MCACGouvrir)

const gSt = stores.groupe
const session = stores.session

const props = defineProps({ 
  chat: Object
})

const nomg = computed(() => session.getCV(props.chat.id).nomC )

const nonlu = computed(() => {
  const e = gSt.egr(props.chat.id)
  const dh = e && e.chatgr ? e.chatgr.dh : 0
  return e.dhLectChat < dh
})

function ouvrirChat () {
  session.setGroupeId(props.chat.id)
  ui.oD('MCACGouvrir', idc)
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
