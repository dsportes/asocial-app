<template>
<q-dialog v-model="ui.d.ACGouvrir" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated class="bg-secondary text-white">
      <q-toolbar>
        <btn-cond color="warning" icon="chevron_left" @click="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">
          {{$t('CHGtit', [cvg.nom])}}
        </q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-toolbar inset>
        <sel-avmbr v-model="avid" acmbr/>
        <q-space/>
        <btn-cond v-if="avid" :label="$t('CHGadd')" icon="add"
          cond="cEdit" @click="editer"/>
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
                  @click="effacer(it.im, it.dh)"/>
              </div>
            </template>
          </q-chat-message>
        </div>
      </q-card>
    </q-page-container>

    <!-- Confirmation d'effacement d'un échange -->
    <q-dialog v-model="ui.d.ACGconfirmeff">
      <q-card :class="styp()">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHeff')}}
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @click="ui.fD"/>
          <btn-cond color="warning" icon="clear" :label="$t('CHeffcf')" @click="effop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'ajout d'un item au chat -->
    <q-dialog v-model="ui.d.ACGchatedit" persistent>
      <q-card :class="styp()">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHadd1')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @click="ui.fD"/>
          <btn-cond icon="add" :label="$t('valider')" @click="addop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

</q-layout>
</q-dialog>
</template>
<script>

import { ref } from 'vue'

import stores from '../stores/stores.mjs'
import SdBlanc from '../components/SdBlanc.vue'
import EditeurMd from '../components/EditeurMd.vue'
import { styp, dhcool, dkli } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import SelAvmbr from '../components/SelAvmbr.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import BtnCond from '../components/BtnCond.vue'
import { ItemChatgr } from '../app/operations4.mjs'

export default {
  name: 'ApercuChatgr',

  props: { },

  components: { SdBlanc, EditeurMd, BoutonHelp, ApercuGenx, BtnCond, SelAvmbr },

  computed: { 
    egr () { return this.gSt.egrC },
    cvg () { return this.session.getCV(this.session.groupeId)},
    gr () { return this.egr.groupe },
    items () { return this.gSt.chatgr && this.gSt.chatgr.items ? this.gSt.chatgr.items : []}
  },

  data () { return {
    txt: '',
    avid: 0,
    im: 0,
    dh: 0
  }},

  methods: {
    cvm (im) {
      const idm = this.gr.tid[im]
      return this.session.getCV(idm)
    },

    async effacer (im, dh) {
      this.im = im
      this.dh = dh
      this.ui.oD('ACGconfirmeff')
    },

    async effop () {
      await new ItemChatgr().run(0, this.dh, null)
      this.im = 0
      this.dh = 0
      this.ui.fD()
    },

    async addop () {
      await new ItemChatgr().run(this.avid, 0, this.txt)
      this.txt = ''
      this.ui.fD()
    },

    async editer () {
      this.txt = ''
      this.ui.oD('ACGchatedit')
    }
  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const gSt = stores.groupe
    const aSt = stores.avatar
    const naAut = ref()
    const imAut = ref()

    function selAut(elt) {
      naAut.value = elt.na
      imAut.value = elt.im
    }

    return {
      selAut, naAut, imAut,
      styp, dkli, dhcool,
      session, ui, gSt, aSt
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.nom
  max-height: 1.3rem
  overflow: hidden
</style>
