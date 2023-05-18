<template>
  <q-page class="column q-pl-xs q-mr-sm">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <div class="sep row q-ml-xs">
      <q-btn v-if="!expandAll" class="q-my-sm" dense size="sm" :label="$t('PNOdep')" 
        color="primary" icon="unfold_more" @click="tree.expandAll();expandAll=true"/>
      <q-btn v-if="expandAll" class="q-my-sm" dense size="sm" :label="$t('PNOrep')" 
        color="primary" icon="unfold_less" @click="tree.collapseAll();expandAll=false"/>
      <q-btn class="q-my-sm" dense size="sm" label="T1" 
        color="warning" icon="check" @click="test1"/>
    </div>

    <!-- tick-strategy="leaf" -->
    <q-tree ref="tree" class="q-mb-xl"
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
        <show-html v-if="selected" class="titre-md largeur30 bord1" 
          :texte="node.note.txt" zoom maxh="4rem" />
      </q-card>
    </q-page-sticky>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { Note } from '../app/modele.mjs'
import ShowHtml from '../components/ShowHtml.vue'

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

const nbn1 = 10 // nombre de blocks de 4 * nbn2 messages sous la racine d'un avatar ou groupe
const nbn2 = 9

export default {
  name: 'PageNotes',

  components: { ShowHtml },

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
    },
    
    stest1 (na, g) {
      const id = na.id
      for(let i = 0; i < nbn1; i++) {
        // (id, ids, ref, texte, dh, v1, v2)
        const n1 = new Note()
        const x = i * 1000
        n1.initTest(id, x + 1, null, '##Ma note ' + (x + 1), new Date().getTime(), 10, 12)
        if (g) this.gSt.setNote(n1); else this.aSt.setNote(n1)
        for( let j = 1; j < nbn2; j++) {
          const x = (i * 1000) + (j * 10)
          const n2 = new Note()
          n2.initTest(id, x + 2, [n1.id, n1.ids], 'Ma note ' + (x+2) + ' bla bla bla bla bla\nbla bla bla bla', new Date().getTime(), 8, 0)
          if (g) this.gSt.setNote(n2); else this.aSt.setNote(n2)
          const n3 = new Note()
          n3.initTest(id, x + 3, [n1.id, n1.ids], 'Ma tres belle note ' + (x+3) + ' bla bla bla bla bla\nbla bla bla bla', new Date().getTime(), 8, 0)
          if (g) this.gSt.setNote(n3); else this.aSt.setNote(n3)
          const n4 = new Note()
          n4.initTest(id, x + 4, [n2.id, n2.ids], 'Ma tres belle note ' + (x+4) + ' bla bla bla bla bla\nbla bla bla bla', new Date().getTime(), 8, 0)
          if (g) this.gSt.setNote(n4); else this.aSt.setNote(n4)
        }
      }
    },

    stest2 (na) {
      let i = 0
      for(const ng of this.ngs) {
        const ids = 100000 + (10 * i++)
        const n1 = new Note()
        n1.initTest(na.id, ids + 1, [ng.id, 1, ng.nom], '', new Date().getTime(), 8, 0)
        n1.settxt(`Note ${n1.pk} de ${na.nom} attachée à ${n1.pkref} du groupe ${n1.rnom} `)
        this.gSt.setNote(n1)
        const n2 = new Note()
        n2.initTest(na.id, ids + 2, [ng.id, 1, ng.nom], '', new Date().getTime(), 8, 0)
        n2.settxt(`Note ${n2.pk} de ${na.nom} attachée à ${n2.pkref} du groupe ${n2.rnom} `)
        this.gSt.setNote(n2)
        const n3 = new Note()
        n3.initTest(na.id, ids + 3, [n1.id, n1.ids], '', new Date().getTime(), 8, 0)
        n3.settxt(`Note ${n3.pk} de ${na.nom} attachée à ${n1.pkref} du groupe ${n1.rnom} `)
        this.gSt.setNote(n3)
      }
    },

    test1 () { // génération de notes de test
      this.nas = []
      this.aSt.map.forEach(m => { this.nas.push(m.avatar.na) })
      for(const na of this.nas) this.stest1(na)
      this.ngs = []
      this.gSt.map.forEach(m => { this.ngs.push(m.groupe.na) })
      for(const na of this.ngs) this.stest1(na, true)
      for(const na of this.nas) this.stest2(na)
    }

  },

  data () {
    return {
      icons,
      colors,
      styles,
      selected: null,
      node: null,
      expandAll: false,
      nas: [], // test : liste des na des avatars
      ngs: [] // test : liste des na des groupes
    }
  },

  setup () {
    const tree = ref(null)
    const nSt = stores.note
    const session = stores.session
    const nodes = nSt.nodes
    const aSt = stores.avatar
    const gSt = stores.groupe
    return {
      session, nSt, aSt, gSt,
      tree
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
.bord1
  border-top: 1px solid $grey-5 !important
  border-bottom: 1px solid $grey-5 !important
</style>
