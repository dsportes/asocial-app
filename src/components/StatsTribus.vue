<template>
<div class="bord1 full-width">
  <div class="titre-lg text-center">{{$t('STtit', [org, ns, stats.ntr, dh])}}</div>
  <div class="row bord2">
    <div class="col-6 q-pa-xs titre-md items-center column">
      <div>
        <span>{{$t('STl0', [profil])}}</span>
        <q-btn v-if="!session.ns" class="q-ml-md" size="sm" dense color="primary" 
          icon="edit" :label="$t('changer')" @click="ouvchgprf"/>
      </div>
      <div class="text-center">{{$t('STl0b')}}</div>
    </div>
    <div class="col-3 q-pa-xs bord3 fs-md font-mono text-center">{{e1(pq1)}}</div>
    <div class="col-3 q-pa-xs fs-md font-mono text-center">{{e1(pq2)}}</div>
  </div>
  <div class="row bord2">
    <div class="col-6 q-pa-xs titre-md text-center">{{$t('STl1')}}</div>
    <div class="col-3 q-pa-xs bord3 fs-md font-mono text-center">{{e1(stats.q1)}}</div>
    <div class="col-3 q-pa-xs fs-md font-mono text-center">{{e2(stats.q2)}}</div>
  </div>
  <div class="row bord2">
    <div class="col-6 q-pa-xs titre-md text-center">{{$t('STl2')}}</div>
    <div class="col-3 q-pa-xs bord3 fs-md font-mono text-center column items-center">
      <div>{{e1(stats.a1)}}</div>
      <div :class="'q-ml-md q-px-xs ' + (pc1 > 95 ? 'text-bold text-negative bg-yellow-3' : '')">
        {{pc1}}%</div>
    </div>
    <div class="col-3 q-pa-xs fs-md font-mono text-center column items-center">
      <div>{{e2(stats.a2)}}</div>
      <div :class="'q-ml-md q-px-xs ' + (pc2 > 95 ? 'text-bold text-negative bg-yellow-3' : '')">
        {{pc2}}%</div>
    </div>
  </div>
  <div class="row bord2">
    <div class="col-6 q-pa-xs titre-md text-center">{{$t('STl3')}}</div>
    <div class="col-3 q-pa-xs bord3 fs-md font-mono text-center">{{stats.nbc}}</div>
    <div class="col-3 q-pa-xs fs-md font-mono text-center">{{stats.nbsp}}</div>
  </div>
  <div class="row bord2">
    <div class="col-6 q-pa-xs titre-md text-center">{{$t('STl4')}}</div>
    <div class="col-3 q-pa-xs bord3 fs-md font-mono text-center">{{stats.ncoS}}</div>
    <div class="col-3 q-pa-xs fs-md font-mono text-center">{{stats.ncoB}}</div>
  </div>

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
          <div :class="'row cursor-pointer ' + dkli(idx) + (prf===idx+1 ? ' bord6':' bord5')">
            <div class="col-2 text-center font-mono">{{idx + 1}}</div>
            <div class="col-3 text-center font-mono">
              {{e1(cfg.profils[idx][0])}}</div>
            <div :class="'col-2 text-center font-mono ' + (pc1b(idx) > 95 ? ' text-bold text-negative bg-yellow-3' : '')">
              {{pc1b(idx)}}%</div>
            <div class="col-3 text-center font-mono">
              {{e2(cfg.profils[idx][1])}}</div>
            <div :class="'col-2 text-center font-mono ' + (pc2b(idx) > 95 ? ' text-bold text-negative bg-yellow-3' : '')">
              {{pc2b(idx)}}%</div>
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
</div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { edvol, dhcool } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { SetEspaceT } from '../app/operations.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'StatsTribus',

  props: { stats: Object, org: String, ns: Number, profil: Number },
  /*
  - 'ntr' : nombre de tribus
  - `a1 a2` : sommes des quotas attribués aux comptes de la tribu.
  - `q1 q2` : quotas actuels de la tribu
  - `nbc` : nombre de comptes.
  - `nbsp` : nombre de sponsors.
  - `ncoS` : nombres de comptes ayant une notification simple.
  - `ncoB` : nombres de comptes ayant une notification bloquante.
  */

  computed: {
    dh () { return this.stats.dh ? dhcool(this.stats.dh) : ''},
    pq1 () { return this.cfg.profils[this.profil - 1][0] },
    pq2 () { return this.cfg.profils[this.profil - 1][1] },
    pc1 () { return Math.round(this.stats.a1 * 100 / this.pq1)},
    pc2 () { return Math.round(this.stats.a2 * 100 / this.pq2)},
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    e1 (v) { return v + ' ' + edvol(v * UNITEV1) },
    e2 (v) { return v + ' ' + edvol(v * UNITEV2) },
    
    pq1b (idx) { return this.cfg.profils[idx][0] },
    pq2b (idx) { return this.cfg.profils[idx][1] },
    pc1b (idx) { return Math.round(this.stats.a1 * 100 / this.pq1b(idx))},
    pc2b (idx) { return Math.round(this.stats.a2 * 100 / this.pq2b(idx))},

    async valider () {
      new SetEspaceT().run(this.ns, this.prf)
      MD.fD()
    },
    ouvchgprf () {
      this.prf = this.profil
      this.ovedprf()
    }
  },

  data () {
    return {
      prf: 0
    }
  },

  setup () {
    const session = stores.session
    const cfg = stores.config

    const edprf = ref(false)
    function ovedprf () { MD.oD(edprf)}

    return {
      MD, edprf, ovedprf,
      session,
      cfg
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 2px solid $grey-5
.bord2
  border-top: 1px solid $grey-2
.bord3
  border-left: 1px solid $grey-2
  border-right: 1px solid $grey-2
.bord4
  border-bottom: 1px solid $grey-2
.bord5
  border: 2px solid transparent
.bord6
  border: 2px solid $warning
</style>
