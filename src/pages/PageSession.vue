<template>
  <q-page class="column items-center">
    <q-card class="spmd">
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

      <div class="titre-md q-mt-md">{{$t('ISdcs')}}</div>
      <div v-if="session.ok && dsync">
        <div class='q-ml-md row'>
          <div class='col-7 text-right text-italic q-pr-md'>{{$t('ISsy1')}}</div>
          <div class='col-5 text-bold'>{{dhcool(dsync.dhdebutp)}}</div>
        </div>
        <div class='q-ml-md row'>
          <div class='col-7 text-right text-italic q-pr-md'>{{$t('ISsy2')}}</div>
          <div class='col-5 text-bold'>{{dhcool(dsync.dhfinp)}}</div>
        </div>
        <div class='q-ml-md row'>
          <div class='col-7 text-right text-italic q-pr-md'>{{$t('ISsy3')}}</div>
          <div class='col-5 text-bold'>{{dhcool(dsync.dhdebut)}}</div>
        </div>
        <div class='q-ml-md row'>
          <div class='col-7 text-right text-italic q-pr-md'>{{$t('ISsy4')}}</div>
          <div class='col-5 text-bold'>{{dhcool(dsync.dhsync)}}</div>
        </div>
        <div class='q-ml-md row'>
          <div class='col-7 text-right text-italic q-pr-md'>{{$t('ISsy5')}}</div>
          <div class='col-5 text-bold'>{{dhcool(dsync.dhpong)}}</div>
        </div>
      </div>
      <div v-else class="q-ml-md titre-md text-italic">{{$t('ISnc')}}</div>
    </q-card>

    <q-card class="spmd q-my-sm">
    <q-expansion-item v-if="session.status" group="etc" class="col" switch-toggle-side default-opened
      header-class="expansion-header-class-1 titre-md bg-secondary text-white" :label="$t('SYtit')">
      <q-card-section>
        <rapport-synchro/>
      </q-card-section>
    </q-expansion-item>
    <q-separator/>

    <q-expansion-item group="etc" class="col" switch-toggle-side :disable="!fSt.queue.length"
      header-class="expansion-header-class-1 titre-md bg-secondary text-white">
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

    <q-expansion-item group="etc" class="col" switch-toggle-side :disable="!fSt.echecs.size"
      header-class="expansion-header-class-1 titre-md bg-secondary text-white">
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
    </q-card>

  </q-page>
</template>

<script>

import RapportSynchro from '../components/RapportSynchro.vue'
import stores from '../stores/stores.mjs'
import { dhcool, edvol, mon } from '../app/util.mjs'
import { Tarif } from '../app/api.mjs'

const cbl = ['green-5', 'warning', 'warning', 'negative', 'negative']

/*
- dhdebutp : dh de début de la dernière session sync terminée
- dhfinp : dh de fin de la dernière session sync terminée
- dhdebut: dh de début de la session sync en cours
- dhsync: dh du dernier traitement de synchronisation
- dhpong: dh du dernier pong reçu
*/

export default {
  name: 'PageSession',

  components: { RapportSynchro },

  computed: {
    couts () { return Tarif.evalConso(this.session.consocumul) },
    st () { 
      const n = this.session.status < 2 ? this.session.status : 2
      return this.$t('ISst' + n)
    },
    mo () { return this.session.synchro ? this.$t('sync') : 
      (this.session.avion ? this.$t('avion') : 'incognito')},
    cb () { return ' text-' + cbl[this.session.blocage]},
    dsync () { return this.session.sessionSync },
    dlv () {
      const dlv = this.aSt.compta.dlv
      return dlv < 0 ? 0 : AMJ.dlv(dlv)
    },
    nbj () {
      return AMJ.diff(this.dlv, this.session.dateJourConnx)
    }
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
      edvol, mon,
      ui: stores.ui,
      session: stores.session,
      aSt: stores.session,
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

