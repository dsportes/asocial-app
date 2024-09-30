<template> <!-- BtnCond incorporés -->
<q-dialog v-model="ui.d[idc].CCouvrir" persistent>
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
    <apercu-genx :id="nvIdE || idE"/>
    <div class="q-mt-md q-mb-sm titre-md">{{$t('CHech1')}}</div>
    <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
  </q-card-section>
  <q-card-actions v-if="step===2" align="right">
    <q-btn dense flat size="md" color="primary" :label="$t('renoncer')"
      padding="none" icon="close" @click="ui.fD"/>
    <btn-cond color="warning" icon="check" @ok="creer" 
      :label="$t('valider')"
      :disable="!txt.length"
      :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
  </q-card-actions>
</q-card>

</q-dialog>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { styp } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { GetAvatarPC, NouveauChat } from '../app/operations4.mjs'
import PhraseContact from '../components/PhraseContact.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import EditeurMd from '../components/EditeurMd.vue'
import BtnCond from '../components/BtnCond.vue'

export default ({
  name: 'NouveauChat',

  props: { 
    /* Le chat PEUT être créé en tant que: 
    0:par phrase de contact, 1:comptable, 2:délégué, idg:co-membre du groupe */
    mode: Number,
    idI: String, // avatar du compte
    idE: String, // avater externe, co-membre d'un groupe ou délégué ou à contacter
    idc: Number // idc d'ouverture du dialogue
  },

  components: { PhraseContact, BoutonHelp, ApercuGenx, EditeurMd, BtnCond },

  computed: {
  },

  data () {
    return {
      step: this.mode ? 2 : 1,
      diag: '',
      txt: '',
      nvIdE: 0
    }
  },

  watch: {
  },

  methods: {
    async ok (p) {
      this.hZC = p.hpsc
      this.nvIdE = await new GetAvatarPC().run(p)
      if (!this.nvIdE) {
        this.diag = this.$t('CChnopc')
        return
      }
      const cpt = this.session.compte
      if (cpt.mav.has(this.nvIdE)) {
        this.diag = this.$t('CChself')
        return
      }
      this.step = 2
    },

    async creer () {
      this.chat = await new NouveauChat()
        .run(this.idI, this.nvIdE || this.idE, this.mode, this.hZC, this.txt)
      this.ui.fD()
    }
  },

  setup () {
    return {
      aSt: stores.avatar,
      session: stores.session,
      ui: stores.ui, 
      styp
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
@import '../css/input.sass'
</style>
