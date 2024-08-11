<template>
<div>
  <div class="row justify-center q-gutter-sm q-my-sm items-center">
    <btn-cond v-if="session.estComptable && id !== session.compteId"
      cond="cUrgence" :label="$t('PPchpart')" @ok="chgPartition"/>
    <btn-cond v-if="session.estComptable && id !== session.compteId" 
      cond="cUrgence" :label="$t('PPchdel')" @ok="chgDelegue"/>
    <btn-cond v-if="comptaVis" cond="cUrgence" :label="$t('PPcompta')" @ok="voirCompta"/>
    <btn-cond v-if="idp === 0" color="warning" icon="change_history"
      cond="cEdit" class="justify-start" @ok="muter"
      :label="$t('PPmuterO')">
      <q-tooltip>{{$t('PPmutO')}}</q-tooltip>
    </btn-cond>
  </div>

  <!-- Mutation de type de compte -->
  <q-dialog v-model="ui.d.BPmut[idc]" persistent>
    <q-card :class="styp('md')">
      <q-toolbar class="bg-secondary text-white">
        <btn-cond color="warning" icon="close" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">
          {{$t('PPmutO')}}
        </q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>

      <micro-chat class="q-pa-xs q-my-md" :chat="chat"/>
      
      <q-card-section>
        <phrase-contact @ok="okpc" :orgext="session.org" declaration/>
        <div v-if="diag" class="q-ma-sm q-pa-xs bg-yellow-3 text-negative text-bold">{{diag}}</div>
      </q-card-section>
      
      <choix-quotas :quotas="quotas"/>
      <div v-if="quotas.err" class="bg-yellow-5 text-bold text-black q-pa-xs">
        {{$t('PPquot')}}
      </div>

      <q-card-section>
        <div class="titre-md">{{$t('PPmutmc')}}</div>
        <editeur-md
          v-model="texte" :lgmax="250" modetxt editable mh="6rem"
          :texte="txtdef"/>
      </q-card-section>

      <q-card-actions class="q-pa-xs q-mt-sm q-gutter-xs" align="right" vertical>
        <btn-cond icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond :disable="(diag !== '') || quotas.err" color="warning" icon="change_history" 
          cond="cUrgence" :label="$t('PPmutO2')" @ok="cf=true"/>
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
      <div v-if="estDel" class="text-center q-my-md titre-md">{{$t('PPdel')}}</div>
      <div v-else class="text-center q-my-md titre-md">{{$t('PPndel')}}</div>
      <q-card-actions align="right" class="q-gutter-sm">
        <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond v-if="estDel" icon="check" color="warning"
          :label="$t('PPkodel')" @ok="changerDel(false)"/>
        <btn-cond v-else icon="check" color="warning"
          :label="$t('PPokdel')" @ok="changerDel(true)"/>
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

import { ref, toRef, onMounted } from 'vue'
import stores from '../stores/stores.mjs'
import { ID, UNITEN, UNITEV } from '../app/api.mjs'
import PanelCompta from '../components/PanelCompta.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import MicroChat from '../components/MicroChat.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import EditeurMd from '../components/EditeurMd.vue'
import PhraseContact from '../components/PhraseContact.vue'
import { styp, edvol, afficherDiag } from '../app/util.mjs'
import { StatutAvatar, ChangerPartition, DeleguePartition, 
  GetAvatarPC, MuterCompteO } from '../app/operations4.mjs'
import { GetCompta, GetSynthese, GetPartition } from '../app/synchro.mjs'

export default {
  name: 'BarrePeople',

  components: { PhraseContact, BtnCond, EditeurMd, PanelCompta, BoutonConfirm, MicroChat, ChoixQuotas, BoutonHelp },

  props: { id: Number, part: Boolean },

  computed: {
    cv () { return this.session.getCV(this.id) },
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    estDel () { return this.session.partition.estDel(this.id)},
    comptaVis () { return (this.session.estComptable || 
      (this.session.estDelegue && !this.session.eltPart(this.id).fake)) && this.id !== this.session.compteId 
    },

    opt () { return this.session.espace.opt },
    chat () { return this.aSt.getChatIdIE(this.session.compteId, this.id) },
    cpt () { return this.session.compta },
    txtdef () { return this.$t('PPmsgo', [this.session.partition.id])}
  },

  watch: {
    filtre (ap, av) { this.filtrer() },
    verif1 (ap) { if (ap) this.verifd = true }
  },
  
  data () {
    return {
      texte: '',
      selx: null,
      filtre: '',
      lst: [],
      atr: [],
      pcc: 0,
      pcn: 0,
      pcv: 0,
      stp: true, // avatar principal, 
      sta: true, // compte A
      cf: false,
      quotas: {}, // { q1, q2, qc, min1, min2, max1, max2, minc, maxc, err}
      diag: ''
    }
  },

  methods: {
    edn (v) { return v * UNITEN },
    edv (v) { return edvol(v * UNITEV) },

    async okpc (p) {
      const id = await new GetAvatarPC().run(p)
      this.diag = this.idcpt !== id ? this.$t('PPmutpc') : ''
    },

    async muter () {
      if (!this.chat) {
        await afficherDiag(this.$t('PPchatreq'))
        return
      }
      await new GetCompta().run(this.idcpt)
      await new GetPartition().run(this.session.partition.id)
      const c = this.cpt.qv
      const s = this.session.partition.synth
      this.quotas = {
        qn: c.qn,
        qv: c.qv,
        qc: 1,
        minn: Math.ceil((c.nc + c.ng + c.nn) / UNITEN),
        minv: Math.ceil(c.v / UNITEV),
        minc: 1,
        maxn: s.q.qn - s.qt.qn,
        maxv: s.q.qv - s.qt.qv,
        maxc: s.q.qc - s.qt.qc
      }
      this.cf = false
      this.diag = this.$t('PPmutpc2')
      this.ui.oD('BPmut', this.idc)
    },

    async mut () {
      await new MuterCompteO().run(this.idcpt, this.quotas, this.chat, this.texte)
      this.idp = this.session.partition.id
      await new GetPartition().run(this.session.partition.id)
      await new GetSynthese().run()
      this.ui.fD()
    },

    async voirCompta () { // comptable OU délégué
      await new GetCompta().run(this.id)
      this.ui.oD('BPcptdial', this.idc)
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
          const e = tsp[idp]
          const y = { 
            idp,
            code: '#' + idp.substring(idp.length - 4) + ' [' + code  + ']',
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

    async chgDelegue () { // comptable
      this.ui.oD('BPchgSp', this.idc)
    },

    async changerDel(del) {
      await new DeleguePartition().run(this.id, del)
      await new GetPartition().run(this.session.partition.id)
      await new GetSynthese().run()
      this.ui.fD()
    },

    async chgPartition () { // comptable
      await new GetSynthese().run()
      await new GetCompta().run(this.id)
      this.filtre = ''
      this.filtrer()
      this.ui.oD('BPchgTr', this.idc)
    },

    async changerPart () {
      await new ChangerPartition().run(this.id, this.selx.idp, this.session.notifC)
      await new GetPartition().run(this.session.partition.id)
      await new GetSynthese().run()
      this.ui.fD()
    }
  },

  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    const part = toRef(props, 'part')
    const id = toRef(props, 'id')
    const idp = ref(part.value ? session.partition.id : 0)
    const idcpt = ref(id.value)

    if (!part.value) {
      onMounted(async () => {
        const [c, p] = await new StatutAvatar().run(id.value)
        idp.value = p
        idcpt.value = c
      })
    }
    return {
      ID, styp, ui, idc, idp, idcpt, session,      
      aSt: stores.avatar
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
