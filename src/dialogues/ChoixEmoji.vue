<!-- https://github.com/serebrov/emoji-mart-vue#i18n -->
<template>
 <q-dialog v-model="ui.d[idc].choixEmoji">
  <div style="position:relative">
    <Picker :data="emojiIndex" 
      set="google" title="" emoji="question" native
      :i18n="cfgi18n()" :emoji-size="18" @select="showEmoji" />
    <div class="bg-white row" style="position:absolute;top:35px;right:8px">
      <div class="col fs-xl" style="width:6rem;min-height:2rem;">{{entree}}</div>
      <btn-cond class="col-auto" icon="backspace" color="primary" @ok="bs"/>
      <btn-cond class="col-auto" icon="check" color="green-5" @ok="ok"/>
    </div>
  </div>
</q-dialog>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

import data from 'emoji-mart-vue-fast/data/google.json'
// Note: component needs to be imported from /src subfolder:
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src'
// import 'emoji-mart-vue-fast/css/emoji-mart.css'
import '../css/emoji.css'

import stores from '../stores/stores.mjs'
import BtnCond from '../components/BtnCond.vue'
import { $t } from '../app/util.mjs'

const props = defineProps({ 
  inp: Object, 
  close: Function, 
  idc: Number
})

const visible = ref(true)
const entree = ref('')

const ui = stores.ui

const config = stores.config
let emojiIndex = config.emojiIndex
if (!emojiIndex) {
  emojiIndex = new EmojiIndex(data)
  config.setEmojiIndex(emojiIndex)
}

function ok () {
  const ta = props.inp
  const ss = ta.selectionStart
  const sf = ta.selectionEnd
  const deb = ta.value.substring(0, ss)
  const fin = ta.value.substring(sf, ta.value.length)
  ta.value = deb + entree.value + fin
  const pos = ss + entree.value.length
  entree.value = ''
  props.close(pos)
}

function showEmoji (emoji) { entree.value += emoji.native }

function bs () { entree.value = entree.value.substring(0, entree.value.length - 2) }

function cfgi18n () {
  return {
    search: $t('EMOsearch1'),
    notfound: $t('EMOnotfound'),
    categories: {
      search: $t('EMOsearch2'),
      recent: $t('EMOrecent'),
      smileys: $t('EMOsmileys'),
      people: $t('EMOpeople'),
      nature: $t('EMOnature'),
      foods: $t('EMOfoods'),
      activity: $t('EMOactivity'),
      places: $t('EMOplaces'),
      objects: $t('EMOobjects'),
      symbols: $t('EMOsymbols'),
      flags: $t('EMOflags'),
      custom: $t('EMOcustom')
    }
  }
}

</script>

<style lang="scss">
.emoji-mart {
  background: #141414 !important;
  color: white !important
}
.emoji-mart-anchor {
  padding: 2px 0 !important
}
.emoji-mart-bar {
  margin-right: 0px;
  background: white !important
}
.emoji-mart-search input {
  background: #141414 !important;
  color: white !important
}
.emoji-mart-category-label h3 {
  background: indigo !important;
  color: white !important;
  padding: 2px;
  font-size: 1rem;
}
.emoji-mart-preview {
  height: 70px !important;
  background:#141414 !important;
}
</style>
