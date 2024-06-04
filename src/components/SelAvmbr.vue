<template>
<span class="row items-center">
  <span class="text-italic text-bold q-mr-sm">{{$t('SAVtit')}}</span>
  <q-select v-model="cav" borderless dense options-dense standard filled
    :options="options" style="min-width:120px;max-width:240px"
    popup-content-class="bg-secondary titre-lg text-bold q-pa-sm bord9"
    color="white"/>
</span>
</template>

<script>

import { toRef, ref } from 'vue'
import stores from '../stores/stores.mjs'

export default {
  name: 'SelAvmbr',

  props: { 
    acnote: Number, // 1: accès en lecture, 2: accès en écriture
    acmbr: Boolean 
  },

  emits: ['update:modelValue'],

  computed: {
    options () {
      return this.setOptions()
    }
  },

  watch: {
    cav (ap) { this.$emit('update:modelValue', ap.value) }
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup (props, context) {
    const cav = ref()
    const session = stores.session
    const gSt = stores.groupe
    const acnote = toRef(props, 'acnote')
    const acmbr = toRef(props, 'acmbr')

    function setOptions () {
      const g = gSt.egrC.groupe
      const l = []
      session.compte.mav.forEach(ida => { 
        const im = g.mmb.get(ida)
        if (im) {
          if ((acmbr.value && g.accesMembre(im)) 
            || (acnote.value && ((g.accesNote2(im) >= acnote.value))))
              l.push({ label: session.getCV(ida).nom, value: ida })
        }
      })
      const cid = session.avatarId
      l.sort((a,b) => { return a.value === cid ? - 1 : (b.value === cid ? 1 : 
        (a.label < b.label ? -1 : (b.label > a.label ? 1 : 0)))})
      return l
    }

    const l = setOptions()
    cav.value = l.length > 0 ? l[0] : { label: '?', value: 0}
    context.emit('update:modelValue', cav.value.value)

    return {
      session, cav, setOptions
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-item
  min-height: 20px !important
  padding: 3px 1rem !important
.bord9
  border: 2px solid $grey-5
  border-radius: 5px
</style>
