<template>
  <q-card-section class="q-pt-none fs-md">
    <div class="titre-lg">{{$t('NAph0')}}</div>
    <div>
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
      <btn-cond flat icon="close" :label="$t('renoncer')" @ok="ko" />
      <btn-cond :label="labelValider" :icon="iconValider"
        :disable="r1(nom) !== true || r2(nom) !== true" @ok="ok" />
    </div>
  </q-card-section>
</template>

<script>
import { toRef, ref } from 'vue'
import { interdits, regInt } from '../app/api.mjs'
import BtnCond from '../components/BtnCond.vue'

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
  components: { BtnCond },
  emits: ['update:modelValue', 'ok-nom'],
  data () {
    return {
      interdits: interdits
    }
  },
  watch: {
    nom (ap) {
      const ok = this.r2(ap) === true && this.r1(ap) === true
      this.$emit('update:modelValue', ok ? ap : '')
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
