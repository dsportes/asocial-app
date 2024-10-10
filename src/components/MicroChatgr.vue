<template>
<div>
  <div class="relative-position">
    <div class="q-mt-xs row justify-between items-center">
      <div class="text-italic fs-md">
        <span class="q-mr-sm">{{$t('CHnbit', chat.items.length, {count:chat.items.length} )}}</span>
      </div>
      <div v-if="chat.items.length" class="text-italic font-mono q-mr-sm">{{dhcool(chat.dh)}}</div>
    </div>
    <div v-if="chat.items.length" class="fs-md">{{chat.tit}}</div>

    <q-btn class="absolute-bottom-right"
      color="primary" dense icon="open_in_new" padding="xs" size="sm"
      :label="$t('CHbtnov')"
      @click="ouvrirChat()"/>
  </div>

  <q-dialog v-model="ui.d[idc].MCACGouvrir" full-height position="left" persistent>
    <apercu-chatgr />
  </q-dialog>

</div>
</template>
<script setup>
import { onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { dhcool } from '../app/util.mjs'
import ApercuChatgr from '../panels/ApercuChatgr.vue'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const aSt = stores.avatar
const session = stores.session

const props = defineProps({ 
  chat: Object
})

function ouvrirChat () {
  session.setGroupeId(props.chat.id)
  ui.oD('MCACGouvrir', idc)
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
