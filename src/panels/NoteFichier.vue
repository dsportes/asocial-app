<template>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="tbs">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t(nSt.note.deGroupe ? 'PNOngr' : 'PNOnper', [nom])}}
      </q-toolbar-title>      
      <bouton-help page="dial_notefic"/>
    </q-toolbar>
    <q-toolbar v-if="ro" inset class="full-width msg">{{$t('PNOro')}} - {{$t(ro)}}</q-toolbar>
    <q-toolbar v-if="red" inset class="full-width msg">{{$t('PNOred')}} - {{red}}</q-toolbar>
    <q-toolbar v-if="!ro && vcpt === 1" inset class="full-width">{{$t('PNOcpt1')}}</q-toolbar>
    <q-toolbar v-if="!ro && vgr === 1" inset class="full-width">{{$t('PNOcpt1')}}</q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-xs column items-center">
      <q-expansion-item class="full-width q-my-xs" dense :label="$t('PNOapropos')" header-class="tbs">
        <div class="q-pa-sm">
          <node-parent />
          <q-separator class="q-my-sm" color="orange"/>
          <liste-auts class="q-my-sm"/>
        </div>
      </q-expansion-item>

      <div class="full-width tbs row justify-between items-center">
        <div class="col titre-md q-pa-xs">
          {{$t('PNOlstfic', note.mfa.size, {count: note.mfa.size}) + (note.mfa.size ? ' - ' + edvol(note.vf) : '')}}
        </div>
        <div v-if="!ro" class="col-auto row">
          <note-ecritepar2 v-if="groupe" :groupe="groupe" @ok="selAut"/>
          <btn-cond :disable="groupe && !aut" icon="add" :label="$t('PNFnvf')" 
            @ok="nouveau()"/>
        </div>
      </div>

      <div v-for="nom in note.lstNoms" :key="nom" class="full-width q-mb-sm">
        <div class="row justify-between full-width q-my-sm">
          <div class="col q-pr-md">
            <span class="text-bold titre-md">{{nom}}</span>
          </div>
          <btn-cond class="col-auto" :disable="groupe && !aut" icon="add" 
            :label="$t('PNFnvr')" @ok="nouveau(nom)"/>
        </div>
        <div v-for="e in mpn.get(nom)" :key="e.f.idf" class="q-ml-lg q-my-xs">
          <div class="row justify-between full-width items-center">
            <div class="col-6 row q-gutter-xs">
              <span v-if="e.f.info" class="font-mono">{{e.f.info}}</span>
              <span class="font-mono">#{{e.f.idf}}</span>
              <span>{{e.f.type}}</span>
              <span>{{edvol(e.f.lg)}}</span>
            </div>
            <div class="col-4 font-mono fs-sm text-center">{{dhcool(e.f.dh, true)}}</div>
            <div class="col-2 row q-gutter-xs justify-end">
              <q-icon v-if="mpn.get(nom)[0].fa.avn && mpn.get(nom)[0].f.idf === e.f.idf" 
                name="airplanemode_active" size="sm" color="warning"/>
              <q-icon v-if="e.fa.av" name="airplanemode_active" size="sm" color="primary"/>
              <menu-fichier :idf="e.f.idf" class="self-start"
                :aut="ro ? '0' : (estGr ? aut : '1')" :note="note"/>
            </div>
          </div>
        </div>
        <q-separator color="orange" size="2px" class="q-mt-xs q-mb-sm"/>
      </div>
    </q-page>
  </q-page-container>

  <!-- Dialogue de création d'un nouveau fichier -->
  <q-dialog v-model="ui.d[idc].NFouvrir" persistent>
    <nouveau-fichier :note="note" :nom="nomf || ''" 
      :aut="ro ? '0' : (estGr ? aut : '1')" :pasheb="pasHeb" :ro="ro"/>
  </q-dialog>

</q-layout>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { styp, dkli, edvol, dhcool, suffixe } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import NouveauFichier from '../dialogues/NouveauFichier.vue'
import MenuFichier from '../components/MenuFichier.vue'
import NoteEcritepar2 from '../components/NoteEcritepar2.vue'
import BtnCond from '../components/BtnCond.vue'
import { Note } from '../app/modele.mjs'
import ListeAuts from '../components/ListeAuts.vue'
import NodeParent from '../components/NodeParent.vue'
import { ID } from '../app/api.mjs'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const session = stores.session
const nSt = stores.note 
const pSt = stores.people 
const gSt = stores.groupe
const faSt = stores.ficav

const texte = ref('')
const aut = ref(null)
const nomf = ref('')

const note = computed(() => nSt.note)
const nom = computed(() => pSt.nom(note.value.id))
const modifie = computed(() => false)

const estGr = computed(() => ID.estGroupe(note.value.id))
const egr = computed(() => estGr.value ? gSt.egr(note.value.id) : null)
const groupe = computed(() => egr.value ? egr.value.groupe : null)

// % quota de vf groupe - 0 = ok 1 =90% 2 =>100% (RED)
const vgr = computed(() => !groupe.value ? 0 : groupe.value.Gr(0))

// volume fichier du compte (si hébergeur pour un groupe)
const vcpt = computed(() => !groupe.value || (groupe.value && !groupe.value.cptEstHeb) ? 0 : session.session.alVolCpt(0))

const pasHeb = computed(() => groupe.value && !groupe.value.imh)

const ro = computed(() => {
  if (session.cEdit) return session.cEdit + 'N'
  if (nSt.diagEd) return nSt.diagEd
  return ''
})

const red = computed(() => !ro.value && (pasHeb.value ? $t('PNOpasheb') :
  (vcpt.value === 2 ? $t('PNOvcpt2') : (vgr.value === 2 ? $t('PNOvgr2') : false))))

const mpn = computed(() => {
  const m = new Map()
  for(const nom of note.value.lstNoms) {
    const l = []
    const lx = note.value.fnom.get(nom)
    for(const f of lx) {
      const fa = faSt.map.get(f.idf)
      l.push({f, fa: fa || { fake: true }})
    }
    m.set(nom, l)
  }
  return m
})

function fermer () { if (modifie.value) ui.oD('confirmFerm', 'a'); else ui.fD() }

function selAut (elt) { aut.value = elt.id }

async function nouveau (nf) {
  nomf.value = nf || ''
  ui.oD('NFouvrir', idc)
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
.info
  max-height: 1.6rem !important
  overflow: hidden
</style>
