<template>
<div>
  <div class="row justify-center q-gutter-sm q-my-sm items-center">
    <btn-cond v-if="session.estComptable && id !== session.compteId"
      cond="cUrgence" :label="$t('PPchpart')" @ok="chgPartition"/>
    <btn-cond v-if="session.estComptable && id !== session.compteId" 
      cond="cUrgence" :label="$t('PPchdel')" @ok="chgDelegue"/>
    <btn-cond v-if="comptaVis" cond="cUrgence" :label="$t('PPcompta')" @ok="voirCompta"/>
    <btn-cond v-if="!idp" color="warning" icon="change_history"
      cond="cEdit" class="justify-start" @ok="muter"
      :label="$t('PPmuterO')">
      <q-tooltip>{{$t('PPmutO')}}</q-tooltip>
    </btn-cond>
    <btn-cond v-if="idp && !session.estComptable" color="warning" icon="change_history"
      cond="cEdit" class="justify-start" @ok="muterA"
      :label="$t('PPmuterA')">
      <q-tooltip>{{$t('PPmutA')}}</q-tooltip>
    </btn-cond>

  </div>

  <!-- Mutation de type de compte en "A" -->
  <q-dialog v-model="ui.d[idc].BPmutA" persistent>
    <q-card :class="styp('md')">
      <q-toolbar class="bg-secondary text-white">
        <btn-cond icon="close" color="warning" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg full-width text-center">{{$t('PPmutA')}}</q-toolbar-title>
      </q-toolbar>

      <micro-chat class="q-pa-xs q-my-md" :chat="chat"/>
      
      <q-card-section>
        <phrase-contact @ok="okpc" :orgext="session.org" declaration/>
        <div v-if="diag" class="q-ma-sm q-pa-xs bg-yellow-3 text-negative text-bold">{{diag}}</div>
      </q-card-section>

      <q-card-section>
        <div class="titre-md">{{$t('PPmutmc')}}</div>
        <editeur-md
          v-model="texte" :lgmax="250" modetxt editable mh="6rem"
          :texte="txtdefA"/>
      </q-card-section>

      <q-card-actions class="q-pa-xs q-mt-sm q-gutter-sm" align="center" vertical>
        <btn-cond icon="undo" flat :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond :disable="!pc" color="warning" icon="change_history" 
          cond="cUrgence" :label="$t('PPmutA')" @ok="cf=true"/>
        <bouton-confirm :actif="cf" :confirmer="mutA"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Mutation de type de compte en "O" -->
  <q-dialog v-model="ui.d[idc].BPmut" persistent>
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
      
      <choix-quotas v-model="quotas"/>
      <div v-if="quotas.err" class="bg-yellow-5 text-bold text-black q-pa-xs">
        {{$t('PPquot')}}
      </div>

      <q-card-section>
        <div class="titre-md">{{$t('PPmutmc')}}</div>
        <editeur-md
          v-model="texte" :lgmax="250" modetxt editable mh="6rem"
          :texte="txtdefO"/>
      </q-card-section>

      <q-card-actions class="q-pa-xs q-mt-sm q-gutter-sm" align="center" vertical>
        <btn-cond icon="undo" flat :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond :disable="(diag !== '') || quotas.err || !pc" color="warning" icon="change_history" 
          cond="cUrgence" :label="$t('PPmutO2')" @ok="cf=true"/>
        <bouton-confirm :actif="cf" :confirmer="mut"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Changement de partition -->
  <q-dialog v-model="ui.d[idc].BPchgTr" persistent>
    <q-card :class="styp('sm')">
      <div class="titre-lg bg-secondary text-white text-center">
        {{$t('PPchgpart', [cv.nom, session.codePart(idpCpt)])}}</div>
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
        <div v-for="x in lst" :key="x.id" :class="cllst(x)"  @click="selx = x">
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
  <q-dialog v-model="ui.d[idc].BPchgSp" persistent>
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
  <q-dialog v-model="ui.d[idc].BPcptdial" full-height position="left" persistent>
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
import { StatutAvatar, ChangerPartition, DeleguePartition, 
  GetAvatarPC, MuterCompteO, MuterCompteA } from '../app/operations4.mjs'
import { GetCompta, GetComptaQv, GetSynthese, GetPartition } from '../app/synchro.mjs'

const session = stores.session
const aSt = stores.avatar
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const props = defineProps({ 
  id: String,
  part: Boolean
})

if (!props.part) {
  onMounted(async () => {
    const [c, p] = await new StatutAvatar().run(props.id)
    idp.value = p
    idcpt.value = c
  })
}
const idp = ref(props.part ? session.partition.id : '')
const idcpt = ref(props.id)
const idpCpt = ref(null)
const pc = ref(null)
const texte = ref('')
const selx = ref(null)
const filtre = ref('')
const lst = ref([])
const atr = ref([])
const pcc = ref(0)
const pcn = ref(0)
const pcv = ref(0)
const stp = ref(true) // avatar principal) 
const sta = ref(true) // compte A
const cf = ref(false)
const quotas = ref({}) // { q1) q2) qc) min1) min2) max1) max2) minc) maxc) err}
const diag = ref('')

const cv = computed(() => session.getCV(props.id) )
const estDel = computed(() => session.partition.estDel(props.id))
const comptaVis = computed(() => (session.estComptable || 
  (session.estDelegue && !session.eltPart(props.id).fake)) && props.id !== session.compteId )
const opt = computed(() => session.espace.opt)
const chat = computed(() => aSt.getChatIdIE(session.compteId, props.id))
const cpt = computed(() => session.compta)
const txtdefO = computed(() => $t('PPmsgo', [session.partition.id]))
const txtdefA = computed(() => $t('PPmsga'))

watch(filtre, (ap, av) => { filtrer() })

const edn = (v) => v * UNITEN
const edv = (v) => edvol(v * UNITEV)

const cllst = (x) => { const cl = 'row items-center cursor-pointer' + (selx.value && selx.value.idp === x.idp ? ' bord2' : ' bord1')
  return cl + (idpCpt.value === x.idp ? ' disabled' : '')
}

async function okpc (p) {
  pc.value = p
  const id = await new GetAvatarPC().run(p)
  diag.value = idcpt.value !== id ? $t('PPmutpc') : ''
}

async function muter () {
  if (!chat.value) {
    await afficherDiag($t('PPchatreq'))
    return
  }
  const c = await new GetComptaQv().run(idcpt.value)
  await new GetPartition().run(session.partition.id)
  const s = session.partition.synth
  quotas.value = {
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
  cf.value = false
  diag.value = $t('PPmutpc2')
  ui.oD('BPmut', idc)
}

async function muterA () {
  if (!chat.value) {
    await afficherDiag($t('PPchatreq'))
    return
  }
  ui.oD('BPmutA', idc)
}

async function mut () {
  await new MuterCompteO().run(idcpt.value, quotas.value, chat.value, texte.value, pc.value)
  idp.value = session.partition.id
  pc.value = null
  await new GetPartition().run(session.partition.id)
  await new GetSynthese().run()
  ui.fD()
}

async function mutA () {
  await new MuterCompteA().run(idcpt.value, chat.value, texte.value, pc.value)
  idp.value = null
  pc.value = null
  await new GetPartition().run(session.partition.id)
  await new GetSynthese().run()
  ui.fD()
}

async function voirCompta () { // comptable OU délégué
  await new GetCompta().run(props.id)
  ui.oD('BPcptdial', idc)
}

function filtrer () {
  const l = []
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
  const c = await new GetCompta().run(props.id)
  if (c.estA) {
    await afficherDiag($t('PPnopart'))
    return
  }
  ui.oD('BPchgSp', idc)
}

async function changerDel(del) {
  await new DeleguePartition().run(props.id, del)
  await new GetPartition().run(session.partition.id)
  await new GetSynthese().run()
  ui.fD()
}

async function chgPartition () { // comptable
  await new GetSynthese().run()
  const c = await new GetCompta().run(props.id)
  if (c.estA) {
    await afficherDiag($t('PPnopart'))
    return
  }
  idpCpt.value = c.idp
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
