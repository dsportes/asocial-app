<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <div>{{$t('FI' + attr)}}</div>
    <apercu-motscles @ok="ok" du-compte :du-groupe="groupeId"
      :mapmc="mapmc" edit :src="src" :idx="idx"/>
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

    st.$onAction(({ name, args, after }) => { 
      after(async (result) => {
        if ((name === 'setContexte')){
          if (args[0] === nom.value) {
            const arg = args[1]
            groupeId.value = arg.groupeId || 0
            mapmc.value = arg.mapmc
          }
        }
      })
    })


    return {
      st, dkli,
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
