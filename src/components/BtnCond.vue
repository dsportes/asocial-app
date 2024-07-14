<template>
  <q-btn v-if="stop"
    :icon="diag ? 'error' : icon"
    padding="1px 1px" 
    :disable="disable"
    :flat="flat"
    dense
    :color="!diag ? (color || 'primary') : 'accent'"
    :size="size || 'md'"
    :label="label"
    :round="round"
    @click.stop="ok">
    <q-tooltip v-if="tp || diag" class="bg-white text-primary">{{diag || tp}}</q-tooltip>
    <slot />
  </q-btn>
  <q-btn v-else
    :icon="diag ? 'error' : icon"
    padding="1px 1px" 
    :disable="disable"
    :flat="flat"
    dense
    :color="!diag ? (color || 'primary') : 'accent'"
    :size="size || 'md'"
    :label="label"
    :round="round"
    @click="ok">
    <q-tooltip v-if="tp || diag" class="bg-white text-primary">{{diag || tp}}</q-tooltip>
    <slot />
  </q-btn>
</template>

<script>
import stores from '../stores/stores.mjs'
import { afficherDiag } from '../app/util.mjs'

export default ({
  name: 'BtnCond',

  props: { 
    color: String, // defaut primary
    icon: String, // defaut aucune
    size: String, // defaut 'md'
    label: String, // defaut 'ok'
    tp: String, // tooltip: dfeaut aucun
    ctx: Object, // defaut null. Retransmis sur l'événement ok
    cond: String, // code condition dans stores.session
    disable: Boolean,
    flat: Boolean,
    round: Boolean,
    stop: Boolean
  },

  emits: ['ok'],

  computed: {
    diag () { return this.session[this.cond] }
  },

  methods: {
    async ok () {
      if (!this.diag) { this.$emit('ok', this.ctx || null); return }
      await afficherDiag(this.diag)
    },
  },
  
  setup () {
    return {
      session: stores.session
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
