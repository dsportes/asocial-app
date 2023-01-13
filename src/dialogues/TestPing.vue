<template>
  <q-card class="q-ma-xs moyennelargeur">
    <q-toolbar class="bg-secondary text-white">
      <q-toolbar-title class="titre-lg q-ml-sm">{{$t('TPt1')}}</q-toolbar-title>
      <q-btn dense size="md" color="warning" icon="close" @click="ui.testPing = false"/>
    </q-toolbar>

    <q-card-section class="q-mt-md">
      <div class="titre-lg">{{$t('TPt2')}}</div>
      <div v-if="session.accesNet" class="q-ml-md">
        <q-btn dense label="Ping du serveur" color="primary" @click="pingsrv"/>
        <div>{{ resultat1a }}</div>
        <div>{{ resultat1b }}</div>
      </div>
      <div v-else class="q-ml-md text-italic">{{$t('TP2')}}</div>
    </q-card-section>
    <q-card-section>
      <div class="titre-lg">{{$t('TPt3')}}</div>
      <div v-if="session.accesNet && session.reseau" class="q-ml-md">
        <q-btn dense label="Ping de la base sur le serveur" color="primary" @click="pingsrvdb"/>
        <div>{{ resultat2a }}</div>
        <div v-html="resultat2b"/>
      </div>
      <div v-else class="q-ml-md text-italic">{{$t('TP3')}}</div>
    </q-card-section>
    <q-card-section>
      <div class="titre-lg">{{$t('TPt4')}}</div>
      <div v-if="session.ok && session.accesNet" class="q-ml-md">
        <q-btn dense label="Ping de la base locale" color="primary" @click="pingIDB"/>
        <div>{{ resultat3a }}</div>
        <div v-html="resultat3b"/>
      </div>
      <div v-else class="q-ml-md text-italic">{{$t('TP4')}}</div>
    </q-card-section>
  </q-card>
</template>
<script>
import { dhcool, $t, html } from '../app/util.mjs'
import { ping, post } from '../app/net.mjs'
import stores from '../stores/stores.mjs'
import { getCompte } from '../app/db.mjs'

export default ({
  name: 'TestPing',

  data () {
    return {
      resultat1a: '-',
      resultat1b: '-',
      resultat2a: '-',
      resultat2b: '-',
      resultat3a: '-',
      resultat3b: '-'
    }
  },

  methods: {
    async pingsrv () {
      this.resultat1a = '-'
      this.resultat1b = '-'
      const ret = await ping()
      if (!ret.startsWith('$KO')) {
        this.resultat1a = 'OK'
        const d = new Date(ret)
        this.resultat1b = dhcool(d.getTime(), true)
      } else {
        this.resultat1a = 'KO'
        this.resultat1b = ret.substring(4)
      }
    },

    async pingsrvdb () {
      this.resultat2a = '-'
      this.resultat2b = '-'
      try {
        const ret = await post(null, 'm1', 'pingdb', {})
        this.resultat2a = 'OK'
        this.resultat2b = dhcool(Math.floor(ret.dhc / 1000), true)
      } catch (exc) {
        this.resultat2a = 'KO'
        this.resultat2b = html(exc)
      }
    },

    async pingIDB () {
      if (!this.session.accesIdb) {
        this.resultat3a = $t('TP1')
      } else {
        this.resultat3a = '-'
        this.resultat3b = '-'
        try {
          await getCompte()
          this.resultat3a = 'OK'
        } catch (exc) {
          this.resultat3a = 'KO'
          this.resultat3b = html(exc)
        }
      }
    }
  },

  setup () {
    return {
      ui: stores.ui,
      session: stores.session
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/input.sass'
.q-card__section
  padding: 5px
.q-toolbar
  min-height: 0 !important
  padding: 0 !important
</style>
