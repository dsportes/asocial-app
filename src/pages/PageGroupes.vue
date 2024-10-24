<template>
<q-page class="q-pa-sm column items-center">
  <q-card v-if="gSt.pgLgFT" class="spmd column items-center">

    <btn-cond class="q-my-sm" :label="$t('PGcrea')" @ok="nvGr" cond="cEdit"/>

    <div class="q-my-sm full-width">
      <div class="row">
        <div class="col-6">{{$t('PGstatsh')}}</div>
        <div class="col-3 fs-md text-italic text-center">{{$t('nbnotes')}}</div>
        <div class="col-3 fs-md text-italic text-center">{{$t('volv2')}}</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PGvut')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{stt.nn}}</div>
        <div class="col-3 fs-md font-mono text-center">{{edv(stt.vf)}}</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PGvq')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{'[' + stt.nn + '] / ' + edqn(stt.nn)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ '[' + stt.qv + '] / ' + edqv(stt.qv)}}</div>
      </div>
    </div>
  </q-card>

  <q-card class="spmd q-my-lg">
    <div class="row">
      <div class="col-6 q-px-xs">
        <div class="full-width titre-md text-italic bg-primary text-white text-center">{{$t('ICtita')}}</div>
        <div v-for="(inv, idx) of gSt.invitsAtt" :key="inv.idg + '/' + inv.ida">
          <div :class="dkli(idx) + 'q-my-xs row invs items-center cursor-pointer'" @click="ouvaccinv(inv)">
            <div class="col-6 text-center">{{session.getCV(inv.ida).nom}}</div>
            <div class="col-6 text-center">{{session.getCV(inv.idg).nomC}}</div>
          </div>
        </div>
      </div>
      <div class="col-6 q-px-xs">
        <div class="full-width titre-md text-italic bg-primary text-white text-center">{{$t('ICtitc')}}</div>
        <div v-for="(inv, idx) of gSt.contactsAtt" :key="inv.idg + '/' + inv.ida">
          <div :class="dkli(idx) + 'q-my-xs row invs items-center cursor-pointer'" @click="ouvaccinv(inv)">
            <div class="col-6 text-center">{{session.getCV(inv.ida).nom}}</div>
            <div class="col-6 text-center">{{session.getCV(inv.idg).nomC}}</div>
          </div>
        </div>
      </div>
    </div>
  </q-card>

  <div v-if="!lg.length" class="q-my-lg titre-lg text-italic text-center">
    {{$t('PGvide', [gSt.pgLg.size])}}
  </div>

  <div class="spmd" v-if="lg.length">
    <q-card v-for="(e, idx) in lg" :key="e.groupe.id" :class="dkli(idx) + 'q-mb-md'">
      <apercu-genx :id="e.groupe.id" :idx="idx" />
      <div class="row full-width items-center justify-between">
        <div>
          <div v-if="e.groupe.dfh" class="q-mr-sm">
            <q-icon name="warning" size="md" color="negative"/>
            <span class="q-ml-xs q-pa-xs bg-yellow-3 text-negative">{{$t('PGnh')}}</span>
          </div>
          <div class="q-mr-sm">
            <q-icon v-if= "nbiv(e)" class="q-mr-xs" name="star" size="md" color="green-5"/>
            <span class="text-italic">{{$t('PGinv', nbiv(e), {count: nbiv(e)})}}</span>
          </div>
        </div>
        <div class="row justify-end">
          <btn-cond v-if="am(e.groupe.id)" class="q-ml-sm" icon="chat" :label="$t('PGchat')" 
            cond="cVisu" stop @ok="chat(e)"/>
          <btn-cond class="q-ml-sm" icon="open_in_new" :label="$t('detail')"
            cond="cVisu" stop @ok="ovpageGr(e)"/>
        </div>
      </div>
    </q-card>
  </div>

  <!-- Acceptation / refus de l'invitation -->
  <q-dialog v-model="ui.d[idc].IAaccinvit" full-height persistent position="left">
    <invitation-acceptation :inv="inv"/>
  </q-dialog>

  <!-- Contact du groupe ------------------------------------------------>
  <q-dialog v-model="ui.d[idc].PGctc" persistent>
    <q-card :class="styp('sm')">
      <q-toolbar class="bg-secondary text-white">
        <btn-cond color="warning" icon="close" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center">{{$t('PGctc', [nomgi] )}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <div class="q-pa-xs">
        <apercu-genx :id="inv.idg" :idx="0"/>
        <q-card-actions align="right" class="q-gutter-sm" vertical>
          <btn-cond flat icon="close" :label="$t('jailu')" @ok="ui.fD" />
          <btn-cond color="warning" icon="close" cond="cEdit"
            :label="$t('PGctc1')" @ok="ctc(false)" />
          <btn-cond color="warning" icon="close" cond="cEdit"
            :label="$t('PGctc2')" @ok="ctc(true)" />
        </q-card-actions>
      </div>
    </q-card>
  </q-dialog>

  <!-- Nouveau groupe ------------------------------------------------>
  <q-dialog v-model="ui.d[idc].PGcrgr" persistent>
    <q-card :class="styp('sm')">
      <q-toolbar class="bg-secondary text-white">
        <btn-cond color="warning" icon="close" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center">{{$t('PGcrea')}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <div class="q-pa-xs">
        <sel-avid/>
        <div class="titre-md q-mb-xs text-center">{{$t('PGnom', [nom || '?'])}}</div>
        <nom-avatar class="titre-md q-mb-sm" verif groupe @ok-nom="oknom"/>
        <div class="titre-md q-my-sm">{{$t('PGquotas')}}</div>
        <choix-quotas v-model="quotas" groupe/>
        <q-option-group :options="options" type="radio" v-model="una"/>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD" />
          <btn-cond color="warning" icon="add" cond="cEdit"
            :disable="quotas.err || !nom" :label="$t('creer')" @ok="okCreation" />
        </q-card-actions>
      </div>
    </q-card>
  </q-dialog>

  <q-dialog v-model="ui.d[idc].PGACGouvrir" full-height position="left" persistent>
    <apercu-chatgr />
  </q-dialog>

</q-page>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { edvol, $t, dkli, styp, afficher8000 } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import NomAvatar from '../components/NomAvatar.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import SelAvid from '../components/SelAvid.vue'
import ApercuChatgr from '../panels/ApercuChatgr.vue'
import InvitationAcceptation from '../components/InvitationAcceptation.vue'
import { UNITEN, UNITEV } from '../app/api.mjs'
import { NouveauGroupe, AnnulerContact } from '../app/operations4.mjs'

const props = defineProps({ tous: Boolean })

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const session = stores.session
const aSt = stores.avatar
const fStore = stores.filtre
const stats = fStore.stats
const gSt = stores.groupe

const options = [
  { label: $t('AGsimple'), value: false },
  { label: $t('AGunanime'), value: true, color: 'warning' }
]

fStore.filtre.groupes.tous = props.tous || false

const quotas = ref(null) // { q1) q2) min1) min2) max1) max2) err}
const nom = ref('')
const una = ref(false)
const inv = ref(null) // invitation courante

const stt = computed(() => gSt.pgLgFT[1] || { nn:0, qn: 0, vf: 0, qv: 0 })
const lg = computed(() => gSt.pgLgFT[0] || [] )
const nomgi = computed(() => session.getCV(inv.value.idg).nom)

function oknom (n) { nom.value = n }
const am = (idg) => gSt.amb(idg)
const edqn = (n) => n * UNITEN 
const edqv = (n) => edvol(n * UNITEV)
const edv = (n) => edvol(n)
const nbiv = (e) => gSt.nbMesInvits(e)

async function ouvaccinv (invx) {
  inv.value = invx
  if (invx.invpar.size) ui.oD('IAaccinvit', idc)
  else ui.oD('PGctc', idc)
}

async function ovpageGr (elt) {
  session.setGroupeId(elt.groupe.id)
  ui.setPage('groupe', 'groupe')
}

async function chat (elt) {
  session.setGroupeId(elt.groupe.id)
  ui.oD('PGACGouvrir', idc)
}

async function nvGr () {
  const cpt = session.compte.qv // { qc, qn, qv, pcc, pcn, pcv, nbj }
  const maxn = Math.floor(cpt.qn * (100 - cpt.pcn) / 100)
  const maxv = Math.floor(cpt.qn * (100 - cpt.pcv) / 100)
  quotas.value = { qn: 0, qv: 0, qc: 0, minn: 0, minv: 0, maxn, maxv, err: ''}
  nom.value = ''
  una.value = false
  ui.oD('PGcrgr', idc)
}

async function ctc(ln) {
  ui.fD()
  const r = await new AnnulerContact().run(inv.value.idg, inv.value.ida, ln)
  if (r) await afficher8000(r, inv.value.ida, inv.value.idg)
}

async function okCreation () {
  // console.log(nom.value, quotas.value.qn, quotas.value.qv, una.value)
  await new NouveauGroupe().run(nom.value, una.value, quotas.value)
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.invs:hover
  background-color: $secondary !important
  color: white !important
</style>
