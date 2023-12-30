<template>
  <q-page class="column align-start items-center">
    <q-card v-if="!ui.compteKO" class="q-mt-lg spsm column justify-center">
      <div class="text-center">
        <span class="titre-xl">{{$t('ECclos', [session.org])}}</span>
        <bouton-bulle class="q-mr-md fs-md" icon="report_problem" idtext="clos"/>
      </div>
      <div class="q-mt-md q-mb-sm text-center text-italic titre-md">{{$t('ECmi', [dh])}}</div>
      <show-html class="bord" zoom maxh="10rem" :texte="notifAdmin.texte"/>
      <q-btn class="q-mt-lg text-center" flat :label="$t('jailu')" @click="deconn"/>
    </q-card>

    <q-card v-else class="q-mt-lg spsm column justify-center">
      <div class="text-center titre-xl titre-italic">
        {{$t('compteKO', [cpt.na.id, cpt.na.nom])}}
      </div>
      <q-btn class="q-mt-lg text-center" flat size="lg"
        color="warning" :label="$t('jailu')" @click="deconn"/>
    </q-card>
  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import BoutonBulle from '../components/BoutonBulle.vue'
import { dhcool } from '../app/util.mjs'
import { deconnexion } from '../app/connexion.mjs'
import ShowHtml from '../components/ShowHtml.vue'

export default {
  name: 'PageClos',

  components: { BoutonBulle, ShowHtml },

  computed: {
    dh () { return dhcool(this.notifAdmin.dh) }
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
    const notifAdmin = session.notifAdmin
    const ui = stores.ui
    const cpt = stores.avatar.compte
    return {
      notifAdmin, cpt,
      session, ui
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
