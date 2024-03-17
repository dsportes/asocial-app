<template>
<q-dialog v-model="ui.d.PAoutilsTests" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated class="bg-secondary text-white">
      <q-toolbar>
        <q-btn dense size="md" color="warning" icon="chevron_left" @click="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('OTtit')}}</q-toolbar-title>
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-toolbar inset>
        <q-tabs v-model="tab" inline-label outside-arrows mobile-arrows no-caps class="full-width">
          <q-tab name="tst" class="titre-md text-bold" :label="$t('OTtst')" @click="tab='tst'"/>
          <q-tab name="cpt" class="titre-md text-bold" :label="$t('OTcpt')" @click="ouvCpt()"/>
          <q-tab name="ps" class="titre-md text-bold" :label="$t('OTps')" @click="tab='ps'"/>
        </q-tabs>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="font-mono fs-sm q-my-sm q-ml-sm">{{$t('OTbuild', [config.BUILD])}}</div>
      <!--
      <comp-test :arg="testArg" />
      <q-btn dense color="warning" label="test" @click="testArg.val = Date.now()"/>
      <q-btn class="q-ma-xs" color="primary" dense label="Diag" @click="testDiag"/>
      <q-btn dense label="Forcer dlv / dfh" color="primary" @click="test"/>
      <q-btn dense padding="xs" size="md" label="TestRSA" color="primary" 
        @click="testRSA2"/>
      -->

      <q-card-section v-if="tab === 'tst'" class="column items-center">
        <q-btn class="q-ma-xs" color="primary" dense padding="xs xs"
          :label="$t('OTt1')" @click="testEcho"/>
        <q-btn class="q-ma-xs" color="primary" dense padding="xs xs"
          :label="$t('OTt2')" @click="testErr"/>
      </q-card-section>

      <q-card-section v-if="tab === 'tst'">
        <div class="titre-lg">{{$t('TPt2')}}</div>
        <div v-if="session.accesNet" class="q-ml-md">
          <q-btn dense :label="$t('ping')" color="primary" padding="xs xs" @click="pingsrv"/>
          <div>{{ resultat1a }}</div>
        </div>
        <div v-else class="q-ml-md text-italic">{{$t('TP2')}}</div>
      </q-card-section>

      <q-card-section v-if="tab === 'tst'">
        <div class="titre-lg">{{$t('TPt3')}}</div>
        <div v-if="session.accesNet" class="q-ml-md">
          <q-btn dense :label="$t('ping')" color="primary" padding="xs xs" @click="pingsrvdb"/>
          <div>{{ resultat2a }}</div>
          <div v-html="resultat2b"/>
        </div>
        <div v-else class="q-ml-md text-italic">{{$t('TP2')}}</div>
      </q-card-section>

      <q-card-section v-if="tab === 'tst'">
        <div class="titre-lg">{{$t('TPt4')}}</div>
        <div v-if="session.ok && session.accesNet" class="q-ml-md">
          <q-btn dense :label="$t('ping')" color="primary" padding="xs xs" @click="pingIDB"/>
          <div>{{ resultat3a }}</div>
          <div v-html="resultat3b"/>
        </div>
        <div v-else class="q-ml-md text-italic">{{$t('TP4')}}</div>
      </q-card-section>

      <q-card-section v-if="tab === 'ps'">
        <div class="row justify-center q-my-sm">
          <q-btn class="titre-md" @click="saisirPS"
            :label="$t('OTps')" color="primary" size="md" dense padding="xs"/>
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
                <q-btn v-if="it.vu" class="col-auto self-start q-mr-sm" icon="delete" 
                  size="md" round
                  color="warning" padding="none" @click="itdel=it; ui.oD('OTsuppbase')"/>
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
                  <q-btn :disable="ui.d.OTrunning" @click.stop="getVU(it)"
                    size="md" dense color="primary" no-caps padding="xs" :label="$t('GBvol')"/>
                </span>
              </div>

            </div>
          </div>
        </div>
    </q-card-section>

    <q-dialog v-model="ui.d.OTrunning" persistent>
      <q-card :class="styp('sm')">
        <div class="column items-center">
          <q-spinner-hourglass persistent color="primary" size="3rem" @click="ui.fD"/>
          <div class="fs-md font-mono q-my-md">{{session.volumeTable}}</div>
        </div>
      </q-card>
    </q-dialog>

    <q-dialog v-model="ui.d.OTsuppbase" persistent>
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
          <q-btn flat dense size="md" padding="xs" color="primary" icon="undo"
            :label="$t('GBcb')" @click="ui.fD"/>
          <q-btn dense size="md" padding="xs" color="warning" icon="delete"
            :label="$t('GBsb')" @click="delIDB(itdel)"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    </q-page-container>
  </q-layout>
</q-dialog>
</template>

<script>
import { ref } from 'vue'
import { encode, decode } from '@msgpack/msgpack'

// import CompTest from './CompTest.vue'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { EchoTexte, ErreurFonc, PingDB } from '../app/synchro.mjs'
import { styp, dhcool, $t, html, afficherDiag, edvol, b64ToU8, u8ToB64, random } from '../app/util.mjs'
import { ping } from '../app/net.mjs'
import { vuIDB, deleteIDB } from '../app/db.mjs'
// import { ForceDlv, TestRSA, CrypterRaw } from '../app/operations.mjs'
// import { decrypterRSA } from '../app/webcrypto.mjs'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export default ({
  name: 'OutilsTests',

  props: { },

  components: { BoutonHelp /*, CompTest */ },

  computed: {
  },

  data () {
    return {
      // testArg: { val: Date.now() },
      tab: 'tst',
      ps: null,

      resultat1a: '-',
      resultat2a: '-',
      resultat2b: '-',
      resultat3a: '-',
      resultat3b: '-',

      itdel: null,
      edvol: edvol,

      quotas: { q1:4, q2: 27, m1: 12, m2: 24, err: false }
    }
  },

  methods: {
    saisirPS () {
      this.ui.ps = {
        ok: this.okps,
        labelValider: 'test'
      }
      this.ui.oD('PSouvrir')
    },

    async testDiag() {
      await afficherDiag('toto est très beau')
      console.log('jailu')
    },
    
    ouvCpt () {
      this.getBases()
      this.tab='cpt'
    },

    okps (ps) {
      if (ps) ps.phrase = null
      this.ps = ps
    },

    traceq (q) {
      console.log('q change', q.q1, q.q2, q.err)
    },

    async testErr () {
      await new ErreurFonc().run(this.$t('OTer'), 1)
    },

    async testEcho () {
      const texte = this.$t('OTt1')
      const to = 1
      // try { // Si on veut traiter ce qui se passe après avoir "continuer quand-même"
        const r = await new EchoTexte().run(texte, to)
        await afficherDiag(this.$t('OTec', [texte, r, to]))
      // } catch (e) {
        // console.log(e.toString())
      // }
    },

    async pingsrv () {
      this.resultat1a = '-'
      const ret = await ping()
      if (!ret.startsWith('$KO')) {
        this.resultat1a = ret
      } else {
        this.resultat1a = 'KO'
      }
    },

    async pingsrvdb () {
      this.resultat2a = '-'
      this.resultat2b = '-'
      try {
        const ret = await new PingDB().run()
        this.resultat2a = 'OK'
        this.resultat2b = dhcool(ret.dh, true)
      } catch (exc) {
        this.resultat2a = 'KO'
        this.resultat2b = html(exc)
      }
    },

    async pingIDB () {
      if (!this.session.accesIdb) {
        this.resultat3a = $t('TP1')
      } else {
        this.resultat3a = '-'
        this.resultat3b = '-'
        try {
          // await getCompte() // TODO
          this.resultat3a = 'OK'
        } catch (exc) {
          this.resultat3a = 'KO'
          this.resultat3b = html(exc)
        }
      }
    },

    async getVU (it) {
      this.ui.oD('OTrunning')
      try {
        const [v1, v2] = await vuIDB(it.nb)
        it.v1 = v1
        it.v2 = v2
        it.vu = true
      } catch (e) {
        afficherDiag(e.message)
      }
      this.ui.fD()
    },

    /*
    async test () {
      //lop : liste d'opérations [op, id, ids, date]
      //- op:1 : dlv de versions id
      //- op:2 : dfh de groupes id
      //- op:3 : dlv de membrs id / ids
      //[1, 3210299393509425, 0, 20230809]
      //[2, 3236776594934708, 0, 20230809]
      //[3, 3236776594934708, 1, 20230809]
      const lop = [[1, 3210299393509425, 0, 20230809]]
      await new ForceDlv().run(lop)
    },

    async testRSA () {
      const aes = random(32)
      const IV = new Uint8Array([5, 255, 10, 250, 15, 245, 20, 240, 25, 235, 30, 230, 35, 225, 40, 220])
      const arg = { aes, iv: IV, gz: false }

      // const data = encoder.encode('toto est tres beau')
      const data = encode(arg)

      const ec = await new TestRSA().run(this.session.compteId, data)
      const priv = this.aSt.compte.priv
      const r = await decrypterRSA(priv, ec)
      // const t = decoder.decode(r)
      const t = decode(r)
      console.log(JSON.stringify(t))
    },

    async testRSA2 () {
      const x = []
      for(let i = 0; i < 100; i++) x.push('toto est tres beau')
      const inp = x.join('\n')
      const data = encoder.encode(inp)
      const clesite = this.ps ? this.ps.shax : null
      const ec = await new CrypterRaw().run(this.session.compteId, data, true, clesite)
      const out = decoder.decode(ec)
      console.log(inp === out)
    }
    */
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const config = stores.config
    const ui = stores.ui
    const bases = {}
    const nbbases = ref(0)

    const pfx = '$asocial$-'

    function getBases () {
      // trigs[nombase] = [reseau, trig]
      // localStore : key: reseau-hps1 val = nombase
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
        bases[nb] = { nb: nb, trig: i, hps1: [], v1: 0, v2: 0, vu: false }
        nbbases.value++
      }
      for (const lsk in localStorage) {
        if (!lsk.startsWith(pfx) || lsk === nt) continue
        const hps1 = lsk.substring(pfx.length)
        const nb = localStorage.getItem(lsk)
        const x = bases[nb]
        if (x) {
          x.hps1 = hps1
        } else {
          nbbases.value++
          bases[nb] = { nb: nb, trig: '???', hps1: hps1, v1: 0, v2: 0, vu: false }
        }
      }
    }

    async function delIDB (it) {
      try {
        this.ui.fD()
        deleteIDB(it.nb)
        localStorage.removeItem(pfx + it.hps1)
        delete bases[it.nb]
        nbbases.value = 0
        const trigs = {}
        for (const nb in bases) {
          trigs[nb] = bases[nb].nb
          nbbases.value++
        }
        const buf = u8ToB64(new Uint8Array(encode(trigs)), true)
        localStorage.setItem(pfx + 'trigrammes', buf)
        console.log('RAZ db ' + it.nb + ' trig:' + it.trig)
      } catch (e) {
        console.log(e.toString())
      }
    }
    
    return {
      styp, session, config, ui, aSt,
      bases,
      nbbases,
      getBases,
      delIDB
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-card__section
  padding: 5px

.t1
  font-style: italic
  color: $primary
.t2
  font-family: 'Roboto Mono'
</style>
