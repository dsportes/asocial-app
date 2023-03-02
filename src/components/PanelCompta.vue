<template>
  <q-card class="q-pa-sm">

    <div class="titre-lg q-my-md">{{$t('CPTj')}} : {{edj}}</div>

    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{c.q1 + ' / ' + ed1(c.q1)}}</div>
      <div class="col-10 fs-md">{{$t('CPTq1')}}</div>
    </div>
    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{ed(c.v1)}}</div>
      <div class="col-10 fs-md">{{$t('CPTv1')}}</div>
    </div>
    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{ed(c.v1m)}}</div>
      <div class="col-10 fs-md">{{$t('CPTv1m')}}</div>
    </div>
    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{c.q2 + ' / ' + ed2(c.q2)}}</div>
      <div class="col-10 fs-md">{{$t('CPTq2')}}</div>
    </div>
    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{ed(c.v2)}}</div>
      <div class="col-10 fs-md">{{$t('CPTv2')}}</div>
    </div>
    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{ed(c.v2m)}}</div>
      <div class="col-10 fs-md">{{$t('CPTv2m')}}</div>
    </div>

    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{ed(c.trm)}}</div>
      <div class="col-10 fs-md">{{$t('CPTtrm')}}</div>
    </div>
    <div class="row items-start">
      <div class="col-2 text-center font-mono">{{c.rtr}}%</div>
      <div class="col-10 fs-md">{{$t('CPTrtr')}}</div>
    </div>

    <div class="titre-md q-mt-md">{{$t('CPTtr')}}</div>
    <div class="q-my-sm q-ml-md">
      <div v-for="(x, i) in lst14j()" :key="i" class="row items-start">
        <div class="col-2 text-center font-mono">{{ed(c.tr[i])}}</div>
        <div class="col-10 fs-md">{{$t('jour' + x)}}</div>
      </div>
    </div>

    <div class="titre-md q-mt-md">{{$t('CPTHist')}}</div>
    <div class="titre-md q-mt-xs q-ml-md text-italic">{{$t('CPTHq1')}}</div>
    <div class="titre-md q-mt-xs q-ml-md text-italic">{{$t('CPTHq2')}}</div>
    <div class="titre-md q-mt-xs q-ml-md text-italic">{{$t('CPTHr1')}}</div>
    <div class="titre-md q-mt-xs q-ml-md text-italic">{{$t('CPTHr2')}}</div>
    <div class="titre-md q-mt-xs q-ml-md text-italic">{{$t('CPTHr3')}}</div>

    <div class="q-ml-md q-mt-md row items-center">
      <div class="col-2 text-center text-bold">q1</div>
      <div class="col-2 text-center text-bold">q2</div>
      <div class="col-1 text-center text-bold">r1</div>
      <div class="col-1 text-center text-bold">r2</div>
      <div class="col-1 text-center text-bold">r3</div>
      <div class="col-1 text-bold self-start">{{$t('mois')}}</div>
    </div>

    <div class="q-my-sm q-ml-md">
      <div v-for="(x, i) in lst12m()" :key="i" class="row items-center">
        <div class="col-2 text-center font-mono">{{c.hist[i][0]}}</div>
        <div class="col-2 text-center font-mono">{{c.hist[i][1]}}</div>
        <div class="col-1 text-center font-mono">{{c.hist[i][2]}}%</div>
        <div class="col-1 text-center font-mono">{{c.hist[i][3]}}%</div>
        <div class="col-1 text-center font-mono">{{c.hist[i][4]}}%</div>
        <div class="col-1 self-start">{{$t('mois' + x)}}</div>
      </div>
    </div>

  </q-card>
</template>

<script>
import { UNITEV1, UNITEV2, AMJ } from '../app/api.mjs'
import { edvol, dhcool } from '../app/util.mjs'

/** Compteurs ***************************
- `j` : jour de calcul
- `v1 v1m` : volume v1 actuel et total du mois
- `v2 v2m` : volume v2 actuel et total du mois
- `trm` : volume transféré dans le mois
- `q1 q2` : quotas de v1 et v2
- `tr` : array de 14 compteurs (les 14 derniers jours) de volume journalier de transfert
- `rtr` : ratio de la moyenne des tr / quota v2 en pourcentage (125 => 125%)
- `hist` : array de 12 éléments, un par mois. 4 bytes par éléments.
  - `q1 q2` : quotas du mois
  - `r1` : ratio du v1 du mois par rapport à son quota.
  - `r2` : ratio du v2 du mois par rapport à son quota.
  - `r3` : ratio des transferts cumulés du mois / volume du quota v2
*/

export default ({
  name: 'PanelCompta',

  props: { c: Object },

  components: { },

  computed: {
    edj () { return AMJ.editDeAmj(this.c.j) },
    lst14jx () { return this.c.dj.lst14j },
    lst12mx () { return this.c.dj.lst12m }
  },

  data () {
    return {
      dhcool: dhcool
    }
  },

  methods: {
    ed (v) { return edvol(v) },
    ed1 (v) { return edvol(v * UNITEV1) },
    ed2 (v) { return edvol(v * UNITEV2) },

    // Retourne la liste des indice des 14 derniers jours (précédent le jour j)
    lst14j () {
      const l = new Array(14)
      let j = AMJ.jDeAmjUtc(this.c.j)
      for(let i = 0; i < 14; i++){
        j--
        if (j === 0) j = 7
        l[i] = j
      }
      return l
    },
  
    // Retourne la liste des indice des 12 derniers mois (précédent le jour j)
    lst12m () {
      const l = new Array(12)
      let j = AMJ.mm(this.c.j)
      for(let i = 0; i < 12; i++){
        j--
        if (j === 0) j = 12
        l[i] = j
      }
      return l
    }

  },

  setup () {
    return {
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
