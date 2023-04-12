<template>
  <div :class="'row ' + dkli()">
    <div class="col-auto q-mr-sm">
      <img class="photomax" :src="photo" />
    </div>
    <div class="col">
      <div>
        <span class="text-bold fs-md q-mr-sm">{{elt.na.nom}}</span> 
        <span class="text-bold fs-sm font-mono q-mr-sm">#{{elt.na.id}}</span> 
      </div>
      <show-html v-if="info" class="q-my-xs bord" :idx="idx" 
        zoom maxh="3rem" :texte="info"/>
      <div v-else class="text-italic">{{$t('FAnocv')}}</div>
      <barre-people v-if="session.estComptable || session.estSponsor" :na="elt.na"/>
    </div>
  </div>
</template>
<script>

import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import { IDCOMPTABLE } from '../app/api.mjs'
import BarrePeople from './BarrePeople.vue'

export default {
  name: 'ApercuCompte',

  props: { elt: Object, idx: Number },

  components: { ShowHtml, BarrePeople },

  computed: {
    phDef() { return this.elt.na.id === IDCOMPTABLE ? this.config.iconSuperman : this.config.iconAvatar },
    info () { return this.elt.cv ? (this.elt.cv.info || '') : '' },
    photo () { return this.elt.cv ? (this.elt.cv.photo || this.phDef) : this.phDef },
  },

  data () { return {
  }},

  methods: {
    dkli () { return this.$q.dark.isActive ? (this.idx ? 'sombre' + (this.idx % 2) : 'sombre0') : (this.idx ? 'clair' + (this.idx % 2) : 'clair0') },
  },

  setup (props) {
    const config = stores.config
    const session = stores.session
    return {
      config,
      session
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
