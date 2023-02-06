<template>
<q-card>
  <q-toolbar class="bg-secondary text-white">
    <q-toolbar-title class="titre-lg q-ml-sm">{{$t('PMEtit')}}</q-toolbar-title>
    <q-btn dense size="md" color="warning" icon="close" @click="fermermenu"/>
  </q-toolbar>

  <div class="column items-start">
    <div class="text-primary font-mono fs-md q-pl-md q-ma-none">{{$t('PMEbuild', [config.build])}}</div>
    <q-btn flat :label="$t('PMEmod')" @click="tgdark" />
    <q-btn flat :label="$t('PMEgbl')" color="primary" @click="ouvrirbases"/>
    <q-btn flat :label="$t('PMEtac')" color="primary" @click="ouvrirping"/>
    <q-btn flat :label="$t('PMEras')" color="primary" @click="ouvrirsynchro"/>
    <q-btn flat :label="$t('PMEcry')" color="primary" @click="ouvrircrypto"/>
  </div>
</q-card>
</template>

<script>
import { useQuasar } from 'quasar'
import stores from '../stores/stores.mjs'

export default ({
  name: 'PanelMenu',

  components: { },

  data () {
    return {
    }
  },

  methods: {
    async aut (n) { return await this.session.aut(n) },
    ouvrirbases () { this.ui.gestionBases = true; this.fermermenu() },
    async ouvrirping () { if (await this.aut(4)) { this.ui.testPing = true; this.fermermenu() } },
    async ouvrirsynchro () { if (await this.aut(4)) { this.ui.rapportSynchroMenu = true; this.fermermenu() } },
    async ouvrircrypto () { if (await this.aut(4)) { this.ui.outilsCrypto = true; this.fermermenu() } }
  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const $q = useQuasar()

    function fermermenu () { ui.menu = false }

    function tgdark () { $q.dark.toggle(); fermermenu() }

    return {
      session,
      ui,
      config: stores.config,
      fermermenu,
      tgdark
    }
  }

})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.q-toolbar
  min-height: 0 !important
  padding: 0 !important
</style>
