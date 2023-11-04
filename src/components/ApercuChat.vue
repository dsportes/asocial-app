<template>
  <q-card v-if="chat">
    <div :class="'column q-px-sm ' + dkli(idx)">
      <apercu-people v-if="!affnai" class="bordb" :id="naE.id" :idx="idx" />
      <div class="q-mt-xs row justify-between items-center">
        <div class="text-italic fs-md">
          <span v-if="chat.stI===1" class="q-mr-sm">{{$t('actif')}}</span>
          <span class="q-mr-sm">{{$t('CHnbit', chat.items.length, {count:chat.items.length} )}}</span>
        </div>
        <div>
          <span class="text-italic font-mono q-mr-sm">{{dhcool(chat.dh)}}</span>
          <q-btn color="primary" icon="open_in_new" @click="ovouvrir"/>
        </div>
      </div>
      <div class="fs-md">{{chat.tit}}</div>
    </div>

    <!-- Dialogue d'édition du texte du chat -->
    <q-dialog v-model="ouvrir" full-height persistent>
      <q-layout container view="hHh lpR fFf" :class="sty" style="width:80vw">
        <q-header elevated class="bg-secondary text-white">
          <q-toolbar>
            <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
            <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHoch3', [naE.nom])}}</q-toolbar-title>
            <bouton-help page="page1"/>
          </q-toolbar>
          <apercu-people v-if="!affnai" class="bordb" :id="naE.id" :idx="idx" />
          <div class="q-pa-xs row justify-around">
            <q-btn :label="$t('CHadd2')" icion="add" color="primary" @click="editer"/>
            <q-btn :label="$t('CHrac')" icion="phone_disabled" color="primary" @click="raccrocher"/>
          </div>
        </q-header>

        <q-page-container>
          <q-card class="q-pa-sm">
            <div v-for="(it, n) in chat.items" :key="n">
              <q-chat-message :sent="it.a===0" 
                :bg-color="(it.a===0) ? 'primary' : 'secondary'" 
                text-color="white"
                :stamp="dhcool(it.dh)">
                <sd-dark1 v-if="!it.dhx" :texte="it.txt"/>
                <div v-else class="text-italic text-negative">{{$t('CHeffa', [dhcool(it.dhx)])}}</div>
                <template v-slot:name>
                  <div class="full-width row justify-between items-center">
                    <span>{{it.a===0 ? $t('moi') : naE.nom}}</span>
                    <q-btn v-if="it.a===0 && !it.dfx" size="sm" icon="clear" color="warning" @click="effacer(it.dh)"/>
                  </div>
                </template>
              </q-chat-message>
            </div>
          </q-card>
        </q-page-container>
      </q-layout>
    </q-dialog>

    <!-- Confirmation d'effacement d'un échange -->
    <q-dialog v-model="confirmeff">
      <q-card class="bs">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHeff')}}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD"/>
          <q-btn flat :label="$t('CHeffcf')" color="warning" @click="effop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmation du raccrocher -->
    <q-dialog v-model="confirmrac">
      <q-card class="bs">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHrac2', [naE.nom])}}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD"/>
          <q-btn flat :label="$t('CHrac')" color="warning" @click="passifop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'ajout d'un item au chat -->
    <q-dialog v-model="chatedit">
      <q-card>
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHadd')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
        <q-card-actions align="right">
          <q-btn flat :label="$t('renoncer')" color="primary" @click="MD.fD"/>
          <q-btn flat :label="$t('valider')" color="warning" @click="addop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-card>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import SdDark1 from './SdDark1.vue'
import EditeurMd from './EditeurMd.vue'
import { dhcool, afficherDiag, dkli } from '../app/util.mjs'
import ApercuPeople from './ApercuPeople.vue'
import BoutonHelp from './BoutonHelp.vue'
import { MajChat, PassifChat } from '../app/operations.mjs'
import { ID } from '../app/api.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'ApercuChat',

  props: { naI: Object, naE: Object, ids: Number, idx: Number, mapmc: Object, affnai: Boolean },

  components: { SdDark1, EditeurMd, ApercuPeople, BoutonHelp },

  computed: { 
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    estSp () {
      const id = this.naE.id
      return ID.estComptable(id) || this.pSt.estSponsor(id)
    }
  },

  data () { return {
    txt: ''
  }},

  methods: {
    async effacer (dh) {
      if (this.estSp) {
        if (!await this.session.editUrgence()) return
      } else {
        if (!await this.session.edit()) return
      }
      this.txt = this.chat ? this.chat.txt : ''
      this.ovconfirmeff()
      this.dheff = dh
    },

    async effop () {
      await new MajChat().run(this.naI, this.naE, null, this.dheff, this.chat)
      this.dheff = 0
      MD.fD()
    },

    async addop () {
      await new MajChat().run(this.naI, this.naE, this.txt, 0, this.chat)
      this.txt = ''
      MD.fD()
    },

    async passifop () {
      await new PassifChat().run(this.naI.id, this.chat.ids)
      MD.fD()
    },

    async editer () {
      if (this.estSp) {
        if (!await this.session.editUrgence()) return
      } else {
        if (!await this.session.edit()) return
      }
      this.txt = this.chat ? this.chat.txt : ''
      this.ovchatedit()
    },

    async raccrocher () {
      if (this.estSp) {
        if (!await this.session.editUrgence()) return
      } else {
        if (!await this.session.edit()) return
      }
      this.txt = this.chat ? this.chat.txt : ''
      this.ovconfirmrac()
    }
  },

  setup (props) {
    const session = stores.session
    const pSt = stores.people
    const aSt = stores.avatar
    const naI = toRef(props, 'naI')
    const naE = toRef(props, 'naE')
    const ids = toRef(props, 'ids')

    function getC () { return aSt.getChat(naI.value.id, ids.value) }

    const chat = ref(getC())

    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if ((name === 'setChat' && args[0].id === naI.value.id && args[0].ids === ids.value) ||
          (name === 'delChat' && args[0] === naI.value.id && args[1] === ids.value)){
          chat.value = getC()
        }
      })
    })

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => naI.value, (ap, av) => {
        chat.value = getC()
      }
    )

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => naE.value, (ap, av) => {
        chat.value = getC()
      }
    )

    /* Nécessaire pour tracker le changement d'ids
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => ids.value, (ap, av) => {
        chat.value = getC()
      }
    )

    const chatedit = ref(false)
    function ovchatedit () { MD.oD(chatedit) }
    const ouvrir = ref(false)
    function ovouvrir () { MD.oD(ouvrir) }
    const confirmeff = ref(false)
    function ovconfirmeff () { MD.oD(confirmeff) }
    const confirmrac = ref(false)
    function ovconfirmrac () { MD.oD(confirmrac) }


    return {
      MD, chatedit, ovchatedit, ouvrir, ovouvrir, confirmeff, ovconfirmeff,
      confirmrac, ovconfirmrac,
      dkli, dhcool,
      session, pSt,
      chat
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bordb
  border-bottom: 1px solid $grey-5
.nom
  max-height: 1.3rem
  overflow: hidden
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.btn1
  padding: 0 !important
  width: 1.5rem !important
</style>
