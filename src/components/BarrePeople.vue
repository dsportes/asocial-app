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
    <q-card class="bs moyennelargeur">
      <div class="titre-lg bg-secondary text-white text-center">{{$t('PPchgtr', [na.nom, aSt.tribuC.na.nom])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqv1', [aSt.ccCpt.q1, edv1(aSt.ccCpt.q1), pc1])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqv2', [aSt.ccCpt.q2, edv2(aSt.ccCpt.q2), pc2])}}</div>

      <q-separator class="q-mt-sm"/>

      <q-card-section>
        <q-input filled v-model="aSt.ppFiltre" :label="$t('PPnt')" />
        <div class="titre-md text-italic row items-center">
          <div class="col-2 text-center">{{$t('PPc1')}}</div>
          <div class="col-4">{{$t('PPc2')}}</div>
          <div class="col-3 text-center">{{$t('PPc3')}}</div>
          <div class="col-3 text-center" >{{$t('PPc4')}}</div>
        </div>
      </q-card-section>

      <q-card-section style="height: 30vh" class="scroll bord1">
        <div v-for="x in aSt.ppTribusF" :key="x.id" 
          :class="'row items-center cursor-pointer' + (x.id === aSt.ppSelId ? ' bord2' : '')"
          @click="selTr(x)">
          <q-icon class="col-2 text-center" :name="x.ok ? 'check' : 'close'" size="md" :color="x.ok ? 'primary' : 'negative'" />
          <div class="col-4">{{x.nom}}</div>
          <div class="col-3 text-center">{{x.r1}}</div>
          <div class="col-3 text-center">{{x.r2}}</div>
        </div>
      </q-card-section>

      <q-separator />      
      <q-card-actions align="center">
        <q-btn dense color="primary" :label="$t('renoncer')" @click="MD.fD"/>
        <q-btn dense color="warning" :label="$t('valider')" :disable="!aSt.ppSelId"
          @click="changerTr()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Changement de statut sponsor -->
  <q-dialog v-model="chgSp" persistent>
    <q-card class="bs bg-secondary text-white petitelargeur q-pa-sm">
        <div v-if="aSt.mbCpt(na.id).sp" class="text-center q-my-md titre-md">{{$t('PPsp', [aSt.tribuC.na.nom])}}</div>
        <div v-else class="text-center q-my-md titre-md">{{$t('PPco', [ID.court(aSt.tribuC.id)])}}</div>
      <q-card-actions align="center">
        <q-btn dense color="primary" :label="$t('renoncer')" @click="MD.fD"/>
        <q-btn v-if="aSt.mbCpt(na.id).sp" dense color="warning" :label="$t('PPkosp')" @click="changerSp(false)"/>
        <q-btn v-else dense color="warning" :label="$t('PPoksp')" @click="changerSp(true)"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Affichage des compteurs de compta du compte "courant"-->
  <q-dialog v-model="cptdial" persistent full-height>
    <div class="bs"  style="width:80vw">
    <q-layout container view="hHh lpR fFf" :class="sty">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTcompta', [na.nomc])}}</q-toolbar-title>
        </q-toolbar>
      </q-header>
      <q-page-container>
        <q-card>
          <panel-compta style="margin:0 auto"/>
        </q-card>
      </q-page-container>
    </q-layout>
    </div>
  </q-dialog>

</div>
</template>
<script>

import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { ID } from '../app/api.mjs'
// import BoutonHelp from '../components/BoutonHelp.vue'
import PanelCompta from '../components/PanelCompta.vue'
import { edvol, afficherDiag } from '../app/util.mjs'
import { GetCompteursCompta, SetSponsor, ChangerTribu } from '../app/operations.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { MD } from '../app/modele.mjs'
import { crypter, crypterRSA } from '../app/webcrypto.mjs'

export default {
  name: 'BarrePeople',
  components: { PanelCompta },

  props: { id: Number },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
  },

  watch: {
  },
  
  data () {
    return {
      pc1: 0,
      pc2: 0
    }
  },

  methods: {
    edv1 (v) { return edvol(v * UNITEV1) },
    edv2 (v) { return edvol(v * UNITEV2) },
    async getCpt() {
      this.ccCpt = await new GetCompteursCompta().run(this.na || this.id)
      this.pc1 = this.ccCpt.q1 ? Math.round((this.ccCpt.v1 * 100) / (this.ccCpt.q1 * UNITEV1)) : 0,
      this.pc2 = this.ccCpt.q2 ? Math.round((this.ccCpt.v2 * 100) / (this.ccCpt.q2 * UNITEV2)) : 0
    },
    async chgTribu () { // comptable
      await this.getCpt()
      if (!this.na && this.ccCpt.sp) { // ça ne devrait pas arriver !!!
        await afficherDiag(this.$t('PTspn2'))
        return
      }
      this.aSt.ppFiltre = ''
      this.ovchgTr()
    },
    async chgSponsor () { // comptable
      await this.getCpt()
      if (!this.na && !this.ccCpt.sp) {
        await afficherDiag(this.$t('PTspn1'))
      } else this.ovchgSp()
    },
    async voirCompta () { // comptable OU sponsor
      await this.getCpt()
      this.ovcptdial()
    },
    async changerSp(estSp) {
      // si estSp, le na existe, voir quelques lignes au-dessus
      await new SetSponsor().run(this.session.tribuCId, this.na || this.id, estSp)
      MD.fD()
    },
    selTr (x) { if (x.ok) this.aSt.ppSelId = x.id },
    async changerTr () {
      MD.fD()
      const cletAv = this.ccCpt.cletAv
      const idtAv = Tribu.id(cletAv)
      const trAv = this.aSt.getTribu(idtAv)
      const itAv = this.ccCpt.it
      const notifAv = trAv.act[itAv].notif
      const idtAp = this.aSt.ppSelId
      const cletAp = getCle(idtAp) // le comptable qui a les clés de toutes les tribus
      const nasp = !this.ccCpt.sp ? null : await crypter(cletAp, new Uint8Array(encode(this.na.anr)))
      let notif = null, stn = 0
      if (notifAv) {
        stn = notif.jbl ? 2 : 1
        notif = await crypter(cletAp, new Uint8Array(encode(notif)))
      }
      const cletX = await crypter(session.clek, cletAp)
      const pub = await this.aSt.getPub(this.id)
      const cletK = await crypterRSA(pub, cletAp)
      const idT = await crypter(cletAp, '' + ID.court(this.id))
      const args = { id: this.id, idtAv, idtAp, idT, nasp, stn, notif, cletX, cletK } 
      const t = await new ChangerTribu().run(args)
      this.aSt.setTribuC(t)
    }
  },

  setup (props) {
    const session = stores.session
    const pSt = stores.people
    const aSt = stores.avatar
    const id = toRef(props, 'id')
    const na = ref()
    na.value = getNg(id.value)

    const chgSp = ref(false)
    function ovchgSp () { MD.oD(chgSp) }
    const chgTr = ref(false)
    function ovchgTr () { MD.oD(chgTr) }
    const cptdial = ref(false)
    function ovcptdial () { MD.oD(cptdial)}

    return {
      na,
      ID, MD, chgSp, ovchgSp, chgTr, ovchgTr, cptdial, ovcptdial,
      session, aSt, pSt
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
