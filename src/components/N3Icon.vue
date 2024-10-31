<template>
  <q-icon size="24px" :class="tclr" :name="ico"/>
</template>

<script setup>
import { computed } from 'vue'

const txt = ['green-5', 'orange-5', 'negative']
const ic = ['circle', 'warning', 'crisis_alert']

const props = defineProps({ 
  niv: Number // 0: vert, 1: orange, 2:rouge
})

const i = computed(() => props.niv || 0)
const tclr = computed(() => 'text-' + txt[i.value])
const ico = computed(() => ic[i.value])

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
