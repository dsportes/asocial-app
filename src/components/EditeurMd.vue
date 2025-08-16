<template>
<div ref="root">
  <div v-if="!max" :style="'height:' + (mh || '10rem')" :class="sty()">
    <q-layout container view="hHh lpR fFf">
      <q-header>
        <q-toolbar class="fs-md full-width tbs bar">
          <btn-cond class="q-mr-xs" @ok="max=true" icon="zoom_out_map" flat color="nb"/>
          <btn-cond flat color="nb" :icon="md ? 'edit' : 'visibility'"
            round @ok="md = !md"/>
          <btn-cond v-if="editable && !md" :disable="md" class="q-mr-xs" @ok="ouvriremojimd1"
            icon="insert_emoticon" flat color="nb"/>
          <btn-cond v-if="modifie" class="q-mr-xs" @ok="undo" icon="undo" flat color="nb"/>
          <slot/>
          <q-space/>
          <div :class="'font-mono fs-sm' + (textelocal && textelocal.length >= maxlg ? ' text-bold text-warning bg-yellow-5':'')">
            {{textelocal ? textelocal.length : 0}}/{{maxlg}}c
          </div>
          <btn-cond class="q-mx-xs" @ok="print" icon="print" flat color="nb"/>
          <bouton-help page="dial_editeur"/>
        </q-toolbar>
      </q-header>

      <q-page-container :class="sty()">
        <q-input v-if="!md" type="textarea" rows="100"
          class="q-pa-xs font-mono" v-model="textelocal"
          :readonly="!editable" :placeholder="textelocal==='' ? (placeholder || $t('EMDph')) : ''"/>
        <sd-nb v-else :texte="textelocal" class="q-pa-xs bord1"/>
      </q-page-container>
    </q-layout>
  </div>

  <q-dialog v-model="max" full-height full-width
    transition-show="slide-up" transition-hide="slide-down">
    <div ref="root2" :class="sty()">
    <q-layout container view="hHh lpR fFf">
      <q-header elevated>
        <q-toolbar class="fs-md full-width tbs">
          <btn-cond class="q-mr-xs" @ok="max=false" icon="zoom_in_map" flat color="nb"/>
          <btn-cond flat :icon="md ? 'edit' : 'visibility'" color="nb"
            round @ok="md = !md"/>
          <btn-cond v-if="editable && !md" :disable="md" class="q-mr-xs" @ok="ouvriremojimd2"
            icon="insert_emoticon" flat color="nb"/>
          <btn-cond v-if="modifie" class="q-mr-xs" @ok="undo" icon="undo" flat color="nb"/>
          <q-space/>
          <div :class="'font-mono fs-sm' + (textelocal && textelocal.length >= maxlg ? ' text-bold text-warning bg-yellow-5':'')">
            {{textelocal ? textelocal.length : 0}}/{{maxlg}}c
          </div>
          <btn-cond class="q-mx-xs" @ok="print" icon="print" flat color="nb"/>
          <bouton-help page="dial_editeur"/>
        </q-toolbar>
      </q-header>

      <q-page-container>
        <q-input v-if="!md" type="textarea" rows="100" v-model="textelocal"
          :class="sty() + ' q-pa-xs font-mono'"
          :readonly="!editable" :placeholder="textelocal==='' ? (placeholder || $t('EMDph')) : ''"/>
        <sd-nb v-else :class="sty() + ' q-pa-xs bord1'" :texte="textelocal"/>
      </q-page-container>
    </q-layout>
    </div>
  </q-dialog>

  <choix-emoji :inp="inp" :close="emojiClose" :idc="idc"/>

</div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { sty, afficherDiag, $t } from '../app/util.mjs'
import { debut, finmd, fintxt, stytxt, css } from '../app/showdowncss.mjs'

import SdNb from './SdNb.vue'
import BtnCond from './BtnCond.vue'
import BoutonHelp from './BoutonHelp.vue'
import ChoixEmoji from '../dialogues/ChoixEmoji.vue'

const model = defineModel({ type: String })

const props = defineProps({
  help: String,
  lgmax: Number,
  texte: String,
  placeholder: String,
  editable: Boolean,
  idx: Number,
  modetxt: Boolean,
  mh: String
})

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const config = stores.config
const root = ref()
const root2 = ref()

const max = ref(false)

const maxlg = ref(props.lgmax || config.maxlgtextegen)

const textelocal = ref(props.texte)
const texteinp = ref(props.texte) // dernière valeur source passée sur la prop 'texte'
const md = ref(!props.modetxt)
const inp = ref(null)

watch(() => props.texte, (ap, av) => { // quand texte change, textelocal ne change pas si en édition
  if (textelocal.value === texteinp.value && textelocal.value !== ap) {
    // textelocal n'était PAS modifié, ni égal à la nouvelle valeur : alignement sur la nouvelle valeur
    textelocal.value = ap
  }
  texteinp.value = ap
})

watch(() => props.modetxt, (ap, av) => {
  if (ap) md.value = false
})

watch(textelocal, (ap, av) => {
  if (ap && ap.length > maxlg.value) textelocal.value = ap.substring(0, maxlg.value)
  model.value = textelocal.value
})

const modifie = computed(() => textelocal.value !== texteinp.value)

function ouvriremojimd1 () {
  inp.value = root.value.querySelector('textarea')
  ui.oD('choixEmoji', idc)
}

function ouvriremojimd2 () {
  inp.value = root2.value.querySelector('textarea')
  ui.oD('choixEmoji', idc)
}

async function print () {
  let txt
  const r = max.value ? root2.value : root.value
  if (md.value) {
    const el = r.querySelector('.markdown-body')
    const html = el.innerHTML
    txt = debut + css + html + finmd
  } else {
    const inp = r.querySelector('textarea')
    txt = debut + stytxt + inp.value.replaceAll('\n', '<br>') + fintxt
  }

  const buf = new TextEncoder().encode(txt)
  const blob = new Blob([buf], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  if (url) {
    setTimeout(() => { window.open(url, '_blank') }, 100)
  } else {
    await afficherDiag($t('noprint'))
  }
}

function undo () {
  textelocal.value = texteinp.value
}

function emojiClose (pos) {
  const ta = inp.value
  textelocal.value = ta.value
  ui.fD()
  setTimeout(() => {
    ta.focus()
    ta.selectionStart = pos
    ta.selectionEnd = pos
  }, 10)
}

</script>

<style lang="css">
@media screen and (max-width: 320px) {
  emoji-picker {
    --num-columns: 5;
    --category-emoji-size: 1rem;
  }
}
</style>

<style lang="sass" scoped>
.dlx
  background-color: rgba(127,127,127,0.2) !important
  padding: 4px
.bord1
  border-bottom: 1px solid $grey-5
</style>

<style lang="sass" scoped>
::v-deep(.q-field__native)
  padding-top: 0 !important
  min-height: 1rem !important
::v-deep(.q-field__control)
  min-height: 0 !important
</style>
