<template>
<span @click="ouvrir">
  <q-btn icon="help" dense :size="size || 'md'">
    <q-tooltip class="bg-white text-primary">{{tp}}</q-tooltip>
  </q-btn>
  <span v-if="label" class="q-ml-sm">{{label}}</span>
</span>
</template>

<script>
import stores from '../stores/stores.mjs'
import { afficherDiag } from '../app/util.mjs'

export default ({
  name: 'BoutonHelp',

  props: { size: String, page: String, label: String },

  computed: {
    tp () { return !this.ph.has(this.page) ? this.$t('HLPaidebd', [this.page]) : this.$t('A_' + this.page) }
  },

  methods: {
    async ouvrir () {
      if (this.ph.has(this.page)) { this.ui.pushhelp(this.page); return }
      await afficherDiag(this.$t('HLPaidebd2'))
    },
  },
  
  setup () {
    return {
      ui: stores.ui,
      ph: stores.config.pagesHelp
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
