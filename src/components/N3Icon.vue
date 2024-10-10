<template>
  <q-icon size="md" :class="tclr" :name="ico"/>
</template>

<script setup>
import { computed } from 'vue'

const txt = ['grey', 'green-5', 'orange-5', 'negative']
const ic = ['circle', 'circle', 'warning', 'crisis_alert']

const props = defineProps({ 
  niv: Number // 1: vert, 2: orange, 3:rouge
})

const i = computed(() => props.niv || 0)
const tclr = computed(() => 'text-' + txt[i.value])
const ico = computed(() => ic[i.value])

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
