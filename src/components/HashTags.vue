<template>
<q-card>
  <q-toolbar class="bg-secondary text-white">
    <btn-cond color="warning" icon="undo" @ok="$emit('ko')"/>
    <q-toolbar-title class="titre-md full-width text-center">{{$t('HTtit')}}</q-toolbar-title>
    <bouton-help page="page1"/>
    <bouton-bulle idtext="hashtags"/>
    <btn-cond icon="check" :disable="src===res" @ok="$emit('ok',res)"/>
  </q-toolbar>

  <div class="q-mb-md">
    <q-input dense counter v-model="sel" class="q-mt-sm q-ml-sm" style="width:20rem"
      :label="$t('HTfil')"
      :rules="[r1,r2]"
      @keydown.enter.prevent="val"
      type="text" 
      :hint="$t('HThint')">
      <template v-slot:append>
        <span :class="sel.length === 0 ? 'disabled' : ''">
          <q-icon name="cancel" class="cursor-pointer"  @click="sel=''"/>
        </span>
      </template>
    </q-input>
    <div class="q-mt-md row font-mono fs-md justify-between">
      <q-scroll-area class="bord1" style="height:25vh; width:45%">
        <div v-for="(t, i) in lr" :key="t" class="text-center cursor-pointer" 
        @click="cllr(t, i)">{{t}}</div>
      </q-scroll-area>
      <q-scroll-area class="col-5 bord2" style="height:25vh; width:45%">
        <div v-for="(t, i) in lc" :key="t" class="text-center cursor-pointer"
         @click="cllc(t, i)">{{t}}</div>
      </q-scroll-area>
    </div>
  </div>

</q-card>
</template>
<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import BtnCond from './BtnCond.vue'
import BoutonHelp from './BoutonHelp.vue'
import BoutonBulle from './BoutonBulle.vue'
import { styp, $t } from '../app/util.mjs'

const min = 2
const max = 12
const reg = /^([a-z0-9]{2,12})$/

export default ({
  name: 'HashTags',

  props: { 
    src: String, // liste d'origine, la liste resultat est v-model
    okbtn: Boolean // true s'il faut afficher le bouton ok
  },
  components: { BoutonBulle, BoutonHelp, BtnCond },

  emits: ['update:modelValue', 'ok', 'ko'],

  computed: {
    res () { return this.lr.join(' ')}
  },

  watch: {
    sel () { this.filtre() }
  },

  data () {
    return {
    }
  },

  methods: {
    r2 (val) { return val.length < min || val.length > max ? this.$t('HTe1', [min, max]) : true},
    r1 (val) { return !reg.test(val) ? this.$t('HTe2') : true},

    val () {
      if (this.r1(this.sel) && this.r2(this.sel)) {
        if (this.lr.indexOf(this.sel) === -1) {
          this.lr.push(this.sel)
          this.tri(this.lr)
          this.sel = ''
          this.$emit('update:modelValue', this.res)
        }
      }
    },

    cllr (t, i) {
      this.lr.splice(i, 1)
      if (this.lc.indexOf(t) === -1) {
        this.lc.push(t)
        this.tri(this.lc)
        this.$emit('update:modelValue', this.res)
      }
      if (this.defht.indexOf(t) !== -1) return
      if (this.lb.indexOf(t) === -1) {
        this.lb.push(t)
        this.session.hashtags.add(t)
      }
    },

    cllc (t, i) {
      this.lc.splice(i, 1)
      if (this.lr.indexOf(t) === -1) {
        this.lr.push(t)
        this.tri(this.lr)
        this.$emit('update:modelValue', this.res)
      }
    }
  },

  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const lr = ref([])
    const lb = ref([])
    const lc = ref(null)
    const sel = ref('')
    const src = toRef(props, 'src')
    const defht = ref(null)

    lr.value = src.value ? src.value.split(' ') : []

    function filtre () {
      const t = []
      lb.value.forEach(v => { if (!sel.value || v.indexOf(sel.value) !== -1) t.push(v)})
      lc.value = t
    }

    function tri (l) { l.sort((a, b) => { return a < b ? -1 : (a > b ? 1 : 0)}); return l }

    function initlb () {
      const x = []
      const def = $t('defhashtags')
      defht.value = def ? def.split(' ') : []
      defht.value.forEach(t => { x.push(t)})
      session.hashtags.forEach(ht => { x.push(ht) })
      lb.value = tri(x)
      filtre()
    }

    initlb()

    tri(lr.value)

    return {
      styp, initlb, filtre, tri,
      lr, lb, lc, sel, defht,
      session, ui
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border-radius: 5px
  border: 1px solid $secondary
.bord2
  border-radius: 5px
  border: 1px solid $primary
</style>
