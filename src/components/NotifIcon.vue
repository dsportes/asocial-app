<template>
<span class="cursor-pointer">
  <q-avatar v-if="niv >= 9" size="sm" square>
    <img src="~assets/zombi.png">
  </q-avatar>
  <q-icon v-else size="24px" :class="tclr + ' ' + bgclr + (alire ? ' bord2' : ' bord1')" :name="ico"/>
  <q-tooltip class="bg-indigo text-white font-sm">{{$t('ANlong' + (niv || 0))}}</q-tooltip>
</span>
</template>

<script setup>

import { computed } from 'vue'
import stores from '../stores/stores.mjs'

const session = stores.session

const txt = ['green-5', 'green-5', 'orange-9', 'orange-9', 'negative', 'negative', 'negative', 'orange-9', 'negative']
const bg = ['none', 'none', 'yellow-1', 'yellow-3', 'yellow-5', 'yellow-7', 'yellow-9', 'yellow-5', 'yellow-7']
const ic = ['circle', 'report', 'trending_down', 'edit_off', 'edit_off', 'emergency', 'lock', 'speed', 'speed']

const props = defineProps({ 
  /* niveau d'information / restriction: 
  ANlong0: 'Aucune Alerte.',
  ANlong1: 'Au moins une alerte informative.',
  ANlong2: 'Accroissement de volume des fichiers et du nombre de notes / chats / groupes bloqué.',
  ANlong2a: 'Accroissement du nombre de notes / chats / groupes bloqué.',
  ANlong2b: 'Accroissement de volume des fichiers bloqué.',
  ANlong3: 'Mises à jour interdites, SAUF pour les actions d\'urgence',
  ANlong4: 'Mises à jour interdites dans TOUS LES CAS',
  ANlong5: 'Mises à jour et consultations interdites (SAUF pour les actions d\'URGENCE)',
  ANlong6: 'Mises à jour et consultations interdites, même les actions d\'URGENCE sont interdites',
  ANlong7: 'Consommation de calcul excessive, les opérations sont ralenties',
  ANlong8: 'Consommation de calcul au dessus de la limite, les opérations sont TRES ralenties',
  ANlong9: 'Suppression IMMINENTE du compte',
  ANlong10: 'Impossibilité IMMINENTE de se connecter au compte',
  */
  niv: Number,
  alire: Boolean // présence de l'indicateur à lire
})

const tclr = computed(() => 'text-' + txt[props.niv || 0])
const bgclr = computed(() => 'bg-' + bg[props.niv || 0])
const ico = computed(() => ic[props.niv || 0])

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
