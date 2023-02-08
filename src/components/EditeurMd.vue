<template>
<div ref="root">
  <q-card v-if="!max" :class="'column fs-md full-height overflow-hidden q-pa-xs shadow-8 ' + dlclass">
    <q-toolbar class="col-auto full-width row">
      <q-btn class="col-auto" icon="zoom_out_map" size="md" push flat dense @click="max=true"></q-btn>
      <q-btn :disable="!md" class="col-auto q-mr-xs" size="md" label="TEXTE" :color="md ? 'warning' : 'purple'" push flat dense @click="md=false"></q-btn>
      <q-btn :disable="md" class="col-auto q-mr-xs" size="md" label="HTML" dense flat push @click="md=true"></q-btn>
      <q-btn v-if="editable" :disable="md" class="col-auto q-mr-xs" label="❤️" size="md"
        dense flat push @click="ouvriremojimd1">
      </q-btn>
      <q-btn v-if="modifie" class="col-auto q-mr-xs" icon="undo" size="md" dense flat push @click="undo"></q-btn>
      <q-btn v-if="modifie && labelOk" class="col-auto q-mr-xs" icon="check" :label="labelOk" size="md" dense flat push color="warning" @click="ok"></q-btn>
      <q-space/>
      <div :class="'col-auto font-mono fs-md' + (textelocal && textelocal.length >= maxlg ? ' text-bold text-warning bg-yellow-5':'')">
        {{textelocal ? textelocal.length : 0}}/{{maxlg}}c
      </div>
    </q-toolbar>
    <textarea v-if="!md" :class="'q-pa-xs col full-width font-mono ta ' + dlclass" v-model="textelocal" :readonly="!editable"/>
    <div v-else class="q-pa-xs col full-width ta"><show-html :idx="idx" :texte="textelocal"/></div>
  </q-card>
  <q-dialog v-model="max" full-height transition-show="slide-up" transition-hide="slide-down">
    <div ref="root2" :class="'column fs-md full-height grandelargeur overflow-hidden ' + dlclass">
      <q-toolbar class="col-auto">
        <q-btn class="col-auto" icon="zoom_in_map" size="md" dense flat push @click="max=false"></q-btn>
        <q-btn :disable="!md" class="col-auto q-mr-xs" size="md" label="TXT" :color="md ? 'warning' : 'purple'" push flat dense @click="md=false"></q-btn>
        <q-btn :disable="md" class="col-auto q-mr-xs" size="md" label="HTML" dense flat push @click="md=true"></q-btn>
        <q-btn v-if="editable" :disable="md" class="col-auto q-mr-xs" label="❤️" size="md"
          dense flat push @click="ouvriremojimd2">
        </q-btn>  
        <q-btn v-if="modifie" class="col-auto q-mr-xs" icon="undo" size="md" dense flat push @click="undo"></q-btn>
        <q-btn v-if="modifie && labelOk" class="col-auto q-mr-xs" icon="check" :label="labelOk" size="md" dense flat push color="warning" @click="ok"></q-btn>
        <q-space/>
        <div :class="'col-auto font-mono fs-md' + (textelocal && textelocal.length >= maxlg ? ' text-bold text-warning bg-yellow-5':'')">
          {{textelocal ? textelocal.length : 0}}/{{maxlg}}c
        </div>
      </q-toolbar>
      <textarea v-if="!md" :class="'q-pa-xs col font-mono ta ' + dlclass" v-model="textelocal" :readonly="!editable"/>
      <div v-else :class="'q-pa-xs col ta ' + dlclass"><show-html :idx="idx" :texte="textelocal"/></div>
    </div>
  </q-dialog>

  <choix-emoji v-if="ui.choixEmoji" :inp="inp" :close="emojiClose"/>

</div>
</template>
<script>
import ShowHtml from './ShowHtml.vue'
import ChoixEmoji from './ChoixEmoji.vue'
import { ref, toRef, watch } from 'vue'
import stores from '../stores/stores.mjs'

export default ({
  name: 'EditeurMd',

  components: { ShowHtml, ChoixEmoji },

  emits: ['update:modelValue', 'ok'],

  props: { lgmax: Number, modelValue: String, texte: String, labelOk: String, editable: Boolean, idx: Number, modetxt: Boolean, horsSession: Boolean },

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
      inp: null,
      emoji: false,
      max: false
    }
  },

  methods: {
    ouvriremojimd1 () {
      this.inp = this.root.querySelector('textarea')
      this.ui.choixEmoji=true
    },
    ouvriremojimd2 () {
      this.inp = this.root2.querySelector('textarea')
      this.ui.choixEmoji=true
    },
    ok () {
      this.max = false
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
      ui,
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
@import '../css/input.sass'
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
</style>
