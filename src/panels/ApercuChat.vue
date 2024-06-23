<template> <!-- BtnCond incorporés -->
<q-dialog v-model="ui.d.ACouvrir" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated>
      <q-toolbar class="bg-secondary text-white">
        <btn-cond color="warning" icon="chevron_left" @click="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">
          {{!zombi ? $t('CHoch3', [nomI, nomE]) : $t('CHzombi')}}
        </q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <div v-if="!zombi">
        <div v-if="chat.stE===0" class="text-warning text-bold bg-yellow-5">
              {{$t('CHraccroche2', [session.getCV(chat.idE).nom])}}</div>
        <div v-if="chat.stI===0" class="text-warning text-bold bg-yellow-5">{{$t('CHraccroche')}}</div>
        <div v-if="chat.stE === 2" class="text-center full-width bg-yellow-5 titre-lg text-bold text-negative q-paxs">
          {{$t('disparu')}}</div>
        <apercu-genx v-else class="bordb" :id="chat.idE" :idx="0" />
        <div :class="sty() + 'q-pa-xs row justify-around items-center'">
          <div v-if="chat.stE !== 2" class="row q-gutter-xs items-center">
            <btn-cond :label="$t('CHadd1')" icon="add" @ok="editer(false)"
              :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
            <btn-cond v-if="session.estA" :label="$t('CHadd2')" icon="savings"
              @ok="editer(true)" :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
          </div>
          <btn-cond v-if="chat.stI" 
            :label="$t('CHrac')" icon="phone_disabled" @ok="raccrocher()"
            :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
          <div v-if="!chat.stI" class="text-warning text-bold titre-md text-italic">
            {{$t('CHraccroche')}}
          </div>
        </div>
      </div>
    </q-header>

    <q-page-container>
      <q-card  v-if="!zombi" class="q-pa-sm">
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
                <btn-cond v-if="it.a===0 && !it.dhx" size="sm" icon="clear" color="secondary"
                  @ok="effacer(it.dh)" 
                  :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
              </div>
            </template>
          </q-chat-message>
        </div>
      </q-card>
    </q-page-container>

    <!-- Confirmation d'effacement d'un échange -->
    <q-dialog v-model="ui.d.ACconfirmeff">
      <q-card :class="styp('sm')">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHeff')}}
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="delete" :cond="ui.urgence ? 'cUrgence' : 'cEdit'"
            :label="$t('CHeffcf')" @ok="effop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmation du raccrocher -->
    <q-dialog v-model="ui.d.ACconfirmrac">
      <q-card :class="styp('sm')">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHrac2', [nomE])}}
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="clear"
            :cond="ui.urgence ? 'cUrgence' : 'cEdit'"
            :label="$t('CHrac')" @ok="passifop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'ajout d'un item au chat -->
    <q-dialog v-model="ui.d.ACchatedit">
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHadd1')}}</q-toolbar-title>
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
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="add" :cond="ui.urgence ? 'cUrgence' : 'cEdit'"
            :label="$t('valider')"  @ok="addop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</q-dialog>
</template>
<script>

// import { } from 'vue'

import stores from '../stores/stores.mjs'

import { styp, sty, dhcool, dkli, afficherDiag } from '../app/util.mjs'
import { MajChat, StatutAvatar, PassifChat } from '../app/operations4.mjs'
import { ID } from '../app/api.mjs'

import SdBlanc from '../components/SdBlanc.vue'
import EditeurMd from '../components/EditeurMd.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import { GetCompta } from '../app/synchro.mjs'

export default {
  name: 'ApercuChat',

  props: { },

  components: { SdBlanc, EditeurMd, ApercuGenx, BoutonHelp, BtnCond },

  computed: {
    chat () { return this.aSt.getChat(this.ui.chatc.id, this.ui.chatc.ids) },
    nomE () { return this.chat ? this.session.getCV(this.chat.idE).nom : ''},
    nomI () { return this.chat ? this.session.getCV(this.chat.id).nom : ''},
    estDel () { return ID.estComptable(this.idE) || this.session.estDelegue },
    zombi () { return this.ui.chatc._zombi }
  },

  watch: {
    mod (ap) {
      console.log(this.idc2, mod)
    }
  },

  data () { return {
    dconf: false,
    txt: '',
    avecDon: false,
    mdon: this.cfg.dons2[0]
  }},

  methods: {
    async effacer (dh) {
      this.dheff = dh
      this.ui.oD('ACconfirmeff')
    },

    async effop () {
      this.ui.fD()
      const disp = await new MajChat().run(this.chat, null, this.dheff)
      if (disp) { await afficherDiag(this.$t('CHdisp')) }
      this.dheff = 0
    },

    async addop () {
      // console.log('ApercuChat.addop', 'fD')
      this.ui.fD()
      if (this.avecDon && this.mdon) {
        await new GetCompta().run()
        const compta = this.session.compta
        if (this.mdon * 100 > compta.solde + 2) {
          await afficherDiag(this.$t('CHcred', [compta.solde, this.mdon * 100]))
          return
        }
      }
      const don = this.avecDon ? this.mdon * 100 : 0
      const txt = (this.avecDon && !this.dconf ? (this.$t('CHdonde', [this.mdon]) + '\n') : '') + this.txt
      const disp = await new MajChat().run(this.chat, txt, 0, don)
      if (disp) { await afficherDiag(this.$t('CHdisp')) }
      this.txt = ''
    },

    async passifop () {
      // console.log('ApercuChat.passifOp', 'fD')
      this.ui.fD()
      const suppr = await new PassifChat().run(this.chat)
      if (suppr) { await afficherDiag(this.$t('CHsuppr')) }
    },

    async editer (avecDon) {
      if (avecDon) {
        this.dconf = false
        const st = await new StatutAvatar().run(this.chat.idE)
        if (st !== 1) {
          await afficherDiag(this.$t('CHauto'))
          return
        }
      }
      this.txt = this.chat ? this.chat.txt : ''
      this.avecDon = avecDon
      // console.log('ApercuChat.editer', 'ACchatedit')
      this.ui.oD('ACchatedit')
    },

    async raccrocher () {
      this.txt = ''
      // console.log('ApercuChat.raccrocher', 'ACconfirmrac')
      this.ui.oD('ACconfirmrac')
    }
  },

  setup (props) {
    return {
      ui: stores.ui,
      styp, sty, dkli, dhcool,
      cfg: stores.config,
      session: stores.session,
      pSt: stores.people, 
      aSt: stores.avatar
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bordb
  border-bottom: 1px solid $grey-5
</style>
