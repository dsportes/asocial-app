<template>
<q-dialog v-model="ui.d.dialoguehelp" full-height position="left" persistent >
<div style="position:relative;height:100vh" :class="styp('xl')">
      <q-splitter :vertical="!ui.portrait" :horizontal="ui.portrait" 
        v-model="splitterModel" :limits="[20, 80]" 
        style="height: 100vh">

        <template v-slot:after>
          <div class="q-pa-xs" :style="'margin-bottom:2.5rem;' + (!ui.portrait ? 'margin-top:2.5rem' : '')">
            <q-tree ref="tree"
              dense
              :nodes="arbre"
              node-key="id"
              :filter="filter"
              v-model:selected="selected"
              v-model:expanded="expanded"
              no-connectors
            >
            <template v-slot:default-header="prop">
              <div @click.stop="goto(prop.node.id)">
                <div v-if="prop.node.type === 1" class="row items-start no-wrap"
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
          </div>
        </template>

        <template v-slot:separator>
          <q-avatar color="primary" text-color="white" size="24px" icon="drag_indicator" />
        </template>

        <template v-slot:before>
          <div class="q-pa-xs" :style="'margin-top:2.5rem;' + (!ui.portrait ? 'margin-bottom:2.5rem' : '')">
            <show-html v-if="intro" class="q-mx-sm q-mb-md" :texte="intro"/>
            <q-expansion-item v-for="c in chaps" :key="c.t" 
              group="somegroup" expand-separator>
              <template v-slot:header>
                <div class="full-width row justify-between items-center bg-primary text-white">
                  <div class="text-bold titre-md">{{c.t}}</div>
                  <q-btn v-if="c.m.length" color="secondary" icon="menu" padding="none" size="md" rounded>
                    <q-menu>
                      <q-list v-for="m in c.m" :key="m.value" 
                        style="min-width:30rem" class="bg-secondary text-white">
                        <q-item clickable v-close-popup @click.stop="goto(m.value)">
                          <q-item-section class="titre-md text-italic">{{m.label}}</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                  </q-btn>
                </div>
              </template>
              <show-html class="q-mx-sm q-mb-md" :texte="c.tx"/>
            </q-expansion-item>
          </div>
        </template>

      </q-splitter>

    <q-toolbar class="bg-secondary text-white tb">
      <q-btn dense size="md" icon="chevron_left" color="warning" 
        @click="ui.fermerHelp">
        <q-tooltip class="bg-white text-primary">{{$t('HLPfermer')}}</q-tooltip>
      </q-btn>
      <q-btn v-if="!stackvide" class="q-ml-xs" 
        dense size="md" icon="arrow_back" @click="back">
        <q-tooltip class="bg-white text-primary">{{$t('HLPprec')}}</q-tooltip>
      </q-btn>
      <q-toolbar-title class="titre-lg">{{$t('A_' + this.selected)}}</q-toolbar-title>
    </q-toolbar>

    <q-toolbar class="bg-black text-white bb">
      <q-input ref="filterRef" dense v-model="filter" :label="$t('HLPfiltre')">
        <template v-slot:append>
          <q-icon v-if="filter !== ''" name="clear" class="cursor-pointer" @click="resetFilter" />
        </template>
      </q-input>
      <q-space />
      <q-btn v-if="!expandAll" 
        dense size="md" color="primary" icon="unfold_more" padding="none"
        :label="$t('PNOdep')" @click="tree.expandAll();expandAll=true"/>
      <q-btn v-if="expandAll" 
        dense size="md" color="primary" icon="unfold_less" padding="none"
        :label="$t('PNOrep')" @click="tree.collapseAll();expandAll=false"/>
    </q-toolbar>

</div>
</q-dialog>
</template>

<script>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getImgUrl, getMd } from '../boot/appconfig.js'
import stores from '../stores/stores.mjs'
import { styp, sty, $t } from '../app/util.mjs'

import ShowHtml from '../components/ShowHtml.vue'

export default ({
  name: 'DialogueHelp',

  components: { ShowHtml },

  data () {
    return {
      expandAll: false
    }
  },

  watch: {
    selected (ap) {
      this.expanded = this.parents(ap)
    }
  },

  computed: {
    stackvide () { return this.ui.helpstack.length <= 1 },
    courante () { return this.ui.helpstack[this.ui.helpstack.length - 1] }
  },

  methods: {
    cl (id) { return ' titre-md ' + (id === this.selected ? 'q-px-xs bg-yellow-5 text-black text-bold' : '') },
    goto (p) {
      if (p !== this.courante) {
        this.ui.pushhelp(p)
        this.selected = p
        this.setChaps(p)
      }
    },
    back () {
      this.ui.pophelp()
      this.selected = this.courante
      this.setChaps(this.selected)
    }
  },

  setup () {
    const $i18n = useI18n()
    const ui = stores.ui

    const config = stores.config
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
      const x = getMd(id, $i18n.locale.value).split('\n')
      intro.value = ''
      chaps.value = []
      let t = '', tx = [], m = []
      for (const l of x) {
        if (l.startsWith('# ')) {
          // clôture du chapitre précédent s'il y en a un, sinon de l'intro
          if (t) { /*tx.push('\n');*/ chaps.value.push({t, tx: tx.join('\n'), m}) }
          else if (tx.length) { /*tx.push('\n');*/ intro.value = tx.join('\n') }
          // Init du nouveau chapitre
          tx.length = 0
          t = l.substring(2)
          m = []
        } else {
          if (l.startsWith('@@')) {
            if (!t) continue // pas de menu dans l'intro
            const code = l.substring(2).trim()
            if (!pages.has(code)) continue
            const titre = ($t('A_' + code) || '').trim()
            if (!titre) continue
            m.push({ label: titre, value: code })
          } if (l.startsWith('<a href="$$/')) {
            const x = l.substring(11)
            tx.push('<a href="' + config.docsurl + x)
          } else {
            tx.push(remplaceImg(l))
          }
        }
      }
      if (!t && tx.length) { /*tx.push('\n');*/ intro.value = tx.join('\n') }
      if (t) { /*tx.push('\n'); */ chaps.value.push({t, tx: tx.join('\n'), m}) }
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

    return {
      ui, sty, styp,
      arbre, parents,
      splitterModel, selected, expanded,
      setChaps, intro, chaps,
      resetFilter, filterRef, filter,
      tree: ref(null)
    }
  }
})
</script>

<style lang="sass">
.q-tree__node-header
  align-items: start !important
</style>

<style lang="sass" scoped>
@import '../css/app.sass'
.tb
  position: absolute
  top: 0
  left: 0
.bb
  position: absolute
  bottom: 0
  left: 0
.filler
  height: 3rem
</style>
