<template>
  <q-page class="q-pa-xs">
    <div class="column">
      <div class="row justify-center">
        <q-btn padding="xs" dense color="warning" :label="$t('ESgc')" @click="testGC"/>
        <q-btn padding="xs" class="q-ml-xs" dense color="warning" :label="$t('ESck')" @click="affCkpt"/>
        <q-select v-model="gcop" dense :options="gcops" 
          class="q-ml-lg" label="GCop ???" style="width:6rem"/>
        <q-btn padding="xs" class="q-ml-xs" dense color="warning" 
          :disable="gcop === ''" :label="$t('go')" @click="testGCop"/>
      </div>

      <div class="q-mt-sm row q-gutter-xs justify-center">
        <q-btn dense size="md" color="primary" icon="refresh" padding="xs"
          :label="$t('rafraichir')" @click="rafraichir"/>
        <q-btn dense size="md" color="primary" icon="add" padding="xs"
          :label="$t('ESne')" @click="plusNS"/>
      </div>
    </div>

    <div class="titre-lg text-white bg-secondary q-pa-xs full-width text-center q-my-sm">
      {{$t('ESlo', session.paLeFT.length, { count: session.paLeFT.length})}}</div>

    <div class="spmd">
      <div v-for="(esp, idx) in session.paLeFT" :key="esp.id">
        <div :class="dkli(idx) + 'q-my-sm'">

          <div class="row justify-between">
            <div class="text-bold font-mono fs-lg">
              <span class="q-mr-md">#{{esp.id}}</span>
              <span>{{esp.org}}</span>
              <span v-if="esp.moisStat" class="q-ml-md fs-sm">{{$t('ESdms', [esp.moisStat])}}</span>
            </div>
            <div class="row q-gutter-xs">
              <q-btn dense color="primary" flat label="ping"
                @click="ping(esp)"/>
              <q-btn dense color="primary" icon="open_in_new" :label="$t('detail')"
                @click="pageesp(esp)"/>
            </div>
          </div>

          <div class="row justify-between q-ml-lg q-my-xs">
            <span class="fs-md">{{$t('ESprf', [esp.t])}}</span>
            <q-btn dense color="primary" :label="$t('changer')" padding="xs"
              @click="ovchgprf1(esp)"/>
          </div>

          <apercu-notif class="q-ml-lg q-mt-sm" :notif="esp.notif" :idx="idx" 
            editable :type="0" :idsource="esp.id" :ctx="{ ns: esp.id }"/>

        </div>
      </div>
    </div>

    <q-dialog v-model="ui.d.PAcreationesp" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" icon="close" color="warning" @click="cancelNS"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('ESne2')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <q-card-section class="q-pa-xs">
          <div class="row items-center full-width">
            <q-input class="col-6 q-pr-md" v-model.number="ns" type="number"
            :label="$t('ESns')" :hint="$t('ESnsh')" dense/>
            <div v-if="dns" class="col-6 text-negative bg-yellow-3 text-bold q-px-xs">{{dns}}</div>
          </div>
          <div class="row items-center full-width">
            <q-input class="col-6  q-pr-md" v-model="org"
              :label="$t('ESorg')" hint="monorg" dense/>
            <div v-if="dorg" class="col-6 text-negative bg-yellow-3 text-bold q-px-xs">{{dorg}}</div>
          </div>
          <div class="column justify-center q-mt-md">
            <q-btn :label="$t('ESps')" dense size="md" padding="xs" color="primary"
              no-caps class="titre-lg" @click="saisiePS" 
              :disable="!org"/>
            <bouton-confirm class="q-my-lg maauto" :actif="ps !== null && !dns && !dorg" 
              :confirmer="creerNS"/>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="ui.d.PAedprf" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense color="warning" size="md" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('STchg')}}</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="q-my-md q-mx-sm">
          <div class="row bord4">
            <div class="col-3 text-center font-mono">#</div>
            <div class="col-3 text-center font-mono">{{$t('limco')}}</div>
            <div class="col-3 text-center font-mono">{{$t('nbnotes')}}</div>
            <div class="col-3 text-center font-mono">{{$t('volv2')}}</div>
          </div>
          <div v-for="(x, idx) of cfg.profils" :key="idx" @click="prf = idx+1">
            <div :class="'row cursor-pointer ' + dkli(idx) + brd(idx)">
              <div class="col-3 text-center font-mono">{{idx + 1}}</div>
              <div class="col-3 text-center font-mono">{{ev0(idx)}}</div>
              <div class="col-3 text-center font-mono">{{ev1(idx)}}</div>
              <div class="col-3 text-center font-mono">{{ev2(idx)}}</div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <q-btn flat dense color="primary" size="md" padding="xs" icon="undo" 
            :label="$t('renoncer')" @click="ui.fD"/>
          <q-btn dense color="warning" size="md" padding="xs" icon="check" 
            :label="$t('valider')" :disable="prf === profil" @click="valider"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="ui.d.PAcheckpoint" full-height position="left" persistent>
      <q-layout container view="hHh lpR fFf" :class="styp('md')">
        <q-header elevated>
          <q-toolbar class="bg-secondary text-white">
            <q-btn dense size="md" icon="chevron_left" color="warning" @click="ui.fD"/>
            <q-toolbar-title class="titre-lg full-width text-center">{{$t('ESckpt', [ns])}}</q-toolbar-title>
            <bouton-help page="page1"/>
          </q-toolbar>
        </q-header>

        <q-page-container class="q-pa-xs">
          <div class="q-my-sm">
            <span class="titre-md text-italic q-mr-lg">{{$t('ESver')}}</span>
            <span class="font-mono fs-md">{{ck.v ? dhIso(ck.v) : '-'}}</span>
          </div>
          <div v-if="ck.dhStart" class="q-my-sm">
            <div class="titre-md text-italic q-mr-lg">{{$t('ESdex')}}</div>
            <div class="q-ml-md">
              <span class="font-mono fs-md">{{dhIso(ck.dhStart)}}</span>
              <span v-if="ck.duree" class="q-ml-md font-mono fs-md">{{duree(ck.duree)}}</span>
              <span v-else class="q-ml-md font-mono fs-md">{{$t('ESec')}}</span>
            </div>
          </div>
          <div v-if="!ck.dhStart" class="q-my-sm titre-md text-italic q-mr-lg">{{$t('ESnex')}}</div>

          <div v-if="ck.dhStart">
            <div class="q-my-sm titre-md text-italic">{{$t('EStex')}}</div>
            <div v-for="idx in ck.nbTaches" :key="idx" class="q-ml-xl fs-md">{{$t('ESt' + idx)}}</div>
          </div>

          <div v-if="ck.log && ck.log.length" class="q-my-md titre-lg text-italic">{{$t('ESlog')}}</div>

          <div v-for="(log, idx) in ck.log" :key="idx" class="q-mt-md q-ml-md">
            <!-- nom retry start duree stats err -->
            <div class="fs-md font-mono text-bold">
              {{log.nom}}
              <span v-if="log.retry" class="q-ml-md">{{$t('ESretry', [log.retry])}}</span>
              <span class="q-ml-md">{{dhIso(log.start)}}</span>
              <span v-if="log.duree" class="q-ml-md">{{duree(log.duree)}}</span>
            </div>
            <div v-if="log.stats" class="q-ml-lg fs-md font-mono">{{stat(log.stats)}}</div>
            <div v-if="log.err" class="bord q-ml-lg fs-md font-mono height-4 overflow-auto">
              {{log.err}}</div>
            <q-separator color="orange" class="q-mt-sm q-mb-md"/>
          </div>
        </q-page-container>
      </q-layout>
    </q-dialog>

    <q-dialog v-model="ui.d.PApageespace" full-height position="left" persistent>
      <q-layout container view="hHh lpR fFf" :class="styp('md')">
        <q-header elevated>
          <q-toolbar class="bg-secondary text-white">
            <q-btn dense size="md" icon="chevron_left" color="warning" @click="ui.fD"/>
            <q-toolbar-title class="titre-lg full-width text-center">
              {{$t('ESpgesp', [esp.id, esp.org])}}</q-toolbar-title>
            <bouton-help page="page1"/>
          </q-toolbar>
        </q-header>

        <q-page-container>
          <PageEspace :ns="esp.id"/>
        </q-page-container>

      </q-layout>
    </q-dialog>

  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import PageEspace from '../pages/PageEspace.vue'
import { CreerEspace, reconnexionCompte } from '../app/connexion.mjs'
import { GC, GetCheckpoint, SetEspaceT } from '../app/operations.mjs'
import { AMJ, UNITEV1, UNITEV2 } from '../app/api.mjs'
import { styp, edvol, mon, nbn, dkli, afficherDiag } from '../app/util.mjs'

const reg = /^([a-z0-9\-]+)$/

export default {
  name: 'PageAdmin',

  components: { BoutonConfirm, ApercuNotif, BoutonHelp, PageEspace },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' }
  },

  watch: {
    ns (ap, av) {
      if (ap < 10 || ap > 59) { this.dns = this.$t('ESnsh'); return }
      if (this.aNS(ap)) { this.dns = this.$t('ESnum'); return }
      this.dns = ''
    },
    org (ap, av) {
      if (org.length < 4) { this.dorg = this.$t('ESorg1'); return }
      if (org.length > 8) { this.dorg = this.$t('ESorg2'); return }
      if (!op.match(reg)) { this.dorg = this.$t('ESorg3'); return }
      if (this.aOrg(ap)) { this.dorg = this.$t('ESorg4'); return }
      this.dorg = ''
    },
  },

  methods: {
    ev0 (idx) { return mon(this.cfg.profils[idx][0]) },

    ev1 (idx) { 
      const n = this.cfg.profils[idx][1]
      return '[' + n + '] ' + nbn(n * UNITEV1)
    },

    ev2 (idx) { return edvol(this.cfg.profils[idx][2] * UNITEV2) },

    brd (idx) { 
      const x = this.prf === idx + 1 ? ' bord6': (this.profil === idx + 1 ? ' bord7' : ' bord5') 
      return x 
    },

    saisiePS () {
      this.ui.ps = { 
        orgext: this.org,
        verif: true,
        labelValider: 'ok',
        ok: this.okps
      }
      this.ui.oD('PSouvrir')
    },

    async ping (esp) {
      if (this.session.fsSync) {
        const org = await this.session.fsSync.getEspace(esp.id)
        await afficherDiag('Ping: ' + org)
      } else {
        await afficherDiag(this.$t('ESping'))
      }
    },

    async rafraichir () {
      await reconnexionCompte()
    },

    aNS (ns) {
      const mesp = this.session.espaces
      return mesp.has(ns)
    },

    aOrg (org) {
      const mesp = this.session.espaces
      for (const [ns, e] of mesp)
        if (e.org === org) return true
      return false
    },

    plusNS () {
      this.ui.oD('PAcreationesp')
    },

    cancelNS () {
      this.ns = 0
      this.ps = null
      this.ui.fD()
    },

    okps (ps) {
      if (ps) ps.phrase = null
      this.ps = ps
    },

    async creerNS () {
      this.session.setNs(this.ns)
      await new CreerEspace().run(this.org, this.ps, this.ns)
      this.ns = 0
      this.ps = null
      this.ui.fD()
      this.rafraichir()
    },

    async valider () {
      new SetEspaceT().run(this.esp.id, this.prf)
      this.ui.fD()
    },

    ovchgprf1 (e) {
      this.profil = e.t
      this.esp = e
      this.prf = 0
      this.ui.oD('PAedprf')
    },

    pageesp (e) {
      this.ns = e.id
      this.session.setNs(this.ns)
      this.esp = e
      this.ui.oD('PApageespace')
    },

    async testGCop () {
      const ret = await new GC().run(this.gcop)
      if (ret.stats) console.log(JSON.stringify(ret.stats))
      if (ret.err) console.log(JSON.stringify(ret.err))
    },

    async testGC () {
      await new GC().run('GC')
    },

    async affCkpt () {
      this.ck = await new GetCheckpoint().run()
      this.ui.oD('PAcheckpoint')
    },

    dhIso (t) { return new Date(t).toISOString() },

    duree (d) { return d < 1000 ? (d + 'ms') : (d / 1000).toPrecision(3) + 's'},

    stat (s) {
      const r = []
      for (const f in s) { r.push(f + '=' + s[f])}
      return r.join(', ')
    }
  },

  data () {
    return {
      gcops: ['GCHeb', 'GCGro', 'GCPag', 'GCTra', 'GCFpu', 'GCDlv', 'GCstc'],
      gcop: '',
      ns: 0,
      nsc: 0, // ns "courant" de PageEspca à ouvrir
      org: '',
      ps: null,
      ck: null,
      dns: this.$t('ESreq'),
      dorg: this.$t('ESreq'),
      prf: 0,
      profil: 0,
      esp: null
    }
  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const cfg = stores.config

    return {
      session, ui, cfg, dkli, styp,
      AMJ
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 3px
.bord5
  border: 2px solid transparent
.bord6
  border: 2px solid $warning
.bord7
  border: 2px solid $primary
</style>
