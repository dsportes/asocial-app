<template>
<span class="row items-center">
  <span class="text-italic text-bold q-mr-sm">{{$t('SGRtit')}}</span>
  <q-select v-model="cav" borderless dense options-dense standard filled
    :options="options" style="min-width:120px;max-width:240px"
    popup-content-class="bg-accent text-white titre-lg text-bold q-pa-sm"/>
</span>
</template>

<script>

import { toRef, ref } from 'vue'
import stores from '../stores/stores.mjs'

export default {
  name: 'SelGrid',

  props: { 
    aucun: Boolean
  },

  computed: {
    options () {
      const l = []
      this.session.compte.mpg.forEach((v, id) => { 
        l.push({ label: this.session.getCV(id).nom, value: id }) 
      })
      const cid = this.session.groupeId
      l.sort((a,b) => { return a.value === cid ? - 1 : (b.value === cid ? 1 : 
        (a.label < b.label ? -1 : (b.label > a.label ? 1 : 0)))})
      if (this.aucun) l.unshift({ label: '-', value: 0 })
      return l
    }
  },

  watch: {
    cav (ap) { this.session.setGroupeId(ap.value) }
  },

  methods: {
  },

  data () {
    return {
    }
  },

  setup (props) {
    const aucun = toRef(props, 'aucun')
    const cav = ref()
    const session = stores.session

    if (session.groupeId) {
      cav.value = { 
        label: session.getCV(session.groupeId).nom, 
        value: session.groupeId 
      }
    } else if (aucun.value) {
      cav.value = { label: '-', value: '' }
    } else {
      const [gid] = session.compte.mpg.keys()
      if (gid) {
        session.setGroupeId(gid)
        cav.value = { 
          label: session.getCV(session.groupeId).nom, 
          value: session.groupeId 
        }
      } else cav.value = { label: '-', value: '' }
    }

    return {
      session, cav
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
