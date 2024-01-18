<template>
<q-dialog v-model="ui.d.dialoguehelp" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('lg')">
    <q-header elevated class="bg-secondary text-white">
      <q-toolbar>
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
    </q-header>

    <q-footer>
      <q-toolbar class="bg-black text-white">
      <q-input ref="filterRef" dense v-model="filter" :label="$t('HLPfiltre')">
        <template v-slot:append>
          <q-icon v-if="filter !== ''" name="clear" class="cursor-pointer" @click="resetFilter" />
        </template>
      </q-input>
      <q-space />
      <q-btn v-if="!expandAll" 
        dense size="sm" color="primary" icon="unfold_more" padding="none"
        :label="$t('PNOdep')" @click="tree.expandAll();expandAll=true"/>
      <q-btn v-if="expandAll" 
        dense size="sm" color="primary" icon="unfold_less" padding="none"
        :label="$t('PNOrep')" @click="tree.collapseAll();expandAll=false"/>
      </q-toolbar>
    </q-footer>

    <q-page-container>
      <q-splitter horizontal v-model="splitterModel" :limits="[20, 80]" 
        style="height: 85vh">

        <template v-slot:after>
          <div class="q-pa-xs">
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
                <div v-if="prop.node.type === 4" class="row items-center">
                  <q-icon name="chevron_right" size="16px" class="q-mr-sm" />
                  <div class="titre-sm text-italic">{{ prop.node.label }}</div>
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
          <show-html class="q-ma-sm" :texte="texte"/>
        </template>

      </q-splitter>
    </q-page-container>
  </q-layout>
</q-dialog>
</template>

<script>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getImgUrl, getMd } from '../boot/appconfig.js'
import stores from '../stores/stores.mjs'
import { arbres, titre, parents } from '../app/help.mjs'
import { styp } from '../app/util.mjs'

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
      this.setTexte(p)
    },
    back () {
      this.ui.pophelp()
      this.selected = this.courante
      this.setTexte(p)
    }
  },

  setup () {
    const $i18n = useI18n()
    const ui = stores.ui
  
    const splitterModel = ref(50)
    const selected = ref(ui.helpstack[0])
    const expanded = ref(parents(ui.helpstack[0]))
    const texte = ref()
    const filter = ref('')
    const filterRef = ref(null)

    function resetFilter () {
      filter.value = ''
      filterRef.value.focus()
    }

    function setTexte (id) {
      const txt = getMd(id, $i18n.locale.value)
      const x = txt.split('\n')
      const r = []
      for (const l of x) r.push(remplaceImg(l))
      texte.value = r.join('\n')
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

    setTexte(selected.value)

    return {
      ui, styp,
      splitterModel, selected, expanded,
      setTexte, texte,
      resetFilter, filterRef, filter,
      tree: ref(null)
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.f1
  position: absolute
  top: 0
  right: 0
  width: 8rem
  z-index: 2
  border: 2px solid $yellow-5
</style>
