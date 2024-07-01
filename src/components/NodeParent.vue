<template>
<div>
  <div v-if="n.note">
    <div v-if="estAv" class="text-bold">{{$t('PNOrav', [nom])}}</div>
    <div v-else class="text-bold">{{$t('PNOrgr', [nom])}}</div>
    <div class="q-my-md q-mx-xs text-italic">{{titre}}</div>
  </div>
  <div v-else>
    <div v-if="estAv" class="text-bold">{{$t('PNOrav2', [nom])}}</div>
    <div v-else class="text-bold">{{$t('PNOrgr2', [nom])}}</div>
  </div>
</div>
</template>

<script>

import stores from '../stores/stores.mjs'
import { Note } from '../app/modele.mjs'

export default ({
  name: 'NodeParent',

  props: { },

  components: { },

  computed: {
    n () { return this.nSt.nodeP },
    t () { return this.n.type },
    estAv () { return this.t === 1 || this.t === 4 || this.t === 6 },
    id () { return Note.idDeKey(this.n.key) },
    nom () { return this.pSt.nom(this.id) },
    titre () { return this.t.type > 3 ? this.nSt.note.titre : '' }
  },

  data () { return {
  }},

  methods: {
  },
  
  setup () {
    return {
      nSt: stores.note,
      pSt: stores.people
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
