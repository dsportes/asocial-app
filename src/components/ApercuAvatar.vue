<template>
  <q-card :class="dkli(idx)">
    <apercu-genx :id="avatar.id" :idx="idx"/>

    <div class="q-mt-sm" v-if="avatar.pc">
      <div>
        <span class="titre-md text-italic">{{$t('FApc')}}</span>
        <q-btn v-if="edit" class="q-ml-lg" dense flat color="primary" size="sm"
          :label="$t('FApcms')" @click="editerpc"/>
        </div>
      <div class="q-ml-lg font-mono fs-md text-bold">[{{avatar.pc}}]</div>
    </div>
    <div v-else>
      <span class="titre-md text-italic">{{$t('FAnpc')}}</span>
      <q-btn v-if="edit && !ID.estComptable(avatar.id)" class="q-ml-sm" dense flat color="primary" size="sm"
        :label="$t('FAdeclpc')" @click="editerpc"/>
    </div>

    <!-- Dialogue d'édition de la phrase de contact -->
    <q-dialog v-if="session.avatarId===avatar.id" v-model="ui.d.AAeditionpc" persistent>
      <q-card class="bs q-ma-xs largeur30 fs-md">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center">{{$t('FAphc')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <q-card-section>
          <phrase-contact @ok="declPC" :init-val="avatar.pc || ''"
            declaration :orgext="session.org"/>
        </q-card-section>
        <q-card-actions vertical>
          <q-btn v-if="avatar.pc" flat color="warning" :label="$t('FAsup')" @click="supprPC"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-card>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import { GetAvatarPC, ChangementPC, ExistePhrase } from '../app/operations.mjs'
import BoutonHelp from './BoutonHelp.vue'
import ApercuGenx from './ApercuGenx.vue'
import PhraseContact from './PhraseContact.vue'
import { afficherDiag, dkli } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

export default {
  name: 'ApercuAvatar',

  props: { idav: Number, idx: Number, edit: Boolean },

  components: { PhraseContact, BoutonHelp, ApercuGenx },

  computed: {
  },

  data () {
    return {
      isPwd: false
    }
  },

  methods: {
    async editerpc () {
      if (!await this.session.edit()) return
      this.session.setAvatarId(this.avatar.id)
      this.ui.oD('AAeditionpc')
    },
    
    async declPC (pc) {
      if (!pc) return
      if (await new ExistePhrase().run(pc.hps1, 3)) {
        await afficherDiag(this.$t('existe'))
        return
      }
      const { id, na } = await new GetAvatarPC().run(pc)
      if (id) {
        if (id === this.avatar.id && na) {
          afficherDiag(this.$t('FAerr1')) // déjà celle de l'avatar
          return
        }
        if (id !== this.avatar.id && na) {
          afficherDiag(this.$t('FAerr2')) // déjà exactement utilisée par un autre avatar
          return
        }
        afficherDiag(this.$t('FAerr3')) // trop proche d'une déjà utilisée par un autre avatar
        return
      }
      await new ChangementPC().run(this.avatar.na, pc)
      this.ui.fD()
    },

    async supprPC () {
      await new ChangementPC().run(this.avatar.na)
      this.ui.fD()
    }
  },

  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const aSt = stores.avatar
    const idav = toRef(props, 'idav')

    function getAv() { return aSt.getAvatar(idav.value) }
    const avatar = ref(getAv())

    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setAvatar' && args[0].id === idav.value) {
          avatar.value = args[0]
        }
      })
    })

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => idav.value, (ap, av) => {
        avatar.value = getAv()
      }
    )

    return {
      dkli, ID,
      session, ui,
      avatar
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.q-btn
  padding: 0 !important
</style>
