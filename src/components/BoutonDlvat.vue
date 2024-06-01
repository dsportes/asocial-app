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
          <div class="titre-md">{{$t('PTdlvata', [AMJ.editDeAmj(espace.dlvat)])}}</div>
          <div class="titre-md">{{$t('PTdlvatf', [AMJ.editDeAmj(dlv)])}}</div>
        </div>
      </q-card-section>

      <q-card-actions vertical align="right">
        <bouton-confirm class="q-my-md maauto" :confirmer="chgDlvat"/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>
<script>

import SaisieMois from './SaisieMois.vue'
import BoutonConfirm from './BoutonConfirm.vue'
import { SetEspaceOptionA } from '../app/operations4.mjs'

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
      return Math.floor(espace.dlvat / 100)
    },
    maxdlvat () { 
      return Math.floor(AMJ.max / 100)
    },
  },

  data () {
    return {
      dlvat: 0, // dlvat saisie
      dlv: 0, // Premier jour du mois suivant de dlvat
    }
  },

  methods: {
    cfDlvat () {
      this.dlv = AMJ.pjMoisSuiv((this.dlvat * 100) + 1)
      this.ui.oD('PEdlvat')
    },
    async chgDlvat () {
      await new SetEspaceOptionA().run(null, null, this.dlv)
      this.ui.fD()
      context.emit('close', true)
    },
    fin () {
      this.ui.fD()
      context.emit('close', false)
    }
  },
  
  setup () {
    return {
      ui: stores.ui
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
