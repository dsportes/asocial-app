<template>
<div>
  <q-input dense v-model="phrase" :label="$t('NPphl')" counter :rules="[r1]" maxlength="32"
    @keydown.enter.prevent="crypterphrase" :type="isPwd ? 'password' : 'text'"
    :hint="!phrase || !r1(phrase) ? $t('NP16') : $t('NPpe')">
    <template v-slot:append>
      <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
      <q-btn icon="cancel" size="md" :disable="phrase.length === 0" @click="phrase = ''"/>
      <q-spinner v-if="encours" color="primary" size="1.5rem" :thickness="8" />
    </template>
  </q-input>
</div>
</template>
<script>

import { ref, toRef } from 'vue'
import { Phrase } from '../app/modele.mjs'

export default ({
  name: 'PhraseContact',
  props: { initVal: String },
  data () {
    return {
      isPwd: false,
      encours: false
    }
  },
  methods: {
    r1 (val) { return (val.length > 19 && val.length < 33) || this.$t('NP16') },

    crypterphrase () {
      if (!this.r1(this.phrase)) return
      this.encours = true
      this.pc = new Phrase()
      setTimeout(async () => {
        await this.pc.init(this.phrase)
        this.encours = false
        this.$emit('ok', this.pc)
      }, 1)
    }
  },

  setup (props) {
    const init = toRef(props, 'initVal')
    const phrase = ref(init.value || '')
    return {
      phrase
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/input.sass'
</style>
