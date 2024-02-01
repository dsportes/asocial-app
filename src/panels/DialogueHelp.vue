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
              <div @click.stop="clic($event, prop.node)" :title="prop.node.id">
                <div v-if="prop.node.type === 1" class="row items-center">
                  <q-icon name="library_books" color="orange" size="24px" class="q-mr-sm" />
                  <div :class="'text-bold text-italic' + cl(prop.node.id)">{{ prop.node.label }}</div>
                </div>
                <div v-if="prop.node.type === 2" class="row items-center">
                  <q-icon name="menu_book" color="orange" size="24px" class="q-mr-sm" />
                  <div :class="'text-bold text-italic' + cl(prop.node.id)">{{ prop.node.label }}</div>
                </div>
                <div v-if="prop.node.type === 3" class="row items-center">
                  <q-icon name="note" color="primary" size="24px" class="q-mr-sm" />
                  <div :class="'text-bold' + cl(prop.node.id)">{{ prop.node.label }}</div>
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
      <q-toolbar-title class="titre-lg">{{tp}}</q-toolbar-title>
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
import { arbres, titre, parents } from '../app/help.mjs'
import { styp, sty } from '../app/util.mjs'

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
      this.expanded = parents(ap)
    }
  },

  computed: {
    stackvide () { return this.ui.helpstack.length <= 1 },
    arbre () { return arbres[this.$i18n.locale] },
    tp () { return titre(this.$i18n.locale, this.selected) },
    courante () { return this.ui.helpstack[this.ui.helpstack.length - 1] }
  },

  methods: {
    cl (id) { return ' titre-md ' + (id === this.selected ? 'q-px-xs bg-yellow-5 text-black text-bold' : '') },
    clic (e, n) {
      // const t = e.target
      const i = n.id.indexOf('/')
      const p = i === -1 ? n.id : n.id.substring(i + 1)
      if (p === this.courante) return
      this.ui.pushhelp(p)
      this.selected = p
      this.setChaps(p)
    },
    goto (p) {
      this.ui.pushhelp(p)
      this.selected = p
      this.setChaps(p)
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
            const i = l.indexOf('[')
            if (i === -1 || i < 3) continue
            const j = l.indexOf(']', i)
            if (j === -1 || j === i + 1) continue
            m.push({ label: l.substring(2, i), value: l.substring(i + 1, j) })
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
      splitterModel, selected, expanded,
      setChaps, intro, chaps,
      resetFilter, filterRef, filter,
      tree: ref(null)
    }
  }
})
</script>

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
