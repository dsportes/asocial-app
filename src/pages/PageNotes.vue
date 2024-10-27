<template>
  <q-page class="column q-pl-xs">

    <q-tree ref="tree" :class="sty() + 'sep q-mb-sm splg'"
      :nodes="nodesTries"
      no-transition
      dense
      accordion
      node-key="ids"
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

    <q-dialog v-model="ui.d[idc].NE" persistent full-height position="left">
      <note-edit/>
    </q-dialog>

    <q-dialog v-model="ui.d[idc].NX" full-height position="left" persistent>
      <note-exclu/>
    </q-dialog>

    <q-dialog v-model="ui.d[idc].NF" full-height position="left" persistent>
      <note-fichier/>
    </q-dialog>

    <q-dialog v-model="ui.d[idc].NC" persistent>
      <note-confirme :op="op"/>
    </q-dialog>

    <!-- Download des notes sélectionnées -->
    <q-dialog v-model="ui.d[idc].PNdl" persistent>
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

    <q-dialog v-model="ui.d[idc].NM" persistent>
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
          <btn-cond :disable="rec!==0" class="col-auto self-start" round icon="edit" @ok="ui.oD('NE', idc)"/>
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
          <btn-cond class="col-auto self-start" round icon="attach_file" @ok="ui.oD('NF', idc)">
            <q-tooltip>{{$t('PNOattach')}}</q-tooltip>
          </btn-cond>
        </div>

        <div v-if="selected && nSt.note && !rec && nSt.estGr" class="q-mt-xs q-mb-sm row">  
          <div v-if="nSt.mbExclu" class="col titre-sm">{{$t('PNOexclu', [nSt.mbExclu.cv.nomC])}}</div>
          <div v-else class="col text-italic titre-sm">{{$t('PNOnoexclu')}}</div>
          <btn-cond class="col-auto self-start" round icon="person" @ok="ui.oD('NX', idc)">
            <q-tooltip>{{$t('PNOexclu3')}}</q-tooltip>
          </btn-cond>
        </div>

        <div v-if="selected && !rec" class="q-my-xs row q-gutter-xs justify-start items-center">
          <note-plus/>
          <btn-cond v-if="nSt.note" color="warning" icon="delete" 
            :label="$t('PNOsupp')" @ok="op='suppr';ui.oD('NC', idc)"/>
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
              @ok="okrattacher" cond="cEdit"/>
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

<script setup>
import { ref, computed, watch, onUnmounted} from 'vue'

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

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const session = stores.session
const pSt = stores.people
const gSt = stores.groupe
const cfg = stores.config
const nSt = stores.note

nSt.resetRatt(false) // tous KO
nSt.calculNfnt()

const selected = ref('')
const expanded = ref([])
const nodeDiag = ref('')
const ht = ref(new Set())
const htg = ref(new Set ())
const op = ref('') // suppr arch react
const expandAll = ref(false)
const rec = ref(0) // rattachement en cours
const noderatt = ref(null)
const lstn = ref([]) // liste des notes restant à télécharger
const dlnbntot = ref(0) // nombre total initial de notes à télécharger
const dlnbnc = ref(0) // nombre restant de notes à télécharger
const lstr = ref([]) // liste des racines
const lstrm = ref(new Map()) // donne l'indice d'une racine depuis son nom
const dlst = ref(0) // statut du dl
const dlnc = ref(null) // note en cours de dl
const dlnbn = ref(0)
const dlnbf = ref(0)
const dlv2f = ref(0)
const portupload = ref(cfg.portupload)
const dirloc = ref('./temp')

const nodesTries = computed(() => {
  const t = nSt.nodes
  t.sort((a, b) => {
    const noma = a.type + pSt.getCV(a.ids).nom
    const nomb = b.type + pSt.getCV(b.ids).nom
    return noma > nomb ? 1 : (noma < nomb ? -1 : 0)
  })
  return t
})

const estAnim = computed(() => {
  if (nSt.node.type !== 5) return false
  const e = gSt.egr(nSt.note.id)
  return e && e.estAnim
})

const presel = computed(() => nSt.presel)
const lib2 = computed(() => lib(nSt.node))
const rattaut = computed(() => { const n = nSt.node; return n && n.type >= 4 && n.type <= 5 })
const modifie = computed(() => { 
  if (!nSt.note) return false
  return !egalite(nSt.note.ht, ht.value) || (estAnim.value && !egalite(nSt.note.htg, htg.value))
})

watch(presel, (ap) => {
  if (ap) {
    selected.value = ap
    expanded.value = nSt.getAncetres(ap)
    // nSt.setCourant(ap)
    nSt.setPreSelect('')
  }
})

watch(selected, (ap, av) => {
  if (!nSt.node || nSt.node.ids !== ap) {
    nSt.setCourant(ap)
    if (nSt.estGroupe) {
      const idC = nSt.idC
      const session = stores.session
      if (session.groupeId !== idC) session.setGroupeId(idC)
    }
  }
})

const cl = (t) => t > 3 ? '' : 'cl' + t
const styn = (n) => { 
  const s1 = styles[n ? n.type : 0] 
  return s1 + (n && nSt.node && (n.ids === nSt.node.ids) ? ' msg' : '')
}

function fermer () { if (modifie.value) ui.oD('confirmFerm', idc); else ui.fD() }

const s2Str = (s) => Array.from(s).sort().join(' ')

function ovHT () {
  ht.value.clear()
  nSt.note.ht.forEach(t => { ht.value.add(t)})
  nSt.note.htg.forEach(t => { htg.value.add(t)})
  ui.oD('NM', idc)
}

async function validerHt () {
  await new HTNote().run(nSt.note, s2Str(ht.value), 
    nSt.note.deGroupe ? s2Str(htg.value) : null)
  ui.fD()
}

const nbf = (node) => {
  const n = node.note
  return n && n.mfa ? n.mfa.size : 0
}

const pc = (i, j) => !i ? '' : Math.round((j * 100) / i) + '%'

function clicknode (n) {
  nodeDiag.value = ''
  switch (rec.value) {
    case 0 : { 
      selected.value = n.ids
      return
    }
    case 1 : { 
      if (n.ratt) {
        const idas = Note.idasEdit(nSt.node)
        if (!idas.size) nodeDiag.value = $t('PNOnoedit')
        rec.value = 2
        noderatt.value = n
      }
      return
    }
    case 2 : return
  }
}

const lib = (n) => {
  const nfnt = nSt.nfnt[n.ids] || { nf: 0, nt:0 }
  switch (n.type) {
    case 1 : {
      const nom = pSt.nom(n.ids)
      return $t('avatar1', [nom, nfnt.nf, nfnt.nt])
    }
    case 2 : {
      const nom = pSt.nom(n.ids, 1)
      return $t('groupe1', [nom, nfnt.nf, nfnt.nt])
    }
    case 3 : {
      const nom = pSt.nom(n.ids, 24)
      return $t('groupe1', [nom, nfnt.nf, nfnt.nt])
    }
    case 4 : 
    case 5 : {
      const s1 = (nfnt.nt ? ('[' + nfnt.nf + ' / ' + nfnt.nt + '] ') : '') 
      const r = n.note.ref
      const s2 = r && r[0] !== n.note.id ? '(' + pSt.nom(n.note.id, 16)+ ') ' : ''
      return s1 + s2 + n.note.titre
    }
    case 6 : 
    case 7 : {
      const s1 = (nfnt.nt ? ('[' + nfnt.nf + ' / ' + nfnt.nt + '] ') : '') 
      return s1 + '#' + n.ids
    }
  }
}

const libF = (n) => {
  switch (n.type) {
    case 1 : {
      const nom = pSt.nom(n.ids)
      return $t('avatar2', [nom])
    }
    case 2 : {
      const nom = pSt.nom(n.ids, 1)
      return $t('groupe2', [nom])
    }
    case 3 : {
      const nom = pSt.nom(n.ids, 24)
      return $t('groupe2', [nom])
    }
    case 4 : 
    case 5 : {
      const r = n.note.ref
      const s2 = r && r[0] !== n.note.id ? '(' + pSt.nom(n.note.id, 16)+ ') ' : ''
      return s2 + n.note.titre
    }
    case 6 : 
    case 7 : {
      return '#' + n.ids
    }
  }
}

// Rattachement d'une note *********************************************
function rattacher () {
  rec.value = 1
  noderatt.value = null
  nSt.resetRatt(false) // tous KO
  nSt.scanTop()
}

function anrattacher () { 
  rec.value = 0
  noderatt.value = null
  nSt.resetRatt(false)
}

async function okrattacher () {
  const n = nSt.note
  const r = noderatt.value
  const pid = r.id
  const pids = r.type > 3 ? r.note.ids : null
  await new RattNote().run(n.id, n.ids, pid, pids)
  rec.value = 0
  noderatt.value = null
  nSt.resetRatt(false)
}

// Download de la sélection des notes **************************************
function nf (v, id, type) {
  const s = normNomFichier(v)
  let ext = ''
  if (type) {
    const x = mime2ext(type)
    if (x) ext = '.' + x
  }
  return s + (id ? '@' + id : '') + ext
}

function scanNode (node, rac, path, lstn) {
  const label = libF(node)
  if (node.type > 5) {
    // note "fake" - push de son path, pas de note
    if (node.children.length) {
      const p = path + '/' + label
      for (const c of node.children) scanNode(c, rac, p, lstn)
    } 
  } else {
    // c'est une vraie note
    const n = node.note
    const p2 = nf(label.substring(0, 32), n.ids)
    const p = path + '/' + p2
    if (nSt.filtrage(node)) {
      rac.v2 += n.vf
      rac.nbn++
      lstn.push({ r: rac.nom, p, n })
    }
    if (node.children.length) {
      for (const c of node.children) scanNode(c, rac, p, lstn)
    }
  }
}

function listeNotes () {
  const lr = []
  lstn.value.length = 0
  for (const r of nSt.nodes) {
    const nom = nf(libF(r))
    const path = nom
    const rac = { nom, v2: 0, v2d: 0, nbn: 0, v1d: 0, nbnd: 0}
    for (const node of r.children) scanNode(node, rac, path, lstn.value)
    lr.push(rac)
  }
  dlnbntot.value = lstn.value.length
  dlnbnc.value = lstn.value.length
  lstr.value = lr
  lstrm.value.clear()
  for (let i = 0; i < lr.length; i++) lstrm.value.set(lr[i].nom, i)
}

async function dlopen () {
  listeNotes()
  // preSelect()
  if (lstn.value.length) {
    dlnc.value = lstn.value[0]
    dlst.value = 1
    ui.oD('PNdl', idc)
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
    afficherDiag($t('PNOdltko', [u, e.message]))
  }
}

const url = (u) => { 
  const d = dirloc.value + '/'
  return 'http://localhost:' + portupload.value + '/' + u8ToB64(enc.encode(d + u), true) 
}

async function dlnote (n, avecf) {
  // console.log(n.p)
  // await sleep(2000)
  dlnbn.value++
  const buf = enc.encode(n.n.texte)
  const u = url(n.p + '/_.md')
  const er = await putData(u, buf)
  if (er) throw new AppExc(E_WS, 6, [er])
  if (avecf) {
    for (const [, f] of n.n.mfa) {
      const nf = n.n.nomFichier(f)
      const buf = await n.n.getFichier(f)
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
      while (lstn.value.length !== 0) {
        if (dlst.value !== 2) {
          await sleep(1000)
          continue
        }
        const n = lstn.value[0]
        dlnc.value = n
        await dlnote(n, avecf)
        const ir = lstrm.value.get(n.r)
        const r = lstr.value[ir]
        r.v2d += n.n.v2
        r.nbnd++
        lstn.value.shift()
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

</script>

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
