<template>
<div>
  <div v-if="declaration" class="titre-md q-mr-md">{{$t('PSctc1')}}</div>
  <div>
    <q-input dense v-model="phrase" :placeholder="$t('NPphl')" 
      counter 
      :type="isPwd ? 'password' : 'text'">
      <template v-slot:append>
        <span class="row q-gutter-xs">
          <q-btn padding="none" dense :icon="isPwd ? 'visibility_off' : 'visibility'" 
            @click="isPwd = !isPwd" round/>
          <q-btn icon="cancel" round padding="none" dense
            :disable="phrase.length === 0" @click="phrase = ''"/>
        </span>
      </template>
    </q-input>
    <div class="text-negative fs-sm text-bold h1">{{model.err}}</div>
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
const max = 50

const props = defineProps({ 
  initVal: String, 
  orgext: String, 
  declaration: Boolean,
  btnok: Boolean
})

const model = defineModel({ type: Object })

const err = (val) => val.length < min || val.length > max ? $t('NAe1', [min, max]) : ''

const phrase = ref(props.initVal || '')
model.value.err = err(phrase.value)

watch (phrase, (val, av) => {
  model.value.err = err(val)
  model.value.nom = val
})

const session = stores.session
const config = stores.config
const org = ref(props.orgext ? props.orgext : (config.search ? config.search : ''))
const isPwd = ref(false)
const encours = ref(false)

async function crypterphrase () {
  if (!props.btnok) return
  if (err(model.value.phrase) !== '' || org.value === '') return
  encours.value = true
  const pc = new Phrase()
  setTimeout(async () => {
    await pc.init(model.value.phrase)
    encours.value = false
    pc.org = org.value
    emit('ok', pc)
  }, 1)
}

</script>

<style lang="sass" scoped>
@import '../css/input.sass'
.h1
  height: 1.2rem
  position: relative
  top: -1.2rem
</style>
