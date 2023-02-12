<template>
<q-layout container view="hHh lpR fFf" :class="sty" style="width:80vw">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="ui.outilsTests = false"/>
      <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('OTtit')}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar inset>
      <q-tabs v-model="tab" inline-label outside-arrows mobile-arrows no-caps class="full-width">
        <q-tab name="tst" :label="$t('OTtst')" @click="tab='tst'"/>
        <q-tab name="cpt" :label="$t('OTcpt')" @click="tab='cpt'"/>
        <q-tab name="ps" :label="$t('OTps')" @click="tab='ps'"/>
      </q-tabs>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <div class="font-mono fs-sm q-my-sm q-ml-sm">{{$t('OTbuild', [config.build])}}</div>

    <q-card-section v-if="tab === 'tst'">
      <q-btn class="q-ma-xs" color="primary" dense :label="$t('OTt1')" @click="testEcho"/>
      <q-btn class="q-ma-xs" color="primary" dense :label="$t('OTt2')" @click="testErr"/>
    </q-card-section>

    <q-card-section v-if="tab === 'tst'">
      <div class="titre-lg">{{$t('TPt2')}}</div>
      <div v-if="session.accesNet" class="q-ml-md">
        <q-btn dense label="Ping du serveur" color="primary" @click="pingsrv"/>
        <div>{{ resultat1a }}</div>
        <div>{{ resultat1b }}</div>
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
      <phrase-secrete v-on:ok-ps="okps" icon-valider="check" label-valider="OK"></phrase-secrete>
      <div class='t1 q-mt-slg'>{{$t('OTh1')}}</div>
      <div class='t2'>{{ ps ? ps.dpbh : '?'}}</div>
      <div class='t1 q-mt-sm'>{{$t('OTcx')}}</div>
      <div class='t2'>{{ ps ? ps.pcb64 : '?' }}</div>
      <div class='t1 q-mt-sm'>{{$t('OThcx')}}</div>
      <div class='t2'>{{ ps ? ps.pcbh : '?' }}</div>
    </q-card-section>

    <q-card-section v-if="tab === 'cpt'">
      <div v-if="session.ok" class="q-px-sm q-mt-md titre-md text-italic text-warning">{{$t('GBnc')}}</div>

      <div v-if="!session.ok" class="q-px-sm q-mt-md q-px-sm">
        <div v-if="!nbbases" class="titre-lg text-italic">{{$t('GBnb')}}</div>
        <div v-else>
          <div class="titre-md text-italic text-warning">{{$t('GBcl')}}</div>
          <div v-for="it in bases" :key="it.nb" class="zone items-center fs-md cursor-pointer zone"
            @click="itdel=it;suppbase=true">
            <div class="fs-md q-mt-sm">{{it.nb}}</div>
            <div class="q-pl-md q-mb-sm row items.center">
              <div class="col-2">{{it.trig}}</div>
              <div :class="'col-1 font-mono' + (it.dpbh.length!==1 ? ' text-warning bg-yellow-5':'')">{{it.dpbh.length}}</div>
              <div v-if="it.v1" class="col-2 font-mono">{{edvol(it.v1 + it.v2)}}</div>
              <div v-if="it.v1" class="col-4 font-mono">(fichiers: {{edvol(it.v2)}})</div>
              <q-btn v-if="it.v1===0 && !running" class="col-6" @click.stop="getVU(it.nb)"
                size="md" dense color="primary" no-caps label="Volume de la base"/>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-page-container>

  <q-dialog v-model="running">
    <q-card>
      <div class="column items-center">
        <q-spinner-hourglass persistent color="primary" size="3rem" @click="running=false"/>
        <div class="fs-md font-mono q-mt-md">{{session.volumeTable}}</div>
      </div>
    </q-card>
  </q-dialog>

  <q-dialog v-model="suppbase">
    <q-card>
      <q-card-section>
        <div class="titre-lg">Propriétaire: {{itdel.trig}}</div>
        <div class="fs-sm font-mono">Nom de la base: {{itdel.nb}}</div>
        <div v-if="!itdel.dpbh.length" class="titre-md text-bold bg-yellow-5 text-negative">
          Cette base ne peut PLUS être accédée : elle peut être supprimée sans risque
        </div>
        <div v-if="itdel.dpbh.length > 1" class="titre-md text-bold text-warning">
          Cette base peut être accédée par 2 phrases secrètes, probablement la dernière et une ancienne.
        </div>
      </q-card-section>
      <q-card-actions>
        <q-btn dense label="Je conserve la base" color="primary" v-close-popup/>
        <q-btn dense label="Je supprime la base" icon="delete" color="warning"
          @click="deleteIDB(itdel.nb)" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>

</q-layout>
</template>

<script>
import { ref } from 'vue'
import Dexie from 'dexie'
import { encode, decode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { EchoTexte, ErreurFonc } from '../app/connexion.mjs'
import { dhcool, $t, html, afficherDiag, sleep, edvol, b64ToU8, u8ToB64 } from '../app/util.mjs'
import { ping } from '../app/net.mjs'
import { getCompte, vuIDB } from '../app/db.mjs'
import { PingDB } from '../app/connexion.mjs'

export default ({
  name: 'OutilsTests',

  components: { PhraseSecrete, BoutonHelp },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' }
  },

  data () {
    return {
      tab: 'tst',

      ps: null,

      resultat1a: '-',
      resultat1b: '-',
      resultat2a: '-',
      resultat2b: '-',
      resultat3a: '-',
      resultat3b: '-',

      suppbase: false,
      itdel: null,
      edvol: edvol,
      running: false,

      quotas: { q1:4, q2: 27, m1: 12, m2: 24, err: false }
    }
  },

  methods: {
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
      this.resultat1b = '-'
      const ret = await ping()
      if (!ret.startsWith('$KO')) {
        this.resultat1a = 'OK'
        const d = new Date(ret)
        this.resultat1b = dhcool(d.getTime(), true)
      } else {
        this.resultat1a = 'KO'
        this.resultat1b = ret.substring(4)
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

    async getVU (nb) {
      this.running = true
      try {
        const [v1, v2] = await vuIDB(nb)
        const it = this.bases[nb]
        it.v1 = v1
        it.v2 = v2
      } catch (e) {
        afficherDiag(e.message)
      }
      this.running = false
    }
  },

  setup () {
    const session = stores.session
    const config = stores.config
    const ui = stores.ui
    const bases = {}
    const nbbases = ref(0)

    function getBases () {
      // trigs[nombase] = [reseau, trig]
      // localStore : key: reseau-dpbh val = nombase
      nbbases.value = 0
      const x = localStorage.getItem('$$trigrammes')
      let trigs = ['', '']
      try {
        trigs = decode(b64ToU8(x))
      } catch (e) {
        console.log('LocalStorage: entrée $$trigrammes non trouvée / illisible')
      }
      for (const nb in trigs) {
        const i = trigs[nb]
        bases[nb] = { nb: nb, reseau: i[0], trig: i[1], dpbh: [], v1: 0, v2: 0 }
        nbbases.value++
      }
      for (const lsk in localStorage) {
        const i = lsk.indexOf('-')
        if (i === -1 || i === lsk.length) continue
        const reseau = lsk.substring(0, i)
        const dpbh = lsk.substring(i + 1)
        const nb = localStorage.getItem(lsk)
        const x = bases[nb]
        if (x) {
          x.dpbh.push(dpbh)
        } else {
          nbbases.value++
          bases[nb] = { nb: nb, reseau: reseau, trig: '???', dpbh: [dpbh], v1: 0, v2: 0 }
        }
      }
    }

    async function deleteIDB (nombase) {
      try {
        const it = bases[nombase]
        it.dpbh.forEach(dpbh => { localStorage.removeItem(it.reseau + '-' + dpbh) })
        await Dexie.delete(nombase)
        await sleep(100)
        delete bases[nombase]
        nbbases.value = 0
        const trigs = {}
        for (const nb in bases) {
          const it = bases[nb]
          trigs[nb] = [it.reseau, it.trig]
          nbbases.value++
        }
        localStorage.setItem('$$trigrammes', u8ToB64(new Uint8Array(encode(trigs)), true))
        console.log('RAZ db ' + nombase + ' réseau:' + it.reseau + ' trig:' + it.trig)
      } catch (e) {
        console.log(e.toString())
      }
    }

    getBases()

    return {
      session,
      config,
      ui,
      bases,
      nbbases,
      deleteIDB
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
