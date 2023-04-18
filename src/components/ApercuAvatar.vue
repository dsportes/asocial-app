<template>
  <q-card :class="dkli(idx)">
    <apercu-genx :na="na" :cv="avatar.cv" :idx="idx" est-avc :cvchangee="cvchangee"/>

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
        :label="$t('FAdeclpc')" @click="editerpc"/>
    </div>

    <!-- Dialogue d'édition de la phrase de contact -->
    <q-dialog v-model="editionpc" persistent>
      <q-card class="q-ma-xs moyennelargeur fs-md">
        <q-toolbar class="bg-secondary text-white">
          <bouton-help page="page1"/>
          <q-toolbar-title class="titre-lg q-pl-sm">{{$t('FAphc')}}</q-toolbar-title>
          <q-btn dense size="md" color="warning" icon="close" @click="editionpc = false"/>
        </q-toolbar>
        <q-card-section>
          <q-input dense v-model="pc" :label="$t('NPphl')" counter :rules="[r1]" maxlength="32"
            :type="isPwd ? 'password' : 'text'">
            <template v-slot:append>
              <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
              <span :class="pc.length === 0 ? 'disabled' : ''"><q-icon name="cancel" class="cursor-pointer"  @click="razphrase"/></span>
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions vertical>
          <q-btn v-if="avatar.pc" flat color="warning" :label="$t('FAsup')" v-close-popup @click="supprPC"/>
          <q-btn :disable="r1(pc) !== true" flat color="primary" :label="$t('FAdpc')" v-close-popup @click="declPC"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-card>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import { MajCv, GetAvatarPC, ChangementPC } from '../app/operations.mjs'
import BoutonHelp from './BoutonHelp.vue'
import ApercuGenx from './ApercuGenx.vue'
import { afficherDiag } from '../app/util.mjs'
import { PhraseContact } from '../app/modele.mjs'

export default {
  name: 'ApercuAvatar',

  props: { na: Object, idx: Number, edit: Boolean },

  components: { BoutonHelp, ApercuGenx },

  computed: {
  },

  data () {
    return {
      editionpc: false,
      pc: '',
      isPwd: false
    }
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    r1 (val) { return (val.length > 15 && val.length < 33) || this.$t('NP16') },
    async cvchangee (res) {
      if (res && this.na) {
        await new MajCv().run(this.avatar, res.ph, res.info)
      }
    },
    razphrase () { this.pc = '' },
    async editerpc () {
      if (!await this.session.edit()) return
      this.editionpc = true
      this.pc = this.avatar.pc || ''
    },
    async declPC () {
      const p = await new PhraseContact().init(this.pc)
      const { id, na } = await new GetAvatarPC().run(p)
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
      await new ChangementPC().run(this.avatar.na, p)
    },
    async supprPC () {
      await new ChangementPC().run(this.avatar.na)
    }
  },

  setup (props) {
    const aSt = stores.avatar
    const na = toRef(props, 'na')

    function getAv() { return aSt.getAvatar(na.value.id) }
    const avatar = ref(getAv())

    aSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setAvatar' && args[0].id === na.value.id) {
          avatar.value = args[0]
        }
      })
    })

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => na.value, (ap, av) => {
        avatar.value = getAv()
      }
    )

    return {
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
