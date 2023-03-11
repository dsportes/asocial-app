<template>
  <q-icon size="sm" style="position:relative; border-radius: 6px"
    :name="ico" :class="tclr + bgclr + (clickable ? ' cursor-pointer':'')">
    <span v-if="alire" class="rond"></span>
  </q-icon>
</template>

<script>
export default ({
  name: 'BlocageIco',
  props: { 
    niveau: Number, // niveau du blocage: 0:PAS de blocage, 1:alerte, 2:lecture seule, 3:bloqué
    alire: Boolean, // présence de l'indicateur à lire
    clickable: Boolean 
  },
  computed: {
    tclr () { return 'text-' + ['green-3 ','primary ','orange-9 ','negative '][this.niveau || 0] },
    bgclr () { return 'bg-' + ['none ','yellow-1 ','yellow-2 ','yellow-5 '][this.niveau || 0] },
    ico () { return ['check','alarm_on','lock_open','lock'][this.niveau || 0] }
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
