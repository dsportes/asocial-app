<template>
  <div :class="'q-pa-xs full-width ' + dkli(idx)">
    <q-option-group v-model="val" dense :options="options" />
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef } from 'vue'
import { dkli, $t } from '../app/util.mjs'

export default ({
  name: 'FiltreRac',

  props: { nom: String, idx: Number },

  components: { },

  data () {
    return {
    }
  },

  watch: {
    val (ap) {
      this.st.setFiltre(this.nom, 'rac', ap)
    }
  },

  computed: {
  },

  setup (props) {
    const st = stores.filtre
    const val = ref('')
    const nom = toRef(props, 'nom')
    const options = [
      { label: $t('rac0'), value: 0 },
      { label: $t('rac1'), value: 1 }
    ]
    const x = st.filtre[nom.value]
    val.value = x.rac || 0
    return {
      st, dkli, options,
      val
    }
  }
})
</script>

<style lang="css">
.q-item { padding: 2px 5px !important; min-height: 0 !important; }
</style>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
