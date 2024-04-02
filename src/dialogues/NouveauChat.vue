<template>
<q-dialog v-model="ui.d.CCouvrir" persistent>
  <q-card :class="styp('sm')">
  <q-toolbar class="bg-secondary text-white">
    <q-btn dense size="md" color="warning" padding="none" icon="close" @click="ui.fD"/>
    <q-toolbar-title class="titre-lg full-size text-center">{{$t('CChtit')}}</q-toolbar-title>
    <bouton-help page="page1"/>
  </q-toolbar>
  <q-card-section v-if="step===1">
    <phrase-contact @ok="ok" :orgext="session.org" declaration/>
    <div v-if="diag" class="q-ma-sm q-pa-xs bg-yellow-3 text-negative text-bold">{{diag}}</div>
  </q-card-section>
  <q-card-section v-if="step===2">
    <apercu-genx :id="idE" :del="del"/>
    <div class="q-mt-md q-mb-sm titre-md">{{$t('CHech1')}}</div>
    <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
  </q-card-section>
  <q-card-actions v-if="step===2" align="right">
    <q-btn dense flat size="md" color="primary" padding="none" icon="close" @click="ui.fD"/>
    <btn-cond color="warning" icon="check" @ok="creer" :disable="!txt.length"
      :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
  </q-card-actions>
</q-card>

<apercu-chat v-if="ui.d.ACouvrir[idc]" :idc="idc" :chat="chat"/>

</q-dialog>
</template>

<script>
import stores from '../stores/stores.mjs'
import { styp } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { GetAvatarPC, NouveauChat } from '../app/operations4.mjs'
import PhraseContact from '../components/PhraseContact.vue'

export default ({
  name: 'NouveauChat',

  props: { 
    /* Le chat PEUT être créé en tant que: 
    0:par phrase de contact, 1:délégué, idg:co-membre du groupe */
    mode: Number,
    idI: Number, // avatar du compte
    idE: Number // avater externe, co-membre d'un groupe ou délégué ou à contacter
  },

  components: { PhraseContact, BoutonHelp },

  computed: {
  },

  data () {
    return {
      step: this.mode ? 2 : 1,
      diag: '',
      txt: ''
    }
  },

  watch: {
  },

  methods: {
    async ok (p) {
      this.hZC = p.hpsc
      const id = await new GetAvatarPC().run(p)
      if (!id) this.diag = this.$t('CChnopc')
      else this.step = 2
    },

    async creer () {
      this.chat = await new NouveauChat().run(this.idI, this.idE, this.mode, this.hZC, this.txt)
      if (this.chat) {
        this.ui.fD()
        this.ui.oD('ACouvrir', this.idc)
      }
    }
  },

  setup () {
    const ui = stores.ui
    const idc = ref(ui.getIdc())

    return {
      aSt: stores.avatar,
      session: stores.session,
      ui, idc, styp
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
@import '../css/input.sass'
</style>
