<template>
  <span v-if="c1 || c2" :class="c2 ? 'rond1' : 'rond2'"/>
</template>

<script>
import stores from '../stores/stores.mjs'

export default ({
  name: 'QueueIcon',
  props: { },
  computed: {
    c1 () { return this.fSt.queue.length !== 0 },
    c2 () { return this.fSt.echecs.size !== 0 }
  },
  setup () {
    const fSt = stores.fetat
    return { 
      fSt
    }
  }
})
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
