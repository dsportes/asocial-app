<template>
<q-card>
  <q-toolbar class="bg-secondary text-white">
    <btn-cond color="warning" icon="undo" @ok="undo"/>
    <q-toolbar-title class="titre-md full-width text-center">{{titre || $t('HTtit')}}</q-toolbar-title>
    <bouton-help page="page1"/>
    <bouton-bulle idtext="BULLEhashtags"/>
    <btn-cond v-if="okbtn" icon="check" :disable="!chg" @ok="$emit('ok',sr)"/>
  </q-toolbar>

  <div class="q-mb-md">
    <q-input dense counter v-model="sel" class="q-mt-sm q-ml-sm" style="width:20rem"
      :label="$t('HTfil')"
      :rules="[r1,r2]"
      @keydown.enter.prevent="val"
      type="text" 
      :hint="$t('HThint')">
      <template v-slot:append>
        <span :class="sel.length === 0 ? 'disabled' : ''">
          <q-icon name="cancel" class="cursor-pointer"  @click="sel=''"/>
        </span>
      </template>
    </q-input>
    <div class="q-mt-md row font-mono fs-md justify-between">
      <q-scroll-area class="bord1" style="height:25vh; width:45%">
        <div v-for="(t, i) in lr" :key="t" class="text-center cursor-pointer" 
        @click="cllr(t, i)">{{t}}</div>
      </q-scroll-area>
      <q-scroll-area class="col-5 bord2" style="height:25vh; width:45%">
        <div v-for="(t, i) in lc" :key="t" class="text-center cursor-pointer"
         @click="cllc(t, i)">{{t}}</div>
      </q-scroll-area>
    </div>
  </div>

</q-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

import stores from '../stores/stores.mjs'
import BtnCond from './BtnCond.vue'
import BoutonHelp from './BoutonHelp.vue'
import BoutonBulle from './BoutonBulle.vue'
import { styp, $t } from '../app/util.mjs'

const props = defineProps({ 
  src: Object, // set d'origine, le set resultat est v-model
  okbtn: Boolean, // true s'il faut afficher le bouton ok
  titre: String
})

const min = 2
const max = 12
const reg = /^([a-z0-9]{2,12})$/

const session = stores.session
const ui = stores.ui

const sel = ref('')

const sr = ref(new Set())
props.src.forEach(t => { sr.value.add(t)})

const x = new Set()
session.defHT.forEach(t => { x.add(t) })
session.hashtags.forEach(t => { x.add(t) })
const sb = ref(x)

const sc = ref(null)

function filtre () {
  const s = new Set()
  sb.value.forEach(v => { 
    if ((!sel.value || v.indexOf(sel.value) !== -1) && !sr.value.has(v)) s.add(v)
  })
  sc.value = s
}

filtre()

const emit = defineEmits(['update:modelValue', 'ok', 'ko'])

const lr = computed(() => Array.from(sr.value).sort())
const lc = computed(() => Array.from(sc.value).sort())
const chg = computed(() => Array.from(props.src).sort().join(' ') !== lr.value.join(' '))

watch(sel, () => { filtre() })

const r2 = (val) => val.length < min || val.length > max ? $t('HTe1', [min, max]) : true
const r1 = (val) => !reg.test(val) ? $t('HTe2') : true

function undo () {
  sr.value.clear()
  props.src.forEach(t => { sr.value.add(t)})
  filtre()
  emit('update:modelValue', sr.value)
}

function val () {
  if (r1(sel.value) === true && r2(sel.value) === true) {
    if (!sr.value.has(sel.value)) {
      sr.value.add(sel.value)
      sel.value = ''
      emit('update:modelValue', sr.value)
    }
  }
}

function cllr (t) {
  sr.value.delete(t)
  if (!sc.value.has(t)) sc.value.add(t)
  if (!session.defHT.has(t) && !this.sb.has(t)) {
    sb.value.add(t)
    session.setHT(new Set([t]))
  }
  emit('update:modelValue', sr.value)
}

function cllc (t) {
  sc.value.delete(t)
  if (!sr.value.has(t)) {
    sr.value.add(t)
    emit('update:modelValue', sr.value)
  }
}

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border-radius: 5px
  border: 1px solid $secondary
.bord2
  border-radius: 5px
  border: 1px solid $primary
</style>
