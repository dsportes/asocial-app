<template>
<q-dialog v-model="ui.d.ACouvrir[idc]" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated>
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHoch3', [naI.nom, naE.nom])}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <apercu-genx class="bordb" :id="naE.id" :idx="0" />
      <div :class="sty() + 'q-pa-xs row justify-around'">
        <q-btn :label="$t('CHadd2')" icon="add" 
          padding="none xs" color="primary" @click="editer"/>
        <q-btn :label="$t('CHrac')" icon="phone_disabled" 
          padding="none xs" color="primary" @click="raccrocher"/>
      </div>
    </q-header>

    <q-page-container>
      <q-card v-if="chat" class="q-pa-sm">
        <div v-for="it in chat.items" :key="it.dh + '/' + it.a">
          <q-chat-message :sent="it.a===0" 
            :bg-color="(it.a===0) ? 'primary' : 'secondary'" 
            text-color="white"
            :stamp="dhcool(it.dh)">
            <sd-blanc v-if="!it.dhx" :texte="it.txt"/>
            <div v-else class="text-italic text-negative">{{$t('CHeffa', [dhcool(it.dhx)])}}</div>
            <template v-slot:name>
              <div class="full-width row justify-between items-center">
                <span>{{it.a===0 ? $t('moi') : naE.nom}}</span>
                <q-btn v-if="it.a===0 && !it.dfx" size="sm" padding="none" round
                  icon="clear" color="warning" @click="effacer(it.dh)"/>
              </div>
            </template>
          </q-chat-message>
        </div>
      </q-card>

      <q-card v-else>
        <div class="titre-md text-italic text-bold">{{$t('CHnotit')}}</div>
        <q-btn class="maauto q-mt-md" :label="$t('CHbtncr')" size="md" color="primary" icon="add"
          @click="creerchat"/>
      </q-card>
    </q-page-container>

    <!-- Confirmation d'effacement d'un échange -->
    <q-dialog v-model="ui.d.ACconfirmeff">
      <q-card :class="styp('sm')">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHeff')}}
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn flat dense size="md" padding="md" color="primary" icon="undo"
            :label="$t('renoncer')" @click="ui.fD"/>
          <q-btn dense size="md" padding="md" color="warning" icon="delete"
            :label="$t('CHeffcf')" @click="effop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmation du raccrocher -->
    <q-dialog v-model="ui.d.ACconfirmrac">
      <q-card :class="styp('sm')">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHrac2', [naE.nom])}}
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn flat dense size="md" padding="md" color="primary" icon="undo"
            :label="$t('renoncer')" @click="ui.fD"/>
          <q-btn dense size="md" padding="md" color="warning" icon="clear"
            :label="$t('CHrac')" @click="passifop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'ajout d'un item au chat -->
    <q-dialog v-model="ui.d.ACchatedit">
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHadd')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn flat dense size="md" padding="xs" color="primary" icon="undo"
            :label="$t('renoncer')" @click="ui.fD"/>
          <q-btn dense size="md" padding="xs" color="primary" icon="add"
            :label="$t('valider')"  @click="addop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-layout>
</q-dialog>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'

import { styp, sty, dhcool, dkli, afficherDiag } from '../app/util.mjs'
import { Motscles } from '../app/modele.mjs'
import { MajChat, PassifChat, NouveauChat } from '../app/operations.mjs'
import { ID } from '../app/api.mjs'

import SdBlanc from '../components/SdBlanc.vue'
import EditeurMd from '../components/EditeurMd.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import BoutonHelp from '../components/BoutonHelp.vue'

export default {
  name: 'ApercuChat',

  props: { 
    naI: Object, 
    naE: Object,
    chatx: Object,
    idc: Number
  },

  components: { SdBlanc, EditeurMd, ApercuGenx, BoutonHelp },

  computed: {
    estSp () {
      const id = this.naE.id
      return ID.estComptable(id) || this.pSt.estSponsor(id)
    }
  },

  data () { return {
    txt: ''
  }},

  methods: {
    async creerchat () {
      if (this.estSp) {
        if (!await this.session.editUrgence()) return
      } else {
        if (!await this.session.edit()) return
      }
      this.ui.oD('ACchatedit')
    },

    async effacer (dh) {
      if (this.estSp) {
        if (!await this.session.editUrgence()) return
      } else {
        if (!await this.session.edit()) return
      }
      this.txt = this.chat ? this.chat.txt : ''
      this.ui.oD('ACconfirmeff')
      this.dheff = dh
    },

    async effop () {
      const disp = await new MajChat().run(this.naI, this.naE, null, this.dheff, this.chat)
      if (disp) { await afficherDiag(this.$t('CHdisp')) }
      this.dheff = 0
      this.ui.fD()
    },

    async addop () {
      if (this.chat) {
        const disp = await new MajChat().run(this.naI, this.naE, this.txt, 0, this.chat)
        if (disp) { await afficherDiag(this.$t('CHdisp')) }
      } else { 
        const [st, chat] = await new NouveauChat().run(this.naI, this.naE, this.txt)
        if (st === 0) {
          await afficherDiag(this.$t('OPnvch0'))
        } else  {
          this.chat = chat
          if (st === 2) await afficherDiag(this.$t('OPnvch2'))
        }
      }
      this.txt = ''
      this.ui.fD()
    },

    async passifop () {
      const disp = await new PassifChat().run(this.chat)
      if (disp) { await afficherDiag(this.$t('CHdisp')) }
      this.ui.fD()
    },

    async editer () {
      if (this.estSp) {
        if (!await this.session.editUrgence()) return
      } else {
        if (!await this.session.edit()) return
      }
      this.txt = this.chat ? this.chat.txt : ''
      this.ui.oD('ACchatedit')
    },

    async raccrocher () {
      if (this.estSp) {
        if (!await this.session.editUrgence()) return
      } else {
        if (!await this.session.edit()) return
      }
      this.txt = this.chat ? this.chat.txt : ''
      this.ui.oD('ACconfirmrac')
    }
  },

  setup (props) {
    return {
      styp, sty, dkli, dhcool,
      session: stores.session,
      pSt: stores.people, 
      ui: stores.ui,
      aSt: stores.avatar,
      chat: toRef(props, 'chatx')
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bordb
  border-bottom: 1px solid $grey-5
</style>
