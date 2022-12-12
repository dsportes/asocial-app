<template>
  <q-select class="fs-md font-mono sel"
    v-model="locale"
    :options="localeOptions"
    dense
    emit-value
    map-options
    options-dense
  />
</template>

<script>

import { useI18n } from 'vue-i18n'
import stores from '../stores/stores.mjs'

export default ({
  name: 'ChoixLangue',

  setup () {
    return {
      localeOptions: stores.config.localeOptions,
      locale: useI18n().locale
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.sel
  width: 6rem
</style>
