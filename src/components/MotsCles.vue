<template>
<q-card class="colomn shadow-8">
  <q-toolbar class="bg-secondary text-white q-gutter-xs">
    <q-btn v-if="!motscles.mc.st.enedition" dense size="md" color="primary" icon="mode_edit" label="Editer" @click="startEdit"/>
    <q-btn v-if="motscles.mc.st.enedition" dense size="md" color="primary" icon="add_circle" label="Nouveau" @click="ajoutermc"/>
    <q-btn v-if="motscles.mc.st.enedition" dense size="md" color="primary" icon="undo" label="Annuler" @click="cancelEdit"/>
    <q-btn v-if="motscles.mc.st.enedition" :disable="!motscles.mc.st.modifie" dense size="md" icon="check" color="warning" label="Valider" @click="okEdit"/>
    <q-space/>
    <bouton-help page="page1"/>
  </q-toolbar>
  <div ref="root">
    <div v-if="ajouter" class="column border1 q-ma-xs q-pa-sm full-width">
      <div class="row justify-start q-gutter-xs">
        <q-btn size="sm" icon="close" dense color="primary" label="Renoncer" @click="undo"></q-btn>
        <q-btn class="q-ml-md" size="sm" icon="check" dense color="warning" label="OK" @click="ok"></q-btn>
      </div>
      <q-input class="inp" v-model="categ" label="Catégorie" counter placeholder="Par exemple: Sections">
        <template v-slot:hint>3 à 12 lettres, première majuscule. Vide pour 'obsolète'</template>
      </q-input>
      <div id="ta">
        <q-input class="inp" v-model="nom" label="Nom" counter maxlength="12" placeholder="Par exemple: Ecologie">
          <template v-slot:hint>3 à 12 lettres, émoji conseillé en tête</template>
          <template v-slot:append>
            <q-btn label="❤️" size="md" dense @click="ui.choixEmoji=true"/>
          </template>
        </q-input>
      </div>
    </div>
  </div>
  <q-splitter v-model="splitterModel" class="col full-width">
    <template v-slot:before>
      <q-tabs v-model="tab" no-caps vertical >
        <q-tab v-for="categ in motscles.mc.lcategs" :key="categ" :name="categ" :label="categ" />
      </q-tabs>
    </template>
    <template v-slot:after>
      <q-tab-panels v-model="tab" animated swipeable vertical transition-prev="jump-up" transition-next="jump-up" >
        <q-tab-panel v-for="categ in motscles.mc.lcategs" :key="categ" :name="categ">
          <div v-for="item in motscles.mc.categs.get(categ)" :key="item[1]+item[0]">
            <span class="fs-md">{{item[0]}}</span><span class="fs-sm font-mono q-px-xs">[{{item[1]}}]</span>
            <span v-if="motscles.mc.st.enedition && item[1] < 200">
              <q-btn icon="mode_edit" size="sm" color="primary" dense @click="edit(categ, item[0], item[1])"></q-btn>
              <q-btn class="q-ml-sm" v-if="categ === 'obsolète'" icon="close" color="warning" size="sm" dense @click="suppr(categ, item[0], item[1])"></q-btn>
            </span>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </q-splitter>

  <choix-emoji v-if="ui.choixEmoji" :inp="inp" :close="emojiClose"/>

</q-card>
</template>
<script>
import { ref, toRef, watch } from 'vue'
import stores from '../stores/stores.mjs'
import ChoixEmoji from './ChoixEmoji.vue'
import BoutonHelp from './BoutonHelp.vue'

export default ({
  name: 'MotsCles',

  props: { motscles: Object, lecture: Boolean },

  components: { BoutonHelp, ChoixEmoji },

  computed: {
    inp () { return this.root.querySelector('#ta').querySelector('input') }
  },

  data () {
    return {
      ajouter: false,
      emoji: false,
      idx: 0,
      nom: '',
      categ: ''
    }
  },

  methods: {
    startEdit () {
      this.motscles.debutEdition()
    },
    cancelEdit () {
      this.motscles.finEdition()
    },
    ajoutermc () {
      this.idx = 0
      this.categ = ''
      this.nom = ''
      this.ajouter = true
    },
    edit (categ, nom, idx) {
      this.idx = idx
      this.categ = categ
      this.nom = nom
      this.ajouter = true
    },
    ok () {
      const nc = (this.categ ? this.categ + '/' : '') + this.nom
      const err = this.motscles.changerMC(this.idx, nc)
      if (err) {
        this.session.afficherDiag(err)
      } else {
        this.ajouter = false
        this.tab = this.categ ? this.categ : 'obsolète'
      }
    },
    undo () {
      this.idx = 0
      this.categ = ''
      this.nom = ''
      this.ajouter = false
    },
    suppr (categ, nom, idx) {
      if (categ !== 'obsolète') {
        this.session.afficherDiag('Seuls les mots clés obsolètes peuvent être supprimés')
        return
      }
      const err = this.motscles.changerMC(this.idx)
      if (err) {
        this.session.afficherDiag(err)
      } else {
        if (this.motscles.mc.categs.has(categ)) {
          this.tab = categ
        } else {
          this.tab = this.motscles.mc.lcategs[0]
        }
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
    const ui = stores.ui

    const motscles = toRef(props, 'motscles')
    motscles.value.recharger()
    session.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setPrefs') {
          motscles.value.recharger()
        }
      })
    })

    const root = ref(null)
    const tab = ref('')
 
    tab.value = motscles.value.mc.lcategs[0]

    watch(() => motscles.value, (ap, av) => {
      tab.value = motscles.value.mc.lcategs[0]
    })

    return {
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
  padding: 2px !important
  min-height: 0 !important
.border1
  border-radius: 5px
  border: 1px solid $grey-5
</style>
