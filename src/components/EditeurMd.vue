<template>
<div ref="root">
  <q-card v-if="!ui.d[idc].EMmax" :class="dkli(idx)">
    <div :style="'height:' + (mh || '10rem')" class="dlx">
      <q-layout container view="hHh lpR fFf">
        <q-header elevated>
          <q-toolbar class="fs-md full-width bg-secondary text-white">
            <q-btn class="q-mr-xs" @click="ui.oD('EMmax', idc)"
              icon="zoom_out_map" size="md" padding="none" round dense/>
            <q-checkbox v-model="md" size="lg" dense color="white"
              unchecked-icon="text_fields" checked-icon="text_format">
              <q-tooltip class="fs-md">{{$t('texte')}}</q-tooltip>
            </q-checkbox>
            <q-btn v-if="editable" :disable="md" class="q-mr-xs" @click="ouvriremojimd1"
              icon="insert_emoticon" size="md" padding="none" round dense/>
            <q-btn v-if="modifie" class="q-mr-xs" @click="undo"
              icon="undo" size="md" padding="none" round dense/>
            <q-space/>
            <div :class="'font-mono fs-sm' + (textelocal && textelocal.length >= maxlg ? ' text-bold text-warning bg-yellow-5':'')">
              {{textelocal ? textelocal.length : 0}}/{{maxlg}}c
            </div>
          </q-toolbar>
        </q-header>

        <q-page-container :class="dkli(idx)">
          <q-input autogrow v-if="!md" class="q-pa-xs font-mono" v-model="textelocal"
            :readonly="!editable" :placeholder="textelocal==='' ? (placeholder || $t('EMDph')) : ''"/>
          <show-html v-else class="q-pa-xs bord1" :texte="textelocal"/>
        </q-page-container>
      </q-layout>
    </div>
  </q-card>

  <q-dialog v-model="ui.d[idc].EMmax" full-height full-width 
    transition-show="slide-up" transition-hide="slide-down">
    <div ref="root2" :class="sty() + 'column'">
      <q-header elevated>
        <q-toolbar class="fs-md full-width bg-secondary text-white">
          <q-btn class="q-mr-xs" @click="ui.fD"
            icon="zoom_in_map" size="md" padding="none" round dense/>
          <q-checkbox v-model="md" size="lg" dense color="white"
            unchecked-icon="text_fields" checked-icon="text_format">
            <q-tooltip class="fs-md">{{$t('texte')}}</q-tooltip>
          </q-checkbox>
          <q-btn v-if="editable" :disable="md" class="q-mr-xs" @click="ouvriremojimd2"
            icon="insert_emoticon" size="md" padding="none" round dense/>
          <q-btn v-if="modifie" class="q-mr-xs" @click="undo"
            icon="undo" size="md" padding="none" round dense/>
          <q-space/>
          <div :class="'font-mono fs-sm' + (textelocal && textelocal.length >= maxlg ? ' text-bold text-warning bg-yellow-5':'')">
            {{textelocal ? textelocal.length : 0}}/{{maxlg}}c
          </div>
        </q-toolbar>
      </q-header>

      <q-page-container class="dlx">
        <q-input autogrow v-if="!md" :class="dkli(idx) + ' q-pa-xs col font-mono'" v-model="textelocal" 
          :readonly="!editable" :placeholder="textelocal==='' ? (placeholder || $t('EMDph')) : ''"/>
        <show-html v-else :class="dkli(idx) + ' q-pa-xs col-auto bord1'" :texte="textelocal"/>
      </q-page-container>
    </div>
  </q-dialog>

  <choix-emoji :inp="inp" :close="emojiClose"/>

</div>
</template>

<script>
import { ref, toRef, watch, onUnmounted } from 'vue'
import stores from '../stores/stores.mjs'
import { sty, dkli } from '../app/util.mjs'

import ShowHtml from './ShowHtml.vue'
import ChoixEmoji from '../dialogues/ChoixEmoji.vue'

export default ({
  name: 'EditeurMd',

  components: { ShowHtml, ChoixEmoji },

  emits: ['update:modelValue'],

  props: { 
    help: String,
    lgmax: Number, 
    modelValue: String, 
    texte: String,
    placeholder: String,
    editable: Boolean, 
    idx: Number, 
    modetxt: Boolean,
    mh: String
  },

  computed: {
    modifie () {
      return this.textelocal !== this.texteinp
    }
  },

  data () {
    return {
      inp: null
    }
  },

  methods: {
    ouvriremojimd1 () {
      this.inp = this.root.querySelector('textarea')
      this.ui.oD('choixEmoji', this.idc)
    },
    ouvriremojimd2 () {
      this.inp = this.root2.querySelector('textarea')
      this.ui.oD('choixEmoji', this.idc)
    },
    undo () {
      this.textelocal = this.texteinp
    },
    emojiClose () {
      this.textelocal = this.inp.value
    }
  },

  setup (props, context) {
    const ui = stores.ui
    const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
    const config = stores.config
    const root = ref(null)
    const root2 = ref(null)
    const taille = ref(0)
    const tailleM = toRef(props, 'tailleM')
    const textelocal = ref('') // en Ref parce que sa valeur dépend du changement de la prop texte ET de l'état d'édition
    const texte = toRef(props, 'texte') // pour pouvoir mettre un watch sur le changement de la propriété
    const modetxt = toRef(props, 'modetxt')
    const lgmax = toRef(props, 'lgmax')
    const maxlg = ref(0)
    maxlg.value = lgmax.value || config.maxlgtextegen
    const texteinp = ref('') // dernière valeur source passée sur la prop 'texte'
    const md = ref(true)

    watch(texte, (ap, av) => { // quand texte change, textelocal ne change pas si en édition
      if (textelocal.value === texteinp.value && textelocal.value !== ap) {
        // textelocal n'était PAS modifié, ni égal à la nouvelle valeur : alignement sur la nouvelle valeur
        textelocal.value = ap
      }
      texteinp.value = ap
    })

    watch(modetxt, (ap, av) => {
      if (ap) md.value = false
    })

    watch(textelocal, (ap, av) => {
      if (ap && ap.length > maxlg.value) textelocal.value = ap.substring(0, maxlg.value)
      context.emit('update:modelValue', textelocal.value)
    })

    textelocal.value = texte.value
    texteinp.value = texte.value
    taille.value = tailleM.value ? 1 : 0
    if (modetxt.value) md.value = false

    return {
      ui, idc, sty, dkli,
      session: stores.session,
      md,
      root,
      root2,
      taille,
      texteinp,
      textelocal,
      maxlg
    }
  }
})
</script>

<style lang="css">
@media screen and (max-width: 320px) {
  emoji-picker {
    --num-columns: 5;
    --category-emoji-size: 1rem;
  }
}
</style>

<style lang="sass" scoped>
.dlx
  background-color: rgba(127,127,127,0.2) !important
  padding: 4px
.bord1
  border-bottom: 1px solid $grey-5
</style>

<style lang="sass" scoped>
::v-deep(.q-field__native)
  padding-top: 0 !important
  min-height: 1rem !important
::v-deep(.q-field__control)
  min-height: 0 !important
</style>