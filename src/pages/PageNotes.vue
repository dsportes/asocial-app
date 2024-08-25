<template>
  <q-page class="column q-pl-xs">

    <q-tree ref="tree" :class="sty() + 'sep q-mb-sm splg'"
      :nodes="nodesTries"
      no-transition
      dense
      accordion
      node-key="key"
      selected-color="primary"
      v-model:selected="selected"
      v-model:expanded="expanded"
      :filter="nSt.filtre.v"
      :filter-method="nSt.filtrage"
    >
      <template v-slot:default-header="prop">
        <div @click.stop="clicknode(prop.node)" @keypress.stop="clicknode(prop.node)" 
          :class="cl(prop.node.type)">
          <div class="row items-center">
            <q-icon v-if="prop.node.ratt" size="xs" class="col-auto q-mr-xs cursor-pointer" name="star"
              color="green-5"/>
            <q-icon :name="icons[prop.node.type]" :color="colors[prop.node.type]"
              size="sm" class="col-auto q-mr-xs"/>
            <q-icon v-if="prop.node.type === 3 || prop.node.type > 5" class="col-auto q-mr-xs"
              name="close" color="negative" size="sm"/>
            <q-icon v-if="nbf(prop.node)" name="attachment" class="col-auto q-mr" color="orange" size="sm"/>
            <q-badge v-if="nbf(prop.node)" class="col-auto q-mr-xs" color="orange" rounded 
              :label="nbf(prop.node)" text-color="black"/>
            <div :class="'col ' + styn(prop.node)">{{lib(prop.node)}}</div>
          </div>
        </div>
      </template>
    </q-tree>

    <note-edit v-if="ui.d.NE"/>
    <note-exclu v-if="ui.d.NX"/>
    <note-fichier v-if="ui.d.NF"/>
    <note-confirme v-if="ui.d.NC" :op="op"/>

    <!-- Download des notes sélectionnées -->
    <q-dialog v-model="ui.d.PNdl" persistent>
      <q-card :class="styp('md')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="dlfin"/>
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
            <btn-cond dense :label="$t('test')" @ok="testup"/>
          </div>
        </q-card-section>

        <q-card-actions v-if="dlst===1" vertical align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="start" :label="$t('PNOdlst1')" @ok="dlgo(true)"/>
          <btn-cond icon="start" :label="$t('PNOdlst2')" @ok="dlgo(false)"/>
        </q-card-actions>

        <q-card-actions v-if="dlst=== 2 && dlst === 3" vertical align="right" class="q-gutter-sm">
          <btn-cond color="warning" icon="stop_circle" :label="$t('PNOdls')" @ok="dlfin"/>
          <btn-cond v-if="dlst===2" icon="pause_circle" :label="$t('PNOdlp')" @ok="dlpause"/>
          <btn-cond v-if="dlst===3" icon="play_circle" :label="$t('PNOdlr')" @ok="dlreprise"/>
        </q-card-actions>

        <div v-if="dlst===4" class="column q-gutter-sm">
          <div class="self-center titre-lg text-bold text-italic">{{$t('PNOdlok1')}}</div>
          <div class="self-center titre-lg text-bold">{{$t('PNOdlok2', [dlnbn, dlnbf, dlv2f])}}</div>
          <div class="self-center titre-md text-italic">{{$t('PNOdlok3')}}</div>
          <btn-cond class="self-center q-mb-md" flat icon="check" size="lg" :label="$t('jailu')" @ok="ui.fD"/>
        </div>
      </q-card>
    </q-dialog>

    <q-dialog v-model="ui.d.NM" persistent>
      <div :class="styp('md')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="chevron_left" @ok="fermer"/>
          <q-toolbar-title class="titre-lg full-width text-center">
            {{$t('PNOht0')}}
          </q-toolbar-title>
          <btn-cond icon="check" :label="$t('valider')" cond="cEdit"
            :disable="!modifie"  @ok="validerHt"/>
          <bouton-help page="page1"/>
        </q-toolbar>
      
        <hash-tags v-model="ht" :src="nSt.note.ht" :titre="$t('PNOht1')"/>

        <hash-tags v-if="nSt.note.deGroupe && estAnim" v-model="htg" :src="nSt.note.htg" :titre="$t('PNOht2')"/>

        <q-card v-if="nSt.note.deGroupe && !estAnim">
          <div v-if="nSt.note.htg.size" class="row q-gutter-xs q-ma-sm">
            <span class="text-italic">{{$t('PNOht2')}} : </span>
            <span v-for="ht of nSt.note.htg" :key="ht">{{ht}}</span>
          </div>
          <div v-else class="text-italic">{{$t('PNOht3')}}</div>
        </q-card>
      </div>
    </q-dialog>

    <q-page-sticky expand position="top" class="splg">
      <div :class="sty() + ' box2 full-width q-pa-xs'">
        <div v-if="!selected" class="q-ml-xs titre-md text-italic">{{$t('PNOnosel')}}</div>
        
        <div v-if="selected" class="row justify-between">
          <div class="titre-md">{{lib2}}</div>
          <div v-if="nSt.note" class="col-auto font-mono fs-sm">
            <span v-if="nSt.node && nSt.node.note" class="q-mr-xs font-mono fs-sm">#{{nSt.node.note.shIds}}</span>
            <span class="q-mr-sm">({{edvol(nSt.note.texte.length)}})</span>
            <span>{{dhcool(nSt.note.d)}}</span>
          </div>
          <div v-if="nSt.node.type === 3" class="titre-md text-italic text-bold">
            {{$t('PNOtype3')}}</div>
          <div v-if="nSt.node.type === 6 || nSt.node.type === 7" class="titre-md text-italic text-bold">
            {{$t('PNOtype67')}}</div>
        </div>

        <div v-if="selected && nSt.note" class="q-ml-md row"> 
          <show-html class="col bord1 q-mr-lg" :texte="nSt.note.texte" zoom maxh="4rem" />
          <btn-cond :disable="rec!==0" class="col-auto self-start" round icon="edit" @ok="ui.oD('NE')"/>
        </div>

        <liste-auts v-if="selected && nSt.note && nSt.estGr"/>

        <div v-if="selected && nSt.note && !rec" class="q-my-sm row justify-between"> 
          <div class="col row q-gutter-xs">
            <span class="text-italic">{{$t('hashtags')}} : </span>
            <span v-for="ht of nSt.note.tousHt" :key="ht">{{ht}}</span>
          </div>
          <btn-cond class="col-auto self-start" round icon="edit" @ok="ovHT"/>
        </div>

        <div v-if="selected && nSt.note && !rec" class="q-my-sm row justify-between">  
          <div class="col titre-sm">
            <span :class="!nSt.note.mfa.size ? 'text-italic': ''">
              {{$t('PNOnf', nSt.note.mfa.size, {count: nSt.note.mfa.size})}}
            </span>
            <span class="q-ml-xs">{{nSt.note.mfa.size ? (edvol(nSt.note.vf) + '.') : ''}}</span>
          </div>
          <btn-cond class="col-auto self-start" round icon="attach_file" @ok="ui.oD('NF')">
            <q-tooltip>{{$t('PNOattach')}}</q-tooltip>
          </btn-cond>
        </div>

        <div v-if="selected && nSt.note && !rec && nSt.estGr" class="q-mt-xs q-mb-sm row">  
          <div v-if="nSt.mbExclu" class="col titre-sm">{{$t('PNOexclu', [nSt.mbExclu.cv.nomC])}}</div>
          <div v-else class="col text-italic titre-sm">{{$t('PNOnoexclu')}}</div>
          <btn-cond class="col-auto self-start" round icon="person" @ok="ui.oD('NX')">
            <q-tooltip>{{$t('PNOexclu3')}}</q-tooltip>
          </btn-cond>
        </div>

        <div v-if="selected && !rec" class="q-my-xs row q-gutter-xs justify-start items-center">
          <note-plus/>
          <btn-cond v-if="nSt.note" color="warning" icon="delete" 
            :label="$t('PNOsupp')" @ok="op='suppr';ui.oD('NC')"/>
          <btn-cond v-if="rattaut" icon="account_tree" :label="$t('PNOratt')" 
            cond="cEdit" @ok="rattacher"/>
        </div>

        <div v-if="selected && nSt.note && rec===1" class="q-ma-sm">
          <q-separator color="orange" size="2px" class="q-mb-xs"/>
          <div class="titre-md text-italic">{{$t('PNOrattpos', nSt.nbRatt, {count: nSt.nbRatt})}}</div>
          <div v-if="nSt.nbRatt" class="msg">{{$t('PNOrattinfo')}}</div>
          <div class="q-mt-sm row">
            <btn-cond icon="undo" :label="$t('PNOanratt')" @ok="anrattacher"/>
          </div>
        </div>

        <div v-if="selected && nSt.note && rec===2" class="q-ma-sm">
          <q-separator color="orange" size="2px" class="q-mb-xs"/>
          <div v-if="!nodeDiag">
            <span class="q-pa-xs text-italic titre-md q-mr-md">{{$t('PNOratta')}}</span>
            <span class="msg">{{lib(noderatt)}}</span>
          </div>
          <div v-if="nodeDiag" class="msg">{{nodeDiag}}</div>
          <div class="q-mt-sm row q-gutter-sm">
            <btn-cond v-if="!nodeDiag" icon="check" :label="$t('PNOcfratt')" color="warning" 
              @click="okrattacher" cond="cEdit"/>
            <btn-cond icon="account_tree" :label="$t('PNOratt2')" @ok="rattacher"/>
            <btn-cond icon="undo" :label="$t('PNOanratt')" @ok="anrattacher"/>
          </div>
        </div>
      </div>
          
      <div class="row full-width bg-secondary text-white items-center justify-between">
        <btn-cond class="q-mr-sm" flat icon="file_download" color="white" :label="$t('PNOdlc')" @ok="dlopen"/>
        <btn-cond v-if="!expandAll" size="sm" icon="unfold_more"
          :label="$t('PNOdep')" @ok="tree.expandAll();expandAll=true"/>
        <btn-cond v-if="expandAll" size="sm" icon="unfold_less"
          :label="$t('PNOrep')" @ok="tree.collapseAll();expandAll=false"/>
      </div>
    </q-page-sticky>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import mime2ext from 'mime2ext'
import stores from '../stores/stores.mjs'
import { dkli, sty, styp, $t, u8ToB64, dhcool, edvol, afficherDiag, 
  sleep, egalite, normNomFichier } from '../app/util.mjs'
import ShowHtml from '../components/ShowHtml.vue'
import { ID, appexc, AppExc } from '../app/api.mjs'
import NoteConfirme from '../dialogues/NoteConfirme.vue'
import NoteEdit from '../panels/NoteEdit.vue'
import NoteExclu from '../panels/NoteExclu.vue'
import NoteFichier from '../panels/NoteFichier.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import ListeAuts from '../components/ListeAuts.vue'
import NotePlus from '../components/NotePlus.vue'
import HashTags from '../components/HashTags.vue'
import { RattNote, HTNote } from '../app/operations4.mjs'
import { Note } from '../app/modele.mjs'
import { putData, getData } from '../app/net.mjs'

const icons = ['','person','group','group','description','article','description','article']
const colors = ['','primary','orange','grey-5','primary','orange','grey-5','grey-5']
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

const enc = new TextEncoder()
const dec = new TextDecoder()

export default {
  name: 'PageNotes',

  components: { ShowHtml, NoteEdit, NotePlus, BtnCond, HashTags,
    NoteExclu, NoteFichier, NoteConfirme, BoutonHelp, ListeAuts },

  computed: {
    nodesTries () {
      const t = this.nSt.nodes
      t.sort((a, b) => {
        const noma = a.type + this.pSt.getCV(a.ids).nom
        const nomb = b.type + this.pSt.getCV(b.ids).nom
        return noma > nomb ? 1 : (noma < nomb ? -1 : 0)
      })
      return t
    },

    estAnim () {
      if (this.nSt.node.type !== 5) return false
      const e = this.gSt.egr(this.nSt.note.id)
      return e && e.estAnim
    },

    presel () {  return this.nSt.presel },

    lib2 () { return this.lib(this.nSt.node) },

    rattaut () { const n = this.nSt.node; return n && n.type >= 4 && n.type <= 5 },

    modifie () { 
      if (!this.nSt.note) return false
      return !egalite(this.nSt.note.ht, this.ht) || (this.estAnim && !egalite(this.nSt.note.htg, this.htg))
    }
  },

  watch: {
    presel (ap) {
      if (ap) {
        this.selected = ap
        this.expanded = this.nSt.getAncetres(ap)
        // this.nSt.setCourant(ap)
        this.nSt.setPreSelect('')
      }
    },

    selected (ap, av) {
      if (!this.nSt.node || this.nSt.node.ids !== ap) {
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
      selected: '',
      expanded: [],
      nodeDiag: '',

      ht: new Set(),
      htg: new Set (),

      op: '', // suppr arch react
      expandAll: false,
      rec: 0, // rattachement en cours
      noderatt: null,
      lstn: [], // liste des notes restant à télécharger
      dlnbntot: 0, // nombre total initial de notes à télécharger
      dlnbnc: 0, // nombre restant de notes à télécharger
      lstr: [], // liste des racines
      lstrm: new Map(), // donne l'indice d'une racine depuis son nom
      dlst: 0, // statut du dl
      dlnc: null, // note en cours de dl
      dlnbn: 0,
      dlnbf: 0,
      dlv2f: 0,
      portupload: this.cfg.portupload,
      dirloc: './temp'
    }
  },

  methods: {
    cl (t) { return t > 3 ? '' : 'cl' + t },

    styn (n) { const s1 = styles[n ? n.type : 0] 
      return s1 + (n && this.nSt.node && (n.ids === this.nSt.node.ids) ? ' msg' : '')
    },

    fermer () { if (this.modifie) this.ui.oD('confirmFerm'); else this.ui.fD() },

    s2Str (s) { return Array.from(s).sort().join(' ')},

    ovHT () {
      this.ht.clear()
      this.nSt.note.ht.forEach(t => { this.ht.add(t)})
      this.nSt.note.htg.forEach(t => { this.htg.add(t)})
      this.ui.oD('NM')
    },
  
    async validerHt () {
      await new HTNote().run(this.nSt.note, this.s2Str(this.ht), 
        this.nSt.note.deGroupe ? this.s2Str(this.htg) : null)
      this.ui.fD()
    },

    nbf(node) {
      const n = node.note
      return n && n.mfa ? n.mfa.size : 0
    },
    pc (i, j) { return !i ? '' : Math.round((j * 100) / i) + '%' },

    clicknode (n) {
      this.nodeDiag = ''
      switch (this.rec) {
        case 0 : { this.selected = n.ids; return }
        case 1 : { 
          if (n.ratt) {
            const idas = Note.idasEdit(this.nSt.node)
            if (!idas.size) this.nodeDiag = this.$t('PNOnoedit')
            this.rec = 2
            this.noderatt = n
          }
          return }
        case 2 : { return }
      }
    },
 
    lib (n) {
      const nfnt = this.nSt.nfnt[n.ids] || { nf: 0, nt:0 }
      switch (n.type) {
        case 1 : {
          const nom = this.pSt.nom(n.ids)
          return this.$t('avatar1', [nom, nfnt.nf, nfnt.nt])
        }
        case 2 : {
          const nom = this.pSt.nom(n.ids, 1)
          return this.$t('groupe1', [nom, nfnt.nf, nfnt.nt])
        }
        case 3 : {
          const nom = this.pSt.nom(n.ids, 24)
          return this.$t('groupe1', [nom, nfnt.nf, nfnt.nt])
        }
        case 4 : 
        case 5 : {
          const s1 = (nfnt.nt ? ('[' + nfnt.nf + ' / ' + nfnt.nt + '] ') : '') 
          const r = n.note.ref
          const s2 = r && r[0] !== n.note.id ? '(' + this.pSt.nom(n.note.id, 16)+ ') ' : ''
          return s1 + s2 + n.note.titre
        }
        case 6 : 
        case 7 : {
          const s1 = (nfnt.nt ? ('[' + nfnt.nf + ' / ' + nfnt.nt + '] ') : '') 
          return s1 + '#' + n.ids
        }
      }
    },

    libF (n) {
      switch (n.type) {
        case 1 : {
          const nom = this.pSt.nom(n.ids)
          return this.$t('avatar2', [nom])
        }
        case 2 : {
          const nom = this.pSt.nom(n.ids, 1)
          return this.$t('groupe2', [nom])
        }
        case 3 : {
          const nom = this.pSt.nom(n.ids, 24)
          return this.$t('groupe2', [nom])
        }
        case 4 : 
        case 5 : {
          const r = n.note.ref
          const s2 = r && r[0] !== n.note.id ? '(' + this.pSt.nom(n.note.id, 16)+ ') ' : ''
          return s2 + n.note.titre
        }
        case 6 : 
        case 7 : {
          return '#' + n.ids
        }
      }
    },

    // Rattachement d'une note *********************************************
    async rattacher () {
      this.rec = 1
      this.noderatt = null
      this.nSt.resetRatt(false) // tous KO
      this.nSt.scanTop()
    },

    anrattacher () { 
      this.rec = 0
      this.noderatt = null
      this.nSt.resetRatt(false)
    },

    async okrattacher () {
      const n = this.nSt.note
      const r = this.noderatt
      const rid = r.id
      const rids = r.type > 3 ? r.note.ids : 0
      await new RattNote().run(n.id, n.ids, [rid, rids])
      this.rec = 0
      this.noderatt = null
      this.nSt.resetRatt(false)
    },

    // Download de la sélection des notes **************************************
    nf (v, id, type) {
      const s = normNomFichier(v)
      let ext = ''
      if (type) {
        const x = mime2ext(type)
        if (x) ext = '.' + x
      }
      return s + (id ? '@' + id : '') + ext
    },

    scanNode (node, rac, path, lstn) {
      const label = this.libF(node)
      if (node.type > 5) {
        // note "fake" - push de son path, pas de note
        if (node.children.length) {
          const p = path + '/' + label
          for (const c of node.children) this.scanNode(c, rac, p, lstn)
        } 
      } else {
        // c'est une vraie note
        const n = node.note
        const p2 = this.nf(label.substring(0, 32), n.ids)
        const p = path + '/' + p2
        if (this.nSt.filtrage(node)) {
          rac.v2 += n.vf
          rac.nbn++
          lstn.push({ r: rac.nom, p, n })
        }
        if (node.children.length) {
          for (const c of node.children) this.scanNode(c, rac, p, lstn)
        }
      }
    },

    listeNotes () {
      const lr = []
      this.lstn.length = 0
      for (const r of this.nSt.nodes) {
        const nom = this.nf(this.libF(r))
        const path = nom
        const rac = { nom, v2: 0, v2d: 0, nbn: 0, v1d: 0, nbnd: 0}
        for (const node of r.children) this.scanNode(node, rac, path, this.lstn)
        lr.push(rac)
      }
      this.dlnbntot = this.lstn.length
      this.dlnbnc = this.lstn.length
      this.lstr = lr
      this.lstrm.clear()
      for (let i = 0; i < lr.length; i++) this.lstrm.set(lr[i].nom, i)
    },

    async dlopen () {
      this.listeNotes()
      // preSelect()
      if (this.lstn.length) {
        this.dlnc = this.lstn[0]
        this.dlst = 1
        this.ui.oD('PNdl')
      } else {
        await afficherDiag($t('PNOdlvide'))
      }
    },

    async testup () {
      const u = 'http://localhost:' + this.portupload + '/ping'
      try {
        const res = dec.decode(await getData(u))
        afficherDiag($t('PNOdltok', [u, res]))
      } catch (e) {
        afficherDiag($t('PNOdltko', [u, e.message]))
      }
    },

    url (u) { 
      const d = this.dirloc + '/'
      return 'http://localhost:' + this.portupload + '/' + u8ToB64(enc.encode(d + u), true) 
    },

    async dlnote (n, avecf) {
      // console.log(n.p)
      // await sleep(2000)
      this.dlnbn++
      const buf = enc.encode(n.n.texte)
      const u = this.url(n.p + '/_.md')
      const er = await putData(u, buf)
      if (er) throw new AppExc(E_WS, 6, [er])
      if (avecf) {
        for (const [, f] of n.n.mfa) {
          const nf = n.n.nomFichier(f)
          const buf = await n.n.getFichier(f)
          if (buf) {
            const u = this.url(n.p + '/' + nf)
            const er = await putData(u, buf)
            if (er) throw new AppExc(E_WS, 6, [er])
            else {
              this.dlnbf++
              this.dlv2f += buf.length
            }
          }
        }
      }
    },

    dlgo (avecf) {
      this.dlst = 2
      this.dlnbn = 0
      this.dlnbf = 0
      this.dlv2f = 0

      setTimeout(async () => {
        try {
          while (this.lstn.length !== 0) {
            if (this.dlst !== 2) {
              await sleep(1000)
              continue
            }
            const n = this.lstn[0]
            this.dlnc = n
            await this.dlnote(n, avecf)
            const ir = this.lstrm.get(n.r)
            const r = this.lstr[ir]
            r.v2d += n.n.v2
            r.nbnd++
            this.lstn.shift()
          }
          this.dlst = 4
        } catch (e) {
          this.ui.afficherExc(appexc(e))
        }
      }, 50)
    },

    dlpause () {
      this.dlst = 3
    },

    dlreprise () {
      this.dlst = 2
    },

    dlfin () {
      this.dlst = 0
      this.ui.fD()
    }
  },

  setup () {
    const nSt = stores.note
    nSt.resetRatt(false) // tous KO
    nSt.calculNfnt()

    return {
      tree: ref(null),
      session: stores.session, 
      ui: stores.ui, 
      pSt: stores.people, 
      gSt: stores.groupe, 
      cfg: stores.config,
      nSt,
      dhcool, edvol, dkli, sty, styp, ID, icons, colors, styles
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
.bord
  padding: 1px
  margin: 1px
  border: 1px solid $grey-5
  border-radius: 5px
.cl1,.cl2,.cl3
  margin-top: 15px
  width: 100%
.cl1
  border-top: 3px solid $primary
.cl2
  border-top: 3px solid $orange
.cl3
  border-top: 3px solid $grey-5
</style>
