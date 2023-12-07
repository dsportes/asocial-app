<template>
  <div :class="dkli(idx)">
    <apercu-genx :id="elt.id" :idx="idx"/>
    <barre-people v-if="session.estComptable || aSt.estSponsor" :id="elt.id"/>
  </div>
</template>
<script>

import stores from '../stores/stores.mjs'
import ApercuGenx from './ApercuGenx.vue'
import { ID } from '../app/api.mjs'
import BarrePeople from './BarrePeople.vue'
import { dkli } from '../app/util.mjs'

export default {
  name: 'ApercuCompte',

  props: { elt: Object, idx: Number },

  components: { BarrePeople, ApercuGenx },

  computed: {
    phDef() { return ID.estComptable(this.elt.id) ? this.config.iconSuperman : this.config.iconAvatar },
    info () { return this.elt.cv ? (this.elt.cv.info || '') : '' },
    photo () { return this.elt.cv ? (this.elt.cv.photo || this.phDef) : this.phDef },
    nom () { return this.elt.na ? this.elt.na.nom : '' }
  },

  data () { return {
  }},

  methods: {
  },

  setup (props) {
    const config = stores.config
    const session = stores.session
    const aSt = stores.avatar
    return {
      config,
      session,
      aSt,
      dkli
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
