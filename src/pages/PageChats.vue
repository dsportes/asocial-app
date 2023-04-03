<template>
  <q-page>
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <q-btn v-if="session.accesNet" class="q-my-sm" size="md" no-caps dense color="primary" 
      :label="$t('CVraf')" @click="rafCvs"/>

    <q-btn v-if="session.accesNet" class="q-ml-md q-my-sm" size="md" no-caps dense color="primary" 
      :label="$t('CChtit')" @click="ouvrircc"/>

    <div v-if="!avStore.pcLc.length" class="titre-lg text-italic">{{$t('CHnch')}}</div>
    <div v-if="avStore.pcLc.length && !avStore.pcLcF.length" class="titre-lg text-italic">
      {{$t('CHnch2', [avStore.pcLc.length])}}
    </div>
    
    <div v-if="avStore.pcLcF.length">
      <div v-for="(chat, idx) in avStore.pcLcF" :key="chat.ids">
        <apercu-chat class="q-my-sm" :na-i="chat.naI" :na-e="chat.naE" :ids="chat.ids" :idx="idx" :mapmc="mapmc"/>
      </div>
    </div>

    <q-dialog v-model="cc" persistent style="height:50vh">
      <contact-chat :close="closecc"/>
    </q-dialog>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuChat from '../components/ApercuChat.vue'
import ContactChat from '../dialogues/ContactChat.vue'
import { Motscles } from '../app/modele.mjs'
import { RafraichirCvs } from '../app/operations.mjs'

export default {
  name: 'PageChats',

  components: { ApercuChat, ContactChat },

  computed: {
  },

  methods: {
    ouvrircc () { this.cc = true },
    closecc () { this.cc = false },
    async rafCvs () {
      const [nt, nr] = await new RafraichirCvs().run(this.session.avatarId)
      stores.ui.afficherMessage(this.$t('CVraf2', [nr, nt - nr]), false)
    }
  },

  data () {
    return {
      cc: false
    }
  },

  setup () {
    const avStore = stores.avatar
    const session = stores.session
    const fStore = stores.filtre

    const mapmc = ref(Motscles.mapMC(true, 0))
    fStore.contexte.chats.mapmc = mapmc.value
    fStore.contexte.chats.groupeId = 0

    return {
      ui: stores.ui,
      session,
      avStore,
      mapmc
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
</style>
