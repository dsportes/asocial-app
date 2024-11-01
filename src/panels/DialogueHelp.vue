<template>
<q-dialog v-model="ui.d.a.dialoguehelp" position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('xl')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar class="bg-secondary text-white">
      <btn-cond icon="chevron_left" color="warning" @ok="ui.fermerHelp">
        <q-tooltip class="bg-white text-primary">{{$t('HLPfermer')}}</q-tooltip>
      </btn-cond>
      <btn-cond v-if="!stackvide" class="q-ml-xs" icon="arrow_back" @ok="back">
        <q-tooltip class="bg-white text-primary">{{$t('HLPprec')}}</q-tooltip>
      </btn-cond>
      <q-toolbar-title class="titre-lg">{{$t('A_' + selected)}}</q-toolbar-title>
    </q-toolbar>
    <div class="bg-primary text-right">
      <a class="q-mr-sm text-italic text-white text-underlined titre-lg text-bold cursor-pointer"
        :href="docsurl + '/index.html'" target="_blank">
        {{$t('HLPdg')}}</a>
    </div>
  </q-header>

  <q-footer elevated class="bg-black text-white">
    <q-toolbar>
      <q-input ref="filterRef" dense v-model="filter" :label="$t('HLPfiltre')">
        <template v-slot:append>
          <q-icon v-if="filter !== ''" name="clear" class="cursor-pointer" @click="resetFilter" />
        </template>
      </q-input>
      <q-space />
      <btn-cond v-if="!expandAll" icon="unfold_more" 
        :label="$t('PNOdep')" @ok="tree.expandAll();expandAll=true"/>
      <btn-cond v-if="expandAll" icon="unfold_less" padding="none"
        :label="$t('PNOrep')" @ok="tree.collapseAll();expandAll=false"/>
    </q-toolbar>
  </q-footer>

  <q-page-container>
    <div :class="ui.portrait ? 'column' : 'row justify-between'">
      <q-scroll-area :class="!ui.portrait ? 'col-6' : ''" 
        :style="ui.portrait ? 'height: 50vh;padding-bottom:10px;border-bottom:5px solid grey' : 'height: 80vh;'">
        <show-html v-if="intro" class="q-mx-sm q-my-md" :texte="intro"/>
        <q-expansion-item v-for="c in chaps" :key="c.t" 
          group="somegroup" expand-separator>
          <template v-slot:header>
            <div class="full-width column bg-primary text-white">
              <div class="text-bold titre-lg">{{c.t}}</div>
              <div v-if="c.m.length" class="self-end q-mr-sm">
                <div v-for="m in c.m" :key="m.value" @click.stop="goto(m.value)"
                  class="x1 text-italic titre-md cursor-pointer">{{m.label}}</div>
              </div>
            </div>
          </template>
          <show-html class="q-mx-sm q-mb-md" :texte="c.tx"/>
        </q-expansion-item>
      </q-scroll-area>

      <q-scroll-area :class="!ui.portrait ? 'col-6' : ''" 
        :style="ui.portrait ? 'height: 30vh;' : 'height: 80vh;'">
        <q-tree ref="tree"
          dense
          :nodes="arbre"
          node-key="id"
          :filter="filter"
          v-model:selected="selected"
          v-model:expanded="expanded"
        >
        <template v-slot:default-header="prop">
          <div @click.stop="goto(prop.node.id)">
            <div v-if="prop.node.type === 1" class="row items-start no-wrap bord"
              :style="!prop.node.children.length ? 'margin-left:8px;' : ''">
              <q-icon name="library_books" color="orange" size="24px" class="col-auto q-mr-sm" />
              <div :class="'col text-bold text-italic' + cl(prop.node.id)">{{ prop.node.label }}</div>
            </div>
            <div v-if="prop.node.type === 2" class="row items-start no-wrap">
              <q-icon name="note" color="primary" size="24px" class="col-auto q-mr-sm" />
              <div :class="'col ' + cl(prop.node.id)">{{ prop.node.label }}</div>
            </div>
          </div>
        </template>
        </q-tree>
      </q-scroll-area>
    </div>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

import { useI18n } from 'vue-i18n'
import { getImgUrl, getMd } from '../boot/appconfig.js'
import stores from '../stores/stores.mjs'
import { styp, sty, $t } from '../app/util.mjs'

import ShowHtml from '../components/ShowHtml.vue'
import BtnCond from '../components/BtnCond.vue'

const $i18n = useI18n()
const locale = $i18n.locale.value
const ui = stores.ui

const config = stores.config
const docsurl = config.docsurls[locale] || 'http://localhost:8080/fr'
const plan = config.planHelp
const arbre = []
const pages = new Map() // Key: nom page, value: nom de sa section

plan.forEach(s => {
  const ch = []
  s.lp.forEach(p => {
    pages.set(p, s.id)
    ch.push({ id: p, label: $t('A_' + p), children: [], type: 2 })
  })
  arbre.push({ id: s.id, label: $t('A_' + s.id), children: ch, type: 1 })
})

function parents (n) { // nom d'une page ou section
  const s = pages.get(n)
  return s ? [s, n] : [n]
}

const tree = ref(null)
const expandAll = ref(false)
const splitterModel = ref(50)
const selected = ref(ui.helpstack[0])
const expanded = ref(parents(ui.helpstack[0]))
const intro = ref()
const chaps = ref()
const filter = ref('')
const filterRef = ref(null)

function resetFilter () {
  filter.value = ''
  filterRef.value.focus()
}

function setChaps (id) {
  const x = getMd(id, locale).split('\n')
  intro.value = ''
  chaps.value = []
  let t = '', tx = [], m = []
  for (const l of x) {
    if (l.startsWith('# ')) {
      // clôture du chapitre précédent s'il y en a un, sinon de l'intro
      if (t) { chaps.value.push({t, tx: tx.join('\n'), m}) }
      else if (tx.length) { intro.value = tx.join('\n') }
      // Init du nouveau chapitre
      tx.length = 0
      const t1 = l.substring(2)
      const i = t1.indexOf('|')
      t = i === -1 ? t1.trim() : t1.substring(0, i).trim()
      m = []
      if (i !== -1) {
        const y = t1.substring(i + 1).split(' ')
        y.forEach(l => {
          const code = l.trim()
          if (code && pages.has(code)) {
            const titre = ($t('A_' + code) || '').trim()
            if (titre) m.push({ label: titre, value: code })
          }
        })
      }
    } else {
      if (l.startsWith('<a href="$$/')) {
        const x = l.substring(11)
        tx.push('<a href="' + docsurl + x)
      } else {
        tx.push(remplaceImg(l))
      }
    }
  }
  if (!t && tx.length) { intro.value = tx.join('\n') }
  if (t) { chaps.value.push({t, tx: tx.join('\n'), m}) }
}

function remplaceImg (l) {
  const lx = []
  let i = 0, j = 0
  while (true){ 
    i = l.indexOf('<img src="', j)
    if (i === -1) {
      if (j === 0) return l
      lx.push(l.substring(j))
      break
    } else {
      if (j !== i) lx.push(l.substring(j, i))
      j = l.indexOf('"', i + 10)
      const n = l.substring(i + 10, j)
      const u = getImgUrl(n)
      lx.push('<img src="' + u)
    }
  }
  return lx.join('')
}

setChaps(selected.value)

watch(selected, (ap) => {
  expanded.value = parents(ap)
})

const stackvide = computed(() => ui.helpstack.length <= 1)
const courante = computed(() => ui.helpstack[ui.helpstack.length - 1])

const cl = (id) => ' titre-md ' + (id === selected.value ? 'q-px-xs bg-yellow-5 text-black text-bold' : '')

function goto (p) {
  if (p !== courante.value) {
    ui.pushhelp(p)
    selected.value = p
    setChaps(p)
  }
}

function back () {
  ui.pophelp()
  selected.value = courante.value
  setChaps(selected.value)
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.x1:hover
  background-color: $yellow-3
  color: black
  font-weight: bold
</style>
