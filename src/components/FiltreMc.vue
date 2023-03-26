<template>
  <div :class="'q-mb-sm full-width ' + dkli">
    <div class="q-mt-sm titre-md">{{$t('FI' + attr)}}</div>
    <apercu-motscles @ok="ok" :idx="0" du-compte :du-groupe="groupeId"
      :mapmc="mapmc" edit :src="src"/>
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef } from 'vue'
import ApercuMotscles from './ApercuMotscles.vue'

export default ({
  name: 'FiltreMc',

  props: { nom: String, attr: String, idx: Number },

  components : { ApercuMotscles },

  data () {
    return { }
  },

  computed: {
    dkli () { return this.$q.dark.isActive ? (this.idx ? 'sombre' + (this.idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') }
  },

  methods: {
    ok (mc) {
      this.src = mc
      this.st.setFiltre(this.nom, this.attr, mc)
    }
  },

  setup (props) {
    const st = stores.filtre
    const u0 = new Uint8Array([])
    const src = ref()
    const nom = toRef(props, 'nom')
    const attr = toRef(props, 'attr')
    const x = st.filtre[nom.value]
    src.value = x && x[attr.value] ? x[attr.value] : u0
    
    const groupeId = ref(0)
    const mapmc = ref(null)

    const ctx = st.contexte[nom.value]
    groupeId.value = ctx.groupeId || 0
    mapmc.value = ctx.mapmc

    return {
      st,
      src,
      groupeId,
      mapmc
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
