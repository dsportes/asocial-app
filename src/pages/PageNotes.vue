<template>
  <q-page class="column q-pl-xs q-mr-sm">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <div class="sep row q-ml-xs">
      <q-btn v-if="!expandAll" class="q-my-sm" dense size="sm" :label="$t('PNOdep')" 
        color="primary" icon="unfold_more" @click="tree.expandAll();expandAll=true"/>
      <q-btn v-if="expandAll" class="q-my-sm" dense size="sm" :label="$t('PNOrep')" 
        color="primary" icon="unfold_less" @click="tree.collapseAll();expandAll=false"/>
      <q-btn class="q-my-sm q-ml-lg" dense size="sm" label="T1" 
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
      :filter="filtreFake"
      :filter-method="filtrage"
    >
      <template v-slot:default-header="prop">
        <div class="row items-start">
          <q-icon :name="icons[prop.node.type]" :color="colors[prop.node.type]"
            size="sm" class="col-auto q-mr-sm" />
          <div :class="'col ' + styles[prop.node.type]">{{lib(prop.node)}}</div>
        </div>
      </template>
    </q-tree>

    <q-page-sticky position="top-left" class="box" :offset="[0,0]">
      <q-card class="q-pa-sm box2">
        <div v-if="selected" class="largeur40">
          <div class="row justify-between">
            <div class="titre-md">{{lib2(node)}}</div>
            <div v-if="node.note" class="font-mono">{{dhcool(node.note.dh)}}</div>
          </div>
          <div v-if="node.note">
            <show-html v-if="selected" class="titre-md bord1" 
              :texte="node.note.txt" zoom maxh="4rem" />
            <apercu-motscles v-if="node.note.smc" :mapmc="mapmc" 
              :src="Array.from(node.note.smc)" du-compte
              :du-groupe="ID.estGroupe(node.note.id) ? node.note.id : 0"/>
          </div>
        </div>
        <div v-else class="titre-md text-italic">{{$t('PNOnosel')}}</div>
      </q-card>
    </q-page-sticky>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { Note, Motscles, getNg } from '../app/modele.mjs'
import { dhcool, difference, intersection, splitPK } from '../app/util.mjs'
import ShowHtml from '../components/ShowHtml.vue'
import ApercuMotscles from '../components/ApercuMotscles.vue'
import { ID } from '../app/api.mjs'

const icons = ['','person','group','group','description','article','close','close']
const colors = ['','primary','orange','negative','primary','orange','primary','orange']
const styles = [
  '',
  'titre-md text-bold', 
  'titre-md text-bold', 
  'titre-md text-bold text-italic', 
  'fs-md', 
  'fs-md',
  'fs-md text-italic',
  'fs-md text-italic'
  ]

const nbn1 = 50 // nombre de blocks de 4 * nbn2 messages sous la racine d'un avatar ou groupe
const nbn2 = 9

export default {
  name: 'PageNotes',

  components: { ShowHtml, ApercuMotscles },

  computed: {
  },

  watch: {
    selected (ap, av) {
      this.node = this.nSt.getNode(ap)
    }
  },
  methods: {
    lib (n) {
      if (n.type > 3) return n.label
      if (n.type === 1) return this.$t('avatar', [n.label])
      return this.$t('groupe', [n.label])
    },
    lib2 (n) {
      if (n.type <= 3) return n.label
      if (n.type === 4) {
        const nomg = n.note.refn
        const nom = getNg(n.note.id).nom
        return nomg ? this.$t('avatar3', [nom, nomg]) : this.$t('avatar2', [nom])
      }
      if (n.type === 5) {
        const nom = getNg(n.note.id).nom
        return this.$t('groupe2', [nom])
      }
      const { id, ids } = splitPK(n.key)
      const r = nodes.map.get(''+id)
      if (n.type === 6) { 
        return this.$t('avatar9', [ids, r.label])
      }
      if (n.type === 7) {
        return this.$t('groupe9', [ids, r.label])
      }
    },
    
    filtrage (node, filtreFake) {
      const f = this.filtre
      const n = node.note
      if (!n || !f) return true
      if (f.avgr) {
        if (n.id !== f.avgr && !n.refk) return false
        if (n.id !== f.avgr) {
          let refk = n.refk
          while (true) {
            const p = this.nSt.map.get(refk)
            if (!p) return false // ça ne devrait pas arriver
            if (!p.refk) {
              // on est au top
              if (p.id !== f.avgr) return false
              break
            } else {
              refk = p.refk
            }
          }
        }
      }
      if (f.note && n.txt) {
        if (n.txt.indexOf(f.note) === -1) return false
      }
      if (f.lim && n.dh) {
        if (n.dh < f.lim) return false
      }
      if (f.mcp) {
        if (!n.smc) return false
        if (difference(f.mcp, n.smc).size) return false
      }
      if (f.mcn) {
        if (n.smc && intersection(f.mcn, n.smc).size) return false
      }
      return true
    },

    stest1 (na, g) {
      const id = na.id
      for(let i = 0; i < nbn1; i++) {
        // (id, ids, ref, texte, dh, v1, v2)
        const n1 = new Note()
        const x = i * 1000
        n1.initTest(id, x + 1, null, '', this.testdh(), 10, 12)
        n1.settxt('##Ma note ' + n1.key)
        if (g) this.gSt.setNote(n1); else this.aSt.setNote(n1)
        for( let j = 1; j < nbn2; j++) {
          const x = (i * 1000) + (j * 10)
          const n2 = new Note()
          n2.initTest(id, x + 2, [n1.id, n1.ids], '', this.testdh(), 8, 0)
          n2.settxt('Ma note ' + n2.key + ' bla bla bla bla bla\nbla bla bla bla')
          if (g) this.gSt.setNote(n2); else this.aSt.setNote(n2)
          const n3 = new Note()
          n3.initTest(id, x + 3, [n1.id, n1.ids], '', this.testdh(), 8, 0)
          n3.settxt('Ma tres belle note ' + n3.key + ' bla bla bla bla bla\nbla bla bla bla')
          if (g) this.gSt.setNote(n3); else this.aSt.setNote(n3)
          const n4 = new Note()
          n4.initTest(id, x + 4, [n2.id, n2.ids], '', this.testdh(), 8, 0)
          n4.settxt('Ma tres belle note ' + n4.key + ' bla bla bla bla bla\nbla bla bla bla')
          if (g) this.gSt.setNote(n4); else this.aSt.setNote(n4)
        }
      }
    },

    stest2 (na) {
      let i = 0
      for(const ng of this.ngs) {
        const ids = 100000 + (10 * i++)
        const n1 = new Note()
        n1.initTest(na.id, ids + 1, [ng.id, 1, ng.nom], '', this.testdh(), 8, 0)
        n1.settxt(`Note ${n1.key} de ${na.nom} attachée à ${n1.rids} du groupe ${n1.refn} `)
        this.gSt.setNote(n1)
        const n2 = new Note()
        n2.initTest(na.id, ids + 2, [ng.id, 1, ng.nom], '', this.testdh(), 8, 0)
        n2.settxt(`Note ${n2.key} de ${na.nom} attachée à ${n2.rids} du groupe ${n2.refn} `)
        this.gSt.setNote(n2)
        const n3 = new Note()
        n3.initTest(na.id, ids + 3, [n1.id, n1.ids], '', this.testdh(), 8, 0)
        n3.settxt(`Note ${n3.key} de ${na.nom} attachée à ${n1.rids} du groupe ${n1.refn} `)
        this.gSt.setNote(n3)
      }
      // des groupes zombis
      {
        const gz = 1020000000000099
        const n1 = new Note()
        n1.initTest(na.id, 99999999, [gz, 1, 'MonZombi'], '', this.testdh(), 8, 0)
        n1.settxt(`Note ${n1.key} de ${na.nom} attachée à ${n1.rids} du groupe ${n1.refn} `)
        this.gSt.setNote(n1)
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
    },

    testdh () {
      const nj = Math.floor(Math.random() * 100)
      return this.now - ( 86400000 * nj)
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
    // const nodes = nSt.nodes
    const aSt = stores.avatar
    const gSt = stores.groupe
    const fSt = stores.filtre
    const filtre = ref(null)
    const filtreFake = ref('1')
    const now = new Date().getTime()

    function compileFiltre (f) {
      f.lim = f.nbj ? new Date().getTime() - (86400000 * f.nbj) : 0
      filtre.value = f

      f.mcp = f.mcp ? new Set(f.mcp) : null
      f.mcn = f.mcn ? new Set(f.mcn) : null

      if (f.avgr) {
        const g = ID.estGroupe(f.avgr) ? f.avgr : 0
        mapmc.value = Motscles.mapMC(true, g)
        fSt.contexte.notes.mapmc = mapmc.value
        if (!g) {
          // enlever les mots clés de groupe de f.mcp / f.mcn
          if (f.mcp) {
            const ns = new Set()
            f.mcp.forEach(mc => { if (mc < 100 || mc > 200) ns.add(mc)})
            f.mcp = ns
          }
          if (f.mc) {
            const ns = new Set()
            f.mcn.forEach(mc => { if (mc < 100 || mc > 200) ns.add(mc)})
            f.mcn = ns
          }
        }
      }
      filtreFake.value = (parseInt(filtreFake.value) + 1).toString()
     }

    fSt.$onAction(({ name, args, after }) => { 
      after(async (result) => {
        if ((name === 'setFiltre')){
          if (args[0] === 'notes') compileFiltre(fSt.filtre.notes)
        }
      })
    })

    const mapmc = ref(Motscles.mapMC(true, 0))
    fSt.contexte.notes.mapmc = mapmc.value

    return {
      ID, splitPK,
      session, nSt, aSt, gSt,
      tree,
      filtre, filtreFake,
      mapmc,
      now,
      dhcool
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
