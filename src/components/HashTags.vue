<template>
<q-card>
  <q-toolbar class="bg-secondary text-white">
    <btn-cond color="warning" icon="undo" @ok="$emit('ko')"/>
    <q-toolbar-title class="titre-md full-width text-center">{{$t('HTtit')}}</q-toolbar-title>
    <bouton-help page="page1"/>
    <bouton-bulle idtext="hashtags"/>
    <btn-cond v-if="okbtn" icon="check" :disable="!chg" @ok="$emit('ok',sr)"/>
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
import { styp } from '../app/util.mjs'

const min = 2
const max = 12
const reg = /^([a-z0-9]{2,12})$/

export default ({
  name: 'HashTags',

  props: { 
    src: Object, // set d'origine, le set resultat est v-model
    okbtn: Boolean // true s'il faut afficher le bouton ok
  },

  components: { BoutonBulle, BoutonHelp, BtnCond },

  emits: ['update:modelValue', 'ok', 'ko'],

  computed: {
    lr () { return Array.from(this.sr).sort()},
    lc () { return Array.from(this.sc).sort()},
    chg () { return Array.from(this.src).sort().join(' ') !== this.lr.join(' ') }
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
        if (!this.sr.has(this.sel)) {
          this.sr.add(this.sel)
          this.sel = ''
          this.$emit('update:modelValue', this.sr)
        }
      }
    },

    cllr (t) {
      this.sr.delete(t)
      if (!this.sc.has(t)) this.sc.add(t)
      if (!this.session.defHT.has(t) && !this.sb.has(t)) {
        this.sb.add(t)
        this.session.setHT(new Set([t]))
      }
      this.$emit('update:modelValue', this.sr)
    },

    cllc (t) {
      this.sc.delete(t)
      if (!this.sr.has(t)) {
        this.sr.add(t)
        this.$emit('update:modelValue', this.sr)
      }
    }
  },

  setup (props) {
    const session = stores.session
    const ui = stores.ui
    const sb = ref(null)
    const sc = ref(null)
    const sel = ref('')
    const src = toRef(props, 'src')
    const sr = ref(new Set())
    src.value.forEach(t => { sr.value.add(t)})

    function filtre () {
      const s = new Set()
      sb.value.forEach(v => { 
        if ((!sel.value || v.indexOf(sel.value) !== -1) && !sr.value.has(v)) s.add(v)
      })
      sc.value = s
    }

    const x = new Set()
    session.defHT.forEach(t => { x.add(t) })
    session.hashtags.forEach(t => { x.add(t) })
    sb.value = x

    filtre()

    return {
      styp, filtre,
      sr, sb, sc, sel,
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
