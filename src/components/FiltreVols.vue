<template>
  <div :class="'q-pa-xs full-width ' + dkli">
    <q-select v-model="val" dense options-dense :options="options" 
      :label="$t('FI' + attr)" />
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef } from 'vue'
import { edvol, $t } from '../app/util.mjs'

export default ({
  name: 'FiltreVols',

  props: { nom: String, attr: String, idx: Number },

  data () {
    return { 
    }
  },

  watch: {
    val (ap) {
      this.st.setFiltre(this.nom, this.attr, ap.value || 0)
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
    const attr = toRef(props, 'attr')

    const vols = {
      v1: [50, 4000],
      v2: [1000000, 10000000, 100000000, 1000000000]
    }
    const options = ref([])
    options.value.push({ value: 0, label: $t('nolimite')})
    for(const v of vols[attr.value]) 
      options.value.push({ value: v, label: '> ' + edvol(v)})

    const vi = x && x[attr.value] ? x[attr.value] : 0
    options.value.forEach(t => { if (t.value === vi) val.value = t})

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
