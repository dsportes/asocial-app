<template>
  <div :class="'q-mb-sm full-width ' + dkli">
    <q-checkbox v-model="val" class="cb" :label="$t('FIavecbl')" />
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef } from 'vue'

export default ({
  name: 'FiltreAvecbl',

  props: { nom: String, idx: Number },

  data () {
    return { 
    }
  },

  watch: {
    val (ap) {
      this.st.setFiltre(this.nom, 'avecbl', ap === true ? true : false)
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
    val.value = x && x.avecbl ? x.avecbl : false
    return {
      st,
      val
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.cb
  position: relative
  left: -10px
</style>
