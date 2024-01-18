<template>
<span @click="ouvrir">
  <q-btn icon="help" dense :size="size || 'md'">
    <q-tooltip class="bg-white text-primary">{{tp || $t('HLPaidebd')}}</q-tooltip>
  </q-btn>
  <span v-if="label" class="q-ml-sm">{{label}}</span>
</span>
</template>
<script>
import stores from '../stores/stores.mjs'
import { titre } from '../app/help.mjs'

export default ({
  name: 'BoutonHelp',

  props: { size: String, page: String, label: String },

  computed: {
    tp () { return titre(this.$i18n.locale, this.page) }
  },

  methods: {
    async ouvrir () {
      const p = this.page && this.tp ? this.page : 'bientot'
      this.ui.pushhelp(p)
    },
  },
  
  setup () {
    return {
      ui: stores.ui
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
