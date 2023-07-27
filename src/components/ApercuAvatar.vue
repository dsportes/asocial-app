<template>
  <q-card :class="dkli(idx)">
    <apercu-genx :na="avatar.na" :cv="avatar.cv" :idx="idx" est-avc :cvchangee="cvchangee"/>

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
      <q-btn v-if="edit && !avatar.na.estComptable" class="q-ml-sm" dense flat color="primary" size="sm"
        :label="$t('FAdeclpc')" @click="oveditionpc"/>
    </div>

    <!-- Dialogue d'édition de la phrase de contact -->
    <q-dialog v-model="editionpc" persistent>
      <q-card class="bs q-ma-xs largeur30 fs-md">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg text-center">{{$t('FAphc')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <q-card-section>
          <phrase-contact @ok="declPC" :init-val="avatar.pc || ''"
          declaration :orgext="session.org"/>
        </q-card-section>
        <q-card-actions vertical>
          <q-btn v-if="avatar.pc" flat color="warning" :label="$t('FAsup')" @click="supprPC"/>
          <!--q-btn :disable="pc === null" flat color="primary" :label="$t('FAdpc')" @click="declPC"/-->
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-card>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import { MajCv, GetAvatarPC, ChangementPC, ExistePhrase } from '../app/operations.mjs'
import BoutonHelp from './BoutonHelp.vue'
import ApercuGenx from './ApercuGenx.vue'
import PhraseContact from './PhraseContact.vue'
import { afficherDiag } from '../app/util.mjs'
import { MD } from '../app/modele.mjs'

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
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async cvchangee (res) {
      if (res) {
        await new MajCv().run(this.avatar, res.ph, res.info)
      }
    },
    async editerpc () {
      if (!await this.session.edit()) return
      this.oveditionpc()
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
      MD.fD()
    },
    async supprPC () {
      await new ChangementPC().run(this.avatar.na)
      MD.fD()
    }
  },

  setup (props) {
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

    const editionpc = ref(false)
    function oveditionpc () { MD.oD(editionpc)}

    return {
      MD,
      editionpc, oveditionpc,
      avatar,
      session: stores.session
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
