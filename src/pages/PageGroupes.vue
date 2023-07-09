<template>
<q-page class="q-pa-sm column items-center">
  <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

  <q-card class="largeur40 maauto column items-center">

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
  </q-card>

  <div v-if="!gSt.pgLgFT.length" class="q-my-lg largeur40 titre-lg text-italic text-center">
    {{$t('PGvide', [gSt.pgLg.size])}}
  </div>

    <div class="q-my-lg petitelargeur maauto" v-if="gSt.pgLgFT.length">
      <div v-for="(e, idx) in gSt.pgLgFT" :key="e.groupe.id">
        <q-expansion-item group="g1" switch-toggle-side :class="dkli(idx)" @click="exp(e.groupe)">
          <template v-slot:header>
            <div class="row full-width items-center justify-between">
              <div class="row items-center">
                <img class="photomax" :src="e.groupe.photo" />
                <div class="titre-md q-ml-sm">{{e.groupe.na.nomc}}</div>
                <div v-if="e.groupe.dfh" class="q-ml-md">
                  <q-icon name="warning" size="md" color="negative"/>
                  <span class="q-ml-xs q-pa-xs bg-yellow-3 text-negative">{{$t('PGnh')}}</span>
                </div>
                <div v-if="gSt.nbMesInvits(e)" class="q-ml-md">
                  <q-icon name="star" size="md" color="green-5"/>
                  <span class="q-ml-xs q-pa-xs bg-yellow-3 text-warning">{{$t('PGinv')}}</span>
                </div>
               </div>
            </div>
            <q-btn class="q-ml-md btn1" icon="open_in_new" size="md" color="primary" dense @click.stop="courant(e)"/>
          </template>
          <apercu-groupe class="q-ml-lg" :eg="e" :idx="idx" :mapmc="mapmc"/>
        </q-expansion-item>
      </div>
    </div>

    <!-- Nouveau groupe ------------------------------------------------>
    <q-dialog v-model="crgr" persistent>
      <q-card class="bs petitelargeur column">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg text-center">{{$t('PGcrea')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <div class="q-pa-xs">
          <div class="titre-md q-mb-xs text-center">{{$t('PGnom', [nom || '?'])}}</div>
          <nom-avatar class="titre-md q-mb-sm" verif groupe @ok-nom="okNom"/>
          <div class="titre-md q-my-sm">{{$t('PGquotas')}}</div>
          <choix-quotas :quotas="quotas" />
          <q-option-group :options="options" type="radio" v-model="una"/>
          <q-card-actions align="right">
            <q-btn dense flat color="warning" :label="$t('renoncer')" @click="MD.fD" />
            <q-btn dense flat color="primary" :disable="quotas.err || !nom"
              :label="$t('creer')" v-close-popup @click="okCreation" />
          </q-card-actions>
        </div>
      </q-card>
    </q-dialog>

</q-page>
</template>

<script>
import { toRef, ref } from 'vue'
import stores from '../stores/stores.mjs'
import { edvol, $t } from '../app/util.mjs'
import { MD, Motscles } from '../app/modele.mjs'
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
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },

    edq1 (n) { return edvol(n * UNITEV1) },
    edq2 (n) { return edvol(n * UNITEV2) },
    ed1 (n) { return edvol(n) },
    ed2 (n) { return edvol(n) },

    async courant (elt) {
      this.session.setGroupeId(elt.groupe.id)
      this.ui.setPage('groupe', 'groupe')
    },

    exp (g) {
      this.session.setGroupeId(g.id)
    },

    async nvGr () {
      if (!await this.session.edit()) return
      const cpt = this.aSt.compta.compteurs
      let max1 = Math.floor(((cpt.q1 * UNITEV1) - cpt.v1) / UNITEV1)
      if (max1 < 0) max1 = 0
      let max2 = Math.floor(((cpt.q2 * UNITEV2) - cpt.v2) / UNITEV2)
      if (max2 < 0) max2 = 0
      this.quotas = { q1: 0, q2: 0, min1: 0, min2: 0, max1, max2, err: ''}
      this.nom = ''
      this.una = false
      this.ovcrgr()
    },
    okNom (n) { this.nom = n },
    async okCreation () {
      console.log(this.nom, this.quotas.q1, this.quotas.q2, this.una)
      await new NouveauGroupe().run(this.nom, this.una, this.quotas)
      MD.fD()
    }
  },

  data () {
    return {
      quotas: null, // { q1, q2, min1, min2, max1, max2, err}
      nom: '',
      una: false
    }
  },

  setup (props) {
    const ui = stores.ui
    const session = stores.session
    const aSt = stores.avatar
    const fStore = stores.filtre
    const gSt = stores.groupe

    const options = [
      { label: $t('AGsimple'), value: false },
      { label: $t('AGunanime'), value: true, color: 'warning' }
    ]

    const tous = toRef(props, 'tous')
    fStore.filtre.groupes.tous = tous.value || false

    const mapmc = ref(Motscles.mapMC(true, 0))
    fStore.contexte.groupes.mapmc = mapmc.value
    fStore.contexte.groupes.groupeId = 0
    const stats = fStore.stats

    const crgr = ref(false)
    function ovcrgr () { MD.oD(crgr) }

    return {
      MD, crgr, ovcrgr,
      ui, session, aSt, gSt,
      stats,
      mapmc,
      options
    }
  }

}
</script>

<style lang="css">
.q-item { padding: 8px 1px !important; }
</style>
<style lang="sass" scoped>
@import '../css/app.sass'
.btn1
  height: 1.5rem !important
</style>
