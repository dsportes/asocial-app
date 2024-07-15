<template>
<div>
  <div v-if="!orgext" class="q-mb-sm row items-center">
    <div class="column">
      <div class="titre-lg q-mr-md">{{$t('PSorg1')}}</div>
    </div>
    <q-input v-model="org" dense style="width:15rem"
      :hint="$t('PSorg2')" :placeholder="$t('PSorg3')"/>
  </div>

  <div v-if="declaration" class="titre-md q-mr-md">{{$t('PSctc1')}}</div>
  <div class="row items-center">
    <q-input class="col" dense v-model="phrase" :placeholder="$t('NPphl')" 
      counter :rules="[r1]"
      @keydown.enter.prevent="crypterphrase" :type="isPwd ? 'password' : 'text'"
      :hint="phrase && r1(phrase) ? $t('entree') : $t('NP16', [min])">
      <template v-slot:append>
        <span class="row q-gutter-xs">
          <q-btn :icon="isPwd ? 'visibility_off' : 'visibility'" 
            @click="isPwd = !isPwd" size="sm" padding="none" round/>
          <q-btn icon="cancel" size="sm" padding="none" round 
            :disable="phrase.length === 0" @click="phrase = ''"/>
          <q-spinner v-if="encours" color="primary" size="1.5rem" :thickness="8" />
        </span>
      </template>
    </q-input>
    <q-btn class="col-auto q-ml-xs" color="primary" dense padding="none" round
      icon="check" v-if="r1(phrase) === true" @click="crypterphrase"/>
  </div>

</div>
</template>
<script>

import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { Phrase } from '../app/modele.mjs'
import { afficherDiag } from '../app/util.mjs'

const min = 24

export default ({
  name: 'PhraseContact',
  props: { 
    initVal: String, 
    orgext: String, 
    declaration: Boolean 
  },
  data () {
    return {
      isPwd: false,
      encours: false
    }
  },
  watch: {
    initVal (ap) { this.phrase = '' }
  },
  methods: {
    r1 (val) { return val.length >= min || this.$t('NP16', [min]) },

    async crypterphrase () {
      if (this.r1(this.phrase) !== true) return
      if (!this.org) {
        await afficherDiag(this.$t('PSctc3'))
        return
      }
      this.encours = true
      // const org = this.session.org
      this.pc = new Phrase()
      setTimeout(async () => {
        await this.pc.init(this.phrase)
        this.encours = false
        this.pc.org = this.org
        this.$emit('ok', this.pc)
      }, 1)
    }
  },

  setup (props) {
    const session = stores.session
    const config = stores.config
    const init = toRef(props, 'initVal')
    const phrase = ref(init.value || '')
    const orgext = toRef(props, 'orgext')
    const org = ref('')
    if (orgext.value) {
      org.value = orgext.value
    } else if (config.search) org.value = config.search

    return {
      phrase,
      org,
      session, min
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/input.sass'
</style>
