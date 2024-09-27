<template>
<div>
  <div class="row">
    <div class="text-italic text-bold titre-md q-mr-sm">{{$t('CAVtit')}}</div>
    <div v-for="(e, idx) in aSt.chatsDuCompte(idE)" :key="e.id">
      <span v-if="idx === 0 && (e.ch || (!e.ch && del))" class="q-mr-md bord">
        <span class="fs-md q-mr-sm">{{e.nom}}</span>
        <btn-cond v-if="e.ch" round icon="open_in_new" cond="cVisu" @ok="ouvrirChat(e.ch)"/>
        <btn-cond v-else round icon="add" cond="cEdit" @ok="creerChat()"/>
      </span>
      <span v-else>
        <span v-if="e.ch" class="q-mr-md bord">
          <span class="fs-md q-mr-sm">{{e.nom}}</span>
          <btn-cond round icon="open_in_new" cond="cVisu" @ok="ouvrirChat(e.ch)"/>
        </span>
      </span>
    </div>
  </div>

  <nouveau-chat v-if="ui.d.CCouvrir[idc]" :idc="idc" :idI="session.compteId" :idE="idE" :mode="2"/>

  <q-dialog v-model="ui.d.CAACouvrir[idc]" full-height position="left" persistent>
    <apercu-chat :id="chat.id" :ids="chat.ids"/>
  </q-dialog>

</div>
</template>
<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { dhcool } from '../app/util.mjs'
import NouveauChat from '../dialogues/NouveauChat.vue'
import ApercuChat from '../panels/ApercuChat.vue'
import BtnCond from './BtnCond.vue'

export default ({
  name: 'ChatsAvec',

  components: { ApercuChat, NouveauChat, BtnCond },

  props: { 
    idE: String, 
    /* Quand idE est délégué de la partition du compte. 
    Si le compte n'a pas de chat, le bouton de création propose la création */
    del: Boolean
  },

  computed: {
  },

  data () {
    return {
      chat: null
    }
  },

  methods: {
    ouvrirChat (ch) {
      this.chat = ch
      this.ui.setChatc(ch.id, ch.ids)
      this.ui.oD('CAACouvrir', this.idc)
    },
    creerChat () {
      this.ui.oD('CCouvrir', this.idc)
    },
  },
  
  setup () {
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    return {
      ui, idc,
      aSt: stores.avatar,
      pSt: stores.people,
      session: stores.session,
      dhcool
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 5px
</style>
