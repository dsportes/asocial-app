<template>
  <div :class="'q-pa-xs full-width ' + dkli">
    <q-select v-model="val" dense options-dense :options="options" :label="$t('FIjours')" />
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef } from 'vue'

export default ({
  name: 'FiltreNbj',

  props: { nom: String, idx: Number },

  data () {
    return { 
      options: [1, 7, 30, 90, 9999]
    }
  },

  watch: {
    val (ap) {
      this.st.setFiltre(this.nom, 'nbj', ap === 9999 ? 0 : ap)
    }
  },

  computed: {
    dkli () { return this.$q.dark.isActive ? (this.idx ? 'sombre' + (this.idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') }
  },

  setup (props) {
    const st = stores.filtre
    const val = ref('')
    const nom = toRef(props, 'nom')
    const x = st.filtre[nom.value]
    val.value = x && x.nbj ? x.nbj : 9999
    return {
      st,
      val
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
