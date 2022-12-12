<!-- https://github.com/serebrov/emoji-mart-vue#i18n -->
<template>
 <q-dialog v-model="ui.choixEmoji">
  <div style="position:relative">
    <Picker :data="emojiIndex" 
      set="google" title="" emoji="question" native
      :i18n="cfgi18n()" :emoji-size="18" @select="showEmoji" />
    <q-btn dense icon="check" color="green-5" @click="ok"
      style="position:absolute;top:0;right:0"/>
  </div>
</q-dialog>
</template>

<script>
import data from 'emoji-mart-vue-fast/data/google.json'
// Note: component needs to be imported from /src subfolder:
import { Picker, EmojiIndex } from 'emoji-mart-vue-fast/src'
// import 'emoji-mart-vue-fast/css/emoji-mart.css'
import '../css/emoji.css'

import stores from '../stores/stores.mjs'

export default {
  name: 'ChoixEmoji',

  components: { Picker },

  props: { inp: Object, close: Function },

  computed: { },

  data() {
    return {
      visible: true,
      entree: ''
    }
  },
  methods: {
    ok () {
      const ta = this.inp
      const ss = ta.selectionStart
      const sf = ta.selectionEnd
      const deb = ta.value.substring(0, ss)
      const fin = ta.value.substring(sf, ta.value.length)
      ta.value = deb + this.entree + fin
      const pos = ss + this.entree.length
      this.entree = ''
      this.close(pos)
      setTimeout(() => {
        ta.focus()
        ta.selectionStart = pos
        ta.selectionEnd = pos
        stores.ui.choixEmoji = false
      }, 10)
    },
    showEmoji (emoji) {
      this.entree += emoji.native
    },
    cfgi18n () {
      return {
        search: this.$t('EMOsearch1'),
        notfound: this.$t('EMOnotfound'),
        categories: {
          search: this.$t('EMOsearch2'),
          recent: this.$t('EMOrecent'),
          smileys: this.$t('EMOsmileys'),
          people: this.$t('EMOpeople'),
          nature: this.$t('EMOnature'),
          foods: this.$t('EMOfoods'),
          activity: this.$t('EMOactivity'),
          places: this.$t('EMOplaces'),
          objects: this.$t('EMOobjects'),
          symbols: this.$t('EMOsymbols'),
          flags: this.$t('EMOflags'),
          custom: this.$t('EMOcustom')
        }
      }
    }
  },
  setup () {
    const config = stores.config
    const session = stores.session
    let emojiIndex = config.emojiIndex
    if (!emojiIndex) {
      emojiIndex = new EmojiIndex(data)
      config.setEmojiIndex(emojiIndex)
    }
    return {
      ui: stores.ui,
      emojiIndex,
      session
    }
  }
}
</script>
<style lang="scss">
.emoji-mart {
  background: #141414 !important;
  color: white !important
}
.emoji-mart-anchor {
  padding: 2px 0 !important
}
.emoji-mart-bar {
  margin-right: 30px;
  background: white !important
}
.emoji-mart-search input {
  background: #141414 !important;
  color: white !important
}
.emoji-mart-category-label h3 {
  background: indigo !important;
  color: white !important;
  padding: 2px;
  font-size: 1rem;
}
.emoji-mart-preview {
  height: 70px !important;
  background:#141414 !important;
}
</style>
