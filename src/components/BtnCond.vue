<template>
<span>
  <q-btn v-if="stop"
    :icon="diag ? 'error' : icon"
    padding="none" 
    :disable="disable || false"
    :flat="flat || false"
    dense
    :no-caps="noCaps"
    :color="clr"
    :text-color="tc"
    :size="size || 'md'"
    :label="label || ''"
    :round="round || false"
    @click.stop="ok">
    <q-tooltip v-if="tp || diag" class="bg-white text-primary">{{diag || tp}}</q-tooltip>
    <slot />
  </q-btn>
  <q-btn v-else
    :icon="diag ? 'error' : icon"
    padding="none" 
    :disable="disable || false"
    :flat="flat || false"
    dense
    :no-caps="noCaps"
    :color="clr"
    :text-color="tc"
    :size="size || 'md'"
    :label="label || ''"
    :round="round || false"
    @click="ok">
    <q-tooltip v-if="tp || diag" class="bg-white text-primary">{{diag || tp}}</q-tooltip>
    <slot />
  </q-btn>
</span>
</template>

<script setup>
import { ref, computed } from 'vue'

import stores from '../stores/stores.mjs'
import { afficherDiag, $t } from '../app/util.mjs'

const session = stores.session

const props = defineProps({ 
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
  stop: Boolean,
  noCaps: Boolean
})

const emit = defineEmits(['ok'])

const tc = computed(() => { 
  if (props.flat) return clr.value
  const x = diag.value ? 'white' : (
  !props.color || props.color === 'primary' ? 'btntc' : 
  (props.color === 'warning' ? 'btwtc' : 'white'))
  return x
})

const clr = computed(() => { 
  const x = diag.value ? 'accent' : ( 
    !props.color || props.color === 'primary' ? 'btnbg' : 
    (props.color === 'warning' ? 'btwbg' : (props.color || 'none')))
  return x
})

const diag = computed(() => props.cond && session[props.cond] ? $t(session[props.cond]) : '')

async function ok () {
  if (!diag.value) { 
    emit('ok', props.ctx || null)
    return 
  }
  await afficherDiag(diag.value)
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
