<template>
  <q-icon v-if="cond" class="cursor-pointer q-mr-sm" name="undo" size="sm"
    color="primary" />
  <q-icon v-else class="q-mr-sm gris" name="undo" size="sm" />
</template>
<script>

export default ({
  name: 'BoutonUndo',

  props: { cond: Boolean },

  computed: {
  },

  methods: {
    ouvrir () {
    }
  },
  
  setup () {
    return {
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.gris
  color: rgba(128,128,128,0.2)
</style>
