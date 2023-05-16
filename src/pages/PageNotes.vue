<template>
  <q-page class="column q-pl-xs q-mr-sm">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <div class="sep row q-ml-xs">
      <q-btn v-if="!expandAll" class="q-my-sm" dense size="sm" :label="$t('PNOdep')" 
        color="primary" icon="unfold_more" @click="tree.expandAll();expandAll=true"/>
      <q-btn v-if="expandAll" class="q-my-sm" dense size="sm" :label="$t('PNOrep')" 
        color="primary" icon="unfold_less" @click="tree.collapseAll();expandAll=false"/>
    </div>

    <!-- tick-strategy="leaf" -->
    <q-tree ref="tree"
      :nodes="nSt.nodes"
      dense
      accordion
      node-key="key"
      selected-color="primary"
      v-model:selected="selected"
    >
      <template v-slot:default-header="prop">
        <div class="row items-center">
          <q-icon :name="icons[prop.node.type]" :color="colors[prop.node.type]"
            size="sm" class="q-mr-sm" />
          <div :class="styles[prop.node.type]">{{lib(prop.node)}}</div>
        </div>
      </template>
    </q-tree>

    <q-page-sticky position="top-left" class="box" :offset="[0,0]">
      <q-card class="q-pa-sm box2">
        <div class="titre-lg">Aperçu de la note selectionée</div>
        <div v-if="selected" class="titre-md">{{lib(node)}}</div>
      </q-card>
    </q-page-sticky>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'

const icons = ['accessibility','person','group','description','article','close']
const colors = ['green-7','primary','orange','primary','orange','negative']
const styles = [ 
  'titre-md text-italic', 
  'titre-md text-bold', 
  'titre-md text-bold', 
  'fs-md', 
  'fs-md',
  'font-mono fs-sm'
  ]

export default {
  name: 'PageNotes',

  components: {  },

  computed: {
  },

  watch: {
    selected (ap, av) {
      this.node = this.nSt.getNode(ap)
    }
  },
  methods: {
    lib (n) {
      if (n.type === 3 || n.type === 4) return n.label
      if (n.type === 1) return this.$t('avatar', [n.label])
      if (n.type === 2) return this.$t('groupe', [n.label])
      return this.$t('groupes')
    }
  },

  data () {
    return {
      icons,
      colors,
      styles,
      selected: null,
      node: null,
      expandAll: false
    }
  },

  setup () {
    const tree = ref(null)
    const nSt = stores.note
    const session = stores.session
    const nodes = nSt.nodes
    return {
      session,
      tree,
      nSt
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
.sep
  margin-top: 11rem
.box
  border-bottom: 1px solid $grey-5
  width: 100vw
  height: 10rem
  overflow: hidden
.box2
  width: 100vw
  height: 10rem
  overflow: auto
</style>
