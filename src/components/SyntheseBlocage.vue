<template>
  <q-card class="shadow-8 q-pa-sm">

    <div class="text-center">
      <span v-if="blTr && !blCo" class="titre-md text-bold text-italic">
        {{$t('SBtitt', [ntr])}}</span>
      <span v-if="!blTr && blCo" class="titre-md text-bold text-italic">
        {{$t('SBtitc', [nco])}}</span>
      <span v-if="blTr && blCo" class="titre-md text-bold text-italic">
        {{$t('SBtittc', [ntr, nco])}}</span>
      <blocage-ico :niveau="niv" class="q-mr-xs q-ml-sm"/>
      <span class="titre-md">{{$t('SBn' + niv) + $t('SBdisp', [djb, njrb])}}</span>
    </div>

    <div class="row">
      <div :class="col"></div>
      <div class="col-3 text-italic text-center">{{ent1}}</div>
      <div v-if="blTr && blCo" class="col-3 text-italic  text-center">{{ent2}}</div>
      <div class="col-1 text-italic text-center">{{$t('SBnj')}}</div>
    </div>

    <!-- début de blocage -->
    <div class="row q-mt-xs bord0 items-center">
      <div :class="col + ' text-right text-italic'">{{$t('SBdp')}}</div>
      <div class="col-3 text-center">{{val(1,'jib')}}</div>
      <div v-if="blTr && blCo" class="col-3 text-center">{{val(2,'jib')}}</div>
      <div class="col-1"></div>
    </div>

    <!-- niveau alerte -->
    <div :class="'row q-mt-xs items-center bord' + (niv === 1 ? '1' : '0')">
      <div :class="col + ' text-right text-italic'">{{$t('SBal')}}</div>
      <div :class="'col-3 text-center ' + (av('dja') === 1 ? 'text-bold' : 'fs-sm')">{{val(1,'dja')}}</div>
      <div v-if="blTr && blCo" :class="'col-3 text-center ' + (av('dja') === 2 ? 'text-bold' : 'fs-sm')">{{val(2,'dja')}}</div>
      <div class="col-1 text-center">{{njra ? njra + 'j' : ''}}</div>
    </div>

    <!-- niveau lecture seule -->
    <div :class="'row q-mt-xs items-center bord' + (niv === 2 ? '1' : '0')">
      <div :class="col + ' text-right text-italic'">{{$t('SBls')}}</div>
      <div :class="'col-3 text-center ' + (av('djl') === 1 ? 'text-bold' : 'fs-sm')">{{val(1,'djl')}}</div>
      <div v-if="blTr && blCo" :class="'col-3 text-center ' + (av('djl') === 2 ? 'text-bold' : 'fs-sm')">{{val(2,'djl')}}</div>
      <div class="col-1 text-center">{{njrl ? njrl + 'j' : ''}}</div>
    </div>

    <!-- niveau bloqué -->
    <div :class="'row q-mt-xs items-center bord' + (niv === 3 ? '1' : '0')">
      <div :class="col + ' text-right text-italic'">{{$t('SBbl')}}</div>
      <div :class="'col-3 text-center ' + (av('djb') === 1 ? 'text-bold' : 'fs-sm')">{{val(1,'djb')}}</div>
      <div v-if="blTr && blCo" :class="'col-3 text-center ' + (av('djb') === 2 ? 'text-bold' : 'fs-sm')">{{val(2,'djb')}}</div>
      <div class="col-1 text-center">{{njrb ? njrb + 'j' : ''}}</div>
    </div>

    <div style="height:2px;width:100%"/>

  </q-card>
</template>
<script>

import { toRef } from 'vue'
import BlocageIco from './BlocageIco.vue'
import { AMJ } from '../app/api.mjs'
import { getNg } from '../app/modele.mjs'

  /* Attributs: 
  - `stn` : raison majeure du blocage : 0 à 9 repris dans la configuration de l'organisation.
  - `id`: id du sponsor ou du comptable gérant le blocage absent pour un blocage _tribu_ -implicite-).
  - `txt` : libellé explicatif du blocage.
  - `jib` : jour initial de la procédure de blocage
  - `nja njl` : nb de jours passés en niveau _alerte_, et _lecture_.
  - `dh` : date-heure de dernier changement du statut de blocage.
  Attributs calculés (pour le jour courant):
  - niv : niveau actuel (0: alerte, 1:lecture, 2:bloqué)
  - njra: nb jours restant sur le niveau alerte
  - njrl: nb jours restant sur le niveau lecture
  - njrb: nb jours restant à vivre bloqué
  - dja : dernier jour en alerte
  - djl : dernier jour en lecture
  - djb : dernier jour en blocage (fin de vie du compte)
  */

export default {
  name: 'SyntheseBlocage',

  props: { blTr: Object, blCo: Object },

  components: { BlocageIco },

  computed: {
    ent1 () { return this.blTr ? this.$t('SBtr') : this.$t('SBco') },
    ent2 () { return this.$t('SBco') },
    col () { return this.blTr && this.blCo ? 'col-5' : 'col-8' },
    s1 () { return this.blTr && this.blCo ? this.blTr : this.blCo },
    s2 () { return this.blCo },
    atr () { return this.blTr },
    aco () { return this.blCo },
    ntr () { 
      if (this.blTr && this.blTr.sp) {
        const na = getNg(this.blTr.sp)
        return na ? na.nomc : this.$t('SBnsp')
      } 
      return this.blTr ? this.$t('SBnco') : ''
    },
    nco () { 
      if (this.blCo && this.blCo.sp) {
        const na = getNg(this.blCo.sp)
        return na ? na.nomc : this.$t('SBnsp')
      } 
      return this.blCo ? this.$t('SBnco') : ''
    },
    niv () { return this.max(this.atr ? this.blTr.niv : 0, this.aco ? this.blCo.niv : 0)},
    njra () { return this.min(this.atr ? this.blTr.njra : 0, this.aco ? this.blCo.njra : 0)},
    njrl () { return this.min(this.atr ? this.blTr.njrl : 0, this.aco ? this.blCo.njrl : 0)},
    njrb () { return this.min(this.atr ? this.blTr.njrb : 0, this.aco ? this.blCo.njrb : 0)},
    djb () { return AMJ.editDeAmj(this.min(this.atr ? this.blTr.djb : 0, this.aco ? this.blCo.djb : 0))},
  },

  data () { return {
  }},

  methods: {
    val (src, f) { // f vaut jib dja djl dlb
      const obj = src === 1 ? (this.blTr ? this.blTr : this.blCo) : this.blCo
      return AMJ.editDeAmj(obj[f])
    },
    av (f) {
      if (this.blTr && this.blCo) return this.blTr[f] < this.blCo[f] ? 1 : 2
      return 1
    },
    max (a, b) { return a > b ? a : b },
    min (a, b) { return (a && (a < b || !b)) ? a : b }
  },

  setup (props) {
    const blTr = toRef(props, 'blTr')
    const blCo = toRef(props, 'blCo')
    return {
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord0
  border: 2px solid transparent
.bord1
  border: 2px solid $warning
</style>
