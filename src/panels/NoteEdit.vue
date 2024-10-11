<template>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="fermer"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t(note.deGroupe ? 'PNOngr' : 'PNOnper', [nom])}}
      </q-toolbar-title>
      <btn-cond icon="check" :label="$t('valider')" cond="cEdit"
        :disable="(note.deGroupe && !aut) || !modifie"  @ok="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="session.cEdit" inset class="full-width msg">{{session.cEdit}}</q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-xs">
      <node-parent />

      <q-separator class="q-my-sm" color="orange"/>

      <div v-if="note.deGroupe">
        <liste-auts class="q-my-sm"/>

        <note-ecritepar :note="nSt.note" @ok="selNa"/>

        <div v-if="xav">
          <div class="text-italic titre-md text-bold">{{$t('PNOext2')}}</div>
          <apercu-genx class="q-my-md" :id="xav.id" :im="xav.im"/>
        </div>
        <div v-else class="text-italic titre-md text-bold">{{$t('PNOext1')}}</div>

      </div>

      <editeur-md class="col" :texte="nSt.note.texte" mh="50vh"
        :lgmax="cfg.maxlgtextesecret" 
        :editable="(!note.estGroupe || (note.estGroupe && naAut)) && !session.cEdit"
        modetxt v-model="texte"/>

    </q-page>
  </q-page-container>
</q-layout>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { styp } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { MajNote } from '../app/operations4.mjs'
import EditeurMd from '../components/EditeurMd.vue'
import ListeAuts from '../components/ListeAuts.vue'
import NoteEcritepar from '../components/NoteEcritepar.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import NodeParent from '../components/NodeParent.vue'
import BtnCond from '../components/BtnCond.vue'

const session = stores.session
const nSt = stores.note
const gSt = stores.groupe
const pSt = stores.people
const cfg = stores.config
const ui = stores.ui
const node = ref(nSt.node)
const note = ref(nSt.note)

const texte = ref('')
const aut = ref(null)

const modifie = computed(() => note.value.texte !== texte.value)
const idas = computed(() => Note.idasEdit(node.value))
const nom = computed(() => pSt.nom(note.value.id))
const xav = computed(() => nSt.mbExclu) // retourne { avc: true/false, ida, im, cv } ou null s'il n'y a pas d'exclusivité

function fermer () { 
  if (modifie.value) ui.oD('confirmFerm', 'a')
  else ui.fD() 
}

async function valider () {
  const n = note.value
  const aut = !note.value.deGroupe ? 0 : aut.value.id
  await new MajNote().run(n.id, n.ids, aut, texte.value)
  ui.fD()
}

function selNa (e) { // e : { nom, i, ko, im, id }
  aut.value = e 
} 

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
