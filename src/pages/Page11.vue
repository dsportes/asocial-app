<template>
  <q-page class="q-pr-sm">
    <info-restriction :niveau="3"/>
    <div class="titre-lg text-center">{{$t('P11tit', lst.length)}}</div>

    <div class="column items-center q-py-sm q-gutter-xs">
      <div>
        <q-btn size="md" icon="add" :label="$t('CPTnvav')" color="primary" no-caps dense @click="ouvrirnv"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
      <div v-if="session.compte.avatarIds().size > 1">
        <q-btn class="q-ml-sm" size="md"
          icon="manage_accounts" no-caps :label="$t('CPTrep')" color="primary" dense @click="ouvrirrf"/>
        <bouton-help class="q-ml-sm" page="page1"/>
      </div>
    </div>

    <q-separator/>

    <div v-for="(av, idx) in lst" :key=av.avatar.na.id class="q-py-md">
      <div class="row items-start zone">
        <q-btn class="col-auto q-mr-sm play" flat dense color="primary" icon="play_arrow" @click="nav(av.avatar.na.id)"/>
        <fiche-avatar class="col" :avatar="av.avatar" :idx="idx"/>
      </div>
    </div>

    <nouvel-avatar v-if="ui.nouvelAvatar"/>

    <!--repartir-forfait v-if="ui.repartirForfaits"/-->

  </q-page>
</template>

<script>
import { watch, computed } from 'vue'
import stores from '../stores/stores.mjs'
import FicheAvatar from '../components/FicheAvatar.vue'
import InfoRestriction from '../components/InfoRestriction.vue'
import NouvelAvatar from '../components/NouvelAvatar.vue'
import BoutonHelp from '../components/BoutonHelp.vue'

export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: 'Page11',

  components: { BoutonHelp, FicheAvatar, InfoRestriction, NouvelAvatar },

  methods: {
    async ouvrirrf () {
      if (!await this.session.aut(3, true)) return
      this.ui.repartirForfaits = true
    },

    async ouvrirnv () {
      if (!await this.session.aut(3, true)) return
      this.ui.nouvelAvatar = true
    },
    nav (id) {
      this.ui.goto21(id)
    }
  },

  setup () {
    const avatars = stores.listeAvatars
    const session = stores.session
    const ui = stores.ui

    let cbDem = false // true si le calculBase a été demandé
    watch(avatars, (ap) => {
      if (cbDem || !ap.modifs) return // pas modifié OU une demande de calcul est en cours
      cbDem = true; setTimeout(() => { avatars.calculBase(); cbDem = false }, 10)
    })

    avatars.calculBase()
    return {
      avatars,
      session,
      ui,
      lst: computed(() => { return avatars.liste }),
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.play:hover
  color: $warning !important
</style>

