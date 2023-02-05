<template>
  <span class="cursor-pointer flag">{{options[locale].flag}}
    <q-tooltip>{{$t('langue')}}</q-tooltip>
    <q-menu transition-show="flip-up" transition-hide="flip-down">
      <q-list style="min-width: 7rem">
        <q-item v-for="lg in options" :key="lg.value" @click="choix(lg)" clickable v-close-popup>
          <q-item-section class="q-mx-sm fs-lg">{{lg.flag}} {{lg.label}}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </span>
</template>

<script>

import { useI18n } from 'vue-i18n'
import stores from '../stores/stores.mjs'

export default ({
  name: 'ChoixLangue',

  methods: {
    choix (lg) {
      this.locale = lg.value
    }
  },

  setup () {
    const options = {}
    stores.config.localeOptions.forEach(t => { options[t.value] = t })
    return {
      options,
      locale: useI18n().locale
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.flag
  max-height: 1.7rem
  font-size: 1.7rem
  margin-top: -11px
  overflow: hidden
</style>
