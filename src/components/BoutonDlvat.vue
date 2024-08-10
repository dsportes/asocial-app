<template>
  <saisie-mois v-model="dlvat" 
    :dmax="maxdlvat" :dmin="mindlvat" :dinit="initdlvat"
    @ok="cfDlvat" icon="check" :label="$t('ESdlvat')"/>

    <!-- Changement d'une dlvat -->
  <q-dialog v-model="ui.d.PEdlvat" persistent>
    <q-card :class="styp('sm')">
      <q-toolbar class="bg-secondary text-white">
        <q-btn dense size="md" color="warning" icon="close" @click="fin"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('PTdlvat')}}</q-toolbar-title>
      </q-toolbar>
      <q-card-section class="q-ma-sm">
        <div class="q-my-md row justify-around">
          <div class="titre-md">
            {{$t('PTdlvata', [AMJ.editDeAmj(espace.dlvat || 20991231)])}}</div>
          <div class="titre-md">{{$t('PTdlvatf', [AMJ.editDeAmj(dlv)])}}</div>
        </div>
      </q-card-section>

      <q-card-actions vertical align="right">
        <bouton-confirm class="q-my-md maauto" actif :confirmer="chgDlvat"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script>

import stores from '../stores/stores.mjs'
import { ID, AMJ } from '../app/api.mjs'
import SaisieMois from './SaisieMois.vue'
import BoutonConfirm from './BoutonConfirm.vue'
import { SetEspaceDlvat } from '../app/operations4.mjs'
import { styp } from '../app/util.mjs'

export default ({
  name: 'BoutonDlvat',

  components: { SaisieMois, BoutonConfirm },

  emits: ['close' ],

  props: { espace: Object },

  computed: {
    mindlvat () { 
      const m = AMJ.djMoisN(AMJ.amjUtc(), 3)
      return Math.floor(m / 100)
    },
    initdlvat () {
      return this.espace.dlvat ? Math.floor(this.espace.dlvat / 100) : this.mindlvat
    },
    maxdlvat () { 
      return Math.floor(AMJ.max / 100)
    },
  },

  data () {
    return {
      dlvat: 0, // dlvat saisie
      dlv: 0, // Premier jour du mois suivant de dlvat saisie
    }
  },

  methods: {
    cfDlvat (dlv) {
      this.dlv = AMJ.pjMoisSuiv((dlv * 100) + 1)
      this.ui.oD('PEdlvat')
    },
    async chgDlvat () {
      await new SetEspaceDlvat().run(this.espace.id, this.dlv)
      this.ui.fD()
      context.emit('close', true)
    },
    fin () {
      this.ui.fD()
      this.$emit('close', false)
    }
  },
  
  setup () {
    return {
      ui: stores.ui, styp, AMJ
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
