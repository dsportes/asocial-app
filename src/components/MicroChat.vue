<template>
<div>
  <div class="relative-position">
    <div v-if="chatx">
      <div class="q-mt-xs row justify-between items-center">
        <div class="text-italic fs-md">
          <span v-if="chatx.stI===1" class="q-mr-sm">{{$t('actif')}}</span>
          <span v-else class="q-mr-sm text-warning text-bold bg-yellow-5">{{$t('CHraccroche')}}</span>
          <span v-if="chatx.stE===0" class="q-mr-sm text-warning text-bold bg-yellow-5">
            {{$t('CHraccroche2', [chatx.naE.nom])}}</span>
          <span v-if="chatx.stE===2" class="q-mr-sm text-warning text-bold bg-yellow-5">{{$t('CHavdisp')}}</span>
          <span class="q-mr-sm">{{$t('CHnbit', chatx.items.length, {count:chatx.items.length} )}}</span>
        </div>
        <div v-if="chatx.items.length" class="text-italic font-mono q-mr-sm">{{dhcool(chatx.dh)}}</div>
      </div>
      <div v-if="chatx.items.length" class="fs-md">{{chatx.tit}}</div>
    </div>
    <div v-else class="text-italic titre-md">{{$t('CHnotit')}}</div>
    <q-btn class="absolute-bottom-right"
      color="primary" dense icon="open_in_new" padding="xs" size="sm"
      :label="$t(!chatx ? 'CHbtncr' : 'CHbtnov')"
      @click="ouvrirChat()"/>
  </div>

  <apercu-chat v-if="ui.d.ACouvrir[idc]" :idc="idc"
    :na-i="chat ? chat.naI : naI" 
    :na-e="chat ? chat.naE : naE" 
    :chatx="chatx"/>

</div>
</template>
<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { dhcool } from '../app/util.mjs'
import ApercuChat from '../panels/ApercuChat.vue'

export default ({
  name: 'MicroChat',

  components: { ApercuChat },

  props: { 
    chat: Object, // si chat est donné, c'est lui qui est visualisé
    naI: Object, naE: Object // sinon couple de na (avatar du compte, people)
  },

  computed: {
    chatx () { 
      return this.chat || this.aSt.chatDeAvec(this.naI.id, this.naE.id) 
    }
  },

 data () {
    return {
    }
  },

  methods: {
    ouvrirChat () {
      this.ui.oD('ACouvrir', this.idc)
    },
  },
  
  setup () {
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    return {
      ui, idc,
      aSt: stores.avatar,
      session: stores.session,
      dhcool
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
