<template>
<div>
  <div class="row justify-center q-gutter-sm q-my-xs">
    <q-btn v-if="session.estComptable" dense color="primary" size="sm"
      :label="$t('PPcht')" @click="chgTribu"/>
    <q-btn v-if="session.estComptable" dense color="primary" size="sm"
      :label="$t('PPchsp')" @click="chgSponsor"/>
    <q-btn v-if="session.estComptable || session.estSponsor" dense color="primary" size="sm"
      :label="$t('PPcompta')" @click="voirCompta"/>
  </div>

  <!-- Changement de tribu -->
  <q-dialog v-model="chgTr" persistent>
    <q-card class="moyennelargeur">
      <div class="titre-lg bg-secondary text-white text-center">{{$t('PPchgtr', [na.nom, avStore.tribuC.na.nom])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqv1', [avStore.ccCpt.q1, edv1(avStore.ccCpt.q1), pc1])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqv2', [avStore.ccCpt.q2, edv2(avStore.ccCpt.q2), pc2])}}</div>

      <q-separator class="q-mt-sm"/>

      <q-card-section>
        <q-input filled v-model="avStore.ppFiltre" :label="$t('PPnt')" />
        <div class="titre-md text-italic row items-center">
          <div class="col-2 text-center">{{$t('PPc1')}}</div>
          <div class="col-4">{{$t('PPc2')}}</div>
          <div class="col-3 text-center">{{$t('PPc3')}}</div>
          <div class="col-3 text-center" >{{$t('PPc4')}}</div>
        </div>
      </q-card-section>

      <q-card-section style="height: 30vh" class="scroll bord1">
        <div v-for="x in avStore.ppTribusF" :key="x.id" 
          :class="'row items-center cursor-pointer' + (x.id === avStore.ppSelId ? ' bord2' : '')"
          @click="selTr(x)">
          <q-icon class="col-2 text-center" :name="x.ok ? 'check' : 'close'" size="md" :color="x.ok ? 'primary' : 'negative'" />
          <div class="col-4">{{x.nom}}</div>
          <div class="col-3 text-center">{{x.r1}}</div>
          <div class="col-3 text-center">{{x.r2}}</div>
        </div>
      </q-card-section>

      <q-separator />      
      <q-card-actions align="center">
        <q-btn dense color="primary" :label="$t('renoncer')" @click="chgTr=false"/>
        <q-btn dense color="warning" :label="$t('valider')" :disable="!avStore.ppSelId"
          v-close-popup @click="changerTr()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Changement de statut sponsor -->
  <q-dialog v-model="chgSp" persistent>
    <q-card class="bg-secondary text-white petitelargeur q-pa-sm">
        <div v-if="avStore.mbCpt(na.id).sp" class="text-center q-my-md titre-md">{{$t('PPsp', [avStore.tribuC.na.nom])}}</div>
        <div v-else class="text-center q-my-md titre-md">{{$t('PPco', [avStore.tribuC.na.nom])}}</div>
      <q-card-actions align="center">
        <q-btn dense color="primary" :label="$t('renoncer')" @click="chgSp=false"/>
        <q-btn v-if="avStore.mbCpt(na.id).sp" dense color="warning" :label="$t('PPkosp')" v-close-popup  @click="changerSp(false)"/>
        <q-btn v-else dense color="warning" :label="$t('PPoksp')" v-close-popup  @click="changerSp(true)"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Affichage des compteurs de compta du compte "courant"-->
  <q-dialog v-model="cptdial" persistent full-height>
    <q-layout container view="hHh lpR fFf" :class="sty" style="width:80vw">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="cptdial = false"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTcompta', [na.nomc])}}</q-toolbar-title>
        </q-toolbar>
      </q-header>
      <q-page-container>
        <q-card>
          <panel-compta :c="avStore.ccCpt" style="margin:0 auto"/>
        </q-card>
      </q-page-container>
    </q-layout>
  </q-dialog>

</div>
</template>
<script>

import stores from '../stores/stores.mjs'
// import BoutonHelp from '../components/BoutonHelp.vue'
import PanelCompta from '../components/PanelCompta.vue'
import { edvol } from '../app/util.mjs'
import { GetCompteursCompta, SetAttributTribu2, ChangerTribu } from '../app/operations.mjs'
import { Compteurs, UNITEV1, UNITEV2 } from '../app/api.mjs'

export default {
  name: 'BarrePeople',
  components: { PanelCompta },

  props: { na: Object },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    pc1 () { return this.avStore.ccCpt.q1 ? Math.round((this.avStore.ccCpt.v1 * 100) / (this.avStore.ccCpt.q1 * UNITEV1)) : 0 },
    pc2 () { return this.avStore.ccCpt.q2 ? Math.round((this.avStore.ccCpt.v2 * 100) / (this.avStore.ccCpt.q2 * UNITEV2)) : 0 }
  },

  watch: {
  },
  
  data () {
    return {
      chgSp: false,
      chgTr: false,
      cptdial: false
    }
  },

  methods: {
    edv1 (v) { return edvol(v * UNITEV1) },
    edv2 (v) { return edvol(v * UNITEV2) },
    async chgTribu () { 
      this.avStore.ccCpt = new Compteurs(await new GetCompteursCompta().run(this.na.id))
      this.avStore.ppFiltre = ''
      this.chgTr = true
    },
    async chgSponsor () { 
      this.chgSp = true
    },
    async voirCompta () { 
      this.avStore.ccCpt = new Compteurs(await new GetCompteursCompta().run(this.na.id))
      this.cptdial = true
    },
    async changerSp(estSp) { // (id, na, attr, val, val2, exq)
      await new SetAttributTribu2().run(this.session.tribuCId, this.na, 'sp', estSp)
      this.chgSp = false
    },
    selTr (x) { if (x.ok) this.avStore.ppSelId = x.id },
    async changerTr () {
      const [t, t2] = await new ChangerTribu().run(this.na, this.avStore.ppSelId)
      this.avStore.setTribuC(t, t2)
    }
  },

  setup () {
    const session = stores.session
    const pStore = stores.people
    const avStore = stores.avatar

    return {
      session,
      avStore,
      pStore
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
.bord2
  background: $yellow-3
  color: black
  font-weight: bold
.q-card__section
  padding: 2px !important
.q-btn
  padding: 0 3px !important
</style>
