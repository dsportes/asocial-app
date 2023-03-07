<template>
  <q-icon size="sm" style="position-relative; border-radius: 5px"
    :name="ico" :class="tclr + bgclr + (clickable ? ' cursor-pointer':'')">
    <q-icon v-if="alire" size="14px" :name="ico2" :class="'rond ' + bgclr + tclr2"/>
  </q-icon>
</template>

<script>
export default ({
  name: 'NotifIco',
  props: { 
    gravite: Number, // gravité de la notification: 0:PAS de notfication, 1:basse, 2:moyenne, 3:haute
    alire: Number, // gravité la plus haute des notifications à lire. 0:toutes lues
    clickable: Boolean },
  computed: {
    tclr () { return 'text-' + ['green-3 ','primary ','orange-9 ','negative '][this.gravite] },
    tclr2 () { return ' text-' + ['green-3 ','primary ','orange-9 ','negative '][this.alire] },
    bgclr () { return 'bg-' + ['none ','yellow-1 ','yellow-2 ','yellow-5 '][this.gravite] },
    ico () { return ['check','report','warning','notifications'][this.gravite] },
    ico2 () { return ['check','report','warning','notifications'][this.alire] }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.rond
  position: absolute
  top: -2px
  right: -2px
  border-radius: 7px
</style>
