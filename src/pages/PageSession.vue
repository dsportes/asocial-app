<template>
  <q-page>
    <q-card-section>
      <div>
        <span class="text-italic titre-md">{{$t('ISst')}}</span>
        <span class="q-ml-md text-bold">{{st}}</span>
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
    </q-card-section>

    <q-card-section v-if="session.status">
      <rapport-synchro/>
    </q-card-section>
  </q-page>
</template>

<script>
import RapportSynchro from '../components/RapportSynchro.vue'
import stores from '../stores/stores.mjs'
import { dhcool } from '../app/util.mjs'

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
    st () { 
      const n = this.session.status < 2 ? this.session.status : 2
      return this.$t('ISst' + n)
    },
    cb () { return ' text-' + cbl[this.session.blocage]},
    dsync () { return this.session.sessionSync },
  },

  methods: {
    dhcool (x) { return x ? dhcool(x, true) : '---' },
  },

  data () {
    return {
    }
  },

  setup () {
    return {
      ui: stores.ui,
      session: stores.session
    }
  }
}

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>

