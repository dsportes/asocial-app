<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <div>{{$t('FI' + attr)}}</div>
    <apercu-motscles :ok="ok" 
      :du-groupe="st.mcgroupe" 
      edit 
      :src="src" 
      :idx="idx"/>
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef } from 'vue'
import ApercuMotscles from './ApercuMotscles.vue'
import { dkli } from '../app/util.mjs'

export default ({
  name: 'FiltreMc',

  props: { nom: String, attr: String, idx: Number },

  components : { ApercuMotscles },

  data () {
    return { }
  },

  computed: {
  },

  methods: {
    ok (mc) {
      this.src = mc
      this.st.setFiltre(this.nom, this.attr, mc)
    }
  },

  setup (props) {
    const aSt = stores.avatar
    const st = stores.filtre
    const u0 = new Uint8Array([])
    const src = ref()
    const nom = toRef(props, 'nom')
    const attr = toRef(props, 'attr')
    const x = st.filtre[nom.value]
    src.value = x && x[attr.value] ? x[attr.value] : u0

    return {
      st, aSt, dkli, src
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
