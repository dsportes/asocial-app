<template>
  <q-page class="q-pa-sm">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <q-btn class="q-my-sm" size="md" dense color="primary" 
      :label="$t('PGcrea')" @click="nvGr"/>

    <div class="petitelargeur q-my-sm">
      <div class="row">
        <div class="col-6"></div>
        <div class="col-3 fs-md text-italic text-center">V1</div>
        <div class="col-3 fs-md text-italic text-center">V2</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PGvut')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ed1(stats.groupes.v1)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ed2(stats.groupes.v2)}}</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PGvq')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ stats.groupes.q1 + ' / ' + edq1(stats.groupes.q1)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ stats.groupes.q2 + ' / ' + edq2(stats.groupes.q2)}}</div>
      </div>
    </div>

    <q-separator color="orange"/>
    <div v-if="!gSt.pgLgFT.length" class="titre-lg text-italic">
      {{$t('PGvide', [gSt.pgLg.size])}}
    </div>

    <div v-if="gSt.pgLgFT.size">
      <div v-for="(e, idx) in gSt.listeGrFT" :key="e.groupe.id">
        <div class="row items-start">
          <q-btn flat icon="navigate_next" size="lg" class="col-auto q-mr-sm"
            :color="e.groupe.id === session.groupeId ? 'warning' : 'primary'" @click="courant(e)"/>
          <apercu-groupe class="q-my-sm" :eltg="e" :idx="idx"/>
        </div>
      </div>
    </div>

    <!-- Nouveau groupe ------------------------------------------------>
    <q-dialog v-model="crGr" persistent>
      <q-card class="petitelargeur shadow-8 column">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="closeGr"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PGcrea')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <div class="q-pa-xs">
          <div class="titre-md q-mb-xs text-center">{{$t('PGnom', [nom || '?'])}}</div>
          <nom-avatar class="titre-md q-mb-sm" verif groupe @ok-nom="okNom"/>
          <div class="titre-md q-my-sm">{{$t('PGquotas')}}</div>
          <choix-quotas :quotas="quotas" />
          <q-checkbox v-model="ferme" class="cb" :label="$t('PGferme')" />
          <q-card-actions align="right">
            <q-btn dense flat color="warning" :label="$t('renoncer')" v-close-popup />
            <q-btn dense flat color="primary" :disable="quotas.err || !nom"
              :label="$t('creer')" v-close-popup @click="okCreation" />
          </q-card-actions>
        </div>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script>
import { toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { edvol } from '../app/util.mjs'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import NomAvatar from '../components/NomAvatar.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuGroupe from '../components/ApercuGroupe.vue'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { NouveauGroupe } from '../app/operations.mjs'

export default {
  name: 'PageGroupes',

  props: { tous: Boolean },

  components: { ChoixQuotas, NomAvatar, BoutonHelp, ApercuGroupe },

  computed: {
  },

  methods: {
    edq1 (n) { return edvol(n * UNITEV1) },
    edq2 (n) { return edvol(n * UNITEV2) },
    ed1 (n) { return edvol(n) },
    ed2 (n) { return edvol(n) },

    async courant (elt) {
      this.session.setGroupeId(elt.groupe.id)
      this.ui.setPage('groupe')
    },

    async nvGr () {
      if (!await this.session.edit()) return
      const cpt = this.avStore.compta.compteurs
      let max1 = Math.floor(((cpt.q1 * UNITEV1) - cpt.v1) / UNITEV1)
      if (max1 < 0) max1 = 0
      let max2 = Math.floor(((cpt.q2 * UNITEV2) - cpt.v2) / UNITEV2)
      if (max2 < 0) max2 = 0
      this.quotas = { q1: 0, q2: 0, min1: 0, min2: 0, max1, max2, err: ''}
      this.nom = ''
      this.ferme = false
      this.crGr = true
    },
    okNom (n) { this.nom = n },
    closeGr () { this.crGr = false },
    async okCreation () {
      console.log(this.nom, this.quotas.q1, this.quotas.q2, this.ferme)
      await new NouveauGroupe().run(this.nom, this.ferme, this.quotas)
    }
  },

  data () {
    return {
      quotas: null, // { q1, q2, min1, min2, max1, max2, err}
      crGr: false,
      nom: '',
      ferme: false
    }
  },

  setup (props) {
    const tous = toRef(props, 'tous')
    stores.filtre.filtre.groupes.tous = tous.value || false
    return {
      ui: stores.ui,
      session: stores.session,
      avStore: stores.avatar,
      stats: stores.filtre.stats,
      gSt: stores.groupe
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
