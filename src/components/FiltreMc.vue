<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <div><btn-cond :label="$t('FI' + attr)" size="sm" @ok="ouvDial"/></div>
    <div class="row q-gutter-xs bord1">
      <span v-for="t in src" :key="t">{{t}}</span>
    </div>
    <q-dialog v-model="ui.d[idc].HTags" persistent>
      <hash-tags :src="src" v-model="ht" okbtn @ok="htok" @ko="ui.fD()"/>
    </q-dialog>
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef, onUnmounted } from 'vue'
import BtnCond from './BtnCond.vue'
import HashTags from './HashTags.vue'
import { dkli } from '../app/util.mjs'

export default ({
  name: 'FiltreMc',

  props: { nom: String, attr: String, idx: Number },

  components : { BtnCond, HashTags },

  data () {
    return {
      ht: ''
    }
  },

  computed: {
  },

  methods: {
    ouvDial () {
      this.ui.oD('HTags', this.idc)
    },
    htok (ht) {
      this.src = ht
      this.st.setFiltre(this.nom, this.attr, ht)
      this.ui.fD()
    }
  },

  setup (props) {
    const ui = stores.ui
    const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
    const st = stores.filtre
    const s0 = new Set()
    const src = ref()
    const nom = toRef(props, 'nom')
    const attr = toRef(props, 'attr')
    const x = st.filtre[nom.value]
    src.value = x && x[attr.value] ? x[attr.value] : s0

    return {
      st, ui, idc, dkli, src
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  margin-top: 5px
  border: 1px solid $grey-5
  padding: 2px
  border-radius: 5px
  min-height: 1.8rem
</style>
