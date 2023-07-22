<template>
  <q-page class="q-pa-sm">
    <div v-if="session.filtreMsg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{session.filtreMsg}}</div>

    <div class="q-my-md q-pa-xs column items-center">
      <stats-tribus :stats="session.stats" :org="session.org" :ns="session.ns" :profil="session.profil"/>

      <quotas-vols class="q-my-sm" :vols="session.stats" />

      <q-btn class="q-my-sm" size="md" flat dense color="primary" 
        :label="$t('PTnv')" @click="ouvrirnt"/>
    </div>

    <div v-if="!aSt.ptLtFT.length" class="largeur40 maauto q-my-md titre-lg text-italic">
      {{$t('PTvide', [aSt.getTribus.length])}}
    </div>

    <q-card class="largeur40 maauto" v-if="aSt.ptLtFT.length">
      <div v-for="(tribu, idx) in aSt.ptLtFT" :key="tribu.id">
        <q-expansion-item dense switch-toggle-side group="g1" :class="'q-my-xs ' + dkli(idx)">
          <template v-slot:header>
            <div class="q-ml-md row full-width justify-between items-center">
              <div class="titre-md">{{tribu.na.nom}}</div>
              <q-btn class="q-ml-md" icon="open_in_new" size="md" color="primary" dense @click.stop="courant(tribu.id)"/>
            </div>
          </template>
          <apercu-tribu class="q-ml-lg" :id="tribu.id" :idx="idx" edit/>
        </q-expansion-item>
      </div>
    </q-card>

    <!-- Dialogue de création d'une nouvelle tribu -->
    <q-dialog v-model="nt" persistent>
      <q-card class="bs moyennelargeur">
        <div class="titre-lg q-my-sm">{{$t('PTnv')}}</div>
        <nom-avatar icon-valider="check" verif tribu @ok-nom="oknom" />
        <choix-quotas :quotas="quotas" />
        <q-card-actions>
          <q-btn flat dense color="warning" icon="close" :label="$t('renoncer')" @click="MD.fD"/>
          <q-btn flat dense color="primary" icon="check" :disabled="!nom || quotas.err"
            :label="$t('valider')" @click="creer"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuTribu from '../components/ApercuTribu.vue'
import NomAvatar from '../components/NomAvatar.vue'
import ChoixQuotas from '../components/ChoixQuotas.vue'
import QuotasVols from '../components/QuotasVols.vue'
import StatsTribus from '../components/StatsTribus.vue'
import { afficherDiag, edvol } from '../app/util.mjs'
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { NouvelleTribu, GetTribu } from '../app/operations.mjs'
import { MD } from '../app/modele.mjs'

export default {
  name: 'PageChats',

  components: { StatsTribus, QuotasVols, NomAvatar, ApercuTribu, ChoixQuotas },

  computed: {
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },

    ed1 (n) { return edvol(n * UNITEV1) },
    ed2 (n) { return edvol(n * UNITEV2) },
    ouvrirnt () { 
      this.nom = ''
      this.quotas = { q1: 1, q2: 1, min1: 0, min2: 0, max1: 9999, max2: 9999, err: false }
      this.ovnt()
    },
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
      MD.fD()
    },
    async courant (id) {
      const t = await new GetTribu().run(id, true)
      this.aSt.setTribuC(t)
      this.ui.setPage('tribu')
    }
  },

  data () {
    return {
      nom: '',
      quotas: null
    }
  },

  setup () {
    const aSt = stores.avatar
    const session = stores.session
    const stats = stores.filtre.stats

    const nt = ref(false)
    function ovnt () { MD.oD(nt)}

    return {
      MD, nt, ovnt,
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
