<template>
  <q-page class="q-pa-xs">
    <div class="q-my-sm row q-gutter-sm">
      <q-btn dense color="warning" label="GC versions dlv" @click="testGCRes"/>
      <q-btn dense color="warning" label="GC heb" @click="testGCHeb"/>
      <q-btn dense color="warning" label="GC" @click="testGC"/>
      <q-btn dense color="warning" label="Checkpoint" @click="affCkpt"/>
    </div>

    <q-separator color="orange"/>

    <q-btn class="q-my-sm" dense color="primary" :label="$t('rafraichir')" @click="rafraichir"/>

    <div class="titre-md q-my-sm row items-center">
      <q-btn dense size="md" icon="add" :label="$t('ESne')" class="q-mr-sm btn1"
        color="primary" :disable="ns !== 0" @click="plusNS"/>
    </div>

    <div v-for="(e, idx) in session.paLeFT" :key="e.id">
      <apercu-espace class="q-my-md" :esp="e" :idx="idx"/>
      <q-separator class="q-my-sm" color="orange"/>
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
            <div class="q-my-sm">
              <span class="titre-md text-italic q-mr-lg">{{$t('ESjdtr')}}</span>
              <span class="font-mono fs-md">{{ck.jdtr ? AMJ.editDeAmj(ck.jdtr) : '-'}}</span>
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

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import PhraseSecrete from '../components/PhraseSecrete.vue'
import ApercuEspace from '../components/ApercuEspace.vue'
import BoutonHelp from '../components/BoutonHelp.vue'
import { CreerEspace, reconnexionCompte } from '../app/connexion.mjs'
import { GC, GetCheckpoint } from '../app/operations.mjs'
import { MD } from '../app/modele.mjs'
import { AMJ } from '../app/api.mjs'

const reg = /^([a-z0-9\-]+)$/

export default {
  name: 'PageAdmin',

  components: { BoutonConfirm, ApercuEspace, PhraseSecrete, BoutonHelp },

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
      if (ap.length > 12) { this.dorg = this.$t('ESorg2'); return }
      if (!ap.match(reg)) { this.dorg = this.$t('ESorg3'); return }
      if (this.aOrg(ap)) { this.dorg = this.$t('ESorg4'); return }
      this.dorg = ''
    },
  },

  methods: {
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

    async testGCRes () {
      const ret = await new GC().run('GCRes')
      console.log(ret.a.length)
    },
    async testGCHeb () {
      await new GC().run('GCHeb')
    },
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
      org: '',
      ps: null,
      ck: null,
      dns: this.$t('ESreq'),
      dorg: this.$t('ESreq')
    }
  },

  setup () {
    // TODO : gcvols à traiter 
    const session = stores.session
    const creationesp = ref(false)
    function ovcreationesp () { MD.oD(creationesp) }
    const checkpoint = ref(false)
    function ovcheckpoint () { MD.oD(checkpoint) }
    return {
      AMJ, MD, session, creationesp, ovcreationesp, checkpoint, ovcheckpoint
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
</style>
