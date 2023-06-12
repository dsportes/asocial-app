<template>
<q-card class="bs petitelargeur">
  <q-toolbar class="bg-secondary text-white">
    <q-btn v-if="close" class="q-mr-xs" size="md" dense color="warning" 
      icon="close" @click="fermer"/>
    <q-toolbar-title class="titre-lg text-center">{{titre || $t('CMCtit')}}</q-toolbar-title>
    <bouton-help :page="help || 'page1'" />
    <q-btn v-if="okLabel && editable" class="q-ml-xs" size="md" dense color="warning" 
      icon="check" :label="okLabel" @click="ok"/>
    <q-btn v-if="editable" :disable="!modif" class="q-ml-xs" size="md"
      dense flat icon="undo" @click="undo"/>
  </q-toolbar>

  <div class="q-pa-xs row justify-start">
    <div v-for="idx in courante" :key="idx" 
      class="radius q-ma-xs q-px-xs bg-yellow text-black cursor-pointer fs-md font-mono">
      <span :class="sty(idx)" @click="seldesel(idx)">{{ed(idx)}}</span>
    </div>
  </div>
  <div class="q-pa-xs row justify-start">
    <div v-for="idx in initValue" :key="idx">
      <span v-if="!selecte(idx)" 
        :class="sty(idx) + ' radius q-ma-xs q-px-xs cursor-pointer fs-md font-mono border barre'" 
        @click="seldesel(idx)">{{ed(idx)}}</span>
    </div>
  </div>
  <q-splitter v-model="splitterModel" class="full-width">
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
import { egaliteU8, select, deselect, cloneU8, $t, afficherDiag } from '../app/util.mjs'
import { Motscles } from '../app/modele.mjs'

export default ({
  name: 'ChoixMotscles',

  emits: ['update:modelValue', 'ok', 'close'],

  props: {
    modelValue: Object,
    duCompte: Boolean, 
    duGroupe: Number, 
    initValue: Object, // OBLIGATOIRE - voire new Uin8Array([])
    titre: String,
    help: String,
    close: Boolean,
    editable: Boolean,
    okLabel: String
  },

  components: { BoutonHelp },

  computed: {
    modif () { return !egaliteU8(this.courante, this.initValue) }
  },

  data () { return {
  }},

  methods: {
    sty (idx) {
      if (idx < 100) return ''
      return idx <= 199 ? 'text-italic' : 'text-bold'
    },
    selecte (idx) {
      if (!this.courante) return false
      return this.courante.find((e) => e === idx)
    },
    aMC (idx) {
      return this.motscles.aMC(idx)
    },
    ed (idx) {
      const x = this.motscles.getMC(idx)
      const t = !x ? '' : x.c + '@' + x.n
      return t
    },
    fermer () {
      this.$emit('close', true)
    },
    ok () {
      this.$emit('ok', this.courante)
    },
    undo () {
      this.courante = cloneU8(this.initValue)
    },
    seldesel (n) {
      if (!this.editable) return
      const idx = parseInt(n)
      if (this.selecte(idx)) {
        this.courante = deselect(this.courante, idx)
      } else {
        const x = this.motscles.getMC(idx)
        if (x && x.c === $t('obs')) {
          afficherDiag($t('MCer5'))
        } else this.courante = select(this.courante, idx)
      }
    }
  },

  setup (props, context) {
    const duCompte = toRef(props, 'duCompte')
    const duGroupe = toRef(props, 'duGroupe')

    // Objet motscles en sélection : immutable
    const mc = reactive({ categs: new Map(), lcategs: [], st: { enedition: false, modifie: false } })
    const motscles = new Motscles(mc, false, duCompte.value || false, duGroupe.value || 0)

    const tab = ref('')
    tab.value = motscles.mc.lcategs[0]

    const initValue = toRef(props, 'initValue')
    const courante = ref(initValue.value)

    // La source peut changer pendant que le dialogue de sélection est en cours. */
    watch(initValue, (ap, av) => {
      if (egaliteU8(courante.value, av)) {
        /* la valeur courante n'était pas modifiée, on l'aligne sur la nouvelle valeur initiale*/
        courante.value = cloneU8(ap)
      }
    })

    watch(courante, (ap, av) => {
      context.emit('update:modelValue', courante.value)
    })

    const nn = ref(2)

    return {
      courante,
      motscles,
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
.barre
  text-decoration: line-through
.q-toolbar
  padding: 2px !important
  min-height: 0 !important
</style>
