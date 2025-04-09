<template>
  <div class="fs-md" style="width:12rem">
    <q-input class="q-pr-md" v-model="org"
      :label="$t('ESorg')" :placeholder="$t('ESorgh')" dense/>
    <div class="row fs-sm justify-between h1">
      <div class="text-negative text-bold">{{model.err}}</div>
      <div class="text-italic">{{model.svc}}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import stores from '../stores/stores.mjs'
import { $t } from '../app/util.mjs'

const config = stores.config

const reg = /^([a-z0-9\-]+)$/

const check = (val) => {
  if (props.setOrgs) {
    if (props.setOrgs.has(val)) return [val, config.svc, $t('ESorg4')]
    if (val.length < 4 || val.length > 8 || !val.match(reg)) return [val, config.svc, $t('ESorg1')]
    return [val, config.svc, '']
  }
  const i = val.indexOf('-')
  const o = i === -1 ? val : val.substring(0, i)
  const s = i === -1 ? '' : val.substring(i + 1)
  const s1 = config.orgs[o]
  if (s1) return [o, s1, '']
  if (o.length < 4 || o.length > 8 || !o.match(reg)) return [o, s, $t('ESorg1')]
  if (s && config.services[s]) return [o, s, '']
  return [o, s, $t('ESorg5')]
}

const props = defineProps({
  setOrgs: Object
})

const model = defineModel({ type: Object })
const org = ref(model.value.org)
const [o, s, e] = check(model.value.org)
model.value.org = o
model.value.svc = s
model.value.err = e

watch (org, (val, av) => {
  const [o, s, e] = check(val)
  model.value.org = o
  model.value.svc = s
  model.value.err = e
})

</script>

<style lang="sass" scoped>
@import '../css/input.sass'
.h1
  height: 1.2rem
</style>
