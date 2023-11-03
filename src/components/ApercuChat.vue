<template>
  <q-card v-if="chat">
    <div :class="'column q-px-sm ' + dkli(idx)">
      <!--
      <div v-if="chat && !chat._zombi" class="row justify-end">
        <div v-if="affnai" class="titre-md text-italic">{{$t('CHoch2', [naI.nom])}}</div>
        <div v-else class="titre-md text-italic">{{$t('CHoch3', [naE.nom])}}</div>
        <div class="titre-md text-italic q-mx-md">{{$t(chat.stI ? 'CHel' : 'CHrac')}}</div>
        <div v-if="chat.dh" class="font-mono fs-md">{{dhcool(chat.dh)}}</div>
      </div>
      <div v-if="chat && chat.st2 === 2" class="row justify-between">
        <div class="titre-md text-italic q-mr-lg">{{$t('CHnch3c', [naE.nom])}}</div>
      </div>
      -->
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
        </q-header>

        <q-page-container>
          <q-card class="q-pa-sm">
            <div v-for="(it, n) in chat.items" :key="n">
              <q-chat-message :sent="n===1" 
                :name="(n===1 ? $t('moi') : naE.nom) + ' - ' + dhcool(it.dh)">
                <sd-dl :texte="it.txt"/> 
              </q-chat-message>
            </div>
          </q-card>
        </q-page-container>
      </q-layout>
    </q-dialog>

    <!-- Dialogue d'ajout d'un item au chat -->
    <q-dialog v-model="chatedit">
      <editeur-md mh="20rem" v-model="txt" :texte="chat ? chat.txt : ''" editable modetxt/>
    </q-dialog>

  </q-card>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import SdDl from './SdDl.vue'
import EditeurMd from './EditeurMd.vue'
import { dhcool, afficherDiag, dkli } from '../app/util.mjs'
import ApercuPeople from './ApercuPeople.vue'
import BoutonHelp from './BoutonHelp.vue'
import { NouveauChat, MajChat } from '../app/operations.mjs'
import { ID } from '../app/api.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'ApercuChat',

  props: { naI: Object, naE: Object, ids: Number, idx: Number, mapmc: Object, affnai: Boolean },

  components: { SdDl, EditeurMd, ApercuPeople, BoutonHelp },

  computed: { 
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    estSp () {
      const id = this.naE.id
      return ID.estComptable(id) || this.pSt.estSponsor(id)
    }
  },

  data () { return {
    u0: new Uint8Array([]),
    txt: ''
  }},

  methods: {
    async editer () {
      if (this.estSp) {
        if (!await this.session.editUrgence()) return
      } else {
        if (!await this.session.edit()) return
      }
      this.txt = this.chat ? this.chat.txt : ''
      this.ovchatedit()
    },

    async chatok (op) { // 1:envoyer, 2:raccrocher
      if (!this.chat) {
        const [st, chat] = await new NouveauChat().run(this.naI, this.naE, this.txt)
        if (st === 0) {
          await afficherDiag(this.$t('OPnvch0'))
        } else  {
          this.chat = chat
          if (st === 2) await afficherDiag(this.$t('OPnvch2'))
        }
      } else {
        const [st, chat] = await new MajChat().run(op, this.naI, this.naE, this.txt, this.chat)
        this.chat = chat
        if (st) await afficherDiag(this.$t('OPmajch' + st))
      }
      MD.fD()
    },

    async changeMc (mc) {
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

    return {
      MD, chatedit, ovchatedit, ouvrir, ovouvrir, dkli, dhcool,
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
