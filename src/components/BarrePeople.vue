<template>
<div>
  <div class="row justify-center q-gutter-sm q-my-xs">
    <q-btn v-if="session.estComptable" dense color="primary" size="sm"
      :label="$t('PPcht')" @click="chgTribu"/>
    <q-btn v-if="session.estComptable" dense color="primary" size="sm"
      :label="$t('PPchsp')" @click="chgSponsor"/>
    <q-btn v-if="session.estComptable || (aSt.estSponsor && estDeMaTribu)" dense color="primary" size="sm"
      :label="$t('PPcompta')" @click="voirCompta"/>
  </div>

  <!-- Changement de tribu -->
  <q-dialog v-model="ui.d.BPchgTr" persistent>
    <q-card class="bs moyennelargeur">
      <div class="titre-lg bg-secondary text-white text-center">{{$t('PPchgtr', [na.nom, ID.court(aSt.tribuC.id)])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqv1', [aSt.ccCpt.q1, edv1(aSt.ccCpt.q1), pc1])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqv2', [aSt.ccCpt.q2, edv2(aSt.ccCpt.q2), pc2])}}</div>

      <q-separator class="q-mt-sm"/>

      <q-card-section>
        <q-input filled v-model="filtre" :label="$t('PPnt')" />
        <div class="titre-md text-italic row items-center">
          <div class="col-4">{{$t('PPc2')}}</div>
          <div class="col-2 text-center">{{$t('PPc3')}}</div>
          <div class="col-2 text-center" >{{$t('PPc5')}}</div>
          <div class="col-2 text-center">{{$t('PPc4')}}</div>
          <div class="col-2 text-center" >{{$t('PPc5')}}</div>
        </div>
      </q-card-section>

      <q-card-section style="height: 30vh" class="scroll bord1">
        <div v-for="x in lstTr" :key="x.id" 
          :class="'row items-center cursor-pointer' + (selx && (x.id === selx.id) ? ' bord2' : '')"
          @click="selx = x">
          <div class="col-4">{{x.info}}</div>
          <div class="col-2 text-center">{{x.q1}}</div>
          <div :class="'col-2 text-center' + (x.ok2 ? '' : ' bg-yellow-5 text-bold text-negative')">
            {{x.d1}}</div>
          <div class="col-2 text-center">{{x.q2}}</div>
          <div :class="'col-2 text-center' + (x.ok1 ? '' : ' bg-yellow-5 text-bold text-negative')">
            {{x.d2}}</div>
        </div>
      </q-card-section>

      <q-separator />      
      <q-card-actions align="center">
        <q-btn dense color="primary" :label="$t('renoncer')" @click="ui.fD"/>
        <q-btn dense color="warning" :label="$t('valider')" 
          :disable="!selx || !selx.ok1 || !selx.ok2"
          @click="changerTr()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Changement de statut sponsor -->
  <q-dialog v-model="ui.d.chgSp" persistent>
    <q-card class="bs bg-secondary text-white petitelargeur q-pa-sm">
        <div v-if="ccCpt.sp" class="text-center q-my-md titre-md">{{$t('sponsor')}}</div>
        <div v-else class="text-center q-my-md titre-md">{{$t('PPco')}}</div>
      <q-card-actions align="center">
        <q-btn dense color="primary" :label="$t('renoncer')" @click="ui.fD"/>
        <q-btn v-if="ccCpt.sp" dense color="warning" :label="$t('PPkosp')" @click="changerSp(false)"/>
        <q-btn v-else dense color="warning" :label="$t('PPoksp')" @click="changerSp(true)"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Affichage des compteurs de compta du compte "courant"-->
  <q-dialog v-model="ui.d.cptdial" persistent full-height>
    <div class="bs"  style="width:80vw">
    <q-layout container view="hHh lpR fFf" :class="sty">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">
            {{$t('PTcompta', [na ? na.nomc : ('#' + id)])}}</q-toolbar-title>
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
import { GetCompteursCompta, SetSponsor, ChangerTribu, GetSynthese } from '../app/operations.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { getNg, getCle, Tribu } from '../app/modele.mjs'
import { crypter, crypterRSA } from '../app/webcrypto.mjs'

export default {
  name: 'BarrePeople',
  components: { PanelCompta },

  props: { id: Number },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    estDeMaTribu () {
      const [t, it, eltAct] = this.aSt.getTribuDeCompte(this.id)
      return t !== null
    }
  },

  watch: {
    filtre (ap, av) { this.filter() }
  },
  
  data () {
    return {
      selx: null,
      filtre: '',
      lstTr: [],
      atr: [],
      pc1: 0,
      pc2: 0
    }
  },

  methods: {
    edv1 (v) { return edvol(v * UNITEV1) },
    edv2 (v) { return edvol(v * UNITEV2) },

    async getCpt() {
      this.ccCpt = await new GetCompteursCompta().run(this.id)
      this.pc1 = this.ccCpt.q1 ? Math.round((this.ccCpt.v1 * 100) / (this.ccCpt.q1 * UNITEV1)) : 0,
      this.pc2 = this.ccCpt.q2 ? Math.round((this.ccCpt.v2 * 100) / (this.ccCpt.q2 * UNITEV2)) : 0
    },

    async voirCompta () { // comptable OU sponsor
      await this.getCpt()
      this.ui.oD('BPcptdial')
    },

    async chgSponsor () { // comptable
      await this.getCpt()
      if (!this.na) { 
        await afficherDiag(this.$t('PTspn1'))
        return
      }
      this.ui.oD('BPchgSp')
    },

    async changerSp(estSp) {
      // si estSp, le na existe, voir quelques lignes au-dessus
      await new SetSponsor().run(this.session.tribuCId, this.na || this.id, estSp)
      this.ui.fD()
    },

    filtrer () {
      this.lstTr = []
      this.aSt.compta.atr.forEach(x => {
        if (x && x.id !== this.aSt.tribuC.id &&
          (!this.filtre || (x.info && x.info.contains(this.filtre)))) {
          const e = this.atr[ID.court(x.id)]
          const y = { 
            id: x.id,
            info: x.info ? x.info : ('#' + ID.court(x.id)), 
            q1: x.q1, 
            q2: x.q2,
            d1: x.q1 - (e ? e.a1 : 0),
            d2: x.q2 - (e ? e.a2 : 0)
          }
          y.ok1 = this.ccCpt.q1 <= y.d1
          y.ok2 = this.ccCpt.q2 <= y.d2
          this.lstTr.push(y)
        }
      })
    },

    async chgTribu () { // comptable
      await this.getCpt()
      if (!this.na) { 
        await afficherDiag(this.$t('PTspn2'))
        return
      }
      this.atr = await new GetSynthese().run(this.session.ns)
      this.filtre = ''
      this.filtrer()
      this.ui.oD('BPchgTr')
    },

    async changerTr () {
      this.ui.fD()
      const cletAv = this.ccCpt.clet
      const idtAv = Tribu.id(cletAv)
      const trAv = this.aSt.getTribu(idtAv)
      const itAv = this.ccCpt.it
      const notifAv = trAv.act[itAv].notif
      const idtAp = this.selx.id
      const cletAp = getCle(idtAp) // le comptable qui a les clés de toutes les tribus
      const nasp = !this.ccCpt.sp ? null : await crypter(cletAp, new Uint8Array(encode(this.na.anr)))
      let notif = null, stn = 0
      if (notifAv) {
        stn = notif.jbl ? 2 : 1
        notif = await crypter(cletAp, new Uint8Array(encode(notif)))
      }
      const cletX = await crypter(this.session.clek, cletAp)
      const pub = await this.aSt.getPub(this.id)
      const cletK = await crypterRSA(pub, cletAp)
      const idT = await crypter(cletAp, '' + ID.court(this.id))
      const args = { id: this.id, idtAv, idtAp, idT, nasp, stn, notif, cletX, cletK } 
      const t = await new ChangerTribu().run(args)
      /* en sql, la nouvelle tribu this.id est abonnée, de facto la précédente désabonnée
        mais pas en fs */
      if (this.session.fsSync) {
        await this.session.fsSync.setTribuC(t.id)
      }
      this.session.setTribuCId(t.id)
      this.aSt.setTribuC(t)
    }
  },

  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const aSt = stores.avatar
    const id = toRef(props, 'id')
    const na = ref()
    na.value = getNg(id.value)

    return {
      na,
      ID,
      session, aSt, ui
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
