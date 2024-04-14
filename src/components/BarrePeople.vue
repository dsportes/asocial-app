<template>
<div>
  <div class="row justify-center q-gutter-sm q-my-sm items-center">
    <btn-cond v-if="session.estComptable"
      cond="cUrgence" :label="$t('PPchpart')" @click="chgPartition"/>
    <btn-cond v-if="session.estComptable" 
      cond="cEdit" :label="$t('PPchsp')" @ok="chgDelegue"/>
    <btn-cond v-if="(session.estComptable || (session.estDelegue && !session.eltPart(id).fake)) && id !== session.compteId"
      cond="cVisu" :label="$t('PPcompta')" @ok="voirCompta"/>
    <btn-cond color="warning" round icon="change_history"
      cond="cEdit" class="justify-start" @ok="muter">
      <q-tooltip>{{$t('PPmut')}}</q-tooltip>
    </btn-cond>
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

  <!-- Changement de partition -->
  <q-dialog v-model="ui.d.BPchgTr[idc]" persistent>
    <q-card :class="styp('sm')">
      <div class="titre-lg bg-secondary text-white text-center">
        {{$t('PPchgpart', [cv.nom, session.codePart(session.partition.id)])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqvc', [cpt.qv.qc, cpt.pc.pcc])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqvn', [cpt.qv.qn, edn(cpt.qv.qn), cpt.pc.pcn])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqvv', [cpt.qv.qv, edv(cpt.qv.qv), cpt.pc.pcv])}}</div>

      <q-input filled v-model="filtre" :label="$t('PPnt')" />
      <q-separator class="q-mt-sm"/>

      <q-card-section>
        <div class="titre-md text-italic">{{$t('PPc0')}}</div>
        <div class="titre-md text-italic row items-center">
          <div class="col-3">{{$t('PPc1')}}</div>
          <div class="col-3 text-center">{{$t('PPc2', [cpt.qv.qc])}}</div>
          <div class="col-3 text-center" >{{$t('PPc3', [cpt.qv.qn])}}</div>
          <div class="col-3 text-center">{{$t('PPc4', [cpt.qv.qv])}}</div>
        </div>
      </q-card-section>

      <q-card-section style="height: 30vh" class="scroll bord1">
        <div v-for="x in lst" :key="x.id" 
          :class="'row items-center cursor-pointer' + (selx && (x.idp === selx.idp) ? ' bord2' : ' bord1')"
          @click="selx = x">
          <div class="col-3">{{x.code}}</div>
          <div class="col-3 q-px-xs">
            <div :class="'text-center' + (x.okc ? '' : ' bg-yellow-5 text-bold text-negative')">
              <span >{{x.dc}}</span>
              <span class="q-mx-sm">/</span>
              <span>{{x.qc}}</span>
            </div>
          </div>
          <div class="col-3 q-px-xs">
            <div :class="'text-center' + (x.okn ? '' : ' bg-yellow-5 text-bold text-negative')">
              <span >{{x.dn}}</span>
              <span class="q-mx-sm">/</span>
              <span>{{x.qn}}</span>
            </div>
          </div>
         <div class="col-3 q-px-xs">
            <div :class="'text-center' + (x.okv ? '' : ' bg-yellow-5 text-bold text-negative')">
              <span >{{x.dv}}</span>
              <span class="q-mx-sm">/</span>
              <span>{{x.qv}}</span>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-separator />      
      <q-card-actions align="right" class="q-gutter-sm">
        <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond color="warning" cond="cUrgence"
          :label="$t('valider')" :disable="!selx || !selx.okc || !selx.okn || !selx.okv" @ok="changerPart()"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Changement de statut délégué -->
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
            {{$t('PTcompta', [cv.nomC])}}</q-toolbar-title>
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
import BtnCond from '../components/BtnCond.vue'
import MicroChat from '../components/MicroChat.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import EditeurMd from '../components/EditeurMd.vue'
import { styp, edvol, afficherDiag } from '../app/util.mjs'
import { MuterCompte, GetCompteursCompta, SetSponsor } from '../app/operations.mjs'
import { getNg, Tribu } from '../app/modele.mjs'
import { crypterRSA } from '../app/webcrypto.mjs'
import { EstAutonome, ChangerPartition } from '../app/operations4.mjs'
import { GetCompta, GetSynthese, GetPartition } from '../app/synchro.mjs'

export default {
  name: 'BarrePeople',

  components: { BtnCond, EditeurMd, PanelCompta, BoutonConfirm, MicroChat, ChoixQuotas, BoutonHelp },

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
    cpt () { return this.session.compta },
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
      lst: [],
      atr: [],
      pcc: 0,
      pcn: 0,
      pcv: 0,
      st: 0, // 0: contact pas compte principal, 1: contact A, 2: contact O
      cf: false,
      quotas: {} // { q1, q2, qc, min1, min2, max1, max2, minc, maxc, err}
    }
  },

  methods: {
    edn (v) { return v * UNITEN },
    edv (v) { return edvol(v * UNITEV) },

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
    },

    async voirCompta () { // comptable OU délégué
      await new GetCompta().run(this.id)
      this.ui.oD('BPcptdial', this.idc)
    },

    async chgDelegue () { // comptable
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
      this.lst = []
      /*
      - `tsp` : table des _synthèses_ des partitions.
        - _index_: numéro de la partition.
        - _valeur_ : `synth`, objet des compteurs de synthèse calculés de la partition.
          - `id nbc nbd`
          - `ntfp[1,2,3]`
          - `q` : `{ qc, qn, qv }`
          - `qt` : { qc qn qv c2m n v }`
          - `ntf[1,2,3]`
          - `pcac pcan pcav pcc pcn pcv`
      */
      const tsp = this.session.synthese.tsp
      for(const [idp, code] of this.session.compte.mcode) {
        if ((!this.filtre || (code && code.indexOf(this.filtre) !== -1))
          && idp !== this.session.partition.id) {
          const n = ID.court(idp)
          const e = tsp[n]
          const y = { 
            idp,
            code: '#' + n + ' [' + code  + ']',
            qc: e.q.qc, 
            qn: e.q.qn,
            qv: e.q.qv,
            dc: e.q.qc - e.qt.qc,
            dn: e.q.qn - e.qt.qn,
            dv: e.q.qv - e.qt.qv
          }
          y.okc = this.cpt.qv.qc <= y.dc
          y.okn = this.cpt.qv.qn <= y.dn
          y.okv = this.cpt.qv.qv <= y.dv
          this.lst.push(y)
        }
      }
    },

    async chgPartition () { // comptable
      await new GetSynthese().run(this.session.ns)
      await new GetCompta().run(this.id)
      this.filtre = ''
      this.filtrer()
      this.ui.oD('BPchgTr', this.idc)
    },

    async changerPart () {
      await new ChangerPartition().run(this.id, this.selx.idp, this.session.notifC)
      await new GetPartition().run(this.session.partition.id)
      await new GetSynthese().run(this.session.ns)
      this.ui.fD()
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
  border: 2px solid transparent
.bord2
  border: 2px solid $warning
  font-weight: bold
</style>
