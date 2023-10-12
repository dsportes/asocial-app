<template>
<q-card class="bs largeur30">
  <q-toolbar class="bg-secondary text-white">
    <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
    <q-toolbar-title class="titre-lg full-size text-center">{{$t('CChtit')}}</q-toolbar-title>
    <bouton-help page="page1"/>
  </q-toolbar>

  <q-card-section>
    <phrase-contact @ok="ok" :orgext="session.org"/>
  </q-card-section>
</q-card>
</template>

<script>
import { ref } from 'vue'
import { MD, Motscles, Chat } from '../app/modele.mjs'
import stores from '../stores/stores.mjs'
import { afficherDiag } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { GetAvatarPC, NouveauChat } from '../app/operations.mjs'
import PhraseContact from '../components/PhraseContact.vue'

export default ({
  name: 'ContactChat',

  props: { },

  components: { PhraseContact, BoutonHelp },

  computed: {
  },

  data () {
    return {
      naE: null,
      chat: null
    }
  },

  watch: {
  },

  methods: {
    async ok (p) {
      this.chat = null
      const pSt = stores.people
      const aSt = stores.avatar
      const { cv, na } = await new GetAvatarPC().run(p)
      if (!na) {
        await afficherDiag(this.$t('CChnopc'))
      } else {
        this.naE = na
        this.naI = this.aSt.avC.na
        const idsI = await Chat.getIds(this.naI, this.naE)
        this.chat = aSt.getChat(this.naI.id, idsI)

        if (this.chat) {
          // MAJ éventuelle de la CV : na: du people, id2: de l'avatar ayant un chat avec lui, cv
          pSt.setPeopleChat (this.chat, cv) 
          return
        }
        
        const txt = '*' + this.$t('bonjour2', [this.naE.nom])
        const [st, chat] = await new NouveauChat().run(this.naI, this.naE, txt)
        if (st === 0) {
          await afficherDiag(this.$t('OPnvch0'))
        } else  {
          this.chat = chat
          if (st === 2) await afficherDiag(this.$t('OPnvch2'))
        }
      }
      MD.fD()
    }
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const mapmc = ref(Motscles.mapMC(true, 0))

    return {
      aSt,
      MD,
      mapmc,
      session
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
