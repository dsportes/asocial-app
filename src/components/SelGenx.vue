<template>
<span class="row items-center">
  <span class="text-italic text-bold q-mr-sm">{{titre}}</span>
  <q-select v-model="model" borderless dense standard filled
    :options="options"
    transition-show="flip-up"
    transition-hide="flip-down"
    style="min-width:120px;max-width:240px">
      <template v-slot:option="{ itemProps, opt, selected }">
        <div v-bind="itemProps" 
          :class="'cursor-pointer bg-accent full-width text-bold q-pa-xs' + (selected ? ' text-yellow-5 text-italic' : ' text-white')">
          {{ opt.label }}
        </div>
      </template>
  </q-select>
</span>
</template>

<script setup>

const props = defineProps({ 
  titre: String,
  options: Array
})

const model = defineModel({ type: Object })

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
