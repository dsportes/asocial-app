<template>
<span class="cursor-pointer">
  <q-avatar v-if="niv >= 3" size="sm" square :class="alire ? ' bord2' : ' bord1'">
    <img src="~assets/zombi.png">
  </q-avatar>
  <q-icon v-else size="24px" :color="clr[niv]" :class="alire ? ' bord2' : ' bord1'" :name="ico[niv]"/>
  <q-tooltip class="bg-indigo text-white font-sm">{{$t('ANlong' + (niv || 0))}}</q-tooltip>
</span>
</template>

<script setup>

import { computed } from 'vue'
import stores from '../stores/stores.mjs'

const session = stores.session

const clr = ['green-5', 'warning', 'negative']
const ico = ['circle', 'warning', 'dangerous']

const props = defineProps({ 
  /* gravité maximale des alertes
    3 : zombi, compte en suppression ou inaccessibilité imminente
    2 : Accès restreint
    1 : Accès avec contraintes, alertes de compte ou partition
    0 : Pas d'alerte
  */
  niv: Number,
  alire: Boolean // présence de l'indicateur à lire
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.rond
  position: absolute
  top: -2px
  right: -2px
  border-radius: 6px
  width: 12px
  height: 12px
  background: $red-9
.bord
  border: 1px solid $grey-5
  border-radius: 5px
.bord1
  border: 2px solid none
  border-radius: 5px
.bord2
  border: 2px solid $negative
  border-radius: 5px
</style>
