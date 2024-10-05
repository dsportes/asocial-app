<template>
  <span class="cursor-pointer">
    <span class="flag">{{options[locale].flag}}</span>
    <span v-if="label" class="fs-md q-ml-sm" style="position:relative;top:-4px;">{{label}}</span>
    <q-menu transition-show="flip-up" transition-hide="flip-down">
      <q-list style="min-width: 7rem">
        <q-item v-for="lg in options" :key="lg.value" @click="choix(lg)" clickable v-close-popup>
          <q-item-section class="q-mx-xs fs-lg">{{lg.flag}} {{lg.label}}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
    <q-tooltip v-if="!label">{{$t('langue')}}</q-tooltip>
  </span>
</template>

<script setup>
import { ref } from 'vue'

import { useI18n } from 'vue-i18n'
import stores from '../stores/stores.mjs'

const options = ref({})
stores.config.localeOptions.forEach(t => { options.value[t.value] = t })

const locale = ref(useI18n().locale)

const props = defineProps({ 
  label: String
})

function choix (lg) { locale.value = lg.value }

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.flag
  line-height: 1.7rem
  font-size: 1.7rem
</style>
