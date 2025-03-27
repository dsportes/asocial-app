<template>
<q-dialog v-model="ui.d.a.pressepapier" full-height position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated class="tbs">
      <q-toolbar>
        <btn-cond icon="chevron_left" color="warning" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg">{{$t('MLApp')}}</q-toolbar-title>
        <bouton-help page="page_login_pp"/>
      </q-toolbar>
      <q-tabs class="titre-md" v-model="ppSt.tab" inline-label align="center" no-caps dense>
        <q-tab name="notes" :label="$t('PPnotes')" />
        <q-tab name="fichiers" :label="$t('PPfic')"/>
      </q-tabs>
    </q-header>

    <q-page-container>

    <div v-if="ppSt.tab==='notes'" class="q-pa-sm">
      <btn-cond icon="add" flat color="primary" :label="$t('PPano')" @ok="ajouternote"/>
      <div v-if="!ppSt.lstn.length" class="titre-lg text-italic">{{$t('PPnno')}}</div>
      <div v-else>
        <div v-for="(rec, idx) in ppSt.lstn" :key="rec.id" :class="'q-my-sm zone ' + dkli(idx)">
          <div class="row q-mb-xs justify-between items-center">
            <div class="fs-md font-mono">{{dhcool(rec.dh)}}
              <span class="q-ml-md fs-sm font-mono">#{{rec.id}}</span>
            </div>
            <btn-cond round icon="delete" color="warning" @ok="supprn(rec)"/>
          </div>
          <show-html class="bord1" :idx="idx" :texte="rec.txt" maxh="4rem" zoom edit @edit="editernote(rec)"/>
        </div>
      </div>
    </div>

    <div v-if="ppSt.tab==='fichiers'" class="q-pa-sm">
      <btn-cond icon="add" flat color="primary" :label="$t('PPafi')" @ok="ajouterfichier"/>
      <div v-if="!ppSt.lstf.length" class="titre-lg text-italic">{{$t('PPnfi')}}</div>
      <div v-else>
        <div v-for="(fic, idx) in ppSt.lstf" :key="fic.idf" :class="'q-my-sm zone ' + dkli(idx)">
          <div class="row justify-between items-center">
            <div class="fs-md font-mono">
              <span class="text-bold q-mr-md">{{fic.nom}}</span>
              <span>{{dhcool(fic.dh)}}</span>
              <span class="q-ml-md fs-sm font-mono">#{{fic.idf}}</span>
            </div>
            <div class="col-auto row">
              <div class="col-auto fs-md font-mono q-mr-sm">{{fic.type}}</div>
              <div class="col-auto fs-md font-mono">{{edvol(fic.lg)}}</div>
            </div>
          </div>
          <div class="q-mx-md fs-md text-italic">{{fic.info || $t('PPnoi')}}</div>
          <div class="q-mb-lg row items-center justify-end q-gutter-sm">
            <btn-cond v-if="!ppSt.modecc" class="col-auto" :label="$t('afficher')" @ok="affFic(fic)"
              icon="open_in_new"/>
            <btn-cond v-if="!ppSt.modecc" class="col-auto" :label="$t('enreg')" @ok="enregFic(fic)"
              icon="save"/>
            <btn-cond v-if="ppSt.modecc" class="col-auto" :label="$t('copier')" @ok="selFic(fic)"
              icon="content_copy"/>
            <btn-cond v-if="!ppSt.modecc" @ok="editerfichier(fic)"
              round icon="mode_edit" color="primary"/>
            <btn-cond v-if="!ppSt.modecc" @ok="supprfichier(fic)"
              round icon="delete" color="warning"/>
          </div>
        </div>
      </div>
    </div>

    <div class="filler"/>

    <!-- Dialogue d'édition du contenu d'une note -->
    <q-dialog v-model="ui.d[idc].PPnvnote" persistent>
      <q-card :class="styp('md')">
        <q-card-section>
          <div class="titre-lg">{{$t(rec ? 'PPnv1' : 'PPnv2')}}</div>
          <editeur-md mh="16rem" v-model="txt" :texte="rec ? rec.txt : ''" editable modetxt :lgmax="lgmax"/>
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="check"
            :label="$t('valider')" :disable="!txt || (rec && txt === rec.txt)" @ok="majnote"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'ajout d'un nouveau fichier -->
    <q-dialog v-model="ui.d[idc].PPnvfic" persistent>
      <q-card :class="styp('md')">
      <q-card-section>
        <div class="titre-lg">{{$t(fic.idf ? 'PPl1' : 'PPl2')}}</div>
        <q-file class="full-width" v-model="fileList" :label="$t('PPl3')"
          max-file-size="50000000" max-file="1"/>
        <div v-if="fic.lg" class="font-mono fs-sm">{{fic.nom}} - {{fic.type}} - {{fic.lg}}o</div>
        <nom-generique class="q-mt-md fs-md" v-model="nomfic" :label="$t('PPndf')"
          :lgmax="max1" :placeholder="$t('PPphf')"/>
        <nom-generique class="q-mt-md fs-md" v-model="info" :label="$t('PPapf')"
          :lgmax="max2" :placeholder="$t('PPphf')"/>
      </q-card-section>
      <q-card-actions align="right" class="q-gutter-sm">
        <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
        <btn-cond v-if="fic.idf" icon="check" :label="$t('PPmaj')"
          :disable="!valide" @ok="majfic(true)"/>
        <btn-cond icon="add" :label="$t('PPajo')"
          :disable="!valide" @ok="majfic(false)"/>
      </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de confirmation de suppression d'une note -->
    <q-dialog v-model="ui.d[idc].PPsupprnote" persistent>
      <q-card :class="styp('sm')">
        <q-card-section class="column items-center q-my-md">
          <div class="titre-md text-center text-italic">{{$t('PPsuppn')}}</div>
          <div class="q-mt-sm fs-md font-mono text-bold">{{rec.titre}}</div>
        </q-card-section>
        <q-card-actions align="right"  class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')"  @ok="ui.fD"/>
          <btn-cond color="warning" icon="delete" :label="$t('confirmer')" @ok="cfSupprnote" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue de confirmation de suppression d'un fichier -->
    <q-dialog v-model="ui.d[idc].PPsupprfic" persistent>
      <q-card :class="styp('sm')">
        <q-card-section class="column items-center q-my-md">
          <div class="titre-md text-center text-italic">{{$t('PPsuppf')}}</div>
          <div class="q-mt-sm fs-md font-mono text-bold">{{fic.titre}}</div>
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="delete" :label="$t('confirmer')" @ok="cfSupprfic" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    </q-page-container>

  </q-layout>
</q-dialog>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

import { saveAs } from 'file-saver'
import stores from '../stores/stores.mjs'
import ShowHtml from '../components/ShowHtml.vue'
import { $t, readFile, dhcool, edvol, afficherDiag, dkli, styp, interdits, regInt } from '../app/util.mjs'
import EditeurMd from '../components/EditeurMd.vue'
import { idb } from '../app/db.mjs'
import NomGenerique from '../components/NomGenerique.vue'
import BtnCond from '../components/BtnCond.vue'
import BoutonHelp from '../components/BoutonHelp.vue'

const session = stores.session
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const ppSt = stores.pp
const cfg = stores.config
const lgmax = cfg.maxlgtextenote

const info = ref('')
const nomfic = ref('')
const rec = ref(null)
const txt = ref('')
const min = ref(4)
const max1 = ref(32)
const max2 = ref(16)
const fileList = ref()
const fic = ref({ nom: '', info: '', lg: 0, type: '', u8: null })

const valide = computed(() => fic.value.lg && nomfic.value)

watch(fileList, async (file) => {
  if (file) {
    const { size, name, type, u8 } = await readFile(file, true)
    const idf = fic.value && fic.value.idf ? fic.value.idf : ''
    fic.value = {idf, nom: name, lg: size, type, u8 }
  }
})

watch(fic, (ap) => {
  nomfic.value = ap.nom || ''
  info.value = ''
  fileList.value = null
})

function ajouternote () {
  rec.value = null
  txt.value = ''
  ui.oD('PPnvnote', idc)
}

function editernote (rex) {
  rec.value = rex
  txt.value = ''
  ui.oD('PPnvnote', idc)
}

function supprn (rex) {
  rec.value = rex
  ui.oD('PPsupprnote', idc)
}

async function cfSupprnote () {
  await idb.NLdel(rec.value.id)
  ui.fD()
}

async function majnote () {
  await idb.NLset(txt.value, rec.value ? rec.value.id : 0)
  ui.fD()
}

async function majfic (maj) {
  const f = fic.value
  await idb.FLset(maj ? f.idf : '', nomfic.value, info.value, f.type, f.u8)
  ui.fD()
}

function ajouterfichier () {
  fic.value = { nom: '', info: '', lg: 0, type: '', u8: null }
  ui.oD('PPnvfic', idc)
}

async function editerfichier (fix) {
  info.value = fix.info
  nomfic.value = fix.nom
  const u8 = await fix.getU8()
  fic.value = { idf: fix.idf, nom: fix.nom, info: fix.info, 
    lg: fix.lg, type: fix.type, u8 }
  ui.oD('PPnvfic', idc)
}

function supprfichier (fix) {
  fic.value = fix
  ui.oD('PPsupprfic', idc)
}

async function cfSupprfic () {
  await idb.FLdel(fic.value.idf)
  ui.fD()
}

async function blobde (f, b) {
  const buf = await f.getU8()
  if (!buf || !buf.length) return null
  const blob = new Blob([buf], { type: f.type })
  return b ? blob : URL.createObjectURL(blob)
}

async function selFic (fx) {
  const u8 = await fx.getU8()
  if (!u8) {
    await afficherDiag($t('PPerrb'))
    ui.fD()
    ppSt.copiercollerfic(false)
  } else {
    fx.u8 = u8
    ui.fD()
    ppSt.copiercollerfic(fx)
  }
}

async function affFic (f) {
  const url = await blobde(f)
  if (url) {
    setTimeout(() => { window.open(url, '_blank') }, 500)
  } else {
    afficherDiag($t('PPerrb'))
  }
}

async function enregFic (f) {
  const blob = await blobde(f, true)
  if (blob) {
    saveAs(blob, f.nomFichier)
    await afficherDiag($t('PPsavas', [f.nomFichier]))
  } else {
    afficherDiag($t('PPerrb'))
  }
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.filler
  height: 2rem
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.bord1
  border-radius: 5px
  border: 1px solid $grey-5
  padding: 2px
</style>
