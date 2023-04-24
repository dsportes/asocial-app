<template>
  <q-page class="q-pa-xs">
    <div class="titre-md q-my-sm row">
      <q-btn v-if="!ns" dense size="md" icon="add" class="q-mr-sm"
        color="primary" @click="plusNS"/>
      <q-btn v-if="ns" dense size="md" icon="undo" class="q-mr-sm"
        color="primary" @click="cancelNS"/>
      <div class="titre-md text-bold q-mr-sm">{{$t('ESne')}}</div>
      <div class="fs-lg font-mono text-bold q-mr-sm">{{ns}}</div>
      <bouton-confirm :actif="ns" :confirm="creerNS"/>
    </div>

    <div v-for="(e, idx) in session.paLeFT" :key="e.id">
      <apercu-espace :esp="e" :idx="idx"/>
    </div>

  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import ApercuEspace from '../components/ApercuEspace.vue'

export default {
  name: 'PageAdmin',

  components: { BoutonConfirm, ApercuEspace },

  computed: {
  },

  methods: {
    plusNS () {
      const mesp = this.session.espaces
      for (let id = 10; id < 90; id++) {
        if (!mesp.has(id)) { this.ns = id; break }
      }
    },
    cancelNS () {
      this.ns = 0
    },
    async creerNS () {
      await new CreerEspace().run(this.ns)
    }
  },

  data () {
    return {
      ns: 0
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
