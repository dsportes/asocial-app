<template>
<div>
  <div v-if="n.note">
    <div v-if="estAv" class="text-bold">{{$t('PNOrav', [nom])}}</div>
    <div v-else class="text-bold">{{$t('PNOrgr', [nom])}}</div>
    <div class="q-my-md q-mx-xs text-italic">{{titre}}</div>
  </div>
  <div v-else>
    <div v-if="estAv" class="text-bold">{{$t('PNOrav2', [nom])}}</div>
    <div v-else class="text-bold">{{$t('PNOrgr2', [nom])}}</div>
  </div>
</div>
</template>

<script setup>
import { computed } from 'vue'

import stores from '../stores/stores.mjs'
import { Note } from '../app/modele.mjs'

const nSt = stores.note
const pSt = stores.people

const n = computed(() => nSt.nodeP)
const t = computed(() => n.value.type)
const estAv = computed(() => t.value === 1 || t.value === 4 || t.value === 6)
const id = computed(() => n.value.id)
const nom = computed(() => pSt.nom(id.value))
const titre = computed(() => t.value.type > 3 ? nSt.note.titre : '')

</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
