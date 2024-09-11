<template>
  <q-page class="q-pa-xs">

    <q-tabs  class="col titre-md" v-model="tab" inline-label outside-arrows mobile-arrows no-caps>
      <q-tab name="espaces" :label="$t('EStabe')"/>
      <q-tab name="taches" :label="$t('EStabt')"/>
    </q-tabs>

    <div v-if="tab==='taches'" class="q-pa-xs">
      <div class="full-width q-mb-sm row items-center justify-between bg-secondary text-white">
        <btn-cond icon="refresh" @ok="getTaches"/>
        <div class="row items-center">
          <span class="q-mr-sm">{{$t('ESfta')}}</span>
          <q-input class="w6" v-model="ns"
              :label="$t('ESns')" :hint="$t('ESnsh2')" dense/>
        </div>
        <btn-cond color="warning" :label="$t('ESgcin')" @ok="initGC"/>
        <btn-cond color="warning" :label="$t('ESstartd')" @ok="startDemon"/>
      </div>

      <div v-for="(t, idx) in taches" :key="idx">
        <div :class="dkli(idx) + ' q-my-sm full-with'">
          <div class="row font-mono">
            <div class="col-1 text-center">{{OPNOMS[t.op]}}</div>
            <div class="col-1 text-center">{{t.ns}}</div>
            <div class="col-4 text-center">{{dhstring(t.dh, true)}}</div>
            <div class="col-2 text-center">{{t.id}}</div>
            <div class="col-2 text-center">{{t.ids}}</div>
            <btn-cond class="col-1 text-right" icon="delete" @ok="tacheDel(t)"/>
            <btn-cond class="col-1 text-right" icon="refresh" @ok="tacheGo(t)"/>
          </div>
          <q-input v-if="t.exc" type="textarea" autogrow v-model="t.exc" class="q-pa-xs stackclass font-mono"/>
        </div>
      </div>
    </div>

    <div v-if="tab==='espaces'" class="row justify-between text-white bg-secondary q-pa-xs full-width q-my-sm">
      <btn-cond icon="refresh" @ok="loadEsp"/>
      <div class="col titre-lg text-center">{{$t('ESlo', lstEsp.length, { count: lstEsp.length })}}</div>
      <btn-cond icon="add" :label="$t('ESne')" @ok="plusNS"/>
    </div>

    <div v-if="tab==='espaces'" class="spmd"> <!-- Liste des espaces -->
      <q-expansion-item  v-for="(esp, idx) in lstEsp" :key="esp.ns" class="q-my-xs"
        switch-toggle-side expand-separator dense group="espaces">
        <template v-slot:header>
          <div :class="dkli(idx) + ' row full-width justify-between text-bold font-mono fs-lg'">
            <div class="col">
              <span class="q-mr-md">#{{esp.ns}}</span>
              <span>{{esp.org}}</span>
              <span v-if="esp.hTC" class="msg q-mx-sm">{{$t('ESencrea')}}</span>
              <span v-if="!esp.hTC && esp.moisStat" class="q-ml-md fs-sm">{{$t('ESdms', [esp.moisStat])}}</span>
            </div>
            <notif-icon v-if="esp.notifE" class="col-auto" :niv="nvntf(esp.notifE)"/>
          </div>
        </template>

        <div class="q-ml-lg">
          <btn-cond v-if="esp.hTC" class="q-ma-xs" :label="$t('ENnpspc')" 
            @ok="this.esp = esp; ui.oD('PAnvspc')" />
          <div class="row justify-between q-my-xs">
            <span class="fs-md">{{$t('ESprf', [esp.nprof])}}</span>
            <btn-cond :label="$t('changer')"  @ok="ovchgprf1(esp)"/>
          </div>

          <div v-if="!esp.hTC">
            <div class="titre-md q-my-xs">{{$t('ESnbmi2', [esp.nbmi])}}</div>

            <div v-if="esp.opt" class="titre-md q-my-xs">{{$t('PTopt')}}</div>

            <div class="q-my-xs">
              <bouton-dlvat :espace="esp" @close="finDlv"/>
            </div>

            <apercu-notif class="q-my-xs" :notif="esp.notifE" :idx="idx" 
              :type="0" :cible="esp.ns"/>

            <div class="q-mb-sm">
              <div class="titre-md">{{$t('PEstm')}}</div>
              <div class="row q-gutter-sm q-mb-sm">
                <btn-cond class="self-start b1" label="M" @ok="dlstat(esp, 0)"/>
                <btn-cond class="self-start b1" label="M-1" @ok="dlstat(esp, 1)"/>
                <btn-cond class="self-start b1" label="M-2" @ok="dlstat(esp, 2)"/>
                <btn-cond class="self-start b1" label="M-3" @ok="dlstat(esp, 3)"/>
                <saisie-mois v-model="mois" :dmax="maxdl" :dmin="mindl(esp)" :dinit="maxdl"
                  @ok="dlstat2(esp)" icon="download" :label="$t('ESdlc')"/>
              </div>
            </div>
          </div>
        </div>
      </q-expansion-item>
    </div>

    <!-- Création d'un espace -->
    <q-dialog v-model="ui.d.PAcreationesp" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond icon="close" color="warning" @ok="cancelNS"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('ESne2')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <q-card-section class="q-pa-xs">
          <div class="row items-center full-width">
            <q-input class="col-6 q-pr-md" v-model="ns"
              :label="$t('ESns')" :hint="$t('ESnsh')" dense/>
            <div v-if="dns" class="col-6 text-negative bg-yellow-3 text-bold q-px-xs">{{dns}}</div>
          </div>
          <div class="row items-center full-width">
            <q-input class="col-6  q-pr-md" v-model="org"
              :label="$t('ESorg')" hint="monorg" dense/>
            <div v-if="dorg" class="col-6 text-negative bg-yellow-3 text-bold q-px-xs">{{dorg}}</div>
          </div>
          <div class="column justify-center q-mt-md">
            <phrase-contact declaration :orgext="org" @ok="okps" :disable="!org"/>
            <bouton-confirm class="q-my-lg maauto" :actif="ps !== null && !dns && !dorg" 
              :confirmer="creerNS"/>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Changement de la phrase de sponsoring du Comptable -->
    <q-dialog v-model="ui.d.PAnvspc" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('ENnpspc')}}</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="q-my-md q-mx-sm">
          <phrase-contact declaration :orgext="esp.org" @ok="okps" :disable="!org"/>
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="check" 
            :label="$t('valider')" :disable="!ps" @ok="nvspc"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Changement du profil de l'espace -->
    <q-dialog v-model="ui.d.PAedprf" persistent>
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('ESchg')}}</q-toolbar-title>
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
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="check" 
            :label="$t('valider')" :disable="prf === profil" @ok="valider"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

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
import PhraseContact from '../components/PhraseContact.vue'
import SaisieMois from '../components/SaisieMois.vue'
import NotifIcon from '../components/NotifIcon.vue'
import { CreationEspace, MajSponsEspace, SetEspaceNprof, InitTachesGC, 
  StartDemon, DownloadStatC, DownloadStatC2, 
  GetTaches, DelTache, GoTache } from '../app/operations4.mjs'
import { GetEspaces } from '../app/synchro.mjs'
import { compile } from '../app/modele.mjs'
import { Cles, ID, AMJ, UNITEN, UNITEV } from '../app/api.mjs'
import { $t, styp, edvol, mon, nbn, dkli, afficherDiag, dhstring } from '../app/util.mjs'

const reg = /^([a-z0-9\-]+)$/

const OPNOMS = {
  1: 'DFH',
  2: 'DLV',
  3: 'TRA',
  4: 'VER',
  5: 'STA',
  7: 'FPU',
  21: 'GRM',
  22: 'AGN',
  24: 'AVC',
  25: 'ESP'
}

export default {
  name: 'PageAdmin',

  components: { NotifIcon, PhraseContact, BoutonConfirm, ApercuNotif, BoutonHelp, BoutonDlvat, BtnCond, SaisieMois },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    maxdl () { 
      const m = AMJ.djMoisN(AMJ.amjUtc(), -1)
      return Math.floor(m / 100)
    }
  },

  watch: {
    ns (ap, av) {
      if (ap.length !== 1 || Cles.nsToInt(ap) === -1) { this.dns = this.$t('ESnsh'); return }
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
    nvntf (ntf) {
      return ntf.nr === 1 ? 1 : (ntf.nr === 2 ? 4 : 6)
    },

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

    async nvspc () {
      await new MajSponsEspace().run(this.esp.org, this.ps, this.esp.id)
      this.ns = 0
      this.ps = null
      this.ui.fD()
      await this.loadEsp()
    },

    async creerNS () {
      await new CreationEspace().run(this.org, this.ps, this.ns)
      this.ns = 0
      this.ps = null
      this.ui.fD()
      await this.loadEsp()
    },

    async valider () {
      await new SetEspaceNprof().run(this.esp.id, this.prf)
      this.ui.fD()
      await this.loadEsp()
    },

    ovchgprf1 (e) {
      this.profil = e.nprof
      this.esp = e
      this.prf = 0
      this.ui.oD('PAedprf')
    },

    async dlstat (esp, mr) {
      const cleES = esp.cleES
      const { err, blob, creation, mois } = 
        await new DownloadStatC().run(esp.org, mr, cleES)
      const nf = esp.org + '-C_' + mois
      if (!err) {
        saveAs(blob, nf)
        await afficherDiag($t('PEsd', [nf]))
      } else {
        await afficherDiag($t('PEnd' + err))
      }
    },

    mindl (esp) { 
      return Math.floor(esp.dcreation / 100)
    },

    async dlstat2 (esp) {
      const cleES = esp.cleES
      const { err, blob } = await new DownloadStatC2()
        .run(esp.org, parseInt(this.mois), 'C', cleES)
      const nf = esp.org + '-C_' + this.mois
      if (!err) {
        saveAs(blob, nf)
        await afficherDiag($t('PEsd', [nf]))
      } else {
        await afficherDiag($t('PEnd') + err)
      }
    },

    async getTaches () {
      this.taches = await new GetTaches().run(this.ns)
    },

    async tacheDel (t) {
      await new DelTache().run(t)
    },

    async tacheGo (t) {
      await new GoTache().run(t)
    }
  },

  data () {
    return {
      tab: 'taches',
      gcop: '',
      ns: '0',
      nsc: '', // ns "courant" de PageEspace à ouvrir
      org: '',
      ps: null,
      singl: null,
      dns: this.$t('ESreq'),
      dorg: this.$t('ESreq'),
      prf: 0,
      profil: 0,
      esp: null,
      mois: Math.floor(this.session.auj / 100),
      taches: []
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
      if (rows) for (const row of rows) 
        lst.push(await compile(row))
      lst.sort((a, b) => { return a.ns < b.ns ? -1 : (a.ns === b.ns ? 0 : 1)})
      lstEsp.value = lst
    }

    onMounted(async () => {
      await loadEsp()
    })

    return {
      session, ui, cfg, dkli, styp, lstEsp, loadEsp, ID, dhstring, OPNOMS,
      AMJ
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.w6
  with: 6rem
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
.b1
  width: 4rem
</style>
