<template>
<q-dialog v-model="ui.d.a.dialoguehelp" position="left" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('xl')">
  <q-header elevated>
    <q-toolbar class="tbs">
      <btn-cond icon="chevron_left" color="warning" @ok="ui.fermerHelp">
        <q-tooltip class="bg-white text-primary">{{$t('HLPfermer')}}</q-tooltip>
      </btn-cond>
      <btn-cond v-if="!stackvide" class="q-ml-xs" icon="arrow_back" @ok="back">
        <q-tooltip class="bg-white text-primary">{{$t('HLPprec')}}</q-tooltip>
      </btn-cond>
      <q-toolbar-title class="titre-lg">{{$t('A_' + selected)}}
        <q-tooltip class="bg-white text-primary">{{selected}}</q-tooltip>
      </q-toolbar-title>
    </q-toolbar>
    <q-separator color="grey-5" size="2px"/>
    <q-toolbar class="tbp">
      <q-toolbar-title>
        <a class="q-mr-sm text-italic text-white text-underlined titre-md text-bold cursor-pointer"
          :href="docsurl + '/index.html'" target="_blank">
          {{$t('HLPdg')}}</a>
      </q-toolbar-title>
      <btn-cond color="secondary" :label="$t('readme')" @ok="ovreadme"/>
    </q-toolbar>
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
        <q-expansion-item v-for="c in chaps" :key="c.t" class="q-my-sm"
          group="somegroup">
          <template v-slot:header>
            <div class="full-width column chap q-pa-xs">
              <div class="text-bold titre-md">{{c.t}}</div>
              <div v-if="c.m.length" class="self-end q-mr-sm">
                <div v-for="m in c.m" :key="m.value" @click.stop="goto(m.value)"
                  class="q-my-xs x1 text-positive text-italic text-bold titre-md cursor-pointer">
                  {{m.label}}
                </div>
              </div>
            </div>
          </template>
          <show-html class="q-mx-sm q-my-md" :texte="c.tx"/>
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
            <div v-else class="row items-start no-wrap">
              <q-icon name="note" color="primary" size="24px" class="col-auto q-mr-sm" />
              <div :class="'col ' + cl(prop.node.id)">{{ prop.node.label }}</div>
            </div>
          </div>
        </template>
        </q-tree>
      </q-scroll-area>
    </div>
  </q-page-container>

  <!-- Affichage du README de la version courante de l'application -->
  <q-dialog v-model="ui.d.a.readme" persistent>
    <q-card :class="styp('md') + 'q-pa-sm'">
      <q-card-section>
        <div class="titre-md">{{$t('HLPrm1')}}</div>
        <sd-nb :texte="config.readme" class="q-my-sm rd"/>
        <div>
          <a class="text-italic text-primary text-underlined titre-lg text-bold cursor-pointer"
            :href="docsurl + '/appli/confiance.html'" target="_blank">
            {{$t('HLPrm2')}}</a>
        </div>
        <div class="titre-md text-italic q-mt-md">{{$t('HLPurls')}}</div>
        <div class="column fs-sm font-mono q-ml-lg">
          <div class="row">
            <span class="col-2 text-right q-pr-md text-italic">OP:</span>
            <span class="col-10">{{config.OPURL || '?'}}</span>
          </div>
          <div class="row">
            <span class="col-2 text-right q-pr-md text-italic">PUBSUB:</span>
            <span class="col-10">{{config.PUBSUBURL || '?'}}</span>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="center" class="q-my-sm">
        <btn-cond flat :label="$t('jailu')" size="lg" @ok="ui.fD"/>
      </q-card-actions>
    </q-card>
  </q-dialog>

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
import SdNb from '../components/SdNb.vue'

const $i18n = useI18n()
const locale = $i18n.locale.value
const ui = stores.ui

const config = stores.config
const docsurl = config.docsurls[locale] || 'http://localhost:8080/fr'
const urld = '<a href="' + docsurl + '/'
const arbre = config.getHelpArbre()
const pages = config.getHelpPages() // Key: nom page, value: nom de sa page mère (null si racine)

function parents (n) { // nom d'une page ou section
  const r = [n]
  let x = n
  while (x) {
    const p = pages.get(x)
    if (p) r.push(p)
    x = p
  }
  return r
}

function ovreadme () { ui.oD('readme', 'a') }

const tree = ref(null)
const expandAll = ref(false)
const splitterModel = ref(50)
const selected = ref(ui.helpstack[0])
const expanded = ref(parents(ui.helpstack[0]))
const intro = ref()
const chaps = ref()
const filter = ref('')
const filterRef = ref(null)

watch(selected, (ap) => {
  expanded.value = parents(ap)
})

function resetFilter () {
  filter.value = ''
  filterRef.value.focus()
}

function setChaps (id) {
  const y = getMd(id, locale)
  const x = y.replaceAll('\r\n', '\n').split('\n')
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
          if (code) {
            if (pages.has(code)) {
              const titre = ($t('A_' + code) || '').trim()
              if (titre) m.push({ label: titre, value: code })
            } else {
              console.log('Help : page non trouvée [' + code + ']')
            }
          }
        })
      }
    } else {
      const l2 = l.replaceAll('<a href="$$/', urld)
      tx.push(remplaceImg(l2))
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
  color: black !important
  font-weight: bold !important
.rd
  border: 1PX solid $grey-5
  border-radius: 7px
  padding: 3px
  max-height: 10rem
  overflow-y: scroll
.chap
  border: 1px solid var(--q-primary)
  border-radius: 8px
</style>
