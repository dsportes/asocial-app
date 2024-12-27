<template>
<div>
  <q-card class="q-pa-sm topm">
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

  <q-page-sticky position="top-left">
    <q-toolbar class="tbp pwmd">
      <sel-avmbr v-model="avid" acmbr/>
      <q-space/>
      <btn-cond v-if="avid" :label="$t('CHGadd')" icon="add"
        cond="cEdit" @ok="editer"/>
      <div v-else class="msg">{{$t('CHGnot')}}</div>
    </q-toolbar>
    <q-toolbar class="tbp" inset>
      <q-expansion-item class="full-width" switch-toggle-side expand-separator 
        icon="group" :label="cvg.nom">
        <apercu-genx class="q-ma-xs" :id="session.groupeId"/>
      </q-expansion-item>
    </q-toolbar>
  </q-page-sticky>

  <!-- Confirmation d'effacement d'un échange -->
  <dial-std1 v-if="m1" v-model="m1" :titre="$t('CHeff')"
    okwarn okic="clear" :okfn="effop" cond="cEdit">
  </dial-std1>

  <!-- Dialogue d'ajout d'un item au chat -->
  <dial-std1 v-if="m2" v-model="m2" :titre="$t('CHadd1')"
    okic="add" :okfn="addop" cond="cEdit">
    <editeur-md class="q-ma-xs" mh="20rem" v-model="txt" :texte="''" editable modetxt/>
  </dial-std1>

</div>
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
import DialStd1 from '../dialogues/DialStd1.vue'
import { ItemChatgr } from '../app/operations4.mjs'

const session = stores.session
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const m1 = computed(() => ui.d[idc].ACGconfirmeff)
const m2 = computed(() => ui.d[idc].ACGchatedit)

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

async function effacer (imx, dhx) {
  im.value = imx
  dh.value = dhx
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
.topm
  margin-top: 6rem
</style>
