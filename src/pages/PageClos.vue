<template>
  <q-page class="column align-start items-center">
    <!-- Application close par l'administrateur -->
    <q-card v-if="session.excKO.code === 9999" class="q-mt-lg spsm column justify-center">
      <div class="text-center">
        <span class="titre-lg">{{$t('ECclos', [session.org])}}</span>
        <bouton-bulle class="q-mr-md fs-md" icon="report_problem" idtext="clos"/>
      </div>
      <div class="q-mt-md q-mb-sm text-center text-italic titre-md">{{$t('ECmi', [dh])}}</div>
      <show-html class="bord" zoom maxh="10rem" :texte="ng.texte"/>
      <q-btn class="q-mt-lg text-center" flat :label="$t('jailu')" @click="deconn"/>
    </q-card>

    <!-- Compte disparu en cours de session, chgt phrase ou résiliation -->
    <q-card v-if="session.excKO.code === 8998" class="q-mt-lg spsm column justify-center">
      <div class="text-center titre-lg titre-italic">
        {{$t('compteKO', [cpt.na.id, cpt.na.nom])}}
      </div>
      <q-btn class="q-mt-lg text-center" flat size="lg"
        color="warning" :label="$t('jailu')" @click="deconn"/>
    </q-card>

    <!-- Toute exception survenue en synchronisation -->
    <q-card v-if="session.excKO.code < 9900" class="q-mt-lg spsm column justify-center">
      <div class="text-center titre-lg titre-italic">{{$t('sessionKO')}}</div>
      <div class="text-center titre-sm q-my-md q-mx-md" v-html="html(session.excKO)"/>
      <q-btn class="q-mt-lg text-center" flat size="lg"
        color="warning" :label="$t('jailu')" @click="deconn"/>
    </q-card>
  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import BoutonBulle from '../components/BoutonBulle.vue'
import { dhcool, html } from '../app/util.mjs'
import { deconnexion } from '../app/synchro.mjs'
import ShowHtml from '../components/ShowHtml.vue'

export default {
  name: 'PageClos',

  components: { BoutonBulle, ShowHtml },

  computed: {
    dh () { return this.ng ? dhcool(this.ng.dh) : '' }
  },

  methods: {
    deconn () { deconnexion() }
  },

  data () {
    return {
    }
  },

  setup () {
    const session = stores.session
    return {
      session, 
      html,
      ui: stores.ui,
      cpt: stores.avatar.compte,
      ng: session.notifs.G || { texte: '???' }, // notifs.G
      exc: session.excKo
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
