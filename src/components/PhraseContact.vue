<template>
<div>
  <div v-if="!orgext" class="q-mb-sm row items-center">
    <div class="column">
      <div class="titre-lg q-mr-md">{{$t('PSorg1')}}</div>
    </div>
    <q-input v-model="org" dense style="width:15rem"
      :hint="$t('PSorg2')" :placeholder="$t('PSorg3')"/>
  </div>

  <div v-if="declaration" class="titre-md q-mr-md">{{$t('PSctc1')}}</div>
  <div class="row items-center">
    <q-input class="col" dense v-model="phrase" :placeholder="$t('NPphl')" 
      counter :rules="[r1]"
      @keydown.enter.prevent="crypterphrase" :type="isPwd ? 'password' : 'text'"
      :hint="phrase && r1(phrase) ? $t('entree') : $t('NP16', [min])">
      <template v-slot:append>
        <span class="row q-gutter-xs">
          <q-btn padding="none" dense :icon="isPwd ? 'visibility_off' : 'visibility'" 
            @click="isPwd = !isPwd" round/>
          <q-btn icon="cancel" round padding="none" dense
            :disable="phrase.length === 0" @click="phrase = ''"/>
          <q-spinner v-if="encours" color="primary" size="1.5rem" :thickness="8" />
        </span>
      </template>
    </q-input>
    <btn-cond class="col-auto q-ml-xs" round
      icon="check" v-if="r1(phrase) === true" @ok="crypterphrase"/>
  </div>

</div>
</template>

<script setup>

import { ref, watch } from 'vue'
import stores from '../stores/stores.mjs'
import BtnCond from '../components/BtnCond.vue'
import { Phrase } from '../app/modele.mjs'
import { afficherDiag, $t } from '../app/util.mjs'

const min = 24

const props = defineProps({ 
  initVal: String, 
  orgext: String, 
  declaration: Boolean 
})

const emit = defineEmits(['ok'])

const session = stores.session
const config = stores.config
const phrase = ref(props.initVal || '')
const org = ref(props.orgext ? props.orgext : (config.search ? config.search : ''))
const isPwd = ref(false)
const encours = ref(false)

const r1 = (val) => val.length >= min || $t('NP16', [min])

async function crypterphrase () {
  if (r1(phrase.value) !== true) return
  if (!org.value) {
    await afficherDiag($t('PSctc3'))
    return
  }
  encours.value = true
  const pc = new Phrase()
  setTimeout(async () => {
    await pc.init(phrase.value)
    encours.value = false
    pc.org = org.value
    emit('ok', pc)
  }, 1)
}

</script>

<style lang="sass" scoped>
@import '../css/input.sass'
</style>
