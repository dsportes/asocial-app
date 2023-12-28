<template>
<div ref="root">
  <q-card v-if="!ui.d.EMmax[idc]" :class="dlclass">
    <div :style="'height:' + (mh || '10rem')" class="dlx">
      <q-layout container view="hHh lpR fFf">
        <q-header elevated class="bg-secondary text-white">
          <q-toolbar class="fs-md full-width row bg-primary text-white">
            <q-btn class="col-auto q-mr-xs" icon="zoom_out_map" size="md" 
              push flat dense @click="ui.oD('EMmax', idc)"/>
            <q-checkbox v-model="md" size="sm" dense label="HTML" />
            <q-btn v-if="editable" :disable="md" class="col-auto q-mr-xs" label="🙂" size="md"
              dense flat push @click="ouvriremojimd1"/>
            <q-btn v-if="modifie" class="col-auto q-mr-xs" icon="undo" size="md" dense flat push @click="undo"/>
            <q-btn v-if="modifie && labelOk" class="col-auto q-mr-xs" icon="check" 
              :label="labelOk" size="md" dense flat push @click="ok"/>
            <q-space/>
            <div :class="'col-auto font-mono fs-sm' + (textelocal && textelocal.length >= maxlg ? ' text-bold text-warning bg-yellow-5':'')">
              {{textelocal ? textelocal.length : 0}}/{{maxlg}}c
            </div>
          </q-toolbar>
        </q-header>

        <q-page-container :class="dlclass">
          <q-input autogrow v-if="!md" class="q-pa-xs font-mono" v-model="textelocal"
            :readonly="!editable" :placeholder="textelocal==='' ? (placeholder || $t('EMDph')) : ''"/>
          <show-html v-else class="q-pa-xs bord1" :texte="textelocal"/>
        </q-page-container>
      </q-layout>
    </div>
  </q-card>

  <q-dialog v-model="ui.d.EMmax[idc]" full-height full-width 
    transition-show="slide-up" transition-hide="slide-down">
    <div ref="root2" :class="sty() + 'column'">
      <q-toolbar class="col-auto fs-md bg-primary text-white">
        <q-btn class="col-autov q-mr-xs" icon="zoom_in_map" size="md" dense flat push @click="ui.fD"/>
        <q-checkbox v-model="md" size="md" dense label="HTML" />
        <q-btn v-if="editable" :disable="md" class="col-auto q-mr-xs" label="🙂" size="md"
          dense flat push @click="ouvriremojimd2"/>  
        <q-btn v-if="modifie" class="col-auto q-mr-xs" icon="undo" size="md" dense flat push @click="undo"/>
        <q-btn v-if="modifie && labelOk" class="col-auto q-mr-xs" icon="check" :label="labelOk" size="md" dense flat push @click="ok"/>
        <q-space/>
        <div :class="'col-auto font-mono fs-md' + (textelocal && textelocal.length >= maxlg ? ' text-bold text-warning bg-yellow-5':'')">
          {{textelocal ? textelocal.length : 0}}/{{maxlg}}c
        </div>
      </q-toolbar>
      <div class="dlx">
      <q-input autogrow v-if="!md" :class="dlclass + ' q-pa-xs col font-mono'" v-model="textelocal" 
        :readonly="!editable" :placeholder="textelocal==='' ? (placeholder || $t('EMDph')) : ''"/>
      <show-html v-else :class="dlclass + ' q-pa-xs col-auto bord1'" :texte="textelocal"/>
      </div>
    </div>
  </q-dialog>

  <choix-emoji :inp="inp" :close="emojiClose"/>

</div>
</template>

<script>
import { ref, toRef, watch } from 'vue'
import stores from '../stores/stores.mjs'
import { sty } from '../app/util.mjs'

import ShowHtml from './ShowHtml.vue'
import ChoixEmoji from './ChoixEmoji.vue'

export default ({
  name: 'EditeurMd',

  components: { ShowHtml, ChoixEmoji },

  emits: ['update:modelValue', 'ok'],

  props: { 
    help: String,
    lgmax: Number, 
    modelValue: String, 
    texte: String,
    placeholder: String,
    labelOk: String, 
    editable: Boolean, 
    idx: Number, 
    modetxt: Boolean, 
    horsSession: Boolean,
    mh: String
  },

  computed: {
    dlclass () { 
      if (this.$q.dark.isActive) return this.idx ? ' sombre' + (this.idx % 2) : ' sombre0'
      return this.idx ? ' clair' + (this.idx % 2) : ' clair0'
    },
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
    fermer () { if (this.modifie) this.ui.oD('confirmFerm'); else this.ui.fD() },
    ouvriremojimd1 () {
      this.inp = this.root.querySelector('textarea')
      this.ui.oD('choixEmoji')
    },
    ouvriremojimd2 () {
      this.inp = this.root2.querySelector('textarea')
      this.ui.oD('choixEmoji')
    },
    ok () {
      this.ui.fD()
      this.taille = this.tailleM ? 1 : 0
      this.md = false
      const x = this.textelocal && this.textelocal.length > this.maxlg.value ? this.textelocal.substring(0, this.maxlg.value) : this.textelocal
      this.$emit('ok', x)
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
    const idc = ref(ui.getIdc())
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
      ui, idc, sty,
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