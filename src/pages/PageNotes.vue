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
      :filter-method="nSt.filtrage2"
    >
      <template v-slot:default-header="prop">
        <div :class="cl(prop.node.type) + ' row full-width justify-between items-start'">
          <div class="col-11 row items-center cursor-pointer" 
            @click.stop="clicknode(prop.node)" @keypress.stop="clicknode(prop.node)">
            <q-icon :name="icons[prop.node.type]" :color="colors[prop.node.type]"
              size="sm" class="col-auto q-mr-xs"/>
            <q-icon v-if="prop.node.type === 3 || prop.node.type > 5" class="col-auto q-mr-xs"
              name="close" color="negative" size="sm"/>
            <q-icon v-if="nbf(prop.node)" name="attachment" class="col-auto q-mr" color="orange" size="sm"/>
            <q-badge v-if="nbf(prop.node)" class="col-auto q-mr-xs" color="orange" rounded 
              :label="nbf(prop.node)" text-color="black"/>
            <q-icon v-if="!prop.node.filx" size="xs" class="col-auto q-mr-xs" name="check"
              color="warning"/>
            <div :class="'col ' + styn(prop.node)">{{lib(prop.node)}}</div>
          </div>
          <div class="col-1 row justify-end">
            <btn-cond v-if="prop.node.ratt" icon="star"
              color="green-5" stop @ok="clicketoile(prop.node)"/>
            <btn-cond v-if="!rec" flat icon="more_vert" stop>
              <q-menu>
                <q-list class="sombre1 text-white menu">
                  <q-item v-if="session.cEdit">
                    <q-item-section class="text-italic text-bold">{{$t(session.cEdit)}}</q-item-section>
                  </q-item>

                  <q-item clickable v-close-popup @click.stop="ovAlbum(prop.node)">
                    <div class="row q-gutter-sm items-center mi">
                      <q-icon size="md" name="photo_album"/> 
                      <span>{{$t('PNOalbum')}}</span>
                    </div>
                  </q-item>

                  <q-item v-if="!session.cEdit && prop.node.type > 3" 
                    clickable v-close-popup @click.stop="rattacher(prop.node)">
                    <div class="row q-gutter-sm items-center mi">
                      <q-icon size="md" name="account_tree"/>
                      <span>{{$t('PNOratt')}}</span>
                    </div>
                  </q-item>

                  <q-separator />
                  <div v-if="!session.cEdit">
                    <q-item v-if="!session.cEdit" class="text-italic">{{$t('PNOnvnote')}}</q-item>
                    <q-item v-for="av of lav(prop.node)" :key="av.id"
                      clickable v-close-popup @click.stop="okav(prop.node, av.id)">
                      <div class="row q-gutter-sm items-center mi">
                        <q-icon size="md" name="control_point" color="primary"/>
                        <span>{{av.nom}}</span>
                      </div>
                    </q-item>
                    <q-item v-if="!estAv(prop.node)" clickable v-close-popup 
                      @click.stop="okgr(prop.node, prop.node.id)">
                      <div class="row q-gutter-sm items-center mi">
                        <q-icon size="md" name="control_point" color="secondary"/>
                        <span>{{nom(prop.node)}}</span>
                      </div>
                    </q-item>
                  </div>
                  <div v-else class="text-italic">{{$t('PNOnonvnote', [$t(session.cEdit)])}}</div>
                  <!--note-plus v-if="!nSt.estFake" v-model="selected" :node="prop.node"/-->
                </q-list>
              </q-menu>
            </btn-cond>
          </div>
        </div>
      </template>
    </q-tree>

    <!-- Edition du texte de la note -->
    <q-dialog v-model="ui.d[idc].ND" position="left" persistent>
      <note-detail/>
    </q-dialog>

    <!-- Album de photo de la note et ses descendantes -->
    <q-dialog v-model="ui.d[idc].AP" position="left" persistent>
      <album-photos :lstPhotos="lstPhotos" @select="clicknode"/>
    </q-dialog>

    <!-- Dialogue de download des notes sélectionnées -->
    <q-dialog v-model="ui.d[idc].PNdl" persistent>
      <q-card :class="styp('md')">
        <q-toolbar class="tbs">
          <btn-cond color="warning" icon="close" @ok="dlfin"/>
          <q-toolbar-title class="titre-lg full-width text-center">
            {{$t('PNOdlc')}}
          </q-toolbar-title>
          <bouton-help page="dial_notedl"/>
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
            <div class="q-ml-md q-mb-sm spsm">
              <div class="titre-md text-italic ncp">{{$t('PNOdlpath', [dlnc.p])}}</div>
              <div class="row">
                <span class="col-6 titre-md text-italic">{{$t('PNOdlv12')}}</span>
                <span class="col-2 fs-md font-mono">{{dlvx}}B</span>
                <span class="col-2 fs-md font-mono">{{dlnc.n.vf}}B</span>
                <span class="col-2 fs-md font-mono">{{pc(dlnc.n.vf, dlvx)}}</span>
              </div>
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

        <q-card-actions v-if="dlst === 2" vertical align="center" class="q-gutter-sm">
          <btn-cond color="warning" icon="stop_circle" :label="$t('PNOdls')" @ok="dlfin"/>
          <btn-cond v-if="dlst===2" icon="pause_circle" :label="$t('PNOdlp')" @ok="dlpause"/>
        </q-card-actions>

        <q-card-actions v-if="dlst === 3" vertical align="center" class="q-gutter-sm">
          <div class="titre-md msg q-my-sm full-width">{{$t('PNOpause' + dlstp)}}</div>
          <btn-cond color="warning" icon="stop_circle" :label="$t('PNOdls')" @ok="dlfin"/>
          <btn-cond v-if="dlst===3" icon="play_circle" :label="$t('PNOdlr')" @ok="dlreprise"/>
        </q-card-actions>

        <div v-if="dlst === 4" class="column q-gutter-sm">
          <div class="self-center titre-lg text-bold text-italic">{{$t('PNOdlok1')}}</div>
          <div class="self-center titre-lg text-bold">{{$t('PNOdlok2', [dlnbn, dlnbf, dlv2f])}}</div>
          <div class="self-center titre-md text-italic">{{$t('PNOdlok3')}}</div>
          <btn-cond class="self-center q-mb-md" flat icon="check" size="lg" :label="$t('jailu')" @ok="ui.fD"/>
        </div>
      </q-card>
    </q-dialog>

    <!-- Dialogue de création d'une nouvelle note -->
    <q-dialog v-model="ui.d[idc].NNnotenouvelle" position="left" persistent>
      <note-nouvelle
        :estgr="estgr" 
        :groupe="estgr ? groupex : null" 
        :avatar="avatarx" 
        :notep="nSt.node.note"/>
    </q-dialog>

    <q-page-sticky expand position="top" class="splg">
      <div :class="sty() + ' box2 full-width q-pa-xs'">
        <div class="row q-gutter-xs items-center">
          <btn-cond v-if="!rec" 
            icon="photo_album" :label="$t('PNOalbum')" @ok="ovAlbumG()"/>
          <btn-cond v-if="!expandAll" size="md" icon="unfold_more"
            :label="$t('PNOdep')" @ok="tree.expandAll();expandAll=true"/>
          <btn-cond v-if="expandAll" size="md" icon="unfold_less"
            :label="$t('PNOrep')" @ok="tree.collapseAll();expandAll=false"/>
          <btn-cond v-if="rec" icon="undo" color="warning"
            :label="$t('PNOanratt')" @ok="anrattacher"/>
          <btn-cond class="q-mr-sm" flat icon="file_download" color="white" 
            :label="$t('PNOdlc')" @ok="dlopen"/>
        </div>

        <div v-if="rec" class="q-pa-md">
          <div class="titre-md">{{$t('PNOrattinfo')}}</div>
          <div>
            <span class="titre.md">{{$t('PNOrattpos', [setRatt.size])}}</span>
            <btn-cond v-if="setRatt.size > maxRatt" icon="unfold_more" color="primary"
              :label="$t('PNOdepratt')" @ok="depRatt"/>
          </div>
        </div>

        <apercu-genx v-if="!rec && selected && nSt.node.type <= 3" :id="nSt.node.id" />

      </div>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, watch, onUnmounted} from 'vue'

import mime2ext from 'mime2ext'
import stores from '../stores/stores.mjs'
import { dkli, sty, styp, $t, u8ToB64, dhcool, edvol, afficherDiag, 
  sleep, normNomFichier } from '../app/util.mjs'
import ShowHtml from '../components/ShowHtml.vue'
import { appexc, AppExc, E_WS } from '../app/api.mjs'
import NoteEdit from '../panels/NoteEdit.vue'
import NoteDetail from '../panels/NoteDetail.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import ListeAuts from '../components/ListeAuts.vue'
import NoteNouvelle from '../panels/NoteNouvelle.vue'
import NotePlus from '../components/NotePlus.vue'
import HashTags from '../components/HashTags.vue'
import NoteExclu from '../panels/NoteExclu.vue'
import NoteFichier from '../panels/NoteFichier.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import AlbumPhotos from '../panels/AlbumPhotos.vue'
import { RattNote, HTNote, SupprNote } from '../app/operations4.mjs'
import { Note } from '../app/modele.mjs'
import { putData, getData } from '../app/net.mjs'

const ralentissement = 200

const icons = ['','person','group','group','description','article','description','article']
const colors = ['','primary','secondary','grey-5','primary','secondary','grey-5','grey-5']
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

const maxRatt = 4

const enc = new TextEncoder()
const dec = new TextDecoder()

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const session = stores.session
const pSt = stores.people
const aSt = stores.avatar
const gSt = stores.groupe
const cfg = stores.config
const nSt = stores.note

nSt.resetRatt(false) // tous KO
nSt.calculNfnt()

const tree = ref(null)
const selected = ref('')
const expanded = ref([])
const setRatt = ref(new Set())

// const op = ref('') // suppr
const expandAll = ref(false)
const rec = ref(false) // rattachement en cours

const lstn = ref([]) // liste des notes restant à télécharger
const dlnbntot = ref(0) // nombre total initial de notes à télécharger
const dlnbnc = ref(0) // nombre restant de notes à télécharger
const lstr = ref([]) // liste des racines
const lstrm = ref(new Map()) // donne l'indice d'une racine depuis son nom
const dlst = ref(0) // statut du dl
const dlstp = ref(0) // sous-statut en pause
const dlnc = ref(null) // note en cours de dl
const dlnbn = ref(0)
const dlnbf = ref(0)
const dlv2f = ref(0)
const dlvx = ref(0)
const portupload = ref(cfg.portupload)
const dirloc = ref($t('PNOdirloc'))
const lstPhotos = ref()

const estAv = (n) => n.type === 1 || n.type === 4
const nom = (n) => session.getCV(n.id).nom
const lav = (n) =>  estAv(n) ? [{ nom: nom(n), id: n.id}] : session.compte.lstAvatars

const nbf = (node) => {
  const n = node.note
  return n && n.mfa ? n.mfa.size : 0
}

const estAnim = computed(() => { const e = nSt.note ? gSt.egr(nSt.note.id) : null; return e && e.estAnim })

const photos = computed(() => {
  const l = []
  nSt.photos(nSt.node, l)
  return l
})

const estgr = ref(false)
const groupex = ref(null)
const avatarx = ref(null)

async function okgr (n, id) {
  selected.value = n.ids
  nSt.setCourant(n.ids)
  groupex.value = gSt.egr(id).groupe
  const diag = groupex.value && !groupex.value.aUnAccesEcrNote ? 'PNOroEcr' : ''
  if (diag) {
    await afficherDiag($t(diag))
    return
  }
  estgr.value = true
  ui.oD('NNnotenouvelle', idc)
}

async function okav (n, id) {
  selected.value = n.ids
  nSt.setCourant(n.ids)
  avatarx.value = aSt.getElt(id).avatar
  estgr.value = false
  ui.oD('NNnotenouvelle', idc)
}

async function ovAlbum (n) {
  selected.value = n.ids
  nSt.setCourant(n.ids)
  lstPhotos.value = photos.value
  if (!lstPhotos.value.length) await afficherDiag($t('PNOnoph'))
  else ui.oD('AP', idc)
}

async function ovAlbumG (n) {
  selected.value = ''
  nSt.setCourant(null)
  lstPhotos.value = photos.value
  if (!lstPhotos.value.length) await afficherDiag($t('PNOnoph'))
  else ui.oD('AP', idc)
}

const nodesTries = computed(() => {
  const t = nSt.nodes
  t.sort((a, b) => {
    const noma = a.type + pSt.getCV(a.ids).nom
    const nomb = b.type + pSt.getCV(b.ids).nom
    return noma > nomb ? 1 : (noma < nomb ? -1 : 0)
  })
  return t
})

const presel = computed(() => nSt.presel)
const lib2 = computed(() => lib(nSt.node))
const rattaut = computed(() => { const n = nSt.node; return n && n.type >= 4 && n.type <= 5 })

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

const pc = (i, j) => !i ? '-' : Math.round((j * 100) / i) + '%'

const selectN = (n) => {
  if (!n || (n.type === 1 && selected.value === n.ids)) {
    selected.value = ''
    nSt.setCourant(null)
  } else { 
    selected.value = n.ids
    nSt.setCourant(n.ids)
  }
}

function clicknode (n, menu) {
  if (!rec.value) {
    selectN(n)
    if (n.type > 3 && !menu) ui.oD('ND', idc)
    return
  }
}

/*
function menuRatt (n) {
  rec.value = 2
  noderatt.value = n
}
*/

async function clicketoile (r) {
  if (r.ratt) {
    const idas = Note.idasEdit(r)
    if (!idas.size) {
      await afficherDiag($t('PNOnoedit'))
      rec.value = false
      return
    }
    const n = nSt.node
    const pid = r.id
    const pids = r.type > 3 ? r.note.ids : null
    await new RattNote().run(n.id, n.ids, pid, pids)
    rec.value = false
    nSt.resetRatt(false)
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
      // const nom = pSt.nom(n.ids, 24)
      const s1 = (nfnt.nt ? ('[' + nfnt.nf + ' / ' + nfnt.nt + '] ') : '') 
      return $t('ghost', [s1 + '#' + n.ids])
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
      return $t('ghostn', [s1 + '#' + n.ids])
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
async function rattacher (n) {
  selectN(n)
  rec.value = true
  nSt.resetRatt(false) // tous KO
  setRatt.value = nSt.scanTop()
  if (setRatt.value.size === 0) {
    await afficherDiag($t('PNOrattpos', [0]))
    rec.value = false
    return
  }
  if (setRatt.value.size < maxRatt)
    expanded.value = Array.from(setRatt.value)
}

function depRatt () {
  expanded.value = Array.from(setRatt.value)
}

function anrattacher () { 
  rec.value = false
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
  const config = stores.config
  dlvx.value = 0
  const ir = lstrm.value.get(n.r)
  const r = lstr.value[ir]
  if (ralentissement) if (config.mondebug) console.log(n.p)
  r.nbnd++
  dlnbn.value++
  const buf = enc.encode(n.n.texte)
  const u = url(n.p + '/_.md')
  const er = await putData(u, buf)
  if (er) 
    throw new AppExc(E_WS, 6, [er])
  if (ralentissement) await sleep(ralentissement)
  if (avecf) {
    for (const [, f] of n.n.mfa) {
      if (dlst.value === 0) return
      const nf = n.n.nomFichier(f)
      if (ralentissement) if (config.mondebug) console.log(nf)
      const buf = await n.n.getFichier(f)
      if (buf) {
        const u = url(n.p + '/' + nf)
        const er = await putData(u, buf)
        if (er) 
          throw new AppExc(E_WS, 6, [er])
        else {
          dlnbf.value++
          dlv2f.value += buf.length
          r.v2d += buf.length
          dlvx.value += buf.length
        }
      }
      if (ralentissement) await sleep(ralentissement)
    }
  }
  if (dlstp.value === 1) dlstp.value = 2
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
  dlstp.value = 1
}

function dlreprise () {
  dlst.value = 2
}

async function dlfin () {
  dlst.value = 0
  await afficherDiag($t('PNOcffin'))
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.sep
  margin-top: 11rem
.box2
  overflow-y: auto
  height: 10rem
  border-bottom: 3px solid orange
.bord
  padding: 1px
  margin: 1px
  border: 1px solid $grey-5
  border-radius: 5px
.cl1,.cl2,.cl3
  margin-top: 5px
  width: 100%
.cl1
  border-top: 1px solid var(--q-primary)
.cl2
  border-top: 1px solid var(--q-secondary)
.cl3
  border-top: 1px solid $grey-5
.rec
  margin: 0 2rem
  border: 2px solid var(--q-warning)
  border-radius: 1rem
  overflow: hidden
.ncp
  height: 2.5rem
  overflow: hidden
.menu
  min-width: 250px
  padding: 5px
  border: 1px solid $grey-5
.mi:hover
  background-color: $grey-5
</style>
