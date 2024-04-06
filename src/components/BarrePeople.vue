<template>
<div>
  <div class="row justify-center q-gutter-sm q-my-sm items-center">
    <q-btn v-if="session.estComptable" dense color="primary" size="sm" padding="xs"
      :label="$t('PPcht')" @click="chgTribu"/>
    <q-btn v-if="session.estComptable" dense color="primary" size="sm" padding="xs"
      :label="$t('PPchsp')" @click="chgSponsor"/>
    <q-btn v-if="session.estComptable || (session.estDelegue && !session.eltPart(id).fake)" 
      dense color="primary" size="sm" padding="xs"
      :label="$t('PPcompta')" @click="voirCompta"/>
    <q-btn dense color="warning" size="md" padding="none" round icon="change_history"
      class="justify-start" @click="muter">
      <q-tooltip>{{$t('PPmut')}}</q-tooltip>
    </q-btn>
  </div>

  <!-- Mutation de type de compte -->
  <q-dialog v-model="ui.d.BPmut[idc]" persistent>
    <q-card :class="styp('md')">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" icon="close" @click="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">
          {{$t('PPmut') + ' ' + opt}}
        </q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>

      <div class="q-pa-xs column q-gutter-sm">
        <div class="titre-lg text-bold">{{$t('PPmut' + (st === 1 ? 'A' : 'O'))}}</div>
        <div v-if="yo" class="titre-md">{{$t('PPmutok')}}</div>
        <div v-if="!yo" :class="'titre-md ' + (yoreq ? 'bg-yellow-5 text-bold text-black' : '')">
          {{$t('PPmutko')}}
        </div>
        <div v-if="opt === 1 && st===2 && !yo" class="titre-md text-bold">{{$t('PPmutf')}}</div>
      </div>

      <micro-chat class="q-pa-xs q-my-md" 
        :chat="chat" :na-i="naI" :na-e="naE"/>
      
      <q-expansion-item v-if="st === 1" class="q-mt-sm" v-model="verif1"
        :label="$t('PPmutv')" icon="warning"
        header-class="bg-secondary text-white text-bold titre-md"
        switch-toggle-side expand-separator dense group="trgroup">
        <div class="q-pa-xs">
          <choix-quotas :quotas="quotas"/>
          <div v-if="quotas.err" class="bg-yellow-5 text-bold text-black q-pa-xs">
            {{$t('PPquot')}}
          </div>
        </div>
      </q-expansion-item>

      <q-expansion-item class="q-my-sm"
        :label="$t('PPmutm')" icon="edit"
        header-class="bg-secondary text-white text-bold titre-md"
        switch-toggle-side expand-separator dense group="trgroup">
        <editeur-md class="q-pa-xs q-mt-sm"
          v-model="texte" :lgmax="250" modetxt editable mh="6rem"
          :texte="txtdef"/>
      </q-expansion-item>

      <div v-if="st === 1 && (!verifd || quotas.err)" class="bg-yellow-5 text-black titre-md text-italic">
        {{$t('PPmutv')}}</div>
      <div v-if="!yo && yoreq" class="bg-yellow-5 text-black titre-md text-italic">
        {{$t('PPmutreq')}}</div>

      <q-card-actions class="q-pa-xs q-mt-sm q-gutter-xs" align="right" vertical>
        <q-btn dense color="primary" size="md" padding="xs" icon="undo" 
          :label="$t('renoncer')" @click="ui.fD"/>
        <q-btn v-if="st===2" 
          :disable="!yo && yoreq"
          dense color="warning" size="md" padding="xs" icon="change_history" 
          :label="$t('PPmutA2')" @click="cf=true"/>
        <q-btn v-else 
          :disable="(!yo && yoreq) || quotas.err || !verifd"
          dense color="warning" size="md" padding="xs" icon="change_history" 
          :label="$t('PPmutO2')" @click="cf=true"/>
        <bouton-confirm :actif="cf" :confirmer="mut"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Changement de tribu -->
  <q-dialog v-model="ui.d.BPchgTr[idc]" persistent>
    <q-card :class="styp('sm')">
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
      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn flat dense padding="xs" size="md" color="primary" icon="undo"
          :label="$t('renoncer')" @click="ui.fD"/>
        <q-btn dense padding="xs" size="md" icon="check" color="warning" 
          :label="$t('valider')" :disable="!selx || !selx.ok1 || !selx.ok2" @click="changerTr()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Changement de statut sponsor -->
  <q-dialog v-model="ui.d.BPchgSp[idc]" persistent>
    <q-card :class="styp('md') + 'q-pa-sm'">
      <div v-if="aSt.ccCpt.sp" class="text-center q-my-md titre-md">{{$t('sponsor')}}</div>
      <div v-else class="text-center q-my-md titre-md">{{$t('PPco')}}</div>
      <q-card-actions align="right" class="q-gutter-sm">
        <q-btn flat dense padding="xs" size="md" color="primary" icon="undo"
          :label="$t('renoncer')" @click="ui.fD"/>
        <q-btn dense padding="xs" size="md" icon="check" color="warning" 
          :label="$t('valider')" :disable="!selx || !selx.ok1 || !selx.ok2" @click="changerTr()"/>
        <q-btn v-if="aSt.ccCpt.sp" dense padding="xs" size="md" icon="check" color="warning"
          :label="$t('PPkosp')" @click="changerSp(false)"/>
        <q-btn v-else dense padding="xs" size="md" icon="check" color="warning"
          :label="$t('PPoksp')" @click="changerSp(true)"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Affichage des compteurs de compta du compte "courant"-->
  <q-dialog v-model="ui.d.BPcptdial[idc]" full-height position="left" persistent>
    <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated class="bg-secondary text-white">
        <q-toolbar>
          <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">
            {{$t('PTcompta', [cv.nomc])}}</q-toolbar-title>
        </q-toolbar>
      </q-header>
      <q-page-container>
        <q-card>
          <panel-compta style="margin:0 auto"/>
        </q-card>
      </q-page-container>
    </q-layout>
  </q-dialog>

</div>
</template>
<script>

import { ref, toRef } from 'vue'
import { encode } from '@msgpack/msgpack'
import stores from '../stores/stores.mjs'
import { ID, UNITEN, UNITEV } from '../app/api.mjs'
import PanelCompta from '../components/PanelCompta.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import MicroChat from '../components/MicroChat.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import EditeurMd from '../components/EditeurMd.vue'
import { styp, edvol, afficherDiag } from '../app/util.mjs'
import { MuterCompte, GetCompteursCompta, SetSponsor, ChangerTribu, GetSynthese } from '../app/operations.mjs'
import { getNg, getCle, Tribu } from '../app/modele.mjs'
import { crypter, crypterRSA } from '../app/webcrypto.mjs'
import { EstAutonome } from '../app/operations4.mjs'

export default {
  name: 'BarrePeople',

  components: { EditeurMd, PanelCompta, BoutonConfirm, MicroChat, ChoixQuotas, BoutonHelp },

  props: { id: Number },

  computed: {
    cv () { return this.session.getCV(this.id) },
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    naI () { return this.aSt.compte.na },
    naE () { return getNg(this.id) },
    yo () { return this.chat && this.chat.yo },
    yoreq () { return (this.opt === 2 && this.st === 2) || this.st === 1 },
    opt () { return this.session.espace.opt },
    chat () { return this.aSt.getChatIdIE(this.session.compteId, this.id) },
    cpt () { return this.aSt.ccCpt },
    synth () { return this.aSt.tribu.synth },
    txtdef () { return this.$t('PPmsg' + (this.st === 1 ? 'o' : 'a'))}
  },

  watch: {
    filtre (ap, av) { this.filtrer() },
    verif1 (ap) { if (ap) this.verifd = true }
  },
  
  data () {
    return {
      verif1: false,
      verifd: false,
      texte: '',
      selx: null,
      filtre: '',
      lstTr: [],
      atr: [],
      pc1: 0,
      pc2: 0,
      st: 0, // 0: contact pas compte principal, 1: contact A, 2: contact O
      cf: false,
      quotas: {} // { q1, q2, qc, min1, min2, max1, max2, minc, maxc, err}
    }
  },

  methods: {
    edv1 (v) { return edvol(v * UNITEN) },
    edv2 (v) { return edvol(v * UNITEV) },

    async muter () {
      if (!await this.session.edit()) return
      if (!this.chat) {
        await afficherDiag(this.$t('PPchatreq'))
        return
      }
      this.st = await new EstAutonome().run(this.id)
      if (this.st === 0) {
        await afficherDiag(this.$t('PPmut1'))
        return
      }
      if (this.st === 1) {
        await new GetCompteursCompta().run(this.id)
        const c = this.cpt.qv
        const s = this.synth
        this.quotas = {
          q1: c.q1,
          q2: c.q2,
          qc: c.qc,
          min1: Math.ceil((c.nc + c.ng + c.nn) / UNITEN),
          min2: Math.ceil(c.v2 / UNITEV),
          minc: 0,
          max1: s.q1 - s.a1,
          max2: s.q2 - s.a2,
          maxc: s.qc - s.ac
        }
      }
      this.cf = false
      this.verif1 = false
      this.verifd = false
      this.ui.oD('BPmut', this.idc)
    },

    async mut () {
      await new GetCompteursCompta().run(this.id)
      const c = this.aSt.compta
      const pub = await this.aSt.getPub(this.id)
      const trib = { idt: c.idt }
      if (this.st === 1) {
        trib.idT = await Tribu.getIdT(c.clet, this.id)
        trib.cletX = c.cletX
        trib.cletK = await crypterRSA(pub, c.clet)
      }
      const quotas = this.st === 2 ? null : {
        q1: this.quotas.q1,
        q2: this.quotas.q2,
        qc: this.quotas.qc
      }
      await new MuterCompte()
        .run(this.id, this.st, this.chat, this.texte || this.txtdef, quotas, trib, this.aSt.ccCpt)
      this.ui.fD()
    },

    async getCpt() {
      await new GetCompta().run(this.id)
      const x = this.aSt.ccCpt
      this.pc1 = x.q1 ? Math.round((x.v1 * 100) / (x.q1 * UNITEN)) : 0,
      this.pc2 = x.q2 ? Math.round((x.v2 * 100) / (x.q2 * UNITEV)) : 0
    },

    async voirCompta () { // comptable OU sponsor
      await new GetCompta().run(this.id)
      this.ui.oD('BPcptdial', this.idc)
    },

    async chgSponsor () { // comptable
      if (!await this.session.edit()) return
      await this.getCpt()
      if (ID.estComptable(this.id)) {
        await afficherDiag(this.$t('PTspn1c'))
        return
      }
      if (!this.na) { 
        await afficherDiag(this.$t('PTspn1'))
        return
      }
      this.ui.oD('BPchgSp', this.idc)
    },

    async changerSp(estSp) {
      const cletAv = this.aSt.ccCpt.clet
      const idtAv = Tribu.id(cletAv)
      // si estSp, le na existe, voir quelques lignes au-dessus
      await new SetSponsor().run(idtAv, this.na || this.id, estSp)
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
            q1: x.q[1], 
            q2: x.q[2],
            d1: x.q[1] - (e ? e.a1 : 0),
            d2: x.q[2] - (e ? e.a2 : 0)
          }
          y.ok1 = this.aSt.ccCpt.qv.q1 <= y.d1
          y.ok2 = this.aSt.ccCpt.qv.q2 <= y.d2
          this.lstTr.push(y)
        }
      })
    },

    async chgTribu () { // comptable
      if (!await this.session.edit()) return
      await this.getCpt()
        if (ID.estComptable(this.id)) {
          await afficherDiag(this.$t('PTspn2c'))
          return
      }
      if (!this.na) { 
        await afficherDiag(this.$t('PTspn2'))
        return
      }
      this.atr = await new GetSynthese().run(this.session.ns)
      this.filtre = ''
      this.filtrer()
      this.ui.oD('BPchgTr', this.idc)
    },

    async changerTr () {
      this.ui.fD()
      const cletAv = this.aSt.ccCpt.clet
      const idtAv = Tribu.id(cletAv)
      const trAv = this.aSt.getTribu(idtAv)
      const itAv = this.aSt.ccCpt.it
      const notifAv = trAv.act[itAv].notif
      const idtAp = this.selx.id
      const cletAp = getCle(idtAp) // le comptable qui a les clés de toutes les tribus
      const nasp = !this.aSt.ccCpt.sp ? null : await crypter(cletAp, new Uint8Array(encode(this.na.anr)))
      let notif = null, stn = 0
      if (notifAv) {
        stn = notifAv.stn
        notif = await crypter(cletAp, notifAv.serial)
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
    const idc = ref(ui.getIdc())
    const aSt = stores.avatar
    const id = toRef(props, 'id')
    const na = ref()
    na.value = getNg(id.value)

    return {
      na,
      ID,
      styp, session, aSt, ui, idc
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
</style>
