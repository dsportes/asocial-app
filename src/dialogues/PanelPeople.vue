<template>
<q-layout container view="hHh lpR fFf" :class="sty" style="width:80vw">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtit', [pStore.peC.na.nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-card style="min-height:50vh" class="q-pa-sm">
      <apercu-people :id="session.peopleId" simple />
      <div class="row">
        <div v-if="avStore.mbPeC && avStore.mbPeC.sp" class="titre-md text-bold text-warning">{{$t('PPsp', [avStore.tribuC.na.nom])}}</div>
        <div v-else class="titre-md">{{$t('PPco', [avStore.tribuC.na.nom])}}</div>
        <q-btn v-if="session.estComptable" class="q-ml-sm" dense color="primary" size="sm"
          :label="$t('PPcht')" @click="chgTribu"/>
        <q-btn v-if="session.estComptable" class="q-ml-sm" dense color="primary" size="sm"
          :label="$t('PPchsp')" @click="chgSponsor"/>
      </div>

      <q-btn v-if="session.estComptable || session.estSponsor" class="q-my-sm" dense color="primary" size="sm"
          :label="$t('PPcompta')" @click="voirCompta"/>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPchats')}}</div>

      <div v-for="(na, idx) in avStore.compta.lstAvatarNas" :key="na.id">
        <apercu-chat class="q-my-md" affnai
          :na-i="na" :na-e="pStore.peC.na" :ids="ids[na.id]" :idx="idx" :mapmc="mapmc"/>
      </div>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPgroupes')}}</div>

    </q-card>
  </q-page-container>

  <!-- Changement de tribu -->
  <q-dialog v-model="chgTr" persistent>
    <q-card class="moyennelargeur">
      <div class="titre-lg bg-secondary text-white text-center">{{$t('PPchgtr', [pStore.peC.na.nom, avStore.tribuC.na.nom])}}</div>
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
        <div v-if="avStore.mbPeC.sp" class="text-center q-my-md titre-md">{{$t('PPsp', [avStore.tribuC.na.nom])}}</div>
        <div v-else class="text-center q-my-md titre-md">{{$t('PPco', [avStore.tribuC.na.nom])}}</div>
      <q-card-actions align="center">
        <q-btn dense color="primary" :label="$t('renoncer')" @click="chgSp=false"/>
        <q-btn v-if="avStore.mbPeC.sp" dense color="warning" :label="$t('PPkosp')" v-close-popup  @click="changerSp(false)"/>
        <q-btn v-else dense color="warning" :label="$t('PPoksp')" v-close-popup  @click="changerSp(true)"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Affichage des compteurs de compta du compte "courant"-->
  <q-dialog v-model="cptdial" persistent full-height>
    <q-card style="width: 800px; max-width: 80vw;">
    <q-toolbar class="bg-secondary text-white">
      <q-btn dense size="md" color="warning" icon="close" @click="cptdial = false"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTcompta', [p.na.nomc])}}</q-toolbar-title>
    </q-toolbar>
    <panel-compta :c="avStore.ccCpt" style="margin:0 auto"/>
    </q-card>
  </q-dialog>

</q-layout>
</template>
<script>

import { ref, onMounted, reactive } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuPeople from '../components/ApercuPeople.vue'
import ApercuChat from '../components/ApercuChat.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import PanelCompta from '../components/PanelCompta.vue'
import { edvol } from '../app/util.mjs'
import { Chat, Motscles } from '../app/modele.mjs'
import { GetCompteursCompta, SetAttributTribu2, ChangerTribu } from '../app/operations.mjs'
import { Compteurs, UNITEV1, UNITEV2 } from '../app/api.mjs'

export default {
  name: 'PanelPeople',
  components: { ApercuPeople, BoutonHelp, ApercuChat, PanelCompta },

  props: { close: Function },

  computed: {
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
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    fermer () { if (this.close) this.close() },
    chgTribu () { this.avStore.ppFiltre = ''; this.chgTr = true },
    chgSponsor () { this.chgSp = true },
    voirCompta () { this.cptdial = true },
    async changerSp(estSp) { // (id, na, attr, val, val2, exq)
      await new SetAttributTribu2().run(this.session.tribuCId, this.pStore.peC.na, 'sp', estSp)
      this.chgSp = false
    },
    selTr (x) { if (x.ok) this.avStore.ppSelId = x.id },
    async changerTr () {
      const [t, t2] = await new ChangerTribu().run(this.pStore.peC.na, this.avStore.ppSelId)
      this.avStore.setTribuC(t, t2)
    }
  },

  setup (props) {
    const session = stores.session
    const pStore = stores.people
    const avStore = stores.avatar

    const mapmc = ref(Motscles.mapMC(true, 0))

    const lstAvc = avStore.compta.lstAvatarNas
    const ids = reactive({})
    onMounted(async () => {
      const res = await new GetCompteursCompta().run(session.peopleId)
      avStore.ccCpt = new Compteurs(res)
      for(const na of lstAvc) {
        ids[na.id] = await Chat.getIds(na, pStore.peC.na)
      }
    })

    return {
      session,
      avStore,
      pStore,
      mapmc,
      ids,
      lstAvc
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
</style>
