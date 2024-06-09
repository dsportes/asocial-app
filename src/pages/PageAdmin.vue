<template>
  <q-page class="q-pa-xs">
    <div class="column">
      <!--
      <div class="row justify-center">
        <q-btn padding="xs" class="q-ml-xs" dense color="warning" :label="$t('ESck')" @click="affCkpt"/>
        <q-select v-model="gcop" dense :options="gcops" 
          class="q-ml-lg" label="GCop ???" style="width:6rem"/>
        <q-btn padding="xs" class="q-ml-xs" dense color="warning" 
          :disable="gcop === ''" :label="$t('go')" @click="testGCop"/>
      </div>
      -->

      <div class="q-mt-sm row q-gutter-xs justify-center">
        <btn-cond icon="refresh" :label="$t('rafraichir')" @click="loadEsp"/>
        <btn-cond color="warning" :label="$t('ESgcin')" @click="initGC"/>
        <btn-cond color="warning" :label="$t('ESstartd')" @click="startDemon"/>
        <btn-cond icon="add" :label="$t('ESne')" @click="plusNS"/>
      </div>
    </div>

    <div class="titre-lg text-white bg-secondary q-pa-xs full-width text-center q-my-sm">
      {{$t('ESlo', lstEsp.length, { count: lstEsp.length })}}</div>

    <div class="spmd"> <!-- Liste des espaces -->
      <q-expansion-item  v-for="(esp, idx) in lstEsp" :key="esp.id" class="q-my-xs"
        switch-toggle-side expand-separator dense group="espaces">
        <template v-slot:header>
          <div :class="dkli(idx) + ' row justify-between text-bold font-mono fs-lg'">
            <span class="q-mr-md">#{{esp.id}}</span>
            <span>{{esp.org}}</span>
            <span v-if="esp.moisStat" class="q-ml-md fs-sm">{{$t('ESdms', [esp.moisStat])}}</span>
          </div>
        </template>

        <div class="q-ml-lg">
          <div class="row justify-between q-my-xs">
            <span class="fs-md">{{$t('ESprf', [esp.nprof])}}</span>
            <btn-cond :label="$t('changer')"  @click="ovchgprf1(esp)"/>
          </div>

          <div class="titre-md q-my-xs">{{$t('ESnbmi2', [esp.nbmi])}}</div>

          <div class="titre-md q-my-xs">{{$t('PTopt' + esp.opt)}}</div>

          <div class="q-my-xs">
            <bouton-dlvat :espace="esp" @close="finDlv"/>
          </div>

          <apercu-notif class="q-my-xs" :notif="esp.notifE" :idx="idx" 
            :type="0" :cible="ID.court(esp.id)"/>

        </div>
      </q-expansion-item>
    </div>

    <!-- Création d'un espace -->
    <q-dialog v-model="ui.d.PAcreationesp" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond icon="close" color="warning" @click="cancelNS"/>
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
            <btn-cond :label="$t('ESps')" no-caps class="titre-lg" @click="saisiePS" 
              :disable="!org"/>
            <bouton-confirm class="q-my-lg maauto" :actif="ps !== null && !dns && !dorg" 
              :confirmer="creerNS"/>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Changement du profil de l'espace -->
    <q-dialog v-model="ui.d.PAedprf" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @click="ui.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('STchg')}}</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="q-my-md q-mx-sm">
          <div class="row bord4">
            <div class="col-3 text-center font-mono">#</div>
            <div class="col-3 text-center font-mono">{{$t('limco')}}</div>
            <div class="col-3 text-center font-mono">{{$t('nbnnncng')}}</div>
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
          <btn-cond flat icon="undo" :label="$t('renoncer')" @click="ui.fD"/>
          <btn-cond color="warning" icon="check" 
            :label="$t('valider')" :disable="prf === profil" @click="valider"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!--
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
          <div v-for="(s, idx) in singl" :key="s.id" :class="dkli(idx)">
            <div class="fs-md font-mono text-bold">{{$t('SINGL' + s.id)}}</div>
            <div class="q-ml-lg">
              <span v-if="s.nr" class="q-mr-md">{{$t('ESretry', [s.nr])}}</span>
              <span class="q-mr-md">{{dhIso(s.v)}}</span>
              <span>{{duree(s.duree)}}</span>
            </div>
            <div v-if="s.stats" class="q-ml-lg fs-md font-mono">{{stat(s.stats)}}</div>
            <div v-if="s.exc" class="bord q-ml-lg fs-md font-mono height-4 overflow-auto">
              {{s.exc}}</div>
            <q-separator color="orange" class="q-mt-sm"/>
          </div>
        </q-page-container>
      </q-layout>
    </q-dialog>
    -->

    <!--
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
    -->
  </q-page>
</template>

<script>
import { ref, onMounted } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import BoutonDlvat from '../components/BoutonDlvat.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'
import { CreerEspace, SetEspaceNprof, InitTachesGC, StartDemon } from '../app/operations4.mjs'
import { GetEspaces } from '../app/synchro.mjs'
import { compile } from '../app/modele.mjs'
// import { GC, GetSingletons } from '../app/operations.mjs'
import { ID, AMJ, UNITEN, UNITEV } from '../app/api.mjs'
import { styp, edvol, mon, nbn, dkli, afficherDiag } from '../app/util.mjs'

const reg = /^([a-z0-9\-]+)$/

export default {
  name: 'PageAdmin',

  components: { BoutonConfirm, ApercuNotif, BoutonHelp, BoutonDlvat, BtnCond },

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
      if (ap.length < 4) { this.dorg = this.$t('ESorg1'); return }
      if (ap.length > 8) { this.dorg = this.$t('ESorg2'); return }
      if (!ap.match(reg)) { this.dorg = this.$t('ESorg3'); return }
      if (this.aOrg(ap)) { this.dorg = this.$t('ESorg4'); return }
      this.dorg = ''
    },
  },

  methods: {
    ev0 (idx) { return mon(this.cfg.profils[idx][0]) },

    ev1 (idx) { 
      const n = this.cfg.profils[idx][1]
      return '[' + n + '] ' + nbn(n * UNITEN)
    },

    ev2 (idx) { return edvol(this.cfg.profils[idx][2] * UNITEV) },

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

    async finDlv (tf) {
      if (tf) await this.loadEsp()
    },

    async initGC () {
      const [nx, nc] = await new InitTachesGC().run()
      await afficherDiag(this.$t('ESinitgc', [nx, nc]))
    },

    async startDemon () {
      await new StartDemon().run()
    },

    aNS (ns) {
      for (const e of this.lstEsp)
        if (e.id === ns) return true
      return false
    },

    aOrg (org) {
      for (const e of this.lstEsp)
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
      await new CreerEspace().run(this.org, this.ps, this.ns)
      this.ns = 0
      this.ps = null
      this.ui.fD()
      await this.loadEsp()
    },

    async valider () {
      await new SetEspaceNprof().run(ID.court(this.esp.id), this.prf)
      this.ui.fD()
      await this.loadEsp()
    },

    ovchgprf1 (e) {
      this.profil = e.nprof
      this.esp = e
      this.prf = 0
      this.ui.oD('PAedprf')
    },

    /*
    async testGCop () {
      const ret = await new GC().run(this.gcop)
      if (ret.stats) console.log(JSON.stringify(ret.stats))
      if (ret.err) console.log(JSON.stringify(ret.err))
    },

    async testGC () {
      await new GC().run('GC')
    },

    async affCkpt () {
      this.singl = []
      const r = await new GetSingletons().run()
      r.forEach(d => { this.singl.push(decode(d))})
      this.ui.oD('PAcheckpoint')
    },

    dhIso (t) { return new Date(t).toISOString() },

    duree (d) { if (!d) return '<1ms'
      return d < 1000 ? (d + 'ms') : (d / 1000).toPrecision(3) + 's'
    },

    stat (s) {
      const r = []
      for (const f in s) { r.push(f + '=' + s[f])}
      return r.join(', ')
    }
    */
  },

  data () {
    return {
      gcop: '',
      ns: 0,
      nsc: 0, // ns "courant" de PageEspca à ouvrir
      org: '',
      ps: null,
      singl: null,
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
    const lstEsp = ref([])

    async function loadEsp () {
      const lst = []
      const rows = await new GetEspaces().run()
      if (rows) for (const row of rows) lst.push(await compile(row))
      lst.sort((a, b) => { return a.id < b.id ? -1 : (a.id === b.id ? 0 : 1)})
      lstEsp.value = lst
    }

    onMounted(async () => {
      await loadEsp()
    })

    return {
      session, ui, cfg, dkli, styp, lstEsp, loadEsp, ID,
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
