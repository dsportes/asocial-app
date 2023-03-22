<template>
<span @click="ouvrir">
  <q-btn icon="help" dense :size="size || 'md'">
    <q-tooltip class="bg-white text-primary">{{titre}}</q-tooltip>
  </q-btn>
  <span v-if="label" class="q-ml-sm">{{label}}</span>
</span>
</template>
<script>
import stores from '../stores/stores.mjs'

export default ({
  name: 'BoutonHelp',

  props: { size: String, page: String, label: String },

  computed: {
    titre () {
      return this.page && this.config.help[this.page] ? this.$t('HLPaide') + this.config.help[this.page].titre[this.$i18n.locale] : this.$t('HLPaidebd')
    }
  },

  methods: {
    ouvrir () {
      if (this.page) this.ui.pushhelp(this.page)
    }
  },
  
  setup () {
    return {
      config: stores.config,
      session: stores.session,
      ui: stores.ui
    }
  } 
})
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
