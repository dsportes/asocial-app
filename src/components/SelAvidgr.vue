<template>
<span>
  <span v-if="options && options.l.length === 0" class="msg">{{$t('SAVz1')}}</span>
  <span v-if="options && options.l.length === 1" class="titre-md">{{$t('SAVz0', [options.l[0].label]) }}</span>
  <span v-if="options  && options.l.length > 1" class="row items-center">
    <span class="text-italic text-bold q-mr-sm">{{$t('SAVz3')}}</span>
    <q-select v-model="cav" borderless dense options-dense standard filled
      :options="options.l" style="min-width:120px;max-width:240px"
      popup-content-class="bg-secondary text-white titre-lg text-bold q-pa-sm"/>
  </span>
</span>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

import stores from '../stores/stores.mjs'

const cav = ref()

const session = stores.session
const gSt = stores.groupe

const options = computed(() => gSt.avcAnims)

if (options.value.l.length === 1) {
  const e0 = options.value.l[0]
  if (e0.value !== session.avatarId) session.setAvatarId(e0.value)
} else if (options.value.l.length > 1) {
  const e = options.value.m.get(session.avatarId)
  cav.value = session.avatarId && e ? e : options.value.l[0]
  watch(cav, (ap) => { 
    session.setAvatarId(ap.value)
  })
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-item
  min-height: 20px !important
  padding: 3px 1rem !important
.bord9
  border: 2px solid $grey-5
  border-radius: 5px
</style>
