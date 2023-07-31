<template>
  <div :class="'q-pa-xs full-width ' + dkli()">
    <q-checkbox v-model="val" class="cb" :label="$t('FIavecgr')" />
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef } from 'vue'
import { dkli } from '../app/util.mjs'

export default ({
  name: 'FiltreAvecgr',

  props: { nom: String, idx: Number },

  data () {
    return { 
    }
  },

  watch: {
    val (ap) {
      this.st.setFiltre(this.nom, 'avecgr', ap === true ? true : false)
    }
  },

  computed: {
  },

  setup (props) {
    const st = stores.filtre
    const val = ref('')
    const nom = toRef(props, 'nom')
    const x = st.filtre[nom.value]
    val.value = x && x.avecgr ? x.avecgr : false
    return {
      st, dkli,
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
