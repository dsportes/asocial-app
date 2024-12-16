<template>
<q-dialog v-model="model" persistent>
  <q-card :class="styp('sm')">
    <q-toolbar class="tbs">
      <btn-cond color="warning" icon="close" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">{{titre}}</q-toolbar-title>
    </q-toolbar>
    <slot/>
    <q-card-actions align="right" class="q-gutter-sm">
      <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
      <btn-cond v-if="!confirm" :color="okwarn ? 'warning' : 'primary'" 
        :icon="okic || 'check'" 
        :label="$t(oklbl || 'valider')" 
        :disable="disable || false"
        :cond="cond"
        @ok="okfn(ctx)"/>
      <bouton-confirm v-else :actif="actif" :confirmer="okfn"/>
    </q-card-actions>
  </q-card>
</q-dialog>
</template>

<script setup>
import stores from '../stores/stores.mjs'
import BtnCond from '../components/BtnCond.vue'
import BoutonConfirm from '../components/BoutonConfirm.vue'
import { styp, $t } from '../app/util.mjs'

const model = defineModel({
})

const props = defineProps({
  titre: String, // titre de la top bar
  disable: Boolean, // Si le bouton OK est disable
  ctx: Object, // Argument à passer en argument à la fonction OK
  okfn: Function, // fonction OK
  okic: String, // Icone OK, sinon check
  oklbl: String, // code du label du bouton OK, sinon 'valider'
  okwarn: Boolean, // Bouton ok warning, sinomn primary
  cond: String, // condition du bouton ok
  confirm: Boolean,
  actif: Boolean
})

const ui = stores.ui

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
