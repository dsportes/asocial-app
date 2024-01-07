<template>
  <q-page class="column q-pl-xs">

    <q-tree ref="tree" class="sep q-mb-sm"
      :nodes="nSt.nodes"
      no-transition
      dense
      accordion
      node-key="key"
      selected-color="primary"
      v-model:selected="selected"
      v-model:expanded="expanded"
      :filter="filtreFake"
      :filter-method="filtrage"
    >
      <template v-slot:default-header="prop">
        <div @click.stop="clicknode(prop.node)" @keypress.stop="clicknode(prop.node)">
          <div class="row items-center">
            <q-icon v-if="prop.node.ratt" size="xs" class="col-auto q-mr-xs cursor-pointer" name="star"
              color="green-5"/>
            <q-icon :name="icons[prop.node.type]" :color="colors[prop.node.type]"
              size="sm" class="col-auto q-mr-xs"/>
            <q-icon v-if="nbf(prop.node)" name="attachment" class="col-auto q-mr" color="orange" size="sm"/>
            <q-badge v-if="nbf(prop.node)" class="col-auto q-mr-xs" color="orange" rounded 
              :label="nbf(prop.node)" text-color="black"/>
            <div :class="'col ' + styles[prop.node.type]">{{lib(prop.node)}}</div>
          </div>
        </div>
      </template>
    </q-tree>

    <note-edit v-if="ui.d.NE"/>
    <note-exclu v-if="ui.d.NX"/>
    <note-mc v-if="ui.d.NM"/>
    <note-fichier v-if="ui.d.NF"/>
    <note-confirme v-if="ui.d.NC" :op="op"/>

    <!-- Download des notes sélectionnées -->
    <q-dialog v-model="ui.d.PNdl" persistent>
      <q-card :class="styp('md')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" padding="none" color="warning" icon="close" @click="dlfin"/>
          <q-toolbar-title class="titre-lg full-width text-center">
            {{$t('PNOdlc')}}
          </q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>

        <q-card-section class="q-pa-xs" style="height:30vh;overflow-y:auto">
          <div v-if="dlnbnc" class="titre-md q-pa-xs text-center q-my-sm text-italic text-bold">
            {{$t('PNOdlnbr', [dlnbnc, dlnbntot])}}
          </div>
          <div v-else class="bg-yellow-5 q-pa-xs titre-md text-black text-center q-my-sm text-italic text-bold">
            {{$t('PNOdlok', [dlnbntot])}}
          </div>
          <div v-for="(r, idx) in lstr" :key="r.nom" :class="'row ' + dkli(idx)">
            <div class="col-1 fs-lg text-bold">{{r.nbn === r.nbnd ? '\u2713' : ' '}}</div>
            <div class="col-5">{{r.nom}}</div>
            <div class="col-1">{{pc(r.nbn, r.nbnd)}}</div>
            <div class="col-1">{{r.nbn ? r.nbn : ''}}</div>
            <div class="col-2">{{pc(r.v2, r.v2d)}}</div>
            <div class="col-2">{{r.v2 ? edvol(r.v2) : ''}}</div>
          </div>
        </q-card-section>

        <q-separator class="q-my-sm"/>

        <q-card-section class="q-pa-xs height-8">
          <div v-if="dlst!==4">
            <div class="q-mt-md q-mb-sm titre-lg text-italic">
              {{$t('PNOdlc' + (dlst===2 ? '2' : '1'))}}
            </div>
            <div class="q-ml-md q-mb-sm">
              <span class="titre-md text-italic">{{$t('PNOdlpath')}}</span>
              <span class="q-ml-xs fs-md font-mono">{{dlnc.p}}</span>
              <span class="q-ml-md titre-md text-italic">{{$t('PNOdlv12')}}</span>
              <span class="q-ml-xs fs-md font-mono">{{edvol(dlnc.n.v2)}}</span>
            </div>
          </div>
        </q-card-section>

        <q-separator class="q-my-sm"/>

        <q-card-section>
          <div class="row q-mb-sm q-gutter-sm justify-center full-width">
            <q-input class="col" dense v-model="portupload" 
              outlined :label="$t('PNOdlhp')"/>
            <q-input class="col" dense v-model="dirloc" 
              outlined :label="$t('PNOdldir')"/>
            <q-btn color="primary" dense :label="$t('test')"
              @click="testup"/>
          </div>
        </q-card-section>

        <q-card-actions v-if="dlst===1" vertical align="right" class="q-gutter-sm">
          <q-btn flat dense size="md" padding="xs" color="primary" icon="undo"
            :label="$t('renoncer')" @click="ui.fD"/>
          <q-btn dense size="md" padding="xs" color="primary" icon="start"
            :label="$t('PNOdlst1')" @click="dlgo(true)"/>
          <q-btn dense size="md" padding="xs" color="primary" icon="start"
            :label="$t('PNOdlst2')" @click="dlgo(false)"/>
        </q-card-actions>

        <q-card-actions v-if="dlst=== 2 && dlst === 3" vertical align="right" class="q-gutter-sm">
          <q-btn dense size="md" padding="xs" color="warning" icon="stop_circle"
            :label="$t('PNOdls')" @click="dlfin"/>
          <q-btn v-if="dlst===2" dense size="md" padding="xs" color="primary" icon="pause_circle"
            :label="$t('PNOdlp')" @click="dlpause"/>
          <q-btn v-if="dlst===3" dense size="md" padding="xs" color="warning" icon="play_circle" 
            :label="$t('PNOdlr')" @click="dlreprise"/>
        </q-card-actions>

        <div v-if="dlst===4" class="column q-gutter-sm">
          <div class="self-center titre-lg text-bold text-italic">
            {{$t('PNOdlok1')}}
          </div>
          <div class="self-center titre-lg text-bold">
            {{$t('PNOdlok2', [dlnbn, dlnbf, dlv2f])}}
          </div>
          <div class="self-center titre-md text-italic">
            {{$t('PNOdlok3')}}
          </div>
          <q-btn class="self-center q-mb-md" 
            flat dense padding="none" color="primary" icon="check" size="lg"
            :label="$t('jailu')" @click="ui.fD"/>
        </div>
      </q-card>
    </q-dialog>

    <q-page-sticky expand position="top">
      <div :class="sty() + ' box2 full-width q-pa-xs'">
        <div v-if="!selected" class="q-ml-xs titre-md text-italic">{{$t('PNOnosel')}}</div>

        <div v-if="selected" class="row justify-between">
          <div class="titre-md">{{lib2}}
            <span v-if="nSt.node && nSt.node.note" class="q-ml-xs font-mono fs-sm">#{{nSt.node.note.shIds}}</span>
          </div>
          <div v-if="nSt.note" class="col-auto font-mono fs-sm">
            <span class="q-mr-sm">({{edvol(nSt.note.txt.length)}})</span>
            <span>{{dhcool(nSt.note.dh)}}</span>
          </div>
        </div>

        <div v-if="selected && nSt.note" class="q-ml-md row"> 
          <show-html class="col bord1 q-mr-lg" :texte="nSt.note.txt" zoom maxh="4rem" />
          <q-btn :disable="rec!==0" class="col-auto self-start" 
            round dense size="md" icon="edit" padding="none"
            :color="nSt.note.p ? 'grey-5' : 'primary'" 
            @click="noteedit1"/>
        </div>

        <liste-auts v-if="selected && nSt.note && nSt.estGr"/>

        <div v-if="selected && nSt.note && !rec" class="q-mt-xs q-mb-sm row">  
          <apercu-motscles class="q-mr-sm"
            :du-groupe="nSt.estGroupe"
            :src="Array.from(nSt.note.smc)" 
            nozoom/>
          <q-btn color="primary" class="col-auto self-start" 
            round dense size="md" icon="edit" padding="none"
            @click="ui.oD('NM')"/>
        </div>

        <div v-if="selected && nSt.note && !rec" class="q-mt-xs q-mb-sm row">  
          <div class="col titre-sm">
            <span :class="!nSt.note.mfa.size ? 'text-italic': ''">
              {{$t('PNOnf', nSt.note.mfa.size, {count: nSt.note.mfa.size})}}
            </span>
            <span class="q-ml-xs">{{nSt.note.mfa.size ? (edvol(nSt.note.v2) + '.') : ''}}</span>
          </div>
          <q-btn class="col-auto self-start" 
            dense round size="md" color="primary" padding="none" icon="attach_file"
            @click="ui.oD('NF')">
            <q-tooltip>{{$t('PNOattach')}}</q-tooltip>
          </q-btn>
        </div>

        <div v-if="selected && nSt.note && !rec && nSt.estGr" class="q-mt-xs q-mb-sm row">  
          <div v-if="nSt.mbExclu" class="col titre-sm">{{$t('PNOexclu', [nSt.mbExclu.nom])}}</div>
          <div v-else class="col text-italic titre-sm">{{$t('PNOnoexclu')}}</div>
          <q-btn color="primary" class="col-auto self-start" 
            round dense size="md" icon="person" padding="none"
            @click="ui.oD('NX')">
            <q-tooltip>{{$t('PNOexclu3')}}</q-tooltip>
          </q-btn>
        </div>

        <div v-if="selected && !rec" class="q-my-xs row q-gutter-xs justify-end items-center">
          <!--x-test :k1="nSt.node.key"/-->
          <note-plus/>
          <q-btn v-if="nSt.note" color="warning" icon="delete" padding="none" size="md" dense
            :label="$t('PNOsupp')" @click="op='suppr';ui.oD('NC')"/>
          <q-btn v-if="rattaut" color="primary" icon="account_tree" padding="none" size="md" dense
            :label="$t('PNOratt')" @click="rattacher"/>
        </div>

        <div v-if="selected && nSt.note && rec===1" class="q-ma-sm">
          <div class="q-pa-xs bg-yellow-5 text-bold text-black text-italic text-center titre-md">
            {{$t('PNOrattinfo')}}</div>
          <div class="q-mt-sm row justify-end">
            <q-btn color="primary" size="md" icon="undo" padding="none" dense
              :label="$t('PNOanratt')" @click="anrattacher"/>
          </div>
        </div>

        <div v-if="selected && nSt.note && rec===2" class="q-ma-sm">
          <div>
            <span class="q-pa-xs text-italic titre-md q-mr-md">{{$t('PNOratta')}}</span>
            <span class="q-pa-xs bg-yellow-5 text-bold text-black titre-md">{{noderatt.label}}</span>
          </div>
          <div class="q-mt-sm row q-gutter-sm justify-end">
            <q-btn color="primary" size="md" icon="check" padding="none" dense
              :label="$t('PNOcfratt')" @click="okrattacher"/>
            <q-btn color="primary" size="md" icon="account_tree" padding="none" dense
              :label="$t('PNOratt2')" @click="rattacher"/>
            <q-btn color="primary" size="md" icon="undo" padding="none" dense
              :label="$t('PNOanratt')" @click="anrattacher"/>
          </div>
        </div>
      </div>
          
      <div class="row full-width bg-secondary text-white">
        <q-btn flat dense size="md" icon="file_download" padding="none"
          :label="$t('PNOdlc')" @click="dlopen"/>
        <q-space/>
        <q-btn v-if="!expandAll" dense size="sm" color="primary" icon="unfold_more" padding="none"
          :label="$t('PNOdep')" @click="tree.expandAll();expandAll=true"/>
        <q-btn v-if="expandAll" dense size="sm" color="primary" icon="unfold_less" padding="none"
          :label="$t('PNOrep')" @click="tree.collapseAll();expandAll=false"/>
        <!--q-btn class="q-ml-sm" dense size="sm" label="T1" @click="test1"/-->
      </div>
    </q-page-sticky>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import mime2ext from 'mime2ext'
import stores from '../stores/stores.mjs'
import { dkli, sty, styp, $t, u8ToB64, dhcool, difference, intersection, splitPK, edvol, afficherDiag, sleep } from '../app/util.mjs'
import ShowHtml from '../components/ShowHtml.vue'
import ApercuMotscles from '../components/ApercuMotscles.vue'
import { ID, nomFichier, appexc, AppExc } from '../app/api.mjs'
import NoteConfirme from '../dialogues/NoteConfirme.vue'
import NoteEdit from '../panels/NoteEdit.vue'
import NoteExclu from '../panels/NoteExclu.vue'
import NoteMc from '../panels/NoteMc.vue'
import NoteFichier from '../panels/NoteFichier.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import ListeAuts from '../components/ListeAuts.vue'
import NotePlus from '../components/NotePlus.vue'
// import XTest from '../components/XTest.vue'
import { RattNote } from '../app/operations.mjs'
import { putData, getData } from '../app/net.mjs'
import { getNg } from '../app/modele.mjs'

const icons = ['','person','group','group','description','article','close','close']
const colors = ['','primary','orange','negative','primary','orange','primary','orange']
const styles = [
  '',
  'titre-md text-bold', 
  'titre-md text-bold', 
  'titre-md text-bold text-italic', 
  'fs-md', 
  'fs-md',
  'fs-md text-italic text-primary',
  'fs-md text-italic text-orange'
  ]

const nbn1 = 100 // nombre de blocks de 4 * nbn2 messages sous la racine d'un avatar ou groupe
const nbn2 = 9

export default {
  name: 'PageNotes',

  components: { ShowHtml, ApercuMotscles, NoteEdit, NoteMc, NotePlus,
    NoteExclu, NoteFichier, NoteConfirme, BoutonHelp, ListeAuts },

  computed: {
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
      const r = this.nSt.map.get(''+id)
      if (n.type === 6) { 
        return this.$t('avatar9', [ids, r.label])
      }
      if (n.type === 7) {
        return this.$t('groupe9', [ids, r.label])
      }
      return ''
    },
    rattaut () { const n = this.nSt.node; return n && n.type >= 4 && n.type <= 5 }
  },

  watch: {
    selected (ap, av) {
      if (!this.nSt.node || this.nSt.node.key !== ap) {
        this.nSt.setCourant(ap)
        if (this.nSt.estGroupe) {
          const idC = this.nSt.idC
          const session = stores.session
          if (session.groupeId !== idC) session.setGroupeId(idC)
        }
      }
    }
  },

  data () {
    return {
      op: '', // suppr arch react
      icons,
      colors,
      styles,
      expandAll: false,
      rec: 0, // rattachement en cours
      noderatt: null,
      // nas: [], // test : liste des na des avatars
      // ngs: [] // test : liste des na des groupes
    }
  },

  methods: {
    nbf(node) {
      const n = node.note
      return n && n.mfa ? n.mfa.size : 0
    },
    pc (i, j) { return !i ? '' : Math.round((j * 100) / i) + '%' },

    clicknode (n) {
      if (this.rec) {
        this.rec = 2
        this.noderatt = n
      } else
        this.selected = n.key
    },

    lib (n) {
      if (n.type > 3) return n.label
      if (n.type === 1) return this.$t('avatar1', [n.label, n.nf, n.nt])
      return this.$t('groupe1', [n.label, n.nf, n.nt])
    },
 
    /*
    mapmcf (key) {
      const id = parseInt(key)
      return Motscles.mapMC(true, ID.estGroupe(id) ? id : 0)
    },
    */
    async noteedit1 () {
      if (this.nSt.note.p) {
        await afficherDiag($t('PNOarchivee'))
        return
      }
      this.ui.oD('NE')
    },

    async rattacher () {
      if (!await this.session.edit()) return
      const n = this.nSt.node.note
      this.rec = 1
      this.noderatt = null
      this.nSt.resetRatt(true) // tous OK
      this.nSt.koP(n) // exclut LE node parent, vu que la note y est, par définition, déjà rattachée
      this.nSt.koSA(this.nSt.node) // exclut le node lui-même et son sous-arbre
      if (ID.estGroupe(n.id)) {
        this.nSt.koGR(n.id)
      } else {
        this.nSt.koAV(n.id)
      }
    },

    anrattacher () { 
      this.rec = 0
      this.noderatt = null
      this.nSt.resetRatt(false)
    },

    async okrattacher () {
      const n = this.nSt.note
      const r = this.noderatt
      let rid = parseInt(r.key), refn = '', rids = 0
      if (r.type < 3) {
        // rattachement à une racine
        if (rid === n.id) rid = 0 // c'est SA racine, donc pas rattachée
      } else {
        // refn n'est défini que pour une note d'avatar référençant une note de groupe (rnom est celui du groupe)
        if (!ID.estGroupe(n.id) && ID.estGroupe(rid)) refn = r.label
        rids = r.note.ids
      }
      await new RattNote().run(n.id, n.ids, rid, rids, refn)
      this.rec = 0
      this.noderatt = null
      this.nSt.resetRatt(false)
    }

    /*
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
    },
    */

  },

  setup () {
    const tree = ref(null)
    const nSt = stores.note
    const ui = stores.ui
    const session = stores.session
    const cfg = stores.config
    const selected = ref('')
    const expanded = ref([])
    const aSt = stores.avatar
    const gSt = stores.groupe
    const fSt = stores.filtre
    const filtre = ref({})
    let dff = '1'
    const filtreFake = ref(dff)

    const now = Date.now()

    const nx = new Map()
    let nb = 0

    const lstr = ref() // liste des racines
    const lstn = [] // liste des notes restant à télécharger
    const lstrm = new Map() // donne l'indice d'une racine depuis son nom
    const dlst = ref(0) // statut du dl
    const dlnbntot = ref(0) // nombre total initial de notes à télécharger
    const dlnbnc = ref(0) // nombre restant de notes à télécharger
    const dlnc = ref() // note en cours de dl
    const dlnbn = ref(0)
    const dlnbf = ref(0)
    const dlv2f = ref(0)
    const portupload = ref()
    portupload.value = cfg.portupload
    const dirloc = ref('./temp')

    const enc = new TextEncoder()
    const dec = new TextDecoder()

    function compileFiltre (fx) {
      const f = filtre.value
      f.v2 = fx.v2 || 0
      f.note = fx.note
      f.temp = fx.temp
      f.lim = fx.nbj ? Date.now() - (86400000 * fx.nbj) : 0
      f.mcp = fx.mcp ? new Set(fx.mcp) : null
      f.mcn = fx.mcn ? new Set(fx.mcn) : null
      f.avgr = fx.avgr
      const y = '' + (parseInt(filtreFake.value) + 1)
      filtreFake.value = y
      setTimeout(() => { nSt.stats(monf)}, 50)
    }

    function monf (n) {
      const f = filtre.value
      if (f.avgr && n.id !== f.avgr) return false
      if (f.lim && n.dh && n.dh < f.lim) return false
      if (f.note && n.txt && n.txt.indexOf(f.note) === -1) return false
      if (f.v2 && n.v2 < f.v2) return false
      if (f.mcp && n.smc && difference(f.mcp, n.smc).size) return false
      if (f.mcn && n.smc && intersection(f.mcn, n.smc).size) return false
      return true
    }

    function filtrage (node) {
      const ff = filtreFake.value
      if (ff !== dff) {
        nx.clear()
        dff = ff
      }
      let r = true
      const n = node.note
      if (n) {
        const tf = nx.get(node.key)
        if (tf) {
          tf.nb++
          nx.set(node.key, tf)
          return tf.r
        } else {
          r = monf(n)
          nx.set(node.key, { nb: 1, r })
        }
      }
      return r
    }

    function preSelect () {
      if (nSt.presel) {
        selected.value = nSt.presel
        expanded.value = nSt.getAncetres(nSt.presel)
        nSt.setCourant(nSt.presel)
        nSt.presel = ''
      }
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
        if ((name === 'setNote')){
          const n = args[0]
          nx.delete(n.key)
        }
      })
    })

    nSt.$onAction(({ name, args, after }) => { 
      after(async (result) => {
        if ((name === 'setPreSelect')){
          preSelect()
        }
      })
    })

    function nf (v, id, type) {
      const s = nomFichier(v)
      let ext = ''
      if (type) {
        const x = mime2ext(type)
        if (x) ext = '.' + x
      }
      return s + (id ? '@' + id : '') + ext
    }

    function scanNode (node, rac, path, lstn) {
      if (node.type > 5) {
        // note "fake" - push de son path, pas de note
        if (node.children.length) {
          const p = path + '/' + node.label
          for (const c of node.children) scanNode (c, rac, p, lstn)
        } 
      } else {
        // c'est une vraie note
        const n = node.note
        const p2 = nf(node.label.substring(0, 32), n.ids)
        const p = path + '/' + p2
        if (filtrage(node)) {
          rac.v2 += n.v2
          rac.nbn++
          lstn.push({ r: rac.nom, p, n })
        }
        if (node.children.length) {
          for (const c of node.children) scanNode (c, rac, p, lstn)
        }
      }
    }

    function listeNotes () {
      const lr = []
      lstn.length = 0
      for (const r of nSt.nodes) {
        const nom = nf(r.label)
        const path = nom
        const rac = { nom, v2: 0, v2d: 0, nbn: 0, v1d: 0, nbnd: 0}
        for (const node of r.children) scanNode(node, rac, path, lstn)
        lr.push(rac)
      }
      dlnbntot.value = lstn.length
      dlnbnc.value = lstn.length
      lstr.value = lr
      lstrm.clear()
      for (let i = 0; i < lr.length; i++) lstrm.set(lr[i].nom, i)
    }

    async function dlopen () {
      listeNotes()
      preSelect()
      if (lstn.length) {
        dlnc.value = lstn[0]
        dlst.value = 1
        ui.oD('PNdl')
      } else {
        await afficherDiag($t('PNOdlvide'))
      }
    }

    async function testup () {
      const u = 'http://localhost:' + portupload.value + '/ping'
      try {
        const res = dec.decode(await getData(u))
        afficherDiag($t('PNOdltok', [u, res]))
      } catch (e) {
        const x = appexc(e)
        afficherDiag($t('PNOdltko', [u, x.message]))
      }
    }

    function url (u) { 
      const d = dirloc.value + '/'
      return 'http://localhost:' + portupload.value + '/' + u8ToB64(enc.encode(d + u), true) 
    }

    async function dlnote(n, avecf) {
      // console.log(n.p)
      dlnbn.value++
      const buf = enc.encode(n.n.txt)
      const u = url(n.p + '/_.md')
      const er = await putData(u, buf)
      if (er) throw new AppExc(E_WS, 6, [er])
      if (avecf) {
        for (const [idf, f] of n.n.mfa) {
          const nf = n.n.nomFichier(idf)
          const buf = await n.n.getFichier(idf)
          if (buf) {
            const u = url(n.p + '/' + nf)
            const er = await putData(u, buf)
            if (er) throw new AppExc(E_WS, 6, [er])
            else {
              dlnbf.value++
              dlv2f.value += buf.length
            }
          }
        }
      }
    }

    function dlgo (avecf) {
      dlst.value = 2
      dlnbn.value = 0
      dlnbf.value = 0
      dlv2f.value = 0

      setTimeout(async () => {
        try {
          while (lstn.length !== 0) {
            if (dlst.value !== 2) {
              await sleep(1000)
              continue
            }
            const n = lstn[0]
            dlnc.value = n
            await dlnote(n, avecf)
            const ir = lstrm.get(n.r)
            const r = lstr.value[ir]
            r.v2d += n.n.v2
            r.nbnd++
            lstn.shift()
          }
          dlst.value = 4
        } catch (e) {
          ui.afficherExc(appexc(e))
        }
      }, 50)
    }

    function dlpause () {
      dlst.value = 3
    }

    function dlreprise () {
      dlst.value = 2
    }

    function dlfin () {
      dlst.value = 0
      ui.fD()
    }

    compileFiltre(fSt.filtre.notes)

    preSelect()

    //const mapmc = ref(Motscles.mapMC(true, 0))
    //fSt.contexte.notes.mapmc = mapmc.value

    return {
      dhcool, now, filtrage, edvol,
      ID, session, ui, nSt, aSt, gSt,
      selected, expanded,
      tree,
      filtre, filtreFake,
      dlopen, dlfin, dlgo, dlpause, dlreprise, portupload, dirloc, testup,
      lstr, dlnbntot, dlnbnc, dlst, dlnc, dlnbn, dlnbf, dlv2f,
      dkli, sty, styp,
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
$hb: 18.7rem
$hb2: 17rem
.sep
  margin-top: $hb
.box2
  overflow-y: auto
  height: $hb2
.bord1
  border-top: 1px solid $grey-8 !important
  border-bottom: 1px solid $grey-8 !important
</style>
