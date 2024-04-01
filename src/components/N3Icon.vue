<template>
  <q-icon size="28px" :class="tclr" :name="ico"/>
</template>

<script>

const txt = ['grey', 'green-5', 'orange-5', 'negative']
const ic = ['circle', 'circle', 'warning', 'crisis_alert']

export default ({
  name: 'N3Icon',
  props: { 
    niv: Number // 1: vert, 2: orange, 3:rouge
  },
  computed: {
    i () { return this.niv || 0 },
    tclr () { return 'q-mx-sm text-' + txt[this.i]},
    ico () { return ic[this.i] }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
