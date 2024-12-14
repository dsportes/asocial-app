<template>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated class="tbs">
      <q-toolbar>
        <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">
          {{$t('CHGtit', [cvg.nom])}}
        </q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-toolbar inset>
        <sel-avmbr v-model="avid" acmbr/>
        <q-space/>
        <btn-cond v-if="avid" :label="$t('CHGadd')" icon="add"
          cond="cEdit" @ok="editer"/>
        <div v-else class="msg">{{$t('CHGnot')}}</div>
      </q-toolbar>
      <apercu-genx class="q-ma-xs" :id="session.groupeId" nodet />
    </q-header>

    <q-page-container>
      <q-card class="q-pa-sm">
        <div v-for="it in items" :key="it.dh + '/' + it.im">
          <q-chat-message
            bg-color="primary" 
            text-color="white"
            :stamp="dhcool(it.dh)">
            <sd-blanc v-if="!it.dhx" :texte="it.t"/>
            <div v-else class="text-italic text-negative">{{$t('CHeffa', [dhcool(it.dhx)])}}</div>
            <template v-slot:name>
              <div class="full-width row justify-between items-center">
                <span>{{cvm(it.im).nomC }}</span>
                <btn-cond cond="cEdit" v-if="egr.estAnim && !it.dhx" size="sm" 
                  icon="clear" color="warning" round
                  @ok="effacer(it.im, it.dh)"/>
              </div>
            </template>
          </q-chat-message>
        </div>
      </q-card>
    </q-page-container>

    <!-- Confirmation d'effacement d'un échange -->
    <q-dialog v-model="ui.d[idc].ACGconfirmeff">
      <q-card :class="styp()">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHeff')}}
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="clear" :label="$t('CHeffcf')" @ok="effop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'ajout d'un item au chat -->
    <q-dialog v-model="ui.d[idc].ACGchatedit" persistent>
      <q-card :class="styp()">
        <q-toolbar class="tbs">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHadd1')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="add" :label="$t('valider')" @ok="addop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

</q-layout>
</template>

<script setup>

import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import SdBlanc from '../components/SdBlanc.vue'
import EditeurMd from '../components/EditeurMd.vue'
import { styp, dhcool, dkli, afficher8000 } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import SelAvmbr from '../components/SelAvmbr.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import BtnCond from '../components/BtnCond.vue'
import { ItemChatgr } from '../app/operations4.mjs'

const session = stores.session
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const gSt = stores.groupe
const aSt = stores.avatar
const naAut = ref()
const imAut = ref()

const txt = ref('')
const avid = ref('')
const im = ref(0)
const dh = ref(0)

function selAut(elt) {
  naAut.value = elt.na
  imAut.value = elt.im
}

const egr = computed(() => gSt.egrC)
const cvg = computed(() => session.getCV(session.groupeId))
const gr = computed(() => egr.value.groupe )
const items = computed(() => gSt.chatgr && gSt.chatgr.items ? gSt.chatgr.items : [])

const cvm = (im) => session.getCV(gr.value.tid[im])

async function effacer (im, dh) {
  im.value = im
  dh.value = dh
  ui.oD('ACGconfirmeff', idc)
}

async function effop () {
  const r = await new ItemChatgr().run(0, dh.value, null)
  if (r) await afficher8000(r, 0, session.groupeId)
  im.value = 0
  dh.value = 0
  ui.fD()
}

async function addop () {
  const r = await new ItemChatgr().run(avid.value, 0, txt.value)
  if (r) await afficher8000(r, avid.value, session.groupeId)
  txt.value = ''
  ui.fD()
}

async function editer () {
  txt.value = ''
  ui.oD('ACGchatedit', idc)
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.nom
  max-height: 1.3rem
  overflow: hidden
</style>
