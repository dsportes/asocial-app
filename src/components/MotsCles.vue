<template>
<q-card class="bs petitelargeur shadow-8">
  <q-toolbar class="bg-secondary text-white">
    <q-btn class="q-mr-xs" dense size="md" color="warning"
      icon="close" @click="cancelEdit"/>
    <q-btn v-if="!motscles.mc.st.enedition && !lecture" dense size="md" color="primary"
      icon="mode_edit" label="Editer" @click="startEdit"/>
    <q-btn v-if="motscles.mc.st.enedition && !lecture" dense size="md" color="primary"
      icon="add_circle" label="Nouveau" @click="ajoutermc"/>
    <q-btn v-if="motscles.mc.st.enedition && !lecture" dense class="q-ml-xs" size="md" color="primary"
      icon="undo" label="Annuler" @click="cancelEdit"/>
    <q-btn v-if="motscles.mc.st.enedition && !lecture" :disable="!motscles.mc.st.modifie" dense class="q-ml-xs" size="md" color="warning"
      icon="check" label="Valider" @click="okEdit"/>
    <q-btn v-if="lecture" dense size="md" color="warning" icon="close" @click="cancelEdit"/>
    <q-toolbar-title class="titre-md full-width text-right">{{titre}}</q-toolbar-title>
    <bouton-help page="page1"/>
  </q-toolbar>

  <div ref="root">
    <div v-if="ajouter" class="column border1 q-ma-xs q-pa-sm full-width">
      <div class="row justify-start q-gutter-xs">
        <q-btn size="sm" icon="close" dense color="primary" label="Renoncer" @click="undo"></q-btn>
        <q-btn class="q-ml-md" size="sm" icon="check" dense color="warning" label="OK" @click="ok"></q-btn>
      </div>
      <q-input class="inp" v-model="categ" label="Catégorie" counter placeholder="Par exemple: Sections">
        <template v-slot:hint>{{$t('MChint')}}</template>
      </q-input>
      <div id="ta">
        <q-input class="inp" v-model="nom" label="Nom" counter maxlength="12" placeholder="Par exemple: Ecologie">
          <template v-slot:hint>3 à 12 lettres, émoji conseillé en tête</template>
          <template v-slot:append>
            <q-btn label="❤️" size="md" dense @click="ouvriremoji"/>
          </template>
        </q-input>
      </div>
    </div>
  </div>

  <q-splitter v-model="splitterModel" class="col full-width height-16">
    <template v-slot:before>
      <q-tabs v-model="tab" no-caps vertical >
        <q-tab v-for="categ in motscles.mc.lcategs" :key="categ" :name="categ" :label="categ" />
      </q-tabs>
    </template>
    <template v-slot:after>
      <q-tab-panels v-model="tab" animated swipeable vertical transition-prev="jump-up" transition-next="jump-up" >
        <q-tab-panel v-for="categ in motscles.mc.lcategs" :key="categ" :name="categ">
          <div v-for="item in motscles.mc.categs.get(categ)" :key="item[1]+'/'+item[0]">
            <span class="fs-md">{{item[0]}}</span>
            <span class="fs-sm font-mono q-px-xs">[{{item[1]}}]</span>
            <span class="fs-sm q-px-xs text-italic">{{$t('tmc' + Math.floor(item[1] / 100))}}</span>
            <span v-if="motscles.mc.st.enedition && ((item[1] < 200 && item[1] >= 100 && motscles.gr) || (item[1] < 100 && !motscles.gr))">
              <q-btn icon="mode_edit" size="sm" color="primary" dense @click="edit(categ, item[0], item[1])"></q-btn>
              <q-btn class="q-ml-sm" v-if="categ === obs" icon="close" color="warning" size="sm" dense @click="suppr(categ, item[1])"></q-btn>
            </span>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </q-splitter>

  <choix-emoji :inp="inp" :close="emojiClose"/>

</q-card>
</template>
<script>
import { ref, toRef, reactive } from 'vue'
import stores from '../stores/stores.mjs'
import ChoixEmoji from './ChoixEmoji.vue'
import BoutonHelp from './BoutonHelp.vue'
import { MD, Motscles } from '../app/modele.mjs'
import { $t, afficherDiag } from '../app/util.mjs'

export default ({
  name: 'MotsCles',

  props: { duGroupe: Number, lecture: Boolean, titre: String }, // duGroupe = 0, édite les mots clés du compte

  components: { BoutonHelp, ChoixEmoji },

  computed: {
  },

  data () {
    return {
      ajouter: false,
      emoji: false,
      inp: null,
      idx: 0,
      nom: '',
      categ: ''
    }
  },

  methods: {
    ouvriremoji () {
      this.inp = this.root.querySelector('#ta').querySelector('input')
      MD.oD('choixEmoji')
    },
    startEdit () {
      this.motscles.debutEdition()
    },
    cancelEdit () {
      this.$emit('ok', false)
    },
    ajoutermc () {
      this.idx = 0
      this.categ = ''
      this.nom = ''
      this.ajouter = true
    },
    edit (categ, nom, idx) {
      this.idx = parseInt(idx)
      this.categ = categ
      this.nom = nom
      this.ajouter = true
    },
    ok () {
      const nc = (this.categ || this.obs) + '/' + this.nom
      const err = this.motscles.changerMC(this.idx, nc)
      if (err) {
        afficherDiag(err)
      } else {
        this.ajouter = false
        this.setTab(this.categ)
      }
    },
    undo () {
      this.idx = 0
      this.categ = ''
      this.nom = ''
      this.ajouter = false
    },
    suppr (categ, idx) {
      if (categ !== this.obs) { afficherDiag($t('MCer1')); return }
      const err = this.motscles.changerMC(parseInt(idx)) // suppression du mot clé idx
      if (err) afficherDiag(err)
      else this.setTab(categ)
    },
    setTab (categ) {
      if (this.motscles.mc.categs.has(categ)) {
        this.tab = categ
      } else {
        const l = this.motscles.mc.lcategs
        if (l.length) this.tab = this.motscles.mc.lcategs[0]
      }
    },
    emojiClose () {
      this.nom = this.inp.value
    },
    okEdit () {
      const mmc = this.motscles.finEdition()
      this.$emit('ok', mmc)
    }
  },

  setup (props) {
    const session = stores.session
    const duGroupe = toRef(props, 'duGroupe')
    const ui = stores.ui

    const mc = reactive({ categs: new Map(), lcategs: [], st: { enedition: false, modifie: false } })
    const motscles = new Motscles(mc, true, duGroupe.value ? false : true, duGroupe.value || 0)

    const root = ref(null)
    const tab = ref('')
    const l = motscles.mc.lcategs
    if (l.length) tab.value = motscles.mc.lcategs[0]
    /*
    watch(() => motscles.value, (ap, av) => {
      tab.value = motscles.value.mc.lcategs[0]
    })
    */
    return {
      obs: $t('obs'),
      motscles,
      session,
      ui,
      root,
      tab,
      splitterModel: ref(33) // start at 33%
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.nom
  font-size: 1rem
  padding-right: 1rem
.inp
  width: 80%
  max-width: 20rem
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.q-btn
  padding: 0 !important
.border1
  border-radius: 5px
  border: 1px solid $grey-5
</style>
