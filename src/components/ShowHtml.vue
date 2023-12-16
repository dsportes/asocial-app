<template>
<div>
  <div v-if="!ui.d.SHfs" style="position:relative">
    <div v-if="zoom || edit" class="row btn">
      <q-btn v-if="zoom" dense color="primary" icon="fullscreen" size="md" padding="none"
        @click.stop="ui.oD('SHfs')">
        <q-tooltip class="bg-white text-primary">{{$t('SHpe')}}</q-tooltip>
      </q-btn>
      <q-btn v-if="edit" class="q-ml-xs" dense color="warning" padding="none"
        icon="edit" size="md" @click.stop="editer">
        <q-tooltip class="bg-white text-primary">{{$t('SHed')}}</q-tooltip>
      </q-btn>
    </div>
    <div :style="sty" v-if="dk">
      <sd-light v-if="idx0" :texte="texte"/>
      <sd-light1 v-else :texte="texte"/>
    </div>
    <div :style="sty" v-else>
      <sd-dark v-if="idx0" :texte="texte"/>
      <sd-dark1 v-else :texte="texte"/>
    </div>
  </div>

  <q-dialog v-model="ui.d.SHfs" persistent maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card>
      <q-bar>
        <q-space />
        <q-btn v-if="edit" dense color="primary" icon="edit" size="md" @click="editer">
          <q-tooltip class="bg-white text-primary">{{$t('SHed')}}</q-tooltip>
        </q-btn>
        <q-btn dense color="primary" size="md" icon="close_fullscreen" @click="ui.fD">
          <q-tooltip class="bg-white text-primary">{{$t('SHre')}}</q-tooltip>
        </q-btn>
      </q-bar>
      <q-card-section style="max-height: 100vh" class="scroll">
        <div v-if="!$q.dark.isActive">
          <sd-light :texte="texte"/>
        </div>
        <div v-else>
          <sd-dark :texte="texte"/>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</div>
</template>
<script>

import stores from '../stores/stores.mjs'

import SdLight from './SdLight.vue'
import SdDark from './SdDark.vue'
import SdLight1 from './SdLight1.vue'
import SdDark1 from './SdDark1.vue'

export default ({
  name: 'ShowHtml',

  components: { SdDark, SdLight, SdDark1, SdLight1 },

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
    sty () { 
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

  setup () {
    const ui = stores.ui

    return {
      ui
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
