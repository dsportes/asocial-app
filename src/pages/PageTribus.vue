<template>
  <q-page class="q-pa-sm">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <div class="petitelargeur q-my-sm">
      <div class="q-my-sm q-mx-sm">
        <quotas-vols :vols="stats.tribus" />
      </div>

      <div class="row">
        <div class="col-6"></div>
        <div class="col-3 fs-md text-italic text-center">V1</div>
        <div class="col-3 fs-md text-italic text-center">V2</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PTattr')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ stats.tribus.a1 + ' / ' + ed1(stats.tribus.a1)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ stats.tribus.a2 + ' / ' + ed2(stats.tribus.a2)}}</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PTrest')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ (stats.tribus.q1 - stats.tribus.a1) + ' / ' + ed1(stats.tribus.q1 - stats.tribus.a1)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ (stats.tribus.q2 - stats.tribus.a2) + ' / ' + ed2(stats.tribus.q2 - stats.tribus.a2)}}</div>
      </div>
      <div class="row">
        <div class="col-6 fs-md text-italic text-right">{{$t('PTtotal')}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ stats.tribus.q1 + ' / ' + ed1(stats.tribus.q1)}}</div>
        <div class="col-3 fs-md font-mono text-center">{{ stats.tribus.q2 + ' / ' + ed2(stats.tribus.q2)}}</div>
      </div>
    </div>

    <q-separator color="orange"/>

    <q-btn class="q-my-sm" size="md" flat dense color="primary" 
      :label="$t('PTnv')" @click="ouvrirnt"/>

    <div v-if="!aSt.ptLtFT.length" class="titre-lg text-italic">
      {{$t('PTvide', [aSt.getTribus.length])}}
    </div>

    <div v-if="aSt.ptLtFT.length">
      <div v-for="(tribu, idx) in aSt.ptLtFT" :key="tribu.id">
        <div class="row items-start">
          <q-btn flat icon="navigate_next" size="lg" class="col-auto q-mr-sm"
            :color="tribu.id === session.tribuCId ? 'warning' : 'primary'" @click="courant(tribu.id)"/>
          <apercu-tribu class="q-my-sm" :id="tribu.id" :idx="idx" edit/>
        </div>
      </div>
    </div>

    <!-- Dialogue de création d'une nouvelle tribu -->
    <q-dialog v-model="nt" persistent>
      <q-card class="moyennelargeur">
        <div class="titre-lg q-my-sm">{{$t('PTnv')}}</div>
        <nom-avatar icon-valider="check" verif tribu @ok-nom="oknom" />
        <choix-quotas :quotas="quotas" />
        <q-card-actions>
          <q-btn flat dense color="warning" icon="close" :label="$t('renoncer')" @click="closent"/>
          <q-btn flat dense color="primary" icon="check" :disabled="!nom || quotas.err"
            :label="$t('valider')" @click="creer"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script>
import stores from '../stores/stores.mjs'
import ApercuTribu from '../components/ApercuTribu.vue'
import NomAvatar from '../components/NomAvatar.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import QuotasVols from '../components/QuotasVols.vue'
import { afficherDiag, edvol } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { NouvelleTribu, GetTribu } from '../app/operations.mjs'

export default {
  name: 'PageChats',

  components: { QuotasVols, NomAvatar, ApercuTribu, ChoixQuotas },

  computed: {
  },

  methods: {
    ed1 (n) { return edvol(n * UNITEV1) },
    ed2 (n) { return edvol(n * UNITEV2) },
    ouvrirnt () { 
      this.nom = ''
      this.quotas = { q1: 1, q2: 1, min1: 0, min2: 0, max1: 9999, max2: 9999, err: false }
      this.nt = true
    },
    closent () { this.nt = false },
    async oknom (nom) { 
      for(const tribu of this.aSt.getTribus) {
        if (tribu.na.nom === nom) {
          await afficherDiag(this.$t('PTex'))
          return
        }
      }
      this.nom = nom
    },
    async creer () {
      await new NouvelleTribu().run(this.nom, this.quotas.q1, this.quotas.q2)
      this.closent()
    },
    async courant (id) {
      const [t ,t2] = await new GetTribu().run(id, true)
      this.aSt.setTribuC(t, t2)
      this.ui.setPage('tribu')
    }
  },

  data () {
    return {
      nom: '',
      nt: false,
      quotas: null
    }
  },

  setup () {
    const aSt = stores.avatar
    const session = stores.session
    const stats = stores.filtre.stats

    return {
      ui: stores.ui,
      aSt,
      stats,
      session
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
</style>
