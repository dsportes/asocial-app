<template>
<div>
  <div v-if="!fs" style="position:relative">
    <div v-if="zoom || edit" class="row btn">
      <q-btn v-if="edit" dense color="primary" icon="edit" size="sm" @click.stop="editer">
        <q-tooltip class="bg-white text-primary">{{$t('SHed')}}</q-tooltip>
      </q-btn>
      <q-btn v-if="zoom" class="q-ml-xs" dense color="primary" icon="fullscreen" size="sm" @click.stop="ovfs">
        <q-tooltip class="bg-white text-primary">{{$t('SHpe')}}</q-tooltip>
      </q-btn>
    </div>
    <div :style="sty" v-if="!$q.dark.isActive">
      <sd-light v-if="idx0" :texte="texte"/>
      <sd-light1 v-else :texte="texte"/>
    </div>
    <div :style="sty" v-else>
      <sd-dark v-if="idx0" :texte="texte"/>
      <sd-dark1 v-else :texte="texte"/>
    </div>
  </div>

  <q-dialog v-model="fs" persistent maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card>
      <q-bar>
        <q-space />
        <q-btn v-if="edit" dense color="primary" icon="edit" size="md" @click="editer">
          <q-tooltip class="bg-white text-primary">{{$t('SHed')}}</q-tooltip>
        </q-btn>
        <q-btn dense color="primary" size="md" icon="close_fullscreen" @click="MD.fD">
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
import { ref } from 'vue'
import SdLight from './SdLight.vue'
import SdDark from './SdDark.vue'
import SdLight1 from './SdLight1.vue'
import SdDark1 from './SdDark1.vue'
import { MD } from '../app/modele.mjs'

const styb = 'min-height:2rem;overflow-y:auto;'

export default ({
  name: 'ShowHtml',

  components: { SdDark, SdLight, SdDark1, SdLight1 },

  props: { texte: String, idx: Number, maxh: String, zoom: Boolean, edit: Boolean },

  computed: {
    idx0 () { return !this.idx || (this.idx % 2 === 0) },
    sty () { return styb + (this.maxh ? 'max-height:' + this.maxh : '') }
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
    const fs = ref(false)
    function ovfs () { MD.oD(fs) }

    return {
      MD, fs, ovfs
    }
  }
})
</script>

<style lang="sass" scoped>
.btn
  position: absolute
  right: 0
  top: 0
.q-bar--standard
  padding: 0 !important
</style>
