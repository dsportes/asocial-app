<template>
  <q-btn dense>
    <q-icon left :size="size || 'sm'" :color="color || 'warning'" :name="icon || 'warning'" />
    <q-popup-proxy transition-show="flip-up" transition-hide="flip-down">
      <q-banner inline-actions dense rounded>
        <q-icon size="sm" name="lightbulb" color="warning" />
        <span class="titre-sm q-mr-sm">{{info}}</span>
        <template v-slot:action>
          <q-btn flat dense size="sm" icon="close" v-close-popup />
        </template>
      </q-banner>
    </q-popup-proxy>
  </q-btn>
</template>

<script>
export default ({
  name: 'InfoIco',
  props: { icon: String, color: String, size: String, info: String }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-banner--dense
  padding: 2px !important
  min-height: 0 !important
  border: 1px solid $warning
</style>
