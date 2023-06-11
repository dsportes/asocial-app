<template>
<q-card class="bs petitelargeur">
  <q-toolbar class="bg-secondary text-white">
    <!--q-btn class="q-mr-xs" size="md" dense color="warning" icon="close" @click="close"/-->
    <q-toolbar-title class="titre-lg text-center">{{titre}}</q-toolbar-title>
    <bouton-help page="page1" />
    <q-btn class="q-ml-xs" size="md" :disable="!modif" dense color="warning" icon="check" label="OK" @click="ok"/>
    <q-btn :disable="!modif" class="q-ml-xs" size="md" dense flat icon="undo" @click="undo"/>
  </q-toolbar>

  <div class="q-pa-md row justify-start">
    <div v-for="idx in srclocal" :key="idx" 
      class="radius q-ma-xs q-px-xs bg-yellow text-black cursor-pointer fs-md font-mono">
      <span :class="sty(idx)" @click="seldesel(idx)">{{ed(idx)}}</span>
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

  props: { duCompte: Boolean, duGroupe: Number, src: Object, titre: String, arg: Object },

  components: { BoutonHelp },

  computed: {
    modif () { return !egaliteU8(this.srclocal, this.srcinp) }
  },

  data () { return {
  }},

  methods: {
    sty (idx) {
      if (idx < 100) return ''
      return idx <= 199 ? 'text-italic' : 'text-bold'
    },
    selecte (idx) {
      if (!this.srclocal) return false
      return this.srclocal.find((e) => e === idx)
    },
    aMC (idx) {
      return this.motscles.aMC(idx)
    },
    ed (idx) {
      const x = this.motscles.getMC(idx)
      const t = !x ? '' : x.c + '@' + x.n
      return t
    },
    close () {
      if (this.arg)
        this.$emit('ok', { ok: false, arg: this.arg})
      else
        this.$emit('ok', false)
    },
    ok () {
      if (this.arg)
        this.$emit('ok', { ok: true, mc: this.srclocal, arg: this.arg})
      else
        this.$emit('ok', this.srclocal)
    },
    undo () {
      this.srclocal = cloneU8(this.srcinp)
      this.close()
    },
    seldesel (n) {
      const idx = parseInt(n)
      if (this.selecte(idx)) {
        this.srclocal = deselect(this.srclocal, idx)
      } else {
        const x = this.motscles.getMC(idx)
        if (x && x.c === $t('obs')) {
          afficherDiag($t('MCer5'))
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
    tab.value = motscles.mc.lcategs[0]
    srcinp.value = src.value ? cloneU8(src.value) : new Uint8Array([])
    srclocal.value = cloneU8(srcinp.value)

    // Discutable : la source peut changer pendant que le dialogue de sélection est en cours. Pourquoi pas */
    watch( () => src.value, (ap, av) => {
      if (egaliteU8(srclocal.value, srcinp.value) && !egaliteU8(srclocal.value, ap)) {
        // srclocal n'était PAS modifié, ni égal à la nouvelle valeur : alignement sur la nouvelle valeur
        srclocal.value = cloneU8(ap)
      }
      srcinp.value = cloneU8(ap)
    })

    return {
      motscles,
      srcinp,
      srclocal,
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
