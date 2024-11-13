<template>
<div class="spmd q-pa-sm">
  <q-btn round size="sm" class="btr" icon="print" @click="c.print()"/>
  <q-expansion-item switch-toggle-side default-opened dense
      header-class="titre-md text-bold bg-primary text-white"
      :label="$t('PCPref' + tref, [dhcool(c.dh0, true), dhcool(c.dh, true), tref > 2 ? dhcool(c.dhP, true) : ''])">
    <div class="spmd column q-my-sm">
      <mois-m v-model.number="im" :imd="c.mm"/>
      <ligne-compteur :v="c.vd[im - 1]" :mm="im" :aaaa="aaaa"/>
    </div>
  </q-expansion-item>

  <q-separator size="3px"/>

  <q-expansion-item switch-toggle-side dense 
    header-class="titre-md text-bold bg-primary text-white"
    :label="$t('PCPtarifs')">
    <div class="spmd column q-mb-sm q-pa-xs">
      <div class="text-italic titre-md q-my-sm">{{$t('PCPcent')}}</div>

      <mois-m v-model.number="im" :imd="c.mm"/>

      <div class="q-ml-md q-my-sm">
        <div v-for="(nom, idx) in cuf" :key="nom">
          <div :class="'row fs-md full-width ' + dkli(idx)">
            <div class="col-2 font-mono text-bold text-center">{{mon(cu[idx])}}</div>
            <div class="col-10">{{$t('PCPt' + nom)}}</div>
          </div>
        </div>
      </div>
    </div>
  </q-expansion-item>
</div>
</template>

<script setup>
import { ref, computed } from 'vue'

import stores from '../stores/stores.mjs'
import { Tarif } from '../app/api.mjs'
import { $t, mon } from '../app/util.mjs'
import MoisM from './MoisM.vue'
import LigneCompteur from './LigneCompteur.vue'

const props = defineProps({
  c: Object
})

const tref = computed(() => props.c.dhP === props.c.dh0 ? (props.c.estA ? 1 : 0) : (props.c.estA ? 3 : 2 ))

const im = ref(props.c.mm)
const aaaa = computed(() => {
  let a = props.c.aaaa
  const m = props.c.mm
  return im.value <= m && im.value > 0 ? a : a - 1
})

const cu = computed(() => Tarif.cu(aaaa, im))

const cuf = ['AN', 'AF', 'lec', 'ecr', 'mon', 'des']

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.btr
  position: absolute
  top: -25px
  z-index: 10000
  right: 0
</style>
