<template>
<div>
  <q-input dense v-model="phrase" :label="$t('NPphl')" counter :rules="[r1]" maxlength="32"
    @keydown.enter.prevent="crypterphrase" :type="isPwd ? 'password' : 'text'"
    :hint="$t('NPpe')">
    <template v-slot:append>
      <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
      <span :class="phrase.length === 0 ? 'disabled' : ''"><q-icon name="cancel" class="cursor-pointer"  @click="razphrase"/></span>
      <q-spinner v-if="encours" color="primary" size="1.5rem" :thickness="8" />
    </template>
  </q-input>
</div>
</template>
<script>

import { Phrase } from '../app/modele.mjs'

export default ({
  name: 'PhraseContact',
  data () {
    return {
      isPwd: false,
      phrase: '',
      encours: false
    }
  },
  methods: {
    r1 (val) { return (val.length > 19 && val.length < 33) || this.$t('NP16') },

    razphrase () { this.pc = '' },

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

  setup () {
  }
})
</script>

<style lang="sass" scoped>
@import '../css/input.sass'
</style>
