<template>
<q-page class="q-pa-sm column items-center">
  <btn-cond class="q-my-sm" :label="$t('PGcrea')" @ok="nvGr" icon="add" cond="cEdit"/>

  <q-card v-if="pg" class="spmd column items-center">
    <div v-if="pg" class="q-my-sm full-width">
      <div class="row q-my-sm">
        <div class="col-6 fs-md text-italic text-right">{{$t('PGstatsh')}}</div>
        <div class="col-3 fs-md text-italic text-center">{{$t('nbnotes')}}</div>
        <div class="col-3 fs-md text-italic text-center">{{$t('volv2')}}</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PGvut')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{pg.stt.nn}}</div>
        <div class="col-3 fs-md font-mono text-center">{{edv(pg.stt.vf)}}</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PGvq')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{'[' + pg.stt.qn + '] / ' + edqn(pg.stt.nn)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ '[' + pg.stt.qv + '] / ' + edqv(pg.stt.qv)}}</div>
      </div>
    </div>
  </q-card>

  <q-card class="spmd q-my-lg">
    <div class="row">
      <div class="col-6 q-px-xs">
        <div class="full-width titre-md text-italic tbp text-center">{{$t('ICtita')}}</div>
        <div v-for="(inv, idx) of gSt.invitsAtt" :key="inv.idg + '/' + inv.ida">
          <div :class="dkli(idx) + 'q-my-xs row invs items-center cursor-pointer'" @click="ouvaccinv(inv)">
            <div class="col-6 text-center">{{session.getCV(inv.ida).nom}}</div>
            <div class="col-6 text-center">{{session.getCV(inv.idg).nomC}}</div>
          </div>
        </div>
      </div>
      <div class="col-6 q-px-xs">
        <div class="full-width titre-md text-italic tbp text-center">{{$t('ICtitc')}}</div>
        <div v-for="(inv, idx) of gSt.contactsAtt" :key="inv.idg + '/' + inv.ida">
          <div :class="dkli(idx) + 'q-my-xs row invs items-center cursor-pointer'" @click="ouvaccinv(inv)">
            <div class="col-6 text-center">{{session.getCV(inv.ida).nom}}</div>
            <div class="col-6 text-center">{{session.getCV(inv.idg).nomC}}</div>
          </div>
        </div>
      </div>
    </div>
  </q-card>

  <div v-if="!pg || !pg.r.length" class="q-my-lg titre-lg text-italic text-center">
    {{$t('PGvide', [pgLg.length])}}
  </div>

  <div class="spmd" v-else>
    <q-card v-for="(e, idx) in pg.r" :key="e.groupe.id" :class="dkli(idx) + 'q-mb-md'">
      <apercu-genx :id="e.groupe.id" :idx="idx" />
      <div v-if="e.groupe.dfh" class="q-mr-sm">
        <q-icon name="warning" size="md" color="negative"/>
        <span class="q-ml-xs msg">{{$t('AGnheb', [AMJ.editDeAmj(e.groupe.dfh)])}}</span>
      </div>
      <div class="row full-width items-center justify-between">
        <div>
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
  <dial-std2 v-if="m2" v-model="m2" :titre="titinv" help="dial_invitack">
    <invitation-acceptation :inv="inv"/>
  </dial-std2>

  <!-- Création d'un nouveau contact du groupe ------------------------------------------------>
  <dial-std1 v-if="m3" v-model="m3" :titre="$t('PGctc', [nomgi] )"
    okic="close" cond="cEdit" :okfn="ctc">
    <div class="q-pa-xs">
      <apercu-genx :id="inv.idg" :idx="0"/>
      <q-option-group v-model="ctcOpt" :options="options2" color="primary"/>
    </div>
  </dial-std1>

  <!-- Création d'un nouveau groupe ------------------------------------------------>
  <dial-std1 v-if="m1" v-model="m1" :titre="$t('PGcrea')"
    :disable="quotas.err !== '' || !nom" okic="add" oklbl="creer" cond="cEdit" :okfn="okCreation">
    <div class="q-pa-sm column">
      <sel-avid class="self-center"/>
      <nom-avatar class="titre-md q-my-sm" verif groupe @ok-nom="oknom"/>
      <div class="titre-md q-mt-sm">{{$t('PGquotas')}}</div>
      <choix-quotas v-model="quotas" groupe/>
      <q-option-group class="q-my-md" dense :options="options" type="radio" v-model="una"/>
    </div>
  </dial-std1>

  <!-- Chat du groupe -->
  <dial-std2  v-model="m4" :titre="$t('CHGtit', [session.getCV(session.groupeId).nom])" help="chatgr">
    <apercu-chatgr />
  </dial-std2>

</q-page>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { edvol, $t, dkli, afficher8000 } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import NomAvatar from '../components/NomAvatar.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import SelAvid from '../components/SelAvid.vue'
import ApercuChatgr from '../panels/ApercuChatgr.vue'
import InvitationAcceptation from '../components/InvitationAcceptation.vue'
import DialStd1 from '../dialogues/DialStd1.vue'
import DialStd2 from '../dialogues/DialStd2.vue'
import { AMJ, UNITEN, UNITEV } from '../app/api.mjs'
import { NouveauGroupe, AnnulerContact } from '../app/operations4.mjs'

const props = defineProps({ tous: Boolean })

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const m1 = computed(() => ui.d[idc].PGcrgr)
const m2 = computed(() => ui.d[idc].IAaccinvit)
const m3 = computed(() => ui.d[idc].PGctc)
const m4 = computed(() => ui.d[idc].PGACGouvrir)

const session = stores.session
const fStore = stores.filtre
const gSt = stores.groupe

const options = [
  { label: $t('AGsimple'), value: false },
  { label: $t('AGunanime'), value: true, color: 'warning' }
]
const options2 = [{ label: $t('PGctc1'), value: false }, { label: $t('PGctc2'), value: true }]

fStore.filtre.groupes.tous = props.tous || false

const quotas = ref(null) // { q1) q2) min1) min2) max1) max2) err}
const nom = ref('')
const una = ref(false)
const inv = ref(null) // invitation courante

const nomgi = computed(() => session.getCV(inv.value.idg).nom)

const pgLg = computed(() => {
  const f = fStore.filtre.groupes
  const m = []
  if (f.tous) {
    gSt.map.forEach(e => {
      const x = { ...e, nom: session.getCV(e.groupe.id).nom }
      m.push(x) 
    })
  } else {
    const s = session.compte.idGroupes(session.avatarId)
    s.forEach(idg => { 
      const x = { ...gSt.map.get(idg), nom: session.getCV(idg).nom }
      m.push(x) 
    })
  }
  return m
})

const pg = computed(() => {
  const ci = session.compti
  const f = fStore.filtre.groupes
  const fsetp = f.mcp && f.mcp.size ? f.mcp : null
  const fsetn = f.mcn && f.mcn.size ? f.mcn : null
  const stt = { nn: 0, vf: 0, qn: 0, qv: 0 }
  const r = []
  for (const e of pgLg.value) {
    const g = e.groupe
    if (e.estHeb) {
      stt.nn += g.nn || 0
      stt.vf += g.vf || 0
      stt.qn += g.qn || 0
      stt.qv += g.qv || 0
    }
    if (f.ngr && !e.nom.startsWith(f.ngr)) continue
    if (f.sansheb && !g.dfh) continue
    if (f.excedent && ((g.qn * UNITEN) > g.nn) && ((g.qv * UNITEV) > g.vf )) continue
    const mc = ci.mc.get(g.id)
    if (f.infmb && (!mc.tx || mc.tx.indexOf(f.infmb)) === -1) continue
    if (fsetp && !ci.aHT(g.id, fsetp)) continue
    if (fsetn && ci.aHT(g.id, fsetn)) continue
    if (f.invits && g.nbInvites === 0) continue
    r.push(e)
  }
  r.sort((a,b) => { return a.nom < b.nom ? -1 : (a.nom > b.nom ? 1 : 0)})
  return { r, stt }
})

watch(pg, (ap) => { ui.fmsg(ap.r.length)})

function oknom (n) { nom.value = n }
const am = (idg) => gSt.amb(idg)
const edqn = (n) => n * UNITEN 
const edqv = (n) => edvol(n * UNITEV)
const edv = (n) => edvol(n)
const nbiv = (e) => gSt.nbMesInvits(e)

const titinv = ref()
const ctcOpt = ref(false)

async function ouvaccinv (invx) {
  inv.value = invx
  session.setGroupeId(inv.value.idg)
  titinv.value = $t('ICtit2', [session.getCV(inv.value.ida).nom, session.getCV(inv.value.idg).nom])
  ctcOpt.value = false
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
  const cpt = session.qv // { qc, qn, qv, pcc, pcn, pcv, nbj }
  quotas.value = { qn: 0, qv: 0, qc: 0, minn: 0, minv: 0, maxn: cpt.qn, maxv: cpt.qv, err: ''}
  nom.value = ''
  una.value = false
  ui.oD('PGcrgr', idc)
}

async function ctc () {
  ui.fD()
  const r = await new AnnulerContact().run(inv.value.idg, inv.value.ida, ctcOpt.value)
  if (r) await afficher8000(r, inv.value.ida, inv.value.idg)
}

async function okCreation () {
  await new NouveauGroupe().run(nom.value, una.value, quotas.value)
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.invs:hover
  background-color: var(--q-secondary) !important
  color: white !important
</style>
