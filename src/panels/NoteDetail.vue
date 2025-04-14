<template>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="tbs">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="fermer"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t(note.deGroupe ? 'PNOngr' : 'PNOnper', [nom])}}
      </q-toolbar-title>
      <btn-cond color="warning" icon="delete" :disable="session.cEdit !== '' || nSt.diagEd !== ''"
        :label="$t('PNOsupp')" @ok="ui.oD('confirmSuppr', idc)"/>
      <bouton-help page="dial_notemaj"/>
    </q-toolbar>
    <q-toolbar v-if="ro" inset>
      <div class="msg">{{$t('PNOmaj', [$t(session.cEdit || nSt.diagEd)])}}</div>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-xs">
      <div style="margin-top:53vh">
        <div class="q-mb-sm row">
           <node-parent />
          <span class="text-italic q-mx-md">{{$t('PNOdate')}}</span>
          <span class="font-mono text-bold">{{dhcool(note.d)}}</span>
        </div>

        <div v-if="note.deGroupe" class="q-my-sm">
          <liste-auts class="q-my-sm"/>

          <note-ecritepar2 class="q-my-sm" :note="note" @ok="selNa"/>

          <!-- exclusivité d'écriture -->
          <div class="q-my-md">
            <div class="row justify-between items-start">
              <div v-if="xav" class="text-italic titre-md text-bold">{{$t('PNOext2')}}</div>
              <div v-else class="text-italic titre-md text-bold">{{$t('PNOext1')}}</div>
              <btn-cond class="col-auto self-start" round icon="person" @ok="ovNX">
                <q-tooltip>{{$t('PNOexclu3')}}</q-tooltip>
              </btn-cond>
            </div>
            <apercu-genx v-if="xav" :id="xav.ida" :im="xav.im" class="spsm bord1"/>
          </div>

        </div>

        <!-- hashtags -->
        <div class="q-my-sm row justify-between"> 
          <div class="col row q-gutter-xs">
            <span class="text-italic">{{$t('hashtags')}} : </span>
            <span v-for="ht of note.tousHt" :key="ht">{{ht}}</span>
          </div>
          <btn-cond class="col-auto self-start" round icon="edit" @ok="ovHT"/>
        </div>

        <!-- fichiers -->
        <div class="q-my-sm row justify-between">  
          <div class="col titre-sm">
            <span :class="!note.mfa.size ? 'text-italic': ''">
              {{$t('PNOnf', note.mfa.size, {count: note.mfa.size})}}
            </span>
            <span class="q-ml-xs">{{note.mfa.size ? (edvol(note.vf) + '.') : ''}}</span>
          </div>
          <btn-cond class="col-auto self-start" round icon="attach_file" @ok="ovNF">
            <q-tooltip>{{$t('PNOattach')}}</q-tooltip>
          </btn-cond>
        </div>
      </div>
    </q-page>

    <q-page-sticky expand position="top">
      <editeur-md class="col" mh="50vh"
        :texte="note.texte" 
        :lgmax="cfg.maxlgtextesecret" 
        :editable="!ro"
        v-model="texte">
        <btn-cond icon="check" :label="$t('ok')" cond="cEdit" color="warning"
          :disable="(note.deGroupe && !aut) || !modifie || !texte.length" 
          @ok="valider"/>
      </editeur-md>
    </q-page-sticky>
  </q-page-container>

  <!-- Gestion de l'exclusivité de la note -->
  <q-dialog v-model="ui.d[idc].NX" position="left" persistent>
    <note-exclu/>
  </q-dialog>

  <!-- Gestion des fichiers attachés à la note -->
  <q-dialog v-model="ui.d[idc].NF" position="left" persistent>
    <note-fichier/>
  </q-dialog>

  <!-- Mise à jour des hashtags de la note -->
  <q-dialog v-model="ui.d[idc].NM" persistent>
    <div :class="styp('md')">
      <q-toolbar class="btbs">
        <btn-cond color="warning" icon="chevron_left" @ok="fermer"/>
        <q-toolbar-title class="titre-lg full-width text-center">
          {{$t('PNOht0')}}
        </q-toolbar-title>
        <btn-cond icon="check" :label="$t('ok')" cond="cEdit"
          :disable="!modifht"  @ok="validerHt"/>
        <bouton-help page="dial_noteht"/>
      </q-toolbar>
    
      <hash-tags v-model="ht" :src="note.ht" :titre="$t('PNOht1')"/>

      <hash-tags v-if="note.deGroupe && estAnim" v-model="htg" :src="note.htg" :titre="$t('PNOht2')"/>

      <q-card v-if="note.deGroupe && !estAnim">
        <div v-if="note.htg.size" class="row q-gutter-xs q-ma-sm">
          <span class="text-italic">{{$t('PNOht2')}} : </span>
          <span v-for="ht of note.htg" :key="ht">{{ht}}</span>
        </div>
        <div v-else class="text-italic">{{$t('PNOht3')}}</div>
      </q-card>
    </div>
  </q-dialog>

  <!-- Confirmation de la suppression d'une note -->
  <q-dialog v-model="ui.d[idc].confirmSuppr" persistent>
    <q-card :class="styp('sm')">
      <q-toolbar class="tbs">
        <btn-cond color="warning" icon="close" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg full-width text-center">
          {{$t('NCFsuppr')}}
        </q-toolbar-title>
      </q-toolbar>
      <div class="q-my-md row justify-center items-center q-gutter-md">
        <btn-cond icon="undo" flat :label="$t('renoncer')" @ok="ui.fD"/>
        <bouton-confirm actif :confirmer="noteSuppr"/>
      </div>
    </q-card>
  </q-dialog>

</q-layout>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { styp, edvol, dhcool, afficherDiag, $t, egaliteSet } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import { MajNote, HTNote, SupprNote } from '../app/operations4.mjs'
import EditeurMd from '../components/EditeurMd.vue'
import ListeAuts from '../components/ListeAuts.vue'
import HashTags from '../components/HashTags.vue'
import NoteExclu from '../panels/NoteExclu.vue'
import NoteFichier from '../panels/NoteFichier.vue'
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
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const node = ref(nSt.node)
const note = computed(() => nSt.note)

const texte = ref(note.value.texte)
const aut = ref(null)

const ht = ref(new Set())
const htg = ref(new Set ())

const modifie = computed(() => note.value.texte !== texte.value)
const idas = computed(() => Note.idasEdit(node.value))
const nom = computed(() => pSt.nom(note.value.id))
// retourne { avc: true/false, ida, im, cv } ou null s'il n'y a pas d'exclusivité
const xav = computed(() => nSt.mbExclu)

const estAnim = computed(() => { const e = note.value ? gSt.egr(note.value.id) : null; return e && e.estAnim })

const ro = computed(() => session.cEdit !== '' || nSt.diagEd !== '')

const modifht = computed(() => { 
  return !egaliteSet(note.value.ht, ht.value) || (estAnim.value && !egaliteSet(note.value.htg, htg.value))
})

function fermer () { 
  if (modifie.value) ui.oD('confirmFerm', 'a')
  else ui.fD() 
}

async function valider () {
  const n = note.value
  const autx = !note.value.deGroupe ? 0 : aut.value.id
  await new MajNote().run(n.id, n.ids, autx, texte.value)
}

function selNa (e) { // e : { nom, i, ko, im, id }
  aut.value = e 
}

async function noteSuppr () {
  ui.fD()
  await new SupprNote().run()
}

async function ovNX () {
  if (session.cEdit) { await afficherDiag($t(session.cEdit)); return }
  ui.oD('NX', idc)
}

async function ovNF () {
  ui.oD('NF', idc)
}

async function ovHT () {
  if (session.cEdit) { await afficherDiag($t(session.cEdit)); return }
  ht.value.clear()
  htg.value.clear()
  note.value.ht.forEach(t => { ht.value.add(t)})
  note.value.htg.forEach(t => { htg.value.add(t)})
  ui.oD('NM', idc)
}

const s2Str = (s) => Array.from(s).sort().join(' ')

async function validerHt () {
  await new HTNote().run(note.value, s2Str(ht.value), 
    note.value.deGroupe ? s2Str(htg.value) : null)
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 8px
</style>
