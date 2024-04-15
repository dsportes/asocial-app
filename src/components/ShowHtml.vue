<template>
<div>
  <div v-if="!ui.d.SHfs[idc]" style="position:relative">
    <div v-if="zoom || edit" class="row btn">
      <q-btn v-if="zoom" dense color="primary" icon="fullscreen" round size="md" padding="none"
        @click.stop="ui.oD('SHfs', idc)">
        <q-tooltip class="bg-white text-primary">{{$t('SHpe')}}</q-tooltip>
      </q-btn>
      <q-btn v-if="edit" class="q-ml-xs" dense color="warning" padding="none" round
        icon="edit" size="md" @click.stop="editer">
        <q-tooltip class="bg-white text-primary">{{$t('SHed')}}</q-tooltip>
      </q-btn>
    </div>
    <sd-nb :style="styx" :texte="texte || ''" :idx="idx"/>
  </div>

  <q-dialog v-model="ui.d.SHfs[idc]" persistent maximized 
    transition-show="slide-up" transition-hide="slide-down">
    <q-card>
      <q-bar>
        <q-space />
        <q-btn v-if="edit" dense padding="none" round color="primary" icon="edit" size="md" @click="editer">
          <q-tooltip class="bg-white text-primary">{{$t('SHed')}}</q-tooltip>
        </q-btn>
        <q-btn dense padding="none" round color="primary" size="md" icon="close_fullscreen" @click="ui.fD">
          <q-tooltip class="bg-white text-primary">{{$t('SHre')}}</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section style="max-height: 100vh" :class="sty() + 'scroll'">
        <sd-nb :style="styx" :texte="texte"/>
      </q-card-section>
    </q-card>
  </q-dialog>
</div>
</template>
<script>

import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { sty } from '../app/util.mjs'

import SdNb from './SdNb.vue'

export default ({
  name: 'ShowHtml',

  components: { SdNb },

  props: { 
    texte: String, 
    idx: Number, 
    maxh: String, 
    zoom: Boolean, 
    edit: Boolean,
    scroll: Boolean
    },

  computed: {
    dk () { const d = this.$q.dark.isActive 
      return d ? (this.idx === -1 ? true : false) : (this.idx === -1 ? false : true)
    },
    idx0 () { return this.idx === -1 || !this.idx || (this.idx % 2 === 0) },
    styx () { 
      return 'min-height:2rem' + 
        ';height:' + (this.maxh ? this.maxh + ';' : '') +
        'overflow-y:' + (this.scroll ? 'scroll' : 'auto') 
    }
  },

  data () {
    return {
    }
  },

  methods: {
    editer () {
      this.$emit('edit')
    }
  },

  setup (props) {
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    const t = toRef(props, 'texte')

    return {
      ui, idc, sty
    }
  }
})
</script>

<style lang="sass" scoped>
.btn
  position: absolute
  right: 7px
  top: 0
.q-bar--standard
  padding: 0 !important
</style>
