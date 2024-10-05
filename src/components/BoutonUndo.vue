<template>
  <q-icon v-if="cond" class="cursor-pointer q-mr-sm" name="undo" size="sm"
    color="primary" />
  <q-icon v-else class="q-mr-sm" color="grey-3" name="undo" size="sm"/>
</template>

<script setup>

const props = defineProps({ 
  cond: Boolean
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.gris
  color: rgba(128,128,128,0.2)
</style>
