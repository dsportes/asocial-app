<template>
  <q-card v-if="avatar" :class="dkli(idx)">
    <apercu-genx :id="idav" :idx="idx"/>

    <div class="q-mt-sm" v-if="avatar.pc">
      <div>
        <span class="titre-md text-italic">{{$t('FApc')}}</span>
        <btn-cond cond="cEdit" class="q-ml-lg" flat
          :label="$t('FApcms')" @ok="editerpc"/>
        </div>
      <div class="q-ml-lg font-mono fs-md text-bold">[{{avatar.pc}}]</div>
    </div>
    <div v-else>
      <span class="titre-md text-italic">{{$t('FAnpc')}}</span>
      <btn-cond v-if="!ID.estComptable(idav)" cond="cEdit" class="q-ml-lg" flat
        :label="$t('FApcms')" @ok="editerpc"/>
    </div>

    <!-- Dialogue d'édition de la phrase de contact -->
    <q-dialog v-model="ui.d.AAeditionpc[idc]" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center">{{$t('FAphc')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <q-card-section class="q-pa-xs">
          <phrase-contact @ok="declPC" :init-val="avatar.pc || ''"
            declaration :orgext="session.org"/>
        </q-card-section>
        <q-card-actions align="right">
          <btn-cond v-if="avatar.pc" :label="$t('FAsup')" @ok="supprPC"
            flat color="warning" cond="cEdit"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-card>
</template>
<script>

import { ref } from 'vue'

import stores from '../stores/stores.mjs'
import { GetAvatarPC, ChangementPC } from '../app/operations4.mjs'
import { ExistePhrase } from '../app/synchro.mjs'
import BoutonHelp from './BoutonHelp.vue'
import ApercuGenx from './ApercuGenx.vue'
import PhraseContact from './PhraseContact.vue'
import BtnCond from './BtnCond.vue' 
import { afficherDiag, dkli, styp } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

export default {
  name: 'ApercuAvatar',

  props: { idav: Number, idx: Number },

  components: { PhraseContact, BoutonHelp, ApercuGenx, BtnCond },

  computed: {
    avatar () { const e = this.aSt.getElt(this.idav)
      return e ? e.avatar : null
    }
  },

  data () {
    return {
      isPwd: false
    }
  },

  methods: {
    async editerpc () {
      this.session.setAvatarId(this.idav)
      this.ui.oD('AAeditionpc', this.idc)
    },
    
    async declPC (pc) {
      if (!pc) return
      if (await new ExistePhrase().run(pc.hps1, 3)) {
        await afficherDiag(this.$t('existe'))
        return
      }
      const id = await new GetAvatarPC().run(pc)
      if (id) {
        if (id === this.idav) {
          afficherDiag(this.$t('FAerr1')) // déjà celle de l'avatar
          return
        }
        if (id === -1) {
          afficherDiag(this.$t('FAerr3')) // trop proche d'une déjà utilisée par un autre avatar
          return
        }
        if (id !== this.idav) {
          afficherDiag(this.$t('FAerr2')) // déjà exactement utilisée par un autre avatar
          return
        }
      }
      await new ChangementPC().run(this.avatar.id, pc)
      this.ui.fD()
    },

    async supprPC () {
      await new ChangementPC().run(this.avatar.id)
      this.ui.fD()
    }
  },

  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const aSt = stores.avatar
    const idc = ref(ui.getIdc())

    return {
      dkli, ID, idc, styp,
      session, ui, aSt
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.q-btn
  padding: 0 !important
</style>
