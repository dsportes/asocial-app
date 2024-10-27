<template>
<span @click="ouvrir">
  <btn-cond icon="help" :size="size || 'md'">
    <q-tooltip class="bg-white text-primary">{{tp}}</q-tooltip>
  </btn-cond>
  <span v-if="label" class="q-ml-sm">{{label}}</span>
</span>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const $t = useI18n().t

import { computed } from 'vue'
import stores from '../stores/stores.mjs'
import { afficherDiag } from '../app/util.mjs'

const props = defineProps({ 
  size: String, 
  page: String, 
  label: String
})

const ph = stores.config.pagesHelp
const ui = stores.ui

const tp = computed (() => !ph.has(props.page) ? $t('HLPaidebd', [props.page]) : $t('A_' + props.page))

async function ouvrir () {
  if (ph.has(props.page)) { ui.pushhelp(props.page); return }
  await afficherDiag($t('HLPaidebd2'))
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
