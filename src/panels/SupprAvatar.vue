<template>
  <div v-if="s" class="q-pa-xs">

    <div v-if="s.ddel" class="row q-my-md items-start">
      <q-checkbox class="col-auto cb" size="sm" v-model="checks._ddel" :label="$t('vu')" />
      <div class="col titre-md">{{$t('SAVdspt')}}</div>
    </div>

    <div class="row q-my-md items-start">
      <q-checkbox class="col-auto cb" size="sm" v-model="checks._notes" :label="$t('vu')" />
      <div class="col">
        <div class="titre-md">{{$t('SAVnotes', nbn, { count: nbn })}}</div>
        <div v-if="nbn" class="q-my-sm q-ml-md">{{$t('SAVvlib', [edvol(vfn)])}}</div>
      </div>
    </div>

    <div class="row q-my-md items-start">
      <q-checkbox class="col-auto cb" v-model="checks._chats" :label="$t('vu')" />
      <div class="col">
        <div class="titre-md">{{$t('SAVchats', s.ch.length, { count: s.ch.length })}}</div>
        <div v-if="s.ch.length" class="q-ml-md">
          <span v-for="c in s.ch" :key="c.pk" class="q-my-sm q-mr-sm b1">
            {{session.getCV(c.idE).nomC}}</span>
        </div>
      </div>
    </div>

    <div v-if="s.sp.length" class="row q-my-md items-start">
      <q-checkbox class="col-auto cb" v-model="checks._spons" :label="$t('vu')" />
      <div class="col">
        <div class="titre-md">{{$t('SAVspons', s.sp.length, { count: s.sp.length })}}</div>
        <div class="q-ml-md">
          <span v-for="x in s.sp" :key="x.ids" class="q-my-sm q-mr-sm b1">{{x.psp}}</span>
        </div>
      </div>
    </div>

    <div v-if="s.gr1.length" class="row q-my-md items-start">
      <q-checkbox class="col-auto cb" size="sm" v-model="checks._gr1" :label="$t('vu')" />
      <div class="col column">
        <div class="titre-md">{{$t('SAVgr1', s.gr1.length, { count: s.gr1.length })}}</div>
        <div class="q-ml-md q-my-sm" v-for="x in s.gr1" :key="x.id">
          <span class="b1 q-mr-lg">{{x.nomC}}</span>
          <span>{{$t('SAVvlib1', x.nn, {count: x.nn})}}</span>
          <span class="q-ml-sm">{{$t('SAVvlib', [edvol(x.vf)])}}</span>
        </div>
      </div>
    </div>

    <div v-if="s.gr2.length" class="row q-my-md items-start">
      <q-checkbox class="col-auto cb" size="sm" v-model="checks._gr2" :label="$t('vu')" />
      <div class="col column">
        <div class="titre-md">{{$t('SAVgr2', s.gr2.length, { count: s.gr2.length })}}</div>
        <div class="q-ml-md q-my-sm" v-for="x in s.gr2" :key="x.id">
          <span class="b1 q-mr-lg">{{x.nomC}}</span>
          <span>{{$t('SAVvlib2', x.nn, {count: x.nn})}}</span>
          <span class="q-ml-sm">{{$t('SAVvlib3m', [edvol(x.vf)])}}</span>
        </div>
      </div>
    </div>

    <div v-if="s.gr3.length" class="row q-my-md items-start">
      <q-checkbox class="col-auto cb" size="sm" v-model="checks._gr3" :label="$t('vu')" />
      <div class="col column">
        <div class="titre-md">{{$t('SAVgr3', s.gr3.length, { count: s.gr3.length })}}</div>
        <div class="q-ml-md q-my-sm" v-for="x in s.gr3" :key="x.id">
          <span class="b1 q-mr-lg">{{x.nomC}}</span>
          <span>{{$t('SAVvlib2', x.nn, {count: x.nn})}}</span>
        </div>
      </div>
    </div>

    <div v-if="s.gr0.length" class="row q-my-md items-start">
      <q-checkbox class="col-auto cb" size="sm" v-model="checks._gr0" :label="$t('vu')" />
      <div class="col column">
        <div class="titre-md">{{$t('SAVgr0', s.gr0.length, { count: s.gr0.length })}}</div>
        <div class="q-ml-md q-my-sm" v-for="x in s.gr0" :key="x.id">
          <span class="b1 q-mr-lg">{{x.nomC}}</span>
          <span>{{$t('SAVvlib2', x.nn, {count: x.nn})}}</span>
        </div>
      </div>
    </div>

    <div v-if="avid !== 0" class="row q-my-md items-start">
      <q-checkbox class="col-auto cb" size="sm" v-model="checks._vol" :label="$t('vu')" />
      <div class="col">
        <div v-if="nbn" class="titre-md q-mb-sm">
          <div>{{$t('SAVvol')}}</div>        
          <div v-if="s.nna" class="q-ml-md">{{$t('SAVvola', [s.nna, edvol(s.vfa)])}}</div>
          <div v-if="s.nnh" class="q-ml-md">{{$t('SAVvolg', [s.nnh, edvol(s.vfh)])}}</div>
        </div>
        <div class="titre-md">
          <div>{{$t('SAVabo')}}</div>        
          <div class="q-ml-md">
            {{$t('SAVabo1', [nbn, s.ch.length, s.ng, nbtot])}}</div>
          <div v-if="s.vfa" class="q-ml-md">
            {{$t('SAVabo2', [edvol(s.vfa)])}}</div>
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

const props = defineProps({ 
  avid: String
})

if (!props.avid && session.compte.idp)
  onMounted(async () => { await new GetPartition().run(session.compte.idp) })

const actif = ref(false)

const checks = ref({ 
  _notes: false, _chats: false, _spons: false, _ddel: false, _vol: false,
  _gr0: false, _gr1: false, _gr2: false, _gr3: false, _gr4: false 
})

const cv = computed(() => session.getCV(props.avid || session.compteId))

const checksOK = computed(() => { 
  for (const x in s.value.checks) 
    if (s.value.checks[x] && !checks.value[x]) return false
  return true 
})
const nbn = computed(() => s.value.nna + s.value.nng)
const nbtot = computed(() => nbn.value + s.value.ch.length + s.value.ng)
const vfn = computed(() => s.value.vfa + s.value.vfg)

const s = computed(() => { 
  const s = {
    checks: { 
      _notes: false, _chats: false, _spons: false, _ddel: false, _vol: false,
      _gr0: false, _gr1: false, _gr2: false, _gr3: false 
    },
    stats: {}, // map des nbn notes, nn vf par avatar et groupe
    /* gri : { 
      heb, dan, dac : est hébergeur, dernier actif, dernier animateur
      nnh, vfh : si hébergeur, nombre de notes et volume des fichiers hébergés
      nn, vf : nombre de notes et volume des fichiers
      gr, im : groupe, indice membre  
    }
    */
    ng: 0, // nombres de groupes accédés
    gr1: [], // liste des groupes où l'avatar est le dernier actif
    gr2: [], // liste des groupes dont l'avatar est hébergeur (mais pas dernier actif)
    gr3: [], // liste des groupes dont l'avatar est le dernier animateur (mais pas hébergeur ni le dernier actif)
    gr0: [], // liste des autres groupes ou l'avatar apparaît

    sp: [], // liste des sponsorings
    ch: [], // liste des chats

    nng: 0, // nombre total de notes des groupes disparaissant
    vfg: 0, // vf total des fichiers des notes des groupes disparaissant

    nnh: 0, // nombre total de notes des groupes HEBERGES disparaissant
    vfh: 0, // vf total des fichiers des notes des groupes HEBERGES disparaissant

    nna: 0, // nombre total des notes de l'avatar
    vfa: 0, // vf total des fichiers des notes de l'avatar

    // résiliation compte
    ddel: false // dernier délégué de sa partition
  }

  const id = props.avid || session.compteId
  s.nng = 0; s.vfg = 0; s.ng = 0
  s.stats = nSt.statsParRacine

  const a = s.stats[id]
  s.nna = a.nn; s.vfa = a.vf

  const e = aSt.getElt(id)

  e.chats.forEach(c => { if (c.stI === 1) s.ch.push(c) })
  if (s.ch.length) s.checks._chats = true

  e.sponsorings.forEach(sp => { if (sp.st === 0) s.sp.push(sp) })
  if (s.sp.length) s.checks._spons = true

  for (const [idg, sav] of session.compte.mpg) {
    if (!sav.has(id)) continue
    s.ng++
    const gr = gSt.egr(idg).groupe
    const im = gr.mmb.get(id)
    const x = {
      nomC: session.getCV(gr.id).nomC,
      nn: gr.nn,
      vf: gr.vf,
      heb: false,
      nnh: 0,
      vfh: 0
    }
    if (gr.imh === im) { 
      x.heb = true
      x.nnh = x.nn
      x.vfh = x.vf
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
      s.nng += x.nn
      s.vfg += x.vf
    }
    if (x.heb) { 
      s.nnh += x.nn
      s.vfh += x.vf 
    } 
    
    x.st = x.dac ? 1 : (x.heb ? 2 : (x.dan ? 3 : 0))
    s['gr' + x.st] = x
  }

  if (s.nna + s.nng) s.checks._notes = true

  for (let i = 0; i < 4; i++) if (s['gr' + i].length) s.checks['_gr' + i] = true

  if (props.avid === 0 && session.compte.idp) {
    const ndel = session.partition.nbDels
    if (ndel === 1 && session.compte.del) { s.ddel = true; s.checks._ddel = true }
  }
  if (props.avid)  s.checks._vol = true // Abonnements - sans intéret si le compte est résilié

  return s
})

watch(s, () => { for (const x in checks.value) checks.value[x] = false })

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
  position: relative
  font-style: italic
  top: -0.5rem
  margin-right: 1rem
.b1
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 1px 3px
</style>
