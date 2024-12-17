<template>
  <div class="fs-md">
    <div class="titre-lg">{{$t('NAph0')}}</div>
    <div>
      <div class="text-italic titre-sm">{{$t('NAw1')}}</div>
      <div>
        <span class="q-px-sm text-negative bg-yellow text-bold">{{interdits}}</span>
        <span class="q-ml-sm">{{$t('NAw2')}}</span>
      </div>
    </div>
    <q-input dense counter v-model="nom"
      :label="groupe ? $t('NAng') : $t('NAna')"
      :rules="[r1,r2]"
      @keydown.enter.prevent="ok" type="text" 
      :hint="nom && r1(nom) && r2(nom) ? $t('entree') : $t('NAe1', [min, max])">
      <template v-slot:append>
        <span :class="nom.length === 0 ? 'disabled' : ''">
          <q-icon name="cancel" class="cursor-pointer"  @click="nom=''"/>
        </span>
      </template>
    </q-input>
    <div v-if="labelValider" class="row justify-end q-gutter-sm items-center no-wrap">
      <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ko" />
      <btn-cond :label="labelValider" :icon="iconValider" :disable="!nomok" @ok="ok" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

import { $t, interdits, regInt } from '../app/util.mjs'
import BtnCond from '../components/BtnCond.vue'

const min = 6
const max = 24

const props = defineProps({
  iconValider: String,
  groupe: Boolean,
  labelValider: String,
  initVal: String
})

const nom = ref(props.initVal || '')

const emit = defineEmits(['ok-nom'])

const r2 = (val) => val.length < min || val.length > max ? $t('NAe1', [min, max]) : true
const r1 = (val) => regInt.test(val) ? $t('NAe2') : true

const nomok = computed(() => r1(nom.value) === true && r2(nom.value) === true)

function ok () {
  if (nomok.value) emit('ok-nom', nom.value)
}

function ko () {
  nom.value = ''
  emit('ok-nom', null)
}

</script>

<style lang="sass" scoped>
@import '../css/input.sass'
</style>
