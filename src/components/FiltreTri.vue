<template>
  <div class="full-width">
    <q-select v-model="val" dense options-dense :options="options" :label="$t('FItri')" />
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef } from 'vue'
import { $t } from '../app/util.mjs'

export default ({
  name: 'FiltreTri',

  props: { nom: String, nbOptions: Number },

  data () {
    return {
    }
  },

  watch: {
    val (ap) {
      this.st.setTri(this.nom, ap)
    }
  },

  setup (props) {
    const st = stores.filtre
    const val = ref('')
    const nom = toRef(props, 'nom')
    const nbOptions = toRef(props, 'nbOptions')
    const x = st.tri[nom.value]
    const options = []
    for(let i = 0; i < nbOptions.value; i++){
      options.push({ value: i, label: $t('TRI' + nom.value + i)})
    }
    val.value = options[x || 0]
    return {
      st,
      val,
      options
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
