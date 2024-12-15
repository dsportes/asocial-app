<template>
  <q-page class="q-px-xs q-pb-sm">

    <q-tabs  class="col titre-md tbp" v-model="tab" 
      inline-label outside-arrows mobile-arrows no-caps dense>
      <q-tab name="espaces" :label="$t('EStabe')"/>
      <q-tab name="taches" :label="$t('EStabt')"/>
    </q-tabs>

    <div v-if="tab==='taches'" class="q-pa-xs">
      <div class="full-width row items-center q-gutter-sm">
        <btn-cond icon="refresh" @ok="getTaches"/>
        <div class="row items-center">
          <span class="q-mr-sm">{{$t('ESfta')}}</span>
          <q-input class="w6" v-model="ns"
              :label="$t('ESns')" :hint="$t('ESnsh2')" dense>
            <template v-slot:append>
              <btn-cond icon="check" round @ok="getTaches"/>
            </template>
          </q-input>
        </div>
      </div>
      <q-separator class="q-my-xs" color="orange"/>
      <div class="full-width q-mb-sm q-px-sm row items-center justify-between ">
        <btn-cond color="warning" :label="$t('ESgcin')" @ok="initGC"/>
        <div class="row items-center">
          <q-input class="w6 q-mr-sm" v-model="gccode" :label="$t('ESgccode')" dense/>
          <btn-cond color="warning" :label="$t('ESstartd')" @ok="startDemon"/>
        </div>
      </div>
      <q-separator class="q-my-xs" color="orange"/>
      <div v-for="(t, idx) in taches" :key="idx">
        <div :class="dkli(idx) + ' q-my-sm full-with'">
          <div class="row font-mono">
            <div class="col-1 text-center">{{OPNOMS[t.op]}}</div>
            <div class="col-1 text-center">{{t.ns}}</div>
            <div class="col-4 text-center">{{dhstring(t.dh, true)}}</div>
            <div class="col-2 text-center">{{t.id}}</div>
            <div class="col-2 text-center">{{t.ids}}</div>
            <btn-cond class="col-1 text-right" icon="delete" @ok="tacheDel(t)"/>
            <btn-cond class="col-1 text-right" icon="refresh" @ok="tacheGo(t)"/>
          </div>
          <q-input v-if="t.exc" type="textarea" autogrow v-model="t.exc" class="q-pa-xs stackclass font-mono"/>
          <div v-if="!t.id && !t.exc" class="q-ml-xl">
            {{t.dhf ? dhstring(t.dhf, true) : '?'}} - n={{t.nb || 0}}
          </div>
        </div>     
      </div>
    </div>

    <div v-if="tab==='espaces'" class="row justify-between tbs q-pa-xs full-width q-my-sm">
      <btn-cond icon="refresh" @ok="loadEsp"/>
      <div class="col titre-lg text-center">{{$t('ESlo', lstEsp.length, { count: lstEsp.length })}}</div>
      <btn-cond icon="add" :label="$t('ESne')" @ok="plusNS"/>
    </div>

    <div v-if="tab==='espaces'" class="spmd"> <!-- Liste des espaces -->
      <q-expansion-item  v-for="(esp, idx) in lstEsp" :key="esp.ns" class="q-my-xs"
        switch-toggle-side expand-separator dense group="espaces">
        <template v-slot:header>
          <div :class="dkli(idx) + ' full-width'">
            <div class="row full-width justify-between text-bold font-mono fs-lg">
              <div class="col">
                <span class="q-mr-md">#{{esp.ns}}</span>
                <span>{{esp.org}}</span>
                <span v-if="esp.hTC" class="msg q-mx-sm">{{$t('ESencrea')}}</span>
                <span v-if="!esp.hTC && esp.moisStat" class="q-ml-md fs-sm">{{$t('ESdms', [esp.moisStat])}}</span>
              </div>
              <icon-alerte class="col-auto" espace :niv="esp.notifE ? esp.notifE.nr - 1 : -1"/>
            </div>
            <div v-if="limc(idx) !==''" class="msg q-mx-sm">{{$t('PEdlvat', limc(idx))}}</div>
            <div class="titre-md text-italic q-my-sm">{{$t('PEabom', abot(idx))}}</div>
          </div>
        </template>

        <div class="q-ml-lg">
          <btn-cond v-if="esp.hTC" class="q-ma-xs" :label="$t('ENnpspc')" 
            @ok="ovnspc(esp)" />
          
          <q-expansion-item class="q-my-xs" 
            switch-toggle-side expand-separator dense header-class="tbp titre-md"
            :label="$t('ESquotas')" group="espaces2">
            <div class="q-my-sm">
              <div class="row justify-between">
                <quotas-vols class="col" :vols="esp.quotas"/>
                <btn-cond round icon="edit" class="col-auto self-start" @ok="ovchgquotas(esp)"/>
              </div>
            </div>
          </q-expansion-item>

          <q-expansion-item class="q-my-xs" 
            switch-toggle-side expand-separator dense header-class="tbp titre-md"
            :label="$t('ESal')" group="espaces2">
            <div class="q-my-sm">
              <bouton-dlvat :espace="esp" @close="finDlv"/>
              <apercu-notif class="q-my-sm" :notif="esp.notifE" :idx="idx" 
                :type="0" :cible="esp.ns"/>
            </div>
          </q-expansion-item>

          <q-expansion-item v-if="!esp.hTC" class="q-my-xs" 
            switch-toggle-side expand-separator dense header-class="tbp titre-md"
            :label="$t('ESoptc')" group="espaces2">
            <div class="q-my-sm">
              <div class="titre-md q-my-sm">{{$t('ESnbmi2', [esp.nbmi])}}</div>
              <div class="titre-md q-my-sm">{{$t('PTopt' + (esp.opt ? 'o' : 'n'))}}</div>
            </div>
          </q-expansion-item>

          <q-expansion-item v-if="!esp.hTC" class="q-my-xs" 
            switch-toggle-side expand-separator dense header-class="tbp titre-md"
            :label="$t('PEstm1')" group="espaces2">
            <div class="q-ml-lg q-my-sm">
              <div class="row q-gutter-xs q-mb-md items-center">
                <div class="titre-md">{{$t('PEstm')}}</div>
                <btn-cond class="self-start b1" label="M" @ok="dlstat(esp, 0)"/>
                <btn-cond class="self-start b1" label="M-1" @ok="dlstat(esp, 1)"/>
                <btn-cond class="self-start b1" label="M-2" @ok="dlstat(esp, 2)"/>
                <btn-cond class="self-start b1" label="M-3" @ok="dlstat(esp, 3)"/>
              </div>
              <saisie-mois v-model="mois" :dmax="maxdl" :dmin="mindl(esp)" :dinit="maxdl"
                @ok="dlstat2(esp)" icon="download" :label="$t('ESdlc')"/>
            </div>
          </q-expansion-item>
        </div>
      </q-expansion-item>
    </div>

    <!-- Création d'un espace -->
    <q-dialog v-if="ui.d[idc]" v-model="ui.d[idc].PAcreationesp" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="tbs">
          <btn-cond icon="close" color="warning" @ok="cancelNS"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('ESne2')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <q-card-section class="q-pa-xs">
          <div class="row items-center full-width">
            <q-input class="col-6 q-pr-md" v-model="ns"
              :label="$t('ESns')" :hint="$t('ESnsh')" dense/>
            <div v-if="dns" class="col-6 text-negative bg-yellow-3 text-bold q-px-xs">{{dns}}</div>
          </div>
          <div class="row items-center full-width">
            <q-input class="col-6  q-pr-md" v-model="org"
              :label="$t('ESorg')" hint="monorg" dense/>
            <div v-if="dorg" class="col-6 text-negative bg-yellow-3 text-bold q-px-xs">{{dorg}}</div>
          </div>
          <div class="column justify-center q-mt-md">
            <phrase-contact declaration orgext="fake" @ok="okps" :disable="!org"/>
            <bouton-confirm class="q-my-lg maauto" :actif="ps !== null && !dns && !dorg" 
              :confirmer="creerNS"/>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Changement de la phrase de sponsoring du Comptable -->
    <q-dialog v-if="ui.d[idc]" v-model="ui.d[idc].PAnvspc" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="tbs">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('ENnpspc')}}</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="q-my-md q-mx-sm">
          <phrase-contact declaration :orgext="esp.org" @ok="okps" :disable="!org"/>
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="check" 
            :label="$t('valider')" :disable="!ps" @ok="nvspc"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Changement des quotas de l'espace -->
    <q-dialog v-if="ui.d[idc]" v-model="ui.d[idc].PAedprf" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="tbs">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('ESchg')}}</q-toolbar-title>
        </q-toolbar>
        <choix-quotas v-model="quotas"/>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="check" 
            :label="$t('valider')" :disable="quotas.err || !quotas.chg" @ok="valider"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
const $t = useI18n().t
const $q = useQuasar()

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import BoutonDlvat from '../components/BoutonDlvat.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import PhraseContact from '../components/PhraseContact.vue'
import SaisieMois from '../components/SaisieMois.vue'
import IconAlerte from '../components/IconAlerte.vue'
import QuotasVols from '../components/QuotasVols.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import { GetEspaces, CreationEspace, MajSponsEspace, SetEspaceQuotas, InitTachesGC, 
  DownloadStatC, DownloadStatC2, GetTaches, DelTache, GoTache } from '../app/operations4.mjs'
import { get } from '../app/net.mjs'
import { compile } from '../app/modele.mjs'
import { Cles, ID, AMJ, Tarif, UNITEN, UNITEV } from '../app/api.mjs'
import { styp, edvol, mon, nbn, dkli, afficherDiag, dhstring } from '../app/util.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const reg = /^([a-z0-9\-]+)$/

const OPNOMS = {
  1: 'DFH',
  2: 'DLV',
  3: 'TRA',
  4: 'VER',
  5: 'STA',
  7: 'FPU',
  21: 'GRM',
  22: 'AGN',
  24: 'AVC',
  25: 'ESP'
}

const session = stores.session
const fSt = stores.filtre
const cfg = stores.config
const lstEspB = ref([])

const lstEsp = computed(() => {
  const lst = []
  const f = fSt.filtre.admin
  const t = fSt.tri.admin
  for (const r of lstEspB.value) {
    if (f.org && r.org.indexOf(f.org) === -1) continue
    if (f.ns && r.ns !== f.ns) continue
    lst.push(r)
  }
  if (t === 1)
    lst.sort((a, b) => { return a.org < b.org ? -1 : (a.org === b.org ? 0 : 1)})
  else if (t === 2)
    lst.sort((a, b) => { return a.abot[0] > b.abot[0] ? -1 : (a.abot[0] === b.abot[0] ? 0 : 1)})
  else
    lst.sort((a, b) => { return a.ns > b.ns ? -1 : (a.ns === b.ns ? 0 : 1)})
  return lst
})

async function loadEsp () {
  const lst = []
  const rows = await new GetEspaces().run()
  if (rows) for (const row of rows) {
    const r = await compile(row)
    r.abot = Tarif.abo(r.quotas)
    lst.push(r)
  }
  lstEspB.value = lst
}

onMounted(async () => {
  await loadEsp()
})

const sty = computed(() => $q.dark.isActive ? 'sombre' : 'clair' )
const maxdl = computed(() => { 
  const m = AMJ.djMoisN(AMJ.amjUtc(), -1)
  return Math.floor(m / 100)
})

const abot = (idx) => lstEsp.value[idx].abot
const limc = (idx) => {
  const dlvat = lstEsp.value[idx].dlvat
  return !dlvat || dlvat === AMJ.max ? '' : Math.floor(dlvat / 100)
}

const gccode = ref('???')
const tab = ref('espaces')
const gcop = ref('')
const ns = ref('')
const nsc = ref('') // ns "courant" de PageEspace à ouvrir
const org = ref('')
const ps = ref(null)
const singl = ref(null)
const dns = ref($t('ESreq'))
const dorg = ref($t('ESreq'))
const quotas = ref(null)
const esp = ref(null)
const mois = ref(Math.floor(session.auj / 100))
const taches = ref([])
  
watch (ns, (ap, av) => {
  if (ap.length !== 1 || Cles.nsToInt(ap) === -1) { dns.value = $t('ESnsh'); return }
  if (aNS(ap)) { dns.value = $t('ESnum'); return }
  dns.value = ''
})
 
watch (org, (ap, av) => {
  if (ap.length < 4) { dorg.value = $t('ESorg1'); return }
  if (ap.length > 8) { dorg.value = $t('ESorg2'); return }
  if (!ap.match(reg)) { dorg.value = $t('ESorg3'); return }
  if (aOrg(ap)) { dorg.value = $t('ESorg4'); return }
  dorg.value = ''
})

function nvntf (ntf) {
  return ntf.nr === 1 ? 1 : (ntf.nr === 2 ? 4 : 6)
}

function ev0 (idx) { return mon(cfg.profils[idx][0]) }

function ev1 (idx) { 
  const n = cfg.profils[idx][1]
  return '[' + n + '] ' + nbn(n * UNITEN)
}

function ev2 (idx) { return edvol(cfg.profils[idx][2] * UNITEV) }

async function finDlv (tf) {
  if (tf) await loadEsp()
}

async function initGC () {
  const [nx, nc] = await new InitTachesGC().run()
  await afficherDiag($t('ESinitgc', [nx, nc]))
}

async function startDemon () {
  try {
    const res = await get('StartDemon', { code: gccode.value })
    await afficherDiag(new TextDecoder().decode(res))
  } catch (ex) {
    const s = ex.code === 7012 ? $t('EX7012') : ex.toString()
    await afficherDiag(s)
  }
}

function aNS (ns) {
  for (const e of lstEspB.value)
    if (e.ns === ns) return true
  return false
}

function aOrg (org) {
  for (const e of lstEsp.value)
    if (e.org === org) return true
  return false
}

function plusNS () {
  ui.oD('PAcreationesp', idc)
}

function cancelNS () {
  ns.value = 0
  ps.value = null
  ui.fD()
}

function okps (p) {
  if (p) p.phrase = null
  ps.value = p
}

function ovnspc (e) {
  esp.value = e
  ui.oD('PAnvspc', idc)
}

async function nvspc () {
  await new MajSponsEspace().run(esp.value.org, ps.value, esp.value.ns)
  ns.value = 0
  ps.value = null
  ui.fD()
  await loadEsp()
}

async function creerNS () {
  await new CreationEspace().run(org.value, ps.value, ns.value)
  ns.value = 0
  ps.value = null
  ui.fD()
  await loadEsp()
}

async function valider () {
  await new SetEspaceQuotas().run(esp.value.ns, quotas.value)
  ui.fD()
  await loadEsp()
}

function ovchgquotas (e) {
  esp.value = e
  const qm = cfg.quotasMaxE
  // minn, minv, maxn, maxv, minc, maxc, err
  quotas.value = { ...e.quotas, err: null, minn: 1, minv: 1, minc: 1, 
    maxn: qm[0], 
    maxv: qm[1], 
    maxc: qm[2]
  }
  ui.oD('PAedprf', idc)
}

async function dlstat (esp, mr) {
  const cleES = esp.cleES
  const { err, blob, creation, mois } = 
    await new DownloadStatC().run(esp.org, mr, cleES)
  const nf = esp.org + '-C_' + mois
  if (!err) {
    saveAs(blob, nf)
    await afficherDiag($t('PEsd', [nf]))
  } else {
    await afficherDiag($t('PEnd' + err))
  }
}

function mindl (esp) { 
  return Math.floor(esp.dcreation / 100)
}

async function dlstat2 (esp) {
  const cleES = esp.cleES
  const { err, blob } = await new DownloadStatC2()
    .run(esp.org, mois.value, 'C', cleES)
  const nf = esp.org + '-C_' + mois.value
  if (!err) {
    saveAs(blob, nf)
    await afficherDiag($t('PEsd', [nf]))
  } else {
    await afficherDiag($t('PEnd') + err)
  }
}

async function getTaches () {
  taches.value = await new GetTaches().run(ns.value)
}

async function tacheDel (t) {
  await new DelTache().run(t)
}

async function tacheGo (t) {
  await new GoTache().run(t)
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.w6
  with: 6rem
.bord
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 3px
.bord5
  border: 2px solid transparent
.bord6
  border: 2px solid $warning
.bord7
  border: 2px solid $primary
.b1
  min-width: 2.5rem !important
  padding: 0 5px
  color: white
  background: $primary
  cursor: pointer
  border-radius: 6px
  text-align: center
</style>
