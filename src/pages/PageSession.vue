<template>
  <q-page class="spmd">
    <div v-if="session.ok" class="q-mb-md">
      <div class="text-italic titre-lg">{{$t('ISst', [st, mo])}}</div>

      <div class="titre-md text-italic q-mt-md">{{$t('ISconso', [mon(couts[4], 4)])}}</div>
      <div class="row items-center">
        <div class="col-4 text-center text-italic">{{$t('PCPlec')}}</div>
        <div class="col-4 text-center font-mono">{{session.consocumul.nl}}</div>
        <div class="col-4 text-center font-mono">{{mon(couts[0], 4)}}</div>
      </div>
      <div class="row items-center">
        <div class="col-4 text-center text-italic">{{$t('PCPecr')}}</div>
        <div class="col-4 text-center font-mono">{{session.consocumul.ne}}</div>
        <div class="col-4 text-center font-mono">{{mon(couts[1], 4)}}</div>
      </div>
      <div class="row items-center">
        <div class="col-4 text-center text-italic">{{$t('PCPvd')}}</div>
        <div class="col-4 text-center font-mono">{{edvol(session.consocumul.vd)}}</div>
        <div class="col-4 text-center font-mono">{{mon(couts[2], 4)}}</div>
      </div>
      <div class="row items-center">
        <div class="col-4 text-center text-italic">{{$t('PCPvm')}}</div>
        <div class="col-4 text-center font-mono">{{edvol(session.consocumul.vm)}}</div>
        <div class="col-4 text-center font-mono">{{mon(couts[3], 4)}}</div>
      </div>
    </div>

    <q-expansion-item v-if="session.status" group="etc" class="full-width" switch-toggle-side default-opened
      header-class="expansion-header-class-1 titre-md bg-primary text-white" 
      :label="$t('RStit', [nc])">
      <rapport-synchro class="q-ma-sm"/>
    </q-expansion-item>
    <q-separator/>

    <q-expansion-item group="etc" class="full-width" switch-toggle-side :disable="!fSt.queue.length"
      header-class="expansion-header-class-1 titre-md bg-primary text-white">
      <template v-slot:header>
        <q-item-section>
          <div class="row items-center">
            <q-icon v-if="fSt.queue.length" color="white" name="check" size="md"/>
            <span>{{$t('SYtec', fSt.queue.length, { count: fSt.queue.length })}}</span>
          </div>
        </q-item-section>
      </template>
      <q-card-section v-for="f in fSt.lstQueue" :key="f.id" class="ma-qcard-section">
        <div class="row justify-between items-center">
          <div class="col">
            <span class="font-mono fs-md">{{f.id}}</span>
            <span :class="'text-bold q-px-lg ' + (f.courant?'text-warning':'')" >{{f.nom + ' - ' + f.info}}</span>
            <span class="font-mono fs-md">{{edvol(f.lg)}}</span>
          </div>
          <div class="col-auto">
            <span class="font-mono fs-sm q-ml-sm">{{dhcool(f.dhd)}}</span>
          </div>
        </div>
      </q-card-section>
    </q-expansion-item>
    <q-separator/>

    <q-expansion-item group="etc" class="full-width" switch-toggle-side :disable="!fSt.echecs.size"
      header-class="expansion-header-class-1 titre-md bg-primary text-white">
      <template v-slot:header>
        <q-item-section>
          <div class="row items-center">
            <q-icon v-if="fSt.echecs.size" color="warning" name="warning" size="md"/>
            <span>{{$t('SYtex', fSt.echecs.size, { count: fSt.echecs.size })}}</span>
          </div>
        </q-item-section>
      </template>
      <q-card-section v-for="f in fSt.lstEchecs" :key="f.id" class="ma-qcard-section">
        <div class="row justify-between items-center">
          <div class="col">
            <span class="font-mono fs-md">{{f.id}}</span>
            <span class="text-bold q-px-lg">{{f.nom + ' - ' + f.info}}</span>
            <span class="fs-md">{{edvol(f.lg)}}</span>
          </div>
          <div class="col-auto">
            <span class="font-mono fs-sm q-mx-sm">{{dhcool(f.dhd)}}</span>
            <q-btn dense color="primary" size="md" icon="menu">
              <q-menu transition-show="scale" transition-hide="scale">
                <q-list dense style="min-width: 15rem">
                  <q-item clickable v-close-popup @click="retry(f.id)">
                    <q-item-section>{{$t('reessayer')}}</q-item-section>
                  </q-item>
                  <q-item clickable v-close-popup @click="abandon(f.id)">
                    <q-item-section>{{$t('SYren')}}</q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </div>
        </div>
        <div class="row justify-between q-mr-lg">
          <div class="col font-mono fs-md" v-html="f.err"/>
          <div class="col-auto font-mono fs-sm q-ml-sm">{{dhcool(f.dhx)}}</div>
        </div>
        <q-separator class="q-my-sm"/>
      </q-card-section>
    </q-expansion-item>

  </q-page>
</template>

<script>

import RapportSynchro from '../components/RapportSynchro.vue'
import stores from '../stores/stores.mjs'
import { dhcool, edvol, mon } from '../app/util.mjs'
import { Tarif, AMJ } from '../app/api.mjs'

export default {
  name: 'PageSession',

  components: { RapportSynchro },

  computed: {
    nc () { return this.session.getCV(this.session.compteId).nom },
    couts () { return Tarif.evalConso(this.session.consocumul) },
    st () { 
      const n = this.session.status < 2 ? this.session.status : 2
      return this.$t('ISst' + n)
    },
    mo () { return this.session.synchro ? this.$t('sync') : 
      (this.session.avion ? this.$t('avion') : 'incognito')}
  },

  methods: {
    dhcool (x) { return x ? dhcool(x, true) : '---' },
    async retry (idf) {
      const e = this.fSt.getFetat(idf)
      await e.retry()
    },
    async abandon (idf) {
      const e = this.fSt.getFetat(idf)
      await e.abandon()
    }
  },

  data () {
    return {
    }
  },

  setup () {
    return {
      edvol, mon, AMJ,
      ui: stores.ui,
      session: stores.session,
      config: stores.config,
      aSt: stores.avatar,
      fSt: stores.fetat
    }
  }
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.ma-qcard-section
  padding: 3px !important
</style>

