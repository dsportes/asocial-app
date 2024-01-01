<template>
<div class="border q-pa-xs relative-position">
  <div class="absolute-top-right row">
    <bouton-help page="page1"/>
    <q-btn v-if="editable" :disable="!modif" class="self-start"
      size="md" dense padding="none" round color="primary" icon="undo"
      @click="undo"/>
    <q-btn v-if="editable && ok" :disable="!modif" class="self-start"
      size="md" dense color="warning" padding="none" round icon="check"
      @click="okmc()"/>
  </div>
  <div class="q-pa-xs row justify-start">
    <div v-if="courante.length">
      <div v-for="idx in courante" :key="idx" 
        class="radius q-ma-xs q-px-xs bg-yellow text-black cursor-pointer fs-md font-mono">
        <span :class="sty(idx)" @click="seldesel(idx)">{{ed(idx)}}</span>
      </div>
    </div>
    <div v-else class="text-italic fs-md">{{$t('MCaucun')}}</div>
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
</div>
</template>

<script>
import { toRef, ref, watch, reactive } from 'vue'
import stores from '../stores/stores.mjs'
import { styp, egaliteU8, select, deselect, cloneU8, $t, afficherDiag } from '../app/util.mjs'
import { Motscles } from '../app/modele.mjs'
import BoutonHelp from './BoutonHelp.vue'

export default ({
  name: 'ChoixMotscles',

  emits: ['update:modelValue'],

  props: {
    modelValue: Object,
    duCompte: Boolean, 
    duGroupe: Number, 
    initValue: Object, // OBLIGATOIRE - voire new Uin8Array([])
    titre: String,
    help: String,
    editable: Boolean,
    ok: Function
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
    okmc () {
      if (this.editable && !this.diag && this.ok) 
        this.ok(this.courante)
    },
    undo () {
      this.courante = cloneU8(this.initValue)
    },
    seldesel (n) {
      if (!this.editable || this.diag) return
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
    const session = stores.session
    const ui = stores.ui
    const duCompte = toRef(props, 'duCompte')
    const duGroupe = toRef(props, 'duGroupe')

    const diag = ref(session.editDiag)

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
      styp, ui, session, diag,
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
.btntop
  position: absolute
  top: 0
  right: 0
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
  border:1px solid $grey-5
.barre
  text-decoration: line-through
</style>
