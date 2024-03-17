<template>
<q-dialog v-model="ui.d.ACouvrir[idc]" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated>
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHoch3', [nomI, nomE])}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <apercu-genx class="bordb" :id="idE" :idx="0" />
      <div :class="sty() + 'q-pa-xs row justify-around items-center'">
        <div class="row q-gutter-xs items-center">
          <q-btn :label="$t('CHadd2')" @click="editer(false)" 
            padding="xs" color="primary" icon="add" dense size="md"/>
          <q-btn v-if="session.estA" @click="editer(true)" 
            round padding="xs" color="secondary" icon="savings" dense size="md"/>
        </div>
        <q-btn v-if="chat && chat.stI" :label="$t('CHrac')" @click="raccrocher"
          padding="xs" color="primary" icon="phone_disabled" dense size="md"/>
        <div v-if="chat && !chat.stI" class="text-warning text-bold titre-md text-italic">
          {{$t('CHraccroche')}}
        </div>
      </div>
    </q-header>

    <q-page-container>
      <q-card v-if="chat" class="q-pa-sm">
        <div v-for="it in chat.items" :key="it.dh + '/' + it.a">
          <q-chat-message :sent="it.a===0" 
            :bg-color="(it.a===0) ? 'primary' : 'secondary'" 
            text-color="white"
            :stamp="dhcool(it.dh)">
            <sd-blanc v-if="!it.dhx" :texte="it.t"/>
            <div v-else class="text-italic text-negative">{{$t('CHeffa', [dhcool(it.dhx)])}}</div>
            <template v-slot:name>
              <div class="full-width row justify-between items-center">
                <span>{{it.a===0 ? $t('moi') : nomE}}</span>
                <q-btn v-if="it.a===0 && !it.dhx" size="sm" padding="none" round
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
        <q-toolbar v-if="avecDon" inset class="bg-secondary text-white">
          <q-toolbar-title class="row justify-center items-center q-gutter-md">
            <div class="titre-md text-bold">{{$t('CHmdon')}}</div>
            <q-select :options="cfg.dons2" size="md" v-model="mdon" dense color="white"/>
            <q-checkbox class="titre-md text-bold" size="md" dense 
              left-label v-model="dconf" :label="$t('CHcdon')" />
          </q-toolbar-title>
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

import { toRef } from 'vue'

import stores from '../stores/stores.mjs'

import { styp, sty, dhcool, dkli, afficherDiag } from '../app/util.mjs'
import { PassifChat, NouveauChat, EstAutonome } from '../app/operations.mjs'
import { MajChat } from '../app/operations4.mjs'
import { ID } from '../app/api.mjs'

import SdBlanc from '../components/SdBlanc.vue'
import EditeurMd from '../components/EditeurMd.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import BoutonHelp from '../components/BoutonHelp.vue'

export default {
  name: 'ApercuChat',

  props: { 
    idI: Number, 
    idE: Number,
    chatx: Object, // Le chat peut être créé ici (pas forcément existant avant)
    idc: Number
  },

  components: { SdBlanc, EditeurMd, ApercuGenx, BoutonHelp },

  computed: {
    nomE () { return this.session.getCV(this.idE).nom },
    nomI () { return this.session.getCV(this.idI).nom },
    estDel () { return ID.estComptable(this.idE) || this.session.estDelegue }
  },

  data () { return {
    dconf: false,
    txt: '',
    avecDon: false,
    mdon: this.cfg.dons2[0]
  }},

  methods: {
    async creerchat () {
      if (this.estDel) {
        if (!await this.session.editUrgence()) return
      } else {
        if (!await this.session.edit()) return
      }
      this.ui.oD('ACchatedit')
    },

    async effacer (dh) {
      if (this.estDel) {
        if (!await this.session.editUrgence()) return
      } else {
        if (!await this.session.edit()) return
      }
      this.dheff = dh
      // this.txt = this.chat ? this.chat.txt : ''
      this.ui.oD('ACconfirmeff')
    },

    async effop () {
      const disp = await new MajChat().run(this.chat, null, this.dheff)
      if (disp) { await afficherDiag(this.$t('CHdisp')) }
      this.dheff = 0
      this.ui.fD()
    },

    async addop () {
      const compta = this.session.compta
      if (this.avecDon && this.mdon && (this.mdon * 100 > compta.total)) {
        await afficherDiag(this.$t('CHcred', [compta.total, this.mdon * 100]))
        return
      }
      if (this.chat) {
        const don = this.avecDon ? this.mdon * 100 : 0
        const txt = (this.avecDon && !this.dconf ? (this.$t('CHdonde', [this.mdon]) + '\n') : '') + this.txt
        const disp = await new MajChat().run(this.chat, txt, 0, don)
        if (disp) { await afficherDiag(this.$t('CHdisp')) }
      } else { 
        const [st, chat] = await new NouveauChat().run(this.idI, this.idE, this.txt)
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

    async editer (avecDon) {
      if (this.estDel) {
        if (!await this.session.editUrgence()) return
      } else {
        if (!await this.session.edit()) return
      }
      if (avecDon) {
        this.dconf = false
        const st = await new EstAutonome().run(this.chat.naE.id)
        if (st !== 1) {
          await afficherDiag(this.$t('CHauto'))
          return
        }
      }
      this.txt = this.chat ? this.chat.txt : ''
      this.avecDon = avecDon
      this.ui.oD('ACchatedit')
    },

    async raccrocher () {
      if (this.estDel) {
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
      cfg: stores.config,
      session: stores.session,
      pSt: stores.people, 
      ui: stores.ui,
      aSt: stores.avatar,
      chat: toRef(props, 'chatx') // chat reçu OU créé ici
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bordb
  border-bottom: 1px solid $grey-5
</style>
