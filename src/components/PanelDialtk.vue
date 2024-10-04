<template>
  <q-card :class="styp('sm')">
    <q-card-section>
      <div class="q-pa-md titre-lg text-center">{{$t(titre)}}</div>

      <div class="row items-center">
        <div class="lg0 text-italic titre-md q-mr-lg">{{$t('TKmnt')}}</div>
        <q-input class="lg1" dense v-model="mx" mask="#,##" fill-mask="0" 
          suffix="€" clearable placeholder="3,50" reverse-fill-mask/>
      </div>
      <div class="text-negative mh">{{diag}}</div>

      <div class="row items-center">
        <div class="lg0 text-italic titre-md q-mr-lg">{{$t('TKrefx')}}</div>
        <q-input class="lg2" dense v-model="refx" clearable counter maxlength="20">
          <template v-slot:hint>{{$t('TKrefh')}}</template>
        </q-input>
      </div>

    </q-card-section>
    <q-card-actions align="right" class="q-gutter-sm">
      <btn-cond icon="undo" flat :label="$t('renoncer')" @ok="ui.fD"/>
      <btn-cond color="warning" icon="check" cond="cUrgence"
        :label="$t('TKgen')" :disable="diag !== ''" @ok="generer"/>
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import { $t, styp } from '../app/util.mjs'
import BtnCond from './BtnCond.vue'

const props = defineProps({ 
  min: Number, 
  init: Number, 
  titre: String
})
const emit = defineEmits(['ok'])

const ui = stores.ui

const mx = ref(('' + props.init) || '0')
const m = ref()
const diag = ref()
const refx = ref('')

function check (ap) {
  diag.value = ''
  m.value = parseInt(ap ? ap.replaceAll(',', '') : '0')
  if (m.value < props.min || m.value > 10000) diag.value = $t('TKer3')
}

watch(mx, (ap, av) => { check(ap) })

check(mx.value)

function generer () { 
  emit('ok', { m: m.value, ref: refx.value }) 
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.mh
  min-height: 1.5rem
.lg0
  width: 6rem
.lg1
  width: 8rem
.lg2
  width: 15rem
</style>
