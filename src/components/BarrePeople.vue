<template>
<div>
  <div class="row justify-center q-gutter-sm q-my-sm items-center">
    <btn-cond v-if="session.estComptable && !ID.estComptable(id)"
      cond="cUrgence" :label="$t('PPchpart')" @ok="chgPartition"/>
    <btn-cond v-if="estDel && session.estComptable && !ID.estComptable(id)" 
      icon="check" color="warning" cond="cUrgence"
      :label="$t('PPkodel')" @ok="changerDel(false)"/>
    <btn-cond v-if="!estDel && session.estComptable && !ID.estComptable(id)"
      icon="check" color="warning" cond="cUrgence"
      :label="$t('PPokdel')" @ok="changerDel(true)"/>
    <btn-cond v-if="id !== session.compteId && !ID.estComptable(id)"
      cond="cUrgence" :label="$t('PPcompta')" @ok="voirCompta"/>
  </div>

  <!-- Changement de partition -->
  <q-dialog v-model="ui.d[idc].BPchgTr" persistent>
    <q-card :class="styp('sm') + ' q-pa-sm'">
      <div class="titre-lg tbs text-center">
        {{$t('PPchgpart', [cv.nom, session.codePart(idp)])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqvn', [cpt.qv.qn, edn(cpt.qv.qn), cpt.pcn])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqvv', [cpt.qv.qv, edv(cpt.qv.qv), cpt.pcv])}}</div>
      <div class="q-mx-sm titre-md">{{$t('PPqvc', [cpt.qv.qc, cpt.pcc])}}</div>

      <q-input filled v-model="filtre" :label="$t('PPnt')" />
      <q-separator class="q-mt-sm"/>

      <q-card-section>
        <div class="titre-md text-italic row items-center">
          <div class="col-3">{{$t('PPc1')}}</div>
          <div class="col-3 text-center">{{$t('PPcn', [cpt.qv.qn])}}</div>
          <div class="col-3 text-center">{{$t('PPcv', [cpt.qv.qv])}}</div>
          <div class="col-3 text-center">{{$t('PPcc', [cpt.qv.qc])}}</div>
        </div>
        <div class="titre-md q-mt-sm text-bold text-italic">{{$t('PPc0')}}</div>
      </q-card-section>

      <q-card-section style="height: 30vh" class="scroll bord1">
        <div v-for="x in lst" :key="x.id" :class="cllst(x)"  @click="selx = x">
          <div class="col-3">{{x.code}}</div>
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
          <div class="col-3 q-px-xs">
            <div :class="'text-center' + (x.okc ? '' : ' bg-yellow-5 text-bold text-negative')">
              <span >{{x.dc}}</span>
              <span class="q-mx-sm">/</span>
              <span>{{x.qc}}</span>
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

  <!-- Affichage des compteurs de compta du compte "courant"-->
  <q-dialog v-model="ui.d[idc].BPcptdial" position="left" persistent>
    <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated class="tbs">
        <q-toolbar>
          <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">
            {{$t('PTcompta', [cv.nomC])}}</q-toolbar-title>
        </q-toolbar>
      </q-header>
      <q-page-container>
        <q-card>
          <panel-compta style="margin:0 auto" :c="session.compta.compteurs"/>
        </q-card>
      </q-page-container>
    </q-layout>
  </q-dialog>

</div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

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
import { $t, styp, edvol, afficherDiag } from '../app/util.mjs'
import { StatutChatE, ChangerPartition, DeleguePartition, GetCompta, GetComptaQv,  
  GetAvatarPC, GetSynthese, GetPartition } from '../app/operations4.mjs'

const session = stores.session
const cfg = stores.config
const aSt = stores.avatar
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const props = defineProps({ 
  id: String
})

const idp = ref(session.partition.id) // id de la partition du compte

const pc = ref(null)
const texte = ref('')
const selx = ref(null)
const filtre = ref('')
const lst = ref([])
const atr = ref([])
const pcc = ref(0)
const pcn = ref(0)
const pcv = ref(0)
const cf = ref(false)
const diag = ref('')

const cv = computed(() => session.getCV(props.id) )
const estDel = computed(() => session.partition.estDel(props.id))

const opt = computed(() => session.espace.opt)
const chat = computed(() => aSt.getChatIdIE(session.compteId, props.id))
const cpt = computed(() => session.compta.compteurs)
const txtdefA = computed(() => $t('PPmsga'))

watch(filtre, (ap, av) => { filtrer() })

const edn = (v) => v * UNITEN
const edv = (v) => edvol(v * UNITEV)

const cllst = (x) => { const cl = 'row items-center cursor-pointer' + (selx.value && selx.value.idp === x.idp ? ' bord2' : ' bord1')
  return cl + (session.partition.id === x.idp ? ' disabled' : '')
}

async function voirCompta () { // comptable OU délégué
  await new GetCompta().run(props.id)
  ui.oD('BPcptdial', idc)
}

function filtrer () {
  const l = []
  /*
  - `tsp` : map des _synthèses_ des partitions.
    - _clé_: ID de la partition.
    - _valeur_ : `synth`, objet des compteurs de synthèse calculés de la partition.
      - `id nbc nbd`
      - `ntfp[1,2,3]`
      - `q` : `{ qc, qn, qv }`
      - `qt` : { qc qn qv c2m n v }`
      - `ntf[1,2,3]`
      - `pcac pcan pcav pcc pcn pcv`
  */
  const tsp = session.synthese.tsp
  for(const [idp, code] of session.compte.mcode) {
    if (!filtre.value || (code && code.indexOf(filtre.value) !== -1)) {
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
      y.okc = cpt.value.qv.qc <= y.dc
      y.okn = cpt.value.qv.qn <= y.dn
      y.okv = cpt.value.qv.qv <= y.dv
      l.push(y)
    }
  }
  lst.value = l
}

async function chgDelegue () { // comptable
  ui.oD('BPchgSp', idc)
}

async function changerDel(del) {
  await new DeleguePartition().run(props.id, del)
  await new GetPartition().run(session.partition.id)
  await new GetSynthese().run()
  ui.fD()
}

async function chgPartition () { // comptable
  await new GetCompta().run(props.id)
  await new GetSynthese().run()
  selx.value = null
  filtre.value = ''
  filtrer()
  ui.oD('BPchgTr', idc)
}

async function changerPart () {
  await new ChangerPartition().run(props.id, selx.value.idp, session.notifC)
  await new GetPartition().run(session.partition.id)
  await new GetSynthese().run()
  ui.fD()
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
