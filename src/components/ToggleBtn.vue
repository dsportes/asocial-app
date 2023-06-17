<template>
  <q-toggle dense size="md"
      v-model="val"
      :disable="lecture"
      :color="color"
      :label="val === true ? lon : loff"
    />
</template>

<script>
import { watch, ref, toRef } from 'vue'

export default ({
  name: 'ToggleBtn',

  emits: ['update:modelValue', 'change'],

  props: { args: Object, label: String, color: String, colorOff: String, labelOff: String, lecture: Boolean, src: Boolean },

  components: { },

  computed: {
    loff () { return this.labelOff || this.label || '' },
    lon () { return this.label || '' }
  },

  watch: {
    src (ap, av) {
      this.val = ap
    },
    val (ap, av) {
      if (!this.lecture) { this.$emit('change', { val: ap, args: this.args }) }
    }
  },

  data () {
    return {
    }
  },

  methods: {
  },

  setup (props, context) {
    const src = toRef(props, 'src')
    const val = ref(src.value)
    return {
      val
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
