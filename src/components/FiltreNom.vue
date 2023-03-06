<template>
  <div>
    <q-input dense counter v-model="val"
      :label="$t('FI' + prop)"
      @keydown.enter.prevent="ok" type="text" :hint="$t('entree')">
      <template v-slot:append>
        <span :class="val.length === 0 ? 'disabled' : ''"><q-icon name="cancel" class="cursor-pointer"  @click="val=''"/></span>
      </template>
    </q-input>
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef } from 'vue'

export default ({
  name: 'FiltreNom',

  props: { nom: String, prop: String },

  data () {
    return { }
  },

  methods: {
    ok () {
      this.st.setFiltre(this.nom, this.prop, this.val)
    }
  },

  setup (props) {
    const st = stores.filtre
    const val = ref('')
    const nom = toRef(props, 'nom')
    const prop = toRef(props, 'prop')
    const x = st.filtre[nom.value]
    val.value = x && x[prop.value] ? x[prop.value] : ''
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
