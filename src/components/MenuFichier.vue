<template>
<btn-cond round icon="more_vert" color="primary">
  <q-menu anchor="bottom left" self="top left" max-height="20rem" 
    max-width="32rem">
    <q-list class="q-py-xs bord1 bg-black text-white fs-md ">
      <q-item clickable v-close-popup  @click="copierFic" class="row items-center">
        <q-icon color="primary" size="md" name="content_copy" />
        <span>{{$t('PNFcop')}}</span>
      </q-item>
      <q-item clickable v-close-popup  @click="affFic" class="row items-center">
        <q-icon color="primary" size="md" name="open_in_new" />
        <span>{{$t('PNFaff')}}</span>
      </q-item>
      <q-item clickable v-close-popup  @click="enregFic" class="row items-center">
        <q-icon color="primary" size="md" name="save" />
        <span>{{$t('PNFenreg')}}</span>
      </q-item>
      <q-item v-if="!simple" :clickable="aut !== '0'" v-close-popup  @click="ovSuppr" class="row items-center">
        <q-icon color="warning" size="md" name="delete" />
        <span>{{$t('PNFsuppr')}}</span>
      </q-item>
      <q-item v-if="simple" v-close-popup  clickable @click="voirNote" class="row items-center">
        <q-icon color="primary" size="md" name="open_in_new" />
        <span>{{$t('PNFvoirn')}}</span>
      </q-item>
      <q-item clickable v-close-popup  @click="ouvrirDF" class="row items-center">
        <q-icon color="primary" size="md" name="airplanemode_active" />
        <span>{{$t('PNFdetail')}}</span>
      </q-item>
    </q-list>
  </q-menu>

  <q-dialog v-model="ui.d[idc].DFouvrir" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')" style="height:70vh">
    <q-header elevated class="tbs">
      <q-toolbar>
        <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg full-width text-center">
          {{$t('PNOdetail', [f.nom])}}
        </q-toolbar-title>      
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-toolbar v-if="ro" inset class="full-width msg">{{$t('PNOro')}} - {{ro}}</q-toolbar>
    </q-header>

    <q-page-container >
      <q-page class="q-pa-sm">
        <div class="row q-gutter-sm q-mt-md">
          <span v-if="f.info" class="font-mono text-bold">{{f.info}}</span>
          <span class="font-mono">#{{f.idf || '?'}}</span>
          <span>{{f.type || '?'}}</span>
          <span v-if="f.lg">{{edvol(f.lg)}}</span>
          <span v-if="f.dh">{{dhcool(f.dh, true)}}</span>
          <span v-if="dispoLoc" class="text-italic" >{{$t('DFloc')}}</span>
        </div>

        <div v-if="session.accesIdb" class="column items-center">
          <q-separator color="orange" class="full-width q-my-md"/>

          <div class="row full-width justify-between items-center">
            <div class="titre-lg">{{$t('DFavion')}}</div>
            <div class="row items-center">
              <bouton-undo class="q-mr-sm text-center" :cond="modifAv" 
                @click="xavn = xav; xav = av"/>
              <btn-cond :disable="!modifAv" icon="check" @ok="validerAv"/>
            </div>
          </div>
          <div class="row full-width items-center">
            <div class="col-7 text-right">{{$t('DFavn')}}</div>
            <div class="q-pl-xs">
              <q-toggle :class="'col-5 ' + clr1" color="grey-5" v-model="xavn" :label="$t(xavn ? 'oui1' : 'non1')"/>
            </div>
          </div>
          <div class="row full-width items-center">
            <div class="col-7 text-right">{{$t('DFav')}}</div>
            <div class="q-pl-xs">
              <q-toggle :class="'col-5 ' + clr2" color="grey-5" v-model="xav" :label="$t(xav ? 'oui1' : 'non1')" />
            </div>
          </div>
        </div>

        <div v-if="!fa.fake" class="q-pa-sm q-my-md bord1"> <!-- Etat du téléchargement -->
          <div v-if="fa.dhdc === 0" class="titre-md">{{$t('DFchgdl')}}</div>
          <div v-else>
            <div class="titre-md">
              <span>{{$t('DFchgdem', [dhcool(fa.dhdc, true)])}}</span>
              <span v-if="fa.nbr" class="q-ml-sm">- {{$t('DFretry', [fa.nbr])}}</span>
              <span v-if="!fa.exc">
                <span v-if="fa.id === faSt.idfdl" class="q-ml-sm">- {{$t('DFchgec')}}</span>
                <span v-else class="q-ml-sm">- {{$t('DFchgatt')}}</span>
              </span>
            </div>
            <div v-if="fa.exc">
              <div class="titre-md msg">
                {{$t('DFerr', [fa.exc[0] === 404 ? $t('ER404') : '' + fa.exc[0]])}}
              </div>
              <div class="q-my-xs q-ml-md font-mono fs-sm">
                {{$t('DFerr2', [fa.exc[0] === 404 ? fa.exc[1] : $t('EX' + fa.exc[0])])}}
              </div>
              <div class="row justify-between q-gutter-xs">
                <div class="col titre-md text-italic text-bold">
                  {{$t(fa.nbr < 4 ? 'DFretaut' : 'DFnoret')}}
                </div>
                <btn-cond v-if="session.synchro" class="col-auto self-start" 
                  :label="$t('retry')" icon="redo" @ok="retry(fa.id)"
                  :color="fa.nbr < 4 ? 'primary' : 'warning'" />
              </div>
            </div>
          </div>
        </div>

        <div class="titre-md text-italic q-my-sm">
          <span>{{$t(dispoLoc ? 'DFloc' : 'DFlocn')}}</span>
          <span v-if="faSt.getDataDeCache(f)" class="q-ml-md">{{$t('DFdispm')}}</span>
        </div>

      </q-page>
    </q-page-container>
  </q-layout>
  </q-dialog>

  <!-- Confirmation de suppression -->
  <q-dialog v-model="ui.d[idc].NFsupprfichier" persistent>
    <q-card :class="styp('sm') + ' q-pa-sm'">
      <q-card-section class="column items-center q-my-md">
        <div class="titre-md text-center text-italic">{{$t('PNFsf')}}</div>
        <div class="q-mt-sm fs-md font-mono text-bold">
          <span>{{f.nom}}</span><span v-if="f.info"> - {{f.info}}</span>
          <span> (#{{f.idf}})</span>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="q-gutter-sm">
        <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD" />
        <btn-cond color="warning" icon="delete" :label="$t('confirmer')" @ok="cfSuppr" />
      </q-card-actions>
    </q-card>
  </q-dialog>

</btn-cond>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { $t, edvol, dhcool, styp, trapex, afficherDiag } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonUndo from '../components/BoutonUndo.vue'
import BtnCond from '../components/BtnCond.vue'
import { saveAs } from 'file-saver'
import { SupprFichier } from '../app/operations4.mjs'
import { idb } from '../app/db.mjs'

const props = defineProps({ 
  note: Object,
  idf: String,
  simple: Boolean,
  ro: String, // raison du read-only
  aut: String // 0: lecture seulement, 1:note perso, ida: id de l'auteur pour un groupe
})

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const nSt = stores.note
const gSt = stores.groupe
const faSt = stores.ficav 
const ppSt = stores.pp
const session = stores.session

const f = computed(() => props.note.mfa.get(props.idf) || { fake: true })
const fa = computed(() => faSt.map.get(props.idf) || { fake: true })
const fpr = computed(() => f.value.fake ?  { fake: true } : props.note.fnom.get(f.value.nom)[0])
const avn = computed(() => { const fax = fpr.value && !fpr.value.fake ? faSt.map.get(fpr.value.idf) : null; return fax ? fax.avn : false })
const av = computed(() => fa.value.av || false )
const modifAv = computed(() => !(i1.value && i2.value))
const i1 = computed(() => avn.value === xavn.value)
const i2 = computed(() => av.value === xav.value )
/*
const oxn1 = computed(() => i1.value ? $t('inchange') : $t(xavn.value ? 'oui' : 'non1'))
const oxn2 = computed(() => i2.value ? $t('inchange') : $t(xav.value ? 'oui' : 'non1'))
*/
const clr1 = computed(() => i1.value ? '' : 'bg-warning')
const clr2 = computed(() => i2.value ? '' : 'bg-warning')

const xav = ref()
const xavn = ref()
/*
watch(av, (x) => { 
  xav.value = x || false})
watch(avn, (x) => { 
  xavn.value = x || false})
*/

const dispoLoc = computed(() => av.value || (avn.value && fpr.value.idf === fa.value.id))

function voirNote () {
  ui.setPage('notes')
  nSt.setPreSelect(fa.value.noteIds, true)
}

function ouvrirDF () {
  xav.value = av.value
  xavn.value = avn.value
  ui.oD('DFouvrir', idc)
}

async function validerAv () {
  if (!i2.value) 
    await faSt.setAV (props.note, f.value.nom, xavn.value, f.value.idf, xav.value)
  else 
    await faSt.setAV(props.note, f.value.nom, xavn.value)
  xav.value = av.value
  xavn.value = avn.value
}

async function retry () {
  await faSt.retry(props.idf)
}

function ovSuppr () {
  ui.oD('NFsupprfichier', idc)
}

async function cfSuppr() {
  const f = props.note.mfa.get(props.idf)
  const nom = f ? f.nom : ''
  await new SupprFichier().run(props.note, props.idf, props.aut)
  await faSt.delFic(props.note, nom, props.idf)
  ui.fD()
}

async function blobde (b) {
  const buf = await props.note.getFichier(f.value)
  if (!buf || !buf.length) return null
  const blob = new Blob([buf], { type: f.value.type })
  if (blob) console.log('blob',  f.value.type, buf.length)
  return b ? blob : URL.createObjectURL(blob)
}

async function checkLoc () {
  if (session.avion && !dispoLoc.value) {
    await afficherDiag($t('PNFnotloc'))
    return false
  }
  return true
}

async function copierFic () {
  if (!await checkLoc()) return
  const u8 = await props.note.getFichier(f.value)
  if (!u8) {
    await afficherDiag($t('PNFgetEr'))
    return
  }
  try {
    await idb.FLset(f.value.nom, f.value.info, f.value.type, u8) // throw AppExc
  } catch (e) { await trapex (e, 2) } // ferme le dialogue
  ui.afficherMessage($t('PNFcpp'))
  ppSt.modecc = false
  ppSt.setTabFichiers()
  ui.oD('pressepapier', 'a')
}

async function affFic () {
  if (!await checkLoc()) return
  const url = await blobde()
  if (url) {
    setTimeout(() => { window.open(url, '_blank') }, 100)
    console.log(url)
  } else {
    await afficherDiag($t('PNFgetEr'))
  }
}

async function enregFic () {
  if (!await checkLoc()) return
  const blob = await blobde(true)
  if (blob) {
    saveAs(blob, props.note.nomFichier(f.value))
  } else {
    await afficherDiag($t('PNFgetEr'))
  }
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
  overflow: hidden
</style>
