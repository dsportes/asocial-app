<template>
<div>
  <div class="relative-position">
    <div v-if="chatx">
      <div class="q-mt-xs row justify-between items-center">
        <div class="text-italic fs-md">
          <span v-if="chatx.stI===1" class="q-mr-sm">{{$t('actif')}}</span>
          <span v-else class="q-mr-sm text-warning text-bold bg-yellow-5">{{$t('CHraccroche')}}</span>
          <span v-if="chatx.stE===0" class="q-mr-sm text-warning text-bold bg-yellow-5">
            {{$t('CHraccroche2', [session.getCV(chatx.idE).nom])}}</span>
          <span v-if="chatx.stE===2" class="q-mr-sm text-warning text-bold bg-yellow-5">{{$t('CHavdisp')}}</span>
          <span class="q-mr-sm">{{$t('CHnbit', chatx.items.length, {count:chatx.items.length} )}}</span>
        </div>
        <div v-if="chatx.items.length" class="text-italic font-mono q-mr-sm">{{dhcool(chatx.dh)}}</div>
      </div>
      <div class="row justify-between items-start">
        <div v-if="chatx.items.length" class="fs-md">{{chatx.tit}}</div>
        <btn-cond icon="open_in_new" :label="$t('CHbtnov')" @click="ouvrirChat()"
          :cond="ui.urgence ? 'cUrgence' : 'cVisu'" />
      </div>
    </div>
    <div v-else class="row justify-between items-start">
      <div v-if="mode===1" class="col text-italic titre-md">{{$t('CHnxco')}}</div>
      <div v-if="mode===2" class="col text-italic titre-md">{{$t('CHnxdel', [nomE])}}</div>
      <div v-if="mode===0" class="col text-italic titre-md">{{$t('CHnxpc', [nomE])}}</div>
      <div v-if="mode>2" class="col text-italic titre-md">{{$t('CHnxmb', [nomE, nomG])}}</div>
      <btn-cond class="col-auto" icon="open_in_new" :label="$t('CHbtncr')" @ok="creerChat()"
        :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
    </div>
  </div>

  <nouveau-chat v-if="ui.d.CCouvrir[idc]" :idc="idc"
    :idI="chat ? chat.id : idI" 
    :idE="chat ? chat.idE : idE"
    :mode="mode"/>

</div>
</template>
<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { dhcool } from '../app/util.mjs'
import NouveauChat from '../dialogues/NouveauChat.vue'
import BtnCond from './BtnCond.vue'
import { ID } from '../app/api.mjs'

export default ({
  name: 'MicroChat',

  components: { NouveauChat, BtnCond },

  props: { 
    chat: Object, // si chat est donné, c'est lui qui est visualisé
    idI: Number, // sinon couple d'id (avatar du compte, people)
    idE: Number, 
    del: Boolean // Quand le chat n'est pas connu et que idE est délégué de la partition du compte de idI
  },

  computed: {
    chatx () { return this.chat || this.aSt.chatDeAvec(this.idI, this.idE) },

    /* Le chat PEUT être créé en tant que: 
    0:par phrase de contact, 1:comptable, 2:délégué, idg:co-membre du groupe */
    mode () {
      if (ID.estComptable(this.idE)) return 1
      if (this.del) return 2
      const l = this.pSt.getListeIdGrComb(this.idE, this.idI)
      return l.length ? l[0] : 0
    },

    nomE () { return this.session.getCV(this.idE).nom },
    nomG () { return this.session.getCV(this.mode).nom },
  },

 data () {
    return {
    }
  },

  methods: {
    ouvrirChat () {
      this.ui.setChatc(this.chatx.id, this.chatx.ids)
      this.ui.oD('ACouvrir')
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
</style>
