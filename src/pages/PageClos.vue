<template>
  <q-page class="column align-start items-center">
    <q-card class="q-mt-lg petitelargeur column justify-center">
    <div class="text-center">
      <span class="titre-xl">{{$t('ECclos', [session.org])}}</span>
      <bouton-help class="q-mr-md fs-md" page="page1"/>
    </div>
    <div class="q-mt-md q-mb-sm text-center text-italic titre-md">{{$t('ECmi', [dh])}}</div>
    <show-html class="bord" zoom maxh="10rem" :texte="txt"/>
    <q-btn class="q-mt-lg text-center" flat :label="$t('jailu')" @click="login"/>
    </q-card>
  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { dhcool } from '../app/util.mjs'

export default {
  name: 'PageClos',

  components: { BoutonHelp },

  computed: {
    dh () { return dhcool(this.session.notifAdmin.dh) },
    txt () { return this.session.notifAdmin.texte }
  },

  methods: {
    login () { this.ui.setPage('login') }
  },

  data () {
    return {
    }
  },

  setup () {
    return {
      ui: stores.ui,
      session: stores.session
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
