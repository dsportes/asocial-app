<template>
  <q-page class="q-pa-xs">
    <q-btn class="q-my-sm" dense color="primary" :label="$t('rafraichir')" @click="rafraichir"/>

    <div class="titre-md q-my-sm row items-center">
      <q-btn v-if="!ns" dense size="md" icon="add" class="q-mr-sm btn1"
        color="primary" @click="plusNS"/>
      <q-btn v-if="ns" dense size="md" icon="undo" class="q-mr-sm"
        color="primary" @click="cancelNS"/>
      <div class="titre-md text-bold q-mr-sm">{{$t('ESne')}}</div>
      <div class="fs-lg font-mono text-bold q-mr-sm">{{ns}}</div>
      <bouton-confirm :actif="ns !== 0" :confirmer="creerNS"/>
    </div>

    <div v-for="(e, idx) in session.paLeFT" :key="e.id">
      <apercu-espace class="q-my-md" :esp="e" :idx="idx"/>
      <q-separator class="q-my-sm" color="orange"/>
    </div>

  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import ApercuEspace from '../components/ApercuEspace.vue'
import { CreerEspace, reconnexionCompte } from '../app/connexion.mjs'

export default {
  name: 'PageAdmin',

  components: { BoutonConfirm, ApercuEspace },

  computed: {
  },

  methods: {
    async rafraichir () {
      await reconnexionCompte()
    },
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
      this.ns = 0
    }
  },

  data () {
    return {
      ns: 0
    }
  },

  setup () {
    const session = stores.session
    return {
      session,
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btn1
  max-height: 1.5rem
</style>
