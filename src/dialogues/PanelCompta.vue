<template>
  <q-card class="moyennelargeur">
    <q-toolbar class="bg-secondary text-white">
      <bouton-help page="page1"/>     
      <q-toolbar-title class="titre-lg">{{$t('PCOtit', [cpt.av.na.nom])}}</q-toolbar-title>
      <q-btn dense size="md" color="warning" icon="chevron_right" @click="fermercompta"/>
    </q-toolbar>

    <div class="q-pa-sm scroll" style="max-height:100vh;">
      <div class="filler"></div>

      <div class="row items-start">
        <div class="col-5 text-right text-italic">Jour de calcul</div>
        <div class="col-7 font-mono fs-md text-center">{{cpt.x.j}}</div>
      </div>
      <div class="row items-start">
        <div class="col-5 text-right text-italic">Forfaits V1 / V2</div>
        <div class="col-3 font-mono fs-md text-center">[{{cpt.x.f1}}]  {{ed1(cpt.x.f1)}}</div>
        <div class="col-1 font-mono fs-md text-center"></div>
        <div class="col-3 font-mono fs-md text-center">[{{cpt.x.f2}}]  {{ed2(cpt.x.f2)}}</div>
      </div>
      <div v-if="cpt.av.estPrimaire" class="row items-start">
        <div class="col-5 text-right text-italic">Forfaits distribués aux avatars secondaires</div>
        <div class="col-3 font-mono fs-md text-center">[{{cpt.x.s1}}]  {{ed1(cpt.x.s1)}}</div>
        <div class="col-1 font-mono fs-md text-center"></div>
        <div class="col-3 font-mono fs-md text-center">[{{cpt.x.s2}}]  {{ed2(cpt.x.s2)}}</div>
      </div>
      <div class="row items-start">
        <div class="col-5 text-right text-italic">V1 avatar {{m ? ' compte' : ''}} / moy. mois</div>
        <div class="col-4 font-mono fs-md text-center">{{ed(cpt.x.v1) + (m ? ' ' + ed(cpt.x.v1c) : '')}}</div>
        <div class="col-3 font-mono fs-md text-center">{{ed(cpt.x.v1m)}}</div>
      </div>
      <div class="row items-start">
        <div class="col-5 text-right text-italic">V2 avatar {{m ? ' compte' : ''}} / moy. mois</div>
        <div class="col-4 font-mono fs-md text-center">{{ed(cpt.x.v2) + (m ? ' ' + ed(cpt.x.v2c) : '')}}</div>
        <div class="col-3 font-mono fs-md text-center">{{ed(cpt.x.v2m)}}</div>
      </div>

      <div class="titre-lg q-mt-md">Historique</div>
      <div class="row items-start">
        <div class="col-5 text-right text-italic">Moy. journalière de transfert dans le mois</div>
        <div class="col-7 font-mono fs-md text-center">{{ed(cpt.x.trm)}}</div>
      </div>
      <div class="row items-start">
        <div class="col-5 text-right text-italic">Ratio des transferts 1-14 jours / forfait v2</div>
        <div class="col-7 font-mono fs-md text-center">{{cpt.x.rtr}}%</div>
      </div>
      <div class="row items-start">
        <div class="col-5 text-right text-italic">Total transféré sur 7 jours</div>
        <div class="col-1 font-mono fs-md text-center q-pl-sm">{{ed(cpt.x.tr[0])}}</div>
        <div class="col-1 font-mono fs-md text-center">{{ed(cpt.x.tr[1])}}</div>
        <div class="col-1 font-mono fs-md text-center">{{ed(cpt.x.tr[2])}}</div>
        <div class="col-1 font-mono fs-md text-center">{{ed(cpt.x.tr[3])}}</div>
        <div class="col-1 font-mono fs-md text-center">{{ed(cpt.x.tr[4])}}</div>
        <div class="col-1 font-mono fs-md text-center">{{ed(cpt.x.tr[5])}}</div>
        <div class="col-1 font-mono fs-md text-center">{{ed(cpt.x.tr[6])}}</div>
      </div>
      <div class="row items-start">
        <div class="col-5 text-right text-italic">Total transféré sur 8-14 jours</div>
        <div class="col-1 font-mono fs-md text-center q-pl-sm">{{ed(cpt.x.tr[7])}}</div>
        <div class="col-1 font-mono fs-md text-center">{{ed(cpt.x.tr[8])}}</div>
        <div class="col-1 font-mono fs-md text-center">{{ed(cpt.x.tr[9])}}</div>
        <div class="col-1 font-mono fs-md text-center">{{ed(cpt.x.tr[10])}}</div>
        <div class="col-1 font-mono fs-md text-center">{{ed(cpt.x.tr[11])}}</div>
        <div class="col-1 font-mono fs-md text-center">{{ed(cpt.x.tr[12])}}</div>
        <div class="col-1 font-mono fs-md text-center">{{ed(cpt.x.tr[13])}}</div>
      </div>

    </div>
  </q-card>
</template>

<script>
import { UNITEV1, UNITEV2 } from '../app/api.mjs'
import { edvol } from '../app/util.mjs'
import stores from '../stores/stores.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'

/** Compteurs ***************************
- `j` : jour de calcul
- `v1 v1m` : volume v1 actuel et total du mois
- `v2 v2m` : volume v2 actuel et total du mois
- `trm` : volume transféré dans le mois
- `f1 f2` : forfait de v1 et v2
- `tr` : array de 14 compteurs (les 14 derniers jours) de volume journalier de transfert
- `rtr` : ratio de la moyenne des tr / forfait v2
- `hist` : array de 12 éléments, un par mois. 4 bytes par éléments.
  - `f1 f2` : forfaits du mois
  - `r1` : ratio du v1 du mois par rapport à son forfait.
  - `r2` : ratio du v2 du mois par rapport à son forfait.
  - `r3` : ratio des transferts cumulés du mois / volume du forfait v2
- `s1 s2` : pour un avatar primaire, total des forfaits attribués aux secondaires.
- v1c v2c : total des v1 et v2 pour tous les avatars du compte constaté lors de la dernière connexion.
*/

export default ({
  name: 'PanelCompta',

  props: { },

  components: { BoutonHelp },

  computed: {
    m () { return this.cpt.av.estPrimaire && this.cpt.x.s1 !== 0 }
  },

  data () {
    return {
    }
  },

  methods: {
    fermercompta () { this.ui.fermerCompta() },
    ed (v) { return edvol(v) },
    ed1 (v) { return edvol(v * UNITEV1) },
    ed2 (v) { return edvol(v * UNITEV2) }
  },

  setup () {
    const ui = stores.ui
    return {
      ui,
      cpt: ui.comptaObj
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
$haut: 2.5rem
.top
  position: absolute
  top: 0
  left: 0
  height: $haut
  overflow: hidden
  z-index: 2
.filler
  height: $haut
  width: 100%
.q-toolbar
  padding: 2px !important
  min-height: 0 !important
.q-card > div
  box-shadow: inherit !important
</style>
