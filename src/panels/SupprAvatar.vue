<template>
  <div v-if="s" class="q-pa-xs">

    <div v-if="s.ddel" class="row q-my-md items-start">
      <q-checkbox class="col-auto cb" size="sm" v-model="checks.ddel"/>
      <div class="col titre-md">{{$t('SAVddel')}}</div>
    </div>

    <div v-if="s.nna" class="q-my-md">
      <div class="row items-center">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks.nna"/>
        <div class="col titre-md">{{$t('SAVnna')}}</div>
      </div>
      <div class="q-ml-xl font-mono">{{$t('SAVnbvf', [s.nna, edvol(s.vfa)])}}</div>
    </div>

    <div v-if="s.ch.length" class="q-my-md">
      <div class="row items-center">
        <q-checkbox class="col-auto cb" v-model="checks.chats"/>
        <div class="titre-md">{{$t('SAVchats', s.ch.length, { count: s.ch.length })}}</div>
      </div>
      <div class="q-ml-xl row q-gutter-sm">
        <div v-for="c in s.ch" :key="c.pk" class="b1">{{session.getCV(c.idE).nomC}}</div>
      </div>
    </div>

    <div v-if="s.sp.length" class="q-my-md">
      <div class="row items-center">
        <q-checkbox class="col-auto cb" v-model="checks.spons"/>
        <div class="titre-md">{{$t('SAVspons', s.sp.length, { count: s.sp.length })}}</div>
      </div>
      <div class="q-ml-xl">
        <div class="b1 column">
          <div class="q-my-xs" v-for="x in s.sp" :key="x.ids">{{x.psp}}</div>
        </div>
      </div>
    </div>

    <div v-if="s.gr0.length" class="q-my-md">
      <div class="row items-center">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks.gr0"/>
        <div class="titre-md">{{$t('SAVgr0', s.gr0.length, { count: s.gr0.length })}}</div>
      </div>
      <div class="q-ml-xl">
        <div class="text-italic titre-sm q-mb-sm">{{$t('SAVnnp')}}</div>
        <div class="b1">
          <div class="row" v-for="x in s.gr0" :key="x.id">
            <div class="col-6 text-center">{{x.nomC}}</div>
            <div class="col-3 text-center font-mono">{{x.nnp}}</div>
            <div class="col-3 text-center font-mono">{{edvol(x.vfp)}}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="s.gr1.length" class="q-my-md">
      <div class="row items-center">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks.gr1"/>
        <div class="titre-md">{{$t('SAVgr1', s.gr1.length, { count: s.gr1.length })}}</div>
      </div>
      <div class="q-ml-xl">
        <div class="row g-gutter-sm" v-for="x in s.gr1" :key="x.id">{{x.nomC}}</div>
      </div>
    </div>

    <div v-if="s.gr2.length" class="q-my-md">
      <div class="row items-center">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks.gr2"/>
        <div class="titre-md">{{$t('SAVgr2', s.gr2.length, { count: s.gr2.length })}}</div>
      </div>
      <div class="q-ml-xl">
        <div class="row g-gutter-sm" v-for="x in s.gr2" :key="x.id">{{x.nomC}}</div>
      </div>
    </div>

    <div v-if="s.gr3.length" class="q-my-md">
      <div class="row items-center">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks.gr3"/>
        <div class="titre-md">{{$t('SAVgr3', s.gr3.length, { count: s.gr3.length })}}</div>
      </div>
      <div class="q-ml-xl">
        <div class="row g-gutter-sm" v-for="x in s.gr3" :key="x.id">{{x.nomC}}</div>
      </div>
    </div>

    <div v-if="avid !== '' && s.crp.length" class="q-my-md">
      <div class="row items-center">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks.ctc"/>
        <div class="titre-md">{{$t('SAVctc', s.crp.length, { count: s.crp.length })}}</div>
      </div>
      <div class="q-ml-xl">
        <div class="b2">
          <div class="row g-gutter-sm">
            <div v-for="x in s.crp" :key="x.id">{{x}}</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="avid !== '' && nbn" class="q-my-md">
      <div class="row items-center">
        <q-checkbox class="col-auto cb" size="sm" v-model="checks.vol"/>
        <div class="titre-md">{{$t('SAVvol')}}</div>        
      </div>
      <div class="q-ml-xl">
        <div v-if="s.nna" class="q-ml-md">{{$t('SAVvola', [s.nna, edvol(s.vfa)])}}</div>
        <div v-if="s.nnh" class="q-ml-md">{{$t('SAVvolg', [s.nnh, edvol(s.vfh)])}}</div>
        <div class="q-my-md">
          <div class="titre-md">{{$t('SAVabo')}}</div>
          <div class="q-mt-sm">{{$t('SAVabo1', [nbn, s.ch.length, s.ng, nbtot])}}</div>
          <div v-if="s.vftot" class="q-mt-sm">{{$t('SAVabo2', [edvol(vftot)])}}</div>
        </div>
      </div>
    </div>

    <q-separator color="orange" class="q-my-sm"/>

    <q-card-actions align="right" class="q-gutter-sm">
      <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
      <btn-cond color="warning" :disable="!checksOK" icon="delete" 
        :label="$t('supprimer')" @ok="actif = true"/>
      <bouton-confirm :actif="actif" :confirmer="valider"/>
    </q-card-actions>
    
    <q-separator color="orange" class="q-my-sm"/>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import { styp, edvol, sleep, dkli } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'
import { GetPartition, SupprAvatar, SupprCompte } from '../app/operations4.mjs'
import { deconnexion } from '../app/synchro.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const session = stores.session
const aSt = stores.avatar
const nSt = stores.note
const gSt = stores.groupe
const pSt = stores.people

const props = defineProps({ 
  avid: String
})

if (!props.avid && session.compte.idp)
  onMounted(async () => { await new GetPartition().run(session.compte.idp) })

const actif = ref(false)

const cv = computed(() => session.getCV(props.avid || session.compteId))

const checksOK = computed(() => { 
  for (const x in checks.value) {
    if (checks.value[x] === false && s.value.toCheck.has(x)) return false
  }
  return true 
})

const nbn = computed(() => s.value.nna + s.value.nnh)
const nbtot = computed(() => nbn.value + s.value.ch.length + s.value.ng)
const vftot = computed(() => s.value.vfa + s.value.vfh)

const checks = ref({ ddel: false, nna: false, chats: false, spons: false,
  gr0: false, gr1: false, gr2: false, gr3:false, vol: false, ctc: false })

const s = computed(() => { 
  const s = {
    toCheck: new Set(),

    stats: {}, // map des nbn notes, nn vf par avatar et groupe

    gr1: [], // liste des groupes où l'avatar est le dernier actif
    gr2: [], // liste des groupes dont l'avatar est hébergeur (mais pas dernier actif)
    gr3: [], // liste des groupes dont l'avatar est le dernier animateur (mais pas hébergeur ni le dernier actif)
    gr0: [], // liste des groupes ou l'avatar apparaît

    sp: [], // liste des sponsorings
    ch: [], // liste des chats

    nnp: 0, // nombre total de notes des groupes perdues
    vfp: 0, // vf total des fichiers des notes des groupes perdues
    crp: [], // noms des contacts réellement perdus

    nnh: 0, // nombre total de notes des groupes HEBERGES disparaissant
    vfh: 0, // vf total des fichiers des notes des groupes HEBERGES disparaissant

    nna: 0, // nombre total des notes de l'avatar
    vfa: 0, // vf total des fichiers des notes de l'avatar

    // résiliation compte
    ddel: false // dernier délégué de sa partition
  }

  const id = props.avid || session.compteId
  s.nnh = 0; s.vfh = 0; s.ng = 0
  s.stats = nSt.statsParRacine

  const a = s.stats[id]
  s.nna = a.nn
  s.vfa = a.vf
  if (s.nna) s.toCheck.add('nna')

  const e = aSt.getElt(id)

  e.chats.forEach(c => { if (c.stI === 1) s.ch.push(c) })
  if (s.ch.length) s.toCheck.add('chats')

  e.sponsorings.forEach(sp => { if (sp.st === 0) s.sp.push(sp) })
  if (s.sp.length) s.toCheck.add('spons')

  const grmbp = new Set() // groupes dont les membres POURRAIENT être perdus
  const ctcp = new Set() // contacts qui POURRAIENT être perdus

  for (const [idg, sav] of session.compte.mpg) {
    if (!sav.has(id)) continue
    const gr = gSt.egr(idg).groupe
    const im = gr.mmb.get(id)
    const { am, an, ctc } = gr.amanAvc
    const x = {
      nomC: session.getCV(gr.id).nomC,
      heb: (gr.imh === im),
      nnp: 0, // nombre de notes perdues
      vfp: 0  // vol. des fichiers des notes perdues
    }
    s.gr0.push(x)
    // contacts qui POURRAIENT être perdus
    if (am.has(im) && am.size === 1) {
      // seul AVC ayant accès aux membres
      grmbp.add(gr.id)
      ctc.forEach(id => { ctcp.add(id) })
    }
    // seul AVC ayant accès aux notes : nbr / vol. fic. des notes perdues
    if (an.has(im) && an.size === 1) { 
      x.nnp = gr.nn
      x.vfp = gr.vf 
    }
    
    let nan = 0, nac = 0, estAn = false, estAc = false
    for (let i = 1; i < gr.st.length; i++) {
      const s = gr.st[i]
      if (s === 5) { nan++; if (i === im) estAn = true }
      if (s >= 4) { nac++; if (i === im) estAc = true }
    }
    x.dan = nan === 1 && estAn
    x.dac = nac === 1 && estAc
    if (x.dac) {
      s.ng++
      if (x.heb) {
        s.nnh += gr.nn
        s.vfh += gr.vf
      }
    }

    if (props.avid && (s.nnh || s.ng || s.nna)) s.toCheck.add('vol')

    if (x.dac) s.gr1.push(x)
    else {
      if (x.heb) s.gr2.push(x)
      if (x.dan) s.gr3.push(x)
    }
  }
  if (s.gr0.length) s.toCheck.add('gr0')
  if (s.gr1.length) s.toCheck.add('gr1')
  if (s.gr2.length) s.toCheck.add('gr2')
  if (s.gr3.length) s.toCheck.add('gr3')

  // contacts réellement perdus
  for (const idc of ctcp) {
    const ep = pSt.map.get(idc)
    if (!ep || ep.del) continue // délégué: pas perdu
    // a un chat avec un autre avatar
    if (ep.sch.size > 1 || (ep.sch.size === 1 && !ep.sch.has(idc))) continue 
    let mgd = false// membre d'un groupe autre que ceux en disparition
    for(const idg of ep.sgr) if (!grmbp.has(idg)) { mgd = true; break }
    if (mgd) continue
    s.crp.push(session.getCV(idc).nomC)
  }
  if (s.crp.length) s.toCheck.add('ctc')

  if (props.avid === 0 && session.compte.idp) {
    const ndel = session.partition.nbDels
    if (ndel === 1 && session.compte.del) { 
      s.ddel = true
      s.toCheck.add('ddel')
    }
  }
  return s
})

/*
watch(s, (ap) => { 
  for (const x in ap.toCheck) checks.value[x] = false 
})
*/

async function valider () {
  ui.fD() // Dialogue de suppression
  if (props.avid) {
    const r = await new SupprAvatar().run(props.avid)
    if (r) await afficher8000(r, 0, props.avid)
  } else {
    const r = await new SupprCompte().run()
    if (r) await afficherDiag(this.$t('SAcptdisp'))
    await deconnexion()
  }
}
  
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-btn
  padding: 0 !important
.cb
  font-style: italic
  margin-right: 1rem
.b1, .b2
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 1px 3px
.b2
  min-height: 4rem
  max-height: 10rem
</style>
