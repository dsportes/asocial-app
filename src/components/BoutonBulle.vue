<template>
  <btn-cond text-color="grey-5" icon="info">
    <q-popup-proxy ref="qpp">
      <q-banner class="bord bordgris" @click="hide">
        <template v-slot:avatar>
          <q-icon :name="icon || 'info'" size="sm" color="primary" />
        </template>
        <sd-nb :texte="$t(props.idtext)"/>
      </q-banner>
    </q-popup-proxy>
  </btn-cond>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const $t = useI18n().t

import { ref, computed } from 'vue'
import SdNb from './SdNb.vue'
import BtnCond from './BtnCond.vue'

const props = defineProps({ 
  icon: String, 
  idtext: String 
})

const qpp = ref(null)

function hide () {
  qpp.value.hide()
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-radius: 5px
  padding: 3px !important
</style>
