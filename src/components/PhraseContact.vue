<template>
<div>
  <div v-if="!orgext" class="q-mb-sm row items-center">
    <div class="column">
      <div class="titre-lg q-mr-md">{{$t('PSorg1')}}</div>
    </div>
    <q-input v-model="org" dense style="width:15rem"
      :hint="$t('PSorg2')" :placeholder="$t('PSorg3')"/>
  </div>

  <div class="titre-md q-mr-md">{{$t('PSctc' + (declaration ? 1 : 2))}}</div>
  <div class="row items-center">
    <q-input class="col" dense v-model="phrase" :placeholder="$t('NPphl')" 
      counter :rules="[r1]" maxlength="32"
      @keydown.enter.prevent="crypterphrase" :type="isPwd ? 'password' : 'text'"
      :hint="!phrase || !r1(phrase) ? $t('NP16') : $t('NPpe')">
      <template v-slot:append>
        <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd"/>
        <q-btn icon="cancel" size="md" :disable="phrase.length === 0" @click="phrase = ''"/>
        <q-spinner v-if="encours" color="primary" size="1.5rem" :thickness="8" />
      </template>
    </q-input>
    <q-btn class="col-auto q-ml-sm btn2" color="primary" 
      :label="$t('ok')" icon="check" @click="crypterphrase"/>
  </div>

</div>
</template>
<script>

import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { Phrase } from '../app/modele.mjs'
import { afficherDiag } from '../app/util.mjs'

export default ({
  name: 'PhraseContact',
  props: { initVal: String, orgext: String, declaration: Boolean },
  data () {
    return {
      isPwd: false,
      encours: false
    }
  },
  methods: {
    r1 (val) { 
      const x = (val.length > 19 && val.length < 33) || this.$t('NP16') 
      return x
    },

    async crypterphrase () {
      if (!this.r1(this.phrase)) return
      if (!this.org) {
        await afficherDiag(this.$t('PSctc3'))
        return
      }
      this.encours = true
      const org = this.session.org
      this.pc = new Phrase()
      setTimeout(async () => {
        await this.pc.init(this.phrase, this.org)
        this.encours = false
        this.$emit('ok', this.pc)
      }, 1)
    }
  },

  setup (props) {
    const session = stores.session
    const init = toRef(props, 'initVal')
    const phrase = ref(init.value || '')
    const orgext = toRef(props, 'orgext')
    const org = ref('')
    if (orgext.value) org.value = orgext.value

    return {
      phrase,
      org,
      session
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/input.sass'
.btn2
  height: 1.5rem
</style>
