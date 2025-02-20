<template>
<div>
  <div :class="dkli(idx)">
    <div v-if="notif && notif.texte" class="column q-my-sm">
      <div class="row justify-between">
        <div class="titre-md">{{$t('ANnot' + type)}}</div>
        <btn-cond v-if="type===0 && session.estAdmin" class="q-ml-sm" round icon="edit"
          @ok="editer"/>
        <btn-cond v-if="!diag && type!==0 && session.pow < 4" class="q-ml-sm" round icon="edit"
          cond="cUrgence"
          @ok="editer"/>
      </div>
      <div>
        <span class="fs-sm text-italic q-mr-sm">{{nomSource}}</span>
        <span class="fs-sm font-mono">{{dhcool(notif.dh)}}</span>
      </div>
      <div v-if="diag" class="q-pa-xs bg-yellow-5 text-italic text-bold text-negative titre-md text-center">
        {{diag}}
      </div>

      <div v-if="notif.nr > 1" class="q-mt-xs q-pa-xs bg-yellow-3 text-negative text-bold">
        {{$t('ANnr' + type + notif.nr)}}
      </div>
      <show-html class="q-mt-xs bord" :texte="notif.texte" :idx="idx" 
        maxh="3rem" zoom scroll/>
    </div>
    <div v-if="!diag && (!notif || !notif.texte)" class="row justify-between">
      <div class="titre-md">{{$t('ANauc' + (simple ? 's' : type))}}</div>
      <btn-cond v-if="type===0 && session.estAdmin" class="q-ml-sm" icon="edit" round
        @ok="creer"/>
      <btn-cond v-if="type!==0 && session.pow < 4" class="q-ml-sm" icon="edit" round
        cond="cUrgence"
        @ok="creer"/>
    </div>
  </div>

  <q-dialog v-model="ui.d[idc].DNdialoguenotif" persistent>
    <dialogue-notif :type="type" :cible="cible" :ntf="ntf" :restr="restr" :restrb="restrb"/>
  </q-dialog>
</div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import BtnCond from './BtnCond.vue'
import ShowHtml from './ShowHtml.vue'
import DialogueNotif from './DialogueNotif.vue'
import { Notification } from '../app/modele.mjs'
import { dhcool, dkli, $t } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

const session = stores.session
const pSt = stores.people
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const props = defineProps({ 
  notif: Object, // notification existante, null pour création éventuelle
  type: Number,
  /* Type des notifications:
  - 0 : de l'espace
  - 1 : d'une partition
  - 2 : d'un compte
  */
  cible: String, // type 0: org, type 1: idPartition, type 2: idCompte
  idx: Number,
  simple: Boolean
})

const restr = ref(false)
const restrb = ref(false)
const ntf = ref(null)

const aut = computed (() => props.notif.idDel ? props.notif.idDel : ID.duComptable())

const nomSource = computed (() => {
  if (props.type === 0) return $t('ANadmin')
  const cv = session.getCV(aut.value)
  return $t('ANdel1', [cv.nomC])
})

const diag = computed (() => {
  if (session.estComptable || !props.notif || !ID.estComptable(aut.value)) return ''
  return $t('ANnotc') 
})

async function editer () {
  ntf.value = props.notif.clone()
  if (ntf.value.nr === 2) { restr.value = true; restrb.value = false }
  else if (ntf.value.nr === 3) { restr.value = false; restrb.value = true }
  else { restr.value = false; restrb.value = false }
  ui.oD('DNdialoguenotif', idc)
}

async function creer () {
  ntf.value = new Notification({})
  ui.oD('DNdialoguenotif', idc)
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
