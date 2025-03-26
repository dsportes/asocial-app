<template>
  <q-card>
  <div :class="sty + ' q-mt-lg column justify-center items-center pwsm maauto'">
    <div class='titre-lg q-mb-lg text-center'>{{$t('MLAparano1')}}</div>

    <div class="text-center height-2 fs-lg">{{echo}}</div>

    <div v-for="i in 3" :key="i" class="q-my-xs row justify-center items-center q-gutter-md">
      <div v-for="j in 3" :key="j">
        <div class="font-mono text-bold bord cursor-pointer"
          @click="inp += ('' + (((i - 1) * 3) + j))">
          {{'' + (((i - 1) * 3) + j)}}
        </div>
      </div>
    </div>
  </div>
  </q-card>
</template>

<script setup>
import stores from '../stores/stores.mjs'
import { ref, watch, computed } from 'vue'
import { $t, sty } from '../app/util.mjs'
import { deconnexion } from '../app/synchro.mjs'

const ui = stores.ui
const inp = ref('')
const echo = computed(() => '******'.substring(0, inp.value.length))

watch(inp, val => {
  if (val === ui.parano) ui.hideParano()
  else {
    if (val.length && !ui.parano.startsWith(val)) {
      ui.resetParano()
      deconnexion()
    }
  }
})

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid $grey-5
  border-radius: 10px
  font-size: 32px !important
  padding: 12px 16px
</style>