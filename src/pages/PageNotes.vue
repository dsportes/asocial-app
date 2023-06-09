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

    <q-tree ref="tree" class="q-mb-sm"
      :nodes="nSt.nodes"
      no-transition
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
          <q-btn v-if="choixratt" size="sm" class="q-mx-sm" icon="star"
            color="green-5" @click.stop="choixok(prop.node)"/>
          <div :class="'col ' + styles[prop.node.type]">{{lib(prop.node)}}</div>
        </div>
      </template>
    </q-tree>

    <q-dialog v-model="notenouvelle" persistent full-height>
      <note-nouvelle/>
    </q-dialog>

    <q-dialog v-model="noteedit" persistent full-height>
      <note-edit :ims="ims"/>
    </q-dialog>

    <q-dialog v-model="notetemp" persistent>
      <note-temp/>
    </q-dialog>

    <q-dialog v-model="noteprot" persistent>
      <note-prot/>
    </q-dialog>

    <q-dialog v-model="confirmsuppr" persistent>
      <q-card class="bs largeur30 q-pa-sm">
        <div class="q-mt-md titre-lg text-italic">{{$t('PNOcfsuppr')}}</div>
        <div class="q-mt-sm fs-md q-ml-md">{{nSt.note.titre}}</div>
        <div class="q-mt-md row justify-center q-gutter-md">
          <q-btn class="q-pa-xs" size="md" dense :label="$t('renoncer')" color="primary" @click="MD.fD"/>
          <bouton-confirm actif :confirmer="supprNote"/>
        </div>
      </q-card>
    </q-dialog>

    <q-page-sticky position="top-left" :class="dkli + ' box'" :offset="[0,0]">
      <div class="box2 column">
        <div v-if="!selected" class="col q-ml-xs titre-md text-italic">{{$t('PNOnosel')}}</div>
        <div v-if="selected" class="box3 q-pa-xs col largeur40">
          <div class="row justify-between">
            <div class="titre-md">{{lib2}}</div>
            <div  v-if="nSt.note" class="col-auto font-mono fs-sm">
              <span class="q-mr-sm">({{edvol(nSt.note.v1)}})</span>
              <span>{{dhcool(nSt.note.dh)}}</span>
            </div>
          </div>
          <div v-if="nSt.note">
            <div class="q-ml-md row justify-between"> 
              <show-html :class="dkli + ' col bord1'"
                :texte="nSt.note.txt" zoom maxh="4rem" />
              <q-btn class="col-auto q-ml-xs btn4" color="primary" size="sm" icon="edit" 
                @click="editer"/>
            </div>

            <div class="q-mt-xs row justify-between titre-sm">  
              <apercu-motscles class="col" v-if="nSt.note.smc" :mapmc="mapmcf(nSt.node.key)" 
                :src="Array.from(nSt.note.smc)" du-compte
                :du-groupe="ID.estGroupe(nSt.note.id) ? nSt.note.id : 0"/>
              <div v-else class="col text-italic">{{$t('PNOnmc')}}</div>
              <q-btn class="col-auto btn4" color="primary" size="sm" icon="edit" @click="editermc"/>
            </div>

            <div class="q-mt-xs row justify-between titre-sm">  
              <div class="col">
                <span>{{$t('PNOnf', nSt.note.mfa.size, {count: nSt.note.mfa.size})}}</span>
                <span class="q-ml-xs">{{nSt.note.mfa.size ? (edvol(nSt.note.v2) + '.') : ''}}</span>
              </div>
              <q-btn class="col-auto btn2" color="primary" size="sm" :label="$t('fichiers')" icon="open_in_new" 
                @click="voirfic"/>
            </div>

            <div class="q-mt-xs row justify-between titre-sm">  
              <div class="col">{{prot}}</div>
              <q-btn class="col-auto btn4" color="primary" size="sm" icon="settings" 
                @click="proteger"/>
            </div>

            <div v-if="nSt.note.st !== 99999999" class="q-mt-xs row justify-between titre-sm">  
              <div class="col">{{temp}}</div>
              <q-btn class="col-auto btn4" color="primary" size="sm" icon="settings" 
                @click="edTemp"/>
            </div>

            <div v-if="nSt.estGr" class="q-mt-xs row justify-between titre-sm">  
              <div class="col">
                <div>
                  <span class="q-mr-sm">{{exclu}}</span>
                  <span v-if="nSt.note.auts.length">{{$t('PNOauts', nSt.note.auts.length) + ' ' + nomAuts}}</span>
                </div>
              </div>
              <q-btn class="col-auto btn4" color="primary" size="sm" icon="settings" 
                @click="voirfic"/>
            </div>

          </div>
        </div>

        <div class="col-auto tb1 largeur40">
          <div class="row justify-center q-gutter-xs">
          <q-btn class="btn2" color="primary" size="md" icon="add" :label="$t('PNOnv')"
            @click="nouvelle" :disable="!selected"/>
          <q-btn class="btn2" color="warning" size="md" icon="delete" :label="$t('PNOsupp')"
            @click="supprimer" :disable="!selected || !nSt.note"/>
          <q-btn class="btn2 q-ml-xs" color="primary" size="md" icon="attachment" :label="$t('PNOratt')"
            @click="rattacher"/>
          </div>
        </div>
        <q-separator color="orange" size="3px" class="q-mt-xs q-mb-md"/>
      </div>
    </q-page-sticky>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { Note, Motscles, getNg, MD } from '../app/modele.mjs'
import { dhcool, difference, intersection, splitPK, edvol, afficherDiag } from '../app/util.mjs'
import ShowHtml from '../components/ShowHtml.vue'
import ApercuMotscles from '../components/ApercuMotscles.vue'
import { ID, AMJ } from '../app/api.mjs'
import NoteNouvelle from '../dialogues/NoteNouvelle.vue'
import NoteEdit from '../dialogues/NoteEdit.vue'
import NoteTemp from '../dialogues/NoteTemp.vue'
import NoteProt from '../dialogues/NoteProt.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import { SupprNote } from '../app/operations.mjs'

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

const nbn1 = 100 // nombre de blocks de 4 * nbn2 messages sous la racine d'un avatar ou groupe
const nbn2 = 9

export default {
  name: 'PageNotes',

  components: { ShowHtml, ApercuMotscles, NoteNouvelle, NoteEdit, NoteTemp, NoteProt, BoutonConfirm },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    lib2 () {
      const n = this.nSt.node
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
      return ''
    },
    exclu () {
      const m = this.nSt.mbExclu
      return !m ? this.$t('PNOnoexclu') : this.$t('PNOexclu', [m.na.nomc])
    },
    prot () {
      return this.nSt.note.p ? this.$t('PNOprot') : this.$t('PNOnoprot')
    },
    temp () {
      const n = this.nSt.nbjTemp
      return this.$t('PNOtemp', n, { count: n })
    },
    nomAuts () {
      const ln = []
      this.nSt.mbAuteurs.forEach(m => { ln.push(m.na.nomc)})
      return ln.join(', ')
    }
  },

  watch: {
    selected (ap, av) {
      if (!this.nSt.node || this.nSt.node.key !== ap) this.nSt.setCourant(ap)
    }
  },

  methods: {
    lib (n) {
      if (n.type > 3) return n.label
      if (n.type === 1) return this.$t('avatar1', [n.label, n.nf, n.nt])
      return this.$t('groupe1', [n.label, n.nf, n.nt])
    },
 
    mapmcf (key) {
      const id = parseInt(key)
      return Motscles.mapMC(true, ID.estGroupe(id) ? id : 0)
    },

    async nouvelle () {
      if (! await this.session.edit()) return
      this.ovnotenouvelle()
    },
   
    async supprimer () {
      if (! await this.session.edit()) return
      const er = this.erSuppr()
      if (er) { 
        await afficherDiag(this.$t('PNOer' + er ))
      } else {
        this.ovconfirmsuppr()
      }
    },

    erSuppr () {
      if (this.nSt.node.type === 3) return 1
      const g = this.nSt.groupe
      if (!g) return 0
      if (g.pe === 1) return 4
      const sim = this.gSt.setImCompte(g.id)
      const im = this.nSt.note.im
      if (im && !sim.has(im)) return 8
      let maxst = 0
      sim.forEach(im => { 
        const st = g.ast[im]
        if (st > maxst) maxst = st
      })
      if (maxst < 31 || maxst > 32) return 7
      return 0
    },

    async supprNote () {
      const n = this.nSt.note
      const g = this.nSt.groupe
      const idc = g ? g.idh : this.session.compteId
      await new SupprNote().run(n.id, n.ids, idc)
      MD.fd()
    },

    async editer () {
      if (! await this.session.edit()) return
      const er = this.erEdit()
      if (er) { 
        await afficherDiag(this.$t('PNOer' + er ))
      } else {
        this.ovnoteedit()
      }
    },

    erEdit () {
      if (this.nSt.node.type === 3) return 1
      const g = this.nSt.node.type === 5 ? this.nSt.egr.groupe : null
      if (!g) return 0
      // note de groupe
      if (g.pe === 1) return 4
      // Map par im des { nom, st } des avc membres du groupes
      const ims = this.gSt.imNomStAvc(g.id)
      const im = this.nSt.note.im
      if (im) { // le membre ayant l'exclu actuel est-il avc ?
        const e = ims.get(im)
        if (e) { this.ims = [{ label: e.nom, value: im }]; return 0 }
        return 8 // un autre membre a l'exclusivité, édition impossible
      }
      this.ims = []
      ims.forEach((e, im) => { 
        if (e.st === 31 || e.st === 32) this.ims.push({ label: e.nom, value: im})
      })
      if (!this.ims.length) return 7
      return 0
    },

    async edTemp () {
      if (! await this.session.edit()) return
      const er = this.erEdit()
      if (er) { 
        await afficherDiag(this.$t('PNOer' + er ))
      } else {
        this.ovnotetemp()
      }
    },

    async proteger () {
      if (! await this.session.edit()) return
      const er = this.erEdit()
      if (er) { 
        await afficherDiag(this.$t('PNOer' + er ))
      } else {
        this.ovnoteprot()
      }
    },

    editermc () {
      console.log('editer mc')
    },

    voirfic () {
      console.log('voir fichiers')
    },

    rattacher () {
      this.choixratt = true
    },

    choixok (node) {
      this.choixratt = false
      console.log(node.label)
    },

    stest1 (na, g) {
      const id = na.id
      const demain = AMJ.amjUtcPlusNbj(this.auj, 1)
      const sem = AMJ.amjUtcPlusNbj(this.auj, 7)

      for(let i = 0; i < nbn1; i++) {
        // (id, ids, ref, texte, dh, v1, v2)
        const n1 = new Note()
        const x = i * 1000
        n1.initTest(id, x + 1, null, '', this.testdh(), 10, 12)
        n1.settxt('## Ma note ' + n1.key)
        n1.p = 1; n1.st = this.auj
        if (g) this.gSt.setNote(n1); else this.aSt.setNote(n1)
        for( let j = 1; j < nbn2; j++) {
          const x = (i * 1000) + (j * 10)
          const n2 = new Note()
          n2.initTest(id, x + 2, [n1.id, n1.ids], '', this.testdh(), 8, 20)
          n2.settxt('Ma note ' + n2.key + ' bla bla bla bla bla\nbla bla bla bla')
          n2.st = demain; n2.im = g ? 1 : 0
          if (g) this.gSt.setNote(n2); else this.aSt.setNote(n2)
          const n3 = new Note()
          n3.initTest(id, x + 3, [n1.id, n1.ids], '', this.testdh(), 8, 20000)
          n3.settxt('Ma tres belle note ' + n3.key + ' bla bla bla bla bla\nbla bla bla bla')
          n3.st = sem
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
        n2.initTest(na.id, ids + 2, [ng.id, 1, ng.nom], '', this.testdh(), 8, 100000)
        n2.settxt(`Note ${n2.key} de ${na.nom} attachée à ${n2.rids} du groupe ${n2.refn} `)
        this.gSt.setNote(n2)
        const n3 = new Note()
        n3.initTest(na.id, ids + 3, [n1.id, n1.ids], '', this.testdh(), 8, 100000000)
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
      expandAll: false,
      choixratt: false,
      /* pour maj d'une note de groupe 
      [{label: e.nom, value: im}] des avc membres du groupes  */
      ims: null, 
      nas: [], // test : liste des na des avatars
      ngs: [] // test : liste des na des groupes
    }
  },

  setup () {
    const tree = ref(null)
    const nSt = stores.note
    const session = stores.session
    const nodes = nSt.nodes
    const selected = ref('')
    const aSt = stores.avatar
    const gSt = stores.groupe
    const fSt = stores.filtre
    const filtre = ref({})
    const filtreFake = ref('1')
    const now = new Date().getTime()

    function compileFiltre (fx) {
      const f = filtre.value
      f.v1 = fx.v1 || 0
      f.v2 = fx.v2 || 0
      f.note = fx.note
      f.temp = fx.temp
      f.lim = fx.nbj ? new Date().getTime() - (86400000 * fx.nbj) : 0
      f.mcp = fx.mcp ? new Set(fx.mcp) : null
      f.mcn = fx.mcn ? new Set(fx.mcn) : null
      f.avgr = fx.avgr
      if (f.avgr) {
        const g = ID.estGroupe(f.avgr) ? f.avgr : 0
        fSt.setContexte('notes', {
          mapmc : Motscles.mapMC(true, g),
          groupeId : g
        })
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
      } else {
        fSt.setContexte('notes', {
          mapmc : Motscles.mapMC(true, 0),
          groupeId : 0
        })      
      }
      filtreFake.value = '' + (parseInt(filtreFake.value) + 1)
      setTimeout(() => { nSt.stats(filtrage)}, 50)
    }

    function filtrage (node, filtreFake) {
      const f = filtre.value
      const n = node.note
      if (n && f) {
        if (f.avgr) {
          if (n.id !== f.avgr && !n.refk) return false
          if (n.id !== f.avgr){
            const rac = nSt.getRacine(node)
            if (rac.key !== f.avgr) return false
          }
        }
        if (f.lim && n.dh) {
          if (n.dh < f.lim) return false
        }
        if (f.note && n.txt) {
          if (n.txt.indexOf(f.note) === -1) return false
        }
        if (f.v1 && n.v1 < f.v1) return false
        if (f.v2 && n.v2 < f.v2) return false
        if (f.temp && !n.st) return false
        if (f.mcp) {
          if (!n.smc) return false
          if (difference(f.mcp, n.smc).size) return false
        }
        if (f.mcn) {
          if (n.smc && intersection(f.mcn, n.smc).size) return false
        }
      }
      return true
    }

    fSt.$onAction(({ name, args, after }) => { 
      after(async (result) => {
        if ((name === 'setFiltre')){
          if (args[0] === 'notes') compileFiltre(fSt.filtre.notes)
        }
      })
    })

    nSt.$onAction(({ name, args, after }) => { 
      after(async (result) => {
        if ((name === 'setSelected')){
          selected.value = args[0]
        }
      })
    })

    const mapmc = ref(Motscles.mapMC(true, 0))
    fSt.contexte.notes.mapmc = mapmc.value

    const notenouvelle = ref(false)
    function ovnotenouvelle () { MD.oD(notenouvelle) }
    const noteedit = ref(false)
    function ovnoteedit () { MD.oD(noteedit) }
    const confirmsuppr = ref(false)
    function ovconfirmsuppr () { MD.oD(confirmsuppr)}
    const notetemp = ref(false)
    function ovnotetemp () { MD.oD(notetemp)}
    const noteprot = ref(false)
    function ovnoteprot () { MD.oD(noteprot)}

    return {
      notenouvelle, ovnotenouvelle, confirmsuppr, ovconfirmsuppr, noteedit, ovnoteedit,
      notetemp, ovnotetemp, noteprot, ovnoteprot,
      ID, MD, AMJ, splitPK, dhcool, now, filtrage, edvol,
      session, nSt, aSt, gSt,
      selected,
      tree,
      filtre, filtreFake,
      mapmc,
      auj: session.dateJourConnx
    }
  }

}
</script>

<style lang="css">
.q-tree__arrow { font-size: 24px !important; }
</style>

<style lang="sass" scoped>
@import '../css/app.sass'
$hb: 18.5rem
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
.sep
  margin-top: $hb
.box
  width: 100vw
  height: $hb
  overflow: hidden
.box2
  width: 100vw
  height: $hb
.box3
  overflow: auto
  padding-right: 5px
.bord1
  border-top: 1px solid $grey-8 !important
  border-bottom: 1px solid $grey-8 !important
.btn2, .btn4
  min-height: 1.6rem !important
  max-height: 1.6rem !important
.btn4
  width: 1.6rem !important
.tb1
  padding-right: 5px
</style>
