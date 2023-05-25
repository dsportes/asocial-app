<template>
<div class="bs" style="width:80vw">
<q-layout container view="hHh lpR fFf" :class="sty">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('OTtit')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar inset>
      <q-tabs v-model="tab" inline-label outside-arrows mobile-arrows no-caps class="full-width">
        <q-tab name="tst" :label="$t('OTtst')" @click="tab='tst'"/>
        <q-tab name="cpt" :label="$t('OTcpt')" @click="ouvCpt()"/>
        <q-tab name="ps" :label="$t('OTps')" @click="tab='ps'"/>
      </q-tabs>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <div class="font-mono fs-sm q-my-sm q-ml-sm">{{$t('OTbuild', [config.build])}}</div>

    <q-card-section v-if="tab === 'tst'" class="column items-center">
      <q-btn class="q-ma-xs" color="primary" dense :label="$t('OTt1')" @click="testEcho"/>
      <q-btn class="q-ma-xs" color="primary" dense :label="$t('OTt2')" @click="testErr"/>
      <!--q-btn class="q-ma-xs" color="primary" dense label="Diag" @click="testDiag"/-->
    </q-card-section>

    <q-card-section v-if="tab === 'tst'">
      <div class="titre-lg">{{$t('TPt2')}}</div>
      <div v-if="session.accesNet" class="q-ml-md">
        <q-btn dense label="Ping du serveur" color="primary" @click="pingsrv"/>
        <div>{{ resultat1a }}</div>
      </div>
      <div v-else class="q-ml-md text-italic">{{$t('TP2')}}</div>
    </q-card-section>

    <q-card-section v-if="tab === 'tst'">
      <div class="titre-lg">{{$t('TPt3')}}</div>
      <div v-if="session.accesNet" class="q-ml-md">
        <q-btn dense label="Ping de la base sur le serveur" color="primary" @click="pingsrvdb"/>
        <div>{{ resultat2a }}</div>
        <div v-html="resultat2b"/>
      </div>
      <div v-else class="q-ml-md text-italic">{{$t('TP2')}}</div>
    </q-card-section>

    <q-card-section v-if="tab === 'tst'">
      <div class="titre-lg">{{$t('TPt4')}}</div>
      <div v-if="session.ok && session.accesNet" class="q-ml-md">
        <q-btn dense label="Ping de la base locale" color="primary" @click="pingIDB"/>
        <div>{{ resultat3a }}</div>
        <div v-html="resultat3b"/>
      </div>
      <div v-else class="q-ml-md text-italic">{{$t('TP4')}}</div>
    </q-card-section>

    <q-card-section v-if="tab === 'ps'">
      <phrase-secrete @ok="okps" icon-valider="check" label-valider="OK"></phrase-secrete>
      <div class='t1 q-mt-slg'>{{$t('OTh1')}}</div>
      <div class='t2'>{{ ps ? ps.hps1 : '?'}}</div>
      <div class='t1 q-mt-sm'>{{$t('OTcx')}}</div>
      <div class='t2'>{{ ps ? ps.shax64 : '?' }}</div>
      <div class='t1 q-mt-sm'>{{$t('OThcx')}}</div>
      <div class='t2'>{{ ps ? ps.pcbh : '?' }}</div>
    </q-card-section>

    <q-card-section v-if="tab === 'cpt'">
      <div v-if="session.ok" class="q-px-sm q-mt-md titre-md text-italic text-warning">{{$t('GBnc')}}</div>

      <div v-if="!session.ok" class="q-px-sm q-mt-md q-px-sm">
        <div v-if="!nbbases" class="titre-lg text-italic">{{$t('GBnb')}}</div>
        <div v-else>
          <div class="titre-md text-italic text-warning">{{$t('GBcl')}}</div>
          <div v-for="it in bases" :key="it.nb" class="zone items-center fs-md zone">
            <div>
              <q-btn v-if="it.vu" class="q-mr-sm" icon="delete" size="sm" round
                color="warning" @click="itdel=it;ovsuppbase()"/>
              <span class="fs-md q-mt-sm">{{it.nb}}</span>
            </div>
            <div class="q-pl-md q-mb-sm row items.center">
              <div class="col-2">{{it.trig}}</div>
              <div class="col-3 fs-sm font-mono">{{it.hps1}}</div>
              <div v-if="it.vu" class="col-3 text-center font-mono">{{edvol(it.v1 + it.v2)}}</div>
              <div v-if="it.vu" class="col-4 text-center font-mono">{{$t('GBfi', [edvol(it.v2)])}}</div>
              <span v-if="!it.vu" class="col-7 text-right">
                <q-btn :disable="running" @click.stop="getVU(it)"
                  size="md" dense color="primary" no-caps :label="$t('GBvol')"/>
              </span>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-page-container>

  <q-dialog v-model="running">
    <q-card class="bs">
      <div class="column items-center">
        <q-spinner-hourglass persistent color="primary" size="3rem" @click="MD.fD"/>
        <div class="fs-md font-mono q-mt-md">{{session.volumeTable}}</div>
      </div>
    </q-card>
  </q-dialog>

  <q-dialog v-model="suppbase">
    <q-card class="bs">
      <q-card-section>
        <div class="titre-lg">Propriétaire: {{itdel.trig}}</div>
        <div class="fs-sm font-mono">Nom de la base: {{itdel.nb}}</div>
        <div v-if="!itdel.hps1" class="titre-md text-bold bg-yellow-5 text-negative">
          {{$t('GBm1')}}
        </div>
        <div v-if="itdel.hps1" class="titre-md text-bold text-warning">
          {{$t('GBm2')}}
        </div>
      </q-card-section>
      <q-card-actions>
        <q-btn dense label="Je conserve la base" color="primary" v-close-popup/>
        <q-btn dense label="Je supprime la base" icon="delete" color="warning"
          @click="delIDB(itdel)" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</q-layout>
</div>
</template>

<script>
import { ref } from 'vue'
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { EchoTexte, ErreurFonc } from '../app/connexion.mjs'
import { dhcool, $t, html, afficherDiag, sleep, edvol, b64ToU8, u8ToB64 } from '../app/util.mjs'
import { ping } from '../app/net.mjs'
import { getCompte, vuIDB, deleteIDB } from '../app/db.mjs'
import { PingDB } from '../app/connexion.mjs'
import { MD } from '../app/modele.mjs'

export default ({
  name: 'OutilsTests',

  props: { },

  components: { PhraseSecrete, BoutonHelp },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' }
  },

  data () {
    return {
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
    async testDiag() {
      await afficherDiag('toto est très beau')
      console.log('jailu')
    },
    
    ouvCpt () {
      this.getBases()
      this.tab='cpt'
    },

    okps (ps) {
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
      const r = await new EchoTexte().run(texte, to)
      afficherDiag(this.$t('OTec', [texte, r, to]))
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
          await getCompte()
          this.resultat3a = 'OK'
        } catch (exc) {
          this.resultat3a = 'KO'
          this.resultat3b = html(exc)
        }
      }
    },

    async getVU (it) {
      this.ovrunning()
      try {
        const [v1, v2] = await vuIDB(it.nb)
        it.v1 = v1
        it.v2 = v2
        it.vu = true
      } catch (e) {
        afficherDiag(e.message)
      }
      MD.fD()
    }
  },

  setup () {
    const session = stores.session
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
        console.log('RAZ db ' + nombase + ' trig:' + it.trig)
      } catch (e) {
        console.log(e.toString())
      }
    }

    const suppbase = ref(false)
    function ovsuppbase() { MD.oD(suppbase) }
    const running = ref(false)
    function ovrunning () { MD.oD(running)}
    
    return {
      MD, suppbase, ovsuppbase, running, ovrunning,
      session,
      config,
      ui,
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
.q-toolbar
  min-height: 0 !important
  padding: 0 !important
.t1
  font-style: italic
  color: $primary
.t2
  font-family: 'Roboto Mono'
</style>
