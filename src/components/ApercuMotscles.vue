<template>
<div>
  <div :class="'full-width row justify-between ' + dkli(idx)">
    <div v-if="!src.length" class="titre-md text-italic">{{$t('MCaucun')}}</div>
    <div v-else class="col row font-mono fs-md">
      <span v-for="idx in src" :key="idx" :class="sty(src[idx]) + ' q-mr-sm'">{{nom(src[idx])}}</span>
    </div>
    <q-btn v-if="edit" class="col-auto q-mr-sm" size="sm" icon="edit" color="primary" @click="editer">
      <q-tooltip class="bg-white text-primary">{{$t('editer')}}</q-tooltip>
    </q-btn>
  </div>
  <q-dialog v-model="mcedit" persistent>
    <choix-motscles :motscles="motscles" :src="src" :du-groupe="duGroupe" :du-compte="duCompte"
      :titre="$t('MCchoix')" @ok="okmc"/>
  </q-dialog>
</div>
</template>

<script>
import { toRef } from 'vue'
import stores from '../stores/stores.mjs'

export default ({
  name: 'ApercuMotscles',

  props: { mapmc: Object, src: Object, edit: Boolean, idx: Number, ok: Function },

  computed: {
  },

  data () { return {
    mcedit: false
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async editer () {
      if (this.edit && await this.session.aut(3, true)) this.mcedit = true
    },
    okmc (mc) { 
      if (this.ok && mc) this.ok(mc)
      this.mcedit = false
    },
    sty (idx) {
      if (idx < 100) return ''
      return idx <= 199 ? 'text-italic' : 'text-bold'
    }
  },

  setup (props) {
    const session = stores.session
    const mapMC = toRef(props, 'mapmc')
    function nom (idx) {
      if (!mapMC.value) return ''
      const e = mapMC.value[idx]
      return e && e.n ? e.n : ''
    }
    return {
      session,
      nom
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
