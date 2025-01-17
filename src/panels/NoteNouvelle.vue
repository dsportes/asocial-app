<template>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="tbs">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="fermer"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t(estgr ? 'PNOnvtit2' : 'PNOnvtit1', [nom])}}
      </q-toolbar-title>
      <btn-cond icon="check" :label="$t('valider')" cond="cEdit"
        :disable="err || (estgr && !naAut) || !texte" @ok="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="session.cEdit" inset class="msg">{{$t(session.cEdit)}}</q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-xs">

      <div v-if="notep" class="q-ma-xs q-pa-xs bord1">
        <div class="titre-md">
          <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
          <span v-if="ID.estGroupe(notep.id)">{{$t('PNOrgr', [nomp])}}</span>
          <span v-else>{{$t('PNOrav', [nomp])}}</span>
        </div>
        <div class="q-ml-sm text-italic">{{notep.titre}}</div>
      </div>

      <div v-if="!estgr && nSt.node.type === 2" class="q-ma-xs q-pa-xs bord1 titre-md">
        <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
        <span>{{$t('PNOracgr', [nSt.cvNode.nomC])}}</span>
      </div>

      <div v-if="err" class="msg">{{$t('PNOer' + err)}}</div>

      <note-ecritepar2 v-if="estgr" :groupe="groupe" @ok="selNa"/>

      <div v-if="!err && !session.cEdit && (!estgr || (estgr && naAut))" class="column spmd">
        <editeur-md mh="50vh" class="col" texte="" :placeholder="$t('PNOdeft')"
          :lgmax="cfg.maxlgtextesecret" editable modetxt v-model="texte"/>
        <q-separator color="orange" class="q-mt-sm"/>

        <div v-if="estgr" class="col-auto q-mt-sm row">
          <bouton-undo :cond="exclu===true" @click="exclu=false"/>
          <q-toggle class=" titre-md" v-model="exclu" :label="$t('PNOex')" />
        </div>

      </div>

    </q-page>
  </q-page-container>
</q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'

import stores from '../stores/stores.mjs'
import { dkli, styp } from '../app/util.mjs'
import { ID, UNITEN } from '../app/api.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonUndo from '../components/BoutonUndo.vue'
import EditeurMd from '../components/EditeurMd.vue'
import BtnCond from '../components/BtnCond.vue'
import { NouvelleNote } from '../app/operations4.mjs'
import NoteEcritepar2 from '../components/NoteEcritepar2.vue'

const ui = stores.ui
const session = stores.session
const nSt = stores.note
const cfg = stores.config

const props = defineProps({
  estgr: Boolean, // note de groupe à créer
  groupe: Object, // si estgr, le groupe
  avatar: Object, // si !estgr, l'avatar
  notep: Object // si sous-note, la note "parent" (en fait celle courante)
})

const naAut = ref(null) // {nom, i, im, ida, ko} ko: 1 pas auteur, 2: n'a pas exclusiité (edition seulement) 
const texte = ref('')
const exclu = ref(false)

const id = computed(() => props.estgr ? props.groupe.id : props.avatar.id )
const modifie = computed(() => texte.value !== '')
const nom = computed(() => { const cv = session.getCV(id.value); return props.estgr ? cv.nomC : cv.nom })
const nomp = computed(() => { if (!props.notep) return ''
  const cv = session.getCV(props.notep.id); return ID.estGroupe(props.notep.id) ? cv.nomC : cv.nom 
})
const err = computed(() => {
  if (!props.estgr) {
    if (session.compte.qv.pcn >= 100) return 1 // excédent nn + nc + ng / q1
  } else {
    if (!props.groupe.imh) return 3 // pas d'hébergeur
    else if (props.groupe.nn >= (props.groupe.qn * UNITEN)) return 2 // nb max se notes du groupe dépassé
  }
  return 0
})

function fermer () { if (modifie.value) ui.oD('confirmFerm', 'a'); else ui.fD() }

function selNa (elt) { naAut.value = elt }

async function valider () {
  let pid = null, pids = null
  const aut = props.estgr ? naAut.value.id : null

  // note rattachée à une autre note OU note avatar rattachée à une racine de groupe
  if (!props.estgr) { // Note avatar
    const nd = nSt.node
    if (nd.type === 2) pid = nd.id // rattachée à une racine de groupe
    else if (props.notep) { pid = props.notep.id; pids = props.notep.ids } // rattachée à une note d'un groupe ou de l'avatar
  } else if (props.notep) { pid = props.notep.id; pids = props.notep.ids } // Note de groupe rattachée

  await new NouvelleNote().run(id.value, texte.value, aut, exclu.value, pid, pids)
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
.bord2
  border: 2px solid $orange
  border-radius: 5px
.lg1
  width: 20rem
.lg2
  width: 35rem
.dec
  position: relative
  left: -7px
.mh
  max-height: 3.2rem
</style>
