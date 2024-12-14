<template>
<q-dialog v-model="ui.d.a.outilsTests" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated>
      <q-toolbar class="tbs">
        <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('OTtit')}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-toolbar inset class="tbp">
        <q-tabs v-model="tab" inline-label outside-arrows mobile-arrows no-caps class="full-width">
          <q-tab name="cpt" class="titre-md text-bold" :label="$t('OTcpt')" @click="ouvCpt()"/>
          <q-tab name="ps" class="titre-md text-bold" :label="$t('OTps')" @click="tab='ps'"/>
          <q-tab name="tst" class="titre-md text-bold" :label="$t('OTtst')" @click="tab='tst'"/>
          <q-tab v-if="testCompteurs" name="compteurs" class="titre-md text-bold" label="Test Compteurs" @click="tab='compteurs'"/>
        </q-tabs>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="font-mono fs-sm q-my-sm q-ml-sm">{{$t('OTbuild', [config.BUILD])}}</div>
      <!--
      <div class="font-def fs-sm">Normal sm</div>
      <div class="font-def fs-md">Normal md</div>
      <div class="font-def text-italic fs-md">Normal italic md</div>
      <div class="font-def text-bold fs-md">Normal bold md</div>
      <div class="font-def text-bold text-italic fs-md">Normal italic bold md</div>
      <div class="font-def fs-xl">Normal xl</div>
      <div class="fs-xl">Normal Def xl</div>
      <div class="fs-sm font-mono q-mt-md">Mono 1 l 0 O wiw sm</div>
      <div class="fs-md font-mono">Mono 1 l 0 O wiw md</div>
      <div class="text-italic fs-md font-mono">Mono 1 l 0 O wiw italic md</div>
      <div class="text-bold fs-md font-mono">Mono 1 l 0 O wiw italic md</div>
      <div class="text-italic text-bold fs-md font-mono">Mono 1 l 0 O wiw italic bold md</div>
      <div class="fs-xl font-mono">Mono 1 l 0 O iii xl</div>
      <div class="fs-xl font-mono">Mono 1 l 0 O www xl</div>
      <div class="titre-sm q-mt-md">Titre sm</div>
      <div class="titre-md">Titre md</div>
      <div class="text-italic titre-md">Titre italic md</div>
      <div class="text-bold titre-md">Titre italic md</div>
      <div class="text-italic text-bold titre-md">Titre italic bold md</div>
      <div class="titre-xl">Titre xl</div>
      -->
      <div v-if="tab === 'compteurs'">
        <test-compteurs/>
      </div>

      <q-card-section v-if="tab === 'tst'" class="column items-center">
        <btn-cond class="q-ma-xs" :label="$t('OTt1')" @ok="testEcho"/>
        <btn-cond class="q-ma-xs" :label="$t('OTt2')" @ok="testErr"/>
      </q-card-section>

      <q-card-section v-if="tab === 'tst'">
        <div class="titre-lg">{{$t('TPt2')}}</div>
        <div v-if="session.accesNet" class="q-ml-md">
          <btn-cond :label="$t('ping')" @ok="pingsrv"/>
          <div>{{ resultat1a }}</div>
        </div>
        <div v-else class="q-ml-md text-italic">{{$t('TP2')}}</div>
      </q-card-section>

      <q-card-section v-if="tab === 'tst'">
        <div class="titre-lg">{{$t('TPt3')}}</div>
        <div v-if="session.accesNet" class="q-ml-md">
          <btn-cond :label="$t('ping')" @ok="pingsrvdb"/>
          <div>{{ resultat2a }}</div>
          <div v-html="resultat2b"/>
        </div>
        <div v-else class="q-ml-md text-italic">{{$t('TP2')}}</div>
      </q-card-section>

      <q-card-section v-if="tab === 'tst'">
        <div class="titre-lg">{{$t('TPt4')}}</div>
        <div v-if="session.ok && session.accesNet" class="q-ml-md">
          <btn-cond :label="$t('ping')" @ok="pingIDB"/>
          <div>{{ resultat3a }}</div>
          <div v-html="resultat3b"/>
        </div>
        <div v-else class="q-ml-md text-italic">{{$t('TP4')}}</div>
      </q-card-section>

      <q-card-section v-if="tab === 'ps'">
        <div class="row justify-center q-my-sm">
          <btn-cond class="titre-md" @ok="saisirPS" :label="$t('OTps')"/>
        </div>
        <div class='t1 q-mt-slg'>{{$t('OTh1')}}</div>
        <div class='t2'>{{ ps ? ps.hps1 : '?'}}</div>
        <div class='t1 q-mt-sm'>{{$t('OTcx')}}</div>
        <div class='t2'>{{ ps ? ps.shax64 : '?' }}</div>
        <div class='t1 q-mt-sm'>{{$t('OThcx')}}</div>
        <div class='t2'>{{ ps ? ps.hpsc : '?' }}</div>
      </q-card-section>

      <q-card-section v-if="tab === 'cpt'">
        <div v-if="session.ok" class="q-px-sm q-mt-md titre-md text-italic text-warning">{{$t('GBnc')}}</div>

        <div v-if="!session.ok" class="q-px-sm q-mt-md q-px-sm">
          <div v-if="!nbbases" class="titre-lg text-italic">{{$t('GBnb')}}</div>
          <div v-else>
            <div class="titre-md text-italic text-warning">{{$t('GBcl')}}</div>
            <div v-for="it in bases" :key="it.nb" class="zone items-center fs-md zone">
              <div class="row">
                <div class="col fs-md">{{it.nb}}</div>
                <btn-cond v-if="it.vu" class="col-auto self-start q-mr-sm" icon="delete" 
                  round color="warning" @ok="itdel=it; ui.oD('OTsuppbase', idc)"/>
              </div>
              <div v-if="it.vu" class="q-pl-md q-mb-sm row items.center">
                <div class="col-1">{{it.trig}}</div>
                <div class="col-3 fs-sm font-mono">{{it.hps1}}</div>
                <div class="col-4 text-center font-mono">{{edvol(it.v1 + it.v2)}}</div>
                <div class="col-4 text-center font-mono">{{$t('GBfi', [edvol(it.v2)])}}</div>
              </div>
              <div v-else class="q-pl-md q-mb-sm row items.center">
                <div class="col-1">{{it.trig}}</div>
                <div class="col-3 fs-sm font-mono">{{it.hps1}}</div>
                <span v-if="!it.vu" class="col-8 text-right">
                  <btn-cond :disable="ui.d[idc].OTrunning" stop @ok="getVU(it)"
                    no-caps :label="$t('GBvol')"/>
                </span>
              </div>

            </div>
          </div>
        </div>
    </q-card-section>

    <q-dialog v-model="ui.d[idc].OTrunning" persistent>
      <q-card :class="styp('sm')">
        <div class="column items-center">
          <q-spinner-hourglass persistent color="primary" size="3rem" @click="ui.fD"/>
          <div class="fs-md font-mono q-my-md">{{session.volumeTable}}</div>
        </div>
      </q-card>
    </q-dialog>

    <q-dialog v-model="ui.d[idc].OTsuppbase" persistent>
      <q-card :class="styp('sm') + 'q-pa-sm'">
        <q-card-section>
          <div class="titre-md text-center q-my-sm">{{$t('GBprop', [itdel.trig])}}</div>
          <div class="titre-md text-center q-mt-sm">{{$t('GBnomb')}}</div>
          <div class="text-center fs-sm font-mono q-mb-sm">{{itdel.nb}}</div>
          <div v-if="!itdel.hps1" class="titre-md text-bold bg-yellow-5 text-negative">
            {{$t('GBm1')}}
          </div>
          <div v-else class="titre-md text-bold text-warning">
            {{$t('GBm2')}}
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo"
            :label="$t('GBcb')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="delete"
            :label="$t('GBsb')" @ok="delIDB(itdel)"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    </q-page-container>
  </q-layout>
</q-dialog>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import TestCompteurs from '../components/TestCompteurs.vue'
import { EchoTexte, ErreurFonc, PingDB } from '../app/operations4.mjs'
import { styp, dhcool, $t, html, afficherDiag, 
  sleep, edvol, b64ToU8, u8ToB64 } from '../app/util.mjs'
import { ping } from '../app/net.mjs'
import { vuIDB, deleteIDB, idb } from '../app/db.mjs'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const testCompteurs = false

const tab = ref('cpt')
const ps = ref(null)
const htx = ref(new Set())
const resultat1a = ref('-')
const resultat2a = ref('-')
const resultat2b = ref('-')
const resultat3a = ref('-')
const resultat3b = ref('-')
const itdel = ref(null)
const quotas = ref({ q1:4, q2: 27, m1: 12, m2: 24, err: false })

const session = stores.session
const aSt = stores.avatar
const config = stores.config
const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
const bases = ref()
const nbbases = ref(0)

const pfx = '$asocial$-'

function getBases () {
  // trigs[nombase] = [reseau, trig]
  // localStore : key: reseau-hps1 val = nombase
  const mb = {}
  const nt = pfx + 'trigrammes'
  const x = localStorage.getItem(nt)
  let trigs
  try {
    trigs = decode(b64ToU8(x))
  } catch (e) {
    console.log('LocalStorage: entrée $asocial$-trigrammes non trouvée / illisible')
  }
  for (const nb in trigs) {
    const i = trigs[nb]
    mb[nb] = { nb: nb, trig: i, hps1: '?', v1: 0, v2: 0, vu: false }
    nbbases.value++
  }
  for (const lsk in localStorage) {
    if (!lsk.startsWith(pfx) || lsk === nt) continue
    const hps1 = lsk.substring(pfx.length)
    const nb = localStorage.getItem(lsk)
    const x = mb[nb]
    if (x) {
      x.hps1 = hps1
    } else {
      nbbases.value++
      mb[nb] = { nb: nb, trig: '???', hps1: hps1, v1: 0, v2: 0, vu: false }
    }
  }
  bases.value = mb
}

async function delIDB (it) {
  try {
    ui.fD()
    deleteIDB(it.nb)
    localStorage.removeItem(pfx + it.hps1)
    delete bases.value[it.nb]
    nbbases.value = 0
    const trigs = {}
    for (const nb in bases.value) {
      trigs[nb] = bases.value[nb].nb
      nbbases.value++
    }
    const buf = u8ToB64(new Uint8Array(encode(trigs)), true)
    localStorage.setItem(pfx + 'trigrammes', buf)
    console.log('RAZ db ' + it.nb + ' trig:' + it.trig)
  } catch (e) {
    console.log(e.toString())
  }
}

function saisirPS () {
  ui.ps = {
    ok: okps,
    labelValider: 'test'
  }
  ui.oD('phrasesecrete', 'a')
}

async function testDiag() {
  await afficherDiag('toto est très beau')
  console.log('jailu')
}

function ouvCpt () {
  getBases()
  tab.value ='cpt'
}

function okps (psx) {
  if (psx) psx.phrase = null
  ps.value = psx
}

function traceq (q) {
  console.log('q change', q.q1, q.q2, q.err)
}

async function testErr () {
  try {
    await new ErreurFonc().run($t('OTer'), 1)
  } catch (e) {
    console.log(e.toString())
  }
}

function htok (r) { 
  const l = Array.from(htx.value).sort().join(' ')
  console.log('Hashtags: ' + l)
  ui.fD() 
}

async function testEcho () {
  const texte = $t('OTt1')
  const to = 1
  // try { // Si on veut traiter ce qui se passe après avoir "continuer quand-même"
    const r = await new EchoTexte().run(texte, to)
    await afficherDiag($t('OTec', [texte, r, to]))
  // } catch (e) {
    // console.log(e.toString())
  // }
}

async function pingsrv () {
  resultat1a.value = '-'
  const ret = await ping()
  if (!ret.startsWith('$KO')) {
    resultat1a.value = ret
  } else {
    resultat1a.value = 'KO'
  }
}

async function pingsrvdb () {
  resultat2a.value = '-'
  resultat2b.value = '-'
  try {
    const ret = await new PingDB().run()
    resultat2a.value = 'OK'
    resultat2b.value = dhcool(ret.dh, true)
  } catch (exc) {
    resultat2a.value = 'KO'
    resultat2b.value = html(exc)
  }
}

async function pingIDB () {
  if (!session.accesIdb) {
    resultat3a.value = $t('TP1')
  } else {
    resultat3a.value = '-'
    resultat3b.value = '-'
    try {
      await sleep(2000)
      await idb.getBoot()
      resultat3a.value = 'OK'
    } catch (exc) {
      resultat3a.value = 'KO'
      resultat3b.value = html(exc)
    }
  }
}

async function getVU (it) {
  ui.oD('OTrunning', idc)
  try {
    const [v1, v2] = await vuIDB(it.nb)
    it.v1 = v1
    it.v2 = v2
    it.vu = true
  } catch (e) {
    afficherDiag(e.message)
  }
  ui.fD()
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-card__section
  padding: 5px

.t1
  font-style: italic
  color: $primary
.t2
  font-family: 'Ubuntu Mono'
</style>
