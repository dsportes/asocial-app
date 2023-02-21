<template>
<q-card class="petitelargeur shadow-8">
  <q-toolbar class="bg-secondary text-white">
    <q-toolbar-title class="titre-lg">{{titre}}</q-toolbar-title>
    <bouton-help page="page1" />
    <q-btn class="q-ml-xs" size="md" :disable="!modif" dense color="warning" icon="check" label="OK" @click="ok"/>
    <q-btn :disable="!modif" class="q-ml-xs" size="md" dense flat icon="undo" @click="undo"/>
    <q-btn :disable="modif" class="q-ml-xs" size="md" dense flat icon="close" @click="close"/>
  </q-toolbar>

  <div class="q-pa-md col row justify-start">
    <div v-for="idx in srclocal" :key="idx" class="radius q-ma-xs q-px-xs bg-yellow text-black cursor-pointer">
      <span v-if="aMC(idx)" @click="seldesel(idx)">{{ed(idx)}}</span>
    </div>
  </div>
  <q-splitter v-model="splitterModel" class="col" style="width:100%">
    <template v-slot:before>
      <q-tabs v-model="tab" no-caps vertical >
        <q-tab v-for="categ in motscles.mc.lcategs" :key="categ" :name="categ" :label="categ" />
      </q-tabs>
    </template>
    <template v-slot:after>
      <q-tab-panels v-model="tab" animated swipeable vertical transition-prev="jump-up" transition-next="jump-up" >
        <q-tab-panel v-for="categ in motscles.mc.lcategs" :key="categ" :name="categ">
          <div v-for="item in motscles.mc.categs.get(categ)" :key="item[1]"
            style="width:100%"
            :class="'radius q-ma-xs q-px-xs nom cursor-pointer ' + (selecte(item[1]) ? 'bg-yellow text-black' : '')"
            @click="seldesel(item[1])">
            <span>{{item[0]}}</span>
            <span class="idx font-mono">[{{item[1]}}]</span>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </template>
  </q-splitter>
</q-card>
</template>
<script>
import { toRef, ref, watch, reactive } from 'vue'
import BoutonHelp from './BoutonHelp.vue'
import { equ8, select, deselect, afficherdiagnostic } from '../app/util.mjs'
import { Motscles } from '../app/modele.mjs.mjs'

export default ({
  name: 'ChoixMotscles',

  props: { duCompte: Boolean, duGroupe: Number, src: Object, titre: String },

  components: { BoutonHelp },

  computed: {
    modif () { return !this.equ8(this.srclocal, this.srcinp) }
  },

  data () { return {
  }},

  methods: {
    selecte (idx) {
      if (!this.srclocal) return false
      return this.srclocal.find((e) => e === idx)
    },
    aMC (idx) {
      return this.motscles.aMC(idx)
    },
    ed (idx) {
      const x = this.motscles.getMC(idx)
      return !x ? '' : x.c + '@' + x.n
    },
    close () {
      this.$emit('ok', false)
    },
    ok () {
      this.$emit('ok', this.srclocal)
    },
    undo () {
      this.srclocal = this.srcinp
    },
    seldesel (idx) {
      if (this.selecte(idx)) {
        this.srclocal = deselect(this.srclocal, idx)
      } else {
        const x = this.motscles.getMC(idx)
        if (x && x.c === $t('obsolete')) {
          this.session.afficherDiag($t('MCer5'))
        } else this.srclocal = select(this.srclocal, idx)
      }
    }
  },

  setup (props) {
    const duCompte = toRef(props, 'duCompte')
    const duGroupe = toRef(props, 'duGroupe')

    // Objet motscles en sélection : immutable
    const mc = reactive({ categs: new Map(), lcategs: [], st: { enedition: false, modifie: false } })
    const motscles = new Motscles(mc, false, duCompte.value || false, duGroupe.value || 0)

    const src = toRef(props, 'src')
    const local = reactive({ inp: null, src: null })
    const srclocal = toRef(local, 'src')
    const srcinp = toRef(local, 'inp')

    const tab = ref('')
    tab.value = motscles.value.mc.lcategs[0]
    srcinp.value = src.value || new Uint8Array([])
    srclocal.value = src.value || new Uint8Array([])

    // Discutable : la source peut changer pendant que le dialogue de sélection est en cours. Pourquoi pas */
    watch( () => src.value, (ap, av) => {
      if (equ8(srclocal.value, srcinp.value) && !equ8(srclocal.value, ap)) {
        // srclocal n'était PAS modifié, ni égal à la nouvelle valeur : alignement sur la nouvelle valeur
        srclocal.value = ap
      }
      srcinp.value = ap
    })

    return {
      srcinp,
      srclocal,
      equ8,
      tab,
      splitterModel: ref(33) // start at 33%
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.idx
  font-size: 0.7rem
.nom
  font-size: 1rem
  padding-right: 1rem
.inp
  width: 80%
  max-width: 20rem
.radius
  border-radius: 3px
.border
  border:1px solid grey
.q-toolbar
  padding: 2px !important
  min-height: 0 !important
</style>
