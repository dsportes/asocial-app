<template>
  <q-page class="q-pa-xs">
    <q-btn class="q-my-sm" dense color="primary" :label="$t('rafraichir')" @click="rafraichir"/>

    <div class="titre-md q-my-sm row items-center">
      <q-btn dense size="md" icon="add" :label="$t('ESne')" class="q-mr-sm btn1"
        color="primary" :disable="ns !== 0" @click="plusNS"/>
    </div>

    <div v-for="(e, idx) in session.paLeFT" :key="e.id">
      <apercu-espace class="q-my-md" :esp="e" :idx="idx"/>
      <q-separator class="q-my-sm" color="orange"/>
    </div>

    <q-dialog v-model="creationesp" persistent>
      <q-card class="bs petitelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" icon="close" color="warning" @click="cancelNS"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('ESne2', [ns])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <q-card-section class="q-pa-xs">
          <div class="titre-lg text-center q-my-md">{{$t('ESps')}}</div>
          <phrase-secrete @ok="okps" verif icon-valider="check" :label-valider="$t('OK')"/>
          <bouton-confirm class="q-my-lg maauto" :actif="ps !== null" :confirmer="creerNS"/>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import ApercuEspace from '../components/ApercuEspace.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { CreerEspace, reconnexionCompte } from '../app/connexion.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'PageAdmin',

  components: { BoutonConfirm, ApercuEspace, PhraseSecrete, BoutonHelp },

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
      this.ovcreationesp()
    },
    cancelNS () {
      this.ns = 0
      this.ps = null
      MD.fD()
    },
    okps (ps) {
      this.ps = ps
    },
    async creerNS () {
      await new CreerEspace().run(this.ns, this.ps)
      this.ns = 0
      this.ps = null
      MD.fD()
      this.rafraichir()
    }
  },

  data () {
    return {
      ns: 0,
      ps: null
    }
  },

  setup () {
    const session = stores.session
    const creationesp = ref(false)
    function ovcreationesp () { MD.oD(creationesp) }
    return {
      session, creationesp, ovcreationesp
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btn1
  max-height: 1.5rem
</style>
