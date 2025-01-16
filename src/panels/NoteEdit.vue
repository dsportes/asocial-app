<template>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="tbs">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="fermer"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t(note.deGroupe ? 'PNOngr' : 'PNOnper', [nom])}}
      </q-toolbar-title>
      <btn-cond icon="check" :label="$t('valider')" cond="cEdit"
        :disable="(note.deGroupe && !aut) || !modifie"  @ok="valider"/>
      <bouton-help page="note_edit"/>
    </q-toolbar>
    <q-toolbar v-if="session.cEdit" inset class="full-width msg">{{session.cEdit}}</q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-xs">
      <node-parent />

      <q-separator class="q-my-sm" color="orange"/>

      <div v-if="note.deGroupe">
        <liste-auts class="q-my-md"/>

        <note-ecritepar2 class="q-my-md" :note="nSt.note" @ok="selNa"/>

        <div v-if="xav" class="q-my-md">
          <div class="text-italic titre-md text-bold">{{$t('PNOext2')}}</div>
          <apercu-genx :id="xav.ida" :im="xav.im"/>
        </div>
        <div v-else class="text-italic titre-md text-bold">{{$t('PNOext1')}}</div>

      </div>

      <editeur-md class="col" :texte="note.texte" mh="50vh"
        :lgmax="cfg.maxlgtextesecret" 
        :editable="editable"
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
import NoteEcritepar2 from '../components/NoteEcritepar2.vue'
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

const texte = ref(note.value.texte)
const aut = ref(null)

const editable = computed(() => (!note.value.estGroupe || (note.value.estGroupe && aut.value)) && !session.cEdit)
const modifie = computed(() => note.value.texte !== texte.value)
const idas = computed(() => Note.idasEdit(node.value))
const nom = computed(() => pSt.nom(note.value.id))
// retourne { avc: true/false, ida, im, cv } ou null s'il n'y a pas d'exclusivité
const xav = computed(() => nSt.mbExclu)

function fermer () { 
  if (modifie.value) ui.oD('confirmFerm', 'a')
  else ui.fD() 
}

async function valider () {
  const n = note.value
  const autx = !note.value.deGroupe ? 0 : aut.value.id
  await new MajNote().run(n.id, n.ids, autx, texte.value)
  ui.fD()
}

function selNa (e) { // e : { nom, i, ko, im, id }
  aut.value = e 
} 

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
