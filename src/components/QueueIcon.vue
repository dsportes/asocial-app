<template>
  <span v-if="c2 || c1" :class="c2 ? 'rond1' : 'rond2'"/>
</template>

<script setup>
import { computed } from 'vue'

import stores from '../stores/stores.mjs'

const faSt = stores.ficav

const c1 = computed(() => faSt.queue.size !== 0)
const c2 = computed(() => faSt.echecs)
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.rond, .rond1, .rond2
  position: absolute
  top: -2px
  right: -2px
  border-radius: 6px
  width: 12px
  height: 12px
.rond1
  background: $red-9
.rond2
  background: $green-5
</style>
