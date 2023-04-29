<template>
<span :class="tclr + ' ' + bgclr + ' cursor-pointer'">
  <q-menu v-if="info">
    <div class="titre-md q-pa-xs text-white bg-secondary bord">{{$t('ANlong' + niv)}}</div>
  </q-menu>
  <span v-if="cible !== 0">{{$t('ANcourt' + niv, [$t('ANcible' + cible)])}}</span>
  <q-icon size="sm" style="position:relative; border-radius: 6px" :name="ico">
    <span v-if="alire" class="rond"></span>
  </q-icon>
</span>
</template>

<script>

const txt = ['green-3', 'green-3', 'orange-9', 'negative', 'negative', 'negative']
const bg = ['none', 'none', 'yellow-1', 'yellow-2', 'yellow-5',  'yellow-7']
const ic = ['check', 'report', 'alarm_on', 'lock_open', 'lock', 'close']

export default ({
  name: 'NotifIcon',
  props: { 
    /* niv : niveau d'alerte
      0: pas de blocage,
      1: alerte simple
      2: alerte grave (une procédure de blocage est planifiée)
      3: lecture seule, 
      4: ni lecture ni écriture,
      5: résilié
    */
    niv: Number,
    alire: Boolean, // présence de l'indicateur à lire
    cible: Number, // 1:G, 2:Tribu 3:Compte - si non 0, un label précède l'icône
    info: Boolean // si définie, une info bulle explique le statut
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
