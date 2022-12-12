<template>
  <q-layout container view="hHh lpR fFf" :class="sty" style="width:80vw">
    <q-header elevated class="bg-secondary text-white">
      <q-toolbar>
        <q-btn dense size="md" icon="close" color="warning" 
          v-close-popup @click="ui.fermerHelp">
          <q-tooltip class="bg-white text-primary">{{$t('HLPfermer')}}</q-tooltip>
        </q-btn>
        <q-btn v-if="!stackvide" class="q-ml-xs" dense size="md" icon="chevron_left" @click="back">
          <q-tooltip class="bg-white text-primary">{{$t('HLPprec')}}</q-tooltip>
        </q-btn>
        <q-toolbar-title class="titre-lg">{{titre(pagec())}}</q-toolbar-title>
        <choix-langue style="position:relative;top:-5px"/>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <show-html class="q-ma-sm" :texte="texte"/>
      <div class="filler"/>
    </q-page-container>

    <q-footer elevated class="primary text-white">
      <div class="titre-lg text-italic">{{$t('HLPvoir')}}</div>
      <div class="vlst">
        <div v-for="(p, idx) in page(pagec()).voir" :key="idx">
          <div @click="push(p)" class="titre-md cursor-pointer q-ml-md">{{titre(p)}}</div>
        </div>
      </div>
    </q-footer>

  </q-layout>
</template>

<script>
import axios from 'axios'
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

import stores from '../stores/stores.mjs'

import ShowHtml from '../components/ShowHtml.vue'
import ChoixLangue from '../components/ChoixLangue.vue'

export default ({
  name: 'DialogueHelp',

  components: { ChoixLangue, ShowHtml },

  data () {
    return {
    }
  },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    stackvide () { return this.ui.helpstack.length <= 1 }
  },

  methods: {
  },

  setup () {
    const $i18n = useI18n()
    const session = stores.session
    const config = stores.config
    const ui = stores.ui

    const decoder = new TextDecoder('utf-8')

    async function getTextPub (path) {
      try {
        const x = (await axios.get(path, { responseType: 'arraybuffer' })).data
        return decoder.decode(x)
      } catch (e) {
        return null
      }
    }

    const texte = ref('')

    function pagec () {
      return ui.helpstack.length ? ui.helpstack[ui.helpstack.length - 1] : null
    }

    function afficher () {
      const p = pagec()
      if (!p) return
      setTimeout(async () => {
        const loc = $i18n.locale.value
        let txt = ''
        if (p) {
          txt = await getTextPub('help/' + p + '_' + loc + '.md')
          if (!txt && loc !== 'fr-FR') {
            txt = await getTextPub('help/' + p + '_fr-FR.md')
          }
          if (!txt) {
            txt = await getTextPub('help/bientot_' + loc + '.md')
          }
        }
        texte.value = filtreLignes(txt)
      }, 5)
    }

    function filtreLignes (t) {
      const x = t.split('\n'), r = []
      x.forEach(l => { if (!l.startsWith('@@')) r.push(l) })
      return r.join('\n')
    }

    function titre (p) {
      return page(p).titre[$i18n.locale.value]
    }

    function page (p) {
      const x = config.help
      return x[p] || x.bientot
    }

    function push (p) {
      ui.pushhelp(p)
      afficher()
    }

    function back () {
      ui.pophelp()
      afficher()
    }

    afficher()

    return {
      texte,
      titre,
      page,
      pagec,
      push,
      back,
      session,
      ui
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.filler
  height: 2rem
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.vlst
  max-height: 5rem
  overflow-y: auto
</style>
