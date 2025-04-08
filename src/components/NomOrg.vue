<template>
  <div class="fs-md" style="width:12rem">
    <q-input class="q-pr-md" v-model="org"
      :label="$t('ESorg')" :placeholder="$t('ESorgh')" dense/>
    <div class="fs-sm text-negative text-bold h1">{{model.err}}</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import stores from '../stores/stores.mjs'
import { $t } from '../app/util.mjs'

const config = stores.config

const reg = /^([a-z0-9\-]+)$/

const err = (val) => {
  if (val.length < 4) return $t('ESorg1')
  if (val.length > 8) return $t('ESorg2')
  if (!val.match(reg)) return $t('ESorg3')
  if (props.lstesp && lstesp.indexOf(val) !== -1) return $t('ESorg4')
  if (val.startsWith('admin')) {
    const svc = val.substring(5)
    if (config.services[svc]) return ''
  }
  if (!props.lstesp && !config.orgs[val]) return $t('ESorg5')
  return ''
}

const props = defineProps({
  lstesp: Array
})

const model = defineModel({ type: Object })
const org = ref(model.value.org)
model.value.err = err(model.value.org)

watch (org, (val, av) => {
  model.value.err = err(val)
  model.value.org = val
})

</script>

<style lang="sass" scoped>
@import '../css/input.sass'
.h1
  height: 1.2rem
</style>
