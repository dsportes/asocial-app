<template>
<span :class="tclr + ' ' + bgclr + ' cursor-pointer'">
  <q-icon size="28px" class="relative-position" :name="ico">
    <span v-if="alire" class="rond"></span>
  </q-icon>
  <q-tooltip v-if="apptb" class="bg-indigi text-white font-sm">{{$t('MLAnot')}}</q-tooltip>
  <q-tooltip v-else class="bg-indigi text-white font-sm">{{$t('ANlong' + niv)}}</q-tooltip>
</span>
</template>

<script>

const txt = ['green-5', 'green-5', 'orange-9', 'negative', 'negative', 'negative']
const bg = ['none', 'none', 'yellow-1', 'yellow-3', 'yellow-5',  'yellow-7']
// const bg = ['none', 'none', 'none', 'none', 'none',  'none']
const ic = ['circle', 'report', 'trending_down', 'edit_off', 'lock', 'close']
// const ic = ['check', 'report', 'trending_down', 'edit_off', 'lock', 'close']

export default ({
  name: 'NotifIcon2',
  props: { 
    /* niveau d'information / restriction: 
    - 0 : aucune notification
    - 1 : au moins une notification informative
    - 2 : accroissement de volume interdit
    - 3 : acceés en lecture seule
    - 4 : accès minimal
    - 5 : bloqué
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
