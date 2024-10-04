<template>
<div>
  <div class="relative-position">
    <div v-if="chatx">
      <div class="q-mt-xs row justify-between items-center">
        <div class="text-italic fs-md">
          <span v-if="chatx.stI===1" class="q-mr-sm">{{$t('actif')}}</span>
          <span v-else class="q-mr-sm text-warning text-bold bg-yellow-5">{{$t('CHraccroche')}}</span>
          <span v-if="chatx.stE===0" class="q-mr-sm text-warning text-bold bg-yellow-5">
            {{$t('CHraccroche2', [session.getCV(chatx.idE).nom])}}</span>
          <span v-if="chatx.stE===2" class="q-mr-sm text-warning text-bold bg-yellow-5">{{$t('CHavdisp')}}</span>
          <span class="q-mr-sm">{{$t('CHnbit', chatx.items.length, {count:chatx.items.length} )}}</span>
        </div>
        <div v-if="chatx.items.length" class="text-italic font-mono q-mr-sm">{{dhcool(chatx.dh)}}</div>
      </div>
      <div class="row justify-between items-start">
        <div v-if="chatx.items.length" class="fs-md">{{chatx.tit}}</div>
        <btn-cond icon="open_in_new" :label="$t('CHbtnov')" @ok="ouvrirChat()"
          :cond="ui.urgence ? 'cUrgence' : 'cVisu'" />
      </div>
    </div>
    <div v-else class="row justify-between items-start">
      <div v-if="mode===1" class="col text-italic titre-md">{{$t('CHnxco')}}</div>
      <div v-if="mode===2" class="col text-italic titre-md">{{$t('CHnxdel', [nomE])}}</div>
      <div v-if="mode===0" class="col text-italic titre-md">{{$t('CHnxpc', [nomE])}}</div>
      <div v-if="mode>2" class="col text-italic titre-md">{{$t('CHnxmb', [nomE, nomG])}}</div>
      <btn-cond class="col-auto" icon="open_in_new" :label="$t('CHbtncr')" @ok="creerChat()"
        :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
    </div>
  </div>

  <nouveau-chat v-if="ui.d[idc] && ui.d[idc].CCouvrir" :idc="idc"
    :idI="chat ? chat.id : idI" 
    :idE="chat ? chat.idE : idE"
    :mode="mode"/>

  <q-dialog v-model="ui.d[idc].MCACouvrir" full-height position="left" persistent>
    <apercu-chat :id="chatx.id" :ids="chatx.ids"/>
  </q-dialog>
</div>
</template>
<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { dhcool } from '../app/util.mjs'
import NouveauChat from '../dialogues/NouveauChat.vue'
import ApercuChat from '../panels/ApercuChat.vue'
import BtnCond from './BtnCond.vue'
import { ID } from '../app/api.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const props = defineProps({ 
  chat: Object, // si chat est donné, c'est lui qui est visualisé
  idI: String, // sinon couple d'id (avatar du compte, people)
  idE: String, 
  del: Boolean // Quand le chat n'est pas connu et que idE est délégué de la partition du compte de idI
})

const aSt = stores.avatar
const pSt = stores.people
const session = stores.session

const chatx = computed(() => props.chat || aSt.chatDeAvec(props.idI, props.idE))

/* Le chat PEUT être créé en tant que: 
0:par phrase de contact, 1:comptable, 2:délégué, idg:co-membre du groupe */
const mode = computed(() => {
  if (ID.estComptable(props.idE)) return 1
  if (props.del) return 2
  const l = pSt.getListeIdGrComb(props.idE, props.idI)
  return l.length ? l[0] : 0
})

const nomE = computed(() => session.getCV(this.idE).nom)
const nomG = computed(() => session.getCV(mode.value).nom)

function ouvrirChat () { ui.oD('MCACouvrir', idc) }
function creerChat () { ui.oD('CCouvrir', idc)}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
