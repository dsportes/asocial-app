<template>
  <q-icon size="sm" style="position:relative; border-radius: 6px"
    :name="ico" :class="tclr + bgclr + (clickable ? ' cursor-pointer':'')">
    <!--q-icon v-if="alire" size="14px" :name="ico2" :class="'rond ' + bgclr + tclr2"/-->
    <div v-if="alire" class="rond"></div>
  </q-icon>
</template>

<script>
export default ({
  name: 'NotifIco',
  props: { 
    gravite: Boolean, // gravité de la notification (importante = true)
    alire: Boolean, // présence de l'indicateur à lire
    clickable: Boolean 
  },
  computed: {
    tclr () { return this.gravite ? 'text-negative ' : 'text-primary ' },
    bgclr () { return this.gravite ? 'bg-yellow-5 ' : 'bg-yellow-2 ' },
    ico () { return this.gravite ? 'notifications' : 'report' }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.rond
  position: absolute
  top: -2px
  right: -2px
  border-radius: 6px
  width: 12px
  height: 12px
  background: $red-9
</style>
