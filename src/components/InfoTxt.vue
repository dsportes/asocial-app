<template>
  <span class="cursor-pointer bord">
    <q-menu transition-show="flip-up" transition-hide="flip-down">
      <q-banner inline-actions dense rounded>
        <q-icon size="sm" name="lightbulb" color="warning" />
        <span class="titre-sm q-mr-sm">{{info}}</span>
        <template v-slot:action>
          <q-btn flat dense size="sm" icon="close" v-close-popup />
        </template>
      </q-banner>
    </q-menu>
    <q-icon v-if="iconLeft" size="sm" color="warning" :name="iconLeft" />
    <span class="fs-md">{{label}}</span>
    <q-icon v-if="iconRight" size="sm" color="warning" :name="iconRight" />
  </span>
</template>

<script>
export default ({
  name: 'InfoTxt',
  props: { label: String, info: String, iconLeft: String, iconRight: String }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-banner--dense
  padding: 2px !important
  min-height: 0 !important
  border: 1px solid $warning
.bord
  border: 1px solid $grey-5
</style>
