<template>
<div>
  <div v-if="!ui.d[idc].SHfs" style="position:relative">
    <div v-if="zoom || edit" class="row btn">
      <btn-cond v-if="zoom" icon="fullscreen" round stop @ok="ui.oD('SHfs', idc)">
        <q-tooltip class="bg-white text-primary">{{$t('SHpe')}}</q-tooltip>
      </btn-cond>
      <btn-cond v-if="edit" class="q-ml-xs" color="warning" round
        icon="edit" stop @ok="editer">
        <q-tooltip class="bg-white text-primary">{{$t('SHed')}}</q-tooltip>
      </btn-cond>
    </div>
    <sd-nb :style="styx" :texte="texte || ''" :idx="idx"/>
  </div>

  <q-dialog v-model="ui.d[idc].SHfs" persistent maximized 
    transition-show="slide-up" transition-hide="slide-down">
    <q-card>
      <q-bar>
        <q-space />
        <btn-cond v-if="edit" round icon="edit" @ok="editer">
          <q-tooltip class="bg-white text-primary">{{$t('SHed')}}</q-tooltip>
        </btn-cond>
        <btn-cond round icon="close_fullscreen" @ok="ui.fD">
          <q-tooltip class="bg-white text-primary">{{$t('SHre')}}</q-tooltip>
        </btn-cond>
      </q-bar>
      <q-card-section style="max-height: 100vh" :class="sty() + 'scroll'">
        <sd-nb :style="styx" :texte="texte"/>
      </q-card-section>
    </q-card>
  </q-dialog>
</div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { sty } from '../app/util.mjs'
import BtnCond from './BtnCond.vue'
import SdNb from './SdNb.vue'

const ui = stores.ui
const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))

const props = defineProps({ 
  texte: String, 
  idx: Number, 
  maxh: String, 
  zoom: Boolean, 
  edit: Boolean,
  scroll: Boolean
})

const emit = defineEmits(['edit'])

const dk = computed(() => { 
  const d = this.$q.dark.isActive 
  return d ? (props.idx === -1 ? true : false) : (props.idx === -1 ? false : true)
})
const idx0 = computed(() => props.idx === -1 || !props.idx || (props.idx % 2 === 0))
const styx = computed(() => 
  'min-height:2rem' + 
  ';height:' + (props.maxh ? props.maxh + ';' : '') +
  'overflow-y:' + (props.scroll ? 'scroll' : 'auto') 
)

function editer () { emit('edit') }

</script>

<style lang="sass" scoped>
.btn
  position: absolute
  right: 7px
  top: 0
.q-bar--standard
  padding: 0 !important
</style>
