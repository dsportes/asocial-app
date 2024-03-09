<template>
<q-page class="q-pa-sm column items-center">
  <q-card class="spmd column items-center">

    <q-btn class="q-my-sm" size="md" dense color="primary" padding="xs"
      :label="$t('PGcrea')" @click="nvGr"/>

    <div class="q-my-sm full-width">
      <div class="row">
        <div class="col-6">{{$t('PGstatsh')}}</div>
        <div class="col-3 fs-md text-italic text-center">{{$t('nbnotes')}}</div>
        <div class="col-3 fs-md text-italic text-center">{{$t('volv2')}}</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PGvut')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{stats.groupes.v1}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ed2(stats.groupes.v2)}}</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PGvq')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ '[' + stats.groupes.q1 + '] / ' + edq1(stats.groupes.q1)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ '[' + stats.groupes.q2 + '] / ' + edq2(stats.groupes.q2)}}</div>
      </div>
    </div>
  </q-card>

  <q-card v-if="session.accesNet" class="spsm q-my-lg">
    <div class="full-width titre-md text-italic bg-primary text-white q-mt-md text-center">
      {{$t('ICtit', gSt.invits.size, {count: gSt.invits.size})}}
    </div>
    <div v-for="([k, inv], idx) of gSt.invits" :key="k">
      <div :class="dkli(idx) + 'q-mx-xs row invs cursor-pointer items-center'" @click="ouvaccinv(inv)">
        <q-icon class="col-1" size="md" name="zoom_in"/>
        <div class="col-5">{{inv.na.nom}}</div>
        <div class="col-6">{{inv.ng.nom}}</div>
      </div>
    </div>
  </q-card>

  <div v-if="!gSt.pgLgFT.length" class="q-my-lg titre-lg text-italic text-center">
    {{$t('PGvide', [gSt.pgLg.size])}}
  </div>

  <div class="spmd" v-if="gSt.pgLgFT.length">
    <q-card v-for="(e, idx) in gSt.pgLgFT" :key="e.groupe.id" :class="dkli(idx) + 'q-mb-md'">
      <apercu-genx :id="e.groupe.id" :idx="idx" />
      <div class="row full-width items-center justify-between">
        <div>
          <div v-if="e.groupe.dfh" class="q-mr-sm">
            <q-icon name="warning" size="md" color="negative"/>
            <span class="q-ml-xs q-pa-xs bg-yellow-3 text-negative">{{$t('PGnh')}}</span>
          </div>
          <div class="q-mr-sm">
            <q-icon v-if= "nbiv(e)" class="q-mr-xs" name="star" size="md" color="green-5"/>
            <span class="text-italic">{{$t('PGinv', nbiv(e), {count: nbiv(e)})}}</span>
          </div>
        </div>
        <div class="row justify-end">
          <q-btn class="q-ml-md" size="sm" icon="chat" :label="$t('PGchat')" 
            color="primary" dense padding="xs" @click.stop="chat(e)"/>
          <q-btn class="q-ml-md" size="sm" icon="open_in_new" :label="$t('page')" 
            color="primary" dense padding="xs" @click.stop="courant(e)"/>
        </div>
      </div>
    </q-card>
  </div>

  <!-- Acceptation de l'invitation -->
  <q-dialog v-model="ui.d.IAaccinvit[idc]" full-height persistent position="left">
    <invitation-acceptation :idg="inv.ng.id" :im="inv.im" :na="inv.na"/>
  </q-dialog>

  <!-- Nouveau groupe ------------------------------------------------>
  <q-dialog v-model="ui.d.PGcrgr" persistent>
    <q-card :class="styp('sm')">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center">{{$t('PGcrea')}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <div class="q-pa-xs">
        <div class="titre-md q-mb-xs text-center">{{$t('PGnom', [nom || '?'])}}</div>
        <nom-avatar class="titre-md q-mb-sm" verif groupe @ok-nom="okNom"/>
        <div class="titre-md q-my-sm">{{$t('PGquotas')}}</div>
        <choix-quotas :quotas="quotas" groupe/>
        <q-option-group :options="options" type="radio" v-model="una"/>
        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn flat dense padding="xs" color="primary" icon="undo"
            :label="$t('renoncer')" @click="ui.fD" />
          <q-btn dense padding="xs" color="warning" icon="add" 
            :disable="quotas.err || !nom" :label="$t('creer')" @click="okCreation" />
        </q-card-actions>
      </div>
    </q-card>
  </q-dialog>

  <apercu-chatgr v-if="ui.d.ACGouvrir[idc]" :idc="idc"/>

</q-page>
</template>

<script>
import { toRef, ref } from 'vue'
import stores from '../stores/stores.mjs'
import { edvol, $t, dkli, styp } from '../app/util.mjs'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import NomAvatar from '../components/NomAvatar.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ApercuChatgr from '../panels/ApercuChatgr.vue'
import InvitationAcceptation from '../components/InvitationAcceptation.vue'
import { UNITEN, UNITEV } from '../app/api.mjs'
import { NouveauGroupe } from '../app/operations.mjs'

export default {
  name: 'PageGroupes',

  props: { tous: Boolean },

  components: { ChoixQuotas, NomAvatar, BoutonHelp, ApercuGenx, ApercuChatgr, InvitationAcceptation },

  computed: {
  },

  methods: {
    edq1 (n) { return n * UNITEN },
    edq2 (n) { return edvol(n * UNITEV) },
    ed2 (n) { return edvol(n) },

    nbiv (e) { return this.gSt.nbMesInvits(e) },

    async ouvaccinv (inv) {
      if (!await this.session.edit()) return
      this.inv = inv
      this.ui.oD('IAaccinvit', this.idc)
    },

    async courant (elt) {
      this.session.setGroupeId(elt.groupe.id)
      this.ui.setPage('groupe', 'groupe')
    },

    async chat (elt) {
      this.session.setGroupeId(elt.groupe.id)
      this.ui.oD('ACGouvrir', this.idc)
    },

    exp (g) {
      this.session.setGroupeId(g.id)
    },

    async nvGr () {
      if (!await this.session.edit()) return
      const cpt = this.aSt.compta.compteurs.qv
      let max1 = Math.floor(((cpt.q1 * UNITEN) - (cpt.nn + cpt.nc + cpt.ng)) / UNITEN)
      if (max1 < 0) max1 = 0
      let max2 = Math.floor(((cpt.q2 * UNITEV) - cpt.v2) / UNITEV)
      if (max2 < 0) max2 = 0
      this.quotas = { q1: 0, q2: 0, min1: 0, min2: 0, max1, max2, err: ''}
      this.nom = ''
      this.una = false
      this.ui.oD('PGcrgr')
    },

    okNom (n) { this.nom = n },
    
    async okCreation () {
      console.log(this.nom, this.quotas.q1, this.quotas.q2, this.una)
      await new NouveauGroupe().run(this.nom, this.una, this.quotas)
      this.ui.fD()
    }
  },

  data () {
    return {
      quotas: null, // { q1, q2, min1, min2, max1, max2, err}
      nom: '',
      una: false,
      inv: null // invitation courante
    }
  },

  setup (props) {
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    const session = stores.session
    const aSt = stores.avatar
    const fStore = stores.filtre
    const stats = fStore.stats
    const gSt = stores.groupe

    const options = [
      { label: $t('AGsimple'), value: false },
      { label: $t('AGunanime'), value: true, color: 'warning' }
    ]

    const tous = toRef(props, 'tous')
    fStore.filtre.groupes.tous = tous.value || false

    return {
      ui, session, aSt, gSt, dkli, styp, idc,
      stats,
      options
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.invs:hover
  background-color: $secondary !important
  color: white !important
</style>
