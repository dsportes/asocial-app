<template>
  <q-btn icon="help" size="md" dense padding="none" @click="ouvrir">
    <q-tooltip class="bg-white text-primary column">
      <div class="fs-sm text-bold">{{tp}}</div>
      <div class="fs-xxs font-mono">{{page}}</div>
    </q-tooltip>
  </q-btn>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const $t = useI18n().t

import { computed, ref } from 'vue'
import stores from '../stores/stores.mjs'
import { afficherDiag } from '../app/util.mjs'
import BtnCond from './BtnCond.vue'

const props = defineProps({ 
  page: String
})

const ph = stores.config.getHelpPages()
const ui = stores.ui

// const showing = ref(true)

const tp = computed (() => !ph.has(props.page) ? $t('HLPaidebd', [props.page]) : $t('A_' + props.page))

async function ouvrir () {
  if (ph.has(props.page)) { ui.pushhelp(props.page); return }
  await afficherDiag($t('HLPaidebd2'))
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
