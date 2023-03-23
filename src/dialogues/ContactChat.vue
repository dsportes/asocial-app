<template>
<q-layout container view="hHh lpR fFf" style="width:80vw">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="close"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CChtit')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-card style="height:50vh">
    <q-card-section>
      <q-input dense v-model="pc" :label="$t('NPphl')" counter :rules="[r1]" maxlength="32"
        :type="isPwd ? 'password' : 'text'" :hint="$t('entree')"
        @keydown.enter.prevent="ok">
        <template v-slot:append>
          <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
          <span :class="pc.length === 0 ? 'disabled' : ''"><q-icon name="cancel" class="cursor-pointer"  @click="razphrase"/></span>
        </template>
      </q-input>
    </q-card-section>

    <apercu-chat v-if="chat" class="q-my-sm" :na-e="chat.naE" :na-i="chat.naI" :ids="chat.ids" :idx="0" :mapmc="mapmc"/>
    </q-card>
  </q-page-container>
</q-layout>
</template>

<script>
import { ref } from 'vue'
import ApercuChat from '../components/ApercuChat.vue'
import { PhraseContact, Motscles, Chat } from '../app/modele.mjs'
import stores from '../stores/stores.mjs'
import { afficherDiag } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { ReactivationChat, GetAvatarPC } from '../app/operations.mjs'

export default ({
  name: 'ContactChat',

  /* La tribu est nécessaire pour une action du Comptable
  qui lui peut choisir la tribu du parrainé */
  props: { close: Function },

  components: { ApercuChat, BoutonHelp },

  computed: {
  },

  data () {
    return {
      isPwd: false,
      pc: '',
      naE: null,
      chat: null
    }
  },

  watch: {
  },

  methods: {
    r1 (val) { return (val.length > 15 && val.length < 33) || this.$t('NP16') },
    razphrase () { this.pc = '' },

    async ok () {
      this.chat = null
      const pStore = stores.people
      const avStore = stores.avatar
      const p = await new PhraseContact().init(this.pc)
      const { cv, na } = await new GetAvatarPC().run(p)
      if (!na) {
        await afficherDiag(this.$t('CChnopc'))
      } else {
        this.naE = na
        const idsI = await Chat.getIds(this.naI, this.naE)
        this.chat = avStore.getChat(this.naI.id, idsI)
        if (this.chat) {
          // MAJ éventuelle de la CV : na: du people, id2: de l'avatar ayant un chat avec lui, cv
          pStore.setPeopleChat (this.naE, this.naI.id, cv) 
          return
        }
        const [disp, chat] = await new ReactivationChat().run(this.naI, this.naE)
        if (disp) {
          // Improbable : on a accédé à sa phrase de contact juste avant !!!
          pStore.setDisparu(this.naE)
          await afficherDiag(this.$t('avdisp'))
        } else {
          avStore.setChat(chat)
          this.chat = chat
        }
      }
    }
  },

  setup () {
    const session = stores.session
    const naI = session.avC.na
    const mapmc = ref(Motscles.mapMC(true, 0))

    return {
      mapmc,
      session,
      naI
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
@import '../css/input.sass'
.q-toolbar
  min-height: 0 !important
  padding: 0 !important
</style>
