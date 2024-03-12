<template>
  <q-card-section class="q-pt-none fs-md">
    <div class="titre-lg">{{$t('NAph0')}}</div>
    <div v-if="verif">
      <div class="text-italic titre-sm">{{$t('NAw1')}}</div>
      <div>
        <span class="q-px-sm text-negative bg-yellow text-bold">{{interdits}}</span>
        <span class="q-ml-sm">{{$t('NAw2')}}</span>
      </div>
    </div>
    <q-input dense counter v-model="nom"
      :label="groupe ? $t('NAng') : $t('NAna')"
      :rules="[r1,r2]"
      @keydown.enter.prevent="ok" type="text" 
      :hint="nom && r1(nom) && r2(nom) ? $t('NPpe') : $t('NAe1', [min, max])">
      <template v-slot:append>
        <span :class="nom.length === 0 ? 'disabled' : ''">
          <q-icon name="cancel" class="cursor-pointer"  @click="nom=''"/>
        </span>
      </template>
    </q-input>
    <div v-if="labelValider" class="row justify-between items-center no-wrap">
      <q-btn flat dense color="primary" icon="close" :label="$t('renoncer')" @click="ko" />
      <q-btn color="primary" :label="labelValider" 
        size="md" :icon="iconValider" padding="xs xs"
        :disable="r1(nom) !== true || r2(nom) !== true" @click="ok" />
    </div>
  </q-card-section>
</template>

<script>
import { toRef, ref } from 'vue'
import { interdits, regInt } from '../app/api.mjs'

const min = 6
const max = 24

export default {
  name: 'NomAvatar',
  props: {
    iconValider: String,
    groupe: Boolean,
    labelValider: String,
    initVal: String
  },
  data () {
    return {
      interdits: interdits
    }
  },
  methods: {
    r2 (val) { return val.length < min || val.length > max ? this.$t('NAe1', [min, max]) : true },
    r1 (val) { return regInt.test(val) ? this.$t('NAe2') : true },
    ok () {
      this.$emit('ok-nom', this.nom)
    },
    ko () {
      this.nom = ''
      this.$emit('ok-nom', null)
    }
  },

  setup (props) {
    const vi = toRef(props, 'initVal')
    const nom = ref(vi.value || '')
    return {
      nom, min, max
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/input.sass'
</style>
