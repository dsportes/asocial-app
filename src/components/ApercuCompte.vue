<template>
  <div :class="'row ' + dkli()">
    <div class="col-auto q-mr-sm">
      <img class="photomax" :src="photo" />
    </div>
    <div class="col">
      <div>
        <span class="text-bold fs-md q-mr-sm">{{na.nomc}}</span> 
        <span class="text-bold fs-sm font-mono q-mr-sm">#{{na.id}}</span> 
      </div>
      <show-html v-if="info" class="q-my-xs bord" :idx="idx" 
        zoom maxh="3rem" :texte="info"/>
      <div v-else class="text-italic">{{$t('FAnocv')}}</div>
    </div>
  </div>
</template>
<script>

import { toRef } from 'vue'

import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import { IDCOMPTABLE } from '../app/api.mjs'

export default {
  name: 'ApercuCompte',

  props: { na: Object, cv: Object, idx: Number },

  components: { ShowHtml },

  computed: {
    info () { return this.cv ? (this.cv.info || '') : '' },
    photo () { return this.cv ? (this.cv.photo || this.phDef) : this.phDef },
  },

  data () { return {
  }},

  methods: {
    dkli () { return this.$q.dark.isActive ? (this.idx ? 'sombre' + (this.idx % 2) : 'sombre0') : (this.idx ? 'clair' + (this.idx % 2) : 'clair0') },
  },

  setup (props) {
    const config = stores.config
    const na = toRef(props, 'na')
    const phDef = (na.value.id === IDCOMPTABLE ? config.iconSuperman : config.iconAvatar)

    return {
      phDef
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
