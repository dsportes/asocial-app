<template>
<span :class="tclr + ' ' + bgclr + ' cursor-pointer'">
  <q-icon size="28px" class="relative-position" :name="ico">
    <span v-if="alire" class="rond"></span>
  </q-icon>
  <!--q-tooltip v-if="apptb" class="bg-indigi text-white font-sm">{{$t('MLAnot')}}</q-tooltip-->
  <q-tooltip class="bg-indigi text-white font-sm">{{$t('ANlong' + niv)}}</q-tooltip>
</span>
</template>

<script>

const txt = ['green-5', 'green-5', 'orange-9', 'orange-9', 'negative', 'negative', 'negative', 'orange-9', 'negative']
const bg = ['none', 'none', 'yellow-1', 'yellow-3', 'yellow-5', 'yellow-7', 'yellow-9', 'yellow-5', 'yellow-7']
const ic = ['circle', 'report', 'trending_down', 'edit_off', 'edit_off', 'emergency', 'lock', 'speed', 'speed']

export default ({
  name: 'NotifIcon2',
  props: { 
    /* niveau d'information / restriction: 
    - 0 : aucune notification
    - 1 : au moins une notification informative
    - 2 : accroissement de volume interdit
    - 3 : accés en lecture seule (sauf urgence)
    - 4 : accés en lecture seule (strict, figé)
    - 5 : accès d'urgence seulement
    - 6 : accés en lecture seule (strict, figé) SANS accès d'urgence
    - 7 : ralentissement 1
    - 8 : ralentissement 2
    */
    niv: Number,
    alire: Boolean, // présence de l'indicateur à lire
    apptb: Boolean
  },
  computed: {
    tclr () { return 'text-' + txt[this.niv || 0]},
    bgclr () { return 'bg-' + bg[this.niv || 0] },
    ico () { return ic[this.niv || 0] }
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
.bord
  border: 1px solid $grey-5
  border-radius: 5px
</style>
