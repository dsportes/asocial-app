<template>
  <q-page class="q-pa-xs">
    <div class="q-my-sm row justify-around">
      <q-btn class="btn1" dense color="warning" :label="$t('ESgc')" @click="testGC"/>
      <q-btn class="btn1" dense color="warning" :label="$t('ESck')" @click="affCkpt"/>
    </div>

    <q-separator color="orange"/>

    <div class="q-my-sm row justify-around">
      <q-btn class="btn1" dense size="md" color="primary" icon="refresh"
        :label="$t('rafraichir')" @click="rafraichir"/>
      <q-btn class="btn1" dense size="md" color="primary" icon="add" 
        :label="$t('ESne')" @click="plusNS"/>
    </div>

    <div class="titre-lg text-white bg-secondary q-pa-xs full-width text-center q-my-sm">
      {{$t('ESlo', session.paLeFT.length, { count: session.paLeFT.length})}}</div>

    <div v-for="(esp, idx) in session.paLeFT" :key="esp.id">
      <div :class="dkli(idx) + ' largeur40 maauto'">

        <div class="row justify-between">
          <div class="text-bold font-mono fs-lg">
            <span class="q-mr-md">#{{esp.id}}</span>
            <span>{{esp.org}}</span>
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
          <q-btn class="btn1" dense color="primary" :label="$t('changer')"
            @click="ovchgprf1(esp)"/>
        </div>

        <apercu-notif class="q-ml-lg q-mt-sm" :notif="esp.notif" :idx="idx" 
          :nom="esp.org" :ns="esp.id"/>

      </div>
    </div>

    <q-dialog v-model="creationesp" persistent>
      <q-card class="bs petitelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense size="md" icon="close" color="warning" @click="cancelNS"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('ESne2')}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>
        <q-card-section class="q-pa-xs">
          <div class="row items-center">
            <q-input class="col-6" v-model.number="ns" type="number" style="width:6rem"
            :label="$t('ESns')" :hint="$t('ESnsh')" dense/>
            <div v-if="dns" class = "coll-6 q-ml-lg text-negative text-bold">{{dns}}</div>
          </div>
          <div class="row items-center">
            <q-input class="col-6" v-model="org" style="width:12rem"
              :label="$t('ESorg')" :hint="$t('ESorgh')" dense/>
            <div v-if="dorg" class = "col-6 q-ml-lg text-negative text-bold">{{dorg}}</div>
          </div>
          <div class="titre-lg text-center q-my-md">{{$t('ESps')}}</div>
          <phrase-secrete @ok="okps" :orgext="org"
            verif icon-valider="check" :label-valider="$t('OK')"/>
          <bouton-confirm class="q-my-lg maauto" :actif="ps !== null && !dns && !dorg" 
            :confirmer="creerNS"/>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="edprf" persistent>
      <q-card class="bs moyennelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense color="warning" size="md" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">{{$t('STchg')}}</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="q-my-md q-mx-sm">
          <div class="row bord4">
            <div class="col-2 text-center font-mono">#</div>
            <div class="col-5 text-center font-mono">V1</div>
            <div class="col-5 text-center font-mono">V2</div>
          </div>
          <div v-for="(x, idx) of cfg.profils" :key="idx" @click="prf = idx+1">
            <div :class="'row cursor-pointer ' + dkli(idx) + brd(idx)">
              <div class="col-2 text-center font-mono">{{idx + 1}}</div>
              <div class="col-2 text-center font-mono">{{cfg.profils[idx][0]}}</div>
              <div class="col-3 text-center font-mono">{{e1(cfg.profils[idx][0])}}</div>
              <div class="col-2 text-center font-mono">{{cfg.profils[idx][1]}}</div>
              <div class="col-3 text-center font-mono">{{e2(cfg.profils[idx][1])}}</div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions>
          <q-btn dense flat color="primary" size="md" icon="close" :label="$t('renoncer')" 
            @click="MD.fD"/>
          <q-btn class="q-ml-md" dense flat color="warning" size="md" icon="chek" 
            :label="$t('valider')" :disable="prf === profil" @click="valider"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="checkpoint" persistent full-height>
      <div class="bs" style="width:80vw">
        <q-layout container view="hHh lpR fFf" :class="sty">
          <q-header elevated class="bg-secondary text-white">
            <q-toolbar class="bg-secondary text-white">
              <q-btn dense size="md" icon="close" color="warning" @click="MD.fD"/>
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
      </div>
    </q-dialog>

    <q-dialog v-model="pageespace" persistent full-height>
      <div class="bs" style="width:100vw;max-width:100vw">
        <q-toolbar class="bg-secondary text-white" style="position:fixed;z-index:2">
          <q-btn dense size="md" icon="close" color="warning" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg full-width text-center">
            {{$t('ESpgesp', [esp.id, esp.org])}}</q-toolbar-title>
          <bouton-help page="page1"/>
        </q-toolbar>

        <q-layout container view="hHh lpR fFf" :class="sty">
          <q-page-container>
            <PageEspace :ns="esp.id"/>
          </q-page-container>
        </q-layout>
      </div>
    </q-dialog>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import PageEspace from '../pages/PageEspace.vue'
import { CreerEspace, reconnexionCompte } from '../app/connexion.mjs'
import { GC, GetCheckpoint, SetEspaceT } from '../app/operations.mjs'
import { MD } from '../app/modele.mjs'
import { AMJ, UNITEV1, UNITEV2 } from '../app/api.mjs'
import { edvol, dkli, afficherDiag } from '../app/util.mjs'

const reg = /^([a-z0-9\-]+)$/

export default {
  name: 'PageAdmin',

  components: { BoutonConfirm, PhraseSecrete, ApercuNotif, BoutonHelp, PageEspace },

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
      const i = ap.lastIndexOf('@')
      let org, br
      if (i === -1) { org = ap; br = '' }
      else { org = ap.substring(0, i); br = ap.substring(i+1) }
      if (org.length < 4) { this.dorg = this.$t('ESorg1'); return }
      if (org.length > 12) { this.dorg = this.$t('ESorg2'); return }
      if (i !== -1 && br.length < 1) { this.dorg = this.$t('ESorg1b'); return }
      if (i !== -1 && br.length > 3) { this.dorg = this.$t('ESorg2b'); return }
      if (!org.match(reg)) { this.dorg = this.$t('ESorg3'); return }
      if (i !== -1 && !br.match(reg)) { this.dorg = this.$t('ESorg3'); return }
      if (this.aOrg(ap)) { this.dorg = this.$t('ESorg4'); return }
      this.dorg = ''
    },
  },

  methods: {
    e1 (v) { return edvol(v * UNITEV1) },
    e2 (v) { return edvol(v * UNITEV2) },
    brd (idx) { 
      const x = this.prf === idx + 1 ? ' bord6': (this.profil === idx + 1 ? ' bord7' : ' bord5') 
      return x 
    },

    async ping (esp) {
      const org = await this.session.fsSync.getEspace(esp.id)
      await afficherDiag('Ping: ' + org)
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
      this.ovcreationesp()
    },
    cancelNS () {
      this.ns = 0
      this.ps = null
      MD.fD()
    },
    okps (ps) {
      this.ps = ps
    },
    async creerNS () {
      this.session.setNs(this.ns)
      await new CreerEspace().run(this.org, this.ps)
      this.ns = 0
      this.ps = null
      MD.fD()
      this.rafraichir()
    },

    async valider () {
      new SetEspaceT().run(this.esp.id, this.prf)
      MD.fD()
    },
    ovchgprf1 (e) {
      this.profil = e.t
      this.esp = e
      this.prf = 0
      this.ovedprf()
    },

    pageesp (e) {
      this.ns = e.id
      this.session.setNs(this.ns)
      this.esp = e
      this.ovpageespace()
    },

    /*
    async testGCRes () {
      const ret = await new GC().run('GCRes')
      console.log(ret.a.length)
    },
    async testGCHeb () {
      await new GC().run('GCHeb')
    },
    */
    async testGC () {
      await new GC().run('GC')
    },
    async affCkpt () {
      this.ck = await new GetCheckpoint().run()
      this.ovcheckpoint()
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
    // TODO : gcvols à traiter 
    const session = stores.session
    const cfg = stores.config

    const edprf = ref(false)
    function ovedprf () { MD.oD(edprf)}
    const creationesp = ref(false)
    function ovcreationesp () { MD.oD(creationesp) }
    const checkpoint = ref(false)
    function ovcheckpoint () { MD.oD(checkpoint) }
    const pageespace = ref(false)
    function ovpageespace () { MD.oD(pageespace) }

    return {
      session, cfg, dkli,
      AMJ, MD, 
      creationesp, ovcreationesp, checkpoint, ovcheckpoint, edprf, ovedprf,
      pageespace, ovpageespace
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btn1
  max-height: 1.5rem
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
