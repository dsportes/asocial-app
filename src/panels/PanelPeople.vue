<template>
<q-dialog v-model="ui.d.a.detailspeople" position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('APtit', [session.getCV(id).nom])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <div class="q-pa-sm">
      <apercu-genx :id="id" nodet :del="del"/>

      <div class="row q-gutter-sm items-center">
        <btn-cond v-if="comptaVis" cond="cUrgence" :label="$t('PPcompta')" @ok="voirCompta"/>
        <btn-cond v-if="estA && session.estDelegue" 
          color="warning" icon="change_history"
          cond="cEdit" class="justify-start" @ok="muterO"
          :label="$t('PPmuterO')">
          <q-tooltip>{{$t('PPmutO')}}</q-tooltip>
        </btn-cond>
      </div>

      <!--barre-people v-if="session.estComptable || session.estDelegue" :id="id"/-->

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <chats-avec :id-e="id" :del="del"/>

      <q-separator color="orange" class="q-my-md q-mx-sm"/>

      <div class="titre-md text-italic y-mb-sm">{{$t('PPgroupes')}}</div>

      <div v-for="idg in sgr" :key="idg">
        <div class="q-my-sm row q-gutter-sm">
          <span class="fs-md col">{{session.getCV(idg).nomc}} - {{$t('AMm' + stmb(idg))}}</span>
          <btn-cond class="col-auto" size="sm" icon-right="open_in_new"
            :label="$t('PGvg')" @ok="voirgr(idg)"/>
        </div>
      </div>

    </div>
  
  </q-page-container>

  <!-- Mutation de type de compte en "O" -->
  <q-dialog v-model="ui.d[idc].BPmutO" persistent>
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
      
      <choix-quotas v-model="quotasO"/>
      <div v-if="quotasO.err" class="bg-yellow-5 text-bold text-black q-pa-xs">
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
        <btn-cond :disable="(diag !== '') || quotasO.err || !pc" color="warning" icon="change_history" 
          cond="cUrgence" :label="$t('PPmutO')" @ok="cf=true"/>
        <bouton-confirm :actif="cf" :confirmer="mutO"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Affichage des compteurs de compta du compte "courant"-->
  <q-dialog v-model="ui.d[idc].BPcptdial" position="left" persistent>
    <q-layout container view="hHh lpR fFf" :class="styp('md')">
      <q-header elevated class="bg-secondary text-white">
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

</q-layout>
</q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import ApercuGenx from '../components/ApercuGenx.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BarrePeople from '../components/BarrePeople.vue'
import ChatsAvec from '../components/ChatsAvec.vue'
import BtnCond from '../components/BtnCond.vue'
import PanelCompta from '../components/PanelCompta.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import MicroChat from '../components/MicroChat.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import EditeurMd from '../components/EditeurMd.vue'
import PhraseContact from '../components/PhraseContact.vue'
import { styp, $t } from '../app/util.mjs'
import { GetCompta, GetComptaQv, GetAvatarPC, MuterCompteO, GetSynthese, GetPartition } from '../app/operations4.mjs'


const session = stores.session
const cfg = stores.config
const pSt = stores.people
const gSt = stores.groupe
const aSt = stores.avatar
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const id = computed(() => session.peopleId)
const cv = computed(() => session.getCV(id.value) )
const deMaPart = computed(() => !session.eltPart(id.value).fake)
const comptaVis = computed(() => id.value !== session.sessionId && 
  session.estComptable || (session.estDelegue && deMaPart.value))
const sgr = computed(() => pSt.getSgr(id.value))
const compta = ref(null)
const cf = ref(false)
const quotasO = ref({}) // { q1) q2) qc) min1) min2) max1) max2) minc) maxc) err}
const diag = ref('')
const pc = ref(null)
const texte = ref('')
const txtdefO = computed(() => $t('PPmsgo', [session.partition.id]))
const estA = computed(() => compta.value && compta.value.estA)
const chat = computed(() => aSt.getChatIdIE(session.compteId, id.value))

const del = computed(() => { 
  const p = session.partition
  return p && p.estDel(id.value)
})

if (session.estComptable || (session.estDelegue && deMaPart.value)) onMounted(async () => {
    compta.value = await new GetCompta().run(id.value)
})

async function voirCompta () { // comptable OU délégué
  // if (compta.value) compta.value = await new GetCompta().run(id.value)
  ui.oD('BPcptdial', idc)
}

const gr = (idg) => { const e = gSt.egr(idg); return e ? e.groupe : null }
const im = (idg) => { const g = gr.value(idg); return g ? g.tid[id.value] : 0 }
const stmb = (idg) => { const i = im.value(idg); return i ? g.statutMajeur(i) : 0 }

function voirgr (idg) {
  session.setGroupeId(idg)
  session.setMembreId(im.value(idg))
  ui.setPage('groupe', 'membres')
}

async function okpc (p) {
  pc.value = p
  const idx = await new GetAvatarPC().run(p)
  diag.value = id.value !== idx ? $t('PPmutpc') : ''
}

/* Un compte A est muté en O DANS LA PARTITION DU DELEGUE
donc Primitive si c'est le Comptable */
async function muterO () {
  if (!chat.value) {
    await afficherDiag($t('PPchatreq'))
    return
  }
  const c = await new GetComptaQv().run(id.value)
  await new GetPartition().run(session.partition.id)
  const qp = session.partition.q
  const qa = session.partition.synth.qt
  const qm = cfg.quotasMaxC
  let maxn = qp.qn - qa.qn
  if (maxn < 0) maxn = 0
  if (maxn > qm[0]) maxn = qm[0]
  let maxv = qp.qv - qa.qv
  if (maxv < 0) maxv = 0
  if (maxv > qm[1]) maxv = qm[1]
  let maxc = qp.qc - qa.qc
  if (maxc < 0) maxc = 0
  if (maxc > qm[2]) maxn = qm[2]
  quotasO.value = {
    qn: c.qn > maxn ? maxn : c.qn, 
    qv: c.qv > maxv ? maxv : c.qv, 
    qc: c.qc > maxc ? maxc : c.qc, 
    minn: 0, minv: 0, minc: 0,
    maxn, maxv, maxc,
    n: c.nn + c.nc + c.ng, 
    v: c.v,
    err: ''
  }
  cf.value = false
  diag.value = $t('PPmutpc2')
  ui.oD('BPmutO', idc)
}

async function mutO () {
  await new MuterCompteO().run(id.value, quotasO.value, chat.value, 
    texte.value || txtdefO.value, pc.value)
  pc.value = null
  await new GetPartition().run(session.partition.id)
  await new GetSynthese().run()
  ui.fD()
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.q-card__section
  padding: 2px !important
</style>
